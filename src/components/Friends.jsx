// src/components/Friends.jsx - Version complète et optimisée
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';

const Friends = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // États principaux
  const [activeTab, setActiveTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // États de l'interface
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(new Set());
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Configuration de l'API
  const API_BASE = 'http://localhost:3000/api/v1';
  
  // Auto-clear des messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Gestion centralisée des requêtes API
  const makeAuthenticatedRequest = useCallback(async (url, options = {}) => {
    const validToken = await checkAndRefreshToken();
    if (!validToken) throw new Error('Authentication failed');

    return fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${validToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
  }, []);

  // Vérification et refresh du token
  const checkAndRefreshToken = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!token || !refreshToken) {
      navigate('/login');
      return null;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 403 || response.status === 401) {
        const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          localStorage.setItem('accessToken', data.accessToken);
          return data.accessToken;
        } else {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          navigate('/login');
          return null;
        }
      }

      return response.ok ? token : null;
    } catch (error) {
      console.error('Token check error:', error);
      return token;
    }
  }, [navigate, API_BASE]);

  // Récupération des amis
  const fetchFriends = useCallback(async () => {
    try {
      const response = await makeAuthenticatedRequest(
        `${API_BASE}/follow/${user.id_user}/following?limit=100`
      );
      
      if (response.ok) {
        const data = await response.json();
        setFriends(data.following || []);
      } else {
        throw new Error(`Erreur ${response.status}`);
      }
    } catch (error) {
      setFriends([]);
      throw error;
    }
  }, [user?.id_user, makeAuthenticatedRequest, API_BASE]);

  // Récupération des demandes en attente
  const fetchPendingRequests = useCallback(async () => {
    try {
      const response = await makeAuthenticatedRequest(
        `${API_BASE}/follow/requests/pending?limit=100`
      );
      
      if (response.ok) {
        const data = await response.json();
        setPendingRequests(data.requests || []);
      } else {
        throw new Error(`Erreur ${response.status}`);
      }
    } catch (error) {
      setPendingRequests([]);
      throw error;
    }
  }, [makeAuthenticatedRequest, API_BASE]);

  // Récupération des suggestions
  const fetchSuggestions = useCallback(async () => {
    try {
      let response = await makeAuthenticatedRequest(
        `${API_BASE}/users/suggested?limit=50`
      );

      // Fallback vers la recherche si suggestions non disponibles
      if (!response.ok && response.status === 404) {
        response = await makeAuthenticatedRequest(
          `${API_BASE}/users/search?limit=50`
        );
      }

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.users || data || []);
      } else {
        throw new Error(`Erreur ${response.status}`);
      }
    } catch (error) {
      setSuggestions([]);
      throw error;
    }
  }, [makeAuthenticatedRequest, API_BASE]);

  // Chargement des données selon l'onglet actif
  const fetchData = useCallback(async () => {
    if (!user?.id_user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const fetchMap = {
        friends: fetchFriends,
        requests: fetchPendingRequests,
        suggestions: fetchSuggestions
      };
      
      await fetchMap[activeTab]?.();
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, [activeTab, user?.id_user, fetchFriends, fetchPendingRequests, fetchSuggestions]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Actions utilisateur optimisées
  const handleFollow = useCallback(async (userId, username) => {
    if (actionLoading.has(userId)) return;
    
    setActionLoading(prev => new Set([...prev, userId]));
    setError(null);
    
    try {
      const response = await makeAuthenticatedRequest(
        `${API_BASE}/follow/${userId}`,
        { method: 'POST' }
      );

      if (response.ok) {
        const data = await response.json();
        setSuggestions(prev => prev.filter(user => user.id_user !== userId));
        
        if (data.isPending) {
          setSuccessMessage(`Demande envoyée à ${username}`);
          fetchPendingRequests();
        } else {
          setSuccessMessage(`Vous suivez maintenant ${username}`);
          fetchFriends();
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur ${response.status}`);
      }
    } catch (error) {
      setError(`Erreur lors du suivi de ${username}: ${error.message}`);
    } finally {
      setActionLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  }, [makeAuthenticatedRequest, fetchPendingRequests, fetchFriends, API_BASE]);

  const handleUnfollow = useCallback(async (userId, username) => {
    if (actionLoading.has(userId) || !window.confirm(`Ne plus suivre ${username} ?`)) return;
    
    setActionLoading(prev => new Set([...prev, userId]));
    setError(null);
    
    try {
      const response = await makeAuthenticatedRequest(
        `${API_BASE}/follow/${userId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        setSuccessMessage(`Vous ne suivez plus ${username}`);
        fetchFriends();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur ${response.status}`);
      }
    } catch (error) {
      setError(`Erreur: ${error.message}`);
    } finally {
      setActionLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  }, [makeAuthenticatedRequest, fetchFriends, API_BASE]);

  const handleAcceptRequest = useCallback(async (userId, username) => {
    if (actionLoading.has(userId)) return;
    
    setActionLoading(prev => new Set([...prev, userId]));
    setError(null);
    
    try {
      const response = await makeAuthenticatedRequest(
        `${API_BASE}/follow/requests/${userId}/accept`,
        { method: 'POST' }
      );

      if (response.ok) {
        setSuccessMessage(`Demande de ${username} acceptée`);
        fetchPendingRequests();
        fetchFriends();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur ${response.status}`);
      }
    } catch (error) {
      setError(`Erreur: ${error.message}`);
    } finally {
      setActionLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  }, [makeAuthenticatedRequest, fetchPendingRequests, fetchFriends, API_BASE]);

  const handleRejectRequest = useCallback(async (userId, username) => {
    if (actionLoading.has(userId)) return;
    
    setActionLoading(prev => new Set([...prev, userId]));
    setError(null);
    
    try {
      const response = await makeAuthenticatedRequest(
        `${API_BASE}/follow/requests/${userId}/reject`,
        { method: 'POST' }
      );

      if (response.ok) {
        setSuccessMessage(`Demande de ${username} rejetée`);
        fetchPendingRequests();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur ${response.status}`);
      }
    } catch (error) {
      setError(`Erreur: ${error.message}`);
    } finally {
      setActionLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  }, [makeAuthenticatedRequest, fetchPendingRequests, API_BASE]);

  // Navigation et recherche
  const handleViewProfile = useCallback((userId) => {
    navigate(`/user/${userId}`);
  }, [navigate]);

  const handleSendMessage = useCallback((userId) => {
    navigate('/messages', { state: { selectedUserId: userId } });
  }, [navigate]);

  const handleSearchUsers = useCallback(async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const searchParams = new URLSearchParams({
        search: searchTerm.trim(),
        limit: 50
      });
      
      const response = await makeAuthenticatedRequest(
        `${API_BASE}/users/search?${searchParams}`
      );

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('Réponse serveur invalide');
      }

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.users || []);
        setActiveTab('suggestions');
        
        const count = (data.users || []).length;
        if (count === 0) {
          setError(`Aucun utilisateur trouvé pour "${searchTerm}"`);
        } else {
          setSuccessMessage(`${count} utilisateur(s) trouvé(s)`);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur ${response.status}`);
      }
    } catch (error) {
      setError(error.message.includes('<!doctype') 
        ? 'Erreur de connexion au serveur' 
        : error.message);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, makeAuthenticatedRequest, API_BASE]);

  // Fonctions utilitaires
  const getInitials = useCallback((user) => {
    if (user?.prenom && user?.nom) {
      return `${user.prenom[0]}${user.nom[0]}`.toUpperCase();
    }
    return user?.username?.[0]?.toUpperCase() || 'U';
  }, []);

  const getDisplayName = useCallback((user) => {
    if (user?.prenom && user?.nom) {
      return `${user.prenom} ${user.nom}`;
    }
    return user?.username || 'Utilisateur';
  }, []);

  const getRandomGradient = useCallback((index) => {
    const gradients = [
      'from-blue-400 to-purple-500',
      'from-pink-400 to-red-500',
      'from-green-400 to-blue-500',
      'from-yellow-400 to-pink-500',
      'from-purple-400 to-pink-500',
      'from-indigo-400 to-purple-500'
    ];
    return gradients[index % gradients.length];
  }, []);

  // Données et configuration
  const getCurrentData = () => {
    switch (activeTab) {
      case 'friends':
        return friends;
      case 'requests':
        return pendingRequests;
      case 'suggestions':
        return suggestions;
      default:
        return [];
    }
  };

  const filteredData = getCurrentData().filter(user => {
    const name = getDisplayName(user).toLowerCase();
    const username = user.username?.toLowerCase() || '';
    return name.includes(searchTerm.toLowerCase()) || username.includes(searchTerm.toLowerCase());
  });

  const tabConfig = [
    { 
      id: 'friends', 
      label: 'Mes Amis', 
      count: friends.length,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      )
    },
    { 
      id: 'requests', 
      label: 'Demandes', 
      count: pendingRequests.length,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      )
    },
    { 
      id: 'suggestions', 
      label: 'Découvrir', 
      count: suggestions.length,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => setShowMobileMenu(true)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900">Amis</h1>
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
            {user?.photo_profil ? (
              <img src={user.photo_profil} alt="Your profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold text-sm">{getInitials(user)}</span>
            )}
          </div>
        </div>
      </div>

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

            {/* Header */}
            <div className="mb-6 lg:mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Mes Amis</h1>
              <p className="text-gray-600">Gérez vos connexions et découvrez de nouveaux amis</p>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Rechercher des utilisateurs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchUsers()}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  />
                  <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <button
                  onClick={handleSearchUsers}
                  disabled={!searchTerm.trim() || loading}
                  className="px-6 py-3 bg-black text-white rounded-xl hover:bg-grey transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Rechercher
                </button>
              </div>
            </div>

            {/* Messages d'état */}
            {error && (
              <div className="mb-4 p-4 bg-red-100 border border-red-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-700">{error}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => {
                        setError(null);
                        fetchData();
                      }}
                      className="text-red-600 hover:text-red-800 text-sm underline"
                    >
                      Réessayer
                    </button>
                    <button 
                      onClick={() => setError(null)}
                      className="text-red-600 hover:text-red-800 text-lg font-bold"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-4 bg-green-100 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-green-700">{successMessage}</p>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="mb-6">
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                {tabConfig.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center space-x-2 px-3 lg:px-4 py-2.5 text-sm lg:text-base font-medium rounded-md transition-all ${
                      activeTab === tab.id
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-500">Chargement...</p>
                </div>
              ) : filteredData.length === 0 ? (
                <div className="text-center py-12 lg:py-16">
                  <div className="text-gray-300 text-5xl lg:text-6xl mb-4">
                    {activeTab === 'friends' ? '👥' : activeTab === 'requests' ? '📬' : '🔍'}
                  </div>
                  <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-2">
                    {activeTab === 'friends' ? 'Aucun ami pour le moment' : 
                     activeTab === 'requests' ? 'Aucune demande en attente' : 
                     'Aucun résultat'}
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto text-sm lg:text-base px-4">
                    {activeTab === 'friends' ? 'Commencez à suivre des personnes pour voir vos amis ici' : 
                     activeTab === 'requests' ? 'Les demandes d\'amitié apparaîtront ici' : 
                     searchTerm ? `Aucun utilisateur trouvé pour "${searchTerm}"` : 'Utilisez la recherche pour découvrir de nouveaux amis'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredData.map((person, index) => (
                    <div key={person.id_user} className="p-4 lg:p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        {/* Avatar */}
                        <div 
                          className={`w-12 h-12 lg:w-16 lg:h-16 rounded-full overflow-hidden bg-gradient-to-br ${getRandomGradient(index)} flex items-center justify-center cursor-pointer hover:scale-105 transition-transform`}
                          onClick={() => handleViewProfile(person.id_user)}
                        >
                          {person.photo_profil ? (
                            <img 
                              src={person.photo_profil} 
                              alt={getDisplayName(person)}
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <span className="text-white font-bold text-lg lg:text-xl">
                              {getInitials(person)}
                            </span>
                          )}
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 
                              className="font-semibold text-gray-900 truncate cursor-pointer hover:text-blue-600 transition-colors"
                              onClick={() => handleViewProfile(person.id_user)}
                            >
                              {getDisplayName(person)}
                            </h3>
                            {person.certified && (
                              <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 truncate">@{person.username}</p>
                          {person.bio && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{person.bio}</p>
                          )}
                          {person.followerCount !== undefined && (
                            <p className="text-xs text-gray-400 mt-1">
                              {person.followerCount} followers
                            </p>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          {activeTab === 'friends' && (
                            <>
                              <button
                                onClick={() => handleSendMessage(person.id_user)}
                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                                title="Envoyer un message"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleUnfollow(person.id_user, getDisplayName(person))}
                                disabled={actionLoading.has(person.id_user)}
                                className="px-3 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-all disabled:opacity-50"
                              >
                                {actionLoading.has(person.id_user) ? 'Chargement...' : 'Ne plus suivre'}
                              </button>
                            </>
                          )}

                          {activeTab === 'requests' && (
                            <>
                              <button
                                onClick={() => handleAcceptRequest(person.id_user, getDisplayName(person))}
                                disabled={actionLoading.has(person.id_user)}
                                className="px-3 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm font-medium bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-all disabled:opacity-50"
                              >
                                {actionLoading.has(person.id_user) ? '...' : 'Accepter'}
                              </button>
                              <button
                                onClick={() => handleRejectRequest(person.id_user, getDisplayName(person))}
                                disabled={actionLoading.has(person.id_user)}
                                className="px-3 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-all disabled:opacity-50"
                              >
                                {actionLoading.has(person.id_user) ? '...' : 'Refuser'}
                              </button>
                            </>
                          )}

                          {activeTab === 'suggestions' && (
                            <>
                              <button
                                onClick={() => handleViewProfile(person.id_user)}
                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                                title="Voir le profil"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleFollow(person.id_user, getDisplayName(person))}
                                disabled={actionLoading.has(person.id_user)}
                                className="px-3 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm font-medium bg-black text-white rounded-full hover:bg-gray-800 transition-all disabled:opacity-50"
                              >
                                {actionLoading.has(person.id_user) ? 'Chargement...' : 'Suivre'}
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Additional info for requests */}
                      {activeTab === 'requests' && person.requestDate && (
                        <div className="mt-3 pl-16 lg:pl-20">
                          <p className="text-xs text-gray-500">
                            Demande reçue le {new Date(person.requestDate).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      )}

                      {/* Mutual friends indicator */}
                      {person.mutualFriends && person.mutualFriends > 0 && (
                        <div className="mt-3 pl-16 lg:pl-20">
                          <p className="text-xs text-gray-500 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                            {person.mutualFriends} ami{person.mutualFriends > 1 ? 's' : ''} en commun
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stats Summary */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Amis</p>
                    <p className="text-2xl font-semibold text-gray-900">{friends.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Demandes</p>
                    <p className="text-2xl font-semibold text-gray-900">{pendingRequests.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Suggestions</p>
                    <p className="text-2xl font-semibold text-gray-900">{suggestions.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setActiveTab('suggestions');
                    if (suggestions.length === 0) {
                      fetchSuggestions();
                    }
                  }}
                  className="flex items-center space-x-3 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Découvrir des amis</p>
                    <p className="text-sm text-gray-600">Trouvez de nouvelles personnes</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setSearchTerm('');
                    setActiveTab('suggestions');
                    fetchData();
                  }}
                  className="flex items-center space-x-3 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Actualiser</p>
                    <p className="text-sm text-gray-600">Recharger les suggestions</p>
                  </div>
                </button>
              </div>
            </div>

          </div>
        </main>

        {/* Right Sidebar - Hidden on mobile */}
        <aside className="hidden xl:block xl:fixed xl:right-0 xl:w-80 xl:h-screen xl:overflow-y-auto">
          <RightSidebar />
        </aside>
      </div>
    </div>
  );
};

export default Friends;