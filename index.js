/**
 * Prompt history — Host half.
 *
 * Builds one read-only index of the prompts the user typed across every
 * conversation. The index is derived from the durable session log: each
 * `user/message` event whose source is the user (not a time-context,
 * runtime-context, approval, goal, or subagent-authored message) becomes one
 * entry. Session titles, working directories, and workspace titles supply the
 * project/session labels the browser half renders.
 *
 * Nothing leaves the machine: the only Host surface is one local JSON route
 * consumed by this bundle's own Client half.
 */

export const name = 'prompt-history'

/** The route needs the Web server and Connection's trust fence; session services are read optionally so the plugin stays inert rather than throwing in profiles without them. */
export const inject = ['webServer', 'connection']

const ROUTE = '/api/prompt-history'
const CACHE_TTL_MS = 3_000
const MAX_SESSIONS = 2_000
const MAX_PROMPTS = 5_000
const MAX_PROMPTS_PER_SESSION = 1_000
const MAX_TEXT_LENGTH = 50_000
const MAX_TITLE_LENGTH = 160
/** Bound the newest prompts kept per session before building the global response. */
const MAX_SESSION_TEXT_CHARS = 300_000
/** Keep one response well below a multi-megabyte string; the newest prompts win the budget. */
const MAX_RESPONSE_TEXT_CHARS = 2_000_000

/** Messages a feature injects under a user source but did not type; the attachment marker has no prompt text of its own. */
const SYNTHETIC_USER_TEXTS = new Set([
  'Reference attachments for the goal objective.',
])

function finiteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function collapseWhitespace(text) {
  return String(text || '').replace(/\s+/g, ' ').trim()
}

function shortText(text, limit) {
  const chars = Array.from(collapseWhitespace(text))
  return chars.length > limit ? `${chars.slice(0, Math.max(0, limit - 1)).join('')}…` : chars.join('')
}

function basename(path) {
  if (typeof path !== 'string') return ''
  const parts = path.split(/[\\/]/).filter(Boolean)
  return parts.length > 0 ? parts[parts.length - 1] : path
}

function stripTrailingSlash(path) {
  return typeof path === 'string' ? path.replace(/[\\/]+$/, '') : ''
}

/** Keep the newest prompts of one session within the per-session memory budget. */
function limitSessionPrompts(prompts) {
  const kept = []
  let chars = 0
  for (let index = prompts.length - 1; index >= 0; index -= 1) {
    const prompt = prompts[index]
    if (kept.length >= MAX_PROMPTS_PER_SESSION) break
    if (kept.length > 0 && chars + prompt.text.length > MAX_SESSION_TEXT_CHARS) break
    kept.push(prompt)
    chars += prompt.text.length
  }
  return kept.reverse()
}

/**
 * Flatten one message's text blocks. Tool/file blocks are not prompt text; the
 * user's literal words (including pasted references) are.
 */
export function messageText(message) {
  const content = message && Array.isArray(message.content) ? message.content : []
  const parts = []
  for (const block of content) {
    if (!block || block.type !== 'text' || typeof block.text !== 'string') continue
    const text = block.text.replace(/\r\n/g, '\n').trim()
    if (text !== '') parts.push(text)
  }
  return parts.join('\n\n').trim()
}

/**
 * Extract indexed prompt records from a session log.
 *
 * The inherited prefix of a forked or seeded session is skipped: those events
 * were already indexed under the source session, and indexing them again would
 * duplicate the user's history.
 */
