/**
 * Prompt optimizer — Host half.
 *
 * One POST route streams the current session model through the editable system
 * prompt in `prompts/prompt-optimizer.system.md` and returns the text inside
 * its `<optimized_prompt>` block. The response is handed to the composer for
 * an in-place draft replacement; nothing is written to the session log.
 */

import { readFileSync } from 'node:fs'

export const PROMPT_OPTIMIZER_FILE = 'prompts/prompt-optimizer.system.md'
export const OPTIMIZE_ROUTE = '/api/prompt-optimize'
const MAX_OPTIMIZE_INPUT_CHARS = 60_000
const MAX_OPTIMIZE_BODY_BYTES = 2_000_000
const OPTIMIZE_TIMEOUT_MS = 180_000

/** Build one route error with a stable machine code and HTTP status. */
function optimizerError(code, message, statusCode) {
  const error = new Error(message)
  error.code = code
  if (statusCode !== undefined) error.statusCode = statusCode
  return error
}

/** Read the editable system prompt. Read per request so a saved edit applies immediately. */
export function readOptimizerSystemPrompt() {
  return readFileSync(new URL(PROMPT_OPTIMIZER_FILE, import.meta.url), 'utf8')
}

/** Strip a surrounding Markdown code fence some models add around an XML block. */
function stripOuterCodeFence(value) {
  const trimmed = String(value || '').trim()
  const fence = /^```[a-zA-Z0-9_-]*\s*\n([\s\S]*?)\n?```$/.exec(trimmed)
  return fence ? fence[1] : trimmed
}

/**
 * Extract the replacement prompt and the optional notes from one model output.
 * The tagged format is authoritative; an untagged answer still yields a usable
 * prompt by dropping the notes block so the button never no-ops on a stray
 * Markdown wrapper.
 */
export function parseOptimizedOutput(value) {
  const text = String(value || '')
  const promptMatch = /<optimized_prompt>([\s\S]*?)<\/optimized_prompt>/i.exec(text)
  const notesMatch = /<notes>([\s\S]*?)<\/notes>/i.exec(text)
  let prompt = promptMatch ? promptMatch[1] : ''
  if (prompt === '') {
    prompt = text.replace(/<notes>[\s\S]*?<\/notes>/i, '').replace(/<\/?optimized_prompt>/gi, '')
  }
  const notes = notesMatch ? notesMatch[1].trim() : ''
  return {
    prompt: stripOuterCodeFence(prompt).trim(),
    notes: notes.length > 8_000 ? notes.slice(0, 8_000) : notes,
  }
}

/** Read one model selection candidate without trusting its shape. */
function optimizeSelection(value) {
  if (!value || typeof value !== 'object') return null
  if (typeof value.provider !== 'string' || value.provider === '') return null
  if (typeof value.model !== 'string' || value.model === '') return null
  return {
    provider: value.provider,
    model: value.model,
    ...(typeof value.reasoningEffort === 'string' && value.reasoningEffort !== ''
      ? { reasoningEffort: value.reasoningEffort }
      : {}),
  }
}

/**
 * Resolve the model the composer currently shows. The live Agent's model is
 * authoritative; a client-supplied route covers a session whose Agent is not
 * resident, and the deployment default covers a blank session without a
 * projection yet. Throwing `NO_MODEL` is better than silently calling another
 * route than the one on screen.
 */
export function resolveOptimizeRoute(ctx, request) {
  const sessionId = request && typeof request.sessionId === 'string' ? request.sessionId : ''
  if (sessionId !== '') {
    try {
      const agents = ctx.get('agents')
      if (agents && typeof agents.get === 'function') {
        const agent = agents.get(sessionId)
        const selection = agent && agent.model && typeof agent.model.current === 'function'
          ? optimizeSelection(agent.model.current())
          : null
        if (selection !== null) return selection
      }
    } catch {
      /* fall through to the client snapshot and the deployment default */
    }
  }
  const supplied = optimizeSelection(request)
  if (supplied !== null) return supplied
  try {
    const defaults = ctx.get('agentDefaultModel')
    if (defaults && typeof defaults.currentSelection === 'function') {
      const selection = optimizeSelection(defaults.currentSelection())
      if (selection !== null) return selection
    }
  } catch {
    /* the route is genuinely unavailable */
  }
  throw optimizerError('NO_MODEL', 'No model is selected for this session.', 409)
}

/** Concatenate text deltas and require one normal terminal stop. */
async function collectOptimizerText(stream) {
  let text = ''
  let finish = null
  for await (const chunk of stream) {
    if (!chunk || typeof chunk !== 'object') continue
    if (chunk.type === 'text-delta' && typeof chunk.text === 'string') text += chunk.text
    else if (chunk.type === 'finish') finish = chunk.reason
  }
  if (finish === null || typeof finish !== 'object') {
    throw optimizerError('MODEL_ERROR', 'The model stream ended without a finish reason.', 502)
  }
  if (finish.kind === 'error' || finish.kind === 'aborted') {
    const failure = finish.failure && typeof finish.failure === 'object' ? finish.failure : {}
    throw optimizerError('MODEL_ERROR', typeof failure.message === 'string' ? failure.message : 'The model request failed.', 502)
  }
  if (finish.kind !== 'stop') {
    throw optimizerError('MODEL_ERROR', `The model finished with "${finish.kind}" instead of a complete answer.`, 502)
  }
  return text
}

