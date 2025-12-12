import ffmpeg from 'fluent-ffmpeg';

import fs from 'fs-extra';
import path from 'path';

// HARDCODED FFMPEG PATH
const FFMPEG_PATH = 'C:\\ffmpeg\\bin\\ffmpeg.exe';
const FFPROBE_PATH = 'C:\\ffmpeg\\bin\\ffprobe.exe';

ffmpeg.setFfmpegPath(FFMPEG_PATH);
ffmpeg.setFfprobePath(FFPROBE_PATH);

export const scanDirectory = (folderPath: string, type: 'video' | 'audio') => {
  // FIX: Nếu folder không tồn tại thì tự tạo luôn, không báo lỗi nữa
  if (!fs.existsSync(folderPath)) {
    console.log(`Thư mục ${folderPath} chưa có, đang tạo mới...`);
    fs.mkdirSync(folderPath, { recursive: true });
  }
  
  const exts = type === 'video' ? ['.mp4', '.mov'] : ['.mp3', '.m4a', '.wav'];
  
  // Nếu thư mục rỗng sau khi tạo, trả về mảng rỗng
  const files = fs.readdirSync(folderPath);
  
  return files
    .filter(f => exts.includes(path.extname(f).toLowerCase()))
    .map((f, i) => ({
      id: i + 1,
      name: f,
      path: path.join(folderPath, f),
      size: (fs.statSync(path.join(folderPath, f)).size / 1024 / 1024).toFixed(2) + ' MB',
      status: 'ready'
    }));
};

export const muteVideos = async (videoPaths: string[]) => {
  const results = [];
  
  for (const inputPath of videoPaths) {
    if (!fs.existsSync(inputPath)) continue;
    
    const dir = path.dirname(inputPath);
    const name = path.basename(inputPath, path.extname(inputPath));
    const outputPath = path.join(dir, `${name}_muted.mp4`);
    
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .noAudio()
        .videoCodec('copy')
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
    
    // Swap files: Delete original, rename muted to original
    await fs.unlink(inputPath);
    await fs.rename(outputPath, inputPath);
    
    results.push(inputPath);
  }
  
  return results;
};

