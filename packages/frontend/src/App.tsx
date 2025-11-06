import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import Profiles from './components/Profiles'
import Proxies from './components/Proxies'
import Sessions from './components/Sessions'
import Jobs from './components/Jobs'
import JobExecutions from './components/JobExecutions'
import Navbar from './components/Navbar'
import { getToken } from './utils/auth'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    setIsAuthenticated(!!token)
    setLoading(false)
  }, [])

  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setIsAuthenticated(false)
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <Router>
      <div className="app">
        {isAuthenticated && <Navbar onLogout={handleLogout} />}
        <Routes>
          <Route
            path="/login"
            element={
              isAuthenticated ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
            }
          />
          <Route
            path="/"
            element={
              isAuthenticated ? <Dashboard /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/profiles"
            element={
              isAuthenticated ? <Profiles /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/proxies"
            element={
              isAuthenticated ? <Proxies /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/sessions"
            element={
              isAuthenticated ? <Sessions /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/jobs"
            element={
              isAuthenticated ? <Jobs /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/job-executions"
            element={
              isAuthenticated ? <JobExecutions /> : <Navigate to="/login" />
            }
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App

