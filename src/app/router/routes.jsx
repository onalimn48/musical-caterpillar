import { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from '../pages/HomePage.jsx';
import HomeButton from '../shell/HomeButton.jsx';
import { gameRegistry } from './gameRegistry.js';

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

function GameWrapper({ children }) {
  return (
    <Suspense fallback={<Loading/>}>
      <HomeButton/>
      {children}
    </Suspense>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage/>}/>
      {gameRegistry.map((game) => {
        const GameComponent = game.component;
        return (
          <Route
            key={game.path}
            path={game.path}
            element={<GameWrapper><GameComponent/></GameWrapper>}
          />
        );
      })}
    </Routes>
  );
}
