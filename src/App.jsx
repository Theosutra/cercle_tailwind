// src/App.jsx - Version améliorée avec loader de transition et ThemeProvider
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { LoaderProvider } from './context/LoaderContext'
import { ThemeProvider } from './context/ThemeContext' // ✅ Ajout du ThemeProvider
import PageLoader from './components/PageLoader'

import Home from './components/Home'
import Login from './components/Login'
import Register from './components/Register'
import Onboarding from './components/Onboarding'
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
      <LoaderProvider>
        <ThemeProvider> {/* ✅ Wrapper avec le ThemeProvider */}
          <Router>
            {/* Loader global pour toutes les transitions */}
            <PageLoader />
            
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/about" element={<About />} />
              
              {/* Onboarding pour les nouveaux utilisateurs */}
              <Route 
                path="/onboarding" 
                element={
                  <ProtectedRoute>
                    <Onboarding />
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
              
              {/* Page détail d'un post */}
              <Route 
                path="/post/:postId" 
                element={
                  <ProtectedRoute>
                    <PostDetail />
                  </ProtectedRoute>
                } 
              />
              
              {/* Profil utilisateur personnel */}
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              
              {/* Profil d'un autre utilisateur */}
              <Route 
                path="/profile/:userId" 
                element={
                  <ProtectedRoute>
                    <ProfileUser />
                  </ProtectedRoute>
                } 
              />
              
              {/* Messages */}
              <Route 
                path="/messages" 
                element={
                  <ProtectedRoute>
                    <Messages />
                  </ProtectedRoute>
                } 
              />
              
              {/* Amis */}
              <Route 
                path="/friends" 
                element={
                  <ProtectedRoute>
                    <Friends />
                  </ProtectedRoute>
                } 
              />
              
              {/* Paramètres */}
              <Route 
                path="/parametres" 
                element={
                  <ProtectedRoute>
                    <Parametres />
                  </ProtectedRoute>
                } 
              />
              
              {/* Dashboard Admin */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </Router>
        </ThemeProvider>
      </LoaderProvider>
    </AuthProvider>
  )
}

export default App