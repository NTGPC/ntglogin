import { useState, useEffect } from 'react'
import api from '../utils/api'

interface Proxy {
  id: number
  host: string
  port: number
  username: string | null
  type: string
  active: boolean
}

export default function Proxies() {
  const [proxies, setProxies] = useState<Proxy[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    host: '',
    port: 8080,
    username: '',
    password: '',
    type: 'http',
  })

  useEffect(() => {
    fetchProxies()
  }, [])

  const fetchProxies = async () => {
    try {
      const response = await api.get('/api/proxies')
      setProxies(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch proxies:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/api/proxies', formData)
      setShowModal(false)
      setFormData({ host: '', port: 8080, username: '', password: '', type: 'http' })
      fetchProxies()
    } catch (error) {
      console.error('Failed to create proxy:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure?')) return
    try {
      await api.delete(`/api/proxies/${id}`)
      fetchProxies()
    } catch (error) {
      console.error('Failed to delete proxy:', error)
    }
  }

  if (loading) {
    return <div className="loading">Loading proxies...</div>
  }

  return (
    <div className="proxies">
      <div className="container">
        <div className="header">
          <h1>Proxies</h1>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            + Add Proxy
          </button>
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>Create Proxy</h2>
              <form onSubmit={handleCreate}>
                <div className="form-group">
                  <label>Host</label>
                  <input
                    type="text"
                    value={formData.host}
                    onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Port</label>
                  <input
                    type="number"
                    value={formData.port}
                    onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="http">HTTP</option>
                    <option value="socks5">SOCKS5</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
                <div className="form-actions">
                  <button type="submit">Create</button>
                  <button type="button" onClick={() => setShowModal(false)}>
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
                <th>Host</th>
                <th>Port</th>
                <th>Type</th>
                <th>Username</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {proxies.map((proxy) => (
                <tr key={proxy.id}>
                  <td>{proxy.id}</td>
                  <td>{proxy.host}</td>
                  <td>{proxy.port}</td>
                  <td>{proxy.type}</td>
                  <td>{proxy.username || '-'}</td>
                  <td>
                    <span className={`status ${proxy.active ? 'active' : 'inactive'}`}>
                      {proxy.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleDelete(proxy.id)}
                      className="btn-danger"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {proxies.length === 0 && (
            <div className="empty-state">No proxies found</div>
          )}
        </div>
      </div>
      <style>{`
        .proxies {
          padding: 20px;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .header h1 {
          color: #333;
        }
        .btn-primary {
          padding: 10px 20px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-weight: 500;
        }
        .btn-danger {
          padding: 5px 15px;
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
        }
        .table-container {
          background: white;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th {
          background: #f8f9fa;
          padding: 15px;
          text-align: left;
          font-weight: 600;
        }
        td {
          padding: 15px;
          border-top: 1px solid #eee;
        }
        .status {
          padding: 5px 10px;
          border-radius: 5px;
          font-size: 12px;
          font-weight: 500;
        }
        .status.active {
          background: #d4edda;
          color: #155724;
        }
        .status.inactive {
          background: #f8d7da;
          color: #721c24;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        .modal {
          background: white;
          padding: 30px;
          border-radius: 10px;
          width: 500px;
          max-width: 90vw;
        }
        .form-group {
          margin-bottom: 15px;
        }
        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
        }
        .form-group input,
        .form-group select {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 5px;
        }
        .form-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }
        .form-actions button {
          flex: 1;
          padding: 10px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-weight: 500;
        }
        .form-actions button[type="submit"] {
          background: #667eea;
          color: white;
        }
        .form-actions button[type="button"] {
          background: #f0f0f0;
        }
        .empty-state {
          padding: 40px;
          text-align: center;
          color: #666;
        }
      `}</style>
    </div>
  )
}

