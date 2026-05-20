'use client';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { useState, useEffect } from 'react';

// Configure PDF.js worker
const workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

export default function PdfPreview({ pdfUrl, width, height, style }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber] = useState(1);
  const [pdfError, setPdfError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Ensure the URL is absolute
  const getPdfUrl = (url) => {
    if (!url) return '';
    // If it's already an absolute URL, return as is
    if (url.startsWith('http') || url.startsWith('blob:')) return url;
    // If it's a relative URL, make it absolute
    if (url.startsWith('/')) return url;
    // Otherwise, assume it's a path from the public folder
    return `/${url}`;
  };

  const resolvedPdfUrl = getPdfUrl(pdfUrl);

  useEffect(() => {
    console.log('PdfPreview - Resolved URL:', resolvedPdfUrl);
  }, [resolvedPdfUrl]);

  function onDocumentLoadSuccess({ numPages }) {
    console.log('PDF loaded successfully with', numPages, 'pages');
    setNumPages(numPages);
    setPdfError(false);
    setLoading(false);
    setError(null);
  }

  function onDocumentLoadError(error) {
    console.error('Error loading PDF:', error);
    setPdfError(true);
    setLoading(false);
    setError('Failed to load PDF: ' + error.message);
  }

  // Calculate scale based on container width
  const scale = Math.min(1, width / 595); // Cap scale at 1x to prevent blurry text
  const scaledWidth = 595 * scale;
  const scaledHeight = 842 * scale * 0.5; // Show only half the height

  if (error) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        color: '#d32f2f',
        fontSize: '14px',
        textAlign: 'center',
        padding: '10px',
        border: '1px solid #ffcdd2',
      }}>
        <div>Error loading PDF</div>
        <div style={{ fontSize: '12px', marginTop: '8px', color: '#666' }}>{error}</div>
      </div>
    );
  }


  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative', ...style }}>
      <div style={{ 
        width: '100%', 
        height: '100%', 
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <Document
          file={resolvedPdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div style={{ 
              width: '100%', 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#666',
              fontSize: '14px'
            }}>
              {loading ? 'Loading PDF...' : 'Rendering PDF...'}
            </div>
          }
        >
          <Page 
            pageNumber={pageNumber} 
            width={scaledWidth}
            height={scaledHeight}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>
      </div>
      <a
        href={resolvedPdfUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          color: 'white',
          textDecoration: 'none',
          opacity: 0,
          transition: 'opacity 0.2s',
          fontSize: '1rem',
          fontWeight: 500,
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
        onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
      >
        Open PDF
      </a>
    </div>
  );
}
