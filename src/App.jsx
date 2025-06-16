// src/App.jsx - Mise à jour avec ProfileUser
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Home from './components/Home'
import Login from './components/Login'
import Register from './components/Register'
import About from './components/About'
import Profile from './components/Profile'
import ProfileUser from './components/ProfileUser' // ✅ NOUVEAU: Import du composant ProfileUser
import Feed from './components/Feed'
import Messages from './components/Messages'
import Friends from './components/Friends'
import Parametres from './components/Parametres'
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
          
          {/* Page Feed principale - Page d'accueil après connexion */}
          <Route 
            path="/feed" 
            element={
              <ProtectedRoute>
                <Feed />
              </ProtectedRoute>
            } 
          />
          
          {/* ✅ Profil utilisateur personnel (utilisateur connecté uniquement) */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          
          {/* ✅ NOUVEAU: Profil d'un autre utilisateur (composant séparé) */}
          <Route 
            path="/profile/:userId" 
            element={
              <ProtectedRoute>
                <ProfileUser />
              </ProtectedRoute>
            } 
          />
          
          {/* ✅ ALTERNATIVE: Route avec "user" pour être plus explicite */}
          <Route 
            path="/user/:userId" 
            element={
              <ProtectedRoute>
                <ProfileUser />
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
          
          {/* Page Amis */}
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
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App