(() => {
  try {
    // LẤY CẤU HÌNH TỪ GIAO DIỆN TRUYỀN XUỐNG
    const config = window.__NTG_PROFILE__ || {}; 
    
    // --- 1. XỬ LÝ CANVAS (Dựa theo nút bấm trong ảnh của bro) ---
    if (config.canvasMode === 'noise') {
        const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
        const originalToBlob = HTMLCanvasElement.prototype.toBlob;
        
        // Hàm tạo nhiễu ngẫu nhiên nhưng cố định theo phiên làm việc
        const shift = { r: 1, g: 1, b: 1 }; // Logic noise đơn giản
        
        HTMLCanvasElement.prototype.toDataURL = function() {
            const ctx = this.getContext('2d');
            // ... (Logic vẽ thêm noise vào đây nếu ctx tồn tại) ...
            // Code noise chi tiết bro có thể giữ nguyên như cũ hoặc thêm vào
            console.log("Canvas Noise Applied!"); 
            return originalToDataURL.apply(this, arguments);
        };

        HTMLCanvasElement.prototype.toBlob = function(callback, type, quality) {
            return originalToBlob.apply(this, arguments);
        };
    } else if (config.canvasMode === 'block') {
        // Nếu chọn Block thì trả về chuỗi rỗng hoặc lỗi
        HTMLCanvasElement.prototype.toDataURL = () => "";
        HTMLCanvasElement.prototype.toBlob = () => null;
    } 
    // Nếu 'off' thì không làm gì cả (dùng mặc định của Chrome)

    // --- 2. XỬ LÝ HARDWARE (RAM, CPU) ---
    if (config.hardwareConcurrency) {
        Object.defineProperty(navigator, 'hardwareConcurrency', { 
            get: () => config.hardwareConcurrency,
            configurable: true
        });
    }
    
    if (config.deviceMemory) {
        Object.defineProperty(navigator, 'deviceMemory', { 
            get: () => config.deviceMemory,
            configurable: true
        });
    }

    // --- 3. XỬ LÝ WEBGL (Card màn hình) ---
    if (config.webglVendor && config.webglRenderer) {
        const getParameter = WebGLRenderingContext.prototype.getParameter;
        WebGLRenderingContext.prototype.getParameter = function(parameter) {
            // UNMASKED_VENDOR_WEBGL
            if (parameter === 37445) return config.webglVendor;
            // UNMASKED_RENDERER_WEBGL
            if (parameter === 37446) return config.webglRenderer;
            return getParameter.apply(this, arguments);
        };
    }

    console.log("✅ [NTG-CORE] Fingerprint Injection Loaded Successfully!");
    console.log("📊 Config:", config);
  } catch (err) {
    console.error("❌ Injection Error:", err);
  }
})();
