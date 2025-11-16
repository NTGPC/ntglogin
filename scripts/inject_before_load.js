// inject_before_load.js
// Comprehensive fingerprint injection script
// Reads window.__INJECTED_FINGERPRINT__ if server/launcher sets it before

(() => {
  // If server or launcher set window.__INJECTED_FINGERPRINT__, use it.
  const FP = (typeof window !== 'undefined' && window.__INJECTED_FINGERPRINT__) || {
    seed: 12345,
    ua: null,
    screen: { width: 1920, height: 1080, dpr: 1 },
    canvas: { mode: 'Noise' },        // 'Noise'|'Off'|'Block'
    webgl: { metaMode: 'Mask', vendor: null, renderer: null }, // metaMode: 'Mask'|'Real'
    audioContext: { mode: 'Noise' },  // 'Noise'|'Off'
    clientRects: { mode: 'Noise' },   // 'Noise'|'Off'
    geo: { enabled: false, lat: null, lon: null },
    webrtc: { useMainIP: false },
    seedFallback: 1234567
  };
  
  // ---------- xorshift32 PRNG ----------
  function xorshift32(seed) {
    let x = (seed >>> 0) || 123456789;
    return function() {
      x ^= x << 13; x >>>= 0;
      x ^= x >>> 17; x >>>= 0;
      x ^= x << 5; x >>>= 0;
      return (x >>> 0) / 4294967295;
    };
  }
  const seed = (FP && (FP.seed || FP.seedFallback || 12345)) >>> 0;
  const rand = xorshift32(seed);
  
  // helpers
  function randInt(min, max){ return Math.floor(rand()*(max-min+1))+min; }
  
  // ---------- navigator props ----------
  try {
    if (typeof navigator !== 'undefined') {
      try { Object.defineProperty(navigator, 'webdriver', { get: () => false, configurable: true }); } catch(e){}
      
      const fakeHC = (FP.hwc || (4 + (seed % 4)));
      const fakeDM = (FP.dmem || 4);
      
      let fakePlatform = FP.platform;
      if (!fakePlatform) {
        const osName = FP.os || FP.osName || '';
        const osLower = osName.toLowerCase();
        const arch = FP.arch || FP.architecture || 'x64';
        
        if (osLower.includes('macos') || osLower.includes('mac')) {
          fakePlatform = 'MacIntel';
        } else if (osLower.includes('linux')) {
          fakePlatform = arch === 'x64' || arch === 'x86_64' ? 'Linux x86_64' : 'Linux i686';
        } else {
          fakePlatform = 'Win32';
        }
      }
      
      const fakeLangs = FP.languages || ['en-US','en'];
      
      try { Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => fakeHC, configurable:true }); } catch(e){}
      try { Object.defineProperty(navigator, 'deviceMemory', { get: () => fakeDM, configurable:true }); } catch(e){}
      try { Object.defineProperty(navigator, 'platform', { get: () => fakePlatform, configurable:true }); } catch(e){}
      try { Object.defineProperty(navigator, 'languages', { get: () => fakeLangs, configurable:true }); } catch(e){}
    }
  } catch(e){}
  
  // ---------- Canvas patch ----------
  (function canvasPatch(){
    const mode = (FP.canvas && FP.canvas.mode) || 'Noise';
    if (mode === 'Block') {
      try {
        HTMLCanvasElement.prototype.toDataURL = function(){ throw new Error('Canvas blocked'); };
        HTMLCanvasElement.prototype.toBlob = function(){ throw new Error('Canvas blocked'); };
      } catch(e){}
      return;
    }
    const origGet = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, attrs){
      const ctx = origGet.call(this, type, attrs);
      if (!ctx) return ctx;
      if (type === '2d') {
        try {
          const orig_getImageData = ctx.getImageData;
          ctx.getImageData = function(x,y,w,h){
            const data = orig_getImageData.call(this,x,y,w,h);
            // deterministic small noise
            for (let i=0;i<data.data.length;i+=4){
              const j = Math.floor((rand()-0.5)*6);
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
  
  // ---------- WebGL / WebGL2 & OffscreenCanvas ----------
  (function webglPatch(){
    const VENDOR = (FP.webgl && FP.webgl.vendor) || "PolyVendor Inc.";
    const RENDER = (FP.webgl && FP.webgl.renderer) || "PolyRenderer 1.0";
    const REAL   = (FP.webgl && FP.webgl.metaMode === 'Real');
    
    function hardDefine(obj, name, fn){
      try { Object.defineProperty(obj, name, { value: fn, configurable:true }); } catch(e){ try{ obj[name] = fn; } catch(_){} }
    }
    
    function patchProto(proto){
      if (!proto) return;
      
      const orig_getParameter = proto.getParameter;
      const orig_getExtension = proto.getExtension;
      const orig_getSupported  = proto.getSupportedExtensions;
      const orig_readPixels    = proto.readPixels;
      const orig_prec          = proto.getShaderPrecisionFormat;
      
      hardDefine(proto, 'getParameter', function(param){
        try {
          if (!REAL) {
            if (param === 37445) return VENDOR;
            if (param === 37446) return RENDER;
          }
        } catch(e){}
        try { return orig_getParameter.call(this, param); } catch(e){ return null; }
      });
      
      hardDefine(proto, 'getExtension', function(name){
        try { if (name && /debug/i.test(name)) return null; } catch(e){}
        return orig_getExtension.call(this, name);
      });
      
      hardDefine(proto, 'getSupportedExtensions', function(){
        try {
          const list = orig_getSupported && orig_getSupported.call(this) || [];
        return list.filter(e => !/debug|unmasked/i.test(e));
        } catch(e){ return []; }
      });

      hardDefine(proto, 'readPixels', function(x,y,w,h,fmt,typ,pixels){
        try {
          orig_readPixels.call(this,x,y,w,h,fmt,typ,pixels);
          for (let i=0;i<Math.min(256, pixels.length); i+=4){
            pixels[i] = (pixels[i] + ((seed >> (i%24)) & 7)) & 255;
          }
        } catch(e){}
      });
      
      hardDefine(proto, 'getShaderPrecisionFormat', function(shaderType, precisionType){
        try {
          const orig = orig_prec.call(this, shaderType, precisionType);
          if (!orig) return orig;
          return { rangeMin: orig.rangeMin, rangeMax: orig.rangeMax, precision: Math.max(8, orig.precision) };
        } catch(e){ return { rangeMin:0, rangeMax:0, precision:8 }; }
      });
    }
    
    if (window.WebGLRenderingContext) patchProto(WebGLRenderingContext.prototype);
    if (window.WebGL2RenderingContext) patchProto(WebGL2RenderingContext.prototype);
    
    // OffscreenCanvas
    try {
      if (window.OffscreenCanvas && OffscreenCanvas.prototype.getContext) {
        const origOff = OffscreenCanvas.prototype.getContext;
        Object.defineProperty(OffscreenCanvas.prototype, 'getContext', {
          value: function(type, opts){
            const ctx = origOff.call(this, type, opts);
        try {
          const p = Object.getPrototypeOf(ctx);
              if (p) patchProto(p);
            } catch(e){}
        return ctx;
          }, configurable:true
      });
    }
    } catch(e){}
  })();
  
  // ---------- Audio: OfflineAudioContext & Analyser ----------
  (function audioPatch(){
    const s = seed >>> 0;
      try {
        const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
        if (OAC && OAC.prototype && OAC.prototype.startRendering) {
          const origStart = OAC.prototype.startRendering;
          Object.defineProperty(OAC.prototype, 'startRendering', {
          value: function(){
            const prom = origStart.apply(this, arguments);
            return Promise.resolve(prom).then(buf => {
                try {
                const ch = buf.numberOfChannels || 1;
                for (let c=0;c<ch;c++){
                  const arr = buf.getChannelData(c);
                  for (let i=0;i<arr.length;i+=128) arr[i] = arr[i] + ((s % 9) - 4) * 1e-7;
                  }
              } catch(e){}
                return buf;
              });
          }, configurable:true
          });
        }
    } catch(e){}
      
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC && AC.prototype && AC.prototype.createAnalyser) {
          const origCreate = AC.prototype.createAnalyser;
          Object.defineProperty(AC.prototype, 'createAnalyser', {
          value: function(){
              const an = origCreate.call(this);
              if (an && an.getFloatTimeDomainData) {
                const orig = an.getFloatTimeDomainData.bind(an);
              an.getFloatTimeDomainData = function(arr){
                  orig(arr);
                for (let i=0;i<arr.length;i+=128) arr[i] = arr[i] + ((s % 7) * 1e-7);
                };
              }
              return an;
          }, configurable:true
          });
        }
    } catch(e){}
  })();
  
  // ---------- Client rects ----------
  (function rectsPatch(){
    try {
    const elProto = Element.prototype;
      const origRect = elProto.getBoundingClientRect;
      Object.defineProperty(elProto, 'getBoundingClientRect', {
        value: function(){
          const r = origRect.call(this);
          if (FP.clientRects && FP.clientRects.mode === 'Noise') {
            const jitter = ((seed % 5) - 2) / 100;
        return {
          x: r.x + jitter, y: r.y + jitter, width: r.width + jitter, height: r.height + jitter,
          top: r.top + jitter, left: r.left + jitter, right: r.right + jitter, bottom: r.bottom + jitter
        };
          }
          return r;
        }, configurable:true
      });
    } catch(e){}
  })();
  
  // ---------- WebRTC filter ----------
  (function webrtcPatch(){
    try {
      const Orig = window.RTCPeerConnection;
      if (!Orig) return;
      const Fake = function(...args){
        const pc = new Orig(...args);
        const origAdd = pc.addEventListener.bind(pc);
        pc.addEventListener = function(type, handler, ...rest){
          if (type === 'icecandidate') {
            const wrapped = function(e){
              if (!e || !e.candidate) return;
              const cand = e.candidate.candidate || '';
              if (!FP.webrtc || !FP.webrtc.useMainIP) {
                if (/(10\\.|192\\.168\\.|172\\.(1[6-9]|2[0-9]|3[0-1])|169\\.254\\.)/.test(cand)) return;
              }
              try { handler.call(this, e); } catch(e){}
            };
            return origAdd(type, wrapped, ...rest);
          }
          return origAdd(type, handler, ...rest);
        };
        return pc;
      };
      Fake.prototype = Orig.prototype;
      window.RTCPeerConnection = Fake;
    } catch(e){}
  })();
  
  // ---------- Geolocation ----------
  (function geoPatch(){
    try {
      if (FP.geo && FP.geo.enabled && navigator.geolocation) {
        const fakePos = { coords: { latitude: FP.geo.lat || 10.762622, longitude: FP.geo.lon || 106.660172, accuracy: 50 } };
        navigator.geolocation.getCurrentPosition = function(success){
          setTimeout(() => success(fakePos), 10);
          };
        navigator.geolocation.watchPosition = function(success){
            const id = Math.floor(rand()*100000);
            setTimeout(()=> success(fakePos), 10);
            return id;
          };
        }
      } catch(e){}
  })();
  
  // mark injected
  try { Object.defineProperty(window, '__INJECTED_FINGERPRINT__', { value: FP, configurable:false }); } catch(e){}
})();
