import { Link } from 'react-router-dom';
import caterpillarSingingGif from '../../../assets/caterpillar_singing_notes_v5.gif';
import Seo from '../seo/Seo.jsx';
import InstallAppCard from '../pwa/InstallAppCard.jsx';

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

const bearglarCard = {
  path: '/bearglar',
  icon: '🐻🎵',
  title: 'Bearglar',
  desc: 'Tap and hold rhythms to dodge lasers, sneak past guards, and crack the museum vault.',
  tag: 'RHYTHM GAME',
  accent: '#f87171',
  tagBg: 'rgba(248,113,113,.12)',
};

const studioCard = {
  path: '/caterpillar-studio',
  icon: '🐛🎛️',
  title: 'Caterpillar Studio',
  desc: 'Open the music-making suite with Sound Garden and Loop Trail.',
  tag: 'CREATE MUSIC',
  accent: '#f472b6',
  tagBg: 'rgba(244,114,182,.12)',
};

const pills = ['🎛️ Sound Design', '🥁 Sequencing', '🎧 Ear Training', '🎼 Note Reading', '📱 Works on Phone', '🧑‍🏫 Premium Teacher Tools'];
const teacherLinks = [
  { path: '/music-theory-games-for-kids', label: 'Music Theory Games for Kids' },
  { path: '/music-classroom-games', label: 'Music Classroom Games' },
  { path: '/how-to-teach-note-reading', label: 'How to Teach Note Reading' },
  { path: '/music-warmups', label: 'Music Warmups' },
  { path: '/notes-per-minute-fluency', label: 'Note Reading Fluency Benchmark' },
];
const comparisonRows = [
  ['Real staff notation', 'Yes', 'Usually limited', 'Mixed'],
  ['Teacher assignments', 'Yes', 'Rare', 'No'],
  ['Student login required', 'No general account', 'Often yes', 'Varies'],
  ['Pricing model', 'Free games, optional premium teacher tools', 'Usually paid', 'Freemium or paid'],
];
const homepageFaqs = [
  {
    question: 'Can teachers use this with a whole class?',
    answer: 'Yes. Teachers can create classes, add rosters, post assignments, and review results from the teacher dashboard.',
  },
  {
    question: 'Does it support standards alignment labeling?',
    answer: 'Yes. Musical Caterpillar can be labeled against classroom standards frameworks such as NAfME and Common Core Arts so teachers can connect activities to the skills they are targeting.',
  },
  {
    question: 'Do students need an account?',
    answer: 'No. Students can enter a class code, choose their name from the roster, and begin without creating a separate account.',
  },
  {
    question: 'Is Musical Caterpillar free?',
    answer: 'The games are free to play. Teacher reporting and backend classroom tools can be offered as premium features.',
  },
];
const trustLinks = [
  { path: '/privacy', label: 'Privacy' },
  { path: '/terms', label: 'Terms' },
  { path: '/contact', label: 'Contact' },
];

