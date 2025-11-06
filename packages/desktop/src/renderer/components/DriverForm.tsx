import { useEffect } from 'react'
import { getPresets, Driver } from '@/api/drivers'

interface Props {
  initial?: Partial<Driver>
  onSubmit: (data: Partial<Driver>) => Promise<void> | void
  onCancel: () => void
}

export default function DriverForm({ initial, onSubmit, onCancel }: Props) {
  const presets = getPresets()

  function handlePreset(json: any) {
    const textarea = document.getElementById('driver-config') as HTMLTextAreaElement
    if (textarea) textarea.value = JSON.stringify(json, null, 2)
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const name = String(form.get('name') || '')
    const type = String(form.get('type') || '')
    const description = String(form.get('description') || '')
    const configRaw = String(form.get('config') || '{}')
    let config: any = {}
    try { config = configRaw ? JSON.parse(configRaw) : {} } catch { alert('Invalid JSON config'); return }
    await onSubmit({ name, type, description, config })
  }

  useEffect(() => {
    if (initial?.config) {
      const textarea = document.getElementById('driver-config') as HTMLTextAreaElement
      if (textarea) textarea.value = JSON.stringify(initial.config, null, 2)
    }
  }, [initial])

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Name</label>
          <input name="name" defaultValue={initial?.name || ''} className="w-full h-10 rounded border px-3" required />
        </div>
        <div>
          <label className="block text-sm mb-1">Type</label>
          <select name="type" defaultValue={initial?.type || 'userAgent'} className="w-full h-10 rounded border px-3">
            {['userAgent','viewport','canvas','webgl','audio','fonts','timezone','languages','platform','webrtc','camera'].map((t)=> (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm mb-1">Description</label>
        <input name="description" defaultValue={initial?.description || ''} className="w-full h-10 rounded border px-3" />
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-500">Presets:</span>
        {presets.map((p)=> (
          <button type="button" key={p.name} className="px-2 py-1 rounded border hover:bg-slate-100" onClick={()=>handlePreset(p.config)}>{p.name}</button>
        ))}
      </div>

      <div>
        <label className="block text-sm mb-1">JSON Config</label>
        <textarea id="driver-config" name="config" className="w-full min-h-[200px] rounded border p-3 font-mono text-sm" defaultValue={initial?.config ? JSON.stringify(initial.config, null, 2) : '{\n\n}'} />
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="h-10 px-4 rounded border">Cancel</button>
        <button type="submit" className="h-10 px-4 rounded bg-slate-900 text-white">Save</button>
      </div>
    </form>
  )
}