export function extractPrompts(events, inheritedEventCount = 0) {
  const inherited = finiteNumber(Number(inheritedEventCount)) ?? 0
  const prompts = []
  let title = ''

  for (const event of Array.isArray(events) ? events : []) {
    if (!event || typeof event.type !== 'string') continue
    const seq = finiteNumber(event.seq)
    if (seq !== null && seq < inherited) continue

    if (event.type === 'session/title') {
      const nextTitle = event.data && event.data.title
      if (typeof nextTitle === 'string' && nextTitle.trim() !== '') {
        const trimmed = nextTitle.trim()
        if (!/^Reference attachments for (the )?goal\b/i.test(trimmed)) title = trimmed
      }
      continue
    }

    if (event.type === 'command/run') {
      const data = event.data && typeof event.data === 'object' ? event.data : {}
      const source = data.source && typeof data.source === 'object' ? data.source : {}
      if (source.kind !== 'user' || data.name !== 'goal') continue
      const rawArgs = typeof data.args === 'string' ? data.args.trim() : ''
      if (rawArgs === '' || /^(pause|clear|resume|edit)$/i.test(rawArgs)) continue
      const args = rawArgs.replace(/^edit\s+/i, '').trim()
      if (args === '') continue
      const time = finiteNumber(event.time)
      if (time === null) continue
      prompts.push({ seq: seq ?? 0, time, text: args.length > MAX_TEXT_LENGTH ? args.slice(0, MAX_TEXT_LENGTH) : args, truncated: args.length > MAX_TEXT_LENGTH })
      continue
    }

    if (event.type !== 'user/message') continue

    const data = event.data && typeof event.data === 'object' ? event.data : {}
    const message = data.message && typeof data.message === 'object' ? data.message : data
    const source = message.source && typeof message.source === 'object' ? message.source : data.source
    if (!source || source.kind !== 'user') continue

    const text = messageText(message)
    if (text === '' || SYNTHETIC_USER_TEXTS.has(text)) continue

    const time = finiteNumber(event.time)
    if (time === null) continue

    prompts.push({
      seq: seq ?? 0,
      time,
      text: text.length > MAX_TEXT_LENGTH ? text.slice(0, MAX_TEXT_LENGTH) : text,
      truncated: text.length > MAX_TEXT_LENGTH,
    })
  }

  const fallbackTitle = prompts.length > 0 ? shortText(prompts[0].text, 60) : ''
  return {
    title: shortText(title || fallbackTitle, MAX_TITLE_LENGTH),
    prompts,
  }
}

async function mapLimit(items, limit, worker) {
  const results = new Array(items.length)
  let cursor = 0
  const runners = Array.from({ length: Math.min(Math.max(1, limit), items.length) }, async () => {
    for (;;) {
      const index = cursor
      cursor += 1
      if (index >= items.length) return
      results[index] = await worker(items[index], index)
    }
  })
  await Promise.all(runners)
  return results
}

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error)
}

/**
 * One activation's index cache and route handler.
 *
 * The session log stays the source of truth; this cache only avoids re-reading
 * a session whose persistence revision did not change. A failed read falls back
 * to the last good row for that session instead of dropping its history.
 */
