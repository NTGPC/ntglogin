
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
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
import SocialAnalyticsPage from './pages/SocialAnalyticsPage'
import VideoEditorPage from './pages/VideoEditorPage'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import UserManagement from './pages/UserManagement'

const PrivateRoute = ({ children }: any) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }>
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
            <Route path="social-analytics" element={<SocialAnalyticsPage />} />
            <Route path="video-editor" element={<VideoEditorPage />} />
            <Route path="users" element={<UserManagement />} />
          </Route>
        </Routes>
      </AuthProvider>
    </HashRouter>
  )
}

export default App
