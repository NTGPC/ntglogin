import { useState, useEffect } from 'react'
import api from '../utils/api'
import { Link } from 'react-router-dom'

interface Job {
  id: number
  type: string
  payload: any
  status: string
  attempts: number
  created_at: string
}

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    type: 'run_job_execution',
    url: 'https://example.com',
    profile_ids: '',
  })

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      const response = await api.get('/api/jobs')
      setJobs(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const profileIds = formData.profile_ids
        .split(',')
        .map((id) => parseInt(id.trim()))
        .filter((id) => !isNaN(id))

      const payload = {
        type: formData.type,
        payload: {
          url: formData.url,
        },
        profile_ids: profileIds.length > 0 ? profileIds : undefined,
      }

      await api.post('/api/jobs', payload)
      setShowModal(false)
      setFormData({ type: 'run_job_execution', url: 'https://example.com', profile_ids: '' })
      fetchJobs()
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to create job')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this job?')) return
    try {
      await api.delete(`/api/jobs/${id}`)
      fetchJobs()
    } catch (error) {
      console.error('Failed to delete job:', error)
    }
  }

  if (loading) {
    return <div className="loading">Loading jobs...</div>
  }

  return (
    <div className="page-container">
      <div className="container">
        <div className="page-header">
          <h1>Jobs</h1>
          <div className="header-actions">
            <button onClick={() => setShowModal(true)} className="btn-primary">
              + Create Job
            </button>
            <Link to="/job-executions" className="btn-secondary">
              View Executions
            </Link>
          </div>
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>Create New Job</h2>
              <form onSubmit={handleCreate}>
                <div className="form-group">
                  <label>Job Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                  >
                    <option value="run_job_execution">Run Job Execution</option>
                    <option value="start_session">Start Session</option>
                    <option value="stop_session">Stop Session</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>URL *</label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://example.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Profile IDs (comma-separated, optional)</label>
                  <input
                    type="text"
                    value={formData.profile_ids}
                    onChange={(e) => setFormData({ ...formData, profile_ids: e.target.value })}
                    placeholder="1, 2, 3"
                  />
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
                <th>Type</th>
                <th>Status</th>
                <th>Attempts</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td>{job.id}</td>
                  <td>
                    <span className="job-type">{job.type}</span>
                  </td>
                  <td>
                    <span className={`status-badge status-${job.status}`}>
                      {job.status}
                    </span>
                  </td>
                  <td>{job.attempts}</td>
                  <td>{new Date(job.created_at).toLocaleString()}</td>
                  <td>
                    <div className="action-buttons">
                      <Link
                        to={`/job-executions?jobId=${job.id}`}
                        className="btn-info btn-sm"
                      >
                        View Executions
                      </Link>
                      <button
                        onClick={() => handleDelete(job.id)}
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
          {jobs.length === 0 && (
            <div className="empty-state">
              <p>No jobs found. Create one to get started!</p>
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
          flex-wrap: wrap;
          gap: 15px;
        }
        .page-header h1 {
          color: #1a1a1a;
          font-size: 32px;
          font-weight: 700;
        }
        .header-actions {
          display: flex;
          gap: 12px;
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
          text-decoration: none;
          display: inline-block;
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
          text-decoration: none;
          display: inline-block;
        }
        .btn-info {
          background: #17a2b8;
          color: white;
          padding: 6px 12px;
          border-radius: 6px;
          text-decoration: none;
          font-size: 12px;
          font-weight: 500;
        }
        .btn-danger {
          background: #dc3545;
          color: white;
          padding: 6px 12px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
        }
        .btn-sm {
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
        .job-type {
          font-family: 'Courier New', monospace;
          background: #f8f9fa;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
        }
        .status-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .status-queued {
          background: #fff3cd;
          color: #856404;
        }
        .status-processing {
          background: #d1ecf1;
          color: #0c5460;
        }
        .status-done {
          background: #d4edda;
          color: #155724;
        }
        .status-failed {
          background: #f8d7da;
          color: #721c24;
        }
        .action-buttons {
          display: flex;
          gap: 8px;
          align-items: center;
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
