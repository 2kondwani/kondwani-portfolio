import { NextResponse } from 'next/server';
import { getDriveImages } from '@/lib/drive';

const GALLERY_FOLDER_ID = '16xmnxC6z6XEkgE8u_HPe2l9RGOCGy1Qn';

// Revalidate hourly so newly-added Drive images surface without a redeploy.
export const revalidate = 3600;

export async function GET() {
  const images = await getDriveImages(GALLERY_FOLDER_ID);
  return NextResponse.json(images);
}
