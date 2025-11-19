import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { Plus, Edit, Trash2, Save, X } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'

interface UserAgent {
  id: number
  name: string
  value: string
  os: string
  platform: string
  uaPlatform?: string
  uaPlatformVersion?: string
  uaFullVersion?: string
  browserVersion?: number
}

interface WebglRenderer {
  id: number
  vendor: string
  renderer: string
  os?: string
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'user-agents' | 'webgl-renderers'>('user-agents')
  
  // User Agents state
  const [userAgents, setUserAgents] = useState<UserAgent[]>([])
  const [userAgentDialogOpen, setUserAgentDialogOpen] = useState(false)
  const [editingUserAgent, setEditingUserAgent] = useState<UserAgent | null>(null)
  const [userAgentForm, setUserAgentForm] = useState({
    name: '',
    value: '',
    os: 'Windows',
    platform: 'Win32',
    uaPlatform: '',
    uaPlatformVersion: '',
    uaFullVersion: '',
    browserVersion: 130,
  })
  
  // WebGL Renderers state
  const [webglRenderers, setWebglRenderers] = useState<WebglRenderer[]>([])
  const [webglDialogOpen, setWebglDialogOpen] = useState(false)
  const [editingWebgl, setEditingWebgl] = useState<WebglRenderer | null>(null)
  const [webglForm, setWebglForm] = useState({
    vendor: '',
    renderer: '',
    os: 'Windows',
  })

  // Load data
  useEffect(() => {
    loadUserAgents()
    loadWebglRenderers()
  }, [])

  const loadUserAgents = async () => {
    try {
      const data = await api.getUserAgentLibrary()
      setUserAgents(data)
    } catch (error) {
      console.error('Failed to load User Agents:', error)
    }
  }

  const loadWebglRenderers = async () => {
    try {
      const data = await api.getWebglRendererLibrary()
      setWebglRenderers(data)
    } catch (error) {
      console.error('Failed to load WebGL Renderers:', error)
    }
  }

  // User Agent handlers
  const handleCreateUserAgent = () => {
    setEditingUserAgent(null)
    setUserAgentForm({
      name: '',
      value: '',
      os: 'Windows',
      platform: 'Win32',
      uaPlatform: '',
      uaPlatformVersion: '',
      uaFullVersion: '',
      browserVersion: 130,
    })
    setUserAgentDialogOpen(true)
  }

  const handleEditUserAgent = (ua: UserAgent) => {
    setEditingUserAgent(ua)
    setUserAgentForm({
      name: ua.name,
      value: ua.value,
      os: ua.os,
      platform: ua.platform,
      uaPlatform: ua.uaPlatform || '',
      uaPlatformVersion: ua.uaPlatformVersion || '',
      uaFullVersion: ua.uaFullVersion || '',
      browserVersion: ua.browserVersion || 130,
    })
    setUserAgentDialogOpen(true)
  }

  const handleSaveUserAgent = async () => {
    try {
      if (editingUserAgent) {
        await api.updateUserAgentLibrary(editingUserAgent.id, userAgentForm)
      } else {
        await api.createUserAgentLibrary(userAgentForm)
      }
      await loadUserAgents()
      setUserAgentDialogOpen(false)
    } catch (error: any) {
      alert(error.response?.data?.message || error.message || 'Failed to save User Agent')
    }
  }

  const handleDeleteUserAgent = async (id: number) => {
    if (!confirm('Are you sure you want to delete this User Agent?')) return
    try {
      await api.deleteUserAgentLibrary(id)
      await loadUserAgents()
    } catch (error: any) {
      alert(error.response?.data?.message || error.message || 'Failed to delete User Agent')
    }
  }

  // WebGL Renderer handlers
  const handleCreateWebgl = () => {
    setEditingWebgl(null)
    setWebglForm({
      vendor: '',
      renderer: '',
      os: 'Windows',
    })
    setWebglDialogOpen(true)
  }

  const handleEditWebgl = (webgl: WebglRenderer) => {
    setEditingWebgl(webgl)
    setWebglForm({
      vendor: webgl.vendor,
      renderer: webgl.renderer,
      os: webgl.os || 'Windows',
    })
    setWebglDialogOpen(true)
  }

  const handleSaveWebgl = async () => {
    try {
      if (editingWebgl) {
        await api.updateWebglRendererLibrary(editingWebgl.id, webglForm)
      } else {
        await api.createWebglRendererLibrary(webglForm)
      }
      await loadWebglRenderers()
      setWebglDialogOpen(false)
    } catch (error: any) {
      alert(error.response?.data?.message || error.message || 'Failed to save WebGL Renderer')
    }
  }

  const handleDeleteWebgl = async (id: number) => {
    if (!confirm('Are you sure you want to delete this WebGL Renderer?')) return
    try {
      await api.deleteWebglRendererLibrary(id)
      await loadWebglRenderers()
    } catch (error: any) {
      alert(error.response?.data?.message || error.message || 'Failed to delete WebGL Renderer')
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Settings - Fingerprint Libraries</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('user-agents')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'user-agents'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground'
          }`}
        >
          User Agents ({userAgents.length})
        </button>
        <button
          onClick={() => setActiveTab('webgl-renderers')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'webgl-renderers'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground'
          }`}
        >
          WebGL Renderers ({webglRenderers.length})
        </button>
      </div>

