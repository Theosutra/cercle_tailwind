// src/components/Sidebar.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { icon: '🏠', label: 'Feed', active: true, path: '/feed' },
    { icon: '✉️', label: 'Messages', active: false, path: '/messages' },
    { icon: '👤', label: 'Profil', active: false, path: '/profile' },
    { icon: '👥', label: 'Amis', active: false, path: '/friends' },
    { icon: '⚙️', label: 'Parametres', active: false, path: '/settings' }
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
    <div className="w-72 bg-white h-screen fixed left-0 top-0 border-r border-gray-200 flex flex-col">
      {/* Logo Cercle */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 border-2 border-black rounded-full flex items-center justify-center">
            <div className="w-2.5 h-2.5 bg-black rounded-full"></div>
          </div>
          <span className="text-xl font-bold text-black tracking-tight">CERCLE</span>
        </div>
      </div>

      {/* Profil utilisateur */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
            {user?.photo_profil ? (
              <img 
                src={user.photo_profil} 
                alt="Profile" 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-white font-semibold text-lg">
                {user?.prenom?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {user?.prenom && user?.nom ? `${user.prenom} ${user.nom}` : user?.username}
            </p>
            <p className="text-xs text-gray-500 truncate">
              @{user?.username}
            </p>
            {user?.certified && (
              <div className="flex items-center mt-1">
                <span className="text-xs text-blue-600">✓ Certifié</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Menu Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item, index) => (
            <li key={index}>
              <button
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                  item.active 
                    ? 'bg-black text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bouton déconnexion */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
        >
          <span className="text-lg">🚪</span>
          <span className="font-medium">Déconnexion</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;