// Minimal static file server for the exported site (used by the end-to-end tests and the QA scripts).
// Usage: node scripts/serve-static.mjs <dir> <port>
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize, resolve } from 'node:path'

const root = resolve(process.argv[2] ?? 'out')
const port = Number(process.argv[3] ?? 4173)
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml', '.webmanifest': 'application/manifest+json',
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost')
    let path = normalize(join(root, decodeURIComponent(url.pathname)))
    if (!path.startsWith(root)) throw new Error('outside root')
    if ((await stat(path).catch(() => null))?.isDirectory()) path = join(path, 'index.html')
    const body = await readFile(path)
    res.writeHead(200, { 'Content-Type': TYPES[extname(path)] ?? 'application/octet-stream' })
    res.end(body)
  } catch {
    const notFound = await readFile(join(root, '404.html')).catch(() => 'Not found')
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(notFound)
  }
}).listen(port, '127.0.0.1', () => console.log(`Serving ${root} on http://127.0.0.1:${port}`))
