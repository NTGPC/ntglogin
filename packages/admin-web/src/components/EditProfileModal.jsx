import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'

/**
 * @typedef {Object} Profile
 * @property {number} [id]
 * @property {string} name
 * @property {string} userAgent
 * @property {'Windows 10'|'Windows 11'|'macOS'|'Linux'|'Android'|'iOS'|''} os
 * @property {'32-bit'|'64-bit'} arch
 * @property {'Chrome'|'Chromium (default)'|'Firefox'|'Edge'|'Auto'} browser
 * @property {'1366x768'|'1600x900'|'1920x1080'|'2560x1440'|'Auto'} screen
 * @property {'Noise'|'Off'|'Block'} canvas
 * @property {'Off'|'Noise'} clientRects
 * @property {'Off'|'Noise'} audioContext
 * @property {'Off'|'Noise'} webglImage
 * @property {'Mask'|'Real'} webglMetadata
 * @property {boolean} geoEnabled
 * @property {'original'|'custom'} [geoMode]
 * @property {boolean} webrtcMainIp
 * @property {'Manual'|'Library'} proxyMode
 * @property {{ host?: string; port?: string; username?: string; password?: string; }} [proxy]
 */

/**
 * @typedef {Object} Props
 * @property {boolean} open
 * @property {Profile} [initial]
 * @property {() => void} onClose
 * @property {(data: Profile) => void} onUpdate
 */

/**
 * EditProfileModal Component
 * @param {Props} props
 * @returns {JSX.Element|null}
 */