export default function LandingPage() {
  return (
    <div style={{
      minHeight:'100vh',fontFamily:"'Quicksand',sans-serif",color:'white',overflowX:'hidden',
      background:'linear-gradient(180deg,#0c1445 0%,#162055 40%,#1a3a5c 80%,#1e4d6b 100%)',
    }}>
      <Seo path="/"/>
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
      <section style={{position:'relative',zIndex:1,textAlign:'center',padding:'clamp(40px,8vh,72px) 20px 12px'}}>
        <img
          src={caterpillarSingingGif}
          alt="Animated green caterpillar in a top hat singing musical notes."
          style={{
            width:'clamp(150px,30vw,230px)',
            height:'auto',
            display:'block',
            margin:'0 auto',
            animation:'catBounce 2s ease-in-out infinite',
            filter:'drop-shadow(0 8px 24px rgba(74,222,128,.3))',
          }}
        />
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
      <section style={{position:'relative',zIndex:1,padding:'8px 20px 60px',maxWidth:900,margin:'0 auto'}}>
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
        <Link
          to={bearglarCard.path}
          className="game-card"
          style={{
            position:'relative',
            display:'block',
            textDecoration:'none',
            color:'white',
            marginTop:22,
            borderRadius:28,
            padding:'18px 24px',
            background:'linear-gradient(135deg,rgba(248,113,113,.14),rgba(251,191,36,.08),rgba(255,255,255,.04))',
            border:'2px solid rgba(255,255,255,.08)',
            boxShadow:'0 18px 36px rgba(15,23,42,.18)',
          }}
        >
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:20,flexWrap:'wrap'}}>
            <div style={{display:'flex',alignItems:'center',gap:18,minWidth:0}}>
              <div style={{fontSize:48,flex:'0 0 auto'}}>{bearglarCard.icon}</div>
              <div style={{minWidth:0}}>
                <div style={{fontFamily:"'Fredoka',sans-serif",fontSize:'clamp(24px,4vw,30px)',fontWeight:700,marginBottom:6}}>
                  {bearglarCard.title}
                </div>
                <div style={{fontSize:15,color:'#cbd5e1',lineHeight:1.6,maxWidth:620}}>
                  {bearglarCard.desc}
                </div>
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
              <div style={{
                display:'inline-block',
                padding:'5px 12px',
                borderRadius:10,
                fontSize:11,
                fontWeight:700,
                letterSpacing:'.5px',
                background:bearglarCard.tagBg,
                color:bearglarCard.accent,
              }}>
                {bearglarCard.tag}
              </div>
              <div style={{fontSize:22,color:'#fce7f3'}}>→</div>
            </div>
          </div>
        </Link>
        <Link
          to={studioCard.path}
          className="game-card"
          style={{
            position:'relative',
            display:'block',
            textDecoration:'none',
            color:'white',
            marginTop:22,
            borderRadius:28,
            padding:'24px 28px',
            background:'linear-gradient(135deg,rgba(244,114,182,.12),rgba(103,232,249,.06),rgba(255,255,255,.04))',
            border:'2px solid rgba(255,255,255,.08)',
            boxShadow:'0 18px 36px rgba(15,23,42,.18)',
          }}
        >
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:20,flexWrap:'wrap'}}>
            <div style={{display:'flex',alignItems:'center',gap:18,minWidth:0}}>
              <div style={{fontSize:54,flex:'0 0 auto'}}>{studioCard.icon}</div>
              <div style={{minWidth:0}}>
                <div style={{fontFamily:"'Fredoka',sans-serif",fontSize:'clamp(24px,4vw,30px)',fontWeight:700,marginBottom:6}}>
                  {studioCard.title}
                </div>
                <div style={{fontSize:15,color:'#cbd5e1',lineHeight:1.6,maxWidth:620}}>
                  {studioCard.desc}
                </div>
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
              <div style={{
                display:'inline-block',
                padding:'5px 12px',
                borderRadius:10,
                fontSize:11,
                fontWeight:700,
                letterSpacing:'.5px',
                background:studioCard.tagBg,
                color:studioCard.accent,
              }}>
                {studioCard.tag}
              </div>
              <div style={{fontSize:22,color:'#fce7f3'}}>→</div>
            </div>
          </div>
        </Link>
        <div style={{display:'flex',justifyContent:'center',marginTop:22}}>
          <Link
            to="/about"
            style={{
              display:'inline-flex',alignItems:'center',justifyContent:'center',
              textDecoration:'none',padding:'12px 20px',borderRadius:14,
              background:'linear-gradient(135deg,rgba(255,255,255,.14),rgba(255,255,255,.06))',
              border:'1px solid rgba(255,255,255,.14)',color:'#f8fafc',
              fontWeight:700,fontSize:15,boxShadow:'0 10px 24px rgba(15,23,42,.18)',
            }}
          >
            About
          </Link>
        </div>
        <InstallAppCard/>
        <div style={{
          marginTop:28,padding:'20px 22px',borderRadius:20,
          background:'linear-gradient(135deg,rgba(255,255,255,.08),rgba(255,255,255,.03))',
          border:'1px solid rgba(255,255,255,.1)',textAlign:'center',
        }}>
          <div style={{fontFamily:"'Fredoka',sans-serif",fontSize:22,color:'#fde68a',marginBottom:8}}>
            For Teachers
          </div>
          <p style={{color:'#94a3b8',fontSize:14,lineHeight:1.6,maxWidth:620,margin:'0 auto 16px'}}>
            Explore classroom ideas, warmups, and note-reading resources built to support music teachers.
          </p>
          <div style={{display:'flex',flexWrap:'wrap',justifyContent:'center',gap:10}}>
            {teacherLinks.map(link => (
              <a key={link.path} href={link.path} style={{
                textDecoration:'none',padding:'10px 14px',borderRadius:12,
                color:'#e2e8f0',background:'rgba(15,23,42,.28)',
                border:'1px solid rgba(255,255,255,.08)',fontWeight:700,fontSize:14,
              }}>
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <div style={{
          marginTop: 22,
          padding: '24px 22px',
          borderRadius: 20,
          background: 'linear-gradient(135deg,rgba(255,255,255,.08),rgba(255,255,255,.03))',
          border: '1px solid rgba(255,255,255,.1)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 18 }}>
            <div style={{ fontFamily: "'Fredoka',sans-serif", fontSize: 22, color: '#fde68a', marginBottom: 8 }}>
              Teacher Snapshot
            </div>
            <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6, maxWidth: 620, margin: '0 auto' }}>
              A quick summary for teachers deciding whether Musical Caterpillar fits lessons, labs, or take-home practice.
            </p>
          </div>

          <div style={{ overflowX: 'auto', marginBottom: 18 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '12px', color: '#f8fafc', borderBottom: '1px solid rgba(255,255,255,.12)' }}>Feature</th>
                  <th style={{ textAlign: 'left', padding: '12px', color: '#4ade80', borderBottom: '1px solid rgba(255,255,255,.12)' }}>Musical Caterpillar</th>
                  <th style={{ textAlign: 'left', padding: '12px', color: '#cbd5e1', borderBottom: '1px solid rgba(255,255,255,.12)' }}>Many App-Style Music Games</th>
                  <th style={{ textAlign: 'left', padding: '12px', color: '#cbd5e1', borderBottom: '1px solid rgba(255,255,255,.12)' }}>Worksheet Sites</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map(([feature, musicalCaterpillar, appStyle, worksheet]) => (
                  <tr key={feature}>
                    <td style={{ padding: '12px', color: '#f8fafc', borderBottom: '1px solid rgba(255,255,255,.08)' }}>{feature}</td>
                    <td style={{ padding: '12px', color: '#bbf7d0', borderBottom: '1px solid rgba(255,255,255,.08)' }}>{musicalCaterpillar}</td>
                    <td style={{ padding: '12px', color: '#cbd5e1', borderBottom: '1px solid rgba(255,255,255,.08)' }}>{appStyle}</td>
                    <td style={{ padding: '12px', color: '#cbd5e1', borderBottom: '1px solid rgba(255,255,255,.08)' }}>{worksheet}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
            {homepageFaqs.map((faq) => (
              <div
                key={faq.question}
                style={{
                  padding: '16px 16px 18px',
                  borderRadius: 16,
                  background: 'rgba(15,23,42,.28)',
                  border: '1px solid rgba(255,255,255,.08)',
                }}
              >
                <div style={{ color: '#f8fafc', fontWeight: 700, marginBottom: 8 }}>{faq.question}</div>
                <div style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6 }}>{faq.answer}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
            <Link
              to="/why-musical-caterpillar"
              style={{
                textDecoration: 'none',
                color: '#c7d2fe',
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              Read the full teacher rationale →
            </Link>
          </div>
        </div>

        <div style={{
          marginTop: 22,
          padding: '20px 22px',
          borderRadius: 20,
          background: 'linear-gradient(135deg,rgba(34,211,238,.12),rgba(255,255,255,.04))',
          border: '1px solid rgba(255,255,255,.1)',
          textAlign: 'center',
        }}>
          <div style={{ fontFamily: "'Fredoka',sans-serif", fontSize: 22, color: '#f8fafc', marginBottom: 8 }}>
            Trust and Contact
          </div>
          <p style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 1.6, maxWidth: 620, margin: '0 auto 16px' }}>
            Teachers and families can review the site policies and reach support directly.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
            {trustLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                style={{
                  textDecoration: 'none',
                  padding: '10px 14px',
                  borderRadius: 12,
                  color: '#f8fafc',
                  background: 'rgba(15,23,42,.28)',
                  border: '1px solid rgba(255,255,255,.08)',
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
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
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>
          <Link
            to="/why-musical-caterpillar"
            style={{
              color:'#94a3b8',
              fontSize:13,
              textDecoration:'none',
              borderBottom:'1px solid rgba(148,163,184,.35)',
              paddingBottom:2,
            }}
          >
            Why Musical Caterpillar
          </Link>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
            {trustLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                style={{ color: '#94a3b8', fontSize: 13, textDecoration: 'none' }}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <p style={{color:'#475569',fontSize:12}}>Made with 🎵 for young musicians everywhere</p>
        </div>
      </footer>
    </div>
  );
}
