import { NextResponse } from "next/server";

export async function GET() {
  try {
    // In development, we can read from the filesystem directly
    if (process.env.NODE_ENV === 'development') {
      const fs = await import('fs');
      const path = await import('path');
      const picsDir = path.join(process.cwd(), 'public', 'pics');
      const allowed = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
      
      const files = fs.readdirSync(picsDir);
      const images = files
        .filter((file) => {
          const ext = path.extname(file).toLowerCase();
          return allowed.includes(ext);
        })
        .sort();
      
      return NextResponse.json(images);
    } else {
      // In production on Vercel, avoid filesystem access to prevent bundling large assets
      // Return a curated static list (must match files in public/pics)
      const fallbackImageFiles = [
        "IMG5573-R01-007A.png",
        "IMG5573-R01-008A.png",
        "IMG5573-R01-011A.png",
        "IMG5573-R01-013A.png",
        "IMG5573-R01-016A.png",
        "IMG5573-R01-022A.png",
        "IMG5573-R01-023A.png",
        "IMG5573-R01-024A.png",
        "IMG5573-R01-033A.png",
        "IMG5573-R01-035A.png",
        "IMG6103-R01-003A.png",
        "IMG6103-R01-006A.png",
        "IMG6103-R01-007A.png",
        "IMG6103-R01-008A.png",
        "IMG6103-R01-014A.png",
        "IMG6103-R01-023A.png",
        "IMG6103-R01-024A.png",
        "IMG6109-R01-027.png",
        "IMG6110-R01-001A.png",
        "IMG6110-R01-008A.png",
        "IMG6110-R01-010A.png",
        "IMG6110-R01-013A.png",
        "IMG6110-R01-014A.png",
        "IMG6110-R01-016A.png",
        "IMG6110-R01-017A.png",
        "IMG6110-R01-018A.png",
        "IMG6110-R01-019A.png",
        "IMG6110-R01-021A.png",
        "IMG6110-R01-022A.png",
        "IMG6110-R01-023A.png",
        "IMG6110-R01-029A.png",
        "IMG7659-R01-008.png",
        "IMG7659-R01-009.png",
        "IMG7659-R01-010.png",
        "IMG7659-R01-011.png",
        "IMG7659-R01-016.png",
        "IMG7659-R01-019.png",
        "IMG7659-R01-025.png",
        "IMG7659-R01-028.png",
        "IMG7659-R01-029.png",
        "IMG7659-R01-030.png",
        "IMG7659-R01-031.png",
        "IMG7659-R01-032.png",
        "image1.png",
        "image2.png",
        "image3.png",
        "image4.png",
        "image5.png",
      ];
      return NextResponse.json(fallbackImageFiles);
    }
  } catch (err) {
    console.error('Error reading images:', err);
    return NextResponse.json(
      { error: 'Could not read images', details: err.message },
      { status: 500 }
    );
  }
}
