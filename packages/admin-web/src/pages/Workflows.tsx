import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Edit, Trash2, Workflow as WorkflowIcon, RefreshCw } from 'lucide-react'
import { apiRequest } from '../utils/api'; // Import API

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const res = await apiRequest('/workflows', 'GET');
    if (res.success) setWorkflows(res.data);
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const onDelete = async (id: number) => {
    if (!confirm('Xóa workflow này?')) return
    const res = await apiRequest(`/workflows/${id}`, 'DELETE');
    if (res.success) load();
  }

  return (
    <div className="space-y-6 p-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workflows</h1>
          <p className="text-muted-foreground">Manage automation workflows</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 border rounded hover:bg-slate-50"><RefreshCw size={20} /></button>
          <Link to="/dashboard/workflows/new" className="flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">
            <Plus className="h-4 w-4" /> Create Workflow
          </Link>
        </div>
      </div>

      <div className="rounded-md border bg-white shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-slate-50 text-left">
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Nodes</th>
              <th className="px-4 py-3 font-medium">Updated</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-6 text-center" colSpan={5}>Loading from Docker...</td></tr>
            ) : workflows.length === 0 ? (
              <tr><td className="px-4 py-6 text-center" colSpan={5}>No workflows found</td></tr>
            ) : (
              workflows.map((w) => (
                <tr key={w.id} className="border-b hover:bg-slate-50">
                  <td className="px-4 py-3">{w.id}</td>
                  <td className="px-4 py-3 font-medium flex items-center gap-2">
                    <WorkflowIcon className="w-4 h-4 text-blue-600" /> {w.name}
                  </td>
                  <td className="px-4 py-3">
                    {/* Đếm số node */}
                    {(() => {
                      try { return JSON.parse(w.nodes).length } catch { return 0 }
                    })()} nodes
                  </td>
                  <td className="px-4 py-3">{new Date(w.updatedAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2 justify-end">
                      <Link to={`/dashboard/workflows/${w.id}`} className="rounded border px-3 py-1 text-sm flex items-center gap-1 hover:bg-blue-50 text-blue-600">
                        <Edit className="w-3 h-3" /> Edit
                      </Link>
                      <button className="rounded border px-3 py-1 text-sm text-red-600 flex items-center gap-1 hover:bg-red-50" onClick={() => onDelete(w.id)}>
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
