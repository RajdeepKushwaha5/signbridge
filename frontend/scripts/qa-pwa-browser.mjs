const endpoint = process.argv[2] || 'http://127.0.0.1:9235'

function assert(condition, message) {
  if (!condition) throw new Error(`Browser PWA QA failed: ${message}`)
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function findPage() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const targets = await fetch(`${endpoint}/json`).then((response) => response.json())
      const page = targets.find((target) => target.type === 'page')
      if (page) return page
    } catch {}
    await delay(200)
  }
  throw new Error('Chrome DevTools endpoint did not become ready')
}

const page = await findPage()
const socket = new WebSocket(page.webSocketDebuggerUrl)
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true })
  socket.addEventListener('error', reject, { once: true })
})

let nextId = 0
const pending = new Map()
socket.addEventListener('message', ({ data }) => {
  const message = JSON.parse(data)
  if (!message.id || !pending.has(message.id)) return
  const { resolve, reject } = pending.get(message.id)
  pending.delete(message.id)
  if (message.error) reject(new Error(message.error.message))
  else resolve(message.result)
})

function send(method, params = {}) {
  const id = ++nextId
  socket.send(JSON.stringify({ id, method, params }))
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }))
}

async function evaluate(expression, awaitPromise = false) {
  const result = await send('Runtime.evaluate', { expression, awaitPromise, returnByValue: true })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text)
  return result.result.value
}

await send('Page.enable')
await send('Network.enable')
await send('Runtime.enable')
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await send('Network.emulateNetworkConditions', {
  offline: false,
  latency: 0,
  downloadThroughput: -1,
  uploadThroughput: -1,
  connectionType: 'wifi',
})
await send('Page.navigate', { url: 'http://127.0.0.1:4173/' })
await delay(1200)

const ready = await evaluate(`navigator.serviceWorker.ready.then((registration) => ({
  active: registration.active?.state,
  scope: registration.scope
}))`, true)
assert(ready.active === 'activated', 'service worker did not activate')
assert(ready.scope === 'http://127.0.0.1:4173/', 'service worker scope is incorrect')

await send('Page.reload', { ignoreCache: false })
await delay(900)
assert(await evaluate('Boolean(navigator.serviceWorker.controller)'), 'service worker does not control the page')
await evaluate("sessionStorage.clear(); localStorage.clear(); localStorage.setItem('signbridge.onboarding.seen.v1', 'true')")

const manifest = await send('Page.getAppManifest')
assert(manifest.url.endsWith('/manifest.webmanifest'), 'Chrome did not discover the web manifest')
assert(JSON.parse(manifest.data).display === 'standalone', 'Chrome read an invalid display mode')
try {
  const installability = await send('Page.getInstallabilityErrors')
  assert(installability.installabilityErrors.length === 0, `Chrome reports installability errors: ${JSON.stringify(installability.installabilityErrors)}`)
} catch (error) {
  if (!error.message.includes('wasn\'t found')) throw error
}

await send('Network.emulateNetworkConditions', {
  offline: true,
  latency: 0,
  downloadThroughput: 0,
  uploadThroughput: 0,
  connectionType: 'none',
})
await send('Page.reload', { ignoreCache: false })
await delay(1000)

assert(await evaluate("document.title.includes('SignBridge')"), 'offline navigation did not restore the app shell')
assert(await evaluate("document.querySelector('#root')?.childElementCount > 0"), 'React app did not render offline')
// Chrome's CDP network emulation blocks traffic but does not consistently flip
// navigator.onLine in headless mode. Exercise the same browser event used by a
// real connectivity transition when that signal is absent.
if (await evaluate('navigator.onLine')) {
  await evaluate("window.dispatchEvent(new Event('offline'))")
  await delay(50)
}
assert(await evaluate("document.querySelector('.model-status')?.textContent.includes('Offline lessons ready')"), 'offline connectivity status is not visible')
assert(await evaluate("document.body.textContent.includes('AI writing tutor for Deaf, ASL-first learners')"), 'Deaf and ASL-first positioning is not visible')
assert(await evaluate("document.body.textContent.includes('write it your way.') && document.body.textContent.includes('see how English changes.')"), 'winning hero message is missing')
assert(await evaluate("document.querySelectorAll('.hero-process li').length === 5"), 'five-step AI process is not visible')
assert(await evaluate("Boolean(document.querySelector('.hero-agent-preview'))"), 'agent preview is not visible above the fold')
assert(await evaluate("document.querySelector('.offline-proof')?.textContent.includes('work offline')"), 'online homepage does not communicate offline capability')
assert(await evaluate(`(() => {
  const buttons = [...document.querySelectorAll('.hero-actions button')]
  return buttons.length === 2 && buttons.every((button) => { const box = button.getBoundingClientRect(); return box.top >= 0 && box.bottom <= window.innerHeight })
})()`), 'primary hero actions are not above the fold')
assert(await evaluate("!document.body.textContent.includes('DAYS IN A ROW')"), 'zero-value streak statistics are visible on a new profile')

