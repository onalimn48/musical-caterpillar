import { Link } from 'react-router-dom';

export default function StudentResultScreen({
  title,
  subtitle,
  summaryLines,
  error = '',
}) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      background: 'linear-gradient(180deg, #132238 0%, #29446b 100%)',
      color: '#f8fbff',
      fontFamily: '"Trebuchet MS", "Avenir Next", sans-serif',
      padding: 24,
    }}>
      <div style={{
        width: 'min(100%, 520px)',
        borderRadius: 24,
        padding: 28,
        background: 'rgba(12, 20, 36, 0.72)',
        border: '1px solid rgba(255,255,255,0.16)',
      }}>
        <p style={{
          margin: '0 0 8px',
          color: '#fde68a',
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
          Assignment
        </p>
        <h1 style={{ margin: 0 }}>{title}</h1>
        <p style={{ color: '#d7e5f7', lineHeight: 1.5 }}>{subtitle}</p>
        {summaryLines?.length ? (
          <ul style={{ color: '#d7e5f7', paddingLeft: 18 }}>
            {summaryLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : null}
        {error ? (
          <p style={{
            padding: '12px 14px',
            borderRadius: 14,
            background: 'rgba(248, 113, 113, 0.16)',
            color: '#fecaca',
          }}>
            {error}
          </p>
        ) : null}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
          <Link
            to="/student/assignments"
            style={{
              borderRadius: 999,
              background: 'linear-gradient(135deg, #fde68a 0%, #7dd3fc 100%)',
              color: '#122033',
              fontWeight: 700,
              padding: '12px 18px',
              textDecoration: 'none',
            }}
          >
            Back to assignments
          </Link>
          <Link
            to="/student"
            style={{
              borderRadius: 999,
              background: 'rgba(255,255,255,0.1)',
              color: '#f8fbff',
              padding: '12px 18px',
              textDecoration: 'none',
            }}
          >
            Switch student
          </Link>
        </div>
      </div>
    </div>
  );
}
