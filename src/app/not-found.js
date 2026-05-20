import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: 40, textAlign: 'center' }}>
      <h1>404 - Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <Link href="/" style={{ marginTop: 20, display: 'inline-block', padding: '8px 16px', borderRadius: 6, background: '#111', color: '#fff', textDecoration: 'none' }}>Go Home</Link>
    </div>
  );
}