      {/* User Agents Tab */}
      {activeTab === 'user-agents' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={handleCreateUserAgent}>
              <Plus className="h-4 w-4 mr-2" />
              Add User Agent
            </Button>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>OS</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Browser Version</TableHead>
                  <TableHead>User Agent</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userAgents.map((ua) => (
                  <TableRow key={ua.id}>
                    <TableCell>{ua.id}</TableCell>
                    <TableCell className="font-medium">{ua.name}</TableCell>
                    <TableCell>{ua.os}</TableCell>
                    <TableCell>{ua.platform}</TableCell>
                    <TableCell>{ua.browserVersion || 'N/A'}</TableCell>
                    <TableCell className="max-w-md truncate" title={ua.value}>
                      {ua.value}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUserAgent(ua)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUserAgent(ua.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* WebGL Renderers Tab */}
      {activeTab === 'webgl-renderers' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={handleCreateWebgl}>
              <Plus className="h-4 w-4 mr-2" />
              Add WebGL Renderer
            </Button>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Renderer</TableHead>
                  <TableHead>OS</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webglRenderers.map((webgl) => (
                  <TableRow key={webgl.id}>
                    <TableCell>{webgl.id}</TableCell>
                    <TableCell className="font-medium">{webgl.vendor}</TableCell>
                    <TableCell>{webgl.renderer}</TableCell>
                    <TableCell>{webgl.os || 'Any'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditWebgl(webgl)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteWebgl(webgl.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* User Agent Dialog */}
      <Dialog open={userAgentDialogOpen} onOpenChange={setUserAgentDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingUserAgent ? 'Edit User Agent' : 'Create User Agent'}
            </DialogTitle>
            <DialogDescription>
              Manage User Agent library entries for fingerprint profiles
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="ua-name">Name *</Label>
              <Input
                id="ua-name"
                value={userAgentForm.name}
                onChange={(e) => setUserAgentForm({ ...userAgentForm, name: e.target.value })}
                placeholder="Windows 11 - Chrome 140"
              />
            </div>
            <div>
              <Label htmlFor="ua-value">User Agent String *</Label>
              <Input
                id="ua-value"
                value={userAgentForm.value}
                onChange={(e) => setUserAgentForm({ ...userAgentForm, value: e.target.value })}
                placeholder="Mozilla/5.0 (Windows NT 10.0; Win64; x64)..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ua-os">OS *</Label>
                <select
                  id="ua-os"
                  className="w-full px-3 py-2 border rounded-md"
                  value={userAgentForm.os}
                  onChange={(e) => {
                    const os = e.target.value
                    setUserAgentForm({
                      ...userAgentForm,
                      os,
                      platform: os === 'Windows' ? 'Win32' : os === 'macOS' ? 'MacIntel' : 'Linux x86_64',
                    })
                  }}
                >
                  <option value="Windows">Windows</option>
                  <option value="Windows 10">Windows 10</option>
                  <option value="Windows 11">Windows 11</option>
                  <option value="macOS">macOS</option>
                </select>
              </div>
              <div>
                <Label htmlFor="ua-platform">Platform *</Label>
                <Input
                  id="ua-platform"
                  value={userAgentForm.platform}
                  onChange={(e) => setUserAgentForm({ ...userAgentForm, platform: e.target.value })}
                  placeholder="Win32"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ua-platform-version">Platform Version</Label>
                <Input
                  id="ua-platform-version"
                  value={userAgentForm.uaPlatformVersion}
                  onChange={(e) => setUserAgentForm({ ...userAgentForm, uaPlatformVersion: e.target.value })}
                  placeholder="10.0.0"
                />
              </div>
              <div>
                <Label htmlFor="ua-full-version">Full Version</Label>
                <Input
                  id="ua-full-version"
                  value={userAgentForm.uaFullVersion}
                  onChange={(e) => setUserAgentForm({ ...userAgentForm, uaFullVersion: e.target.value })}
                  placeholder="120.0.6099.216"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="ua-browser-version">Browser Version</Label>
              <Input
                id="ua-browser-version"
                type="number"
                min="130"
                max="140"
                value={userAgentForm.browserVersion}
                onChange={(e) => setUserAgentForm({ ...userAgentForm, browserVersion: parseInt(e.target.value) || 130 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserAgentDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSaveUserAgent}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* WebGL Renderer Dialog */}
      <Dialog open={webglDialogOpen} onOpenChange={setWebglDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingWebgl ? 'Edit WebGL Renderer' : 'Create WebGL Renderer'}
            </DialogTitle>
            <DialogDescription>
              Manage WebGL Renderer library entries for fingerprint profiles
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="webgl-vendor">Vendor *</Label>
              <Input
                id="webgl-vendor"
                value={webglForm.vendor}
                onChange={(e) => setWebglForm({ ...webglForm, vendor: e.target.value })}
                placeholder="NVIDIA Corporation"
              />
            </div>
            <div>
              <Label htmlFor="webgl-renderer">Renderer *</Label>
              <Input
                id="webgl-renderer"
                value={webglForm.renderer}
                onChange={(e) => setWebglForm({ ...webglForm, renderer: e.target.value })}
                placeholder="NVIDIA GeForce RTX 4090/PCIe/SSE2"
              />
            </div>
            <div>
              <Label htmlFor="webgl-os">OS</Label>
              <select
                id="webgl-os"
                className="w-full px-3 py-2 border rounded-md"
                value={webglForm.os}
                onChange={(e) => setWebglForm({ ...webglForm, os: e.target.value })}
              >
                <option value="Windows">Windows</option>
                <option value="macOS">macOS</option>
                <option value="Linux">Linux</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWebglDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSaveWebgl}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

