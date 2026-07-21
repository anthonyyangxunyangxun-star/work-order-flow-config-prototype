const API_TIMEOUT_MS = 5000
const STATIC_DEMO = import.meta.env.VITE_STATIC_DEMO === 'true'

function apiBase() {
  return import.meta.env.VITE_CONFIG_API_BASE || ''
}

async function requestJson(path, options = {}) {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS)
  try {
    const response = await fetch(`${apiBase()}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      signal: controller.signal
    })
    const text = await response.text()
    const payload = text ? JSON.parse(text) : {}
    if (!response.ok || payload.ok === false) {
      throw new Error(payload.error || `请求失败：${response.status}`)
    }
    return payload
  } finally {
    window.clearTimeout(timer)
  }
}

export async function fetchSharedConfig(key) {
  if (typeof window === 'undefined') return { ok: false, exists: false, data: null }
  if (STATIC_DEMO) return { ok: true, exists: false, data: null, localOnly: true }
  return requestJson(`/api/config/${key}`)
}

export async function saveSharedConfig(key, data) {
  if (typeof window === 'undefined') return { ok: false }
  if (STATIC_DEMO) return { ok: true, localOnly: true }
  return requestJson(`/api/config/${key}`, {
    method: 'PUT',
    body: JSON.stringify({ data })
  })
}
