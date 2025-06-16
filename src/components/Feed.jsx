import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';

const Feed = () => {
  console.log('🔄 Feed component rendering...');
  
  const { user } = useAuth();
  const navigate = useNavigate();
  
  console.log('👤 Current user:', user);
  
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [error, setError] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [feedFilter, setFeedFilter] = useState('recent'); // 'recent', 'friends', 'popular'
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    hasNext: false,
    total: 0
  });

  // ✅ NOUVEAU: État pour la box de post sticky
  const [isPostBoxSticky, setIsPostBoxSticky] = useState(false);
  
  // État pour les fonctionnalités
  const [showComments, setShowComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const [isPostingComment, setIsPostingComment] = useState({});
  
  const postBoxRef = useRef(null);
  const scrollRef = useRef(null);

  console.log('🎯 Feed state:', { 
    postsCount: posts.length, 
    isLoading, 
    error, 
    feedFilter 
  });

  // ✅ NOUVEAU: Gérer le scroll pour la sticky post box
  useEffect(() => {
    const handleScroll = () => {
      if (postBoxRef.current) {
        const rect = postBoxRef.current.getBoundingClientRect();
        // La box devient sticky dès qu'on commence à scroller
        setIsPostBoxSticky(window.scrollY > 10);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Charger les posts au changement de filtre
  useEffect(() => {
    fetchPosts(true); // true = reset pagination
  }, [feedFilter]);

  const getAPIEndpoint = () => {
    switch (feedFilter) {
      case 'friends':
        return '/api/v1/posts/timeline/personal';
      case 'popular':
        return '/api/v1/posts/trending';
      case 'recent':
      default:
        return '/api/v1/posts/public';
    }
  };

  const fetchPosts = async (reset = false) => {
    try {
      setIsLoading(true);
      setError('');
      
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Token d\'authentification manquant');
        return;
      }

      const page = reset ? 1 : pagination.page;
      const endpoint = getAPIEndpoint();
      
      const response = await fetch(`${endpoint}?page=${page}&limit=${pagination.limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const newPosts = data.posts || data;
        
        if (reset) {
          setPosts(newPosts);
          setPagination(prev => ({
            ...prev,
            page: 1,
            hasNext: data.pagination?.hasNextPage || false,
            total: data.pagination?.total || newPosts.length
          }));
        } else {
          setPosts(prev => [...prev, ...newPosts]);
          setPagination(prev => ({
            ...prev,
            hasNext: data.pagination?.hasNextPage || false,
            total: data.pagination?.total || prev.total
          }));
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          setError('Session expirée. Veuillez vous reconnecter.');
        } else if (response.status === 404) {
          if (feedFilter !== 'recent') {
            setFeedFilter('recent');
            return;
          }
          setError('Aucun post trouvé');
        } else {
          setError(errorData.error || 'Impossible de charger les posts');
        }
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Erreur de connexion. Vérifiez votre connexion internet.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.trim() || isPosting) return;

    try {
      setIsPosting(true);
      setError('');
      
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch('/api/v1/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newPost.trim()
        })
      });

      if (response.ok) {
        const responseData = await response.json();
        const newPostData = responseData.post || responseData;
        
        // Ajouter le nouveau post en haut de la liste
        setPosts(prev => [newPostData, ...prev]);
        setNewPost('');
        
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || 'Impossible de créer le post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      setError('Erreur lors de la création du post');
    } finally {
      setIsPosting(false);
    }
  };

  // ✅ CORRECTION: Fonction pour liker/unliker un post avec logs de debug
  const handleLike = async (postId) => {
    try {
      const token = localStorage.getItem('accessToken');
      console.log('🔄 Attempting to like post:', postId);
      
      const response = await fetch(`/api/v1/likes/posts/${postId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Like response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Like response data:', data);
        
        setPosts(prev => 
          prev.map(post => 
            post.id_post === postId 
              ? { 
                  ...post, 
                  isLikedByCurrentUser: data.isLiked || data.liked || !post.isLikedByCurrentUser,
                  likeCount: data.likeCount || data.likesCount || (data.isLiked ? post.likeCount + 1 : post.likeCount - 1)
                }
              : post
          )
        );
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Like error response:', errorData);
        setError('Erreur lors du like: ' + (errorData.error || `Erreur ${response.status}`));
      }
    } catch (error) {
      console.error('❌ Error liking post:', error);
      setError('Erreur de connexion lors du like');
    }
  };

  // ✅ NOUVEAU: Fonction pour afficher/masquer les commentaires
  const toggleComments = (postId) => {
    setShowComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  // ✅ NOUVEAU: Vérifier le statut de suivi
  const checkFollowStatus = useCallback(async (targetId) => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return

      const response = await fetch(`/api/v1/follow/status/${targetId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setIsFollowing(data.isFollowing || false)
      }
    } catch (error) {
      console.error('Error checking follow status:', error)
    }
  }, [])

  // ✅ CORRECTION: Fonction pour poster un commentaire avec la bonne URL
  const handleComment = async (postId) => {
    const comment = newComment[postId];
    if (!comment?.trim() || isPostingComment[postId]) return;

    try {
      setIsPostingComment(prev => ({ ...prev, [postId]: true }));
      
      const token = localStorage.getItem('accessToken');
      
      // ✅ CORRECTION: Utiliser l'endpoint correct pour les réponses
      const response = await fetch(`/api/v1/posts/${postId}/reply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: comment.trim()
        })
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Comment posted successfully:', responseData);
        
        // Actualiser les posts pour afficher le nouveau commentaire
        fetchPosts(true);
        setNewComment(prev => ({ ...prev, [postId]: '' }));
        
        // Optionnel: message de succès
        // setSuccessMessage('Commentaire publié !');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Comment error response:', errorData);
        setError(errorData.error || 'Impossible de poster le commentaire');
      }
    } catch (error) {
      console.error('❌ Error posting comment:', error);
      setError('Erreur lors de la publication du commentaire');
    } finally {
      setIsPostingComment(prev => ({ ...prev, [postId]: false }));
    }
  };

  // ✅ NOUVEAU: Fonction pour partager un post
  const handleShare = async (post) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Post de ${post.author?.username}`,
          text: post.content,
          url: window.location.href
        });
      } else {
        // Fallback pour les navigateurs qui ne supportent pas Web Share API
        await navigator.clipboard.writeText(`${post.content}\n\n- ${post.author?.username}\n${window.location.href}`);
        // Vous pourriez ajouter une notification toast ici
        alert('Lien copié dans le presse-papiers !');
      }
    } catch (error) {
      console.error('Erreur lors du partage:', error);
    }
  };

  // ✅ CORRECTION: Navigation vers le profil d'un utilisateur (debug amélioré)
  const navigateToProfile = (userId, username) => {
    console.log('🔄 Navigating to profile:', { userId, username, currentUserId: user?.id_user });
    
    if (!userId) {
      console.error('❌ No userId provided for navigation');
      setError('Impossible de naviguer vers ce profil');
      return;
    }

    if (parseInt(userId) === parseInt(user?.id_user)) {
      console.log('➡️ Navigating to own profile');
      navigate('/profile');
    } else {
      console.log('➡️ Navigating to other user profile:', userId);
      // Naviguer vers le profil d'un autre utilisateur
      navigate(`/profile/${userId}`, { state: { username } });
    }
  };

  const loadMorePosts = () => {
    if (pagination.hasNext && !isLoading) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }));
      fetchPosts(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInMinutes = Math.floor((now - postDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'à l\'instant';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}j`;
  };

  const getInitials = (author) => {
    if (author?.prenom && author?.nom) {
      return `${author.prenom[0]}${author.nom[0]}`.toUpperCase();
    }
    return author?.username?.substring(0, 2).toUpperCase() || '??';
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

        {/* Contenu principal */}
        <main className="flex-1 lg:ml-64 lg:mr-80">
          <div className="max-w-2xl mx-auto px-4 py-6 lg:px-8">
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
              {/* Filtres Desktop */}
              <div className="hidden lg:block">
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

              {/* Filtres Mobile */}
              <div className="lg:hidden mb-4">
                <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setFeedFilter('recent')}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      feedFilter === 'recent'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Récent
                  </button>
                  <button
                    onClick={() => setFeedFilter('friends')}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      feedFilter === 'friends'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Amis
                  </button>
                  <button
                    onClick={() => setFeedFilter('popular')}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
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

            {/* ✅ NOUVEAU: Composer un nouveau post avec sticky behavior */}
            <div 
              ref={postBoxRef}
              className={`transition-all duration-300 ease-in-out ${
                isPostBoxSticky 
                  ? 'fixed bottom-4 left-4 right-4 lg:left-72 lg:right-88 z-50 shadow-2xl' 
                  : 'relative mb-6'
              }`}
            >
              <div className="bg-white rounded-xl lg:rounded-2xl shadow-sm p-4 lg:p-6 border border-gray-100">
                <div className="flex space-x-3 lg:space-x-4">
                  <div 
                    className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0 ring-2 ring-white shadow-sm cursor-pointer hover:scale-105 transition-transform`}
                    onClick={() => navigateToProfile(user?.id_user, user?.username)}
                  >
                    {user?.photo_profil ? (
                      <img 
                        src={user.photo_profil} 
                        alt={user.username} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm lg:text-base">
                        {getInitials(user)}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <textarea
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      placeholder="Que voulez-vous partager ?"
                      className={`w-full p-3 lg:p-4 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm lg:text-base ${
                        isPostBoxSticky ? 'rows-2' : 'rows-3'
                      }`}
                      rows={isPostBoxSticky ? "2" : "3"}
                      maxLength="500"
                    />
                    
                    <div className="flex items-center justify-between mt-3 lg:mt-4">
                      <div className="flex items-center space-x-2 text-gray-500">
                        <span className="text-xs lg:text-sm">
                          {newPost.length}/500
                        </span>
                      </div>
                      
                      <button
                        onClick={handleCreatePost}
                        disabled={!newPost.trim() || isPosting}
                        className="bg-black text-white px-4 lg:px-6 py-2 lg:py-2.5 rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm lg:text-base"
                      >
                        {isPosting ? 'Publication...' : 'Publier'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages d'erreur */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center space-x-2">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">{error}</span>
                <button 
                  onClick={() => setError('')}
                  className="ml-auto text-red-500 hover:text-red-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Feed des posts */}
            <div className="space-y-4 lg:space-y-6">
              {isLoading && posts.length === 0 ? (
                // Skeleton de chargement
                [...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl lg:rounded-2xl shadow-sm p-4 lg:p-6 animate-pulse border border-gray-100">
                    <div className="flex space-x-3 lg:space-x-4">
                      <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gray-200 rounded-full flex-shrink-0"></div>
                      <div className="flex-1 space-y-3">
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-full"></div>
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                        <div className="flex space-x-6 pt-4">
                          <div className="h-4 bg-gray-200 rounded w-12"></div>
                          <div className="h-4 bg-gray-200 rounded w-12"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : posts.length === 0 ? (
                // État vide
                <div className="text-center py-12 lg:py-16 bg-white rounded-xl lg:rounded-2xl shadow-sm border border-gray-100">
                  <div className="text-gray-300 text-5xl lg:text-6xl mb-4 lg:mb-6">📝</div>
                  <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-2 lg:mb-3">
                    Aucun post pour le moment
                  </h3>
                  <p className="text-gray-600 mb-4 lg:mb-6 max-w-md mx-auto text-sm lg:text-base px-4">
                    {getEmptyStateMessage()}
                  </p>
                  <button 
                    onClick={() => document.querySelector('textarea')?.focus()}
                    className="bg-black text-white px-6 py-2 rounded-full font-medium hover:bg-gray-800 transition-colors text-sm lg:text-base"
                  >
                    Créer votre premier post
                  </button>
                </div>
              ) : (
                // Posts
                <>
                  {posts.map((post, index) => (
                    <article 
                      key={post.id_post} 
                      className="bg-white rounded-xl lg:rounded-2xl shadow-sm p-4 lg:p-6 border border-gray-100 hover:shadow-md transition-shadow duration-200"
                    >
                      {/* En-tête du post */}
                      <header className="flex items-start space-x-3 lg:space-x-4 mb-3 lg:mb-4">
                        <div 
                          className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full overflow-hidden bg-gradient-to-br ${getRandomGradient(index)} flex items-center justify-center ring-2 ring-white shadow-sm flex-shrink-0 cursor-pointer hover:scale-105 transition-transform`}
                          onClick={() => navigateToProfile(post.author?.id_user, post.author?.username)}
                        >
                          {post.author?.photo_profil ? (
                            <img 
                              src={post.author.photo_profil} 
                              alt={post.author.username} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white text-sm lg:text-base font-bold">
                              {getInitials(post.author)}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 
                              className="font-bold text-gray-900 text-sm lg:text-base cursor-pointer hover:underline"
                              onClick={() => navigateToProfile(post.author?.id_user, post.author?.username)}
                            >
                              {post.author?.username || 'Utilisateur inconnu'}
                            </h3>
                            {post.author?.certified && (
                              <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <p className="text-gray-500 text-xs lg:text-sm">
                            {formatTimeAgo(post.created_at)}
                          </p>
                        </div>
                      </header>

                      {/* Contenu du post */}
                      <div className="mb-4 lg:mb-6">
                        <p className="text-gray-900 text-sm lg:text-base leading-relaxed whitespace-pre-wrap">
                          {post.content}
                        </p>
                        
                        {/* Tags */}
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {post.tags.map((tag, tagIndex) => (
                              <span 
                                key={tagIndex}
                                className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions du post */}
                      <footer className="flex items-center justify-between pt-3 lg:pt-4 border-t border-gray-100">
                        <div className="flex items-center space-x-6">
                          {/* ✅ NOUVEAU: Bouton Like connecté */}
                          <button 
                            onClick={() => handleLike(post.id_post)}
                            className={`flex items-center space-x-2 transition-colors text-sm lg:text-base ${
                              post.isLikedByCurrentUser 
                                ? 'text-red-500 hover:text-red-600' 
                                : 'text-gray-500 hover:text-red-500'
                            }`}
                          >
                            <svg className="w-5 h-5 lg:w-6 lg:h-6" fill={post.isLikedByCurrentUser ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <span className="font-medium">{post.likeCount || 0}</span>
                          </button>

                          {/* ✅ NOUVEAU: Bouton Commentaires connecté */}
                          <button 
                            onClick={() => toggleComments(post.id_post)}
                            className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors text-sm lg:text-base"
                          >
                            <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span className="font-medium">{post.replyCount || 0}</span>
                          </button>

                          {/* ✅ NOUVEAU: Bouton Partager connecté */}
                          <button 
                            onClick={() => handleShare(post)}
                            className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors text-sm lg:text-base"
                          >
                            <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                            </svg>
                          </button>
                        </div>
                      </footer>

                      {/* ✅ NOUVEAU: Section des commentaires */}
                      {showComments[post.id_post] && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          {/* Zone de saisie de commentaire */}
                          <div className="flex space-x-3 mb-4">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {user?.photo_profil ? (
                                <img 
                                  src={user.photo_profil} 
                                  alt={user.username} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                getInitials(user)
                              )}
                            </div>
                            <div className="flex-1 flex space-x-2">
                              <input
                                type="text"
                                value={newComment[post.id_post] || ''}
                                onChange={(e) => setNewComment(prev => ({ ...prev, [post.id_post]: e.target.value }))}
                                placeholder="Écrire un commentaire..."
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleComment(post.id_post);
                                  }
                                }}
                              />
                              <button
                                onClick={() => handleComment(post.id_post)}
                                disabled={!newComment[post.id_post]?.trim() || isPostingComment[post.id_post]}
                                className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isPostingComment[post.id_post] ? '...' : 'Envoyer'}
                              </button>
                            </div>
                          </div>

                          {/* Liste des commentaires (placeholder - vous pouvez implémenter plus tard) */}
                          <div className="space-y-3">
                            {/* Ici vous pourriez afficher les commentaires existants */}
                            <div className="text-center text-gray-500 text-sm py-4">
                              <p>Les commentaires apparaîtront ici</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </article>
                  ))}

                  {/* Bouton charger plus */}
                  {pagination.hasNext && (
                    <div className="text-center py-6">
                      <button
                        onClick={loadMorePosts}
                        disabled={isLoading}
                        className="bg-white text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Chargement...' : 'Charger plus'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>

        {/* Sidebar droite */}
        <div className="hidden lg:block lg:w-80 lg:fixed lg:right-0 lg:h-full">
          <RightSidebar />
        </div>
      </div>

      {/* Menu mobile overlay */}
      {showMobileMenu && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setShowMobileMenu(false)}>
          <div className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl">
            <LeftSidebar />
          </div>
        </div>
      )}
    </div>
  );
  } catch (renderError) {
    console.error('❌ Feed render error:', renderError);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">Erreur de chargement</h2>
          <p className="text-gray-600 mb-4">Une erreur s'est produite lors du chargement du feed.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
          >
            Recharger la page
          </button>
          <pre className="mt-4 text-xs text-left bg-gray-100 p-2 rounded max-w-md">
            {renderError.toString()}
          </pre>
        </div>
      </div>
    );
  }
};

export default Feed;