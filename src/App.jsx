import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './components/Home'
import Login from './components/Login'
import Register from './components/Register'
import About from './components/About'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/about" element={<About />} />
        {/* Ajoutez d'autres routes ici si nécessaire */}
        <Route path="/feed" element={<div>Page Feed</div>} />
      </Routes>
    </Router>
  )
}

export default App