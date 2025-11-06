import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { Outlet, useLocation } from 'react-router-dom'

export function MainLayout() {
  const location = useLocation()
  const isWorkflowEditor = location.pathname.includes('/workflows/')
  
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:ml-64">
        <Topbar />
        <main className={isWorkflowEditor ? '' : 'p-6'}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

