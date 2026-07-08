export const MEMBER_TOKEN_KEY = 'acp-member-token'

export function getMemberToken() {
  return getStoredToken()
}

function getStoredToken() {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(MEMBER_TOKEN_KEY)
}

function setStoredToken(token) {
  if (typeof window === 'undefined') return
  if (token) window.localStorage.setItem(MEMBER_TOKEN_KEY, token)
  else window.localStorage.removeItem(MEMBER_TOKEN_KEY)
}

async function readJson(response) {
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data?.error?.message || 'เกิดข้อผิดพลาดจากระบบ')
  }
  return data
}

export async function registerMember(payload) {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await readJson(response)
  setStoredToken(data.token)
  return data.user
}

export async function loginMember(payload) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await readJson(response)
  setStoredToken(data.token)
  return data.user
}

export async function getCurrentMember() {
  const token = getStoredToken()
  if (!token) return null
  const response = await fetch('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await readJson(response)
  return data.user
}

export async function logoutMember() {
  const token = getStoredToken()
  if (token) {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {})
  }
  setStoredToken(null)
}

export function clearMemberToken() {
  setStoredToken(null)
}
