"use client";

export default function GlobalError({ error, reset }) {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: 40, textAlign: 'center' }}>
      <h1>Something went wrong!</h1>
      <p>{error?.message || "An unexpected error occurred."}</p>
      <button 
        onClick={() => reset()} 
        style={{ 
          marginTop: 20, 
          padding: '8px 16px', 
          borderRadius: 6, 
          background: '#111', 
          color: '#fff', 
          border: 'none',
          cursor: 'pointer'
        }}
      >
        Try again
      </button>
    </div>
  );
}