export default function EditProfileModal({ open, initial, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    name: '',
    userAgent: '',
    os: '',
    arch: '64-bit',
    browser: 'Auto',
    screen: 'Auto',
    canvas: 'Noise',
    clientRects: 'Off',
    audioContext: 'Off',
    webglImage: 'Off',
    webglMetadata: 'Mask',
    geoEnabled: false,
    geoMode: 'original',
    webrtcMainIp: false,
    proxyMode: 'Manual',
    proxy: { host: '', port: '', username: '', password: '' },
  })

  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // Load initial data when modal opens
  useEffect(() => {
    if (open && initial) {
      setIsInitialLoad(true)
      setFormData({
        name: initial.name || '',
        userAgent: initial.userAgent || '',
        os: initial.os || '',
        arch: initial.arch || '64-bit',
        browser: initial.browser || 'Auto',
        screen: initial.screen || 'Auto',
        canvas: initial.canvas || 'Noise',
        clientRects: initial.clientRects || 'Off',
        audioContext: initial.audioContext || 'Off',
        webglImage: initial.webglImage || 'Off',
        webglMetadata: initial.webglMetadata || 'Mask',
        geoEnabled: initial.geoEnabled || false,
        geoMode: initial.geoMode || 'original',
        webrtcMainIp: initial.webrtcMainIp || false,
        proxyMode: initial.proxyMode || 'Manual',
        proxy: initial.proxy || { host: '', port: '', username: '', password: '' },
      })
      setTimeout(() => setIsInitialLoad(false), 100)
    } else if (open && !initial) {
      setIsInitialLoad(true)
      setFormData({
        name: '',
        userAgent: '',
        os: '',
        arch: '64-bit',
        browser: 'Auto',
        screen: 'Auto',
        canvas: 'Noise',
        clientRects: 'Off',
        audioContext: 'Off',
        webglImage: 'Off',
        webglMetadata: 'Mask',
        geoEnabled: false,
        geoMode: 'original',
        webrtcMainIp: false,
        proxyMode: 'Manual',
        proxy: { host: '', port: '', username: '', password: '' },
      })
      setTimeout(() => setIsInitialLoad(false), 100)
    }
  }, [open, initial])

  // Handle Esc key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }
    
    if (open) {
      window.addEventListener('keydown', handleKeyDown)
      return () => {
        window.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [open, onClose])

  const generateUserAgent = useCallback(async (skipCheck = false, currentFormData) => {
    if (!currentFormData) return
    
    if (!skipCheck && !currentFormData.os) {
      return
    }

    try {
      const browserMap = {
        'Chrome': 'chrome',
        'Chromium (default)': 'chrome',
        'Firefox': 'firefox',
        'Edge': 'edge',
        'Auto': 'chrome'
      }

      const browser = browserMap[currentFormData.browser] || 'chrome'
      let os = currentFormData.os

      if (!os) return

      if (os.startsWith('macOS')) {
        os = 'Mac OS'
      } else if (os.startsWith('Windows')) {
        os = os
      } else if (os === 'Linux') {
        os = 'Linux'
      } else if (os === 'Android') {
        os = 'Android'
      } else if (os === 'iOS') {
        os = 'iOS'
      }

      const response = await axios.post('/api/profiles/user-agent', {
        browser,
        os,
        versionHint: 138
      })

      if (response.data?.success && response.data?.userAgent) {
        setFormData((prev) => ({
          ...prev,
          userAgent: response.data.userAgent
        }))
      }
    } catch (error) {
      console.error('Error generating user agent:', error)
    }
  }, [])

  // Auto-generate User Agent when OS, browser, or arch changes
  useEffect(() => {
    if (!isInitialLoad && formData.os) {
      generateUserAgent(true, formData)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.os, formData.browser, formData.arch, isInitialLoad])

  const handleChange = (field, value) => {
    if (field.startsWith('proxy.')) {
      const proxyField = field.split('.')[1]
      setFormData((prev) => ({
        ...prev,
        proxy: {
          ...prev.proxy,
          [proxyField]: value,
        },
      }))
    } else {
      const prevOs = formData.os
      setFormData((prev) => {
        const updated = {
          ...prev,
          [field]: value,
        }
        if (field === 'os' && value !== prevOs && value) {
          updated.userAgent = ''
        }
        return updated
      })
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onUpdate({
      ...formData,
      id: initial?.id,
    })
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white dark:bg-[#0a0a0a] rounded-xl shadow-xl flex flex-col"
        style={{ 
          width: 'calc(100vw - 64px)', 
          maxWidth: '1600px',
          minWidth: '800px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2a2a2a] flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-foreground">Edit Profile</h2>
        </div>

        {/* Scrollable Form Content */}
        <form id="edit-profile-form" onSubmit={handleSubmit} className="flex-1 max-h-[70vh] overflow-y-auto">
          <div className="px-6 py-4 space-y-6">
            {/* General Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-foreground">General</h3>
              
              <div>
                <label htmlFor="profile-name" className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
                  Name *
                </label>
                <input
                  id="profile-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="profile-ua" className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
                  User Agent
                </label>
                <div className="flex gap-2">
                  <textarea
                    id="profile-ua"
                    value={formData.userAgent}
                    onChange={(e) => handleChange('userAgent', e.target.value)}
                    rows={3}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                    placeholder="Mozilla/5.0..."
                  />
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => generateUserAgent(false, formData)}
                      disabled={!formData.os}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 whitespace-nowrap"
                    >
                      Generate
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Mặc định hệ thống tự sinh UA duy nhất, bạn chỉ nên sửa khi thật cần.
                </p>
              </div>
            </div>

            {/* System Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-foreground">System</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="profile-os" className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
                    OS
                  </label>
                  <select
                    id="profile-os"
                    value={formData.os}
                    onChange={(e) => handleChange('os', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="OS"
                  >
                    <option value="">Select OS</option>
                    <option value="Windows 10">Windows 10</option>
                    <option value="Windows 11">Windows 11</option>
                    <option value="macOS">macOS</option>
                    <option value="macOS M1">macOS M1</option>
                    <option value="macOS M2">macOS M2</option>
                    <option value="macOS M3">macOS M3</option>
                    <option value="macOS M4">macOS M4</option>
                    <option value="Linux">Linux</option>
                    <option value="Android">Android</option>
                    <option value="iOS">iOS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
                    Architecture
                  </label>
                  <select
                    value={formData.arch}
                    onChange={(e) => handleChange('arch', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="32-bit">32-bit</option>
                    <option value="64-bit">64-bit</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="profile-browser" className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
                    Browser
                  </label>
                  <select
                    id="profile-browser"
                    value={formData.browser}
                    onChange={(e) => handleChange('browser', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Browser"
                  >
                    <option value="Auto">Auto</option>
                    <option value="Chrome">Chrome</option>
                    <option value="Chromium (default)">Chromium (default)</option>
                    <option value="Firefox">Firefox</option>
                    <option value="Edge">Edge</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="profile-screen" className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
                    Screen Resolution
                  </label>
                  <select
                    id="profile-screen"
                    value={formData.screen}
                    onChange={(e) => handleChange('screen', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Screen Resolution"
                  >
                    <option value="Auto">Auto</option>
                    <option value="1366x768">1366x768</option>
                    <option value="1600x900">1600x900</option>
                    <option value="1920x1080">1920x1080</option>
                    <option value="2560x1440">2560x1440</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Fingerprint Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-foreground">Fingerprint</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div role="radiogroup" aria-label="Canvas">
                  <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
                    Canvas
                  </label>
                  <select
                    value={formData.canvas}
                    onChange={(e) => handleChange('canvas', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Canvas"
                  >
                    <option value="Noise">Noise</option>
                    <option value="Off">Off</option>
                    <option value="Block">Block</option>
                  </select>
                </div>

                <div role="radiogroup" aria-label="Client Rects">
                  <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
                    Client Rects
                  </label>
                  <select
                    value={formData.clientRects}
                    onChange={(e) => handleChange('clientRects', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Client Rects"
                  >
                    <option value="Off">Off</option>
                    <option value="Noise">Noise</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div role="radiogroup" aria-label="Audio Context">
                  <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
                    Audio Context
                  </label>
                  <select
                    value={formData.audioContext}
                    onChange={(e) => handleChange('audioContext', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Audio Context"
                  >
                    <option value="Off">Off</option>
                    <option value="Noise">Noise</option>
                  </select>
                </div>

                <div role="radiogroup" aria-label="WebGL Image">
                  <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
                    WebGL Image
                  </label>
                  <select
                    value={formData.webglImage}
                    onChange={(e) => handleChange('webglImage', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="WebGL Image"
                  >
                    <option value="Off">Off</option>
                    <option value="Noise">Noise</option>
                  </select>
                </div>
              </div>

              <div role="radiogroup" aria-label="WebGL Metadata">
                <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
                  WebGL Metadata
                </label>
                <select
                  value={formData.webglMetadata}
                  onChange={(e) => handleChange('webglMetadata', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="WebGL Metadata"
                >
                  <option value="Mask">Mask</option>
                  <option value="Real">Real</option>
                </select>
              </div>
            </div>

            {/* Privacy Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-foreground">Privacy</h3>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.geoEnabled}
                    onChange={(e) => handleChange('geoEnabled', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-foreground">Geolocation Enabled</span>
                </label>

                {formData.geoEnabled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
                      Geo Mode
                    </label>
                    <select
                      value={formData.geoMode}
                      onChange={(e) => handleChange('geoMode', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="original">Original</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                )}

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.webrtcMainIp}
                    onChange={(e) => handleChange('webrtcMainIp', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-foreground">WebRTC Main IP</span>
                </label>
              </div>
            </div>

            {/* Proxy Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-foreground">Proxy</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
                  Proxy Mode
                </label>
                <select
                  value={formData.proxyMode}
                  onChange={(e) => handleChange('proxyMode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Manual">Manual</option>
                  <option value="Library">Library</option>
                </select>
              </div>

              {formData.proxyMode === 'Manual' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="profile-proxy-host" className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
                      Host
                    </label>
                    <input
                      id="profile-proxy-host"
                      type="text"
                      value={formData.proxy?.host || ''}
                      onChange={(e) => handleChange('proxy.host', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="192.168.1.1"
                    />
                  </div>

                  <div>
                    <label htmlFor="profile-proxy-port" className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
                      Port
                    </label>
                    <input
                      id="profile-proxy-port"
                      type="text"
                      value={formData.proxy?.port || ''}
                      onChange={(e) => handleChange('proxy.port', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="8080"
                    />
                  </div>

                  <div>
                    <label htmlFor="profile-proxy-username" className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
                      Username
                    </label>
                    <input
                      id="profile-proxy-username"
                      type="text"
                      value={formData.proxy?.username || ''}
                      onChange={(e) => handleChange('proxy.username', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Optional"
                    />
                  </div>

                  <div>
                    <label htmlFor="profile-proxy-password" className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
                      Password
                    </label>
                    <input
                      id="profile-proxy-password"
                      type="password"
                      value={formData.proxy?.password || ''}
                      onChange={(e) => handleChange('proxy.password', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Optional"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-[#2a2a2a] flex-shrink-0 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-foreground bg-white dark:bg-[#0f0f0f] border border-gray-300 dark:border-[#2a2a2a] rounded-md hover:bg-gray-50 dark:hover:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-profile-form"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  )
}

