import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';

const Friends = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('friends'); // 'friends', 'requests', 'suggestions'
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(new Set());
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'friends') {
        await fetchFriends();
      } else if (activeTab === 'requests') {
        await fetchPendingRequests();
      } else if (activeTab === 'suggestions') {
        await fetchSuggestions();
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriends = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/v1/follow/${user?.id_user}/following?limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFriends(data.following || []);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
      setFriends([]);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/v1/follow/requests/pending?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPendingRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      setPendingRequests([]);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      let response = await fetch('/api/v1/users/suggested?limit=50', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // Fallback to search if suggested endpoint doesn't exist
        response = await fetch('/api/v1/users/search?limit=50', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.users || data || []);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    }
  };

  const handleFollow = async (userId, username) => {
    if (actionLoading.has(userId)) return;
    
    setActionLoading(prev => new Set([...prev, userId]));
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/v1/follow/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`Successfully sent follow request to ${username}`);
        
        // Remove from suggestions
        setSuggestions(prev => prev.filter(user => user.id_user !== userId));
        
        // If it's a pending request, refresh pending requests
        if (data.isPending) {
          await fetchPendingRequests();
        } else {
          await fetchFriends();
        }
      }
    } catch (error) {
      console.error('Error following user:', error);
    } finally {
      setActionLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleUnfollow = async (userId, username) => {
    if (actionLoading.has(userId)) return;
    
    setActionLoading(prev => new Set([...prev, userId]));
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/v1/follow/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log(`Successfully unfollowed ${username}`);
        await fetchFriends();
      }
    } catch (error) {
      console.error('Error unfollowing user:', error);
    } finally {
      setActionLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleAcceptRequest = async (userId, username) => {
    if (actionLoading.has(userId)) return;
    
    setActionLoading(prev => new Set([...prev, userId]));
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/v1/follow/requests/${userId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log(`Accepted follow request from ${username}`);
        await fetchPendingRequests();
        await fetchFriends();
      }
    } catch (error) {
      console.error('Error accepting request:', error);
    } finally {
      setActionLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleRejectRequest = async (userId, username) => {
    if (actionLoading.has(userId)) return;
    
    setActionLoading(prev => new Set([...prev, userId]));
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/v1/follow/requests/${userId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log(`Rejected follow request from ${username}`);
        await fetchPendingRequests();
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
    } finally {
      setActionLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleViewProfile = (userId) => {
    // Navigate to user profile - you might want to create a UserProfile component
    console.log(`View profile for user ${userId}`);
    // navigate(`/user/${userId}`);
  };

  const handleSendMessage = (userId) => {
    navigate('/messages');
  };

  const getInitials = (user) => {
    if (user?.prenom && user?.nom) {
      return `${user.prenom[0]}${user.nom[0]}`.toUpperCase();
    }
    return user?.username?.[0]?.toUpperCase() || 'U';
  };

  const getDisplayName = (user) => {
    if (user?.prenom && user?.nom) {
      return `${user.prenom} ${user.nom}`;
    }
    return user?.username || 'Utilisateur';
  };

  const getRandomGradient = (index) => {
    const gradients = [
      'from-blue-400 to-purple-500',
      'from-pink-400 to-red-500',
      'from-green-400 to-blue-500',
      'from-yellow-400 to-pink-500',
      'from-purple-400 to-pink-500',
      'from-indigo-400 to-purple-500'
    ];
    return gradients[index % gradients.length];
  };

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
      label: 'Suggestions', 
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
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Mes Amis</h1>
              <p className="text-gray-600">Gérez vos connexions et découvrez de nouveaux amis</p>
            </div>

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
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                    {tab.count > 0 && (
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                        activeTab === tab.id ? 'bg-gray-100 text-gray-700' : 'bg-white text-gray-600'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder={`Rechercher dans ${tabConfig.find(t => t.id === activeTab)?.label.toLowerCase()}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm lg:text-base"
                />
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl lg:rounded-2xl shadow-sm border border-gray-100">
              {loading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center space-x-4 animate-pulse">
                      <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                      </div>
                      <div className="w-20 h-8 bg-gray-200 rounded-full"></div>
                    </div>
                  ))}
                </div>
              ) : filteredData.length === 0 ? (
                <div className="text-center py-12 lg:py-16">
                  <div className="text-gray-300 text-5xl lg:text-6xl mb-4">
                    {activeTab === 'friends' ? '👥' : activeTab === 'requests' ? '📬' : '🔍'}
                  </div>
                  <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-2">
                    {activeTab === 'friends' ? 'Aucun ami pour le moment' : 
                     activeTab === 'requests' ? 'Aucune demande en attente' : 
                     'Aucune suggestion'}
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto text-sm lg:text-base px-4">
                    {activeTab === 'friends' ? 'Commencez à suivre des personnes pour voir vos amis ici' : 
                     activeTab === 'requests' ? 'Les demandes d\'amitié apparaîtront ici' : 
                     'Aucune suggestion disponible pour le moment'}
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
                            <span className="text-white font-bold text-sm lg:text-lg">
                              {getInitials(person)}
                            </span>
                          )}
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 
                              className="font-bold text-gray-900 truncate cursor-pointer hover:text-blue-600 transition-colors text-sm lg:text-base"
                              onClick={() => handleViewProfile(person.id_user)}
                            >
                              {getDisplayName(person)}
                            </h3>
                            {person.certified && (
                              <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <p className="text-xs lg:text-sm text-gray-500 truncate">@{person.username}</p>
                          {person.bio && (
                            <p className="text-xs lg:text-sm text-gray-600 mt-1 truncate">{person.bio}</p>
                          )}
                          {activeTab === 'requests' && person.requestDate && (
                            <p className="text-xs text-gray-500 mt-1">
                              Demande envoyée le {new Date(person.requestDate).toLocaleDateString('fr-FR')}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          {activeTab === 'friends' && (
                            <>
                              <button
                                onClick={() => handleSendMessage(person.id_user)}
                                className="p-2 lg:p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                                title="Envoyer un message"
                              >
                                <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleUnfollow(person.id_user, person.username)}
                                disabled={actionLoading.has(person.id_user)}
                                className="px-3 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full transition-all disabled:opacity-50"
                              >
                                {actionLoading.has(person.id_user) ? 'Chargement...' : 'Ne plus suivre'}
                              </button>
                            </>
                          )}

                          {activeTab === 'requests' && (
                            <>
                              <button
                                onClick={() => handleAcceptRequest(person.id_user, person.username)}
                                disabled={actionLoading.has(person.id_user)}
                                className="px-3 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm font-medium bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-all disabled:opacity-50"
                              >
                                {actionLoading.has(person.id_user) ? '...' : 'Accepter'}
                              </button>
                              <button
                                onClick={() => handleRejectRequest(person.id_user, person.username)}
                                disabled={actionLoading.has(person.id_user)}
                                className="px-3 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-all disabled:opacity-50"
                              >
                                {actionLoading.has(person.id_user) ? '...' : 'Refuser'}
                              </button>
                            </>
                          )}

                          {activeTab === 'suggestions' && (
                            <button
                              onClick={() => handleFollow(person.id_user, person.username)}
                              disabled={actionLoading.has(person.id_user)}
                              className="px-3 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm font-medium bg-black text-white rounded-full hover:bg-gray-800 transition-all disabled:opacity-50"
                            >
                              {actionLoading.has(person.id_user) ? 'Chargement...' : 'Suivre'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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