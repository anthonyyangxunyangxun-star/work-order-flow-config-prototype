import { createServer } from 'node:http'
import { createReadStream } from 'node:fs'
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises'
import { dirname, extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '..')
const distDir = resolve(projectRoot, 'dist')
const allowedConfigKeys = new Set(['workflows', 'work-classifications'])

const args = new Map(process.argv.slice(2).map(item => {
  const [key, value = ''] = item.split('=')
  if (key.startsWith('--')) return [key.slice(2), value || true]
  return [key, value]
}))

const host = String(args.get('host') || process.env.HOST || '0.0.0.0')
const port = Number(args.get('port') || process.env.PORT || 5177)
const dataDir = resolve(projectRoot, String(args.get('data-dir') || process.env.CONFIG_DATA_DIR || 'server/data'))

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload)
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body)
  })
  res.end(body)
}

function sendError(res, statusCode, message) {
  sendJson(res, statusCode, { ok: false, error: message })
}

function configPath(key) {
  return resolve(dataDir, `${key}.json`)
}

async function readRequestBody(req) {
  const chunks = []
  let total = 0
  for await (const chunk of req) {
    total += chunk.length
    if (total > 25 * 1024 * 1024) throw new Error('请求体超过 25MB')
    chunks.push(chunk)
  }
  return Buffer.concat(chunks).toString('utf8')
}

async function readConfig(key) {
  try {
    const raw = await readFile(configPath(key), 'utf8')
    const parsed = JSON.parse(raw)
    return {
      exists: true,
      data: parsed.data,
      revision: parsed.revision || 1,
      updatedAt: parsed.updatedAt || ''
    }
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return { exists: false, data: null, revision: 0, updatedAt: '' }
    }
    throw error
  }
}

async function writeConfig(key, data) {
  await mkdir(dataDir, { recursive: true })
  const previous = await readConfig(key).catch(() => ({ revision: 0 }))
  const record = {
    revision: (previous.revision || 0) + 1,
    updatedAt: new Date().toISOString(),
    data
  }
  const filePath = configPath(key)
  const tempPath = `${filePath}.${Date.now()}.tmp`
  await writeFile(tempPath, `${JSON.stringify(record, null, 2)}\n`, 'utf8')
  await rename(tempPath, filePath)
  return record
}

async function handleConfigApi(req, res, url) {
  const match = url.pathname.match(/^\/api\/config\/([^/]+)$/)
  if (!match) return false
  const key = match[1]
  if (!allowedConfigKeys.has(key)) {
    sendError(res, 404, '未知配置项')
    return true
  }

  if (req.method === 'GET') {
    const record = await readConfig(key)
    sendJson(res, 200, { ok: true, ...record })
    return true
  }

  if (req.method === 'PUT') {
    const raw = await readRequestBody(req)
    const payload = raw ? JSON.parse(raw) : {}
    const data = Object.prototype.hasOwnProperty.call(payload, 'data') ? payload.data : payload
    if (!Array.isArray(data) && (typeof data !== 'object' || data === null)) {
      sendError(res, 400, '配置数据必须是对象或数组')
      return true
    }
    const record = await writeConfig(key, data)
    sendJson(res, 200, { ok: true, exists: true, ...record })
    return true
  }

  sendError(res, 405, '不支持的请求方法')
  return true
}

async function handleApi(req, res, url) {
  if (url.pathname === '/api/health') {
    sendJson(res, 200, { ok: true, uptime: process.uptime(), now: new Date().toISOString() })
    return true
  }
  return handleConfigApi(req, res, url)
}

function safeStaticPath(pathname) {
  const decoded = decodeURIComponent(pathname)
  const normalizedPath = normalize(decoded).replace(/^(\.\.[/\\])+/, '')
  const targetPath = resolve(distDir, normalizedPath === '/' ? 'index.html' : normalizedPath.slice(1))
  if (!targetPath.startsWith(distDir)) return ''
  return targetPath
}

async function sendStatic(req, res, url) {
  let filePath = safeStaticPath(url.pathname)
  if (!filePath) {
    res.writeHead(403)
    res.end('Forbidden')
    return
  }

  try {
    const fileStat = await stat(filePath)
    if (!fileStat.isFile()) throw new Error('Not file')
  } catch {
    filePath = resolve(distDir, 'index.html')
  }

  const ext = extname(filePath)
  res.writeHead(200, {
    'Content-Type': mimeTypes[ext] || 'application/octet-stream',
    'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable'
  })
  createReadStream(filePath).pipe(res)
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
    if (url.pathname.startsWith('/api/')) {
      const handled = await handleApi(req, res, url)
      if (!handled) sendError(res, 404, '接口不存在')
      return
    }
    await sendStatic(req, res, url)
  } catch (error) {
    sendError(res, 500, error?.message || '服务异常')
  }
})

await mkdir(dataDir, { recursive: true })

server.listen(port, host, () => {
  console.log(`Config server listening on http://${host}:${port}`)
})
