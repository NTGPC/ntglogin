import { useEffect, useState } from 'react'

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://127.0.0.1:3000'

export default function ExecutionsPage() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/executions`)
      const data = await res.json()
      setRows(data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Executions</h1>
        <button onClick={load} className="px-3 py-2 border rounded">Refresh</button>
      </div>
      <div className="border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left">
              <th className="p-2">ID</th>
              <th className="p-2">Profile</th>
              <th className="p-2">Workflow</th>
              <th className="p-2">Status</th>
              <th className="p-2">Started</th>
              <th className="p-2">Finished</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r)=> (
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.id}</td>
                <td className="p-2">{r.profile?.name || r.profile_id}</td>
                <td className="p-2">{r.workflow?.name || r.workflow_id}</td>
                <td className="p-2">{r.status}</td>
                <td className="p-2">{r.started_at ? new Date(r.started_at).toLocaleString() : '-'}</td>
                <td className="p-2">{r.completed_at ? new Date(r.completed_at).toLocaleString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}


