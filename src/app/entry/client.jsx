import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '../../core/storage/storagePolyfill.js';
import './client.css';
import AppRoutes from '../router/routes.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppRoutes/>
    </BrowserRouter>
  </React.StrictMode>
);
