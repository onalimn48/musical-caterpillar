import { Link } from 'react-router-dom';

const games = [
  {
    path: '/note-speller',
    icon: '📝🐛',
    title: 'Note Speller',
    desc: 'Read notes on the staff to spell real words! Level up as you learn treble and bass clef.',
    tag: 'NOTE READING',
    accent: '#4ade80',
    glow: 'linear-gradient(135deg,rgba(74,222,128,.08),rgba(34,211,238,.04))',
    shadow: 'rgba(74,222,128,.15)',
    tagBg: 'rgba(74,222,128,.12)',
  },
  {
    path: '/notes-per-minute',
    icon: '⏱️🎵',
    title: 'Notes Per Minute',
    desc: 'How fast can you read? Race the clock to identify notes and beat your high score!',
    tag: 'SPEED CHALLENGE',
    accent: '#fb923c',
    glow: 'linear-gradient(135deg,rgba(251,146,60,.08),rgba(245,158,11,.04))',
    shadow: 'rgba(251,146,60,.15)',
    tagBg: 'rgba(251,146,60,.12)',
  },
  {
    path: '/chord-snowman',
    icon: '⛄🎧',
    title: 'Chord Snowman',
    desc: 'Train your ear! Learn intervals, build chords, and guide a caterpillar through a winter journey.',
    tag: 'EAR TRAINING',
    accent: '#818cf8',
    glow: 'linear-gradient(135deg,rgba(99,102,241,.08),rgba(139,92,246,.04))',
    shadow: 'rgba(99,102,241,.15)',
    tagBg: 'rgba(99,102,241,.12)',
  },
];

const pills = ['🎧 Ear Training', '🎼 Note Reading', '⛄ Build Chords', '📱 Works on Phone', '🏆 Achievements', '🆓 100% Free'];

export default function LandingPage() {
  return (
    <div style={{
      minHeight:'100vh',fontFamily:"'Quicksand',sans-serif",color:'white',overflowX:'hidden',
      background:'linear-gradient(180deg,#0c1445 0%,#162055 40%,#1a3a5c 80%,#1e4d6b 100%)',
    }}>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
        @keyframes twinkle{0%,100%{opacity:.2;transform:scale(.7)}50%{opacity:1;transform:scale(1.2)}}
        @keyframes fall{0%{transform:translateY(-20px) rotate(0deg)}100%{transform:translateY(100vh) rotate(360deg)}}
        @keyframes catBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
        .game-card{transition:all .3s cubic-bezier(.34,1.56,.64,1)!important}
        .game-card:hover{transform:translateY(-6px) scale(1.02)}
        .game-card:active{transform:translateY(-2px) scale(.98)}
        @media(prefers-reduced-motion:reduce){*{animation-duration:0s!important;transition-duration:0s!important}}
      `}</style>

      {/* Stars */}
      <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:0}}>
        {Array.from({length:40}).map((_,i) => (
          <div key={i} style={{
            position:'absolute',borderRadius:'50%',background:'#e0e7ff',
            left:`${(i*17+7)%100}%`,top:`${(i*23+11)%60}%`,
            width:2+((i*3)%3),height:2+((i*3)%3),
            animation:`twinkle ${1.5+(i%20)/10}s ease-in-out infinite`,
            animationDelay:`${(i*0.15)%3}s`,
          }}/>
        ))}
      </div>

      {/* Snowflakes */}
      <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:0}}>
        {Array.from({length:15}).map((_,i) => (
          <div key={i} style={{
            position:'fixed',color:'white',fontSize:8+(i%10),opacity:.35,
            left:`${(i*7+3)%100}%`,
            animation:`fall ${6+(i%8)}s linear infinite`,
            animationDelay:`${(i*0.6)%8}s`,
          }}>❄</div>
        ))}
      </div>

      {/* Hero */}
      <section style={{position:'relative',zIndex:1,textAlign:'center',padding:'clamp(60px,12vh,100px) 20px 40px'}}>
       <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Musical Caterpillar"
          style={{
            width:'clamp(140px,30vw,220px)',
            animation:'catBounce 2s ease-in-out infinite',
            filter:'drop-shadow(0 8px 24px rgba(74,222,128,.3))',
          }}/>
        <h1 style={{
          fontFamily:"'Fredoka',sans-serif",fontSize:'clamp(32px,7vw,56px)',fontWeight:700,
          background:'linear-gradient(135deg,#4ade80,#22d3ee,#a78bfa)',
          WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',
          backgroundClip:'text',margin:'8px 0 12px',lineHeight:1.1,
        }}>Musical Caterpillar</h1>
        <p style={{fontSize:'clamp(14px,3vw,18px)',color:'#94a3b8',maxWidth:500,margin:'0 auto',lineHeight:1.6}}>
          Fun music games that teach note reading, ear training, and more — one little step at a time!
        </p>
      </section>

      {/* Games */}
      <section style={{position:'relative',zIndex:1,padding:'40px 20px 60px',maxWidth:900,margin:'0 auto'}}>
        <h2 style={{fontFamily:"'Fredoka',sans-serif",textAlign:'center',fontSize:'clamp(20px,4vw,28px)',color:'#fde68a',marginBottom:32,fontWeight:600}}>
          🎵 Choose Your Adventure
        </h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:20}}>
          {games.map(g => (
            <Link key={g.path} to={g.path} className="game-card" style={{
              position:'relative',display:'block',textDecoration:'none',color:'white',
              background:'linear-gradient(135deg,rgba(255,255,255,.06),rgba(255,255,255,.02))',
              border:'2px solid rgba(255,255,255,.08)',borderRadius:24,padding:'32px 24px',
              textAlign:'center',cursor:'pointer',
            }}>
              <div style={{fontSize:56,marginBottom:12}}>{g.icon}</div>
              <div style={{fontFamily:"'Fredoka',sans-serif",fontSize:22,fontWeight:700,marginBottom:6}}>{g.title}</div>
              <div style={{fontSize:14,color:'#94a3b8',lineHeight:1.5}}>{g.desc}</div>
              <div style={{
                display:'inline-block',marginTop:12,padding:'4px 12px',borderRadius:8,
                fontSize:11,fontWeight:700,letterSpacing:'.5px',
                background:g.tagBg,color:g.accent,
              }}>{g.tag}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Feature pills */}
      <div style={{position:'relative',zIndex:1,display:'flex',flexWrap:'wrap',gap:10,justifyContent:'center',padding:'0 20px 48px',maxWidth:700,margin:'0 auto'}}>
        {pills.map(p => (
          <div key={p} style={{
            background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.08)',
            borderRadius:20,padding:'8px 16px',fontSize:13,color:'#94a3b8',fontWeight:500,
          }}>{p}</div>
        ))}
      </div>

      {/* Footer */}
      <footer style={{position:'relative',zIndex:1,textAlign:'center',padding:'24px 20px 40px',borderTop:'1px solid rgba(255,255,255,.06)'}}>
        <p style={{color:'#475569',fontSize:12}}>Made with 🎵 for young musicians everywhere</p>
      </footer>
    </div>
  );
}
