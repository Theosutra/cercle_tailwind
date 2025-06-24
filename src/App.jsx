// frontend/src/App.jsx - VERSION CORRIGÉE
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LoaderProvider } from './context/LoaderContext';

// Import des composants
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import Feed from './components/Feed';
import Profile from './components/Profile';
import ProfileUser from './components/ProfileUser';
import Messages from './components/Messages';
import Notifications from './components/Notifications';
import Friends from './components/Friends';
import Parametres from './components/Parametres';
import About from './components/About';

// Import des composants admin
import AdminDashboard from './components/admin/AdminDashboard';
import AdminUsers from './components/admin/AdminUsers';
import AdminPosts from './components/admin/AdminPosts';
import AdminReports from './components/admin/AdminReports';

// Composant pour les routes protégées
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('accessToken');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Composant pour les routes admin
const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('accessToken');
  const userStr = localStorage.getItem('user');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  try {
    const user = JSON.parse(userStr);
    if (user?.role?.role !== 'ADMIN' && user?.role?.role !== 'MODERATOR') {
      return <Navigate to="/feed" replace />;
    }
  } catch (error) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// ✅ CORRECTION: Composant pour rediriger intelligemment selon l'état
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('accessToken');
  
  // ✅ CORRECTION: Si pas de token, montrer la page publique SANS redirection
  if (!token) {
    return children;
  }
  
  // ✅ CORRECTION: Si token existe, rediriger directement vers le feed
  // Pas de vérification complexe qui cause des bugs
  return <Navigate to="/feed" replace />;
};

// ✅ CORRECTION: Composant 404 simplifié
const NotFoundPage = () => (
  <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-md text-center">
      <div className="mx-auto h-12 w-12 text-red-500 mb-4">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
        404
      </h1>
      <p className="mt-2 text-base text-gray-500">
        Désolé, nous n'avons pas pu trouver la page que vous cherchez.
      </p>
      <div className="mt-6 space-y-2">
        <button
          onClick={() => window.history.back()}
          className="block w-full text-base font-medium text-indigo-600 hover:text-indigo-500"
        >
          ← Retour
        </button>
        <button
          onClick={() => window.location.href = '/feed'}
          className="block w-full text-base font-medium text-indigo-600 hover:text-indigo-500"
        >
          Aller au feed
        </button>
      </div>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <LoaderProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* ===== ROUTES PUBLIQUES ===== */}
              
              {/* Page d'accueil - redirige intelligemment */}
              <Route 
                path="/" 
                element={
                  <PublicRoute>
                    <Home />
                  </PublicRoute>
                } 
              />
              
              {/* Authentification */}
              <Route 
                path="/login" 
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                } 
              />
              
              <Route 
                path="/register" 
                element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                } 
              />
              
              {/* Page À propos - accessible à tous */}
              <Route path="/about" element={<About />} />

              {/* ===== ROUTES PROTÉGÉES (UTILISATEURS CONNECTÉS) ===== */}
              
              {/* Feed principal */}
              <Route 
                path="/feed" 
                element={
                  <ProtectedRoute>
                    <Feed />
                  </ProtectedRoute>
                } 
              />
              
              {/* Profil de l'utilisateur connecté */}
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
              
              {/* Messages privés */}
              <Route 
                path="/messages" 
                element={
                  <ProtectedRoute>
                    <Messages />
                  </ProtectedRoute>
                } 
              />
              
              {/* Conversation spécifique */}
              <Route 
                path="/messages/:userId" 
                element={
                  <ProtectedRoute>
                    <Messages />
                  </ProtectedRoute>
                } 
              />
              
              {/* Page notifications */}
              <Route 
                path="/notifications" 
                element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                } 
              />
              
              {/* Gestion des amis/abonnements */}
              <Route 
                path="/friends" 
                element={
                  <ProtectedRoute>
                    <Friends />
                  </ProtectedRoute>
                } 
              />
              
              {/* Paramètres utilisateur */}
              <Route 
                path="/parametres" 
                element={
                  <ProtectedRoute>
                    <Parametres />
                  </ProtectedRoute>
                } 
              />

              {/* ===== ROUTES ADMIN/MODÉRATEUR ===== */}
              
              <Route 
                path="/admin" 
                element={
                  <AdminRoute>
                    <Navigate to="/admin/dashboard" replace />
                  </AdminRoute>
                } 
              />
              
              <Route 
                path="/admin/dashboard" 
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } 
              />
              
              <Route 
                path="/admin/users" 
                element={
                  <AdminRoute>
                    <AdminUsers />
                  </AdminRoute>
                } 
              />
              
              <Route 
                path="/admin/posts" 
                element={
                  <AdminRoute>
                    <AdminPosts />
                  </AdminRoute>
                } 
              />
              
              <Route 
                path="/admin/reports" 
                element={
                  <AdminRoute>
                    <AdminReports />
                  </AdminRoute>
                } 
              />

              {/* ===== ROUTES SPÉCIALES ===== */}
              
              {/* Visualisation d'un post spécifique */}
              <Route 
                path="/posts/:postId" 
                element={
                  <ProtectedRoute>
                    <Feed />
                  </ProtectedRoute>
                } 
              />
              
              {/* Recherche */}
              <Route 
                path="/search" 
                element={
                  <ProtectedRoute>
                    <Feed />
                  </ProtectedRoute>
                } 
              />

              {/* ===== GESTION DES ERREURS ===== */}
              
              {/* 404 - Page non trouvée */}
              <Route path="/404" element={<NotFoundPage />} />
              
              {/* ✅ CORRECTION: Catch-all route pour les URLs inconnues */}
              <Route path="*" element={<NotFoundPage />} />
              
            </Routes>
          </div>
        </Router>
      </LoaderProvider>
    </AuthProvider>
  );
}

export default App;