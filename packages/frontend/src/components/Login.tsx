import { useState } from 'react'
import api from '../utils/api'
import { setToken } from '../utils/auth'

interface LoginProps {
  onLogin: () => void
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.post('/api/auth/login', { username, password })
      const token = response.data.data.token
      setToken(token)
      onLogin()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>NTG Login</h1>
        <h2>Sign in to your account</h2>
        <form onSubmit={handleSubmit}>
          {error && <div className="error">{error}</div>}
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
      <style>{`
        .login-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .login-box {
          background: white;
          padding: 40px;
          border-radius: 10px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          width: 400px;
        }
        .login-box h1 {
          color: #333;
          margin-bottom: 10px;
        }
        .login-box h2 {
          color: #666;
          font-size: 16px;
          font-weight: normal;
          margin-bottom: 30px;
        }
        .form-group {
          margin-bottom: 20px;
        }
        .form-group label {
          display: block;
          margin-bottom: 5px;
          color: #333;
          font-weight: 500;
        }
        .form-group input {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 5px;
          font-size: 16px;
        }
        .form-group input:focus {
          outline: none;
          border-color: #667eea;
        }
        button {
          width: 100%;
          padding: 12px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 5px;
          font-size: 16px;
          cursor: pointer;
          font-weight: 600;
        }
        button:hover:not(:disabled) {
          background: #5568d3;
        }
        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .error {
          background: #fee;
          color: #c33;
          padding: 10px;
          border-radius: 5px;
          margin-bottom: 20px;
        }
      `}</style>
    </div>
  )
}

