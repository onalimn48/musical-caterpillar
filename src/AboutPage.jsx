import { Link } from 'react-router-dom';
import Seo from './app/seo/Seo.jsx';

export default function AboutPage() {
  return (
    <div style={{
      minHeight:'100vh',fontFamily:"'Quicksand',sans-serif",color:'white',overflowX:'hidden',
      background:'linear-gradient(180deg,#0c1445 0%,#162055 40%,#1a3a5c 80%,#1e4d6b 100%)',
      padding:'40px 20px 56px',
    }}>
      <Seo path="/about"/>
      <style>{`
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
        @keyframes catBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
      `}</style>

      <div style={{maxWidth:900,margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:30}}>
          <img
            src="/logo.png"
            alt="Musical Caterpillar"
            style={{
              width:'clamp(120px,26vw,180px)',
              animation:'catBounce 2s ease-in-out infinite',
              filter:'drop-shadow(0 8px 24px rgba(74,222,128,.3))',
            }}
          />
          <h1 style={{
            fontFamily:"'Fredoka',sans-serif",fontSize:'clamp(32px,6vw,48px)',fontWeight:700,
            margin:'16px 0 12px',lineHeight:1.1,color:'#f8fafc',
          }}>About Musical Caterpillar</h1>
        </div>

        <div style={{
          background:'linear-gradient(135deg,rgba(255,255,255,.08),rgba(255,255,255,.03))',
          border:'2px solid rgba(255,255,255,.08)',borderRadius:24,padding:'28px 24px',
          boxShadow:'0 18px 40px rgba(15,23,42,.14)',
        }}>
          <p style={{fontSize:17,color:'#cbd5e1',lineHeight:1.75,margin:'0 0 18px'}}>
            Musical Caterpillar was created by Nico Carter, a Chicago-born writer, comedian, actor, and composer who believes learning music should feel playful, creative, and approachable. Nico attended the Oberlin Conservatory and teaches piano at The People&apos;s Music School, bringing both formal training and real classroom experience into the design of the site.
          </p>
          <p style={{fontSize:17,color:'#cbd5e1',lineHeight:1.75,margin:'0 0 18px'}}>
            Alongside his work in comedy, storytelling, and music, Nico built Musical Caterpillar to give students a fun way to practice note reading, ear training, and other music theory skills through games they actually want to keep playing. The goal is simple: make music learning feel joyful, memorable, and useful for both teachers and students.
          </p>
          <p style={{fontSize:17,color:'#cbd5e1',lineHeight:1.75,margin:0}}>
            The site is designed for classrooms, home practice, and young musicians who learn best when curiosity and repetition work together. Every game is meant to make core music skills feel less intimidating and more inviting.
          </p>

          <div style={{
            marginTop:20,padding:'14px 16px',borderRadius:16,
            background:'rgba(15,23,42,.24)',border:'1px solid rgba(255,255,255,.08)',
          }}>
            <p style={{fontSize:14,color:'#cbd5e1',lineHeight:1.65,margin:0}}>
              Piano samples used in Chord Snowman are based on{' '}
              <a
                href="https://archive.org/details/SalamanderGrandPianoV3"
                target="_blank"
                rel="noreferrer"
                style={{color:'#93c5fd'}}
              >
                Salamander Grand Piano
              </a>{' '}
              by Alexander Holm and are licensed under{' '}
              <a
                href="https://creativecommons.org/licenses/by/3.0/"
                target="_blank"
                rel="noreferrer"
                style={{color:'#93c5fd'}}
              >
                CC BY 3.0
              </a>.
            </p>
          </div>

          <div style={{display:'flex',justifyContent:'center',gap:12,flexWrap:'wrap',marginTop:24}}>
            <Link
              to="/"
              style={{
                display:'inline-flex',alignItems:'center',justifyContent:'center',
                textDecoration:'none',padding:'12px 20px',borderRadius:14,
                background:'linear-gradient(135deg,#4ade80,#22d3ee)',color:'#082f49',
                fontWeight:800,fontSize:15,boxShadow:'0 10px 24px rgba(15,23,42,.18)',
              }}
            >
              Back to Home
            </Link>
            <a
              href="mailto:support@musicalcaterpillar.com"
              style={{
                display:'inline-flex',alignItems:'center',justifyContent:'center',
                textDecoration:'none',padding:'12px 20px',borderRadius:14,
                background:'linear-gradient(135deg,rgba(255,255,255,.14),rgba(255,255,255,.06))',
                border:'1px solid rgba(255,255,255,.14)',color:'#f8fafc',
                fontWeight:700,fontSize:15,
              }}
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
