import puppeteer from 'puppeteer'

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 1920, height: 950 })

await page.evaluateOnNewDocument(() => {
  localStorage.setItem('chronos_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbXFhNHE0eW4wMDA0MmdlcjcwanJ4cjQzIiwicm9sZSI6IkRFVkVMT1BFUiIsImNvbXBhbnlJZCI6ImNtcWE0cTQ5dDAwMDMyZ2VyOGhtb2V6N2UiLCJicmFuY2hJZCI6bnVsbCwibmFtZSI6Ik1pbGVuYSBEZW1vIiwiaWF0IjoxNzgxMjIwNTUyLCJleHAiOjE3ODE4MjUzNTJ9.TGeWzN6EPCnqo9Mf89KCZzF8fml1mVHBpLmK7AbyKN8')
  localStorage.setItem('chronos_refresh', 'cmqa4q4yn00042ger70jrxr43.746e11a84fe1b5469e9748ce3e43f2ff4c7de1b16f4c030cb48c1cc6f076622b5c0dc2b0ab6e498009d295b06a853362')
  localStorage.setItem('chronos_remember', 'true')
})

page.on('response', async resp => {
  const url = resp.url()
  if (url.includes('/api/')) console.log(`  ${resp.status()} ${url.substring(0,90)}`)
})

await page.goto('https://chronos-blond-gamma.vercel.app', { waitUntil: 'networkidle2', timeout: 60000 })
await new Promise(r => setTimeout(r, 8000))

// Accept terms if shown
const hasTerms = await page.evaluate(() => document.body.innerText.includes('Termos de Uso'))
if (hasTerms) {
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')]
    for (const b of btns) {
      if (b.textContent?.toLowerCase().includes('aceitar')) { b.click(); break }
    }
  })
  await new Promise(r => setTimeout(r, 3000))
}

await page.evaluate(() => window.scrollTo(0, 0))
await new Promise(r => setTimeout(r, 500))

await page.screenshot({ path: 'public/chronos.png' })
const { statSync } = await import('fs')
console.log('SIZE:', statSync('public/chronos.png').size)
await browser.close()
