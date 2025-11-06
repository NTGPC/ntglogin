import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { workflowsApi, Workflow } from '@/api/workflows'
import { Plus, Edit, Trash2, Workflow as WorkflowIcon } from 'lucide-react'

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    try {
      setLoading(true)
      const data = await workflowsApi.list()
      setWorkflows(data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function onDelete(id: number) {
    if (!confirm('Delete this workflow?')) return
    await workflowsApi.remove(id)
    await load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Workflows</h1>
          <p className="text-sm text-slate-500">Manage automation workflows</p>
        </div>
        <Link to="/workflows/new" className="h-10 px-4 rounded bg-slate-900 text-white flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Workflow
        </Link>
      </div>

      <div className="rounded border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-left">
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Nodes</th>
              <th className="px-3 py-2">Updated</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-3 py-6 text-center" colSpan={5}>Loading...</td></tr>
            ) : workflows.length === 0 ? (
              <tr><td className="px-3 py-6 text-center" colSpan={5}>No workflows</td></tr>
            ) : (
              workflows.map((w) => (
                <tr key={w.id} className="border-t">
                  <td className="px-3 py-2">{w.id}</td>
                  <td className="px-3 py-2 font-medium flex items-center gap-2">
                    <WorkflowIcon className="w-4 h-4 text-blue-600" /> {w.name}
                  </td>
                  <td className="px-3 py-2">{w.data?.nodes?.length || 0} nodes</td>
                  <td className="px-3 py-2">{w.updatedAt ? new Date(w.updatedAt).toLocaleString() : '-'}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex gap-2">
                      <Link to={`/workflows/${w.id}`} className="px-3 py-1 rounded border flex items-center gap-1">
                        <Edit className="w-3 h-3" /> Edit
                      </Link>
                      <button className="px-3 py-1 rounded border text-red-600 flex items-center gap-1" onClick={() => onDelete(w.id)}>
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

