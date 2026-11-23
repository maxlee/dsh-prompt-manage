import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const read = (file) => readFileSync(join(root, file), 'utf8')
const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

test('client bundle id and Cordis patch row match the package name', () => {
  const pkg = JSON.parse(read('package.json'))
  assert.match(read('client.js'), new RegExp(`id: '${escape(pkg.name)}'`))
  assert.match(read('cordis.patch.yml'), new RegExp(`name: '${escape(pkg.name)}'`))
})

test('the visible product name is Prompt Manage / 提示词管理 in both locales', () => {
  const client = read('client.js')
  assert.match(client, /navLabel: 'Prompt Manage'/)
  assert.match(client, /navLabel: '提示词管理'/)
  assert.match(client, /title: 'Prompt Manage'/)
  assert.match(client, /title: '提示词管理'/)
  assert.equal(JSON.parse(read('locale/en.json')).meta.title, 'Prompt Manage')
  assert.equal(JSON.parse(read('locale/zh.json')).meta.title, '提示词管理')
})

test('the README header uses the packaged plugin icon', () => {
  const pkg = JSON.parse(read('package.json'))
  assert.equal(pkg.icon, 'icon.svg')
  assert.match(read('icon.svg'), /ph-icon-history/)
  assert.match(read('README.md'), /<img src="icon\.svg"/)
  assert.match(read('README.zh.md'), /<img src="icon\.svg"/)
})

test('the README is available in English and Simplified Chinese', () => {
  const english = read('README.md')
  const chinese = read('README.zh.md')
  assert.match(english, /README\.zh\.md/)
  assert.match(chinese, /README\.md/)
  assert.ok(english.length > 1000)
  assert.ok(chinese.length > 1000)
})

test('the package manifest points at files that exist', () => {
  const pkg = JSON.parse(read('package.json'))
  assert.equal(pkg.dsh.bundle.patch, './cordis.patch.yml')
  assert.ok(pkg.files.includes('client.js'))
  assert.ok(pkg.files.includes('index.js'))
  assert.ok(pkg.files.includes('optimizer.js'))
  assert.ok(pkg.files.includes('prompts/*.md'))
  assert.ok(pkg.files.includes('README.zh.md'))
  assert.ok(!pkg.private, 'the package must stay publishable')
  assert.equal(pkg.exports['./client'], './client.js')
})

test('the host and client wire the prompt optimizer together', () => {
  const host = read('index.js')
  const client = read('client.js')
  assert.match(host, /createPromptOptimizer/)
  assert.match(host, /OPTIMIZE_ROUTE/)
  assert.match(client, /const OPTIMIZE_API = '\/api\/prompt-optimize'/)
  assert.match(client, /data-prompt-optimize-entry/)
  assert.match(client, /function ComposerOptimize/)
  assert.match(client, /id: \`\$\{PANEL\}-optimize\`|id: '\$\{PANEL\}-optimize'/)
})

test('composer UI text exists in every locale dictionary', () => {
  const source = read('client.js')
  const en = source.slice(source.indexOf('      en: {'), source.indexOf('      zh: {'))
  const zh = source.slice(source.indexOf('      zh: {'), source.indexOf('    }\n\n    function normalizeLocale'))
  const keysOf = (block) => [...block.matchAll(/^\s{8}([a-zA-Z0-9]+):/gm)].map((match) => match[1]).sort()
  const enKeys = keysOf(en)
  const zhKeys = keysOf(zh)
  assert.ok(enKeys.length > 20, 'expected the full client dictionary')
  assert.deepEqual(zhKeys, enKeys)
  for (const key of ['composerEntry', 'composerApply', 'composerViewAll', 'composerSearchPlaceholder', 'optimizeEmptyCommand', 'composerHintCommand']) {
    assert.ok(enKeys.includes(key), `missing dictionary key ${key}`)
  }
  assert.match(source, /function splitCommandDraft/)
  assert.match(source, /function replaceDraftPreservingCommand/)
  assert.match(source, /function isFrozenPhase/)
})

test('the scale guardrails stay wired: warmed index, ETag, prepared search, paged rows', () => {
  const host = read('index.js')
  const client = read('client.js')
  assert.match(host, /const MAX_PROMPTS = 10_000/)
  assert.match(host, /const MAX_SESSION_CACHE_CHARS = 48 \* 1024 \* 1024/)
  assert.match(host, /function revisionOf\(entries, meta\)/)
  assert.match(host, /async function warmup\(/)
  assert.match(host, /index\.warmup\(\)/)
  assert.match(client, /function prepareSearchEntries\(entries\)/)
  assert.match(client, /function searchPrepared\(prepared, query\)/)
  assert.match(client, /const PROMPT_PAGE_SIZE = 100/)
  assert.match(client, /React\.useDeferredValue\(query\)/)
})

test('the composer palette shrinks into the room above the composer', () => {
  const client = read('client.js')
  assert.doesNotMatch(client, /PALETTE_MIN_HEIGHT/)
  assert.match(client, /const PALETTE_VIEWPORT_GAP = 12/)
  assert.match(client, /anchor\.getBoundingClientRect\(\)\.top/)
  assert.match(client, /document\.querySelector\('header'\)/)
  assert.match(client, /Math\.max\(0, Math\.min\(PALETTE_MAX_HEIGHT, room, viewportRoom\)\)/)
  assert.match(client, /max-height: calc\(100dvh - 24px\)/)
  assert.match(client, /maxHeight > PALETTE_COMPACT_HEIGHT/)
})

test('applying and optimizing a prompt put the caret at the end', () => {
  const client = read('client.js')
  assert.match(client, /function placeCaretAtEnd\(ctx, sessionId\)/)
  assert.match(client, /function detectDraftLength\(draft, occurrences, command\)/)
  assert.match(client, /range\.selectNodeContents\(root\)/)
  assert.ok((client.match(/placeCaretAtEnd\(ctx, sessionId\)/g) || []).length >= 3)
})

test('the composer history and optimizer glyphs use the new icon geometry', () => {
  const client = read('client.js')
  assert.match(client, /M3 12a9 9 0 1 0 9-9/)
  assert.match(client, /wand-sparkles/)
  assert.doesNotMatch(client, /strokeScale: 1\.45/)
})
