import { useCallback, useEffect, useState } from 'react'
import { clearMemberToken } from './memberAuthApi'

const STORAGE_KEY = 'acp-member-session'

function readSession() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeSession(session) {
  if (typeof window === 'undefined') return
  try {
    if (session) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    else window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore unavailable storage/quota errors.
  }
}

export function createTrialSession({ name, email, companyName }) {
  const now = Date.now()
  const trialEndsAt = now + 7 * 24 * 60 * 60 * 1000
  return {
    id: `user-${now}`,
    name: name?.trim() || 'Member',
    email: email?.trim() || '',
    companyName: companyName?.trim() || '',
    planCode: 'trial',
    status: 'trialing',
    aiCredits: 3,
    projectsUsed: 0,
    trialEndsAt,
    createdAt: now,
  }
}

export function useMemberSession() {
  const [session, setSessionState] = useState(() => readSession())

  useEffect(() => {
    writeSession(session)
  }, [session])

  const setSession = useCallback((next) => setSessionState(next), [])
  const clearSession = useCallback(() => {
    clearMemberToken()
    setSessionState(null)
  }, [])

  return {
    session,
    isSignedIn: !!session,
    setSession,
    clearSession,
  }
}