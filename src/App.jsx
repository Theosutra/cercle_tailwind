// src/App.jsx - Ajout de la route onboarding selon la structure existante
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Home from './components/Home'
import Login from './components/Login'
import Register from './components/Register'
import Onboarding from './components/Onboarding' // ✅ NOUVEAU: Import du composant Onboarding
import About from './components/About'
import Profile from './components/Profile'
import ProfileUser from './components/ProfileUser'
import PostDetail from './components/PostDetail'
import Feed from './components/Feed'
import Messages from './components/Messages'
import Friends from './components/Friends'
import Parametres from './components/Parametres'
import AdminDashboard from './components/AdminDashboard'
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
          
          {/* ✅ NOUVELLE ROUTE: Onboarding pour les nouveaux utilisateurs */}
          <Route 
            path="/onboarding" 
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            } 
          />
          
          {/* Page Feed principale - Page d'accueil après connexion */}
          <Route 
            path="/feed" 
            element={
              <ProtectedRoute>
                <Feed />
              </ProtectedRoute>
            } 
          />
          
          {/* Page détail d'un post individuel */}
          <Route 
            path="/post/:postId" 
            element={
              <ProtectedRoute>
                <PostDetail />
              </ProtectedRoute>
            } 
          />
          
          {/* Profil utilisateur personnel (utilisateur connecté uniquement) */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          
          {/* Profil d'un autre utilisateur (composant séparé) */}
          <Route 
            path="/profile/:userId" 
            element={
              <ProtectedRoute>
                <ProfileUser />
              </ProtectedRoute>
            } 
          />
          
          {/* ALTERNATIVE: Route avec "user" pour être plus explicite */}
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

          {/* Route Admin Dashboard */}
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App