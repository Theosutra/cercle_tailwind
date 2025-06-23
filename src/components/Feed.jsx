// src/components/Feed.jsx - Version complète avec animations fluides pour la modal

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import useFeedStore from '../stores/feedStore';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';

const Feed = () => {
  console.log('🔄 Feed component rendering...');
  
  const { user } = useAuth();
  const navigate = useNavigate();
  
  console.log('👤 Current user:', user);
  
  // ✅ UTILISATION DU STORE - Remplace la gestion des posts/likes
  const {
    posts,
    isLoading,
    error,
    pagination,
    pendingLikes,
    feedFilter,
    fetchPosts,
    createPost,
    toggleLike,
    setFeedFilter,
    setError,
    clearFeed
  } = useFeedStore();

  // États locaux conservés de votre code original (UI uniquement)
  const [newPost, setNewPost] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // ✅ AMÉLIORATION : États pour le FAB et modal de post avec animation
  const [showFAB, setShowFAB] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [modalAnimating, setModalAnimating] = useState(false); // ✅ NOUVEAU pour animations
  
  // ✅ NOUVEAU : États pour la recherche
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // ✅ États pour les commentaires (conservés de votre code)
  const [showComments, setShowComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const [isPostingComment, setIsPostingComment] = useState({});
  const [comments, setComments] = useState({});
  
  const postBoxRef = useRef(null);
  const scrollRef = useRef(null);

  console.log('🎯 Feed state:', { 
    postsCount: posts.length, 
    isLoading, 
    error, 
    feedFilter 
  });

  // ✅ AMÉLIORATION : Fonctions d'animation pour la modal
  const openModal = () => {
    setShowPostModal(true);
    setModalAnimating(true);
    // Permettre l'animation d'entrée
    setTimeout(() => setModalAnimating(false), 10);
  };

  const closeModal = () => {
    setModalAnimating(true);
    // Attendre la fin de l'animation avant de fermer
    setTimeout(() => {
      setShowPostModal(false);
      setModalAnimating(false);
      setNewPost('');
    }, 200);
  };

  // ✅ RESTAURÉ : Fonction de recherche avec debouncing
  const searchPosts = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      setIsSearching(true);
      console.log('🔍 Recherche de posts pour:', query);
      
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.error('❌ Token manquant pour la recherche');
        return;
      }
      
      const searchUrl = `/api/v1/posts/search?search=${encodeURIComponent(query)}&page=1&limit=10&sortBy=created_at&order=desc`;
      console.log('🌐 URL de recherche:', searchUrl);
      
      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      console.log('📡 Réponse recherche:', response.status, response.statusText);

      if (response.ok) {
        const results = await response.json();
        console.log('✅ Résultats de recherche:', results);
        
        // Vérifier la structure des données
        if (Array.isArray(results)) {
          setSearchResults(results);
        } else if (results.posts && Array.isArray(results.posts)) {
          setSearchResults(results.posts);
        } else if (results.data && Array.isArray(results.data)) {
          setSearchResults(results.data);
        } else {
          console.warn('⚠️ Structure inattendue des résultats:', results);
          setSearchResults([]);
        }
        
        setShowSearchResults(true);
      } else {
        console.error('❌ Erreur de recherche:', response.status, response.statusText);
        setSearchResults([]);
        setShowSearchResults(false);
      }
    } catch (error) {
      console.error('❌ Erreur réseau recherche posts:', error);
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setIsSearching(false);
    }
  };

  // ✅ RESTAURÉ : Debouncing pour la recherche
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchPosts(searchQuery);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 500); // 500ms de délai

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // ✅ NOUVEAU : Gérer le scroll pour afficher/masquer le FAB
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      
      // Afficher le FAB après 300px de scroll
      if (scrollPosition > 300) {
        setShowFAB(true);
      } else {
        setShowFAB(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ✅ CHARGEMENT INITIAL - Utilise le store
  useEffect(() => {
    if (user?.id_user) {
      fetchPosts(true); // true = reset pagination
    } else {
      clearFeed();
    }
  }, [feedFilter, user?.id_user, fetchPosts, clearFeed]);

  // ✅ AMÉLIORATION : CRÉATION DE POST avec animation de fermeture
  const handleCreatePost = async () => {
    if (!newPost.trim() || isPosting) return;

    try {
      setIsPosting(true);
      const result = await createPost(newPost);
      
      if (result.success) {
        setNewPost('');
        
        // Animation de fermeture fluide
        closeModal();
        
        // Scroll vers le haut avec animation
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 250);
      }
    } catch (error) {
      console.error('❌ Erreur création post:', error);
    } finally {
      setIsPosting(false);
    }
  };

  // ✅ LIKE - Ultra simple avec le store !
  const handleLike = (postId) => {
    toggleLike(postId);
  };

  // Fonction pour gérer les commentaires
  const handleToggleComments = async (postId) => {
    if (showComments[postId]) {
      setShowComments(prev => ({ ...prev, [postId]: false }));
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/v1/posts/${postId}/comments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const commentsData = await response.json();
        setComments(prev => ({ ...prev, [postId]: commentsData }));
        setShowComments(prev => ({ ...prev, [postId]: true }));
      }
    } catch (error) {
      console.error('❌ Error fetching comments:', error);
    }
  };

  // Fonction pour poster un commentaire
  const handlePostComment = async (postId) => {
    const commentText = newComment[postId];
    if (!commentText || !commentText.trim()) return;

    try {
      setIsPostingComment(prev => ({ ...prev, [postId]: true }));
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`/api/v1/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: commentText.trim() })
      });

      if (response.ok) {
        const newCommentData = await response.json();
        setComments(prev => ({
          ...prev,
          [postId]: [...(prev[postId] || []), newCommentData]
        }));
        setNewComment(prev => ({ ...prev, [postId]: '' }));
        console.log('💬 Comment created successfully');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Comment error response:', errorData);
        setError('Erreur lors de la publication du commentaire');
      }
    } catch (error) {
      console.error('❌ Error posting comment:', error);
      setError('Erreur de connexion lors de la publication du commentaire');
    } finally {
      setIsPostingComment(prev => ({ ...prev, [postId]: false }));
    }
  };

  // ✅ CORRIGÉ : Fonction pour partager un post avec URL spécifique
  const handleShare = async (post) => {
    const postUrl = `${window.location.origin}/post/${post.id_post}`;
    const shareData = {
      title: `Post de ${post.author?.username || post.user?.username}`,
      text: post.content,
      url: postUrl
    };

    try {
      // Utiliser l'API Web Share si disponible (mobile)
      if (navigator.share) {
        await navigator.share(shareData);
        console.log('✅ Post partagé via Web Share API');
      } else {
        // Fallback pour desktop - copier le lien
        await navigator.clipboard.writeText(postUrl);
        
        // Afficher une notification temporaire
        const notification = document.createElement('div');
        notification.textContent = 'Lien copié dans le presse-papiers !';
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #10b981;
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          z-index: 9999;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          animation: slideIn 0.3s ease-out;
        `;
        
        // Ajouter l'animation CSS
        const style = document.createElement('style');
        style.textContent = `
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        // Supprimer après 3 secondes
        setTimeout(() => {
          notification.remove();
          style.remove();
        }, 3000);
        
        console.log('✅ Lien du post copié dans le presse-papiers');
      }
    } catch (error) {
      console.error('❌ Erreur lors du partage:', error);
      
      // Fallback ultime - sélectionner le texte
      const textArea = document.createElement('textarea');
      textArea.value = `Découvrez ce post de ${post.author?.username || post.user?.username}: "${post.content}" ${postUrl}`;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      alert('Le contenu du post a été copié dans votre presse-papiers !');
    }
  };

  // Fonctions utilitaires conservées de votre code
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatContent = (content) => {
    return content
      .replace(/@(\w+)/g, '<span class="text-blue-600 font-medium">@$1</span>')
      .replace(/#(\w+)/g, '<span class="text-blue-600">#$1</span>');
  };

  const getRandomGradient = (index) => {
    const gradients = [
      'from-blue-500 to-purple-600',
      'from-green-500 to-blue-600',
      'from-purple-500 to-pink-600',
      'from-yellow-500 to-red-600',
      'from-indigo-500 to-purple-600',
      'from-pink-500 to-red-600'
    ];
    return gradients[index % gradients.length];
  };

  const getFilterDisplayName = () => {
    switch (feedFilter) {
      case 'friends': return 'Amis';
      case 'popular': return 'Populaire';
      case 'recent': 
      default: return 'Récent';
    }
  };

  const getEmptyStateMessage = () => {
    switch (feedFilter) {
      case 'friends': 
        return 'Vos amis n\'ont pas encore publié de posts. Commencez à suivre des personnes !';
      case 'popular': 
        return 'Aucun post populaire pour le moment. Soyez le premier à créer du contenu viral !';
      case 'recent': 
      default: 
        return 'Soyez le premier à partager quelque chose avec votre cercle ! Vos pensées comptent.';
    }
  };

  // Protection contre les erreurs de rendu
  if (error) {
    console.error('❌ Feed error state:', error);
  }

  console.log('🎨 About to render Feed UI...');

  try {
    return (
      <div className="min-h-screen bg-gray-50">
        {console.log('🏗️ Rendering main div...')}
        <div className="flex">
          {/* Sidebar gauche */}
          <div className="hidden lg:block lg:w-64 lg:fixed lg:h-full">
            <LeftSidebar />
          </div>

          {/* Contenu principal - ✅ AMÉLIORATION : Mieux centré */}
          <main className="flex-1 lg:ml-64 lg:mr-80">
            
            <div className="max-w-3xl mx-auto px-4 py-6 lg:px-8">
               <div className="hidden lg:block mb-6 lg:mb-8">
                  <h1 className="text-2xl font-bold text-gray-900">Feed</h1>
                  <p className="text-gray-600">Découvrez les dernières publications de votre cercle</p>
              </div>

              {/* En-tête mobile */}
              <div className="lg:hidden flex items-center justify-between mb-6">
                <button
                  onClick={() => setShowMobileMenu(true)}
                  className="p-2 rounded-lg bg-white shadow-sm border border-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <h1 className="text-xl font-bold text-gray-900">
                  {getFilterDisplayName()}
                </h1>
                <div className="w-10"></div>
              </div>

              <div className="space-y-6">
                {/* Filtres Desktop - ✅ Centré */}
                <div className="hidden lg:block">
                  <div className="flex items-center justify-center">
                    <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setFeedFilter('recent')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                          feedFilter === 'recent'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Récent
                      </button>
                      <button
                        onClick={() => setFeedFilter('friends')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                          feedFilter === 'friends'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Amis
                      </button>
                      <button
                        onClick={() => setFeedFilter('popular')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                          feedFilter === 'popular'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Populaire
                      </button>
                    </div>
                  </div>
                </div>

                {/* ✅ BARRE DE RECHERCHE - Restaurée */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 relative">
                  <div className="flex items-center space-x-3">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Rechercher des posts..."
                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent placeholder-gray-500 text-sm"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setSearchResults([]);
                            setShowSearchResults(false);
                          }}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    {isSearching && (
                      <div className="flex items-center">
                        <svg className="animate-spin h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Résultats de recherche */}
                  {showSearchResults && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-30 max-h-96 overflow-y-auto">
                      {searchResults.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                          {searchResults.map((post, index) => (
                            <div 
                              key={post.id_post || index} 
                              className="p-4 hover:bg-gray-50 cursor-pointer"
                              onClick={() => {
                                navigate(`/post/${post.id_post}`);
                                setShowSearchResults(false);
                                setSearchQuery('');
                              }}
                            >
                              <div className="flex items-start space-x-3">
                                <div 
                                  className={`w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br ${getRandomGradient(index)} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
                                >
                                  {post.author?.photo_profil || post.user?.photo_profil ? (
                                    <img 
                                      src={post.author?.photo_profil || post.user?.photo_profil} 
                                      alt="Profil" 
                                      className="w-full h-full object-cover" 
                                    />
                                  ) : (
                                    (post.author?.username || post.user?.username || 'U').charAt(0).toUpperCase()
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium text-gray-900 text-sm">
                                      {post.author?.username || post.user?.username}
                                    </span>
                                    <span className="text-gray-500 text-xs">
                                      {formatDate(post.created_at)}
                                    </span>
                                  </div>
                                  <p className="text-gray-700 text-sm mt-1 line-clamp-2">
                                    {post.content}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : searchQuery && !isSearching ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          Aucun résultat trouvé pour "{searchQuery}"
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>

                {/* Zone de création de post - Desktop uniquement */}
                <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex space-x-4">
                    <div 
                      className={`w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br ${getRandomGradient(1)} flex items-center justify-center text-white font-bold flex-shrink-0`}
                    >
                      {user?.photo_profil ? (
                        <img src={user.photo_profil} alt="Profil" className="w-full h-full object-cover" />
                      ) : (
                        user?.username?.charAt(0).toUpperCase() || 'U'
                      )}
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={newPost}
                        onChange={(e) => setNewPost(e.target.value)}
                        placeholder="Quoi de neuf ?"
                        className="w-full p-4 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors text-gray-900 placeholder-gray-500"
                        rows="3"
                        maxLength={280}
                        ref={postBoxRef}
                      />
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center space-x-3">
                          <button 
                            type="button"
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                            title="Ajouter une image"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </button>
                          
                          <button 
                            type="button"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                            title="Ajouter un emoji"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <span className={`text-sm ${
                            newPost.length > 250 ? 'text-orange-500' : 
                            newPost.length > 280 ? 'text-red-500' : 'text-gray-500'
                          }`}>
                            {newPost.length}/280
                          </span>
                          
                          <button
                            onClick={handleCreatePost}
                            disabled={!newPost.trim() || isPosting || newPost.length > 280}
                            className={`px-6 py-2 rounded-full font-medium transition-colors ${
                              !newPost.trim() || isPosting || newPost.length > 280
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                : 'bg-black text-white hover:bg-gray-800'
                            }`}
                          >
                            {isPosting ? (
                              <>
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Publication...</span>
                              </>
                            ) : (
                              <span>Publier</span>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feed des posts */}
                <div className="space-y-6">
                  {/* Loading initial */}
                  {isLoading && posts.length === 0 && (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                        <p className="text-gray-600">Chargement du feed...</p>
                      </div>
                    </div>
                  )}

                  {/* Message d'erreur */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-red-800">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Posts */}
                  {posts.length > 0 ? (
                    posts.map((post, index) => (
                      <div key={post.id_post || index} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {/* En-tête du post */}
                        <div className="p-6 pb-4">
                          <div className="flex items-start space-x-3">
                            <div 
                              className={`w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br ${getRandomGradient(index)} flex items-center justify-center text-white font-bold flex-shrink-0 cursor-pointer hover:scale-105 transition-transform`}
                              onClick={() => navigate(`/profile/${post.author?.id_user || post.user?.id_user}`)}
                            >
                              {post.author?.photo_profil || post.user?.photo_profil ? (
                                <img 
                                  src={post.author?.photo_profil || post.user?.photo_profil} 
                                  alt="Profil" 
                                  className="w-full h-full object-cover" 
                                />
                              ) : (
                                (post.author?.username || post.user?.username || 'U').charAt(0).toUpperCase()
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <h3 
                                  className="font-semibold text-gray-900 cursor-pointer hover:underline"
                                  onClick={() => navigate(`/profile/${post.author?.id_user || post.user?.id_user}`)}
                                >
                                  {post.author?.username || post.user?.username}
                                </h3>
                                {(post.author?.certified || post.user?.certified) && (
                                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              
                              <p className="text-sm text-gray-500">
                                {formatDate(post.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Contenu du post */}
                        <div className="px-6 pb-4">
                          <div 
                            className="text-gray-900 leading-relaxed cursor-pointer"
                            onClick={() => navigate(`/post/${post.id_post}`)}
                            dangerouslySetInnerHTML={{ __html: formatContent(post.content) }}
                          />
                        </div>

                        {/* Actions du post */}
                        <div className="px-6 py-4 border-t border-gray-100">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-6">
                              {/* Like */}
                              <button
                                onClick={() => handleLike(post.id_post)}
                                disabled={pendingLikes.has(post.id_post)}
                                className={`flex items-center space-x-2 transition-colors ${
                                  post.isLikedByCurrentUser
                                    ? 'text-red-500 hover:text-red-600'
                                    : 'text-gray-500 hover:text-red-500'
                                } ${pendingLikes.has(post.id_post) ? 'opacity-50' : ''}`}
                              >
                                <svg 
                                  className={`w-5 h-5 transition-all ${
                                    post.isLikedByCurrentUser ? 'fill-current scale-110' : ''
                                  }`}
                                  fill={post.isLikedByCurrentUser ? "currentColor" : "none"}
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                                <span>{post.likeCount || post.likesCount || 0}</span>
                              </button>

                              {/* Commentaires */}
                              <button
                                onClick={() => handleToggleComments(post.id_post)}
                                className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <span>{post.commentCount || 0}</span>
                              </button>
                            </div>

                            {/* Partager */}
                            <button
                              onClick={() => handleShare(post)}
                              className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                              </svg>
                              <span>Partager</span>
                            </button>
                          </div>
                        </div>

                        {/* Section commentaires - Conservée de votre code original */}
                        {showComments[post.id_post] && (
                          <div className="border-t border-gray-100 bg-gray-50">
                            <div className="p-6">
                              {/* Zone de saisie de commentaire */}
                              <div className="flex space-x-3 mb-6">
                                <div 
                                  className={`w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br ${getRandomGradient(1)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
                                >
                                  {user?.photo_profil ? (
                                    <img src={user.photo_profil} alt="Profil" className="w-full h-full object-cover" />
                                  ) : (
                                    user?.username?.charAt(0).toUpperCase() || 'U'
                                  )}
                                </div>
                                <div className="flex-1">
                                  <textarea
                                    value={newComment[post.id_post] || ''}
                                    onChange={(e) => setNewComment(prev => ({ ...prev, [post.id_post]: e.target.value }))}
                                    placeholder="Écrivez un commentaire..."
                                    className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                                    rows="2"
                                    maxLength={300}
                                  />
                                  <div className="flex items-center justify-between mt-2">
                                    <span className="text-xs text-gray-500">
                                      {(newComment[post.id_post] || '').length}/300
                                    </span>
                                    <button
                                      onClick={() => handlePostComment(post.id_post)}
                                      disabled={!newComment[post.id_post]?.trim() || isPostingComment[post.id_post]}
                                      className={`px-4 py-1 text-sm font-medium rounded-full transition-colors ${
                                        !newComment[post.id_post]?.trim() || isPostingComment[post.id_post]
                                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                          : 'bg-black text-white hover:bg-gray-800'
                                      }`}
                                    >
                                      {isPostingComment[post.id_post] ? 'Publication...' : 'Commenter'}
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Liste des commentaires */}
                              <div className="space-y-4">
                                {(comments[post.id_post] || []).map((comment, commentIndex) => (
                                  <div key={comment.id_comment || commentIndex} className="flex space-x-3">
                                    <div 
                                      className={`w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br ${getRandomGradient(commentIndex + 2)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
                                    >
                                      {comment.author?.photo_profil ? (
                                        <img src={comment.author.photo_profil} alt="Profil" className="w-full h-full object-cover" />
                                      ) : (
                                        (comment.author?.username || 'U').charAt(0).toUpperCase()
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                                        <div className="flex items-center space-x-2 mb-1">
                                          <span className="font-medium text-gray-900 text-sm">
                                            {comment.author?.username}
                                          </span>
                                          <span className="text-xs text-gray-500">
                                            {formatDate(comment.created_at)}
                                          </span>
                                        </div>
                                        <p className="text-gray-900 text-sm leading-relaxed">
                                          {comment.content}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    !isLoading && (
                      <div className="text-center py-12">
                        <div className="text-gray-400 text-6xl mb-4">📝</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun post à afficher</h3>
                        <p className="text-gray-600 max-w-md mx-auto">
                          {getEmptyStateMessage()}
                        </p>
                      </div>
                    )
                  )}

                  {/* Indicateur de chargement */}
                  {isLoading && posts.length > 0 && (
                    <div className="text-center py-6">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black mx-auto mb-2"></div>
                      <p className="text-gray-600 text-sm">Chargement...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>

          {/* Sidebar droite */}
          <div className="hidden lg:block lg:w-80 lg:fixed lg:right-0 lg:h-full">
            <RightSidebar />
          </div>

          {/* ✅ AMÉLIORATION : Floating Action Button (FAB) avec animation */}
          {showFAB && (
            <button
              onClick={openModal}
              className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-black text-white rounded-full shadow-2xl hover:bg-gray-800 transition-all duration-300 hover:scale-110 z-50 flex items-center justify-center group"
              style={{
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              }}
            >
              <svg 
                className="w-8 h-8 transition-transform duration-200 group-hover:rotate-90" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}

          {/* ✅ AMÉLIORATION : Modal de création avec animations fluides */}
          {showPostModal && (
            <div className="fixed inset-0 z-50">
              {/* Overlay avec animation de fade */}
              <div 
                className={`fixed inset-0 backdrop-blur-sm transition-all duration-200 ease-out ${
                  modalAnimating ? 'opacity-0' : 'opacity-10'
                }`}
                style={{
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }}
                onClick={closeModal}
              ></div>
              
              {/* Modal avec animation de slide-up fluide */}
              <div 
                className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 w-[95%] max-w-3xl transition-all duration-200 ease-out ${
                  modalAnimating 
                    ? 'translate-y-full opacity-0 scale-95' 
                    : 'translate-y-0 opacity-100 scale-100'
                }`}
              >
                <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
                  {/* Header compact avec animation des éléments */}
                  <div className={`flex items-center justify-between px-6 py-4 border-b border-gray-100 transition-all duration-300 ${
                    modalAnimating ? 'opacity-0 transform translate-y-2' : 'opacity-100 transform translate-y-0'
                  }`}>
                    <h2 className="text-lg font-semibold text-gray-900">Créer un post</h2>
                    <button
                      onClick={closeModal}
                      className="p-2 rounded-full hover:bg-gray-100 transition-all duration-200 hover:rotate-90 hover:scale-110"
                    >
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Contenu avec animation décalée */}
                  <div className={`p-6 transition-all duration-300 delay-75 ${
                    modalAnimating ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'
                  }`}>
                    <div className="flex space-x-4">
                      {/* Avatar avec animation */}
                      <div 
                        className={`w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold flex-shrink-0 transition-all duration-300 delay-100 ${
                          modalAnimating ? 'opacity-0 scale-75' : 'opacity-100 scale-100'
                        }`}
                      >
                        {user?.photo_profil ? (
                          <img src={user.photo_profil} alt="Profil" className="w-full h-full object-cover" />
                        ) : (
                          user?.username?.charAt(0).toUpperCase() || 'U'
                        )}
                      </div>
                      
                      {/* Zone de texte avec animation */}
                      <div className={`flex-1 transition-all duration-300 delay-150 ${
                        modalAnimating ? 'opacity-0 transform translate-x-4' : 'opacity-100 transform translate-x-0'
                      }`}>
                        <textarea
                          value={newPost}
                          onChange={(e) => setNewPost(e.target.value)}
                          placeholder="Quoi de neuf ?"
                          className="w-full p-4 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                          rows="4"
                          maxLength={280}
                          autoFocus={!modalAnimating}
                        />
                        
                        {/* Compteur de caractères avec animation */}
                        <div className={`flex items-center justify-between mt-3 transition-all duration-300 delay-200 ${
                          modalAnimating ? 'opacity-0 transform translate-y-2' : 'opacity-100 transform translate-y-0'
                        }`}>
                          <div className="flex items-center space-x-3">
                            {/* Boutons d'options avec hover amélioré */}
                            <button 
                              type="button"
                              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-110"
                              title="Ajouter une image"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </button>
                            
                            <button 
                              type="button"
                              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-110"
                              title="Ajouter un emoji"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                          </div>
                          
                          {/* Compteur et bouton publier */}
                          <div className="flex items-center space-x-3">
                            <span className={`text-sm transition-colors duration-200 ${
                              newPost.length > 250 ? 'text-orange-500' : 
                              newPost.length > 280 ? 'text-red-500' : 'text-gray-500'
                            }`}>
                              {newPost.length}/280
                            </span>
                            
                            {/* Bouton publier avec animation */}
                            <button
                              onClick={handleCreatePost}
                              disabled={!newPost.trim() || isPosting || newPost.length > 280}
                              className={`px-6 py-2 rounded-full font-medium transition-all duration-200 transform ${
                                !newPost.trim() || isPosting || newPost.length > 280
                                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                  : 'bg-black text-white hover:bg-gray-800 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl'
                              }`}
                            >
                              {isPosting ? (
                                <div className="flex items-center space-x-2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  <span>Publication...</span>
                                </div>
                              ) : (
                                'Publier'
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Menu mobile */}
          {showMobileMenu && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setShowMobileMenu(false)}>
              <div className="bg-white w-64 h-full" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Menu</h2>
                    <button
                      onClick={() => setShowMobileMenu(false)}
                      className="p-2 rounded-lg hover:bg-gray-100"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* Filtres mobile */}
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Filtres</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setFeedFilter('recent');
                        setShowMobileMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                        feedFilter === 'recent'
                          ? 'bg-black text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Récent
                    </button>
                    <button
                      onClick={() => {
                        setFeedFilter('friends');
                        setShowMobileMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                        feedFilter === 'friends'
                          ? 'bg-black text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Amis
                    </button>
                    <button
                      onClick={() => {
                        setFeedFilter('popular');
                        setShowMobileMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                        feedFilter === 'popular'
                          ? 'bg-black text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Populaire
                    </button>
                  </div>
                </div>

                {/* Navigation mobile */}
                <div className="p-4">
                  <LeftSidebar isMobile={true} onClose={() => setShowMobileMenu(false)} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  } catch (renderError) {
    console.error('❌ Feed rendering error:', renderError);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Erreur de rendu</h2>
          <p className="text-gray-600 mb-4">Une erreur s'est produite lors de l'affichage du feed</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Recharger la page
          </button>
        </div>
      </div>
    );
  }
};

export default Feed;