import { useState, useEffect } from 'react'
import api from '../utils/api'

interface Session {
  id: number
  profile_id: number
  proxy_id: number | null
  status: string
  started_at: string | null
  stopped_at: string | null
  profile?: { id: number; name: string }
  proxy?: { id: number; host: string; port: number }
}

interface Profile {
  id: number
  name: string
}

interface Proxy {
  id: number
  host: string
  port: number
}

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [proxies, setProxies] = useState<Proxy[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    profile_id: '',
    proxy_id: '',
    status: 'idle',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [sessionsRes, profilesRes, proxiesRes] = await Promise.all([
        api.get('/api/sessions'),
        api.get('/api/profiles'),
        api.get('/api/proxies'),
      ])
      setSessions(sessionsRes.data.data || [])
      setProfiles(profilesRes.data.data || [])
      setProxies(proxiesRes.data.data || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload: any = {
        profile_id: parseInt(formData.profile_id),
        status: 'running',
      }
      if (formData.proxy_id) {
        payload.proxy_id = parseInt(formData.proxy_id)
      }
      await api.post('/api/sessions', payload)
      setShowModal(false)
      setFormData({ profile_id: '', proxy_id: '', status: 'idle' })
      fetchData()
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to create session')
    }
  }

  const handleStop = async (id: number) => {
    if (!confirm('Are you sure you want to stop this session?')) return
    try {
      await api.post(`/api/sessions/${id}/stop`)
      fetchData()
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to stop session')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this session?')) return
    try {
      await api.delete(`/api/sessions/${id}`)
      fetchData()
    } catch (error) {
      console.error('Failed to delete session:', error)
    }
  }

  if (loading) {
    return <div className="loading">Loading sessions...</div>
  }

  return (
    <div className="page-container">
      <div className="container">
        <div className="page-header">
          <h1>Sessions</h1>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            + Create Session
          </button>
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>Create New Session</h2>
              <form onSubmit={handleCreate}>
                <div className="form-group">
                  <label>Profile *</label>
                  <select
                    value={formData.profile_id}
                    onChange={(e) => setFormData({ ...formData, profile_id: e.target.value })}
                    required
                  >
                    <option value="">Select a profile</option>
                    {profiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Proxy (Optional)</label>
                  <select
                    value={formData.proxy_id}
                    onChange={(e) => setFormData({ ...formData, proxy_id: e.target.value })}
                  >
                    <option value="">No proxy</option>
                    {proxies.filter(p => p).map((proxy) => (
                      <option key={proxy.id} value={proxy.id}>
                        {proxy.host}:{proxy.port}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-primary">Create</button>
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Profile</th>
                <th>Proxy</th>
                <th>Status</th>
                <th>Started</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id}>
                  <td>{session.id}</td>
                  <td>{session.profile?.name || `Profile #${session.profile_id}`}</td>
                  <td>
                    {session.proxy
                      ? `${session.proxy.host}:${session.proxy.port}`
                      : 'No proxy'}
                  </td>
                  <td>
                    <span className={`status-badge status-${session.status}`}>
                      {session.status}
                    </span>
                  </td>
                  <td>
                    {session.started_at
                      ? new Date(session.started_at).toLocaleString()
                      : '-'}
                  </td>
                  <td>
                    <div className="action-buttons">
                      {session.status === 'running' && (
                        <button
                          onClick={() => handleStop(session.id)}
                          className="btn-warning btn-sm"
                        >
                          Stop
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(session.id)}
                        className="btn-danger btn-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sessions.length === 0 && (
            <div className="empty-state">
              <p>No sessions found. Create one to get started!</p>
            </div>
          )}
        </div>
      </div>
      <style>{`
        .page-container {
          padding: 20px;
          min-height: calc(100vh - 80px);
        }
        .container {
          max-width: 1400px;
          margin: 0 auto;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }
        .page-header h1 {
          color: #1a1a1a;
          font-size: 32px;
          font-weight: 700;
        }
        .btn-primary {
          padding: 12px 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        .btn-secondary {
          padding: 12px 24px;
          background: #f0f0f0;
          color: #333;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
        }
        .btn-warning {
          background: #ffc107;
          color: #333;
        }
        .btn-danger {
          background: #dc3545;
          color: white;
        }
        .btn-sm {
          padding: 6px 12px;
          font-size: 12px;
          margin-right: 5px;
        }
        .table-container {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th {
          background: #f8f9fa;
          padding: 16px;
          text-align: left;
          font-weight: 600;
          color: #495057;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        td {
          padding: 16px;
          border-top: 1px solid #e9ecef;
          color: #495057;
        }
        .status-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .status-running {
          background: #d4edda;
          color: #155724;
        }
        .status-idle {
          background: #fff3cd;
          color: #856404;
        }
        .status-stopped {
          background: #f8d7da;
          color: #721c24;
        }
        .action-buttons {
          display: flex;
          gap: 8px;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }
        .modal {
          background: white;
          padding: 32px;
          border-radius: 16px;
          width: 500px;
          max-width: 90vw;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }
        .modal h2 {
          margin-bottom: 24px;
          color: #1a1a1a;
          font-size: 24px;
        }
        .form-group {
          margin-bottom: 20px;
        }
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #495057;
          font-size: 14px;
        }
        .form-group select,
        .form-group input {
          width: 100%;
          padding: 12px;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.2s;
        }
        .form-group select:focus,
        .form-group input:focus {
          outline: none;
          border-color: #667eea;
        }
        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }
        .form-actions button {
          flex: 1;
        }
        .empty-state {
          padding: 60px 20px;
          text-align: center;
          color: #6c757d;
        }
        .empty-state p {
          font-size: 16px;
        }
        .loading {
          text-align: center;
          padding: 50px;
          font-size: 18px;
          color: #6c757d;
        }
      `}</style>
    </div>
  )
}
