import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { USER_AGENT_LIBRARY } from '../constants/user-agents'

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
  // --- NGUỒN CHÂN LÝ DUY NHẤT ---
  const [profile, setProfile] = useState(() => {
    const initialAgent = USER_AGENT_LIBRARY[0] || { value: '', os: '' };
    return {
      name: '',
      userAgent: initialAgent.value,
      os: initialAgent.os,
      arch: '64-bit',
      browser: 'Auto',
      screen: 'Auto',
      screenWidth: 1920,
      screenHeight: 1080,
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
    };
  });

  // State để quản lý nội dung của ô JSON
  const [fingerprintJson, setFingerprintJson] = useState('');

  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // Load initial data when modal opens
  useEffect(() => {
    if (open && initial) {
      setIsInitialLoad(true)
      // Parse screen resolution string thành width/height
      const parseScreenResolution = (screenStr) => {
        if (!screenStr || screenStr === 'Auto') return { width: 1920, height: 1080 }
        const match = screenStr.match(/(\d+)x(\d+)/)
        if (match) {
          return { width: parseInt(match[1], 10), height: parseInt(match[2], 10) }
        }
        return { width: 1920, height: 1080 }
      }
      const { width, height } = parseScreenResolution(initial.screen)
      
      setProfile({
        name: initial.name || '',
        userAgent: initial.userAgent || initial.user_agent || USER_AGENT_LIBRARY[0]?.value || '',
        os: initial.os || initial.osName || USER_AGENT_LIBRARY[0]?.os || '',
        arch: initial.arch || '64-bit',
        browser: initial.browser || 'Auto',
        screen: initial.screen || 'Auto',
        screenWidth: initial.screenWidth || width,
        screenHeight: initial.screenHeight || height,
        canvas: initial.canvas || initial.canvasMode || 'Noise',
        clientRects: initial.clientRects || initial.clientRectsMode || 'Off',
        audioContext: initial.audioContext || initial.audioCtxMode || 'Off',
        webglImage: initial.webglImage || initial.webglImageMode || 'Off',
        webglMetadata: initial.webglMetadata || initial.webglMetaMode || 'Mask',
        geoEnabled: initial.geoEnabled || false,
        geoMode: initial.geoMode || 'original',
        webrtcMainIp: initial.webrtcMainIp || initial.webrtcMainIP || false,
        proxyMode: initial.proxyMode || 'Manual',
        proxy: initial.proxy || { host: '', port: '', username: '', password: '' },
      })
      
      // Set fingerprintJson từ initial data nếu có
      if (initial.fingerprintJson || initial.fingerprint) {
        setFingerprintJson(JSON.stringify(initial.fingerprintJson || initial.fingerprint, null, 2));
      }
      
      setTimeout(() => setIsInitialLoad(false), 100)
    } else if (open && !initial) {
      setIsInitialLoad(true)
      const initialAgent = USER_AGENT_LIBRARY[0] || { value: '', os: '' };
      setProfile({
        name: '',
        userAgent: initialAgent.value,
        os: initialAgent.os,
        arch: '64-bit',
        browser: 'Auto',
        screen: 'Auto',
        screenWidth: 1920,
        screenHeight: 1080,
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
      setFingerprintJson(''); // Reset fingerprintJson khi tạo mới
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

  // --- BỘ NÃO ĐỒNG BỘ HÓA: TỪ LỰA CHỌN -> XUỐNG JSON ---
  useEffect(() => {
    if (isInitialLoad) return; // Bỏ qua lần render đầu tiên

    const generatedObject = {
      userAgent: profile.userAgent,
      user_agent: profile.userAgent,
      os: profile.os,
      osName: profile.os,
      viewport: { 
        width: profile.screenWidth, 
        height: profile.screenHeight 
      },
      screenWidth: profile.screenWidth,
      screenHeight: profile.screenHeight,
      canvasMode: profile.canvas,
      clientRectsMode: profile.clientRects,
      audioCtxMode: profile.audioContext,
      webglImageMode: profile.webglImage,
      webglMetaMode: profile.webglMetadata,
      geoEnabled: profile.geoEnabled,
      webrtcMainIP: profile.webrtcMainIp,
    };
    setFingerprintJson(JSON.stringify(generatedObject, null, 2));
  }, [profile, isInitialLoad]); // Chạy mỗi khi state `profile` thay đổi

  // --- HÀM CẬP NHẬT TỪ CÁC DROPDOWN ---
  const handleUserAgentChange = (e) => {
    const selectedAgent = USER_AGENT_LIBRARY.find(agent => agent.value === e.target.value);
    if (selectedAgent) {
      setProfile(prev => ({
        ...prev,
        userAgent: selectedAgent.value,
        os: selectedAgent.os,
      }));
    }
  };

  const handleScreenResolutionChange = (e) => {
    const screenStr = e.target.value;
    if (screenStr === 'Auto') {
      setProfile(prev => ({
        ...prev,
        screen: 'Auto',
        screenWidth: 1920,
        screenHeight: 1080
      }));
    } else {
      const match = screenStr.match(/(\d+)x(\d+)/);
      if (match) {
        const width = parseInt(match[1], 10);
        const height = parseInt(match[2], 10);
        setProfile(prev => ({
          ...prev,
          screen: screenStr,
          screenWidth: width,
          screenHeight: height
        }));
      }
    }
  };

  const handleScreenWidthChange = (e) => {
    const width = parseInt(e.target.value, 10) || 1920;
    setProfile(prev => ({
      ...prev,
      screenWidth: width,
      screen: `${width}x${prev.screenHeight}`
    }));
  };

  const handleScreenHeightChange = (e) => {
    const height = parseInt(e.target.value, 10) || 1080;
    setProfile(prev => ({
      ...prev,
      screenHeight: height,
      screen: `${prev.screenWidth}x${height}`
    }));
  };

  // --- HÀM RANDOMIZE ALL ---
  const handleRandomizeAll = () => {
    // Lấy ngẫu nhiên một user agent từ thư viện
    const randomAgent = USER_AGENT_LIBRARY[Math.floor(Math.random() * USER_AGENT_LIBRARY.length)];
    
    // Lấy ngẫu nhiên một độ phân giải
    const resolutions = [
      { w: 1920, h: 1080 },
      { w: 1366, h: 768 },
      { w: 1600, h: 900 },
      { w: 2560, h: 1440 }
    ];
    const randomRes = resolutions[Math.floor(Math.random() * resolutions.length)];

    // Randomize các trường fingerprint
    const canvasModes = ['Noise', 'Off', 'Block'];
    const offNoiseModes = ['Off', 'Noise'];
    const webglMetaModes = ['Mask', 'Real'];

    // Cập nhật TOÀN BỘ state cùng lúc
    setProfile(prev => ({
      ...prev,
      userAgent: randomAgent.value,
      os: randomAgent.os,
      screenWidth: randomRes.w,
      screenHeight: randomRes.h,
      screen: `${randomRes.w}x${randomRes.h}`,
      canvas: canvasModes[Math.floor(Math.random() * canvasModes.length)],
      clientRects: offNoiseModes[Math.floor(Math.random() * offNoiseModes.length)],
      audioContext: offNoiseModes[Math.floor(Math.random() * offNoiseModes.length)],
      webglImage: offNoiseModes[Math.floor(Math.random() * offNoiseModes.length)],
      webglMetadata: webglMetaModes[Math.floor(Math.random() * webglMetaModes.length)],
      geoEnabled: Math.random() > 0.5,
      webrtcMainIp: Math.random() > 0.5,
    }));
  };

  const handleNestedFormChange = (parent, field, value) => {
    setProfile((prev) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value,
      },
    }))
  }

  const handleFieldChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  }

  const generateUserAgent = useCallback(async (skipCheck = false, currentProfile) => {
    if (!currentProfile) return
    
    if (!skipCheck && !currentProfile.os) {
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

      const browser = browserMap[currentProfile.browser] || 'chrome'
      let os = currentProfile.os

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
        setProfile((prev) => ({
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
    if (!isInitialLoad && profile.os) {
      generateUserAgent(true, profile)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.os, profile.browser, profile.arch, isInitialLoad])

  const handleChange = (field, value) => {
    if (field.startsWith('proxy.')) {
      const proxyField = field.split('.')[1]
      handleNestedFormChange('proxy', proxyField, value)
    } else {
      const prevOs = profile.os
      if (field === 'os' && value !== prevOs && value) {
        setProfile((prev) => ({
          ...prev,
          [field]: value,
          userAgent: '',
        }))
      } else {
        handleFieldChange(field, value)
      }
    }
  }

  // --- HÀM SUBMIT ---
  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Parse fingerprintJson nếu có (cho phép user paste JSON vào)
    let finalFingerprint = null;
    try {
      finalFingerprint = JSON.parse(fingerprintJson);
    } catch (error) {
      // Nếu parse lỗi, tạo từ profile state
      finalFingerprint = {
        userAgent: profile.userAgent,
        user_agent: profile.userAgent,
        os: profile.os,
        osName: profile.os,
        viewport: {
          width: profile.screenWidth,
          height: profile.screenHeight,
        },
        screenWidth: profile.screenWidth,
        screenHeight: profile.screenHeight,
        canvasMode: profile.canvas,
        clientRectsMode: profile.clientRects,
        audioCtxMode: profile.audioContext,
        webglImageMode: profile.webglImage,
        webglMetaMode: profile.webglMetadata,
        geoEnabled: profile.geoEnabled,
        webrtcMainIP: profile.webrtcMainIp,
      };
    }

    const dataToSend = {
      ...profile,
      id: initial?.id,
      fingerprint: finalFingerprint,
      fingerprintJson: fingerprintJson || JSON.stringify(finalFingerprint, null, 2),
    };

    console.log("Dữ liệu gửi đi:", dataToSend);
    onUpdate(dataToSend);
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
        <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2a2a2a] flex-shrink-0 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-foreground">Edit Profile</h2>
          <button
            type="button"
            onClick={handleRandomizeAll}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            🎲 Randomize All
          </button>
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
                  value={profile.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="profile-ua" className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
                  User Agent
                </label>
                
                {/* Dropdown User Agent từ thư viện */}
                <div className="mb-2">
                  <select
                    id="profile-ua-select"
                    value={profile.userAgent}
                    onChange={handleUserAgentChange} // <--- GỌI HÀM GIAO TIẾP
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Chọn từ thư viện hoặc nhập thủ công --</option>
                    {USER_AGENT_LIBRARY.map(agent => (
                      <option key={agent.name} value={agent.value}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Chọn User Agent từ thư viện sẽ tự động cập nhật OS tương ứng.
                  </p>
                </div>

                <div className="flex gap-2">
                  <textarea
                    id="profile-ua"
                    value={profile.userAgent}
                    onChange={(e) => handleFieldChange('userAgent', e.target.value)}
                    rows={3}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                    placeholder="Mozilla/5.0..."
                  />
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => generateUserAgent(false, profile)}
                      disabled={!profile.os}
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
                    OS <span className="text-xs text-gray-500">(Tự động cập nhật khi chọn User Agent)</span>
                  </label>
                  <input
                    id="profile-os"
                    type="text"
                    value={profile.os} // <--- LUÔN ĐỒNG BỘ VỚI STATE
                    readOnly // Người dùng không nên sửa tay trường này khi đã chọn từ thư viện
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-gray-50 dark:bg-[#1a1a1a] text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-not-allowed"
                    aria-label="OS"
                    placeholder="Chọn User Agent từ thư viện để tự động điền"
                  />
                  {/* Vẫn cho phép chọn thủ công nếu cần */}
                  <select
                    id="profile-os-select"
                    value={profile.os}
                    onChange={(e) => {
                      const newOs = e.target.value
                      setProfile((prev) => ({
                        ...prev,
                        os: newOs,
                        userAgent: newOs !== prev.os && newOs ? '' : prev.userAgent
                      }))
                    }}
                    className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="OS Select"
                  >
                    <option value="">Hoặc chọn OS thủ công</option>
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
                    value={profile.arch}
                    onChange={(e) => handleFieldChange('arch', e.target.value)}
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
                    value={profile.browser}
                    onChange={(e) => handleFieldChange('browser', e.target.value)}
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
                    value={profile.screen}
                    onChange={handleScreenResolutionChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Screen Resolution"
                  >
                    <option value="Auto">Auto</option>
                    <option value="1366x768">1366x768</option>
                    <option value="1600x900">1600x900</option>
                    <option value="1920x1080">1920x1080</option>
                    <option value="2560x1440">2560x1440</option>
                  </select>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Width</label>
                      <input
                        type="number"
                        value={profile.screenWidth}
                        onChange={handleScreenWidthChange}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Height</label>
                      <input
                        type="number"
                        value={profile.screenHeight}
                        onChange={handleScreenHeightChange}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-foreground"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fingerprint Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-foreground">Fingerprint</h3>
              
              {/* Ô Fingerprint (JSON) - Tự động đồng bộ từ các trường khác */}
              <div>
                <label htmlFor="profile-fingerprint-json" className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
                  Fingerprint JSON <span className="text-xs text-gray-500">(Tự động cập nhật khi thay đổi các trường trên)</span>
                </label>
                <textarea
                  id="profile-fingerprint-json"
                  value={fingerprintJson}
                  onChange={(e) => {
                    // Đây là phần dành cho chuyên gia: cho phép dán JSON vào
                    // Khi dán vào, chúng ta có thể cố gắng parse và cập nhật ngược lại state `profile`
                    // Hoặc đơn giản là chỉ lưu chuỗi JSON này khi submit
                    setFingerprintJson(e.target.value);
                  }}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                  placeholder='{"userAgent": "...", "viewport": {...}, ...}'
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  JSON này được tự động tạo từ các trường trên. Bạn có thể chỉnh sửa trực tiếp hoặc dán JSON vào đây.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div role="radiogroup" aria-label="Canvas">
                  <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
                    Canvas
                  </label>
                  <select
                    value={profile.canvas}
                    onChange={(e) => handleFieldChange('canvas', e.target.value)}
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
                    value={profile.clientRects}
                    onChange={(e) => handleFieldChange('clientRects', e.target.value)}
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
                    value={profile.audioContext}
                    onChange={(e) => handleFieldChange('audioContext', e.target.value)}
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
                    value={profile.webglImage}
                    onChange={(e) => handleFieldChange('webglImage', e.target.value)}
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
                  value={profile.webglMetadata}
                  onChange={(e) => handleFieldChange('webglMetadata', e.target.value)}
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
                    checked={profile.geoEnabled}
                    onChange={(e) => handleFieldChange('geoEnabled', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-foreground">Geolocation Enabled</span>
                </label>

                {profile.geoEnabled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
                      Geo Mode
                    </label>
                    <select
                      value={profile.geoMode}
                      onChange={(e) => handleFieldChange('geoMode', e.target.value)}
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
                    checked={profile.webrtcMainIp}
                    onChange={(e) => handleFieldChange('webrtcMainIp', e.target.checked)}
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
                  value={profile.proxyMode}
                  onChange={(e) => handleFieldChange('proxyMode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Manual">Manual</option>
                  <option value="Library">Library</option>
                </select>
              </div>

              {profile.proxyMode === 'Manual' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="profile-proxy-host" className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
                      Host
                    </label>
                    <input
                      id="profile-proxy-host"
                      type="text"
                      value={profile.proxy?.host || ''}
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
                      value={profile.proxy?.port || ''}
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
                      value={profile.proxy?.username || ''}
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
                      value={profile.proxy?.password || ''}
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

