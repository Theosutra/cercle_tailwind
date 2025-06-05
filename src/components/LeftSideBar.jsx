// src/components/LeftSidebar.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const LeftSidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { 
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
      ), 
      label: 'Feed', 
      path: '/feed',
      isActive: location.pathname === '/feed'
    },
    { 
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
        </svg>
      ), 
      label: 'Messages', 
      path: '/messages',
      isActive: location.pathname === '/messages'
    },
    { 
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      ), 
      label: 'Profil', 
      path: '/profile',
      isActive: location.pathname === '/profile'
    },
    { 
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM4 18v-4h3v4h2v-7.5c0-.83.67-1.5 1.5-1.5S12 9.67 12 10.5V18h2v-4h3v4h2v-7.5c0-.83.67-1.5 1.5-1.5S22 9.67 22 10.5V18h2v2H2v-2h2z"/>
        </svg>
      ), 
      label: 'Amis', 
      path: '/friends',
      isActive: location.pathname === '/friends'
    },
    { 
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
        </svg>
      ), 
      label: 'Parametres', 
      path: '/settings',
      isActive: location.pathname === '/settings'
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
    }
  };

  return (
    <div className="w-72 bg-white h-screen fixed left-0 top-0 flex flex-col shadow-sm">
      
      {/* Section profil utilisateur */}
      <div className="p-6">
        <div className="flex flex-col items-center text-center space-y-3">
          {/* Photo de profil */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200">
              {user?.photo_profil ? (
                <img 
                  src={user.photo_profil} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">
                    {user?.prenom?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Nom et prénom */}
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {user?.prenom && user?.nom 
                ? `${user.prenom} ${user.nom}` 
                : user?.username || 'Utilisateur'
              }
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              @{user?.username || 'username'}
            </p>
          </div>
        </div>
      </div>

      {/* Menu Navigation */}
      <nav className="flex-1 px-6">
        <ul className="space-y-2 mt-15">
          {menuItems.map((item, index) => (
            <li key={index}>
              <button
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center justify-start space-x-4 px-6 py-4 rounded-2xl text-left transition-all duration-200 group ${
                  item.isActive 
                    ? 'bg-black text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {/* SVG Icons */}
                <div className="w-6 h-6 flex-shrink-0">
                  {item.icon}
                </div>
                <span className="font-medium text-lg">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logo Cercle en bas */}
      <div className="p-20 border-t border-gray-100">
        <div className="flex items-center justify-center space-x-3">
          <div className="w-8 h-8 border-2 border-black rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-black rounded-full"></div>
          </div>
          <span className="text-2xl font-bold text-black tracking-wide">CERCLE</span>
        </div>
      </div>
    </div>
  );
};

export default LeftSidebar;