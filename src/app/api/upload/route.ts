import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Provide a unique filename
    const extension = file.name.split('.').pop() || 'png';
    const filename = `${crypto.randomUUID()}.${extension}`;
    
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'avatars');
    
    // Ensure the directory exists
    await mkdir(uploadDir, { recursive: true });

    const path = join(uploadDir, filename);
    await writeFile(path, buffer);

    const fileUrl = `/uploads/avatars/${filename}`;

    return NextResponse.json({ success: true, url: fileUrl });
  } catch (e: any) {
    console.error('Error uploading file:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
