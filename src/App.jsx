import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Home from './components/Home'
import Login from './components/Login'
import Register from './components/Register'
import About from './components/About'
import Dashboard from './components/Dashboard'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/about" element={<About />} />
          
          {/* Page de test après connexion */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Routes protégées */}
          <Route 
            path="/feed" 
            element={
              <ProtectedRoute>
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Page Feed</h1>
                    <p className="text-gray-600">Contenu réservé aux utilisateurs connectés</p>
                  </div>
                </div>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App