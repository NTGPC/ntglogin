import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import WebLayout from './layouts/WebLayout';
import AdminLayout from './layouts/AdminLayout';

// Web Pages
import Home from './pages/web/Home';
import Pricing from './pages/web/Pricing';
import Download from './pages/web/Download';

// App Pages (Admin Tools)
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EditRatio from './pages/EditRatio';
import UserManagement from './pages/UserManagement';
import AutomationBuilder from './pages/AutomationBuilder';

// Import Các Trang Cũ (Đã có sẵn trong folder pages)
import Profiles from './pages/Profiles';
import Proxies from './pages/Proxies';
import Fingerprints from './pages/Fingerprints';
import Settings from './pages/Settings';
import Sessions from './pages/Sessions';
import Jobs from './pages/Jobs';
import Executions from './pages/Executions';
import Workflows from './pages/Workflows';
import TwoFAPage from './pages/TwoFAPage';
import SocialAnalyticsPage from './pages/SocialAnalyticsPage';
import VideoEditorPage from './pages/VideoEditorPage';
import WorkflowEditor from './pages/WorkflowEditor';

// Component bảo vệ (Tạm thời cho qua để test)
const PrivateRoute = ({ children }: { children: any }) => {
  return children;
};

function App() {
  return (
    <HashRouter>
      <Routes>
        {/* 1. WEB KHÁCH */}
        <Route path="/" element={<WebLayout />}>
          <Route index element={<Home />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="download" element={<Download />} />
        </Route>

        {/* 2. LOGIN */}
        <Route path="/login" element={<Login />} />

        {/* 3. ADMIN DASHBOARD */}
        <Route path="/dashboard" element={<PrivateRoute><AdminLayout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />

          {/* Các chức năng cũ */}
          <Route path="profiles" element={<Profiles />} />
          <Route path="proxies" element={<Proxies />} />
          <Route path="fingerprints" element={<Fingerprints />} />
          <Route path="settings" element={<Settings />} />
          <Route path="sessions" element={<Sessions />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="executions" element={<Executions />} />
          <Route path="workflows" element={<Workflows />} />
          <Route path="workflows/:id" element={<WorkflowEditor />} />

          {/* Các tool đặc biệt */}
          <Route path="2fa" element={<TwoFAPage />} />
          <Route path="social-analytics" element={<SocialAnalyticsPage />} />
          <Route path="video-editor" element={<VideoEditorPage />} />

          {/* Các chức năng mới */}
          <Route path="edit-ratio" element={<EditRatio />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="automation/:profileId?" element={<AutomationBuilder />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
