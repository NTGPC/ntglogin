import { useEffect, useMemo, useState } from 'react'
import { driversApi, Driver } from '@/api/drivers'
import DriverForm from '@/components/DriverForm'

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Driver | null>(null)

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return drivers.filter((d) => d.name.toLowerCase().includes(q) || d.type.toLowerCase().includes(q))
  }, [drivers, query])

  async function load() {
    try {
      setLoading(true)
      const data = await driversApi.list()
      setDrivers(data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }
  function openEdit(d: Driver) {
    setEditing(d)
    setDialogOpen(true)
  }

  async function onSubmit(data: Partial<Driver>) {
    if (editing) await driversApi.update(editing.id, data)
    else await driversApi.create(data)
    setDialogOpen(false)
    await load()
  }

  async function onDelete(id: number) {
    if (!confirm('Delete this driver?')) return
    await driversApi.remove(id)
    await load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Drivers</h1>
          <p className="text-sm text-slate-500">Manage browser drivers and presets</p>
        </div>
        <button onClick={openCreate} className="h-10 px-4 rounded bg-slate-900 text-white">Create Driver</button>
      </div>

      <div className="flex items-center gap-3">
        <input
          placeholder="Search drivers..."
          value={query}
          onChange={(e)=>setQuery(e.target.value)}
          className="h-10 w-72 rounded border px-3"
        />
      </div>

      <div className="rounded border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-left">
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2">Created</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-3 py-6 text-center" colSpan={6}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td className="px-3 py-6 text-center" colSpan={6}>No drivers</td></tr>
            ) : (
              filtered.map((d) => (
                <tr key={d.id} className="border-t">
                  <td className="px-3 py-2">{d.id}</td>
                  <td className="px-3 py-2 font-medium">{d.name}</td>
                  <td className="px-3 py-2">{d.type}</td>
                  <td className="px-3 py-2 truncate max-w-[400px]">{d.description || '-'}</td>
                  <td className="px-3 py-2">{d.created_at ? new Date(d.created_at).toLocaleString() : '-'}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex gap-2">
                      <button className="px-3 py-1 rounded border" onClick={()=>openEdit(d)}>Edit</button>
                      <button className="px-3 py-1 rounded border text-red-600" onClick={()=>onDelete(d.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {dialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded shadow-lg w-[720px] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editing ? 'Edit Driver' : 'Create Driver'}</h2>
              <button onClick={()=>setDialogOpen(false)} className="text-slate-500">✕</button>
            </div>
            <DriverForm initial={editing || undefined} onSubmit={onSubmit} onCancel={()=>setDialogOpen(false)} />
          </div>
        </div>
      )}
    </div>
  )
}


