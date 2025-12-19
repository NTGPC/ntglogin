import ffmpeg from 'fluent-ffmpeg';
import { Jimp } from 'jimp';
import path from 'path';
import fs from 'fs';

// --- QUAN TRỌNG: ÉP CỨNG ĐƯỜNG DẪN FFMPEG ---
// Bro kiểm tra xem máy bro cài ở đâu? Thường là C:\ffmpeg\bin\ffmpeg.exe
const FFMPEG_PATH = 'C:\\ffmpeg\\bin\\ffmpeg.exe';

if (fs.existsSync(FFMPEG_PATH)) {
    ffmpeg.setFfmpegPath(FFMPEG_PATH);
    console.log('✅ FFmpeg found at:', FFMPEG_PATH);
} else {
    console.error("❌ KHÔNG TÌM THẤY FFMPEG TẠI:", FFMPEG_PATH);
    // Fallback thử tìm trong biến môi trường
    ffmpeg.setFfmpegPath('ffmpeg');
}

// 1. TÌM Ô MÀU ĐỎ (Giữ nguyên)
export const findRedBox = async (imagePath: string) => {
    try {
        const image = await Jimp.read(imagePath);
        const width = image.bitmap.width;
        const height = image.bitmap.height;
        let redBox = { x: 0, y: 0, w: 0, h: 0, found: false };

        image.scan(0, 0, width, height, function (x, y, idx) {
            const red = this.bitmap.data[idx + 0];
            const green = this.bitmap.data[idx + 1];
            const blue = this.bitmap.data[idx + 2];
            if (red > 200 && green < 50 && blue < 50) {
                if (!redBox.found) { redBox.x = x; redBox.y = y; redBox.found = true; }
                redBox.w = Math.max(redBox.w, x - redBox.x);
                redBox.h = Math.max(redBox.h, y - redBox.y);
            }
        });
        return redBox;
    } catch (error) { return { found: false, x: 0, y: 0, w: 0, h: 0 }; }
};

// 2. XỬ LÝ TITLE (Giữ nguyên)
const processTitle = (rawName: string, options: any) => {
    let text = rawName.replace('.mp4', '');
    if (options.removeHashtag) text = text.replace(/#\S+/g, '');
    text = text.replace(/\s+/g, ' ').trim();
    const prefix = options.prefix ? options.prefix + ' ' : '';
    const suffix = options.suffix ? ' ' + options.suffix : '';
    return `${prefix}${text}${suffix}`;
};

// 3. RENDER FINAL VIDEO (CÓ LOG LỖI CHI TIẾT)
export const renderFinalVideo = async (
    videoPath: string,
    overlayPath: string,
    outputDir: string,
    outputName: string,
    style: any = {},
    onProgress?: (p: number) => void
) => {
    if (!fs.existsSync(videoPath)) throw new Error(`Video input missing: ${videoPath}`);
    // Tạo thư mục output nếu chưa có
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    // Tên file output chuẩn
    const finalName = outputName.toLowerCase().endsWith('.mp4') ? outputName : `${outputName}.mp4`;
    const outputPath = path.join(outputDir, finalName);

    console.log(`🎬 Bắt đầu Render: ${outputPath}`);

    return new Promise((resolve, reject) => {
        let command = ffmpeg(videoPath);

        // Input ảnh Overlay nếu có
        if (overlayPath && fs.existsSync(overlayPath)) {
            command.input(overlayPath);
            command.complexFilter([
                '[0:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2[bg]',
                '[bg][1:v]overlay=0:0'
            ]);
        } else {
            // Nếu không có ảnh overlay thì chỉ resize video
            command.complexFilter([
                '[0:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2'
            ]);
        }

        command
            .outputOptions([
                '-c:v libx264',
                '-preset ultrafast', // Tốc độ tối đa
                '-c:a aac',
                '-b:a 128k',
                '-map 0:a?'
            ])
            .on('start', (cmdLine) => {
                console.log('FFmpeg Command:', cmdLine); // Log lệnh ra để check
            })
            .on('progress', (p) => {
                if (onProgress && p.percent) onProgress(Math.floor(p.percent));
            })
            .on('end', () => {
                console.log('✅ Render xong file:', finalName);
                resolve(outputPath);
            })
            .on('error', (err, stdout, stderr) => {
                console.error('❌ FFmpeg Error:', err.message);
                console.error('Stderr:', stderr);
                reject(err);
            })
            .save(outputPath);
    });
};

// Keep old renderReel function for backward compatibility
export const renderReel = renderFinalVideo;
