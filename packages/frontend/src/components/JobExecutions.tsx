import { useState, useEffect } from 'react'
import api from '../utils/api'

interface JobExecution {
  id: number
  job_id: number
  profile_id: number
  session_id: number | null
  status: string
  started_at: string | null
  completed_at: string | null
  result: any
  error: string | null
}

export default function JobExecutions() {
  const [executions, setExecutions] = useState<JobExecution[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedJobId, setSelectedJobId] = useState<string>('')

  useEffect(() => {
    fetchExecutions()
  }, [selectedJobId])

  const fetchExecutions = async () => {
    try {
      const url = selectedJobId
        ? `/api/job-executions?jobId=${selectedJobId}`
        : '/api/job-executions'
      const response = await api.get(url)
      setExecutions(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch job executions:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">Loading job executions...</div>
  }

  return (
    <div className="page-container">
      <div className="container">
        <div className="page-header">
          <h1>Job Executions</h1>
          <div className="filter-group">
            <input
              type="number"
              placeholder="Filter by Job ID"
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="filter-input"
            />
            {selectedJobId && (
              <button
                onClick={() => setSelectedJobId('')}
                className="btn-secondary"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Job ID</th>
                <th>Profile ID</th>
                <th>Status</th>
                <th>Started</th>
                <th>Completed</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {executions.map((exec) => (
                <tr key={exec.id}>
                  <td>{exec.id}</td>
                  <td>{exec.job_id}</td>
                  <td>{exec.profile_id}</td>
                  <td>
                    <span className={`status-badge status-${exec.status}`}>
                      {exec.status}
                    </span>
                  </td>
                  <td>
                    {exec.started_at
                      ? new Date(exec.started_at).toLocaleString()
                      : '-'}
                  </td>
                  <td>
                    {exec.completed_at
                      ? new Date(exec.completed_at).toLocaleString()
                      : '-'}
                  </td>
                  <td>
                    {exec.result?.screenshot ? (
                      <a
                        href={`http://localhost:3000/${exec.result.screenshot}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link"
                      >
                        View Screenshot
                      </a>
                    ) : exec.error ? (
                      <span className="error-text" title={exec.error}>
                        Error
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {executions.length === 0 && (
            <div className="empty-state">
              <p>No job executions found</p>
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
        .filter-group {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .filter-input {
          padding: 10px 15px;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          font-size: 14px;
          width: 200px;
        }
        .filter-input:focus {
          outline: none;
          border-color: #667eea;
        }
        .btn-secondary {
          padding: 10px 20px;
          background: #f0f0f0;
          color: #333;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
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
        .status-pending {
          background: #fff3cd;
          color: #856404;
        }
        .status-running {
          background: #d1ecf1;
          color: #0c5460;
        }
        .status-completed {
          background: #d4edda;
          color: #155724;
        }
        .status-failed {
          background: #f8d7da;
          color: #721c24;
        }
        .link {
          color: #667eea;
          text-decoration: none;
          font-weight: 500;
        }
        .link:hover {
          text-decoration: underline;
        }
        .error-text {
          color: #dc3545;
          font-weight: 500;
        }
        .empty-state {
          padding: 60px 20px;
          text-align: center;
          color: #6c757d;
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

