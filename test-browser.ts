import { startBrowser } from './src/core/browser';

console.log("⏳ Đang thử mở trình duyệt...");

startBrowser().then((browser) => {
    if (browser) {
        console.log("✅ Test thành công! Chrome đã mở.");
        console.log("📊 Browser instance:", browser);
        
        setTimeout(async () => {
            console.log("🔒 Đang đóng browser sau 5 giây...");
            await browser.close();
            console.log("✅ Browser đã đóng.");
            process.exit(0);
        }, 5000);
    } else {
        console.error("❌ Browser không được khởi tạo.");
        process.exit(1);
    }
}).catch((err) => {
    console.error("❌ Test thất bại:", err);
    process.exit(1);
});

