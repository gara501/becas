import { chromium } from 'playwright-core'
import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
const html = readFileSync(resolve('dist/index.html'))
const server = createServer((request, response) => {
  if (request.url !== '/') { response.writeHead(404).end(); return }
  response.setHeader('Content-Type', 'text/html; charset=utf-8')
  response.end(html)
})
await new Promise((ready) => server.listen(0, '127.0.0.1', ready))
const target = `http://127.0.0.1:${server.address().port}/`
const tagUrl = /googletagmanager\.com\/gtag\/js/
const events = (page, name) => page.evaluate((eventName) => (window.dataLayer || [])
  .filter((entry) => entry[0] === 'event' && entry[1] === eventName)
  .map((entry) => entry[2] || {}), name)

try {
  const denied = await browser.newContext()
  let deniedRequests = 0
  await denied.route(tagUrl, (route) => { deniedRequests += 1; return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) })
  const deniedPage = await denied.newPage()
  await deniedPage.goto(target, { waitUntil: 'domcontentloaded' })
  await deniedPage.getByRole('button', { name: 'Solo esenciales' }).waitFor()
  assert.equal(deniedRequests, 0)
  assert.equal(await deniedPage.locator('script[src*="googletagmanager.com"]').count(), 0)
  await deniedPage.getByRole('button', { name: 'Solo esenciales' }).click()
  await deniedPage.locator('a[href="#/fuentes"]').click()
  await deniedPage.locator('.source-list a').first().waitFor()
  assert.equal(deniedRequests, 0)
  assert.equal(await deniedPage.locator('script[src*="googletagmanager.com"]').count(), 0)
  await denied.close()

  const accepted = await browser.newContext()
  let acceptedRequests = 0
  await accepted.route(tagUrl, (route) => { acceptedRequests += 1; return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) })
  const page = await accepted.newPage()
  await page.goto(target, { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Permitir analítica' }).waitFor()
  assert.equal(acceptedRequests, 0)
  await page.getByRole('button', { name: 'Permitir analítica' }).click()
  await page.waitForFunction(() => (window.dataLayer || []).some((entry) => entry[0] === 'event' && entry[1] === 'page_view'))
  assert.equal(acceptedRequests, 1)
  assert.equal((await events(page, 'page_view')).length, 1)
  await page.locator('a[href="#/fuentes"]').click()
  await page.locator('.source-list a').first().waitFor()
  assert.equal((await events(page, 'page_view')).length, 2)
  await page.locator('a[href="#/metodo"]').click()
  await page.locator('.method-grid').waitFor()
  assert.equal((await events(page, 'page_view')).length, 3)
  await page.locator('a[href="#/privacidad"]').click()
  await page.locator('.privacy-page').waitFor()
  assert.equal((await events(page, 'page_view')).length, 4)
  await page.locator('a[href="#/"]').first().click()
  await page.locator('.results-list').waitFor()
  assert.equal((await events(page, 'page_view')).length, 5)

  await page.locator('select').first().selectOption('Alemania')
  await page.waitForTimeout(850)
  assert.equal((await events(page, 'explore_filters')).at(-1).destination, 'Alemania')
  await page.getByPlaceholder('Beca, entidad o universidad').fill('correo@example.com')
  await page.waitForTimeout(850)
  const zero = await events(page, 'no_results')
  assert.equal(zero.length, 1)
  assert.equal(zero[0].has_search, true)
  assert.equal(JSON.stringify(await page.evaluate(() => window.dataLayer)).includes('correo@example.com'), false)
  await page.getByPlaceholder('Beca, entidad o universidad').fill('')
  await page.waitForTimeout(850)
  await page.evaluate(() => document.addEventListener('click', (event) => {
    if (event.target.closest?.('a[data-beca-id]')) event.preventDefault()
  }, true))
  await page.locator('.scholar-card a[data-beca-id]').first().click()
  const clicks = await events(page, 'official_link_click')
  assert.equal(clicks.length, 1)
  assert.equal(clicks[0].link_context, 'tarjeta')
  assert.ok(clicks[0].scholarship_id)
  await page.getByRole('button', { name: 'Preferencias de analítica' }).click()
  await page.getByRole('button', { name: 'Solo esenciales' }).click()
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(300)
  assert.equal(await page.locator('script[src*="googletagmanager.com"]').count(), 0)
  assert.equal(await page.evaluate(() => localStorage.getItem('atlasbecas.analytics.v1')), 'rejected')
  await accepted.close()
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const mobilePage = await mobile.newPage()
  await mobilePage.goto(target, { waitUntil: 'domcontentloaded' })
  await mobilePage.getByRole('button', { name: 'Permitir analítica' }).waitFor()
  assert.equal(await mobilePage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false)
  await mobilePage.screenshot({ path: '.tmp/analytics-mobile.png' })
  await mobile.close()
  console.log(JSON.stringify({ deniedRequests, acceptedRequests, pageViews: 5, noResults: zero.length, officialClicks: clicks.length }, null, 2))
} finally {
  await browser.close()
  await new Promise((done) => server.close(done))
}
