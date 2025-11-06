import { useState, useEffect } from 'react'
import api from '../utils/api'

interface Profile {
  id: number
  name: string
  user_agent: string | null
  fingerprint: any
  created_at: string
}

export default function Profiles() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ name: '', user_agent: '', fingerprint: {} })

  useEffect(() => {
    fetchProfiles()
  }, [])

  const fetchProfiles = async () => {
    try {
      const response = await api.get('/api/profiles')
      setProfiles(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch profiles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/api/profiles', formData)
      setShowModal(false)
      setFormData({ name: '', user_agent: '', fingerprint: {} })
      fetchProfiles()
    } catch (error) {
      console.error('Failed to create profile:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure?')) return
    try {
      await api.delete(`/api/profiles/${id}`)
      fetchProfiles()
    } catch (error) {
      console.error('Failed to delete profile:', error)
    }
  }

  if (loading) {
    return <div className="loading">Loading profiles...</div>
  }

  return (
    <div className="profiles">
      <div className="container">
        <div className="header">
          <h1>Profiles</h1>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            + Add Profile
          </button>
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>Create Profile</h2>
              <form onSubmit={handleCreate}>
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>User Agent</label>
                  <input
                    type="text"
                    value={formData.user_agent}
                    onChange={(e) => setFormData({ ...formData, user_agent: e.target.value })}
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
                <th>Name</th>
                <th>User Agent</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => (
                <tr key={profile.id}>
                  <td>{profile.id}</td>
                  <td>{profile.name}</td>
                  <td className="truncate">{profile.user_agent || '-'}</td>
                  <td>{new Date(profile.created_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      onClick={() => handleDelete(profile.id)}
                      className="btn-danger"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {profiles.length === 0 && (
            <div className="empty-state">No profiles found</div>
          )}
        </div>
      </div>
      <style>{`
        .profiles {
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
        .btn-primary:hover {
          background: #5568d3;
        }
        .btn-danger {
          padding: 5px 15px;
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
        }
        .btn-danger:hover {
          background: #c82333;
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
          color: #333;
        }
        td {
          padding: 15px;
          border-top: 1px solid #eee;
        }
        .truncate {
          max-width: 300px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .empty-state {
          padding: 40px;
          text-align: center;
          color: #666;
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
        .modal h2 {
          margin-bottom: 20px;
        }
        .form-group {
          margin-bottom: 15px;
        }
        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
        }
        .form-group input {
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
      `}</style>
    </div>
  )
}

