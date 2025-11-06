// Export fingerprint injection script to JS file for Python Selenium wrapper
// Usage: node scripts/export-fingerprint-script.js

const fs = require('fs');
const path = require('path');

// Import buildStealthScript from browserService
// Since we can't directly import TypeScript, we'll create a standalone version
const scriptContent = `
// This file is auto-generated from buildStealthScript in browserService.ts
// The profile will be injected by Python script as: window.__INJECTED_FINGERPRINT__ = {...};

(() => {
  // Get fingerprint from injected or fallback to defaults
  const FP = window.__INJECTED_FINGERPRINT__ || (typeof window.__PROFILE__ !== 'undefined' ? window.__PROFILE__ : {
    seed: 12345,
    ua: null,
    screen: { width: 1920, height: 1080, dpr: 1 },
    canvas: { mode: 'Noise' },
    webgl: { metaMode: 'Mask', imageMode: 'Off' },
    audioContext: { mode: 'Noise' },
    clientRects: { mode: 'Noise' },
    geo: { enabled: false, lat: null, lon: null },
    webrtc: { useMainIP: false },
    seedFallback: 1234567
  });
  
  // ---------- seeded PRNG (xorshift32) ----------
  function xorshift32(seed) {
    let x = seed >>> 0;
    return function() {
      x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
      return (x >>> 0) / 4294967295;
    };
  }
  
  const seed = (FP && (FP.seed || FP.seedFallback || FP.profileId || 12345)) >>> 0;
  const rand = xorshift32(seed);
  
  // ---------- helpers ----------
  function randInt(min, max) { return Math.floor(rand() * (max - min + 1)) + min; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  
  // ---------- navigator properties ----------
  try {
    if (typeof navigator !== 'undefined') {
      try { Object.defineProperty(navigator, 'webdriver', { get: () => false, configurable: true }); } catch(e){/*ignore*/}
      
      const fakeHC = FP.hwc || FP.hardware?.cores || (4 + (seed % 4)); // 4..7
      const fakeDM = FP.dmem || FP.hardware?.memoryGb || 4; // GB
      const fakePlatform = FP.platform || (FP.os && FP.os.startsWith && FP.os.startsWith('macOS') ? 'MacIntel' : 
                                           (FP.osName && FP.osName.startsWith('macOS') ? 'MacIntel' : 'Win32'));
      const fakeLangs = FP.languages || ['en-US', 'en'];
      
      try { Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => fakeHC, configurable: true }); } catch(e){}
      try { Object.defineProperty(navigator, 'deviceMemory', { get: () => fakeDM, configurable: true }); } catch(e){}
      try { Object.defineProperty(navigator, 'platform', { get: () => fakePlatform, configurable: true }); } catch(e){}
      try { Object.defineProperty(navigator, 'languages', { get: () => fakeLangs, configurable: true }); } catch(e){}
      try { Object.defineProperty(navigator, 'language', { get: () => fakeLangs[0] || 'en-US', configurable: true }); } catch(e){}
    }
  } catch(e){/*ignore*/}
  
  // ---------- Canvas: deterministic noise or block ----------
  (function canvasPatch(){
    const mode = (FP.canvas && FP.canvas.mode) || (FP.canvasMode) || 'Noise';
    if (mode === 'Block') {
      try {
        HTMLCanvasElement.prototype.toDataURL = function() { throw new Error('Canvas blocked'); };
        HTMLCanvasElement.prototype.toBlob = function() { throw new Error('Canvas blocked'); };
      } catch(e){}
      return;
    }
    // deterministic noise: mutate getImageData and toDataURL via context
    const origGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, attrs) {
      const ctx = origGetContext.call(this, type, attrs);
      if (!ctx) return ctx;
      if (type === '2d') {
        try {
          const orig_getImageData = ctx.getImageData;
          ctx.getImageData = function(x, y, w, h) {
            const data = orig_getImageData.call(this, x, y, w, h);
            // apply low-magnitude deterministic noise
            const len = data.data.length;
            for (let i = 0; i < len; i += 4) {
              // small jitter - deterministic
              const j = Math.floor((rand() - 0.5) * 6); // -3..+2
              data.data[i] = (data.data[i] + j) & 255;
              data.data[i+1] = (data.data[i+1] + j) & 255;
              data.data[i+2] = (data.data[i+2] + j) & 255;
            }
            return data;
          };
        } catch(e){}
      }
      return ctx;
    };
  })();
  
  // ---------- WebGL/WebGL2 + OffscreenCanvas: mask vendor/renderer & mute debug ----------
  (function webglPatch(){
    const VENDOR = (FP.webgl && FP.webgl.vendor) || 'PolyVendor Labs';
    const RENDER = (FP.webgl && FP.webgl.renderer) || 'PolyRenderer 1.0';
    const REAL = FP.webgl && FP.webgl.metaMode === 'Real';
    
    function hardDefine(obj, name, fn) {
      try {
        Object.defineProperty(obj, name, { value: fn, configurable: true });
      } catch(e) {
        try { obj[name] = fn; } catch(_){/* ignore */}
      }
    }
    
    function patchProto(proto) {
      if (!proto) return;
      
      const orig_getParameter = proto.getParameter;
      const orig_getExtension = proto.getExtension;
      const orig_getSupported = proto.getSupportedExtensions;
      const orig_readPixels = proto.readPixels;
      const orig_prec = proto.getShaderPrecisionFormat;
      
      hardDefine(proto, 'getParameter', function(param) {
        try {
          if (!REAL) {
            if (param === 37445) return VENDOR;   // UNMASKED_VENDOR_WEBGL
            if (param === 37446) return RENDER;   // UNMASKED_RENDERER_WEBGL
          }
          return orig_getParameter.call(this, param);
        } catch(e) { return null; }
      });
      
      hardDefine(proto, 'getExtension', function(name) {
        if (name && /WEBGL_debug/.test(name)) return null;
        return orig_getExtension.call(this, name);
      });
      
      hardDefine(proto, 'getSupportedExtensions', function() {
        const list = (orig_getSupported && orig_getSupported.call(this)) || [];
        return list.filter(e => !/debug|unmasked/i.test(e));
      });
      
      // make pixel hash deterministic-but-different
      hardDefine(proto, 'readPixels', function(x, y, w, h, fmt, typ, pix) {
        try {
          orig_readPixels.call(this, x, y, w, h, fmt, typ, pix);
          if (!pix || !pix.length) return;
          for (let i = 0; i < Math.min(256, pix.length); i += 4) {
            pix[i] = (pix[i] + ((FP.seed || seed || 12345) % 7)) & 255;
          }
        } catch(e) {}
      });
      
      hardDefine(proto, 'getShaderPrecisionFormat', function(t, p) {
        try {
          const v = orig_prec.call(this, t, p);
          if (!v) return v;
          return { rangeMin: v.rangeMin, rangeMax: v.rangeMax, precision: Math.max(8, v.precision) };
        } catch(e) { return { rangeMin: 0, rangeMax: 0, precision: 8 }; }
      });
    }
    
    // WebGL1 + WebGL2
    if (window.WebGLRenderingContext) patchProto(WebGLRenderingContext.prototype);
    if (window.WebGL2RenderingContext) patchProto(WebGL2RenderingContext.prototype);
    
    // OffscreenCanvas contexts
    if (window.OffscreenCanvas) {
      const orig = OffscreenCanvas.prototype.getContext;
      hardDefine(OffscreenCanvas.prototype, 'getContext', function(type, opts) {
        const ctx = orig.call(this, type, opts);
        try {
          const p = Object.getPrototypeOf(ctx);
          patchProto(p); // patch instance proto too
        } catch(e) {}
        return ctx;
      });
    }
  })();
  
python test_inject_check.py
  // ---------- Audio fingerprint: patch OfflineAudioContext & Analyser deterministic ----------
  (function audioPatch(){
    const audioSeed = (FP.seed || seed || 12345) >>> 0;
    const mode = (FP.audioContext && FP.audioContext.mode) || (FP.audioCtxMode) || 'Off';
    
    if (mode === 'Noise') {
      // OfflineAudioContext (được dùng để render buffer rồi hash)
      try {
        const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
        if (OAC && OAC.prototype && OAC.prototype.startRendering) {
          const origStart = OAC.prototype.startRendering;
          Object.defineProperty(OAC.prototype, 'startRendering', {
            value: function() {
              const ret = origStart.apply(this, arguments);
              return Promise.resolve(ret).then(buf => {
                try {
                  const ch = buf.numberOfChannels;
                  for (let c = 0; c < ch; c++) {
                    const data = buf.getChannelData(c);
                    for (let i = 0; i < data.length; i += 128) {
                      // nhiễu rất nhỏ nhưng ổn định theo seed
                      data[i] = data[i] + ((audioSeed % 9) - 4) * 1e-7;
                    }
                  }
                } catch(e) {}
                return buf;
              });
            },
            configurable: true
          });
        }
      } catch(e) {}
      
      // Realtime Analyser (ít site dùng, nhưng patch cho chắc)
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC && AC.prototype && AC.prototype.createAnalyser) {
          const origCreate = AC.prototype.createAnalyser;
          Object.defineProperty(AC.prototype, 'createAnalyser', {
            value: function() {
              const an = origCreate.call(this);
              if (an && an.getFloatTimeDomainData) {
                const orig = an.getFloatTimeDomainData.bind(an);
                an.getFloatTimeDomainData = function(arr) {
                  orig(arr);
                  for (let i = 0; i < arr.length; i += 128) {
                    arr[i] = arr[i] + ((audioSeed % 7) * 1e-7);
                  }
                };
              }
              return an;
            },
            configurable: true
          });
        }
      } catch(e) {}
    }
  })();
  
  // ---------- clientRects: getBoundingClientRect + getClientRects ----------
  (function rectsPatch(){
    const elProto = Element.prototype;
    const mode = (FP.clientRects && FP.clientRects.mode) || (FP.clientRectsMode) || 'Off';
    if (mode === 'Noise') {
      const orig_getBoundingClientRect = elProto.getBoundingClientRect;
      elProto.getBoundingClientRect = function() {
        const r = orig_getBoundingClientRect.call(this);
        const jitter = ((seed % 5) - 2) / 100; // small deterministic jitter
        return {
          x: r.x + jitter, y: r.y + jitter, width: r.width + jitter, height: r.height + jitter,
          top: r.top + jitter, left: r.left + jitter, right: r.right + jitter, bottom: r.bottom + jitter
        };
      };
      const orig_getClientRects = elProto.getClientRects;
      elProto.getClientRects = function() {
        const col = orig_getClientRects.call(this);
        // could adjust rects values similarly if needed
        return col;
      };
    }
  })();
  
  // ---------- WebRTC: intercept ICE candidates (drop local private) ----------
  (function webrtcPatch(){
    try {
      const OrigPeer = window.RTCPeerConnection;
      if (!OrigPeer) return;
      function FakePC(...args) {
        const pc = new OrigPeer(...args);
        // intercept onicecandidate addEventListener
        const origAddEvent = pc.addEventListener.bind(pc);
        pc.addEventListener = function(type, listener, ...rest) {
          if (type === 'icecandidate') {
            const wrapped = function(e) {
              if (!e || !e.candidate) return;
              const cand = e.candidate.candidate || '';
              // if useMainIP false -> drop private addresses
              if (!FP.webrtc || !FP.webrtc.useMainIP) {
                // drop local/private IP candidates
                if (/(10\\.|192\\.168\\.|172\\.(1[6-9]|2[0-9]|3[0-1])|169\\.254\\.)/.test(cand)) return;
              }
              try { listener.call(this, e); } catch(err){}
            };
            return origAddEvent(type, wrapped, ...rest);
          }
          return origAddEvent(type, listener, ...rest);
        };
        return pc;
      }
      FakePC.prototype = OrigPeer.prototype;
      window.RTCPeerConnection = FakePC;
    } catch(e){}
  })();
  
  // ---------- Geolocation override ----------
  (function geoPatch(){
    if (FP.geo && FP.geo.enabled) {
      try {
        const fakePos = {
          coords: {
            latitude: FP.geo.lat || 10.762622,
            longitude: FP.geo.lon || 106.660172,
            accuracy: 50
          }
        };
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition = function(success, error, opts) {
            setTimeout(()=> success(fakePos), 10);
          };
          navigator.geolocation.watchPosition = function(success, error, opts) {
            const id = Math.floor(rand()*100000);
            setTimeout(()=> success(fakePos), 10);
            return id;
          };
        }
      } catch(e){}
    }
  })();
  
  // ---------- mark injected for debug ----------
  try { Object.defineProperty(window, '__INJECTED_FINGERPRINT__', { value: FP, configurable:false }); } catch(e){}
  
  // Remove Chrome automation indicators
  try { delete window.chrome; window.chrome = { runtime: {} }; } catch(e){}
  
  // Override permissions query
  try {
    const originalQuery = navigator.permissions.query;
    navigator.permissions.query = function(parameters) {
      if (parameters.name === 'notifications') {
        return Promise.resolve({ state: Notification.permission });
      }
      return originalQuery.call(this, parameters);
    };
  } catch(e){}
})();
`;

const outputPath = path.join(__dirname, 'inject_before_load.js');
fs.writeFileSync(outputPath, scriptContent.trim(), 'utf-8');
console.log(`✅ Fingerprint script exported to: ${outputPath}`);
console.log('You can now use this file with Python Selenium wrapper.');

