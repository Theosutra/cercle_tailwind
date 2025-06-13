import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Home from './components/Home'
import Login from './components/Login'
import Register from './components/Register'
import About from './components/About'
import Dashboard from './components/Dashboard'
import Profile from './components/Profile'
import Feed from './components/Feed'
import Messages from './components/Messages'
import Friends from './components/Friends' // Import du nouveau composant Friends
import Parametres from './components/Parametres' // Import du nouveau composant Paramètres
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
          
          {/* Page Feed principale */}
          <Route 
            path="/feed" 
            element={
              <ProtectedRoute>
                <Feed />
              </ProtectedRoute>
            } 
          />
          
          {/* Page Messages */}
          <Route 
            path="/messages" 
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            } 
          />
          
          {/* Page Amis avec le nouveau composant */}
          <Route 
            path="/friends" 
            element={
              <ProtectedRoute>
                <Friends />
              </ProtectedRoute>
            } 
          />
          
          {/* Page Paramètres */}
          <Route 
            path="/parametres" 
            element={
              <ProtectedRoute>
                <Parametres />
              </ProtectedRoute>
            } 
          />
          
          {/* Autres routes protégées */}
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-gray-50 flex">
                  <div className="w-72 bg-white h-screen fixed left-0 top-0 flex flex-col shadow-sm">
                    <div className="p-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 border-2 border-black rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-black rounded-full"></div>
                        </div>
                        <span className="text-2xl font-bold text-black">CERCLE</span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-72 flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-gray-400 text-6xl mb-4">⚙️</div>
                      <h1 className="text-2xl font-bold text-gray-900 mb-4">Paramètres</h1>
                      <p className="text-gray-600">Page des paramètres en cours de développement</p>
                    </div>
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