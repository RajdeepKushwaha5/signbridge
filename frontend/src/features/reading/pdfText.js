// Extracts text from a PDF in the browser. pdfjs is dynamically imported so its
// large bundle only loads when a teacher actually uploads a PDF. The worker is
// served from jsdelivr, which the PWA already runtime-caches (works offline after
// first use). Paste-text remains the primary, dependency-free path.
export async function extractPdfText(file, { maxPages = 20, maxChars = 8000 } = {}) {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

  const data = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data }).promise
  const pageCount = Math.min(pdf.numPages, maxPages)
  let text = ''
  for (let page = 1; page <= pageCount; page += 1) {
    const content = await (await pdf.getPage(page)).getTextContent()
    text += content.items.map((item) => item.str).join(' ') + '\n'
    if (text.length >= maxChars) break
  }
  return text.replace(/\s+/g, ' ').trim().slice(0, maxChars)
}
