// src/components/admin/AdminSidebar.jsx - AVEC LoaderProvider corrigé
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLoader } from '../../context/LoaderContext';

const AdminSidebar = ({ stats = {} }) => {
  const { user, logout } = useAuth();
  const { navigateWithLoader, hideLoader } = useLoader(); // ✅ AJOUT hideLoader
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { 
      id: 'overview', 
      label: 'Vue d\'ensemble', 
      icon: '📊', 
      path: '/admin/dashboard',
      badge: null
    },
    { 
      id: 'users', 
      label: 'Utilisateurs', 
      icon: '👥', 
      path: '/admin/users',
      badge: stats.activeUsers ? `${stats.activeUsers}` : null
    },
    { 
      id: 'posts', 
      label: 'Posts', 
      icon: '📝', 
      path: '/admin/posts',
      badge: stats.activePosts ? `${stats.activePosts}` : null
    },
    { 
      id: 'reports', 
      label: 'Signalements', 
      icon: '🚨', 
      path: '/admin/reports',
      badge: stats.pendingReports ? `${stats.pendingReports}` : null,
      urgent: stats.pendingReports > 0
    }
  ];

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'ADMIN': return 'bg-gradient-to-r from-red-500 to-red-600 text-white';
      case 'MODERATOR': return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
      default: return 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800';
    }
  };

  // ✅ AJOUT : Navigation avec loader et messages contextuels
  const handleNavigation = async (path, label) => {
    // Éviter la navigation si on est déjà sur la page
    if (location.pathname === path) return;

    const loadingMessages = {
      '/admin/dashboard': 'Chargement du dashboard...',
      '/admin/users': 'Chargement des utilisateurs...',
      '/admin/posts': 'Chargement des posts...',
      '/admin/reports': 'Chargement des signalements...'
    };

    await navigateWithLoader(
      () => navigate(path),
      500, // Temps minimum de chargement
      loadingMessages[path] || `Chargement de ${label}...`
    );
  };

  // ✅ CORRECTION : Déconnexion avec reset du loader
  const handleLogout = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      try {
        // ✅ IMPORTANT : Forcer la remise à zéro du loader AVANT la déconnexion
        hideLoader();
        
        await logout();
        navigate('/', { replace: true });
      } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
        // ✅ S'assurer que le loader est caché même en cas d'erreur
        hideLoader();
      }
    }
  };

  // ✅ CORRECTION : Retour au site avec reset du loader
  const handleBackToSite = async () => {
    // ✅ IMPORTANT : Reset du loader avant de quitter l'admin
    hideLoader();
    navigate('/feed');
  };

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0">
      {/* Header avec profil admin */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center space-x-4 p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100 transition-all duration-300 hover:shadow-lg group">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
            {user?.prenom?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 transition-colors duration-300 group-hover:text-black">
              {user?.prenom} {user?.nom}
            </h3>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeClass(user?.role?.role)}`}>
                {user?.role?.role || 'ADMIN'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Logo Cercle */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-center space-x-3 p-4 rounded-2xl cursor-pointer transition-all duration-300 hover:bg-gray-50 hover:scale-105 group">
          <div className="w-8 h-8 border-2 border-black rounded-full flex items-center justify-center transition-all duration-300 group-hover:border-gray-600 group-hover:shadow-lg group-hover:rotate-12">
            <div className="w-2 h-2 bg-black rounded-full transition-all duration-300 group-hover:bg-gray-600 group-hover:scale-125"></div>
          </div>
          <span className="text-2xl font-bold text-black tracking-wide transition-all duration-300 group-hover:text-gray-700 group-hover:tracking-wider">
            CERCLE
          </span>
          <span className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">
            ADMIN
          </span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-6 py-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => handleNavigation(item.path, item.label)} // ✅ MODIFIÉ
                className={`w-full flex items-center justify-between space-x-4 px-6 py-4 rounded-2xl text-left transition-all duration-300 group relative overflow-hidden ${
                  isActivePath(item.path)
                    ? 'bg-black text-white shadow-lg' 
                    : 'text-gray-700 hover:bg-gray-100 hover:shadow-md hover:scale-105'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`absolute left-0 top-0 h-full w-1 bg-black transform transition-all duration-300 ${
                    isActivePath(item.path) ? 'scale-y-100' : 'scale-y-0 group-hover:scale-y-75'
                  } rounded-r-full`}></div>

                  <div className={`text-xl flex-shrink-0 relative z-10 transition-all duration-300 ${
                    !isActivePath(item.path) ? 'group-hover:scale-110' : ''
                  }`}>
                    {item.icon}
                  </div>
                  
                  <span className={`font-medium text-lg relative z-10 transition-all duration-300 ${
                    !isActivePath(item.path) ? 'group-hover:font-semibold' : ''
                  }`}>
                    {item.label}
                  </span>
                </div>

                {item.badge && (
                  <span className={`px-3 py-1 text-xs font-bold rounded-full flex-shrink-0 relative z-10 transition-all duration-300 ${
                    item.urgent && !isActivePath(item.path) 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : isActivePath(item.path)
                        ? 'bg-white text-black'
                        : 'bg-gray-200 text-gray-700 group-hover:bg-black group-hover:text-white'
                  }`}>
                    {item.badge}
                  </span>
                )}

                <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 ${
                  !isActivePath(item.path) ? 'group-hover:opacity-20' : ''
                } transform -skew-x-12 transition-all duration-700 group-hover:translate-x-full`}></div>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Actions rapides */}
      <div className="px-6 py-4 border-t border-gray-100">
        <div className="space-y-2">
          <button
            onClick={handleBackToSite} // ✅ MODIFIÉ
            className="w-full flex items-center justify-center space-x-3 px-6 py-3 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-300 group text-sm"
          >
            <svg className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">Retour au site</span>
          </button>
        </div>
      </div>

      {/* Bouton Déconnexion */}
      <div className="p-6 border-t border-gray-100">
        <button
          onClick={handleLogout} // ✅ MODIFIÉ
          className="w-full flex items-center justify-center space-x-3 px-6 py-4 rounded-2xl text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-300 group border border-red-200 hover:border-red-300"
        >
          <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="font-medium">Déconnexion</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;