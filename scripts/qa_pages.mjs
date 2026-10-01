import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { chromium } from 'playwright-core'

const root = resolve('dist')
const server = createServer(async (request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname
  if (!pathname.startsWith('/becas/')) { response.writeHead(404).end(); return }
  const file = pathname.slice('/becas/'.length) || 'index.html'
  if (!['index.html', 'becas.csv'].includes(file)) { response.writeHead(404).end(); return }
  try {
    const body = await readFile(join(root, file))
    response.writeHead(200, { 'Content-Type': file.endsWith('.csv') ? 'text/csv; charset=utf-8' : 'text/html; charset=utf-8' }).end(body)
  } catch {
    response.writeHead(404).end()
  }
})
await new Promise(resolveListen => server.listen(0, '127.0.0.1', resolveListen))
const origin = `http://127.0.0.1:${server.address().port}/becas/`
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
try {
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(origin)
  await page.locator('.results-indicator strong').waitFor()
  assert.equal(await page.locator('.results-indicator strong').textContent(), '44')
  await page.goto(origin + '#/fuentes')
  await page.locator('.source-list a').first().waitFor()
  assert.equal(await page.locator('.source-list a').count(), 44)
  assert.equal(await page.locator('a[download]').count(), 0)
  assert.equal((await page.request.get(origin + 'becas.csv')).status(), 404)
  assert.deepEqual(errors, [])
  console.log(JSON.stringify({ base: '/becas/', scholarships: 44, sources: 44, publicCsv: 404, errors }))
} finally {
  await browser.close()
  server.close()
}
