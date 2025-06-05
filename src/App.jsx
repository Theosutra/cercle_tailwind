import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Home from './components/Home'
import Login from './components/Login'
import Register from './components/Register'
import About from './components/About'
import Dashboard from './components/Dashboard'
import Profile from './components/Profile'
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
          
          {/* Dashboard - Page d'accueil après connexion */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Profil utilisateur */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
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
          
          {/* Autres routes protégées */}
          <Route 
            path="/messages" 
            element={
              <ProtectedRoute>
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Messages</h1>
                    <p className="text-gray-600">Page des messages en cours de développement</p>
                  </div>
                </div>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/friends" 
            element={
              <ProtectedRoute>
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Amis</h1>
                    <p className="text-gray-600">Page des amis en cours de développement</p>
                  </div>
                </div>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Paramètres</h1>
                    <p className="text-gray-600">Page des paramètres en cours de développement</p>
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