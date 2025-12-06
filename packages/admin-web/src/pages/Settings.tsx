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

interface FingerprintPreset {
  id: number
  name: string
  description?: string
  userAgent: string
  platform: string
  uaPlatform: string
  os: string
  osVersion?: string
  browserVersion?: number
  hardwareConcurrency: number
  deviceMemory: number
  webglVendor: string
  webglRenderer: string
  screenWidth: number
  screenHeight: number
  isActive: boolean
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'user-agents' | 'webgl-renderers' | 'fingerprint-presets'>('user-agents')
  
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

  // Fingerprint Presets state
  const [presets, setPresets] = useState<FingerprintPreset[]>([])
  const [presetDialogOpen, setPresetDialogOpen] = useState(false)
  const [editingPreset, setEditingPreset] = useState<FingerprintPreset | null>(null)
  const [presetForm, setPresetForm] = useState({
    name: '',
    description: '',
    userAgent: '',
    platform: 'Win32',
    uaPlatform: 'Windows',
    uaPlatformVersion: '',
    uaFullVersion: '',
    uaMobile: false,
    browserVersion: 140,
    hardwareConcurrency: 8,
    deviceMemory: 8,
    webglVendor: '',
    webglRenderer: '',
    screenWidth: 1920,
    screenHeight: 1080,
    colorDepth: 24,
    pixelRatio: 1.0,
    languages: ['en-US', 'en'],
    timezone: '',
    canvasMode: 'noise' as 'noise' | 'mask' | 'off',
    audioContextMode: 'noise' as 'noise' | 'off',
    webglMetadataMode: 'mask' as 'mask' | 'real',
    webrtcMode: 'fake' as 'fake' | 'off' | 'real',
    geolocationMode: 'fake' as 'fake' | 'off' | 'real',
    geolocationLatitude: undefined as number | undefined,
    geolocationLongitude: undefined as number | undefined,
    os: 'Windows',
    osVersion: '',
    isActive: true,
  })