export function createPromptIndex(ctx) {
  const sessionCache = new Map()
  let lastPayload = null
  let lastScanAt = 0
  let inflight = null
  let persistenceIdentity
  const lifetime = new AbortController()

  async function readRevisions(persistence, signal) {
    const revisions = new Map()
    if (!persistence || typeof persistence.list !== 'function') return revisions
    try {
      const rows = await persistence.list({ signal })
      for (const snapshot of Array.isArray(rows) ? rows : []) {
        const header = snapshot && snapshot.header
        if (!header || typeof header.id !== 'string') continue
        revisions.set(header.id, String(snapshot.revision))
      }
    } catch {
      /* revision caching is an optimization only */
    }
    return revisions
  }

  function readWorkspaces() {
    const bySession = new Map()
    const byPath = new Map()
    const registry = ctx.get('workspaceRegistry')
    if (!registry || typeof registry.list !== 'function') return { bySession, byPath }
    try {
      const workspaces = registry.list()
      for (const workspace of Array.isArray(workspaces) ? workspaces : []) {
        if (!workspace || typeof workspace !== 'object') continue
        if (typeof workspace.path === 'string' && typeof workspace.title === 'string') {
          byPath.set(stripTrailingSlash(workspace.path), workspace.title)
        }
        if (Array.isArray(workspace.sessionIds)) {
          for (const sessionId of workspace.sessionIds) {
            if (typeof sessionId === 'string') bySession.set(sessionId, workspace.title)
          }
        }
      }
    } catch {
      /* workspace labels are optional */
    }
    return { bySession, byPath }
  }

  function abortError() {
    const error = new Error('Prompt index scan aborted.')
    error.name = 'AbortError'
    return error
  }

  async function releaseObservation(observation) {
    try {
      if (observation && typeof observation[Symbol.asyncDispose] === 'function') {
        await observation[Symbol.asyncDispose]()
      } else if (observation && typeof observation[Symbol.dispose] === 'function') {
        observation[Symbol.dispose]()
      }
    } catch {
      /* observation cleanup is best-effort */
    }
  }

  /**
   * Observe one session without the per-call persistence listing preflight that
   * readSession performs; fall back to readSession when observeSession is absent.
   */
  async function readSessionSnapshot(query, sessionId, signal) {
    if (typeof query.observeSession === 'function') {
      const observation = await query.observeSession(sessionId, { projectionMode: 'none', signal })
      try {
        return {
          header: observation.header,
          events: observation.events,
          inheritedEventCount: observation.inheritedEventCount,
        }
      } finally {
        await releaseObservation(observation)
      }
    }
    if (signal && signal.aborted) throw abortError()
    const snapshot = await query.readSession(sessionId)
    if (signal && signal.aborted) throw abortError()
    return {
      header: snapshot.session,
      events: snapshot.events,
      inheritedEventCount: snapshot.inheritedEventCount,
    }
  }

  async function loadSession(query, record, signal) {
    const header = record.header
    const snapshot = await readSessionSnapshot(query, header.id, signal)
    const extracted = extractPrompts(snapshot.events, snapshot.inheritedEventCount)
    return {
      sessionId: header.id,
      sessionTitle: extracted.title,
      projectPath: typeof header.cwd === 'string' ? header.cwd : '',
      prompts: limitSessionPrompts(extracted.prompts),
    }
  }

  async function scan() {
    const query = ctx.get('sessionQuery')
    const canRead = query && typeof query.listSessions === 'function'
      && (typeof query.observeSession === 'function' || typeof query.readSession === 'function')
    if (!canRead) {
      const error = new Error('Session history is unavailable in this profile.')
      error.statusCode = 503
      throw error
    }
    if (lifetime.signal.aborted) throw abortError()

    const records = await query.listSessions(lifetime.signal)
    const allRecords = Array.isArray(records) ? records : []
    const rootCandidates = allRecords.filter((record) => {
      const header = record && record.header
      if (!header || typeof header.id !== 'string') return false
      if (header.origin === 'subagent') return false
      if (typeof header.delegationDepth === 'number' && header.delegationDepth > 0) return false
      return true
    })
    const sessionsTruncated = rootCandidates.length > MAX_SESSIONS
    const roots = rootCandidates.slice(0, MAX_SESSIONS)

    const persistence = ctx.get('sessionPersistence')
    const identity = persistence && typeof persistence.identity === 'symbol' ? persistence.identity : null
    if (persistenceIdentity !== identity) {
      sessionCache.clear()
      persistenceIdentity = identity
    }

    const [revisions, workspaces] = await Promise.all([
      readRevisions(persistence, lifetime.signal),
      Promise.resolve(readWorkspaces()),
    ])

    const activeIds = new Set(roots.map((record) => record.header.id))
    for (const id of sessionCache.keys()) {
      if (!activeIds.has(id)) sessionCache.delete(id)
    }

    let failed = 0
    const loaded = await mapLimit(roots, 6, async (record) => {
      if (lifetime.signal.aborted) throw abortError()
      const id = record.header.id
      const revision = revisions.get(id) ?? null
      const cached = sessionCache.get(id)
      if (cached && revision !== null && cached.revision === revision) {
        return { record, value: cached.value }
      }
      try {
        const value = await loadSession(query, record, lifetime.signal)
        sessionCache.set(id, { revision, value })
        return { record, value }
      } catch (error) {
        if (error && error.name === 'AbortError') throw error
        failed += 1
        if (cached) return { record, value: cached.value }
        return { record, value: null }
      }
    })
    if (lifetime.signal.aborted) throw abortError()

    if (loaded.length > 0 && loaded.every(({ value }) => value === null)) {
      const error = new Error('Every session read failed; the prompt index could not be built.')
      error.statusCode = 503
      throw error
    }

    const entries = []
    let sessionsWithPrompts = 0
    for (const { record, value } of loaded) {
      if (!value || value.prompts.length === 0) continue
      sessionsWithPrompts += 1
      const projectPath = value.projectPath
      const project = workspaces.bySession.get(record.header.id)
        || workspaces.byPath.get(stripTrailingSlash(projectPath))
        || basename(projectPath)
        || ''
      for (const prompt of value.prompts) {
        entries.push({
          id: `${value.sessionId}:${prompt.seq}`,
          sessionId: value.sessionId,
          sessionTitle: value.sessionTitle,
          project,
          projectPath,
          time: prompt.time,
          text: prompt.text,
          truncated: prompt.truncated === true,
        })
      }
    }

    entries.sort((left, right) => right.time - left.time)
    const limited = []
    let usedChars = 0
    let truncated = entries.length > MAX_PROMPTS || sessionsTruncated
    for (const entry of entries) {
      if (limited.length >= MAX_PROMPTS) {
        truncated = true
        break
      }
      if (limited.length > 0 && usedChars + entry.text.length > MAX_RESPONSE_TEXT_CHARS) {
        truncated = true
        break
      }
      limited.push(entry)
      usedChars += entry.text.length
    }
    const projects = new Set(limited.map((entry) => entry.project))

    return {
      ok: true,
      generatedAt: Date.now(),
      total: limited.length,
      truncated,
      sessionsTruncated,
      sessionsScanned: roots.length,
      sessionsWithPrompts,
      failedSessions: failed,
      projectCount: projects.size,
      entries: limited,
    }
  }

  async function getPayload(force) {
    const now = Date.now()
    if (!force && lastPayload !== null && now - lastScanAt < CACHE_TTL_MS) return lastPayload
    if (inflight !== null) return inflight
    inflight = scan()
      .then((payload) => {
        lastPayload = payload
        lastScanAt = Date.now()
        return payload
      })
      .finally(() => {
        inflight = null
      })
    return inflight
  }

  async function handle(request) {
    const connection = ctx.get('connection')
    if (connection && typeof connection.requestRejection === 'function') {
      let rejection
      try {
        rejection = connection.requestRejection({ headers: request.headers })
      } catch {
        return new Response('Forbidden', { status: 403, headers: { 'cache-control': 'no-store' } })
      }
      if (rejection !== undefined) {
        return new Response(rejection === 403 ? 'Forbidden' : 'Unauthorized', {
          status: rejection,
          headers: { 'cache-control': 'no-store' },
        })
      }
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405, headers: { allow: 'GET, HEAD' } })
    }
    if (request.method === 'HEAD') {
      return new Response(null, {
        status: 200,
        headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
      })
    }
    let url
    try {
      url = new URL(request.url)
    } catch {
      return jsonResponse(400, { ok: false, error: 'Invalid request URL.' })
    }
    try {
      const payload = await getPayload(url.searchParams.get('refresh') === '1')
      return jsonResponse(200, payload)
    } catch (error) {
      const status = error && Number.isInteger(error.statusCode) ? error.statusCode : 500
      return jsonResponse(status, { ok: false, error: errorMessage(error) })
    }
  }

  function dispose() {
    lifetime.abort()
    sessionCache.clear()
    lastPayload = null
    inflight = null
  }

  return { handle, getPayload, dispose }
}

export function apply(ctx) {
  ctx.effect(() => {
    const index = createPromptIndex(ctx)
    const disposeRoute = ctx.webServer.register({
      kind: 'exact',
      path: ROUTE,
      resource: (request) => index.handle(request),
    })
    return () => {
      disposeRoute()
      index.dispose()
    }
  }, 'prompt-history: local prompt index route')
}
