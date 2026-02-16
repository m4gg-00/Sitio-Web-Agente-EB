
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Forzar la ruta inicial a la Home pública (#/) si se carga el sitio sin hash o solo con #
// Esto previene redirecciones accidentales al panel de administración en algunos entornos.
if (!window.location.hash || window.location.hash === '#') {
  window.location.hash = '#/';
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
