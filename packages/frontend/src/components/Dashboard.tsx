import { useState, useEffect } from 'react'
import api from '../utils/api'

export default function Dashboard() {
  const [stats, setStats] = useState({
    profiles: 0,
    proxies: 0,
    sessions: 0,
    jobs: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [profilesRes, proxiesRes, sessionsRes, jobsRes] = await Promise.all([
        api.get('/api/profiles'),
        api.get('/api/proxies'),
        api.get('/api/sessions'),
        api.get('/api/jobs'),
      ])

      setStats({
        profiles: profilesRes.data.data?.length || 0,
        proxies: proxiesRes.data.data?.length || 0,
        sessions: sessionsRes.data.data?.length || 0,
        jobs: jobsRes.data.data?.length || 0,
      })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">Loading dashboard...</div>
  }

  return (
    <div className="dashboard">
      <div className="container">
        <h1>Dashboard</h1>
        <div className="stats-grid">
          <div className="stat-card">
            <h2>{stats.profiles}</h2>
            <p>Profiles</p>
          </div>
          <div className="stat-card">
            <h2>{stats.proxies}</h2>
            <p>Proxies</p>
          </div>
          <div className="stat-card">
            <h2>{stats.sessions}</h2>
            <p>Sessions</p>
          </div>
          <div className="stat-card">
            <h2>{stats.jobs}</h2>
            <p>Jobs</p>
          </div>
        </div>
      </div>
      <style>{`
        .dashboard {
          padding: 20px;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
        }
        .dashboard h1 {
          margin-bottom: 30px;
          color: #333;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }
        .stat-card {
          background: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          text-align: center;
        }
        .stat-card h2 {
          font-size: 48px;
          color: #667eea;
          margin-bottom: 10px;
        }
        .stat-card p {
          color: #666;
          font-size: 18px;
        }
        .loading {
          text-align: center;
          padding: 50px;
          font-size: 18px;
          color: #666;
        }
      `}</style>
    </div>
  )
}

