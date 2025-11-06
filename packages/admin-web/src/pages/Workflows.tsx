import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { workflowsApi, Workflow } from '@/lib/workflows'
import { Plus, Edit, Trash2, Workflow as WorkflowIcon } from 'lucide-react'

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    try {
      setLoading(true)
      const data = await workflowsApi.list()
      setWorkflows(data || [])
    } catch (err) {
      console.error('Failed to load workflows:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function onDelete(id: number) {
    if (!confirm('Delete this workflow?')) return
    try {
      await workflowsApi.remove(id)
      await load()
    } catch (err) {
      console.error('Failed to delete workflow:', err)
      alert('Failed to delete workflow')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workflows</h1>
          <p className="text-muted-foreground">Manage automation workflows</p>
        </div>
        <Link to="/workflows/new" className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Create Workflow
        </Link>
      </div>

      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-3 text-left text-sm font-medium">ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Nodes</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Updated</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-6 text-center" colSpan={5}>Loading...</td></tr>
            ) : workflows.length === 0 ? (
              <tr><td className="px-4 py-6 text-center" colSpan={5}>No workflows</td></tr>
            ) : (
              workflows.map((w) => (
                <tr key={w.id} className="border-b">
                  <td className="px-4 py-3">{w.id}</td>
                  <td className="px-4 py-3 font-medium flex items-center gap-2">
                    <WorkflowIcon className="w-4 h-4 text-blue-600" /> {w.name}
                  </td>
                  <td className="px-4 py-3">{w.data?.nodes?.length || 0} nodes</td>
                  <td className="px-4 py-3">{w.updatedAt ? new Date(w.updatedAt).toLocaleString() : '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <Link to={`/workflows/${w.id}`} className="rounded border px-3 py-1 text-sm flex items-center gap-1">
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