await evaluate(`(() => {
  const textarea = document.querySelector('textarea')
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set
  setter.call(textarea, 'Store I go yesterday.')
  textarea.dispatchEvent(new Event('input', { bubbles: true }))
  return true
})()`)
await delay(50)
await evaluate(`(() => {
  const button = [...document.querySelectorAll('button')].find((item) => item.textContent.includes('Start my session'))
  button.click()
  return true
})()`)

for (let attempt = 0; attempt < 30; attempt += 1) {
  if (await evaluate("document.body.textContent.includes('Reliable practice mode')")) break
  await delay(100)
}
assert(await evaluate("document.body.textContent.includes('Reliable practice mode')"), 'grammar session did not fall back locally while offline')
assert(await evaluate("Boolean(document.querySelector('details.agent-why'))"), 'Why this skill reasoning expander is missing')
assert(await evaluate("document.querySelector('details.agent-why').open"), 'Why this skill reasoning is not visible by default')

await evaluate(`(() => {
  const button = [...document.querySelectorAll('button')].find((item) => item.textContent.includes('Open the visual concept bridge'))
  button.click()
  return true
})()`)
await delay(100)
assert(await evaluate("document.body.textContent.includes('Visual concept bridge')"), 'visual concept bridge stage did not open')
assert(await evaluate("document.querySelectorAll('.concept-track--source .concept-card').length === 4"), 'learner concept roles were not rendered')

await evaluate("document.querySelector('button[aria-label=\"Move I left\"]').click()")
await delay(50)
await evaluate("document.querySelector('button[aria-label=\"Move went left\"]').click()")
await delay(50)
await evaluate(`(() => {
  const button = [...document.querySelectorAll('button')].find((item) => item.textContent.includes('Check my bridge'))
  button.click()
  return true
})()`)
await delay(100)
assert(await evaluate("document.body.textContent.includes('Bridge built')"), 'correct concept-card reordering was not accepted')
assert(await evaluate("document.querySelectorAll('.decision-timeline li').length >= 3"), 'concept result was not added to the agent decision timeline')

await evaluate(`(() => {
  const button = [...document.querySelectorAll('button')].find((item) => item.textContent.includes('Learn the language change'))
  button.click()
  return true
})()`)
await delay(50)
await evaluate(`(() => {
  const button = [...document.querySelectorAll('button')].find((item) => item.textContent.includes('Try a guided rewrite'))
  button.click()
  return true
})()`)
await delay(50)
await evaluate(`(() => {
  const textarea = document.querySelector('#guided-answer')
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set
  setter.call(textarea, 'Yesterday I walked home.')
  textarea.dispatchEvent(new Event('input', { bubbles: true }))
  return true
})()`)
await delay(50)
await evaluate(`(() => {
  const button = [...document.querySelectorAll('button')].find((item) => item.textContent.includes('Check my rewrite'))
  button.click()
  return true
})()`)
for (let attempt = 0; attempt < 30; attempt += 1) {
  if (await evaluate("document.querySelector('.practice-feedback.is-correct') !== null")) break
  await delay(100)
}
assert(await evaluate("document.body.textContent.includes('Unseen transfer')"), 'agent did not choose unseen transfer after guided success')
await evaluate(`(() => {
  const button = [...document.querySelectorAll('button')].find((item) => item.textContent.includes('Try the unseen transfer'))
  button.click()
  return true
})()`)
await delay(50)
await evaluate(`(() => {
  const textarea = document.querySelector('#transfer-answer')
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set
  setter.call(textarea, 'Last night we watched a movie.')
  textarea.dispatchEvent(new Event('input', { bubbles: true }))
  return true
})()`)
await delay(50)
await evaluate(`(() => {
  const button = [...document.querySelectorAll('button')].find((item) => item.textContent.includes('Check my rewrite'))
  button.click()
  return true
})()`)
for (let attempt = 0; attempt < 30; attempt += 1) {
  if (await evaluate("document.body.textContent.includes('Agent memory /')")) break
  await delay(100)
}
assert(await evaluate("document.body.textContent.includes('previously omitted past-tense markers once')"), 'grounded qualitative memory was not shown after independent transfer')
assert(await evaluate("document.querySelectorAll('.decision-timeline li').length >= 5"), 'practice routing decisions were not added to the timeline')
await evaluate(`(() => {
  const button = [...document.querySelectorAll('button')].find((item) => item.textContent.includes('Finish this session'))
  button.click()
  return true
})()`)
await delay(100)
assert(await evaluate("document.body.textContent.includes('What the agent remembered')"), 'qualitative memory was not carried into the session summary')
assert(await evaluate("document.body.textContent.includes('Reading reinforcement')"), 'adaptive next route was not visible in the session summary')

await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
assert(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), 'mobile layout has horizontal overflow')

const result = {
  serviceWorker: ready,
  offlineReload: true,
  offlineGrammarFallback: true,
  winningHeroAboveFold: true,
  whySkillExpander: true,
  visualConceptBridge: true,
  adaptiveDecisionTimeline: true,
  groundedMisconceptionMemory: true,
  adaptiveSummaryRoute: true,
  mobileWidth: 390,
}
console.log(JSON.stringify(result, null, 2))
socket.close()
