import test from 'node:test'
import assert from 'node:assert/strict'
import { createPromptIndex, extractPrompts, messageText } from '../index.js'

function userMessage(seq, time, text) {
  return {
    seq,
    time,
    type: 'user/message',
    data: { message: { source: { kind: 'user' }, content: [{ type: 'text', text }] } },
  }
}

function assistantMessage(seq, time, text) {
  return {
    seq,
    time,
    type: 'user/message',
    data: { message: { source: { kind: 'assistant' }, content: [{ type: 'text', text }] } },
  }
}

function makeSession(id, revision, prompts) {
  const events = prompts.map((prompt, index) => userMessage(index, 1_700_000_000_000 + index, prompt))
  return {
    id,
    revision,
    header: { id, cwd: `/workspace/${id}`, createdAt: 1_700_000_000_000, isSeeded: false },
    events,
  }
}

function makeContext(sessions) {
  const calls = { listSessions: 0, observeSession: 0, persistenceList: 0, disposed: 0 }
  const records = sessions.map((session) => ({
    header: session.header,
    live: false,
    persisted: true,
  }))
  const query = {
    async listSessions() { calls.listSessions += 1; return records },
    async observeSession(sessionId) {
      calls.observeSession += 1
      const session = sessions.find((candidate) => candidate.id === sessionId)
      return {
        header: session.header,
        events: session.events,
        inheritedEventCount: 0,
        async [Symbol.asyncDispose]() { calls.disposed += 1 },
      }
    },
  }
  const persistence = {
    identity: Symbol('test-persistence'),
    async list() {
      calls.persistenceList += 1
      return sessions.map((session) => ({ header: session.header, revision: session.revision }))
    },
  }
  const registry = {
    list() {
      return [{ path: '/workspace', title: 'Test workspace', sessionIds: sessions.map((session) => session.id) }]
    },
  }
  const ctx = {
    get(name) {
      if (name === 'sessionQuery') return query
      if (name === 'sessionPersistence') return persistence
      if (name === 'workspaceRegistry') return registry
      if (name === 'connection') return { requestRejection() { return undefined } }
      return undefined
    },
  }
  return { ctx, calls, sessions }
}

test('extractPrompts keeps real user prompts and /goal objectives only', () => {
  const events = [
    userMessage(0, 1000, '第一段提示词'),
    assistantMessage(1, 1001, '回答不是提示词'),
    userMessage(2, 1002, '   '),
    { seq: 3, time: 1003, type: 'command/run', data: { name: 'goal', args: '做一个登录页', source: { kind: 'user' } } },
    { seq: 4, time: 1004, type: 'command/run', data: { name: 'goal', args: 'pause', source: { kind: 'user' } } },
    { seq: 5, time: 1005, type: 'command/run', data: { name: 'plan', args: '不是目标', source: { kind: 'user' } } },
  ]
  const result = extractPrompts(events)
  assert.deepEqual(result.prompts.map((prompt) => prompt.text), ['第一段提示词', '做一个登录页'])
  assert.equal(result.title, '第一段提示词')
})

test('extractPrompts skips inherited fork prefixes', () => {
  const events = [userMessage(0, 1000, '继承的旧提示词'), userMessage(1, 1001, '新提示词')]
  const result = extractPrompts(events, 1)
  assert.deepEqual(result.prompts.map((prompt) => prompt.text), ['新提示词'])
})

test('messageText joins text blocks but ignores non-text blocks', () => {
  assert.equal(messageText({ content: [{ type: 'text', text: ' a\r\n' }, { type: 'image' }, { type: 'text', text: 'b ' }] }), 'a\n\nb')
})

test('createPromptIndex reuses session results until the persistence revision changes', async () => {
  const first = makeSession('s1', '1', ['alpha 提示词'])
  const second = makeSession('s2', '1', ['beta 提示词'])
  const { ctx, calls } = makeContext([first, second])
  const index = createPromptIndex(ctx)

  const initial = await index.getPayload(true)
  assert.equal(initial.total, 2)
  assert.deepEqual(initial.entries.map((entry) => entry.text).sort(), ['alpha 提示词', 'beta 提示词'])
  assert.equal(calls.observeSession, 2)
  assert.equal(calls.disposed, 2)

  const unchanged = await index.getPayload(true)
  assert.equal(unchanged.revision, initial.revision)
  assert.equal(calls.observeSession, 2, 'unchanged sessions are served from the parsed cache')

  first.revision = '2'
  first.events = [userMessage(0, 1_700_000_000_000, 'alpha 提示词'), userMessage(1, 1_700_000_000_500, 'alpha 新增')]
  const changed = await index.getPayload(true)
  assert.equal(calls.observeSession, 3)
  assert.equal(changed.total, 3)
  assert.ok(changed.entries.some((entry) => entry.text === 'alpha 新增'))
  index.dispose()
})

test('warmup fills the cache before the first request', async () => {
  const { ctx, calls } = makeContext([makeSession('s1', '1', ['warmup 提示词'])])
  const index = createPromptIndex(ctx)
  const warmed = await index.warmup()
  assert.equal(warmed.total, 1)
  assert.equal(calls.observeSession, 1)
  const payload = await index.getPayload(false)
  assert.equal(payload.total, 1)
  assert.equal(calls.observeSession, 1, 'the warmup result is reused by the first request')
  index.dispose()
})

test('the ETag revision changes when displayed truncation metadata changes', async () => {
  const session = makeSession('s1', '1', ['x'.repeat(50_000)])
  const { ctx } = makeContext([session])
  const index = createPromptIndex(ctx)
  const first = await index.getPayload(true)
  assert.equal(first.entries[0].truncated, false)
  session.revision = '2'
  session.events = [userMessage(0, 1_700_000_000_000, 'x'.repeat(50_001))]
  const second = await index.getPayload(true)
  assert.equal(second.entries[0].truncated, true)
  assert.notEqual(second.revision, first.revision)
  index.dispose()
})

test('the route returns a stable ETag and handles conditional requests', async () => {
  const { ctx } = makeContext([makeSession('s1', '1', ['etag 提示词'])])
  const index = createPromptIndex(ctx)
  const first = await index.handle(new Request('http://127.0.0.1/api/prompt-history'))
  assert.equal(first.status, 200)
  const etag = first.headers.get('etag')
  assert.match(etag, /^"r\d+"$/)
  const second = await index.handle(new Request('http://127.0.0.1/api/prompt-history', {
    headers: { 'if-none-match': etag },
  }))
  assert.equal(second.status, 304)
  assert.equal(second.headers.get('etag'), etag)
  const head = await index.handle(new Request('http://127.0.0.1/api/prompt-history', {
    method: 'HEAD', headers: { 'if-none-match': etag },
  }))
  assert.equal(head.status, 304)
  assert.equal(head.headers.get('etag'), etag)
  index.dispose()
})
