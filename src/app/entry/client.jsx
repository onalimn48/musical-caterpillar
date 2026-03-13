import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '../../core/storage/storagePolyfill.js';
import './client.css';
import AppRoutes from '../router/routes.jsx';
import { TeacherAuthProvider } from '../../teacher/TeacherAuthContext.jsx';

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TeacherAuthProvider>
      <BrowserRouter>
        <AppRoutes/>
      </BrowserRouter>
    </TeacherAuthProvider>
  </React.StrictMode>
);
