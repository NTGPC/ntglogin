import { useEffect, useState } from 'react'
import { workflowsApi } from '@/api/workflows'

export default function N8nWorkflowsPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selProfiles, setSelProfiles] = useState<string>('')
  const [payload, setPayload] = useState<string>('{}')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const list = await workflowsApi.listWorkflows()
      setItems(list)
    } finally { setLoading(false) }
  }

  async function sync() {
    await workflowsApi.importFromN8n()
    await load()
  }

  async function run(id: number) {
    try {
      const profileIds = selProfiles.split(',').map(s=>Number(s.trim())).filter(Boolean)
      const data = payload ? JSON.parse(payload) : {}
      await workflowsApi.runWorkflow(id, profileIds, data)
      alert('Enqueued')
    } catch (e: any) {
      alert(e?.message || 'Run failed')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Workflows (n8n)</h1>
        <div className="flex gap-2">
          <button onClick={sync} className="px-3 py-2 border rounded">Sync from n8n</button>
        </div>
      </div>
      <div className="mb-3 text-xs text-muted-foreground">
        Profiles: enter comma-separated profile IDs to run
      </div>
      <div className="flex gap-2 mb-4">
        <input value={selProfiles} onChange={e=>setSelProfiles(e.target.value)} placeholder="e.g. 1,2,3" className="border rounded px-2 h-9 w-64" />
        <input value={payload} onChange={e=>setPayload(e.target.value)} placeholder='{"message":"Hello"}' className="border rounded px-2 h-9 flex-1" />
      </div>
      <div className="border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left">
              <th className="p-2">Name</th>
              <th className="p-2">n8n ID</th>
              <th className="p-2">Updated</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it)=> (
              <tr key={it.id} className="border-t">
                <td className="p-2">{it.name}</td>
                <td className="p-2">{it.n8nWorkflowId || '-'}</td>
                <td className="p-2">{new Date(it.updatedAt).toLocaleString()}</td>
                <td className="p-2">
                  <button onClick={()=>run(it.id)} className="px-2 py-1 border rounded">Run</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}


