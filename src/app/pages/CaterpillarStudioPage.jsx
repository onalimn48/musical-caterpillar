import { Link } from 'react-router-dom';
import Seo from '../seo/Seo.jsx';

const studioGames = [
  {
    path: '/synth-lab',
    icon: '🐛🎛️',
    title: 'Sound Garden',
    desc: 'Shape sounds, save patches, and teach simple synthesis with an animated caterpillar.',
    accent: '#f472b6',
    tag: 'SYNTH LAB',
    tagBg: 'rgba(244,114,182,.12)',
  },
  {
    path: '/caterpillar-sequencer',
    icon: '🐛🥁',
    title: 'Loop Trail',
    desc: 'Build beats and melodies, assign saved sounds to lanes, and arrange short musical ideas.',
    accent: '#bef264',
    tag: 'SEQUENCER',
    tagBg: 'rgba(190,242,100,.12)',
  },
];

export default function CaterpillarStudioPage() {
  return (
    <div style={{
      minHeight: '100vh',
      fontFamily: "'Quicksand',sans-serif",
      color: 'white',
      overflowX: 'hidden',
      background: 'linear-gradient(180deg,#10153f 0%,#132c5a 42%,#164e63 74%,#14532d 100%)',
      padding: '40px 20px 64px',
    }}>
      <Seo path="/caterpillar-studio" />
      <style>{`
        *{box-sizing:border-box}
        .studio-card{transition:transform .28s cubic-bezier(.34,1.56,.64,1), box-shadow .28s ease}
        .studio-card:hover{transform:translateY(-6px) scale(1.01)}
      `}</style>

      <div style={{ maxWidth: 960, margin: '0 auto' }}>
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
              border: '1px solid rgba(255,255,255,.14)',
              background: 'rgba(15,23,42,.22)',
              color: '#e2e8f0',
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            Back
          </Link>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={{
            display: 'inline-block',
            padding: '6px 14px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '.7px',
            textTransform: 'uppercase',
            background: 'rgba(249,168,212,.14)',
            color: '#f9a8d4',
            marginBottom: 14,
          }}>
            Create Music
          </div>
          <h1 style={{
            margin: 0,
            fontFamily: "'Fredoka',sans-serif",
            fontSize: 'clamp(36px,7vw,58px)',
            lineHeight: 1,
            color: '#fce7f3',
          }}>
            Caterpillar Studio
          </h1>
          <p style={{
            maxWidth: 720,
            margin: '18px auto 0',
            fontSize: 17,
            lineHeight: 1.65,
            color: '#cbd5e1',
          }}>
            Build a sound in Sound Garden, save it, then bring it into Loop Trail to make a piece. These two tools are designed to work together.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 22 }}>
          {studioGames.map((game) => (
            <Link
              key={game.path}
              to={game.path}
              className="studio-card"
              style={{
                textDecoration: 'none',
                color: 'white',
                borderRadius: 28,
                padding: '34px 26px',
                background: 'linear-gradient(135deg,rgba(255,255,255,.1),rgba(255,255,255,.04))',
                border: '1px solid rgba(255,255,255,.12)',
                boxShadow: '0 20px 40px rgba(15,23,42,.18)',
              }}
            >
              <div style={{ fontSize: 58, marginBottom: 12 }}>{game.icon}</div>
              <div style={{ fontFamily: "'Fredoka',sans-serif", fontSize: 28, marginBottom: 8 }}>{game.title}</div>
              <div style={{ fontSize: 15, lineHeight: 1.6, color: '#dbe4f0' }}>{game.desc}</div>
              <div style={{
                display: 'inline-block',
                marginTop: 14,
                padding: '5px 12px',
                borderRadius: 10,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '.5px',
                background: game.tagBg,
                color: game.accent,
              }}>
                {game.tag}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
