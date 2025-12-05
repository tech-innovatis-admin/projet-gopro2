import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

export type TokenPayload = {
  email: string
  type: 'access' | 'refresh'
  exp?: number
}

function signAccessToken(email: string) {
  return jwt.sign({ email, type: 'access' }, JWT_SECRET, { expiresIn: '15m' })
}

function signRefreshToken(email: string) {
  return jwt.sign({ email, type: 'refresh' }, JWT_SECRET, { expiresIn: '7d' })
}

export function generateTokenPair(email: string) {
  return {
    accessToken: signAccessToken(email),
    refreshToken: signRefreshToken(email),
  }
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload
  } catch {
    return null
  }
}

export function createAuthResponse<T extends object>(body: T, accessToken: string, refreshToken: string) {
  const response = NextResponse.json(body, { status: 200 })

  response.cookies.set('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60, // 15 minutos
    path: '/',
  })

  response.cookies.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 dias
    path: '/',
  })

  return response
}

export async function getAuthPayload(): Promise<TokenPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value
  if (!token) return null
  return verifyToken(token)
}
