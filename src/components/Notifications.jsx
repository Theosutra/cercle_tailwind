// src/components/Notifications.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // États principaux
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, likes, mentions, follows
  const [unreadCount, setUnreadCount] = useState(0);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const API_BASE = 'http://localhost:3000/api/v1';

  // Fonction pour obtenir les initiales d'un utilisateur
  const getInitials = (user) => {
    if (user?.prenom && user?.nom) {
      return `${user.prenom[0]}${user.nom[0]}`.toUpperCase();
    }
    return user?.username?.[0]?.toUpperCase() || 'U';
  };

  // Gestion centralisée des requêtes API
  const makeAuthenticatedRequest = useCallback(async (url, options = {}) => {
    const token = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!token) {
      navigate('/login');
      return null;
    }

    try {
      let response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      // Si le token est expiré, essayer de le rafraîchir
      if (response.status === 401 || response.status === 403) {
        if (refreshToken) {
          const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
          });

          if (refreshResponse.ok) {
            const data = await refreshResponse.json();
            localStorage.setItem('accessToken', data.accessToken);
            
            // Refaire la requête avec le nouveau token
            response = await fetch(url, {
              ...options,
              headers: {
                'Authorization': `Bearer ${data.accessToken}`,
                'Content-Type': 'application/json',
                ...options.headers
              }
            });
          } else {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            navigate('/login');
            return null;
          }
        } else {
          navigate('/login');
          return null;
        }
      }

      return response;
    } catch (error) {
      console.error('Erreur de requête:', error);
      throw error;
    }
  }, [navigate]);

  // Fonction pour récupérer les notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await makeAuthenticatedRequest(`${API_BASE}/notifications`);
      
      if (response && response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } else {
        setError('Impossible de charger les notifications');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }, [makeAuthenticatedRequest]);

  // Charger les notifications au montage
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  // Rafraîchir les notifications
  const refreshNotifications = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  // Marquer une notification comme lue
  const markAsRead = async (notificationId, type) => {
    try {
      let endpoint = '';
      
      switch (type) {
        case 'like':
          endpoint = `/likes/notifications/${notificationId}/read`;
          break;
        case 'mention':
          endpoint = `/notifications/mentions/${notificationId}/read`;
          break;
        case 'follow':
          endpoint = `/follow/notifications/${notificationId}/read`;
          break;
        default:
          return;
      }

      const response = await makeAuthenticatedRequest(`${API_BASE}${endpoint}`, {
        method: 'PUT'
      });

      if (response && response.ok) {
        // Marquer comme lu dans l'état local
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId 
              ? { ...n, is_read: true }
              : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
    }
  };

  // Marquer toutes les notifications comme lues
  const markAllAsRead = async () => {
    try {
      const response = await makeAuthenticatedRequest(`${API_BASE}/notifications/mark-all-read`, {
        method: 'PUT'
      });

      if (response && response.ok) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, is_read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Erreur lors du marquage global:', error);
    }
  };

  // Naviguer vers un post ou profil selon le type de notification
  const handleNotificationClick = (notification) => {
    // Marquer comme lu en premier
    if (!notification.is_read) {
      markAsRead(notification.id, notification.type);
    }
    
    // Navigation intelligente selon le type de notification
    switch (notification.type) {
      case 'like':
      case 'mention':
        // Pour les likes et mentions, aller vers le post concerné
        if (notification.related_post) {
          navigate(`/posts/${notification.related_post.id_post}`);
        } else {
          // Fallback vers le profil de l'utilisateur
          navigate(`/profile/${notification.from_user.id_user}`);
        }
        break;
        
      case 'follow':
        // Pour les follows, aller vers le profil de celui qui nous suit
        navigate(`/profile/${notification.from_user.id_user}`);
        break;
        
      case 'message':
        // Pour les messages, aller vers la conversation
        navigate(`/messages/${notification.from_user.id_user}`);
        break;
        
      default:
        // Fallback général vers le profil
        if (notification.from_user) {
          navigate(`/profile/${notification.from_user.id_user}`);
        }
        break;
    }
  };

  // Filtrer les notifications
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'likes') return notification.type === 'like';
    if (filter === 'mentions') return notification.type === 'mention';
    if (filter === 'follows') return notification.type === 'follow';
    if (filter === 'messages') return notification.type === 'message';
    return true;
  });

  // Composant pour une notification individuelle
  const NotificationItem = ({ notification }) => {
    const getNotificationIcon = (type) => {
      switch (type) {
        case 'like':
          return (
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
          );
        case 'mention':
          return (
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
              </svg>
            </div>
          );
        case 'follow':
          return (
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
          );
        case 'message':
          return (
            <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
            </div>
          );
        default:
          return null;
      }
    };

    const formatTime = (dateString) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      const diffInHours = Math.floor(diffInMinutes / 60);
      const diffInDays = Math.floor(diffInHours / 24);
      
      if (diffInMinutes < 1) return 'À l\'instant';
      if (diffInMinutes < 60) return `${diffInMinutes}min`;
      if (diffInHours < 24) return `${diffInHours}h`;
      if (diffInDays < 7) return `${diffInDays}j`;
      return new Date(dateString).toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'short' 
      });
    };

    const getNotificationMessage = (notification) => {
      const username = notification.from_user.username;
      switch (notification.type) {
        case 'like':
          return `${username} a aimé votre publication`;
        case 'mention':
          return `${username} vous a mentionné dans une publication`;
        case 'follow':
          return `${username} a commencé à vous suivre`;
        case 'message':
          return `${username} vous a envoyé un message`;
        default:
          return notification.content;
      }
    };

    const getUserInitials = (user) => {
      if (user.prenom && user.nom) {
        return `${user.prenom[0]}${user.nom[0]}`.toUpperCase();
      }
      return user.username?.[0]?.toUpperCase() || '?';
    };

    return (
      <div
        onClick={() => handleNotificationClick(notification)}
        className={`flex items-center space-x-3 p-4 cursor-pointer transition-all duration-200 hover:bg-gray-50 border-l-4 ${
          !notification.is_read 
            ? 'bg-blue-50 border-blue-500' 
            : 'bg-white border-transparent hover:border-gray-200'
        }`}
      >
        {/* Photo de profil de l'utilisateur avec icône de type de notification */}
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center ring-2 ring-white">
            {notification.from_user.photo_profil ? (
              <img 
                src={notification.from_user.photo_profil} 
                alt={notification.from_user.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white font-bold text-lg">
                {getUserInitials(notification.from_user)}
              </span>
            )}
          </div>
          
          {/* Icône du type de notification en bas à droite */}
          <div className="absolute -bottom-1 -right-1">
            {getNotificationIcon(notification.type)}
          </div>
        </div>

        {/* Contenu de la notification */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {/* Message principal */}
              <p className="text-gray-900 text-sm font-medium leading-tight">
                <span className="font-bold text-black">{notification.from_user.username}</span>
                <span className="font-normal text-gray-700 ml-1">
                  {notification.type === 'like' && 'a aimé votre publication'}
                  {notification.type === 'mention' && 'vous a mentionné'}
                  {notification.type === 'follow' && 'a commencé à vous suivre'}
                  {notification.type === 'message' && 'vous a envoyé un message'}
                </span>
              </p>
              
              {/* Aperçu du contenu si applicable */}
              {notification.related_post && (
                <p className="text-gray-500 text-xs mt-1 line-clamp-1">
                  "{notification.related_post.content}"
                </p>
              )}
              
              {/* Si c'est un message, on peut montrer un aperçu */}
              {notification.type === 'message' && notification.message_preview && (
                <p className="text-gray-500 text-xs mt-1 line-clamp-1 italic">
                  "{notification.message_preview}"
                </p>
              )}
            </div>
            
            {/* Temps et indicateur non lu */}
            <div className="flex flex-col items-end ml-3">
              <span className="text-xs text-gray-400 font-medium">
                {formatTime(notification.created_at)}
              </span>
              {!notification.is_read && (
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 animate-pulse"></div>
              )}
            </div>
          </div>

          {/* Actions rapides pour certains types de notifications */}
          {notification.type === 'follow' && (
            <div className="mt-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  // Logique pour suivre en retour
                  console.log('Follow back:', notification.from_user.username);
                }}
                className="text-xs bg-black text-white px-3 py-1 rounded-full hover:bg-gray-800 transition-colors"
              >
                Suivre
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header mobile */}
      <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowMobileMenu(true)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <h1 className="text-lg font-semibold text-gray-900">Notifications</h1>
          
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            {user?.photo_profil ? (
              <img src={user.photo_profil} alt="Your profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold text-sm">{getInitials(user)}</span>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div 
            className="fixed inset-0 bg-black bg-opacity-10"
            onClick={() => setShowMobileMenu(false)}
          ></div>
          <div className="fixed top-0 left-0 h-full w-80 bg-white shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
              <button 
                onClick={() => setShowMobileMenu(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <LeftSidebar />
            </div>
          </div>
        </div>
      )}

      <div className="flex max-w-7xl mx-auto">
        {/* Left Sidebar - Hidden on mobile */}
        <div className="hidden lg:block lg:fixed lg:left-0 lg:w-72 lg:h-screen lg:overflow-y-auto">
          <LeftSidebar />
        </div>
        
        {/* Main Content */}
        <main className="flex-1 lg:ml-72 xl:mr-80 pt-16 lg:pt-0">
          <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 lg:py-6">

            {/* Header Desktop */}
            <div className="hidden lg:block mb-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
                      <svg className="w-8 h-8 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                      </svg>
                      <span>Notifications</span>
                      {unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-sm px-2 py-1 rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </h1>
                    <p className="text-gray-600 mt-1">Restez au courant de toute l'activité</p>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={refreshNotifications}
                      disabled={refreshing}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                      <svg className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                    
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                      >
                        Tout marquer comme lu
                      </button>
                    )}
                  </div>
                </div>

                {/* Filtres */}
                <div className="flex space-x-2 mt-6">
                  {[
                    { key: 'all', label: 'Toutes', count: notifications.length },
                    { key: 'likes', label: 'J\'aime', count: notifications.filter(n => n.type === 'like').length },
                    { key: 'mentions', label: 'Mentions', count: notifications.filter(n => n.type === 'mention').length },
                    { key: 'follows', label: 'Abonnés', count: notifications.filter(n => n.type === 'follow').length },
                    { key: 'messages', label: 'Messages', count: notifications.filter(n => n.type === 'message').length }
                  ].map(filterOption => (
                    <button
                      key={filterOption.key}
                      onClick={() => setFilter(filterOption.key)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        filter === filterOption.key
                          ? 'bg-black text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {filterOption.label}
                      {filterOption.count > 0 && (
                        <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
                          filter === filterOption.key
                            ? 'bg-white text-black'
                            : 'bg-gray-300 text-gray-700'
                        }`}>
                          {filterOption.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Filtres Mobile */}
            <div className="lg:hidden mb-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex space-x-2 overflow-x-auto">
                  {[
                    { key: 'all', label: 'Toutes' },
                    { key: 'likes', label: 'J\'aime' },
                    { key: 'mentions', label: 'Mentions' },
                    { key: 'follows', label: 'Abonnés' },
                    { key: 'messages', label: 'Messages' }
                  ].map(filterOption => (
                    <button
                      key={filterOption.key}
                      onClick={() => setFilter(filterOption.key)}
                      className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
                        filter === filterOption.key
                          ? 'bg-black text-white shadow-md'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {filterOption.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Liste des notifications */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600">Chargement des notifications...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h3>
                  <p className="text-gray-600 mb-4">{error}</p>
                  <button
                    onClick={fetchNotifications}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Réessayer
                  </button>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {filter === 'all' ? 'Aucune notification' : `Aucune notification de type "${filter}"`}
                  </h3>
                  <p className="text-gray-600 max-w-sm">
                    {filter === 'all' 
                      ? 'Vous êtes à jour ! Vous recevrez vos notifications ici quand quelque chose se passera.'
                      : 'Aucune notification de ce type pour le moment.'
                    }
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredNotifications.map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))}
                </div>
              )}
            </div>

          </div>
        </main>

        {/* Right Sidebar - Hidden on mobile */}
        <div className="hidden xl:block xl:fixed xl:right-0 xl:w-80 xl:h-screen xl:overflow-y-auto">
          <RightSidebar />
        </div>
      </div>
    </div>
  );
};

export default Notifications;