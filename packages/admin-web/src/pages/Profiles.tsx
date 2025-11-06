import { useEffect, useState } from 'react'
import { api, apiClient, Profile, Proxy } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Plus, Edit, Trash2, Play, Search } from 'lucide-react'

const fpSchema = z.object({
  userAgent: z.string().optional(),
  viewport: z
    .object({
      width: z.number().int().positive().default(1366),
      height: z.number().int().positive().default(768),
      deviceScaleFactor: z.number().min(0.5).max(5).default(1),
    })
    .optional(),
  locale: z.string().optional(),
  timezoneId: z.string().optional(),
  geolocation: z
    .object({
      longitude: z.number().min(-180).max(180),
      latitude: z.number().min(-90).max(90),
      accuracy: z.number().min(0).max(1000).optional(),
    })
    .optional(),
  colorScheme: z.enum(['light', 'dark']).optional(),
  isMobile: z.boolean().optional(),
  hasTouch: z.boolean().optional(),
  reducedMotion: z.enum(['no-preference', 'reduce']).optional(),
  permissions: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  proxyId: z.union([z.string(), z.number()]).optional(),
  notes: z.string().optional(),
  canvas: z
    .object({
      mode: z.enum(['real', 'noise', 'off', 'block']).default('real'),
      seed: z.string().optional(),
    })
    .optional(),
  clientRects: z
    .object({
      mode: z.enum(['off', 'noise']).default('off'),
    })
    .optional(),
  webgl: z
    .object({
      image: z.enum(['off', 'noise']).optional(),
      metadata: z.enum(['mask', 'real']).optional(),
      vendor: z.string().optional(),
      renderer: z.string().optional(),
    })
    .optional(),
  audioContext: z
    .object({
      mode: z.enum(['off', 'noise']).default('off'),
    })
    .optional(),
})

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  user_agent: z.string().optional(),
  fingerprint: fpSchema.optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

