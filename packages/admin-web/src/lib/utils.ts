import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parse proxy string in format: host:port:username:password
 * Returns parsed proxy data or null if invalid
 */
export function parseProxyString(proxyString: string): {
  host: string
  port: number
  username: string
  password: string
} | null {
  const trimmed = proxyString.trim()
  if (!trimmed) return null

  // Split by colon
  const parts = trimmed.split(':')
  
  // Must have at least 4 parts (host:port:username:password)
  if (parts.length < 4) return null

  const host = parts[0].trim()
  const portStr = parts[1].trim()
  const username = parts[2].trim()
  const password = parts.slice(3).join(':').trim() // Join remaining parts in case password contains colons

  // Validate host
  if (!host) return null

  // Validate port
  const port = parseInt(portStr, 10)
  if (isNaN(port) || port < 1 || port > 65535) return null

  return {
    host,
    port,
    username,
    password,
  }
}

