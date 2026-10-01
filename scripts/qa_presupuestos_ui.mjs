import { chromium } from 'playwright-core'
import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(pathToFileURL(resolve('dist/index.html')).href)
  await page.getByPlaceholder('Beca, entidad o universidad').fill('Ingvar Kamprad')
  await page.locator('.scholar-card .card-detail-link').click()
  const budget = page.locator('.budget-section')
  await budget.waitFor()
  assert.match(await budget.textContent(), /8\.900.*13\.500/)
  assert.match(await budget.textContent(), /Costo total completo: No verificado/)
  await budget.locator('select').selectOption('ambas')
  assert.match(await budget.locator('.budget-personal').textContent(), /2\.400.*69\.600/)
  assert.ok(await budget.locator('.budget-lines a[href^="https://"]').count() >= 5)
  await budget.scrollIntoViewIfNeeded()
  await page.locator('.detail-panel').screenshot({ path: '.tmp/presupuesto-piloto.png' })
  assert.deepEqual(errors, [])
  console.log('Presupuesto piloto visible, fuentes enlazadas y modalidad recalculada en la ficha.')
} finally {
  await browser.close()
}


