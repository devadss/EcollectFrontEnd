import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';   // ← This should match your file name

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);