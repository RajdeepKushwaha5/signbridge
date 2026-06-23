import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = resolve(root, 'dist')

function assert(condition, message) {
  if (!condition) throw new Error(`PWA verification failed: ${message}`)
}

function read(relativePath) {
  const path = resolve(dist, relativePath)
  assert(existsSync(path), `${relativePath} is missing`)
  return readFileSync(path)
}

function pngDimensions(relativePath) {
  const bytes = read(relativePath)
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  assert(bytes.subarray(0, 8).equals(signature), `${relativePath} is not a PNG`)
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)]
}

const manifest = JSON.parse(read('manifest.webmanifest').toString('utf8'))
assert(manifest.name === 'SignBridge — from sign to sentence', 'manifest name is incorrect')
assert(manifest.short_name === 'SignBridge', 'manifest short name is incorrect')
assert(manifest.display === 'standalone', 'display must be standalone')
assert(manifest.start_url === '/', 'start_url must be /')
assert(manifest.scope === '/', 'scope must be /')
assert(manifest.theme_color === '#11110f', 'theme color is incorrect')
assert(manifest.background_color === '#f4f1e9', 'background color is incorrect')

for (const [file, size] of [['pwa-192x192.png', 192], ['pwa-512x512.png', 512]]) {
  const [width, height] = pngDimensions(file)
  assert(width === size && height === size, `${file} must be ${size}x${size}`)
}
assert(manifest.icons.some((icon) => icon.sizes === '512x512' && icon.purpose === 'maskable'), 'maskable icon is missing')

const html = read('index.html').toString('utf8')
assert(html.includes('manifest.webmanifest'), 'manifest is not linked from index.html')
assert(html.includes('registerSW.js'), 'service worker registration is not injected')
assert(html.includes('theme-color') && html.includes('#11110f'), 'HTML theme color does not match the manifest')

read('registerSW.js')
const serviceWorker = read('sw.js').toString('utf8')
for (const expected of ['index.html', 'pwa-192x192.png', 'pwa-512x512.png', 'mediapipe-wasm', 'mediapipe-model', 'web-fonts']) {
  assert(serviceWorker.includes(expected), `service worker does not include ${expected}`)
}

console.log('PWA artifacts verified: manifest, icons, app shell, navigation fallback, and runtime caches.')
