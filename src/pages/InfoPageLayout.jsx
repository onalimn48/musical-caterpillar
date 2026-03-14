import { Link } from 'react-router-dom';
import Seo from '../app/seo/Seo.jsx';

export default function InfoPageLayout({ path, title, eyebrow, intro, children }) {
  return (
    <main style={{
      minHeight: '100vh',
      background: '#f8fafc',
      color: '#0f172a',
      padding: '48px 20px 80px',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <Seo path={path}/>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              textDecoration: 'none',
              borderRadius: 999,
              padding: '10px 14px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#0f172a',
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            Back to Home
          </Link>
        </div>

        <div style={{
          background: '#ffffff',
          borderRadius: '24px',
          padding: '40px 24px',
          boxShadow: '0 24px 60px rgba(15, 23, 42, 0.08)',
        }}>
          <p style={{
            margin: '0 0 10px',
            textTransform: 'uppercase',
            letterSpacing: '.08em',
            fontSize: 12,
            fontWeight: 700,
            color: '#2563eb',
          }}>
            {eyebrow}
          </p>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
            lineHeight: 1.1,
            margin: '0 0 16px',
          }}>
            {title}
          </h1>
          <p style={{ fontSize: '1.05rem', lineHeight: 1.75, margin: '0 0 32px', color: '#334155' }}>
            {intro}
          </p>
          <div style={{ display: 'grid', gap: 24 }}>
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
