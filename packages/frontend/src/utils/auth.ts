export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

export const getToken = (): string | null => {
  return localStorage.getItem('token')
}

export const setToken = (token: string): void => {
  localStorage.setItem('token', token)
}

export const removeToken = (): void => {
  localStorage.removeItem('token')
}

