// Generates SignBridge PWA icons (brand mark on paper) as real PNGs,
// with no image dependencies — a tiny hand-rolled PNG encoder.
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const publicDir = resolve(here, '..', 'public')

const CRC_TABLE = (() => {
  const table = []
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crc])
}

function encodePng(size, pixels) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // colour type RGBA
  const stride = size * 4
  const raw = Buffer.alloc(size * (stride + 1))
  for (let y = 0; y < size; y += 1) {
    raw[y * (stride + 1)] = 0 // filter: none
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
  }
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))])
}

// The SignBridge mark: a 3x3 grid filled like  XXX / .XX / .XX
const PATTERN = [[1, 1, 1], [0, 1, 1], [0, 1, 1]]

function drawIcon(size) {
  const px = Buffer.alloc(size * size * 4)
  for (let i = 0; i < size * size; i += 1) {
    px[i * 4] = 0xf4
    px[i * 4 + 1] = 0xf1
    px[i * 4 + 2] = 0xe9
    px[i * 4 + 3] = 255
  }
  const margin = Math.floor(size * 0.27)
  const area = size - 2 * margin
  const gap = Math.floor(area * 0.09)
  const cell = Math.floor((area - 2 * gap) / 3)
  for (let r = 0; r < 3; r += 1) {
    for (let c = 0; c < 3; c += 1) {
      if (!PATTERN[r][c]) continue
      const x0 = margin + c * (cell + gap)
      const y0 = margin + r * (cell + gap)
      for (let y = y0; y < y0 + cell; y += 1) {
        for (let x = x0; x < x0 + cell; x += 1) {
          const i = (y * size + x) * 4
          const accent = r === 0 && c === 2
          px[i] = accent ? 0xf1 : 0x11
          px[i + 1] = accent ? 0x5a : 0x11
          px[i + 2] = accent ? 0x2a : 0x0f
          px[i + 3] = 255
        }
      }
    }
  }
  return px
}

mkdirSync(publicDir, { recursive: true })
for (const size of [192, 512]) {
  writeFileSync(resolve(publicDir, `pwa-${size}x${size}.png`), encodePng(size, drawIcon(size)))
}
writeFileSync(resolve(publicDir, 'apple-touch-icon.png'), encodePng(180, drawIcon(180)))
writeFileSync(resolve(publicDir, 'favicon.png'), encodePng(48, drawIcon(48)))
console.log('Generated PWA icons in', publicDir)
