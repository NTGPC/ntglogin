import { useState, useEffect } from 'react'
import { USER_AGENT_LIBRARY } from '../constants/user-agents'
import { WEBGL_RENDERER_LIBRARY, getWebGLRenderersByOS } from '../constants/webgl-renderers'

export default function EditProfileModal({ open, initial, onClose, onUpdate }) {
  // --- STATE ---
  const [profile, setProfile] = useState(() => ({
    name: '',
    userAgent: USER_AGENT_LIBRARY[0]?.value || '',
    os: USER_AGENT_LIBRARY[0]?.os || 'Windows 10',
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
    proxyMode: 'Manual', // 'Manual' | 'Library'
    proxy: { host: '', port: '', username: '', password: '' }, // Proxy Config or Proxy ID
    proxyId: null // Lưu ID riêng để chắc chắn
  }));

  const [fingerprintJson, setFingerprintJson] = useState('');
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // --- LOAD DATA ---
  useEffect(() => {
    if (open) {
      setIsInitialLoad(true)
      const data = initial || {}
      
      // Parse Screen
      let w = 1920, h = 1080;
      if (data.screen && data.screen !== 'Auto') {
        const match = data.screen.match(/(\d+)x(\d+)/)
        if (match) { w = parseInt(match[1]); h = parseInt(match[2]); }
      } else if (data.screenWidth) {
        w = data.screenWidth; h = data.screenHeight;
      }

      setProfile({
        id: data.id,
        name: data.name || '',
        userAgent: data.userAgent || data.user_agent || USER_AGENT_LIBRARY[0]?.value || '',
        os: data.os || data.osName || 'Windows 10',
        arch: data.arch || '64-bit',
        browser: data.browser || 'Auto',
        screen: data.screen || 'Auto',
        screenWidth: w,
        screenHeight: h,
        canvas: data.canvas || data.canvasMode || 'Noise',
        canvasMode: data.canvasMode || data.canvas || 'Noise',
        clientRects: data.clientRects || data.clientRectsMode || 'Off',
        clientRectsMode: data.clientRectsMode || data.clientRects || 'Off',
        audioContext: data.audioContext || data.audioCtxMode || data.audioContextMode || 'Off',
        audioContextMode: data.audioContextMode || data.audioCtxMode || 'Off',
        webglImage: data.webglImage || data.webglImageMode || 'Off',
        webglImageMode: data.webglImageMode || 'Off',
        webglMetadata: data.webglMetadata || data.webglMetaMode || 'Mask',
        webglMetaMode: data.webglMetaMode || 'Mask',
        webglRenderer: data.webglRenderer || '',
        webglVendor: data.webglVendor || '',
        geoEnabled: data.geoEnabled || data.geolocationEnabled || false,
        geoMode: data.geoMode || 'original',
        webrtcMainIp: data.webrtcMainIp || data.webrtcMainIP || false,
        
        // Xử lý Proxy load lên
        proxyMode: (data.proxyId || (data.proxy && data.proxy.id)) ? 'Library' : 'Manual',
        proxy: data.proxy || { host: '', port: '', username: '', password: '' },
        proxyId: data.proxyId || (data.proxy ? data.proxy.id : null)
      })

      if (data.fingerprintJson || data.fingerprint) {
        setFingerprintJson(JSON.stringify(data.fingerprintJson || data.fingerprint, null, 2));
      } else {
        setFingerprintJson('')
      }
      setTimeout(() => setIsInitialLoad(false), 100)
    }
  }, [open, initial])

  // --- SYNC JSON ---
  useEffect(() => {
    if (isInitialLoad) return; 
    const generatedObject = {
      userAgent: profile.userAgent,
      os: profile.os,
      viewport: { width: profile.screenWidth, height: profile.screenHeight },
      canvasMode: profile.canvas || profile.canvasMode,
      webglRenderer: profile.webglRenderer,
      webglVendor: profile.webglVendor,
      // ... other fields logic
    };
    setFingerprintJson(JSON.stringify(generatedObject, null, 2));
  }, [profile, isInitialLoad]);

  // --- HELPERS (Giữ nguyên logic của bạn) ---
  const getUserAgentsByOS = (os) => USER_AGENT_LIBRARY.filter(u => !os || u.os.includes(os) || os.includes(u.os));
  const getWebGLRenderersByOS = (os) => WEBGL_RENDERER_LIBRARY; // Placeholder

  const handleFieldChange = (field, value) => setProfile(prev => ({ ...prev, [field]: value }));

  // --- ACTION HANDLERS ---
  const handleRandomizeAll = () => {
    // Logic random (giữ nguyên hoặc thêm logic)
    const randomName = profile.name; // Giữ tên
    // ... random logic here ...
    // setProfile(...)
    alert("Randomize logic here (Placeholder based on your code)");
  };

  const handleSaveFingerprint = () => {
    try {
      const parsed = JSON.parse(fingerprintJson);
      setProfile(prev => ({ ...prev, ...parsed, name: prev.name })); // Giữ tên
    } catch (e) { alert("Invalid JSON"); }
  };

  // --- SUBMIT (QUAN TRỌNG NHẤT - ĐÃ SỬA) ---
  const handleSubmit = (e) => {
    e.preventDefault();

    // 1. Xử lý Proxy ID chuẩn xác
    let finalProxyId = null;
    let finalProxyManual = null;

    if (profile.proxyMode === 'Library') {
        // Nếu là Library, ưu tiên lấy ID
        if (profile.proxyId) {
            finalProxyId = parseInt(profile.proxyId);
        } else if (profile.proxy && typeof profile.proxy === 'object' && profile.proxy.id) {
             finalProxyId = parseInt(profile.proxy.id);
        } else if (!isNaN(profile.proxy)) {
             finalProxyId = parseInt(profile.proxy);
        }
    } else {
        // Manual Config
        finalProxyManual = profile.proxy;
    }

    const dataToSend = {
      ...profile,
      // Map lại các trường alias cho khớp Backend
      canvasMode: profile.canvas || profile.canvasMode,
      clientRectsMode: profile.clientRects || profile.clientRectsMode,
      audioContextMode: profile.audioContext || profile.audioContextMode,
      webglImageMode: profile.webglImage || profile.webglImageMode,
      webglMetaMode: profile.webglMetadata || profile.webglMetaMode,
      geolocationEnabled: profile.geoEnabled,
      
      // PROXY FIX
      proxyId: finalProxyId,
      proxyManual: finalProxyManual,

      // Fingerprint JSON
      fingerprintJson: fingerprintJson
    };

    // Log để debug
    console.log("Sending to Backend:", dataToSend);

    onUpdate(dataToSend);
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="relative bg-white dark:bg-[#0a0a0a] rounded-xl shadow-xl flex flex-col w-full max-w-4xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
        
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold">Edit Profile</h2>
          <button type="button" onClick={handleRandomizeAll} className="bg-purple-600 text-white px-3 py-1 rounded">Randomize</button>
        </div>

        <form id="edit-profile-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Name */}
            <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input required type="text" value={profile.name} onChange={e => handleFieldChange('name', e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>

            {/* Proxy Section (Demo UI Placeholder - Đảm bảo bạn có input set proxyId) */}
            <div className="p-4 border rounded bg-gray-50">
                <label className="block text-sm font-medium mb-2">Proxy Mode</label>
                <div className="flex gap-4 mb-2">
                    <label><input type="radio" checked={profile.proxyMode === 'Manual'} onChange={() => handleFieldChange('proxyMode', 'Manual')} /> Manual</label>
                    <label><input type="radio" checked={profile.proxyMode === 'Library'} onChange={() => handleFieldChange('proxyMode', 'Library')} /> Library</label>
                </div>
                
                {profile.proxyMode === 'Library' ? (
                    <div>
                         {/* Đây là chỗ bạn chọn Proxy. Giả lập input ID cho đơn giản */}
                         <label className="text-xs">Proxy ID (From Library)</label>
                         <input 
                            type="number" 
                            placeholder="Enter Proxy ID..." 
                            value={profile.proxyId || ''} 
                            onChange={(e) => handleFieldChange('proxyId', e.target.value)}
                            className="w-full border rounded px-2 py-1" 
                        />
                    </div>
                ) : (
                    <div>Manual Proxy Inputs Here...</div>
                )}
            </div>

            {/* Fingerprint JSON */}
            <div>
                <label className="block text-sm font-medium mb-1">Fingerprint JSON</label>
                <textarea value={fingerprintJson} onChange={e => setFingerprintJson(e.target.value)} rows={5} className="w-full border rounded font-mono text-xs px-3 py-2" />
                <button type="button" onClick={handleSaveFingerprint} className="mt-2 border px-3 py-1 rounded text-sm hover:bg-gray-100">Save Fingerprint</button>
            </div>
        </form>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
          <button type="submit" form="edit-profile-form" className="px-4 py-2 bg-blue-600 text-white rounded">Save Profile</button>
        </div>
      </div>
    </div>
  )
}