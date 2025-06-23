import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ✅ CORRECTION: Éviter le flash dark au démarrage
document.documentElement.classList.remove('dark');

// Appliquer le thème sauvegardé
try {
  const savedTheme = localStorage.getItem('darkMode');
  if (savedTheme && JSON.parse(savedTheme) === true) {
    document.documentElement.classList.add('dark');
    console.log('🌙 Mode dark restauré depuis localStorage');
  } else {
    console.log('☀️ Mode light par défaut');
  }
} catch (error) {
  console.log('☀️ Mode light par défaut (erreur localStorage)');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)