  // Load data
  useEffect(() => {
    loadUserAgents()
    loadWebglRenderers()
    loadPresets()
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

  // Fingerprint Preset handlers
  const loadPresets = async () => {
    try {
      const data = await api.getFingerprintPresets()
      setPresets(data)
    } catch (error) {
      console.error('Failed to load Fingerprint Presets:', error)
    }
  }

  const handleCreatePreset = () => {
    setEditingPreset(null)
    setPresetForm({
      name: '',
      description: '',
      userAgent: '',
      platform: 'Win32',
      uaPlatform: 'Windows',
      uaPlatformVersion: '',
      uaFullVersion: '',
      uaMobile: false,
      browserVersion: 140,
      hardwareConcurrency: 8,
      deviceMemory: 8,
      webglVendor: '',
      webglRenderer: '',
      screenWidth: 1920,
      screenHeight: 1080,
      colorDepth: 24,
      pixelRatio: 1.0,
      languages: ['en-US', 'en'],
      timezone: '',
      canvasMode: 'noise',
      audioContextMode: 'noise',
      webglMetadataMode: 'mask',
      webrtcMode: 'fake',
      geolocationMode: 'fake',
      geolocationLatitude: undefined,
      geolocationLongitude: undefined,
      os: 'Windows',
      osVersion: '',
      isActive: true,
    })
    setPresetDialogOpen(true)
  }

  const handleEditPreset = (preset: FingerprintPreset) => {
    setEditingPreset(preset)
    // Load full preset data
    api.getFingerprintPresetById(preset.id).then((fullPreset) => {
      setPresetForm({
        name: fullPreset.name || '',
        description: fullPreset.description || '',
        userAgent: fullPreset.userAgent || '',
        platform: fullPreset.platform || 'Win32',
        uaPlatform: fullPreset.uaPlatform || 'Windows',
        uaPlatformVersion: fullPreset.uaPlatformVersion || '',
        uaFullVersion: fullPreset.uaFullVersion || '',
        uaMobile: fullPreset.uaMobile || false,
        browserVersion: fullPreset.browserVersion || 140,
        hardwareConcurrency: fullPreset.hardwareConcurrency || 8,
        deviceMemory: fullPreset.deviceMemory || 8,
        webglVendor: fullPreset.webglVendor || '',
        webglRenderer: fullPreset.webglRenderer || '',
        screenWidth: fullPreset.screenWidth || 1920,
        screenHeight: fullPreset.screenHeight || 1080,
        colorDepth: fullPreset.colorDepth || 24,
        pixelRatio: fullPreset.pixelRatio || 1.0,
        languages: fullPreset.languages || ['en-US', 'en'],
        timezone: fullPreset.timezone || '',
        canvasMode: fullPreset.canvasMode || 'noise',
        audioContextMode: fullPreset.audioContextMode || 'noise',
        webglMetadataMode: fullPreset.webglMetadataMode || 'mask',
        webrtcMode: fullPreset.webrtcMode || 'fake',
        geolocationMode: fullPreset.geolocationMode || 'fake',
        geolocationLatitude: fullPreset.geolocationLatitude,
        geolocationLongitude: fullPreset.geolocationLongitude,
        os: fullPreset.os || 'Windows',
        osVersion: fullPreset.osVersion || '',
        isActive: fullPreset.isActive !== false,
      })
      setPresetDialogOpen(true)
    })
  }

  const handleSavePreset = async () => {
    try {
      if (editingPreset) {
        await api.updateFingerprintPreset(editingPreset.id, presetForm)
      } else {
        await api.createFingerprintPreset(presetForm)
      }
      await loadPresets()
      setPresetDialogOpen(false)
    } catch (error: any) {
      alert(error.response?.data?.message || error.message || 'Failed to save Fingerprint Preset')
    }
  }

  const handleDeletePreset = async (id: number) => {
    if (!confirm('Are you sure you want to delete this Fingerprint Preset? This will affect all profiles using it.')) return
    try {
      await api.deleteFingerprintPreset(id)
      await loadPresets()
    } catch (error: any) {
      alert(error.response?.data?.message || error.message || 'Failed to delete Fingerprint Preset')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Tĩnh (Không Sticky nữa cho đỡ lỗi) */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings - Fingerprint Libraries</h1>
        
        {/* Tabs */}
        <div className="border-b border-gray-200 mt-4">
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
        <button
          onClick={() => setActiveTab('fingerprint-presets')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'fingerprint-presets'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground'
          }`}
        >
          Fingerprint Presets ({presets.length})
        </button>
        </div>
      </div>

      {/* Nội dung Tab */}
      <div className="pt-4">
      {/* User Agents Tab */}
      {activeTab === 'user-agents' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={handleCreateUserAgent}>
              <Plus className="h-4 w-4 mr-2" />
              Add User Agent
            </Button>
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto w-full">
              <Table className="w-full text-left border-collapse whitespace-nowrap">
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

          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto w-full">
              <Table className="w-full text-left border-collapse whitespace-nowrap">
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
        </div>
      )}

      {/* Fingerprint Presets Tab */}
      {activeTab === 'fingerprint-presets' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={handleCreatePreset}>
              <Plus className="h-4 w-4 mr-2" />
              Add Fingerprint Preset
            </Button>
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto w-full">
              <Table className="w-full text-left border-collapse whitespace-nowrap">
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>OS</TableHead>
                    <TableHead>Browser</TableHead>
                    <TableHead>GPU</TableHead>
                    <TableHead>Screen</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {presets.map((preset) => (
                  <TableRow key={preset.id}>
                    <TableCell>{preset.id}</TableCell>
                    <TableCell className="font-medium">{preset.name}</TableCell>
                    <TableCell>{preset.os} {preset.osVersion || ''}</TableCell>
                    <TableCell>Chrome {preset.browserVersion || 'N/A'}</TableCell>
                    <TableCell className="max-w-xs truncate" title={preset.webglRenderer}>
                      {preset.webglVendor} - {preset.webglRenderer}
                    </TableCell>
                    <TableCell>{preset.screenWidth}x{preset.screenHeight}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        preset.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {preset.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditPreset(preset)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePreset(preset.id)}
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
        </div>
      )}
      </div>

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

      {/* Fingerprint Preset Dialog */}
      <Dialog open={presetDialogOpen} onOpenChange={setPresetDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPreset ? 'Edit Fingerprint Preset' : 'Create Fingerprint Preset'}
            </DialogTitle>
            <DialogDescription>
              A complete fingerprint configuration that ensures 100% consistency across all parameters
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="preset-name">Name *</Label>
                <Input
                  id="preset-name"
                  value={presetForm.name}
                  onChange={(e) => setPresetForm({ ...presetForm, name: e.target.value })}
                  placeholder="Windows 11 - Chrome 140 - NVIDIA RTX 4080"
                />
              </div>
              <div>
                <Label htmlFor="preset-os">OS *</Label>
                <select
                  id="preset-os"
                  className="w-full px-3 py-2 border rounded-md"
                  value={presetForm.os}
                  onChange={(e) => {
                    const os = e.target.value
                    setPresetForm({
                      ...presetForm,
                      os,
                      platform: os === 'Windows' ? 'Win32' : os === 'macOS' ? 'MacIntel' : 'Linux x86_64',
                      uaPlatform: os === 'Windows' ? 'Windows' : os === 'macOS' ? 'macOS' : 'Linux',
                    })
                  }}
                >
                  <option value="Windows">Windows</option>
                  <option value="Windows 10">Windows 10</option>
                  <option value="Windows 11">Windows 11</option>
                  <option value="macOS">macOS</option>
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="preset-description">Description</Label>
              <Input
                id="preset-description"
                value={presetForm.description}
                onChange={(e) => setPresetForm({ ...presetForm, description: e.target.value })}
                placeholder="High-end Windows 11 configuration with NVIDIA GPU"
              />
            </div>

            {/* User Agent */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">User Agent & Client Hints</h3>
              <div className="space-y-2">
                <div>
                  <Label htmlFor="preset-ua">User Agent *</Label>
                  <Input
                    id="preset-ua"
                    value={presetForm.userAgent}
                    onChange={(e) => setPresetForm({ ...presetForm, userAgent: e.target.value })}
                    placeholder="Mozilla/5.0 (Windows NT 10.0; Win64; x64)..."
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="preset-platform">Platform *</Label>
                    <Input
                      id="preset-platform"
                      value={presetForm.platform}
                      onChange={(e) => setPresetForm({ ...presetForm, platform: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="preset-ua-platform">UA Platform *</Label>
                    <Input
                      id="preset-ua-platform"
                      value={presetForm.uaPlatform}
                      onChange={(e) => setPresetForm({ ...presetForm, uaPlatform: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="preset-browser-version">Browser Version</Label>
                    <Input
                      id="preset-browser-version"
                      type="number"
                      min="130"
                      max="140"
                      value={presetForm.browserVersion}
                      onChange={(e) => setPresetForm({ ...presetForm, browserVersion: parseInt(e.target.value) || 140 })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Hardware */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Hardware & Graphics</h3>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <Label htmlFor="preset-cpu-cores">CPU Cores *</Label>
                  <Input
                    id="preset-cpu-cores"
                    type="number"
                    min="1"
                    max="64"
                    value={presetForm.hardwareConcurrency}
                    onChange={(e) => setPresetForm({ ...presetForm, hardwareConcurrency: parseInt(e.target.value) || 8 })}
                  />
                </div>
                <div>
                  <Label htmlFor="preset-ram">RAM (GB) *</Label>
                  <Input
                    id="preset-ram"
                    type="number"
                    min="1"
                    max="128"
                    value={presetForm.deviceMemory}
                    onChange={(e) => setPresetForm({ ...presetForm, deviceMemory: parseInt(e.target.value) || 8 })}
                  />
                </div>
                <div>
                  <Label htmlFor="preset-webgl-vendor">WebGL Vendor *</Label>
                  <Input
                    id="preset-webgl-vendor"
                    value={presetForm.webglVendor}
                    onChange={(e) => setPresetForm({ ...presetForm, webglVendor: e.target.value })}
                    placeholder="NVIDIA Corporation"
                  />
                </div>
                <div>
                  <Label htmlFor="preset-webgl-renderer">WebGL Renderer *</Label>
                  <Input
                    id="preset-webgl-renderer"
                    value={presetForm.webglRenderer}
                    onChange={(e) => setPresetForm({ ...presetForm, webglRenderer: e.target.value })}
                    placeholder="NVIDIA GeForce RTX 4080"
                  />
                </div>
              </div>
            </div>

            {/* Screen */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Screen & Display</h3>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <Label htmlFor="preset-width">Width *</Label>
                  <Input
                    id="preset-width"
                    type="number"
                    value={presetForm.screenWidth}
                    onChange={(e) => setPresetForm({ ...presetForm, screenWidth: parseInt(e.target.value) || 1920 })}
                  />
                </div>
                <div>
                  <Label htmlFor="preset-height">Height *</Label>
                  <Input
                    id="preset-height"
                    type="number"
                    value={presetForm.screenHeight}
                    onChange={(e) => setPresetForm({ ...presetForm, screenHeight: parseInt(e.target.value) || 1080 })}
                  />
                </div>
                <div>
                  <Label htmlFor="preset-color-depth">Color Depth</Label>
                  <Input
                    id="preset-color-depth"
                    type="number"
                    value={presetForm.colorDepth}
                    onChange={(e) => setPresetForm({ ...presetForm, colorDepth: parseInt(e.target.value) || 24 })}
                  />
                </div>
                <div>
                  <Label htmlFor="preset-pixel-ratio">Pixel Ratio</Label>
                  <Input
                    id="preset-pixel-ratio"
                    type="number"
                    step="0.1"
                    value={presetForm.pixelRatio}
                    onChange={(e) => setPresetForm({ ...presetForm, pixelRatio: parseFloat(e.target.value) || 1.0 })}
                  />
                </div>
              </div>
            </div>

            {/* Spoofing Modes */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Spoofing Modes</h3>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="preset-canvas">Canvas Mode *</Label>
                  <select
                    id="preset-canvas"
                    className="w-full px-3 py-2 border rounded-md"
                    value={presetForm.canvasMode}
                    onChange={(e) => setPresetForm({ ...presetForm, canvasMode: e.target.value as any })}
                  >
                    <option value="noise">Noise</option>
                    <option value="mask">Mask</option>
                    <option value="off">Off</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="preset-audio">Audio Context Mode *</Label>
                  <select
                    id="preset-audio"
                    className="w-full px-3 py-2 border rounded-md"
                    value={presetForm.audioContextMode}
                    onChange={(e) => setPresetForm({ ...presetForm, audioContextMode: e.target.value as any })}
                  >
                    <option value="noise">Noise</option>
                    <option value="off">Off</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="preset-webgl-meta">WebGL Metadata *</Label>
                  <select
                    id="preset-webgl-meta"
                    className="w-full px-3 py-2 border rounded-md"
                    value={presetForm.webglMetadataMode}
                    onChange={(e) => setPresetForm({ ...presetForm, webglMetadataMode: e.target.value as any })}
                  >
                    <option value="mask">Mask</option>
                    <option value="real">Real</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="preset-webrtc">WebRTC Mode *</Label>
                  <select
                    id="preset-webrtc"
                    className="w-full px-3 py-2 border rounded-md"
                    value={presetForm.webrtcMode}
                    onChange={(e) => setPresetForm({ ...presetForm, webrtcMode: e.target.value as any })}
                  >
                    <option value="fake">Fake</option>
                    <option value="off">Off</option>
                    <option value="real">Real</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="preset-geo">Geolocation Mode *</Label>
                  <select
                    id="preset-geo"
                    className="w-full px-3 py-2 border rounded-md"
                    value={presetForm.geolocationMode}
                    onChange={(e) => setPresetForm({ ...presetForm, geolocationMode: e.target.value as any })}
                  >
                    <option value="fake">Fake</option>
                    <option value="off">Off</option>
                    <option value="real">Real</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPresetDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSavePreset}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

