import test from 'node:test'
import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  createPromptOptimizer,
  parseOptimizedOutput,
  PROMPT_OPTIMIZER_FILE,
  readOptimizerSystemPrompt,
  resolveOptimizeRoute,
} from '../optimizer.js'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const read = (file) => readFileSync(join(root, file), 'utf8')

function mockStream(text) {
  return (async function* () {
    yield { type: 'text-delta', index: 0, text }
    yield { type: 'finish', reason: { kind: 'stop' } }
  })()
}

function mockContext(options = {}) {
  const calls = []
  const ctx = {
    get(name) {
      if (name === 'agents') {
        return {
          get(sessionId) {
            if (options.agentSelection === null) return undefined
            const selection = options.agentSelection || { provider: 'agent-provider', model: 'agent-model', reasoningEffort: 'max' }
            return { model: { current: () => ({ ...selection }) } }
          },
        }
      }
      if (name === 'agentDefaultModel') {
        return {
          currentSelection() {
            return options.defaultSelection || { provider: 'default-provider', model: 'default-model' }
          },
        }
      }
      if (name === 'llm') {
        return {
          async prepareCall(route) {
            calls.push({ kind: 'prepareCall', route })
            return {
              config: { ...route },
              stream(input) {
                calls.push({ kind: 'stream', input })
                return options.stream || mockStream('<optimized_prompt>\n重写后的提示词\n</optimized_prompt>\n<notes>\n- 改动要点：结构\n</notes>')
              },
            }
          },
        }
      }
      if (name === 'connection') return options.connection
      return undefined
    },
  }
  return { ctx, calls }
}

function fakeResponse() {
  return {
    status: 0,
    headers: {},
    body: '',
    writableEnded: false,
    writeHead(status, headers) {
      this.status = status
      this.headers = headers || {}
    },
    end(payload) {
      if (payload !== undefined) this.body += Buffer.isBuffer(payload) ? payload.toString('utf8') : String(payload)
      this.writableEnded = true
    },
  }
}

function fakeRequest(body, method = 'POST') {
  const req = Readable.from(body === undefined ? [] : [Buffer.from(JSON.stringify(body))])
  req.method = method
  req.headers = {}
  return req
}

test('the optimizer system prompt is shipped verbatim and editable', () => {
  const file = join(root, PROMPT_OPTIMIZER_FILE)
  const prompt = readFileSync(file, 'utf8')
  assert.equal(prompt, readOptimizerSystemPrompt())
  assert.match(prompt, /^# 角色/)
  assert.match(prompt, /# 核心原则/)
  assert.match(prompt, /2–4 条/)
  assert.match(prompt, /<optimized_prompt>/)
  assert.match(prompt, /<notes>/)
  assert.match(prompt, /不对用户做评价或说教。$/)
})

test('parseOptimizedOutput returns the optimized block and notes', () => {
  const parsed = parseOptimizedOutput('前言\n<optimized_prompt>\n新的提示词\n</optimized_prompt>\n<notes>\n- 改动要点：A\n</notes>')
  assert.equal(parsed.prompt, '新的提示词')
  assert.equal(parsed.notes, '- 改动要点：A')
  assert.deepEqual(parseOptimizedOutput('just text'), { prompt: 'just text', notes: '' })
  assert.deepEqual(parseOptimizedOutput('hello <notes>内部说明</notes>'), { prompt: 'hello', notes: '内部说明' })
})

test('resolveOptimizeRoute prefers the live agent selection', () => {
  const { ctx } = mockContext()
  assert.deepEqual(resolveOptimizeRoute(ctx, { sessionId: 's1', provider: 'client', model: 'client-model' }), {
    provider: 'agent-provider', model: 'agent-model', reasoningEffort: 'max',
  })
})

test('resolveOptimizeRoute falls back to the client snapshot then the deployment default', () => {
  const withClient = mockContext({ agentSelection: null }).ctx
  assert.deepEqual(resolveOptimizeRoute(withClient, { sessionId: 's1', provider: 'client-provider', model: 'client-model' }), {
    provider: 'client-provider', model: 'client-model',
  })
  const defaults = mockContext({ agentSelection: null }).ctx
  assert.deepEqual(resolveOptimizeRoute(defaults, {}), { provider: 'default-provider', model: 'default-model' })
})

test('createPromptOptimizer streams one request and never writes the session', async () => {
  const { ctx, calls } = mockContext()
  const service = createPromptOptimizer(ctx)
  const result = await service.optimize({ sessionId: 's1', text: '做一个登录页' })
  assert.equal(result.optimized, '重写后的提示词')
  assert.equal(result.notes, '- 改动要点：结构')
  assert.deepEqual(result.model, { provider: 'agent-provider', model: 'agent-model' })
  const prepare = calls.find((call) => call.kind === 'prepareCall')
  assert.deepEqual(prepare.route, { provider: 'agent-provider', model: 'agent-model', reasoningEffort: 'max' })
  const stream = calls.find((call) => call.kind === 'stream')
  assert.equal(stream.input.system, readOptimizerSystemPrompt())
  assert.equal(stream.input.messages[0].content[0].text, '做一个登录页')
  assert.equal(stream.input.purpose, 'prompt-optimize')
})

test('createPromptOptimizer rejects empty prompts and model failures', async () => {
  const { ctx } = mockContext()
  const service = createPromptOptimizer(ctx)
  await assert.rejects(() => service.optimize({ sessionId: 's1', text: '   ' }), (error) => error.code === 'EMPTY_INPUT')

  const failing = mockContext({
    stream: (async function* () {
      yield { type: 'finish', reason: { kind: 'error', failure: { code: 'RATE_LIMIT', message: 'Too many requests' } } }
    })(),
  })
  await assert.rejects(
    () => createPromptOptimizer(failing.ctx).optimize({ sessionId: 's1', text: 'hello' }),
    (error) => error.code === 'MODEL_ERROR' && /Too many requests/.test(error.message),
  )
})

test('the POST route returns JSON for a valid request and enforces the trust fence', async () => {
  const { ctx } = mockContext()
  const service = createPromptOptimizer(ctx)
  const res = fakeResponse()
  await service.handle(fakeRequest({ sessionId: 's1', text: '写一个网页' }), res)
  assert.equal(res.status, 200)
  const body = JSON.parse(res.body)
  assert.equal(body.ok, true)
  assert.equal(body.optimized, '重写后的提示词')

  const denied = fakeResponse()
  const deniedCtx = mockContext({ connection: { requestRejection: () => 403 } }).ctx
  await createPromptOptimizer(deniedCtx).handle(fakeRequest({ text: 'x' }), denied)
  assert.equal(denied.status, 403)

  const wrongMethod = fakeResponse()
  await service.handle(fakeRequest(undefined, 'GET'), wrongMethod)
  assert.equal(wrongMethod.status, 405)
})
