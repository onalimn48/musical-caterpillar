import { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from '../pages/HomePage.jsx';
import HomeButton from '../shell/HomeButton.jsx';
import { gameRegistry } from './gameRegistry.js';
import AboutPage from '../../AboutPage.jsx';
import WhyMusicalCaterpillar from '../../pages/WhyMusicalCaterpillar.jsx';
import Seo from '../seo/Seo.jsx';
import { STATIC_CONTENT_PATHS } from '../seo/siteMetadata.js';

function StaticPageRedirect({ path }) {
  if (typeof window !== 'undefined') {
    window.location.replace(`${path}/`);
  }

  return (
    <div style={{
      minHeight:'100vh',
      display:'flex',
      alignItems:'center',
      justifyContent:'center',
      background:'linear-gradient(180deg,#0c1445,#162055)',
      fontFamily:"'Fredoka',sans-serif",
      color:'#cbd5e1',
      padding:'24px',
      textAlign:'center',
    }}>
      <a href={`${path}/`} style={{ color:'#c7d2fe' }}>
        Continue to page
      </a>
    </div>
  );
}

function Loading() {
  return (
    <div style={{
      minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
      background:'linear-gradient(180deg,#0c1445,#162055)',fontFamily:"'Fredoka',sans-serif",
    }}>
      <div style={{fontSize:64,animation:'bounce 1s ease-in-out infinite'}}>🐛</div>
      <div style={{color:'#94a3b8',fontSize:18,marginTop:12}}>Loading...</div>
      <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}`}</style>
    </div>
  );
}

function GameWrapper({ children, path }) {
  return (
    <Suspense fallback={<Loading/>}>
      <Seo path={path}/>
      <HomeButton/>
      {children}
    </Suspense>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage/>}/>
      <Route path="/about" element={<AboutPage/>}/>
      <Route path="/why-musical-caterpillar" element={<WhyMusicalCaterpillar/>}/>
      {STATIC_CONTENT_PATHS.map((path) => (
        <Route
          key={path}
          path={path}
          element={<StaticPageRedirect path={path}/>}
        />
      ))}
      {gameRegistry.map((game) => {
        const GameComponent = game.component;
        return (
          <Route
            key={game.path}
            path={game.path}
            element={
              <GameWrapper
                path={game.path}
              >
                <GameComponent/>
              </GameWrapper>
            }
          />
        );
      })}
    </Routes>
  );
}