/** Read one JSON body with a hard byte ceiling; the stream is drained to keep the socket reusable. */
function readOptimizeJsonBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0
    let tooLarge = false
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_OPTIMIZE_BODY_BYTES) {
        tooLarge = true
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      if (tooLarge) {
        reject(optimizerError('INPUT_TOO_LONG', 'The request body is too large.', 413))
        return
      }
      if (size === 0) {
        resolve(null)
        return
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch {
        reject(optimizerError('INVALID_JSON', 'The request body is not valid JSON.', 400))
      }
    })
    req.on('error', (error) => reject(error))
  })
}

/** Write one JSON response through the node:http handler surface. */
function writeJson(res, status, body) {
  const payload = Buffer.from(JSON.stringify(body), 'utf8')
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': payload.length,
  })
  res.end(payload)
}

/** Write one plain-text refusal through the node:http handler surface. */
function writeText(res, status, text) {
  const payload = Buffer.from(text, 'utf8')
  res.writeHead(status, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'content-length': payload.length })
  res.end(payload)
}

/**
 * One activation's prompt-optimizer route. The service is stateless: every
 * click reads the current system prompt and model route, streams once with a
 * hard deadline, and never touches the session log.
 */
export function createPromptOptimizer(ctx) {
  const active = new Set()

  async function optimize(request, externalSignal) {
    const body = request && typeof request === 'object' ? request : {}
    const text = typeof body.text === 'string' ? body.text : ''
    if (text.trim() === '') throw optimizerError('EMPTY_INPUT', 'The prompt is empty.', 400)
    if (text.length > MAX_OPTIMIZE_INPUT_CHARS) {
      throw optimizerError('INPUT_TOO_LONG', `The prompt exceeds ${MAX_OPTIMIZE_INPUT_CHARS} characters.`, 413)
    }
    const llm = ctx.get('llm')
    if (!llm || typeof llm.prepareCall !== 'function') {
      throw optimizerError('LLM_UNAVAILABLE', 'The model service is unavailable in this profile.', 503)
    }
    const route = resolveOptimizeRoute(ctx, body)
    const controller = new AbortController()
    const cancel = () => {
      if (!controller.signal.aborted) controller.abort()
    }
    if (externalSignal) {
      if (externalSignal.aborted) cancel()
      else externalSignal.addEventListener('abort', cancel, { once: true })
    }
    const timer = setTimeout(() => {
      if (!controller.signal.aborted) {
        controller.abort(optimizerError('TIMEOUT', 'Prompt optimization timed out.', 504))
      }
    }, OPTIMIZE_TIMEOUT_MS)
    active.add(controller)
    try {
      const prepared = await llm.prepareCall(route, controller.signal)
      const system = readOptimizerSystemPrompt()
      const messages = [{ role: 'user', content: [{ type: 'text', text }] }]
      const options = { ...prepared.config, system, messages, purpose: 'prompt-optimize', signal: controller.signal }
      const raw = await collectOptimizerText(prepared.stream(options))
      const parsed = parseOptimizedOutput(raw)
      if (parsed.prompt === '') {
        throw optimizerError('INVALID_OUTPUT', 'The model returned no optimized prompt.', 502)
      }
      return {
        optimized: parsed.prompt,
        notes: parsed.notes,
        model: { provider: prepared.config.provider, model: prepared.config.model },
      }
    } catch (error) {
      if (controller.signal.aborted) {
        const reason = controller.signal.reason
        if (reason && typeof reason === 'object' && reason.code === 'TIMEOUT') {
          throw optimizerError('TIMEOUT', 'Prompt optimization timed out.', 504)
        }
        if (reason && typeof reason === 'object' && typeof reason.code === 'string') throw reason
        throw optimizerError('CANCELLED', 'Prompt optimization was cancelled.', 408)
      }
      if (error && typeof error === 'object' && typeof error.code === 'string') throw error
      throw optimizerError('MODEL_ERROR', error instanceof Error ? error.message : String(error), 502)
    } finally {
      clearTimeout(timer)
      if (externalSignal) externalSignal.removeEventListener('abort', cancel)
      active.delete(controller)
    }
  }

  async function handle(req, res) {
    const connection = ctx.get('connection')
    if (connection && typeof connection.requestRejection === 'function') {
      let rejection
      try {
        rejection = connection.requestRejection({ headers: req.headers })
      } catch {
        return writeText(res, 403, 'Forbidden')
      }
      if (rejection !== undefined) {
        return writeText(res, rejection === 403 ? 403 : 401, rejection === 403 ? 'Forbidden' : 'Unauthorized')
      }
    }
    if (req.method !== 'POST') {
      res.writeHead(405, { allow: 'POST', 'cache-control': 'no-store' })
      res.end()
      return
    }
    try {
      const body = await readOptimizeJsonBody(req)
      if (body === null || typeof body !== 'object' || Array.isArray(body)) {
        throw optimizerError('INVALID_REQUEST', 'The request body must be a JSON object.', 400)
      }
      const result = await optimize(body)
      writeJson(res, 200, { ok: true, ...result })
    } catch (error) {
      const status = error && Number.isInteger(error.statusCode) ? error.statusCode : 500
      const code = error && typeof error.code === 'string' ? error.code : 'INTERNAL'
      writeJson(res, status, { ok: false, code, error: error instanceof Error ? error.message : String(error) })
    }
  }

  function dispose() {
    for (const controller of active) controller.abort()
    active.clear()
  }

  return { handle, optimize, dispose }
}
