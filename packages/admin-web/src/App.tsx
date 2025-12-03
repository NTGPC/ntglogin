import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { MainLayout } from './components/layout/MainLayout'
import Dashboard from './pages/Dashboard'
import Profiles from './pages/Profiles'
import Proxies from './pages/Proxies'
import Fingerprints from './pages/Fingerprints'
import Settings from './pages/Settings'
import Sessions from './pages/Sessions'
import Jobs from './pages/Jobs'
import Executions from './pages/Executions'
import Workflows from './pages/Workflows'
import WorkflowEditor from './pages/WorkflowEditor'
import AutomationBuilder from './pages/AutomationBuilder'
import ProfileEditor from './components/ProfileEditor/ProfileEditor.jsx'
import TwoFAPage from './pages/TwoFAPage'
import { api } from './lib/api'

function App() {
  // Auto-login with default credentials on app start
  useEffect(() => {
    const autoLogin = async () => {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        try {
          // Auto-login with default credentials
          await api.login('admin', 'admin123')
          console.log('Auto-login successful')
        } catch (error: any) {
          console.error('Auto-login failed:', error)
          // If user doesn't exist (401), try to register first, then login
          if (error.response?.status === 401) {
            try {
              console.log('User "admin" does not exist. Attempting to register...')
              await api.register('admin', 'admin123')
              console.log('Auto-register successful, logging in...')
              await api.login('admin', 'admin123')
              console.log('Auto-login after register successful')
            } catch (registerError: any) {
              console.error('Auto-register/login failed:', registerError)
              if (registerError.response?.status === 400) {
                console.warn('User may already exist but password is wrong, or registration failed')
              }
            }
          }
        }
      }
    }
    autoLogin()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="profiles" element={<Profiles />} />
          <Route path="profiles/editor" element={<ProfileEditor />} />
          <Route path="proxies" element={<Proxies />} />
          <Route path="fingerprints" element={<Fingerprints />} />
          <Route path="settings" element={<Settings />} />
          <Route path="sessions" element={<Sessions />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="executions" element={<Executions />} />
          <Route path="workflows" element={<Workflows />} />
          <Route path="workflows/:id" element={<WorkflowEditor />} />
          <Route path="automation/:profileId" element={<AutomationBuilder />} />
          <Route path="2fa" element={<TwoFAPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App

