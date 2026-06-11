import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  const data = await request.formData();
  const file: File | null = data.get('file') as unknown as File;

  if (!file) {
    return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
  }

  const allowedMimePrefixes = ['image/', 'video/', 'audio/'];
  if (!file.type || !allowedMimePrefixes.some((prefix) => file.type.startsWith(prefix))) {
    return NextResponse.json(
      { success: false, message: 'Unsupported file type. Only image/video/audio is allowed.' },
      { status: 415 }
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const mediaKind = file.type.split('/')[0];

  // sanitize filename
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filename = `${Date.now()}-${mediaKind}-${safeName}`;
  const uploadDir = path.join(process.cwd(), 'public/uploads'); 
  const filepath = path.join(uploadDir, filename);

  await writeFile(filepath, buffer);
  
  // Notify clients via Socket.IO
  // @ts-ignore
  if (global.io) {
    // @ts-ignore
    global.io.emit('new-file', { url: `/uploads/${filename}`, name: file.name, type: file.type });
  }

  return NextResponse.json({ success: true, url: `/uploads/${filename}` });
}
