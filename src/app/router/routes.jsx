import { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from '../pages/HomePage.jsx';
import HomeButton from '../shell/HomeButton.jsx';
import { gameRegistry } from './gameRegistry.js';
import AboutPage from '../../AboutPage.jsx';
import WhyMusicalCaterpillar from '../../pages/WhyMusicalCaterpillar.jsx';
import CaterpillarStudioPage from '../pages/CaterpillarStudioPage.jsx';
import Seo from '../seo/Seo.jsx';
import { STATIC_CONTENT_PATHS } from '../seo/siteMetadata.js';
import TeacherProtectedRoute from '../../teacher/TeacherProtectedRoute.jsx';

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

function TeacherWrapper({ children }) {
  return (
    <Suspense fallback={<Loading/>}>
      {children}
    </Suspense>
  );
}

function StudentWrapper({ children }) {
  return (
    <Suspense fallback={<Loading/>}>
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
      <Route path="/caterpillar-studio" element={<CaterpillarStudioPage/>}/>
      {STATIC_CONTENT_PATHS.map((path) => (
        <Route
          key={path}
          path={path}
          element={<StaticPageRedirect path={path}/>}
        />
      ))}
      {gameRegistry.map((game) => {
        const RouteComponent = game.component;
        let element = <RouteComponent/>;

        if (game.requiresTeacherAuth) {
          element = <TeacherProtectedRoute>{element}</TeacherProtectedRoute>;
        }

        if (game.layout === 'game') {
          element = (
            <GameWrapper path={game.path}>
              {element}
            </GameWrapper>
          );
        }

        if (game.layout === 'teacher') {
          element = <TeacherWrapper>{element}</TeacherWrapper>;
        }

        if (game.layout === 'student') {
          element = <StudentWrapper>{element}</StudentWrapper>;
        }

        return (
          <Route
            key={game.path}
            path={game.path}
            element={element}
          />
        );
      })}
    </Routes>
  );
}
