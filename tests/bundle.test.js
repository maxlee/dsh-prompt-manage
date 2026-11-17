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

test('the package manifest points at files that exist', () => {
  const pkg = JSON.parse(read('package.json'))
  assert.equal(pkg.dsh.bundle.patch, './cordis.patch.yml')
  assert.ok(pkg.files.includes('client.js'))
  assert.ok(pkg.files.includes('index.js'))
  assert.ok(!pkg.private, 'the package must stay publishable')
  assert.equal(pkg.exports['./client'], './client.js')
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
  for (const key of ['composerEntry', 'composerApply', 'composerViewAll', 'composerSearchPlaceholder']) {
    assert.ok(enKeys.includes(key), `missing dictionary key ${key}`)
  }
})
