import { Routes, Route, NavLink } from 'react-router-dom'
import DriversPage from './pages/DriversPage'
import WorkflowsPage from './pages/WorkflowsPage'
import WorkflowEditorPage from './pages/WorkflowEditorPage'
import N8nWorkflowsPage from './pages/N8nWorkflowsPage'
import ExecutionsPage from './pages/ExecutionsPage'

function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-full w-56 border-r bg-white">
      <div className="h-14 flex items-center px-4 font-semibold">NTG Desktop</div>
      <nav className="px-3 space-y-1">
        <NavLink to="/drivers" className={({isActive})=>`block px-3 py-2 rounded ${isActive?'bg-slate-900 text-white':'hover:bg-slate-100'}`}>Drivers</NavLink>
        <NavLink to="/workflows" className={({isActive})=>`block px-3 py-2 rounded ${isActive?'bg-slate-900 text-white':'hover:bg-slate-100'}`}>Editor Workflows</NavLink>
        <NavLink to="/n8n-workflows" className={({isActive})=>`block px-3 py-2 rounded ${isActive?'bg-slate-900 text-white':'hover:bg-slate-100'}`}>Workflows (n8n)</NavLink>
        <NavLink to="/executions" className={({isActive})=>`block px-3 py-2 rounded ${isActive?'bg-slate-900 text-white':'hover:bg-slate-100'}`}>Executions</NavLink>
      </nav>
    </aside>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className="ml-56 p-6">
        <Routes>
          <Route path="/drivers" element={<DriversPage />} />
          <Route path="/workflows" element={<WorkflowsPage />} />
          <Route path="/n8n-workflows" element={<N8nWorkflowsPage />} />
          <Route path="/executions" element={<ExecutionsPage />} />
          <Route path="/workflows/:id" element={<WorkflowEditorPage />} />
          <Route path="*" element={<DriversPage />} />
        </Routes>
      </main>
    </div>
  )
}


