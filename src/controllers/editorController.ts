import { Request, Response } from 'express';

import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { createCanvas } from 'canvas';

// Cấu hình đường dẫn
ffmpeg.setFfmpegPath('C:\\ffmpeg\\bin\\ffmpeg.exe');
ffmpeg.setFfprobePath('C:\\ffmpeg\\bin\\ffprobe.exe');

const ROOT_DIR = 'D:\\NTG_Studio';
const VIDEO_DIR = path.join(ROOT_DIR, 'Videos');
const AUDIO_DIR = path.join(ROOT_DIR, 'Audios');
const LOGO_DIR = path.join(ROOT_DIR, 'Logos'); // Thêm thư mục Logo
const OUTPUT_DIR = path.join(ROOT_DIR, 'Rendered');

// Helper: Clean Title (Giữ nguyên)
const cleanTitle = (filename: string): string => {
  let name = path.parse(filename).name;
  return name.replace(/[^\w\s\u00C0-\u1EF9]/g, ' ').replace(/\s+/g, ' ').trim();
};

// Helper: Text Overlay (Giữ nguyên)
const createTextOverlay = (text: string, outputPath: string, color: string = '#FFFFFF', fontSize: number = 60) => {
  const width = 1280; const height = 720;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = color;
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.shadowColor = 'black';
  ctx.shadowBlur = 10;
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'black';
  const x = width / 2; const y = height - 100;
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
};

export const EditorController = {
  // API: Scan File (CẬP NHẬT: Scan thêm folder Logos)
  scanFiles: async (req: Request, res: Response) => {
    try {
      if (!fs.existsSync(VIDEO_DIR)) fs.mkdirSync(VIDEO_DIR, { recursive: true });
      if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });
      if (!fs.existsSync(LOGO_DIR)) fs.mkdirSync(LOGO_DIR, { recursive: true }); // Tạo folder nếu chưa có
      if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

      // 1. Quét Videos
      const videos = fs.readdirSync(VIDEO_DIR)
        .filter(f => ['.mp4', '.mov', '.avi'].includes(path.extname(f).toLowerCase()))
        .map(f => ({ name: f, path: path.join(VIDEO_DIR, f), url: `http://localhost:3000/stream/video/${encodeURIComponent(f)}` }));

      // 2. Quét Audios
      const audios = fs.readdirSync(AUDIO_DIR)
        .filter(f => ['.mp3', '.wav', '.m4a'].includes(path.extname(f).toLowerCase()))
        .map(f => ({ name: f, cleanName: cleanTitle(f), path: path.join(AUDIO_DIR, f), url: `http://localhost:3000/stream/audio/${encodeURIComponent(f)}` }));

      // 3. Quét Logos (MỚI)
      const logos = fs.readdirSync(LOGO_DIR)
        .filter(f => ['.png', '.jpg', '.jpeg'].includes(path.extname(f).toLowerCase()))
        .map(f => ({ name: f, path: path.join(LOGO_DIR, f) }));

      res.json({ videos, audios, logos });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Lỗi quét thư mục' });
    }
  },

  // API: Render (Giữ nguyên logic nhận logoPath từ FE)
  renderVideo: async (req: Request, res: Response) => {
    try {
      const { videoPath, audioPath, customTitle, titleColor, titleSize, logoPath } = req.body;
      const timestamp = Date.now();
      const outputFilename = `Render_${timestamp}.mp4`;
      const outputPath = path.join(OUTPUT_DIR, outputFilename);
      const textOverlayPath = path.join(OUTPUT_DIR, `temp_text_${timestamp}.png`);

      createTextOverlay(customTitle || cleanTitle(path.basename(audioPath)), textOverlayPath, titleColor || '#FFFFFF', titleSize || 60);

      console.log(`Rendering... Logo: ${logoPath ? 'Có' : 'Không'}`);

      let command = ffmpeg()
        .input(videoPath).inputOptions(['-stream_loop -1'])
        .input(audioPath)
        .input(textOverlayPath);

      let filterComplex = '';

      if (logoPath && fs.existsSync(logoPath)) {
        command = command.input(logoPath);
        filterComplex = `[0:v]scale=1280:720[bg];[bg][2:v]overlay=0:0[v1];[3:v]scale=150:-1[logo];[v1][logo]overlay=main_w-overlay_w-20:20[v]`;
      } else {
        filterComplex = `[0:v]scale=1280:720[bg];[bg][2:v]overlay=0:0[v]`;
      }

      command
        .complexFilter([filterComplex])
        .outputOptions(['-map [v]', '-map 1:a', '-c:v libx264', '-shortest', '-pix_fmt yuv420p'])
        .save(outputPath)
        .on('end', () => {
          if (fs.existsSync(textOverlayPath)) fs.unlinkSync(textOverlayPath);
          res.json({ status: 'success', outputFile: outputPath });
        })
        .on('error', (err) => {
          console.error('Error FFmpeg:', err);
          res.status(500).json({ error: 'Render thất bại' });
        });
    } catch (error) {
      res.status(500).json({ error: 'Server Error' });
    }
  }
};
