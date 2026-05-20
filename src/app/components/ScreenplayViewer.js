"use client";
import { useState } from "react";

export default function ScreenplayViewer({ pdfUrl, title }) {
  const [showViewer, setShowViewer] = useState(false);

  return (
    <div className="w-full flex flex-col items-center mt-4">
      <button
        className="underline text-blue-700 hover:text-blue-900 text-base mb-2"
        onClick={() => setShowViewer(!showViewer)}
      >
        {showViewer ? "Hide PDF" : `Read my screenplay: ${title}`}
      </button>
      {showViewer && (
        <div className="w-full flex justify-center mt-2 mb-4" style={{ minHeight: 400 }}>
          <iframe
            src={pdfUrl}
            title={title}
            width="600"
            height="800"
            style={{ border: "1px solid #ccc", borderRadius: 8, background: "#f5f5f5" }}
          >
            This browser does not support PDFs. Please download the PDF to view it: <a href={pdfUrl}>Download PDF</a>.
          </iframe>
        </div>
      )}
    </div>
  );
}
