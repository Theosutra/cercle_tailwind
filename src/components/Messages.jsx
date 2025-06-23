import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';

const Messages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [error, setError] = useState('');
  
  // New conversation popup states
  const [showUserSearchPopup, setShowUserSearchPopup] = useState(false);
  const [searchUsers, setSearchUsers] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const searchInputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        setError('Token d\'authentification manquant');
        setLoading(false);
        return;
      }

      console.log('🔄 Fetching conversations...');
      const response = await fetch('/api/v1/messages/conversations?page=1&limit=20', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Response status:', response.status);

      if (response.status === 429) {
        setError('Trop de requêtes. Veuillez attendre avant de réessayer.');
        setLoading(false);
        return;
      }

      if (response.status === 401) {
        setError('Session expirée, veuillez vous reconnecter');
        setLoading(false);
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Conversations data:', data);
      
      setConversations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('❌ Error fetching conversations:', error);
      setError(`Erreur lors du chargement: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Search users for new conversation
  const searchUsersForConversation = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) {
      setAvailableUsers([]);
      return;
    }

    try {
      setLoadingUsers(true);
      const token = localStorage.getItem('accessToken');
      
      console.log('🔍 Searching users:', searchQuery);
      const response = await fetch(`/api/v1/users/search?search=${encodeURIComponent(searchQuery)}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Users found:', data);
      
      // Filter out current user and users with existing conversations
      const filteredUsers = (data.users || []).filter(u => {
        // Convert IDs to ensure consistent comparison (API might return string or int)
        const userId = parseInt(u.id_user);
        const currentUserId = parseInt(user?.id_user);
        
        if (userId === currentUserId) return false;
        
        // Check if conversation already exists
        const hasConversation = conversations.some(conv => 
          parseInt(conv.otherUser.id_user) === userId
        );
        return !hasConversation;
      });
      
      setAvailableUsers(filteredUsers);
    } catch (error) {
      console.error('❌ Error searching users:', error);
      setAvailableUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, [user?.id_user, conversations]);

  // Handle user search with debounce
  const handleUserSearch = useCallback((query) => {
    setSearchUsers(query);
    
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set new timeout for debounced search
    const newTimeout = setTimeout(() => {
      searchUsersForConversation(query);
    }, 300);
    
    setSearchTimeout(newTimeout);
  }, [searchUsersForConversation, searchTimeout]);

  // Start conversation with selected user
  const startConversationWithUser = useCallback(async (selectedUser) => {
    try {
      // Create new conversation object
      const newConversation = {
        otherUser: {
          id_user: selectedUser.id_user,
          username: selectedUser.username,
          photo_profil: selectedUser.photo_profil,
          certified: selectedUser.certified || false
        },
        lastMessage: null,
        unreadCount: 0
      };
      
      // Add to conversations list
      setConversations(prev => [newConversation, ...prev]);
      
      // Select the new conversation
      setSelectedConversation(newConversation);
      
      // Close popup
      setShowUserSearchPopup(false);
      setSearchUsers('');
      setAvailableUsers([]);
      
      console.log('✅ Started conversation with:', selectedUser.username);
    } catch (error) {
      console.error('❌ Error starting conversation:', error);
      setError('Erreur lors de la création de la conversation');
    }
  }, []);

  // Fetch messages for a specific conversation
  const fetchMessages = useCallback(async (userId) => {
    try {
      setLoadingMessages(true);
      setError('');
      const token = localStorage.getItem('accessToken');
      
      console.log('🔄 Fetching messages for user:', userId);
      // Ensure userId is passed as string in URL but the API will handle the conversion
      const response = await fetch(`/api/v1/messages/${userId}?page=1&limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Messages data:', data);
      
      setMessages(data.messages || []);
      
      // Mark messages as read
      await markAsRead(userId);
      
      // Update conversation unread count
      setConversations(prev => 
        prev.map(conv => 
          parseInt(conv.otherUser.id_user) === parseInt(userId)
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      setError('Erreur lors du chargement des messages');
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Mark messages as read
  const markAsRead = useCallback(async (userId) => {
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`/api/v1/messages/${userId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, []);

  // Send message with optimistic updates
  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedConversation || sendingMessage) return;

    const messageContent = newMessage.trim();
    const tempId = Date.now().toString();
    
    // Optimistic update
    const optimisticMessage = {
      id_message: tempId,
      sender: parseInt(user.id_user), // Ensure it's an integer
      receiver: parseInt(selectedConversation.otherUser.id_user),
      message: messageContent,
      send_at: new Date().toISOString(),
      read_at: null,
      sender_user: {
        id_user: parseInt(user.id_user),
        username: user.username,
        photo_profil: user.photo_profil
      },
      sending: true
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    setSendingMessage(true);

    try {
      const token = localStorage.getItem('accessToken');
      console.log('🔄 Sending message...');
      
      const response = await fetch('/api/v1/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          receiver: selectedConversation.otherUser.id_user, // API should handle string->int conversion
          message: messageContent
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const result = await response.json();
      console.log('✅ Message sent:', result);
      
      // Replace optimistic message with real one
      setMessages(prev => 
        prev.map(msg => 
          msg.id_message === tempId 
            ? { ...result.data, sending: false }
            : msg
        )
      );

      // Update conversations list
      setConversations(prev => {
        const updated = prev.filter(conv => 
          parseInt(conv.otherUser.id_user) !== parseInt(selectedConversation.otherUser.id_user)
        );
        return [{
          otherUser: selectedConversation.otherUser,
          lastMessage: {
            content: messageContent,
            senderId: parseInt(user.id_user),
            timestamp: new Date().toISOString(),
            isRead: false
          },
          unreadCount: 0
        }, ...updated];
      });

    } catch (error) {
      console.error('❌ Error sending message:', error);
      
      // Remove failed message and show error
      setMessages(prev => prev.filter(msg => msg.id_message !== tempId));
      setError('Échec de l\'envoi du message');
      setNewMessage(messageContent); // Restore message content
    } finally {
      setSendingMessage(false);
    }
  }, [newMessage, selectedConversation, user, sendingMessage]);

  // Handle textarea key press
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  // Auto-resize textarea
  const handleTextareaChange = useCallback((e) => {
    setNewMessage(e.target.value);
    
    // Auto-resize
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, []);

  // Format time display
  const formatTime = useCallback((timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Format conversation time
  const formatConversationTime = useCallback((timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (diffInDays === 1) {
      return 'Hier';
    } else if (diffInDays < 7) {
      return date.toLocaleDateString('fr-FR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short'
      });
    }
  }, []);

  // Get user initials for avatar fallback
  const getInitials = useCallback((user) => {
    if (!user?.username) return '?';
    return user.username.substring(0, 2).toUpperCase();
  }, []);

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv =>
    conv.otherUser.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle popup open
  const handleOpenUserSearch = () => {
    setShowUserSearchPopup(true);
    setSearchUsers('');
    setAvailableUsers([]);
    setError('');
    
    // Focus search input after popup opens
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 100);
  };

  // Handle popup close
  const handleCloseUserSearch = () => {
    setShowUserSearchPopup(false);
    setSearchUsers('');
    setAvailableUsers([]);
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
  };

  // Effects
  useEffect(() => {
    fetchConversations();
  }, []); 

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.otherUser.id_user);
    }
  }, [selectedConversation]); 

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Manual retry function
  const retryFetchConversations = () => {
    setError('');
    fetchConversations();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between fixed top-0 left-0 right-0 z-30">
        <button 
          onClick={() => setShowMobileMenu(true)}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          {user?.photo_profil ? (
            <img src={user.photo_profil} alt="Your profile" className="w-full h-full object-cover rounded-full" />
          ) : (
            <span className="text-white font-bold text-sm">{getInitials(user)}</span>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="fixed top-16 lg:top-0 left-0 right-0 bg-red-100 border border-red-400 text-red-700 px-4 py-3 z-20">
          <div className="flex items-center justify-between">
            <span className="text-sm">{error}</span>
            <div className="flex space-x-2">
              {error.includes('Trop de requêtes') && (
                <button 
                  onClick={retryFetchConversations}
                  className="text-red-600 hover:text-red-800 text-sm underline"
                >
                  Réessayer
                </button>
              )}
              <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50"
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

      {/* User Search Popup - Nouvelle version élégante */}
      {showUserSearchPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 backdrop-blur-sm"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
            onClick={handleCloseUserSearch}
          ></div>
          
          {/* Popup Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto transform transition-all duration-300 scale-100">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Nouvelle conversation</h3>
                <p className="text-sm text-gray-500 mt-1">Recherchez un utilisateur pour commencer</p>
              </div>
              <button 
                onClick={handleCloseUserSearch}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search Input */}
            <div className="p-6 pb-0">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchUsers}
                  onChange={(e) => handleUserSearch(e.target.value)}
                  placeholder="@nom_utilisateur ou nom complet..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                />
                {loadingUsers && (
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Users List */}
            <div className="px-6 pb-6">
              <div className="max-h-64 overflow-y-auto mt-4">
                {!searchUsers ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">Tapez pour rechercher des utilisateurs</p>
                  </div>
                ) : availableUsers.length === 0 && !loadingUsers ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">Aucun utilisateur trouvé</p>
                    <p className="text-gray-400 text-xs mt-1">Essayez un autre terme de recherche</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {availableUsers.map((user) => (
                      <div
                        key={user.id_user}
                        onClick={() => startConversationWithUser(user)}
                        className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-all duration-200 group"
                      >
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                            {user.photo_profil ? (
                              <img 
                                src={user.photo_profil} 
                                alt={user.username}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-white font-bold text-sm">
                                {getInitials(user)}
                              </span>
                            )}
                          </div>
                          
                          {user.certified && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              @{user.username}
                            </p>
                            {user.certified && (
                              <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          {(user.prenom || user.nom) && (
                            <p className="text-sm text-gray-500 truncate">
                              {user.prenom} {user.nom}
                            </p>
                          )}
                        </div>

                        {/* Hover effect arrow */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
          <div className="h-screen lg:h-screen flex">
            
            {/* Conversations List */}
            <div className={`w-full lg:w-80 bg-white border-r border-gray-200 flex flex-col ${
              selectedConversation ? 'hidden lg:flex' : 'flex'
            }`}>
              
              {/* Header */}
              <div className="p-4 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-bold text-gray-900">Messages</h2>
                  <button 
                    onClick={handleOpenUserSearch}
                    className="p-2.5 rounded-full bg-black hover:bg-black-700 transition-colors group"
                    title="Nouvelle conversation"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>
                
                {/* Search */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Rechercher une conversation..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                  />
                </div>
              </div>

              {/* Conversations */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : error && !conversations.length ? (
                  <div className="p-4 text-center">
                    <div className="text-red-500 mb-2">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{error}</p>
                    <button 
                      onClick={retryFetchConversations}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Réessayer
                    </button>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-4 text-center">
                    <div className="py-12">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {searchTerm ? 'Aucune conversation trouvée' : 'Aucune conversation'}
                      </h3>
                      <p className="text-gray-500 text-sm mb-6">
                        {searchTerm 
                          ? 'Essayez un autre terme de recherche'
                          : 'Commencez une nouvelle conversation avec vos amis'
                        }
                      </p>
                      {!searchTerm && (
                        <button 
                          onClick={handleOpenUserSearch}
                          className="px-6 py-3 bg-black-600 text-white rounded-xl hover:bg-grey-700 transition-colors font-medium"
                        >
                          Nouvelle conversation
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
                    <div
                      key={conversation.otherUser.id_user}
                      onClick={() => {
                        setSelectedConversation(conversation);
                        setError('');
                      }}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                        selectedConversation?.otherUser.id_user === conversation.otherUser.id_user 
                          ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                          : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {/* Avatar */}
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                            {conversation.otherUser.photo_profil ? (
                              <img 
                                src={conversation.otherUser.photo_profil} 
                                alt={conversation.otherUser.username}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-white font-bold text-sm">
                                {getInitials(conversation.otherUser)}
                              </span>
                            )}
                          </div>
                          
                          {/* Certified badge */}
                          {conversation.otherUser.certified && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Conversation Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                              @{conversation.otherUser.username}
                            </h3>
                            {conversation.lastMessage && (
                              <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                                {formatConversationTime(conversation.lastMessage.timestamp)}
                              </span>
                            )}
                          </div>
                          
                          {conversation.lastMessage ? (
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-gray-600 truncate flex-1">
                                {conversation.lastMessage.senderId === parseInt(user?.id_user) && 'Vous: '}
                                {conversation.lastMessage.content}
                              </p>
                              
                              {conversation.unreadCount > 0 && (
                                <span className="ml-2 bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                                  {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                                </span>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 italic">
                              Conversation créée • Envoyez votre premier message
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col ${
              selectedConversation ? 'flex' : 'hidden lg:flex'
            }`}>
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="bg-white border-b border-gray-200 p-4 flex items-center space-x-3">
                    <button 
                      onClick={() => setSelectedConversation(null)}
                      className="lg:hidden p-2 rounded-full hover:bg-gray-100 transition-colors -ml-2"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                        {selectedConversation.otherUser.photo_profil ? (
                          <img 
                            src={selectedConversation.otherUser.photo_profil} 
                            alt={selectedConversation.otherUser.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-bold text-sm">
                            {getInitials(selectedConversation.otherUser)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h2 className="text-lg font-semibold text-gray-900">
                          @{selectedConversation.otherUser.username}
                        </h2>
                        {selectedConversation.otherUser.certified && (
                          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {messages.length === 0 ? 'Nouvelle conversation' : `${messages.length} message${messages.length > 1 ? 's' : ''}`}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </button>
                      <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {loadingMessages ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Nouvelle conversation avec @{selectedConversation.otherUser.username}
                          </h3>
                          <p className="text-gray-600">Envoyez votre premier message pour commencer la conversation !</p>
                        </div>
                      </div>
                    ) : (
                      messages.map((message, index) => {
                        const isOwn = parseInt(message.sender) === parseInt(user?.id_user);
                        const showAvatar = index === 0 || parseInt(messages[index - 1].sender) !== parseInt(message.sender);

                        return (
                          <div key={message.id_message} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                              
                              {/* Avatar */}
                              {!isOwn && showAvatar && (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                                  {message.sender_user?.photo_profil ? (
                                    <img 
                                      src={message.sender_user.photo_profil} 
                                      alt={message.sender_user.username}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-white font-bold text-xs">
                                      {getInitials(message.sender_user)}
                                    </span>
                                  )}
                                </div>
                              )}
                              
                              {!isOwn && !showAvatar && (
                                <div className="w-8 h-8 flex-shrink-0"></div>
                              )}

                              {/* Message Bubble */}
                              <div className={`relative px-4 py-2 rounded-2xl max-w-full ${
                                isOwn 
                                  ? 'bg-blue-500 text-white' 
                                  : 'bg-white text-gray-900 border border-gray-200 shadow-sm'
                              } ${message.sending ? 'opacity-70' : ''}`}>
                                
                                {/* Message content */}
                                <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                  {message.message}
                                </p>
                                
                                {/* Message status */}
                                <div className={`flex items-center justify-end mt-1 space-x-1 ${
                                  isOwn ? 'text-blue-100' : 'text-gray-500'
                                }`}>
                                  <span className="text-xs">
                                    {formatTime(message.send_at)}
                                  </span>
                                  
                                  {isOwn && (
                                    <div className="flex space-x-1">
                                      {message.sending ? (
                                        <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                      ) : message.read_at ? (
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      ) : (
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="bg-white border-t border-gray-200 p-4">
                    <div className="flex items-end space-x-3">
                      {/* Attach button */}
                      <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                      </button>
                      
                      {/* Text input */}
                      <div className="flex-1 relative">
                        <textarea
                          ref={textareaRef}
                          value={newMessage}
                          onChange={handleTextareaChange}
                          onKeyPress={handleKeyPress}
                          placeholder={`Écrivez à @${selectedConversation.otherUser.username}...`}
                          className="w-full px-4 py-3 bg-gray-100 border-0 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm min-h-[44px] max-h-[120px]"
                          rows={1}
                          disabled={sendingMessage}
                        />
                      </div>
                      
                      {/* Send button */}
                      <button 
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || sendingMessage}
                        className="p-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                      >
                        {sendingMessage ? (
                          <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* Empty State */
                <div className="flex-1 flex items-center justify-center bg-white">
                  <div className="text-center max-w-md mx-auto p-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Sélectionnez une conversation</h2>
                    <p className="text-gray-600 leading-relaxed mb-6">
                      Choisissez une conversation dans la liste pour commencer à discuter avec vos amis ou démarrez une nouvelle conversation.
                    </p>
                    <button 
                      onClick={handleOpenUserSearch}
                      className="px-6 py-3 bg-black text-white rounded-xl hover:bg-black-300 transition-colors font-medium"
                    >
                      Nouvelle conversation
                    </button>
                  </div>
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

export default Messages;