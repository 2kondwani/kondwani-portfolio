'use client';
import { useState } from 'react';

export default function PdfPreview({ pdfUrl, width = 220, height = 140 }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Handle iframe load events
  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <div 
      style={{ 
        position: 'relative',
        width,
        height,
        overflow: 'hidden',
        border: '1px solid #eaeaea',
        borderRadius: '4px',
        backgroundColor: '#f5f5f5',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Loading state */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          color: '#666',
          fontSize: '14px',
        }}>
          Loading preview...
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          color: '#666',
          textAlign: 'center',
          padding: '1rem',
          fontSize: '14px',
        }}>
          Could not load preview. Click to open PDF.
        </div>
      )}

      {/* PDF Preview */}
      <iframe
        src={`${pdfUrl}#toolbar=0&navpanes=0&view=FitH`}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          backgroundColor: 'white',
          opacity: hasError ? 0 : 1,
          visibility: hasError ? 'hidden' : 'visible',
        }}
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        title="PDF Preview"
        loading="lazy"
      />

      {/* Overlay with link to open full PDF */}
      <a
        href={pdfUrl}
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
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.2s',
          fontSize: '1rem',
          fontWeight: 500,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        Open PDF
      </a>
    </div>
  );
}