export default function Profiles() {
  const SHOW_WORKFLOWS = false
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [proxies, setProxies] = useState<Proxy[]>([])
  const [workflows, setWorkflows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [startDialogOpen, setStartDialogOpen] = useState(false)
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null)
  const [startingProfile, setStartingProfile] = useState<Profile | null>(null)
  const [selectedProxyId, setSelectedProxyId] = useState<number | undefined>(undefined)
  const [currentPage, setCurrentPage] = useState(1)
  const [fingerprintText, setFingerprintText] = useState('')
  const [runWorkflowDialogOpen, setRunWorkflowDialogOpen] = useState(false)
  const [runWorkflowProfileId, setRunWorkflowProfileId] = useState<number | null>(null)
  const [runWorkflowId, setRunWorkflowId] = useState<number | null>(null)
  const [runWorkflowVars, setRunWorkflowVars] = useState<{ email?: string; password?: string }>({})
  const [runWorkflowProfileIds, setRunWorkflowProfileIds] = useState<number[]>([])
  const presets = [
    {
      label: 'Windows/Chrome US',
      value: {
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1366, height: 768, deviceScaleFactor: 1 },
        locale: 'en-US',
        timezoneId: 'America/Los_Angeles',
        languages: ['en-US', 'en'],
        colorScheme: 'light' as const,
        isMobile: false,
        hasTouch: false,
        reducedMotion: 'no-preference' as const,
      },
    },
    {
      label: 'Mac/Safari JP',
      value: {
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        viewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
        locale: 'ja-JP',
        timezoneId: 'Asia/Tokyo',
        languages: ['ja-JP', 'ja'],
        colorScheme: 'light' as const,
        isMobile: false,
        hasTouch: false,
        reducedMotion: 'no-preference' as const,
      },
    },
  ]

  // Helpers to read/write fingerprint JSON quickly from controls
  const readFp = (): any => {
    try {
      return fingerprintText?.trim() ? JSON.parse(fingerprintText) : {}
    } catch {
      return {}
    }
  }

  const writeFp = (obj: any) => setFingerprintText(JSON.stringify(obj, null, 2))

  const setFpPath = (path: string, value: any) => {
    const fp = readFp()
    const keys = path.split('.')
    let cur = fp
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i]
      if (typeof cur[k] !== 'object' || cur[k] == null) cur[k] = {}
      cur = cur[k]
    }
    cur[keys[keys.length - 1]] = value
    writeFp(fp)
  }

  const getFpPath = (path: string, fallback?: any) => {
    const fp = readFp()
    const keys = path.split('.')
    let cur: any = fp
    for (const k of keys) {
      if (cur == null) return fallback
      cur = cur[k]
    }
    return cur == null ? fallback : cur
  }
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [profileProxyMap, setProfileProxyMap] = useState<Record<number, number | undefined>>(() => {
    try {
      const raw = localStorage.getItem('profileProxyMap')
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  })
  const [bulkProxyId, setBulkProxyId] = useState<number | undefined>(undefined)
  const [bulkWorkflowId, setBulkWorkflowId] = useState<number | undefined>(undefined)
  const [driverMap, setDriverMap] = useState<Record<number, string>>({})
  const [profileWorkflowsMap, setProfileWorkflowsMap] = useState<Record<number, any[]>>({})
  const itemsPerPage = 10

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      user_agent: '',
      fingerprint: undefined,
    },
  })

  useEffect(() => {
    loadProfiles()
    loadProxies()
    if (SHOW_WORKFLOWS) loadWorkflows()
  }, [])

  useEffect(() => {
    if (!SHOW_WORKFLOWS) return
    if (profiles.length > 0) {
      loadAssignments()
    }
  }, [profiles])

  const loadProxies = async () => {
    try {
      const data = await api.getProxies()
      setProxies(data)
    } catch (error) {
      console.error('Failed to load proxies:', error)
    }
  }

  const loadWorkflows = async () => {
    try {
      // Load n8n workflows only (not local editor workflows)
      const response = await apiClient.get('/api/n8n-workflows')
      const data = response.data || []
      // Ensure it's an array
      setWorkflows(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to load workflows:', error)
      setWorkflows([])
    }
  }

  const loadAssignments = async () => {
    try {
      const profileIds = profiles.map(p => p.id)
      if (profileIds.length === 0) return
      const response = await apiClient.get('/api/n8n-workflows/assignments', { params: { profileIds: profileIds.join(',') } })
      const assignments = response.data || []
      const map: Record<number, any[]> = {}
      assignments.forEach((a: any) => {
        if (!map[a.profileId]) map[a.profileId] = []
        map[a.profileId].push(a.workflow)
      })
      setProfileWorkflowsMap(map)
    } catch (error) {
      console.error('Failed to load assignments:', error)
    }
  }

  const persistProfileProxyMap = (map: Record<number, number | undefined>) => {
    setProfileProxyMap(map)
    try {
      localStorage.setItem('profileProxyMap', JSON.stringify(map))
    } catch {}
  }

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const selectAllOnPage = () => {
    const idsOnPage = paginatedProfiles.map((p) => p.id)
    const allSelected = idsOnPage.every((id) => selectedIds.includes(id))
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !idsOnPage.includes(id)))
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...idsOnPage])))
    }
  }

  const setProxyForProfile = (profileId: number, proxyId?: number) => {
    const next = { ...profileProxyMap, [profileId]: proxyId }
    persistProfileProxyMap(next)
  }

  const applyProxyToSelected = () => {
    if (!selectedIds.length) return
    const next = { ...profileProxyMap }
    selectedIds.forEach((id) => {
      next[id] = bulkProxyId
    })
    persistProfileProxyMap(next)
  }

  const applyProxyToAll = () => {
    const next = { ...profileProxyMap }
    filteredProfiles.forEach((p) => {
      next[p.id] = bulkProxyId
    })
    persistProfileProxyMap(next)
  }

  const applyWorkflowToSelected = async () => {
    if (!selectedIds.length || !bulkWorkflowId) {
      alert('Please select at least one profile and a workflow')
      return
    }
    try {
      await apiClient.post(`/api/n8n-workflows/${bulkWorkflowId}/assign`, { profileIds: selectedIds })
      alert(`Workflow applied to ${selectedIds.length} selected profile(s)`)
      await loadAssignments()
    } catch (error: any) {
      console.error('Failed to apply workflow:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to apply workflow'
      alert(`Error: ${errorMessage}`)
    }
  }

  const applyWorkflowToAll = async () => {
    if (!bulkWorkflowId) {
      alert('Please select a workflow')
      return
    }
    if (!confirm(`Apply workflow to all ${filteredProfiles.length} profile(s)?`)) {
      return
    }
    try {
      const allProfileIds = filteredProfiles.map((p) => p.id)
      await apiClient.post(`/api/n8n-workflows/${bulkWorkflowId}/assign`, { profileIds: allProfileIds })
      alert(`Workflow applied to ${allProfileIds.length} profile(s)`)
      await loadAssignments()
    } catch (error: any) {
      console.error('Failed to apply workflow:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to apply workflow'
      alert(`Error: ${errorMessage}`)
    }
  }

  const openRunWorkflowDialog = (profileId: number | null, workflowId: number, profileIds?: number[]) => {
    setRunWorkflowProfileId(profileId)
    setRunWorkflowId(workflowId)
    setRunWorkflowProfileIds(profileIds || (profileId ? [profileId] : []))
    setRunWorkflowVars({})
    setRunWorkflowDialogOpen(true)
  }

  const confirmRunWorkflow = async () => {
    if (!runWorkflowId) return

    const profileIds = runWorkflowProfileIds.length > 0 
      ? runWorkflowProfileIds 
      : (runWorkflowProfileId ? [runWorkflowProfileId] : [])

    if (profileIds.length === 0) {
      alert('No profiles selected')
      return
    }

    try {
      // Check if this is n8n workflow or local workflow
      const workflow = workflows.find((w: any) => w.id === runWorkflowId)
      const isN8nWorkflow = workflow?.n8nWorkflowId || workflow?.source === 'n8n'
      
      const vars: Record<string, string> = {}
      if (runWorkflowVars.email) vars.email = runWorkflowVars.email
      if (runWorkflowVars.password) vars.password = runWorkflowVars.password

      if (isN8nWorkflow) {
        // Use n8n workflow run endpoint
        await apiClient.post(`/api/n8n-workflows/${runWorkflowId}/run`, { 
          profileIds,
          vars: Object.keys(vars).length > 0 ? vars : undefined,
        })
        alert(`✅ Workflow queued for execution! Check Executions page for status.`)
      } else {
        // Use local workflow execute endpoint
        await apiClient.post(`/api/workflows/${runWorkflowId}/execute`, { 
          profileIds,
          vars: Object.keys(vars).length > 0 ? vars : undefined,
        })
        alert(`✅ Workflow queued for execution! Check Executions page for status.`)
      }

      setRunWorkflowDialogOpen(false)
      setRunWorkflowProfileId(null)
      setRunWorkflowId(null)
      setRunWorkflowProfileIds([])
      setRunWorkflowVars({})
    } catch (error: any) {
      console.error('Failed to run workflow:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to run workflow'
      alert(`Error: ${errorMessage}`)
    }
  }

  const runWorkflowForSelected = async () => {
    if (!selectedIds.length || !bulkWorkflowId) {
      alert('Please select at least one profile and a workflow')
      return
    }
    openRunWorkflowDialog(null, bulkWorkflowId, selectedIds)
  }

  useEffect(() => {
    if (editingProfile) {
      reset({
        name: editingProfile.name,
        user_agent: editingProfile.user_agent || '',
        fingerprint: editingProfile.fingerprint || undefined,
      })
      // Set fingerprint text for display
      if (editingProfile.fingerprint) {
        try {
          setFingerprintText(JSON.stringify(editingProfile.fingerprint, null, 2))
        } catch {
          setFingerprintText('')
        }
      } else {
        setFingerprintText('')
      }
    } else {
      reset({
        name: '',
        user_agent: '',
        fingerprint: undefined,
      })
      setFingerprintText('')
    }
  }, [editingProfile, reset])

  const loadProfiles = async () => {
    try {
      setLoading(true)
      const data = await api.getProfiles()
      setProfiles(data)
      // init driver/proxy map from existing fingerprints
      const dMap: Record<number, string> = {}
      const pMap: Record<number, number | undefined> = { ...profileProxyMap }
      data.forEach((p: any) => {
        if (p.fingerprint && typeof p.fingerprint === 'object') {
          if (p.fingerprint.driver) dMap[p.id] = p.fingerprint.driver
          if (p.fingerprint.proxyId && !pMap[p.id]) pMap[p.id] = Number(p.fingerprint.proxyId)
        }
      })
      if (Object.keys(dMap).length) setDriverMap(dMap)
      if (Object.keys(pMap).length) persistProfileProxyMap(pMap)
    } catch (error) {
      console.error('Failed to load profiles:', error)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: ProfileFormData) => {
    try {
      // Parse fingerprint JSON string to object
      let fingerprint = undefined
      if (fingerprintText.trim()) {
        try {
          fingerprint = JSON.parse(fingerprintText)
        } catch (e) {
          alert('Fingerprint JSON không hợp lệ. Vui lòng kiểm tra lại.')
          return
        }
      }

      const payload: any = {
        name: data.name,
        user_agent: data.user_agent || undefined,
      }
      
      if (fingerprint !== undefined) {
        payload.fingerprint = fingerprint
      }

      if (editingProfile) {
        await api.updateProfile(editingProfile.id, payload)
        alert('Cập nhật profile thành công!')
      } else {
        await api.createProfile(payload)
        alert('Tạo profile thành công!')
      }
      setDialogOpen(false)
      setEditingProfile(null)
      reset()
      setFingerprintText('')
      loadProfiles()
    } catch (error: any) {
      console.error('Failed to save profile:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save profile'
      alert(`Lỗi: ${errorMessage}`)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this profile?')) return
    try {
      await api.deleteProfile(id)
      loadProfiles()
    } catch (error) {
      console.error('Failed to delete profile:', error)
      alert('Failed to delete profile')
    }
  }

  const handleStart = async (profileId: number) => {
    const proxyId = profileProxyMap[profileId]
    try {
      await api.createSession({ profileId, proxyId })
      alert('Session started successfully! Browser should open now.')
      loadProfiles()
    } catch (error: any) {
      console.error('Failed to start session:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to start session'
      alert(`Lỗi: ${errorMessage}`)
    }
  }

  const confirmStart = async () => {
    if (!startingProfile) return
    
    try {
      await api.createSession({ 
        profileId: startingProfile.id,
        proxyId: selectedProxyId,
      })
      setStartDialogOpen(false)
      setStartingProfile(null)
      setSelectedProxyId(undefined)
      alert('Session started successfully! Browser should open now.')
      loadProfiles()
    } catch (error: any) {
      console.error('Failed to start session:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to start session'
      alert(`Lỗi: ${errorMessage}`)
    }
  }

  const filteredProfiles = profiles.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const paginatedProfiles = filteredProfiles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredProfiles.length / itemsPerPage)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profiles</h1>
          <p className="text-muted-foreground">Manage browser profiles</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Profile
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search profiles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="bulkProxy">Chose Proxy</Label>
          <select
            id="bulkProxy"
            value={bulkProxyId || ''}
            onChange={(e) => setBulkProxyId(e.target.value ? parseInt(e.target.value) : undefined)}
            className="flex h-10 w-56 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">None (No proxy)</option>
            {proxies.filter((p) => p.active).map((proxy) => (
              <option key={proxy.id} value={proxy.id}>
                {proxy.host}:{proxy.port} ({proxy.type}) {proxy.username ? `- ${proxy.username}` : ''}
              </option>
            ))}
          </select>
          <Button variant="outline" onClick={applyProxyToSelected} disabled={!selectedIds.length}>
            Apply to Selected
          </Button>
          <Button variant="outline" onClick={applyProxyToAll}>
            Apply to All
          </Button>
        </div>
      {SHOW_WORKFLOWS && (
        <div className="flex items-center gap-2">
          <Label htmlFor="bulkWorkflow">Chose workflows</Label>
          <select
            id="bulkWorkflow"
            value={bulkWorkflowId || ''}
            onChange={(e) => setBulkWorkflowId(e.target.value ? parseInt(e.target.value) : undefined)}
            className="flex h-10 w-56 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">None (No workflow)</option>
            {Array.isArray(workflows) && workflows.map((workflow) => (
              <option key={workflow.id} value={workflow.id}>
                {workflow.name || `Workflow ${workflow.id}`}
              </option>
            ))}
          </select>
          <Button variant="outline" onClick={async () => {
            try {
              await apiClient.post('/api/n8n-workflows/importFromN8n')
              await loadWorkflows()
              alert('Synced workflows from n8n!')
            } catch (e: any) {
              alert(e?.message || 'Failed to sync from n8n')
            }
          }} className="text-xs">
            Sync from n8n
          </Button>
          <Button variant="outline" onClick={applyWorkflowToSelected} disabled={!selectedIds.length || !bulkWorkflowId}>
            Apply to Selected
          </Button>
          <Button variant="outline" onClick={applyWorkflowToAll} disabled={!bulkWorkflowId}>
            Apply to All
          </Button>
          <Button variant="outline" onClick={runWorkflowForSelected} disabled={!selectedIds.length || !bulkWorkflowId} className="bg-green-50 hover:bg-green-100">
            <Play className="mr-2 h-4 w-4" /> Run for Selected
          </Button>
        </div>
      )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <input type="checkbox" onChange={selectAllOnPage} checked={paginatedProfiles.every((p) => selectedIds.includes(p.id)) && paginatedProfiles.length>0} />
              </TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>User Agent</TableHead>
              <TableHead>Chose Proxy</TableHead>
              <TableHead>Change Driver</TableHead>
              {SHOW_WORKFLOWS && <TableHead>Workflows</TableHead>}
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : paginatedProfiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No profiles found
                </TableCell>
              </TableRow>
            ) : (
              paginatedProfiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(profile.id)}
                      onChange={() => toggleSelect(profile.id)}
                    />
                  </TableCell>
                  <TableCell>{profile.id}</TableCell>
                  <TableCell className="font-medium">{profile.name}</TableCell>
                  <TableCell className="max-w-xs truncate">{profile.user_agent || '-'}</TableCell>
                  <TableCell>
                    <select
                      value={profileProxyMap[profile.id] || ''}
                      onChange={(e) => setProxyForProfile(profile.id, e.target.value ? parseInt(e.target.value) : undefined)}
                      className="flex h-9 w-56 rounded-md border border-input bg-background px-2 text-sm"
                    >
                      <option value="">None (No proxy)</option>
                      {proxies.filter((p) => p.active).map((proxy) => (
                        <option key={proxy.id} value={proxy.id}>
                          {proxy.host}:{proxy.port} ({proxy.type})
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell>
                    <select
                      value={driverMap[profile.id] || ''}
                      onChange={async (e) => {
                        const driver = e.target.value
                        setDriverMap((prev) => ({ ...prev, [profile.id]: driver }))
                        try {
                          const current = (profile as any).fingerprint || {}
                          await api.updateProfileFingerprint(profile.id, { ...current, driver })
                        } catch (err) {
                          console.error('Failed to update driver', err)
                          alert('Failed to update driver')
                        }
                      }}
                      className="flex h-9 w-48 rounded-md border border-input bg-background px-2 text-sm"
                    >
                      <option value="">Chromium (default)</option>
                      <option value="chrome">Chrome</option>
                      <option value="msedge">Microsoft Edge</option>
                    </select>
                  </TableCell>
                  {SHOW_WORKFLOWS && (
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(profileWorkflowsMap[profile.id] || []).map((wf: any) => (
                          <div key={wf.id} className="flex items-center gap-1">
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                              {wf.name || `W${wf.id}`}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => openRunWorkflowDialog(profile.id, wf.id)}
                              title={`Run workflow: ${wf.name}`}
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        {(!profileWorkflowsMap[profile.id] || profileWorkflowsMap[profile.id].length === 0) && (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                  )}
                  <TableCell>
                    {new Date(profile.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleStart(profile.id)}
                        title="Start Session"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingProfile(profile)
                          setDialogOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(profile.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        if (!open) {
          setDialogOpen(false)
          setEditingProfile(null)
          reset()
          setFingerprintText('')
        } else {
          setDialogOpen(true)
        }
      }}>
        <DialogContent onClose={() => {
          setDialogOpen(false)
          setEditingProfile(null)
          reset()
          setFingerprintText('')
        }}>
          <DialogHeader>
            <DialogTitle>{editingProfile ? 'Edit Profile' : 'Create Profile'}</DialogTitle>
            <DialogDescription>
              {editingProfile ? 'Update profile details' : 'Create a new browser profile'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" {...register('name')} />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="user_agent">User Agent</Label>
                <Input id="user_agent" {...register('user_agent')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fingerprint">Fingerprint (JSON)</Label>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground">Preset:</label>
                  <select
                    className="flex h-8 rounded-md border border-input bg-background px-2 text-xs"
                    onChange={(e) => {
                      const idx = Number(e.target.value)
                      if (!Number.isNaN(idx)) {
                        const preset = presets[idx]
                        if (preset) {
                          setFingerprintText(JSON.stringify(preset.value, null, 2))
                          // also mirror UA into dedicated field for visibility
                          // we keep JSON as source of truth; UA field remains editable separately
                        }
                      }
                    }}
                  >
                    <option value="">-- Choose preset --</option>
                    {presets.map((p, i) => (
                      <option key={p.label} value={i}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="mb-1 text-xs text-muted-foreground">Canvas</div>
                    <div className="inline-flex rounded border overflow-hidden">
                      {(['noise','off','block'] as const).map((opt)=> (
                        <button
                          key={opt}
                          type="button"
                          onClick={()=> setFpPath('canvas.mode', opt)}
                          className={`px-3 py-1 text-xs ${getFpPath('canvas.mode')===opt? 'bg-green-100 text-green-800':'hover:bg-slate-100'}`}
                        >
                          {opt[0].toUpperCase()+opt.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-muted-foreground">Client Rects</div>
                    <div className="inline-flex rounded border overflow-hidden">
                      {(['off','noise'] as const).map((opt)=> (
                        <button
                          key={opt}
                          type="button"
                          onClick={()=> setFpPath('clientRects.mode', opt)}
                          className={`px-3 py-1 text-xs ${getFpPath('clientRects.mode')===opt? 'bg-green-100 text-green-800':'hover:bg-slate-100'}`}
                        >
                          {opt[0].toUpperCase()+opt.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-muted-foreground">Audio Context</div>
                    <div className="inline-flex rounded border overflow-hidden">
                      {(['off','noise'] as const).map((opt)=> (
                        <button
                          key={opt}
                          type="button"
                          onClick={()=> setFpPath('audioContext.mode', opt)}
                          className={`px-3 py-1 text-xs ${getFpPath('audioContext.mode')===opt? 'bg-green-100 text-green-800':'hover:bg-slate-100'}`}
                        >
                          {opt[0].toUpperCase()+opt.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-muted-foreground">WebGL Image</div>
                    <div className="inline-flex rounded border overflow-hidden">
                      {(['off','noise'] as const).map((opt)=> (
                        <button
                          key={opt}
                          type="button"
                          onClick={()=> setFpPath('webgl.image', opt)}
                          className={`px-3 py-1 text-xs ${getFpPath('webgl.image')===opt? 'bg-green-100 text-green-800':'hover:bg-slate-100'}`}
                        >
                          {opt[0].toUpperCase()+opt.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-muted-foreground">WebGL Metadata</div>
                    <div className="inline-flex rounded border overflow-hidden">
                      {(['mask','real'] as const).map((opt)=> (
                        <button
                          key={opt}
                          type="button"
                          onClick={()=> setFpPath('webgl.metadata', opt)}
                          className={`px-3 py-1 text-xs ${getFpPath('webgl.metadata')===opt? 'bg-green-100 text-green-800':'hover:bg-slate-100'}`}
                        >
                          {opt[0].toUpperCase()+opt.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <textarea
                  id="fingerprint"
                  value={fingerprintText}
                  onChange={(e) => setFingerprintText(e.target.value)}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder='{"canvas": "abc123", ...}'
                />
                <p className="text-xs text-muted-foreground">
                  Để trống nếu không cần fingerprint, hoặc nhập JSON hợp lệ
                </p>
                {editingProfile && (
                  <div>
                    <Button type="button" variant="outline" onClick={async () => {
                      try {
                        let fp: any = undefined
                        if (fingerprintText.trim()) {
                          fp = JSON.parse(fingerprintText)
                        }
                        const saved = await api.updateProfileFingerprint(editingProfile.id, fp || {})
                        // Cập nhật lại state để modal hiển thị dữ liệu mới
                        setEditingProfile({ ...editingProfile, fingerprint: saved })
                        await loadProfiles()
                        alert('Đã lưu Fingerprint!')
                      } catch (e: any) {
                        alert('Fingerprint JSON không hợp lệ hoặc lưu thất bại.')
                      }
                    }}>
                      Save Fingerprint
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false)
                  setEditingProfile(null)
                  reset()
                  setFingerprintText('')
                }}
              >
                Cancel
              </Button>
              <Button type="submit">{editingProfile ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Start Session Dialog */}
      <Dialog open={startDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setStartDialogOpen(false)
          setStartingProfile(null)
          setSelectedProxyId(undefined)
        } else {
          setStartDialogOpen(true)
        }
      }}>
        <DialogContent onClose={() => {
          setStartDialogOpen(false)
          setStartingProfile(null)
          setSelectedProxyId(undefined)
        }}>
          <DialogHeader>
            <DialogTitle>Start Session</DialogTitle>
            <DialogDescription>
              Start browser session for profile: <strong>{startingProfile?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="proxy">Select Proxy (Optional)</Label>
              <select
                id="proxy"
                value={selectedProxyId || ''}
                onChange={(e) => setSelectedProxyId(e.target.value ? parseInt(e.target.value) : undefined)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">None (No proxy)</option>
                {proxies
                  .filter((p) => p.active)
                  .map((proxy) => (
                    <option key={proxy.id} value={proxy.id}>
                      {proxy.host}:{proxy.port} ({proxy.type}) {proxy.username ? `- ${proxy.username}` : ''}
                    </option>
                  ))}
              </select>
              {proxies.filter((p) => p.active).length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No active proxies available. Session will start without proxy.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setStartDialogOpen(false)
                setStartingProfile(null)
                setSelectedProxyId(undefined)
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={confirmStart}>
              <Play className="mr-2 h-4 w-4" />
              Start Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Run Workflow Dialog */}
      <Dialog open={runWorkflowDialogOpen} onOpenChange={(open) => {
        setRunWorkflowDialogOpen(open)
        if (!open) {
          setRunWorkflowProfileId(null)
          setRunWorkflowId(null)
          setRunWorkflowProfileIds([])
          setRunWorkflowVars({})
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Run Workflow</DialogTitle>
            <DialogDescription>
              Enter workflow variables (optional)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="runEmail">Email (optional)</Label>
              <Input
                id="runEmail"
                type="email"
                value={runWorkflowVars.email || ''}
                onChange={(e) => setRunWorkflowVars({ ...runWorkflowVars, email: e.target.value })}
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="runPassword">Password (optional)</Label>
              <Input
                id="runPassword"
                type="password"
                value={runWorkflowVars.password || ''}
                onChange={(e) => setRunWorkflowVars({ ...runWorkflowVars, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              These variables will be available in workflow nodes as <code className="bg-muted px-1 rounded">{'{{vars.email}}'}</code> and <code className="bg-muted px-1 rounded">{'{{vars.password}}'}</code>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRunWorkflowDialogOpen(false)
                setRunWorkflowProfileId(null)
                setRunWorkflowId(null)
                setRunWorkflowProfileIds([])
                setRunWorkflowVars({})
              }}
            >
              Cancel
            </Button>
            <Button onClick={confirmRunWorkflow}>
              <Play className="mr-2 h-4 w-4" />
              Run Workflow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

