import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { USER_AGENT_LIBRARY } from '../constants/user-agents'
import { WEBGL_RENDERER_LIBRARY, getWebGLRenderersByOS } from '../constants/webgl-renderers'

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
      canvasMode: 'Noise',
      clientRects: 'Off',
      clientRectsMode: 'Off',
      audioContext: 'Off',
      audioContextMode: 'Off',
      webglImage: 'Off',
      webglImageMode: 'Off',
      webglMetadata: 'Mask',
      webglMetaMode: 'Mask',
      webglRenderer: '',
      webglVendor: '',
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
        canvasMode: initial.canvasMode || initial.canvas || 'Noise',
        clientRects: initial.clientRects || initial.clientRectsMode || 'Off',
        clientRectsMode: initial.clientRectsMode || initial.clientRects || 'Off',
        audioContext: initial.audioContext || initial.audioCtxMode || initial.audioContextMode || 'Off',
        audioContextMode: initial.audioContextMode || initial.audioCtxMode || initial.audioContext || 'Off',
        webglImage: initial.webglImage || initial.webglImageMode || 'Off',
        webglImageMode: initial.webglImageMode || initial.webglImage || 'Off',
        webglMetadata: initial.webglMetadata || initial.webglMetaMode || 'Mask',
        webglMetaMode: initial.webglMetaMode || initial.webglMetadata || 'Mask',
        webglRenderer: initial.webglRenderer || '',
        webglVendor: initial.webglVendor || '',
        geoEnabled: initial.geoEnabled || false,
        geoMode: initial.geoMode || 'original',
        webrtcMainIp: initial.webrtcMainIp || initial.webrtcMainIP || false,
        proxyMode: initial.proxyMode || 'Manual',
        proxy: initial.proxy || { host: '', port: '', username: '', password: '' },
      })
      
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
        canvasMode: 'Noise',
        clientRects: 'Off',
        clientRectsMode: 'Off',
        audioContext: 'Off',
        audioContextMode: 'Off',
        webglImage: 'Off',
        webglImageMode: 'Off',
        webglMetadata: 'Mask',
        webglMetaMode: 'Mask',
        webglRenderer: '',
        webglVendor: '',
        geoEnabled: false,
        geoMode: 'original',
        webrtcMainIp: false,
        proxyMode: 'Manual',
        proxy: { host: '', port: '', username: '', password: '' },
      })
      setFingerprintJson('');
      setTimeout(() => setIsInitialLoad(false), 100)
    }
  }, [open, initial])

  // --- BỘ NÃO ĐỒNG BỘ HÓA: TỪ LỰA CHỌN -> XUỐNG JSON ---
  useEffect(() => {
    if (isInitialLoad) return; 

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
      canvasMode: profile.canvas || profile.canvasMode,
      clientRectsMode: profile.clientRects || profile.clientRectsMode,
      audioCtxMode: profile.audioContext || profile.audioContextMode,
      webglImageMode: profile.webglImage || profile.webglImageMode,
      webglMetaMode: profile.webglMetadata || profile.webglMetaMode,
      geoEnabled: profile.geoEnabled,
      webrtcMainIP: profile.webrtcMainIp,
    };
    setFingerprintJson(JSON.stringify(generatedObject, null, 2));
  }, [profile, isInitialLoad]);

  // Helper functions (Giữ nguyên)
  const detectOSFromUserAgent = (ua) => {
    if (!ua) return null;
    const uaLower = ua.toLowerCase();
    if (uaLower.includes('windows nt')) {
      if (uaLower.includes('windows nt 10.0')) return uaLower.includes('win64') || uaLower.includes('x64') ? 'Windows 11' : 'Windows 10';
      return 'Windows 10';
    }
    if (uaLower.includes('macintosh') || uaLower.includes('mac os x')) return 'macOS';
    if (uaLower.includes('linux x86_64') || uaLower.includes('x11; linux')) return 'Linux';
    if (uaLower.includes('android')) return 'Android';
    if (uaLower.includes('iphone') || uaLower.includes('ipad') || uaLower.includes('cpu iphone os')) return 'iOS';
    return null;
  };

  const normalizeOS = (os) => {
    if (!os) return null;
    const osLower = os.toLowerCase();
    if (osLower.includes('windows')) return 'Windows';
    if (osLower.includes('mac') || osLower.includes('macos')) return 'macOS';
    if (osLower.includes('linux')) return 'Linux';
    if (osLower.includes('android')) return 'Android';
    if (osLower.includes('ios')) return 'iOS';
    return os;
  };

  const getUserAgentsByOS = (os) => {
    if (!os) return USER_AGENT_LIBRARY;
    const normalizedOS = normalizeOS(os);
    if (!normalizedOS) return USER_AGENT_LIBRARY;
    return USER_AGENT_LIBRARY.filter(agent => {
      const agentOS = normalizeOS(agent.os);
      return agentOS === normalizedOS;
    });
  };

  const isUserAgentCompatibleWithOS = (ua, os) => {
    if (!ua || !os) return true;
    const detectedOS = detectOSFromUserAgent(ua);
    if (!detectedOS) return true;
    return normalizeOS(detectedOS) === normalizeOS(os);
  };

  // --- HANDLERS ---
  const handleUserAgentChange = (e) => {
    const selectedValue = e.target.value;
    const selectedAgent = USER_AGENT_LIBRARY.find(agent => agent.value === selectedValue);
    if (selectedAgent) {
      const newOS = selectedAgent.os;
      const compatibleGPUs = getWebGLRenderersByOS(newOS);
      const randomGPU = compatibleGPUs.length > 0 ? compatibleGPUs[Math.floor(Math.random() * compatibleGPUs.length)] : null;
      setProfile(prev => ({
        ...prev,
        userAgent: selectedAgent.value,
        os: newOS,
        webglRenderer: randomGPU ? randomGPU.renderer : prev.webglRenderer,
        webglVendor: randomGPU ? randomGPU.vendor : prev.webglVendor,
      }));
      return;
    }
    
    const detectedOS = detectOSFromUserAgent(selectedValue);
    if (detectedOS) {
      const compatibleGPUs = getWebGLRenderersByOS(detectedOS);
      const randomGPU = compatibleGPUs.length > 0 ? compatibleGPUs[Math.floor(Math.random() * compatibleGPUs.length)] : null;
      setProfile(prev => ({
        ...prev,
        userAgent: selectedValue,
        os: detectedOS,
        webglRenderer: randomGPU ? randomGPU.renderer : prev.webglRenderer,
        webglVendor: randomGPU ? randomGPU.vendor : prev.webglVendor,
      }));
    } else {
      setProfile(prev => ({ ...prev, userAgent: selectedValue }));
    }
  };

  const handleOSChange = (e) => {
    const newOS = e.target.value;
    setProfile(prev => {
      const isCompatible = isUserAgentCompatibleWithOS(prev.userAgent, newOS);
      const compatibleAgents = getUserAgentsByOS(newOS);
      const randomAgent = compatibleAgents.length > 0 ? compatibleAgents[Math.floor(Math.random() * compatibleAgents.length)] : null;
      const compatibleGPUs = getWebGLRenderersByOS(newOS);
      const randomGPU = compatibleGPUs.length > 0 ? compatibleGPUs[Math.floor(Math.random() * compatibleGPUs.length)] : null;
      
      return {
        ...prev,
        os: newOS,
        userAgent: (!isCompatible || !prev.userAgent) && randomAgent ? randomAgent.value : prev.userAgent,
        webglRenderer: randomGPU ? randomGPU.renderer : prev.webglRenderer,
        webglVendor: randomGPU ? randomGPU.vendor : prev.webglVendor,
      };
    });
  };

  const handleScreenResolutionChange = (e) => {
    const screenStr = e.target.value;
    if (screenStr === 'Auto') {
      setProfile(prev => ({ ...prev, screen: 'Auto', screenWidth: 1920, screenHeight: 1080 }));
    } else {
      const match = screenStr.match(/(\d+)x(\d+)/);
      if (match) {
        setProfile(prev => ({ ...prev, screen: screenStr, screenWidth: parseInt(match[1], 10), screenHeight: parseInt(match[2], 10) }));
      }
    }
  };

  const handleScreenWidthChange = (e) => setProfile(prev => ({ ...prev, screenWidth: parseInt(e.target.value, 10) || 1920, screen: `${parseInt(e.target.value, 10) || 1920}x${prev.screenHeight}` }));
  const handleScreenHeightChange = (e) => setProfile(prev => ({ ...prev, screenHeight: parseInt(e.target.value, 10) || 1080, screen: `${prev.screenWidth}x${parseInt(e.target.value, 10) || 1080}` }));

  const generateFingerprint = () => {
    const osOptions = ['Windows', 'Windows 10', 'Windows 11', 'macOS'];
    const randomOS = osOptions[Math.floor(Math.random() * osOptions.length)];
    const compatibleAgents = getUserAgentsByOS(randomOS);
    const randomAgent = compatibleAgents.length > 0 ? compatibleAgents[Math.floor(Math.random() * compatibleAgents.length)] : USER_AGENT_LIBRARY[0];
    const compatibleGPUs = getWebGLRenderersByOS(randomOS);
    const randomGPU = compatibleGPUs.length > 0 ? compatibleGPUs[Math.floor(Math.random() * compatibleGPUs.length)] : null;
    const resolutions = [{ w: 1920, h: 1080 }, { w: 1366, h: 768 }, { w: 1600, h: 900 }, { w: 2560, h: 1440 }];
    const randomRes = resolutions[Math.floor(Math.random() * resolutions.length)];
    const canvasModes = ['Noise', 'Off', 'Block'];
    const offNoiseModes = ['Noise', 'Off'];
    const webglMetaModes = ['Mask', 'Real'];

    return {
      userAgent: randomAgent.value,
      os: randomOS,
      webglRenderer: randomGPU ? randomGPU.renderer : profile.webglRenderer,
      webglVendor: randomGPU ? randomGPU.vendor : profile.webglVendor,
      screenWidth: randomRes.w,
      screenHeight: randomRes.h,
      screen: `${randomRes.w}x${randomRes.h}`,
      canvas: canvasModes[Math.floor(Math.random() * canvasModes.length)],
      canvasMode: canvasModes[Math.floor(Math.random() * canvasModes.length)],
      clientRects: offNoiseModes[Math.floor(Math.random() * offNoiseModes.length)],
      clientRectsMode: offNoiseModes[Math.floor(Math.random() * offNoiseModes.length)],
      audioContext: offNoiseModes[Math.floor(Math.random() * offNoiseModes.length)],
      audioContextMode: offNoiseModes[Math.floor(Math.random() * offNoiseModes.length)],
      webglImage: offNoiseModes[Math.floor(Math.random() * offNoiseModes.length)],
      webglImageMode: offNoiseModes[Math.floor(Math.random() * offNoiseModes.length)],
      webglMetadata: webglMetaModes[Math.floor(Math.random() * webglMetaModes.length)],
      webglMetaMode: webglMetaModes[Math.floor(Math.random() * webglMetaModes.length)],
      geoEnabled: Math.random() > 0.5,
      webrtcMainIp: Math.random() > 0.5,
    };
  };

  // --- HÀM RANDOMIZE ALL (GIỮ TÊN) ---
  const handleRandomizeAll = () => {
    const randomData = generateFingerprint(); 
    const currentName = profile.name; // Lấy tên hiện tại từ state
    setProfile(prev => ({ ...prev, ...randomData, name: currentName })); // Update nhưng giữ tên
  };

  // --- HÀM SAVE FINGERPRINT TỪ JSON (KHẮC PHỤC LỖI RESET) ---
  const handleSaveFingerprint = () => {
    try {
      // 1. Parse JSON từ textarea
      const parsedData = JSON.parse(fingerprintJson);
      
      // 2. Update vào state profile nhưng GIỮ NGUYÊN TÊN
      const currentName = profile.name;
      
      setProfile(prev => ({
        ...prev,
        ...parsedData,
        // Map các trường khác tên nếu cần
        screen: parsedData.viewport ? `${parsedData.viewport.width}x${parsedData.viewport.height}` : prev.screen,
        screenWidth: parsedData.viewport ? parsedData.viewport.width : (parsedData.screenWidth || prev.screenWidth),
        screenHeight: parsedData.viewport ? parsedData.viewport.height : (parsedData.screenHeight || prev.screenHeight),
        // QUAN TRỌNG: Giữ lại tên
        name: currentName
      }));

      alert("Đã cập nhật dữ liệu từ JSON thành công!");
    } catch (e) {
      alert("Lỗi: Chuỗi JSON không hợp lệ!");
    }
  };

  const handleNestedFormChange = (parent, field, value) => setProfile((prev) => ({ ...prev, [parent]: { ...prev[parent], [field]: value } }));
  const handleFieldChange = (field, value) => setProfile(prev => ({ ...prev, [field]: value }));
  const handleChange = (field, value) => {
    if (field.startsWith('proxy.')) {
      const proxyField = field.split('.')[1];
      handleNestedFormChange('proxy', proxyField, value);
    } else {
      const prevOs = profile.os;
      if (field === 'os' && value !== prevOs && value) {
        setProfile((prev) => ({ ...prev, [field]: value, userAgent: '' }));
      } else {
        handleFieldChange(field, value);
      }
    }
  };

  // --- HÀM SUBMIT ---
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Logic Validation UserAgent và OS
    if (profile.userAgent && profile.os) {
      const isCompatible = isUserAgentCompatibleWithOS(profile.userAgent, profile.os);
      if (!isCompatible) {
        const detectedOS = detectOSFromUserAgent(profile.userAgent);
        if (detectedOS) {
           alert(`User Agent không khớp OS. Tự động chỉnh OS về ${detectedOS}`);
           setProfile(prev => ({...prev, os: detectedOS}));
           return;
        }
      }
    }

    const dataToSend = {
      ...profile,
      canvas: profile.canvas || profile.canvasMode,
      clientRects: profile.clientRects || profile.clientRectsMode,
      audioContext: profile.audioContext || profile.audioContextMode,
      webglImage: profile.webglImage || profile.webglImageMode,
      webglMetadata: profile.webglMetadata || profile.webglMetaMode,
      id: initial?.id,
    };

    // Tạo fingerprintJson để gửi kèm
    const finalFingerprintObject = {
      userAgent: profile.userAgent,
      os: profile.os,
      viewport: { width: profile.screenWidth, height: profile.screenHeight },
      canvasMode: profile.canvas,
      webglRenderer: profile.webglRenderer,
      webglVendor: profile.webglVendor,
      // ... thêm các trường khác nếu cần
    };
    dataToSend.fingerprint = finalFingerprintObject;
    dataToSend.fingerprintJson = JSON.stringify(finalFingerprintObject, null, 2);

    onUpdate(dataToSend);
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="relative bg-white dark:bg-[#0a0a0a] rounded-xl shadow-xl flex flex-col" style={{ width: 'calc(100vw - 64px)', maxWidth: '1600px', minWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2a2a2a] flex-shrink-0 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-foreground">Edit Profile</h2>
          <button type="button" onClick={handleRandomizeAll} className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md">
            🎲 Randomize All
          </button>
        </div>

        {/* Form */}
        <form id="edit-profile-form" onSubmit={handleSubmit} className="flex-1 max-h-[70vh] overflow-y-auto">
          <div className="px-6 py-4 space-y-6">

            {/* General */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-foreground">General</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">Name *</label>
                <input type="text" value={profile.name} onChange={(e) => handleFieldChange('name', e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-foreground" required />
              </div>
              {/* User Agent Input Section */}
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">User Agent</label>
                  <select value={profile.userAgent} onChange={handleUserAgentChange} className="w-full mb-2 px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-foreground">
                      <option value="">-- Chọn từ thư viện --</option>
                      {getUserAgentsByOS(profile.os).map(agent => (<option key={agent.name} value={agent.value}>{agent.name}</option>))}
                  </select>
                  <textarea value={profile.userAgent} onChange={(e) => handleFieldChange('userAgent', e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-foreground font-mono text-xs" />
              </div>
            </div>

            {/* System */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-foreground">System</h3>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">OS</label>
                      <input type="text" value={profile.os} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-gray-50 dark:bg-[#1a1a1a] text-gray-900 dark:text-foreground cursor-not-allowed" />
                      <select value={profile.os || ''} onChange={handleOSChange} className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-foreground">
                          <option value="">Chọn thủ công...</option>
                          <option value="Windows 10">Windows 10</option>
                          <option value="macOS">macOS</option>
                      </select>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">Browser</label>
                      <select value={profile.browser} onChange={(e) => handleFieldChange('browser', e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-foreground">
                          <option value="Auto">Auto</option>
                          <option value="Chrome">Chrome</option>
                          <option value="Firefox">Firefox</option>
                      </select>
                  </div>
              </div>
            </div>

            {/* Fingerprint JSON Area */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-foreground">Fingerprint (JSON)</h3>
                <textarea 
                    value={fingerprintJson} 
                    onChange={(e) => setFingerprintJson(e.target.value)} 
                    rows={8} 
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-foreground font-mono text-xs" 
                />
                {/* ĐÂY LÀ NÚT GÂY LỖI - ĐÃ ĐƯỢC SỬA TYPE='BUTTON' */}
                <button 
                    type="button" 
                    onClick={handleSaveFingerprint}
                    className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                    Save Fingerprint
                </button>
            </div>

            {/* Canvas & Others (Giữ nguyên logic hiển thị như cũ) */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-foreground">Fingerprint Settings</h3>
                <div>
                    <label className="block text-sm font-medium mb-2">Canvas</label>
                    <div className="flex gap-2">
                        {['Noise', 'Off', 'Block'].map(mode => (
                            <button key={mode} type="button" onClick={() => { handleFieldChange('canvas', mode); handleFieldChange('canvasMode', mode); }}
                                className={`px-4 py-2 rounded-md text-sm ${ (profile.canvas === mode) ? 'bg-green-600 text-white' : 'bg-white border text-gray-700' }`}>
                                {mode}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

          </div>
        </form>

        {/* Footer Buttons */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-[#2a2a2a] flex-shrink-0 flex justify-end space-x-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
          <button type="submit" form="edit-profile-form" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md">Update</button>
        </div>

      </div>
    </div>
  )
}
