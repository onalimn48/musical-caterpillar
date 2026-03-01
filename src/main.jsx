import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './storage-polyfill.js';
import LandingPage from './LandingPage.jsx';

// Lazy-load games so the landing page loads instantly
const NoteSpeller = lazy(() => import('./games/NoteSpeller.jsx'));
const NotesPerMinute = lazy(() => import('./games/NotesPerMinute.jsx'));
const ChordSnowman = lazy(() => import('./games/ChordSnowman.jsx'));

import HomeButton from './HomeButton.jsx';

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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename="/musical-caterpillar">
      <Routes>
        <Route path="/" element={<LandingPage/>}/>
        <Route path="/note-speller" element={<GameWrapper><NoteSpeller/></GameWrapper>}/>
        <Route path="/notes-per-minute" element={<GameWrapper><NotesPerMinute/></GameWrapper>}/>
        <Route path="/chord-snowman" element={<GameWrapper><ChordSnowman/></GameWrapper>}/>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
