import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

function loadClientSearch() {
  let registration
  const sandbox = {
    window: { __ModuleLoader__: { load(value) { registration = value } } },
    console,
    __DSH_PROMPT_MANAGE_TEST__: true,
  }
  sandbox.globalThis = sandbox
  vm.runInNewContext(readFileSync(new URL('../client.js', import.meta.url), 'utf8'), sandbox, { filename: 'client.js' })
  assert.ok(registration, 'client bundle registered with the module loader')
  const React = {
    Fragment: Symbol('Fragment'),
    createElement() { return null },
    useCallback(fn) { return fn },
    useDeferredValue(value) { return value },
    useEffect() {},
    useLayoutEffect() {},
    useMemo(fn) { return fn() },
    useRef(value) { return { current: value } },
    useState(value) { return [value, () => {}] },
    useSyncExternalStore() { return null },
  }
  const plugin = registration.factory((name) => {
    if (name === 'react') return React
    throw new Error(`unexpected require: ${name}`)
  })
  assert.ok(plugin.__test, 'test hooks are exposed in test mode')
  return plugin.__test
}

const search = loadClientSearch()
const ids = (entries, query) => Array.from(search.searchEntries(entries, query), (entry) => entry.id)

const entries = [
  { id: 'a', time: 3, project: '前端项目', sessionTitle: '登录页改造', text: '请帮我实现 React 登录页面，包含表单校验。' },
  { id: 'b', time: 2, project: '后台项目', sessionTitle: '接口排查', text: '这个 React 管理后台的接口报错了。' },
  { id: 'c', time: 1, project: '设计项目', sessionTitle: '视觉稿', text: '登录页面的间距再调整一下。' },
]

test('searchTerms splits on ordinary and full-width whitespace', () => {
  assert.deepEqual(Array.from(search.searchTerms('  react   登录  ')), ['react', '登录'])
  assert.deepEqual(Array.from(search.searchTerms('性能\u3000缓存')), ['性能', '缓存'])
  assert.deepEqual(Array.from(search.searchTerms('   ')), [])
})

test('space-separated terms are ANDed, in any order', () => {
  assert.deepEqual(ids(entries, 'react 登录'), ['a'])
  assert.deepEqual(ids(entries, '登录 react'), ['a'])
  assert.deepEqual(ids(entries, 'react').sort(), ['a', 'b'])
  assert.deepEqual(ids(entries, 'react 不存在'), [])
})

test('every whitespace-separated term is required, including beyond the ninth', () => {
  const many = [
    { id: 'eight', time: 1, project: '', sessionTitle: '', text: 'a b c d e f g h' },
    { id: 'nine', time: 2, project: '', sessionTitle: '', text: 'a b c d e f g h z' },
  ]
  assert.deepEqual(Array.from(search.searchTerms('a b c d e f g h z')).length, 9)
  assert.deepEqual(ids(many, 'a b c d e f g h z'), ['nine'])
  assert.deepEqual(ids(many, 'a b c d e f g h').sort(), ['eight', 'nine'])
})

test('fuzzy matching still sees the full prompt text and long terms', () => {
  const longText = 'a' + 'x'.repeat(20_001) + 'bc'
  assert.deepEqual(ids([{ id: 'long', time: 1, project: '', sessionTitle: '', text: longText }], 'abc'), ['long'])
  const longTerm = 'abcdefghijklmnopqrstuvwxyz0123456789'
  assert.deepEqual(ids([{ id: 'term', time: 1, project: '', sessionTitle: '', text: 'prefix ' + longTerm + ' suffix' }], longTerm), ['term'])
})

test('multi-word search also matches project and session metadata', () => {
  assert.deepEqual(ids(entries, '前端 登录'), ['a'])
  assert.deepEqual(ids(entries, '后台 接口'), ['b'])
  assert.deepEqual(ids(entries, '设计 视觉稿'), ['c'])
})

test('search is case-insensitive and does not split CJK words', () => {
  assert.deepEqual(ids(entries, 'REACT').sort(), ['a', 'b'])
  assert.deepEqual(ids(entries, '登录页').sort(), ['a', 'c'])
})

test('multi-term results rank an exact phrase above scattered terms', () => {
  const ranked = ids([
    { id: 'scattered', time: 2, project: '', sessionTitle: '', text: '登录之前请先看 react 文档' },
    { id: 'phrase', time: 1, project: '', sessionTitle: '', text: '请实现 react 登录 页面' },
  ], 'react 登录')
  assert.deepEqual(ranked, ['phrase', 'scattered'])
})
