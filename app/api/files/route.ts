import { NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  const uploadDir = join(process.cwd(), 'public/uploads');
  try {
    const files = await readdir(uploadDir);
    const validFiles = await Promise.all(
      files
        .filter(f => !f.startsWith('.'))
        .map(async (filename) => {
          const stats = await stat(join(uploadDir, filename));
          const kindInName = filename.match(/^\d+-(image|video|audio)-/i)?.[1]?.toLowerCase();
          // guess type
          const isImage = filename.match(/\.(jpg|jpeg|png|gif|webp)$/i);
          const isVideo = filename.match(/\.(mp4|webm|mov)$/i);
          const isAudio = filename.match(/\.(mp3|m4a|aac|wav|ogg|oga|opus|amr|3gp)$/i);
          const type = kindInName
            ? `${kindInName}/*`
            : (isImage ? 'image/*' : (isVideo ? 'video/*' : (isAudio ? 'audio/*' : 'application/octet-stream')));
          
          return {
            url: `/uploads/${filename}`,
            name: filename,
            type,
            mtime: stats.mtimeMs
          };
        })
    );
    
    // Sort by newest first
    validFiles.sort((a, b) => b.mtime - a.mtime);
    
    return NextResponse.json({ files: validFiles });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ files: [] });
  }
}
