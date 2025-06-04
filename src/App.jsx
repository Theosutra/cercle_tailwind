import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './components/Home' // Ajustez le chemin selon votre structure

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* Ajoutez d'autres routes ici si nécessaire */}
        <Route path="/feed" element={<div>Page Feed</div>} />
        <Route path="/about" element={<div>Page About</div>} />
        <Route path="/login" element={<div>Page Login</div>} />
        <Route path="/register" element={<div>Page Register</div>} />
      </Routes>
    </Router>
  )
}

export default App