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

  // État pour la box de post sticky
  const [isPostBoxSticky, setIsPostBoxSticky] = useState(false);
  
  // ✅ CORRECTION: État pour les fonctionnalités likes et commentaires
  const [showComments, setShowComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const [isPostingComment, setIsPostingComment] = useState({});
  const [comments, setComments] = useState({}); // Stockage des commentaires chargés
  
  const postBoxRef = useRef(null);
  const scrollRef = useRef(null);

  console.log('🎯 Feed state:', { 
    postsCount: posts.length, 
    isLoading, 
    error, 
    feedFilter 
  });

  // Gérer le scroll pour la sticky post box
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

      const page = reset ? 1 : pagination.page + 1;
      const endpoint = getAPIEndpoint();
      
      console.log('📡 Fetching posts from:', `${endpoint}?page=${page}&limit=${pagination.limit}`);
      
      const response = await fetch(`${endpoint}?page=${page}&limit=${pagination.limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Posts fetched successfully:', data);
        
        const newPosts = Array.isArray(data) ? data : (data.posts || []);
        
        if (reset) {
          setPosts(newPosts);
          setPagination(prev => ({
            ...prev,
            page: 1,
            hasNext: data.pagination?.hasNext || newPosts.length === pagination.limit,
            total: data.pagination?.total || newPosts.length
          }));
        } else {
          setPosts(prev => [...prev, ...newPosts]);
          setPagination(prev => ({
            ...prev,
            page: page,
            hasNext: data.pagination?.hasNext || newPosts.length === pagination.limit,
            total: data.pagination?.total || (prev.total + newPosts.length)
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

  // ✅ CORRECTION: Fonction pour liker/unliker un post (simplifiée)
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
        
        // Mettre à jour le state local
        setPosts(prev => 
          prev.map(post => 
            post.id_post === postId 
              ? { 
                  ...post, 
                  isLiked: data.isLiked,
                  isLikedByCurrentUser: data.isLiked,
                  likeCount: data.likeCount,
                  likesCount: data.likeCount // Support pour les deux noms
                }
              : post
          )
        );
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Like error response:', errorData);
        setError('Erreur lors du like');
      }
    } catch (error) {
      console.error('❌ Error liking post:', error);
      setError('Erreur de connexion lors du like');
    }
  };

  // ✅ CORRECTION: Fonction pour charger les commentaires d'un post
  const loadComments = async (postId) => {
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`/api/v1/posts/${postId}/replies?limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setComments(prev => ({
          ...prev,
          [postId]: data.replies || []
        }));
        console.log('✅ Comments loaded for post:', postId);
      } else {
        console.error('❌ Error loading comments:', response.status);
      }
    } catch (error) {
      console.error('❌ Error loading comments:', error);
    }
  };

  // ✅ CORRECTION: Fonction pour afficher/masquer les commentaires
  const toggleComments = (postId) => {
    const isCurrentlyShown = showComments[postId];
    
    setShowComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));

    // Charger les commentaires si on les affiche pour la première fois
    if (!isCurrentlyShown && !comments[postId]) {
      loadComments(postId);
    }
  };

  // ✅ CORRECTION: Fonction pour poster un commentaire avec post_parent
  const handleComment = async (postId) => {
    const comment = newComment[postId];
    if (!comment?.trim() || isPostingComment[postId]) return;

    try {
      setIsPostingComment(prev => ({ ...prev, [postId]: true }));
      
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch('/api/v1/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: comment.trim(),
          post_parent: parseInt(postId) // Utiliser post_parent pour créer un commentaire
        })
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Comment posted successfully:', responseData);
        
        // Réinitialiser le champ de commentaire
        setNewComment(prev => ({ ...prev, [postId]: '' }));
        
        // Ajouter le commentaire à la liste locale
        const newCommentData = responseData.post || responseData;
        setComments(prev => ({
          ...prev,
          [postId]: [newCommentData, ...(prev[postId] || [])]
        }));

        // Mettre à jour le nombre de commentaires du post
        setPosts(prev => 
          prev.map(post => 
            post.id_post === postId 
              ? { ...post, replyCount: (post.replyCount || 0) + 1 }
              : post
          )
        );
        
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Comment error response:', errorData);
        setError('Erreur lors du commentaire');
      }
    } catch (error) {
      console.error('❌ Error posting comment:', error);
      setError('Erreur de connexion lors du commentaire');
    } finally {
      setIsPostingComment(prev => ({ ...prev, [postId]: false }));
    }
  };

  const loadMorePosts = () => {
    if (!isLoading && pagination.hasNext) {
      fetchPosts(false);
    }
  };

  // Fonctions utilitaires (gardées identiques)
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `${diffInMinutes}min`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}j`;
    
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
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

            {/* Composer un nouveau post avec sticky behavior - STYLE ORIGINAL CONSERVÉ */}
            <div 
              ref={postBoxRef}
              className={`transition-all duration-800 ease-in-out ${
                isPostBoxSticky 
                  ? 'fixed top-4 left-1/2 transform -translate-x-1/2 w-full max-w-xl z-50 shadow-2xl'
                  : 'relative mb-6'
              } bg-white rounded-2xl border border-gray-200 overflow-hidden`}
            >
              <div className="p-6">
                <div className="flex space-x-4">
                  <div 
                    className={`${
                      isPostBoxSticky ? 'w-10 h-10' : 'w-12 h-12'
                    } rounded-full overflow-hidden bg-gradient-to-br ${getRandomGradient(0)} flex items-center justify-center text-white font-bold transition-all duration-300`}
                  >
                    {user?.photo_profil ? (
                      <img src={user.photo_profil} alt="Profil" className="w-full h-full object-cover" />
                    ) : (
                      <span className={isPostBoxSticky ? 'text-sm' : 'text-lg'}>
                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <textarea
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      placeholder={`Quoi de neuf${user?.prenom ? `, ${user.prenom}` : ''} ?`}
                      className={`w-full border-none outline-none resize-none placeholder-gray-500 bg-transparent transition-all duration-300 ${
                        isPostBoxSticky ? 'text-base' : 'text-lg'
                      }`}
                      rows={isPostBoxSticky ? "2" : "3"}
                      maxLength="280"
                    />
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center space-x-4">
                        <button 
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          className="text-blue-500 hover:bg-blue-50 p-2 rounded-full transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                        <span className="text-sm text-gray-500">{newPost.length}/280</span>
                      </div>
                      
                      <button
                        onClick={handleCreatePost}
                        disabled={!newPost.trim() || isPosting}
                        className={`bg-black text-white font-medium rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 ${
                          isPostBoxSticky ? 'px-4 py-2 text-sm' : 'px-6 py-3'
                        }`}
                      >
                        {isPosting ? 'Publication...' : 'Publier'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages d'erreur - STYLE ORIGINAL CONSERVÉ */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <div className="flex">
                  <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Une erreur s'est produite</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Posts - STYLE ORIGINAL CONSERVÉ */}
            <div className="space-y-6">
              {isLoading && posts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                  <p className="text-gray-500 mt-4">Chargement des posts...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10m0 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m10 0v10a2 2 0 01-2 2H9a2 2 0 01-2-2V8m10 0H7m0 0v10a2 2 0 002 2h10a2 2 0 002-2V8" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Aucun post pour le moment
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                    {getEmptyStateMessage()}
                  </p>
                </div>
              ) : (
                <>
                  {posts.map((post, index) => (
                    <article
                      key={post.id_post}
                      className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="p-6">
                        {/* En-tête du post - STYLE ORIGINAL CONSERVÉ */}
                        <header className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div 
                              className={`w-11 h-11 rounded-full overflow-hidden bg-gradient-to-br ${getRandomGradient(index)} flex items-center justify-center text-white font-bold`}
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
                            
                            <div className="min-w-0">
                              <div className="flex items-center space-x-2">
                                <h3 className="font-semibold text-gray-900 truncate">
                                  {post.author?.username || post.user?.username || 'Utilisateur'}
                                </h3>
                                {(post.author?.certified || post.user?.certified) && (
                                  <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              <p className="text-sm text-gray-500">
                                {formatDate(post.created_at)}
                              </p>
                            </div>
                          </div>

                          <button className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>
                        </header>

                        {/* Contenu du post - STYLE ORIGINAL CONSERVÉ */}
                        <div className="mb-5">
                          <p 
                            className="text-gray-900 leading-relaxed whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{ __html: formatContent(post.content) }}
                          />

                          {/* Tags - STYLE ORIGINAL CONSERVÉ */}
                          {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-4">
                              {post.tags.map((tag, tagIndex) => (
                                <span 
                                  key={tagIndex}
                                  className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Actions du post - STYLE ORIGINAL CONSERVÉ avec fonctionnalités corrigées */}
                        <footer className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex items-center space-x-6">
                            {/* ✅ CORRECTION: Bouton Like fonctionnel */}
                            <button 
                              onClick={() => handleLike(post.id_post)}
                              className={`flex items-center space-x-2 transition-colors duration-200 ${
                                post.isLikedByCurrentUser || post.isLiked
                                  ? 'text-red-500 hover:text-red-600' 
                                  : 'text-gray-500 hover:text-red-500'
                              }`}
                            >
                              <svg className="w-5 h-5" fill={post.isLikedByCurrentUser || post.isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                              <span className="text-sm font-medium">
                                {post.likeCount || post.likesCount || post._aggr_count_likes || 0}
                              </span>
                            </button>

                            {/* ✅ CORRECTION: Bouton Commentaires fonctionnel */}
                            <button 
                              onClick={() => toggleComments(post.id_post)}
                              className={`flex items-center space-x-2 transition-colors duration-200 ${
                                showComments[post.id_post] ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'
                              }`}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              <span className="text-sm font-medium">
                                {post.replyCount || post.commentCount || post._aggr_count_replies || 0}
                              </span>
                            </button>

                            {/* Bouton Partager - STYLE ORIGINAL CONSERVÉ */}
                            <button className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors duration-200">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                              </svg>
                            </button>
                          </div>
                        </footer>

                        {/* ✅ CORRECTION: Section des commentaires avec style original */}
                        {showComments[post.id_post] && (
                          <div className="mt-6 pt-6 border-t border-gray-100">
                            {/* Zone de saisie de commentaire - STYLE ORIGINAL CONSERVÉ */}
                            <div className="flex space-x-3 mb-6">
                              <div 
                                className={`w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br ${getRandomGradient(0)} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}
                              >
                                {user?.photo_profil ? (
                                  <img src={user.photo_profil} alt="Profil" className="w-full h-full object-cover" />
                                ) : (
                                  user?.username?.charAt(0).toUpperCase() || 'U'
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="relative">
                                  <textarea
                                    value={newComment[post.id_post] || ''}
                                    onChange={(e) => setNewComment(prev => ({ ...prev, [post.id_post]: e.target.value }))}
                                    placeholder="Écrire un commentaire..."
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500"
                                    rows="2"
                                    maxLength="280"
                                  />
                                  <div className="flex items-center justify-between mt-3">
                                    <span className="text-xs text-gray-400">
                                      {(newComment[post.id_post] || '').length}/280
                                    </span>
                                    <button
                                      onClick={() => handleComment(post.id_post)}
                                      disabled={!newComment[post.id_post]?.trim() || isPostingComment[post.id_post]}
                                      className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                      {isPostingComment[post.id_post] ? 'Envoi...' : 'Commenter'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* ✅ CORRECTION: Liste des commentaires avec style original */}
                            <div className="space-y-4">
                              {comments[post.id_post] && comments[post.id_post].length > 0 ? (
                                comments[post.id_post].map((comment) => (
                                  <div key={comment.id_post} className="flex space-x-3">
                                    <div 
                                      className={`w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br ${getRandomGradient(1)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
                                    >
                                      {comment.author?.photo_profil || comment.user?.photo_profil ? (
                                        <img 
                                          src={comment.author?.photo_profil || comment.user?.photo_profil} 
                                          alt="Profil" 
                                          className="w-full h-full object-cover" 
                                        />
                                      ) : (
                                        (comment.author?.username || comment.user?.username || 'U').charAt(0).toUpperCase()
                                      )}
                                    </div>
                                    <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <span className="font-medium text-sm text-gray-900">
                                          {comment.author?.username || comment.user?.username || 'Utilisateur'}
                                        </span>
                                        {(comment.author?.certified || comment.user?.certified) && (
                                          <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                          </svg>
                                        )}
                                        <span className="text-xs text-gray-500">
                                          {formatDate(comment.created_at)}
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-800 whitespace-pre-wrap">
                                        {comment.content}
                                      </p>
                                      
                                      {/* Actions du commentaire - STYLE ORIGINAL CONSERVÉ */}
                                      <div className="flex items-center space-x-4 mt-3">
                                        <button 
                                          onClick={() => handleLike(comment.id_post)}
                                          className={`flex items-center space-x-1 text-xs transition-colors ${
                                            comment.isLiked || comment.isLikedByCurrentUser
                                              ? 'text-red-500 hover:text-red-600' 
                                              : 'text-gray-500 hover:text-red-500'
                                          }`}
                                        >
                                          <svg className="w-3 h-3" fill={comment.isLiked || comment.isLikedByCurrentUser ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                          </svg>
                                          <span>{comment.likeCount || comment.likesCount || 0}</span>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-center text-gray-500 text-sm py-8">
                                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                  </div>
                                  <p className="font-medium">Aucun commentaire pour le moment</p>
                                  <p className="text-xs text-gray-400 mt-1">Soyez le premier à réagir !</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </article>
                  ))}

                  {/* Bouton charger plus - STYLE ORIGINAL CONSERVÉ */}
                  {pagination.hasNext && (
                    <div className="text-center py-8">
                      <button
                        onClick={loadMorePosts}
                        disabled={isLoading}
                        className="bg-white text-gray-700 px-8 py-3 rounded-full font-medium hover:bg-gray-50 transition-colors border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      >
                        {isLoading ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                            <span>Chargement...</span>
                          </div>
                        ) : 'Charger plus'}
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

      {/* Menu mobile overlay - STYLE ORIGINAL CONSERVÉ */}
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
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Erreur de chargement</h2>
          <p className="text-gray-600 mb-6">Une erreur s'est produite lors du chargement du feed.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-black text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors"
          >
            Recharger la page
          </button>
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-6 text-left">
              <summary className="text-sm text-gray-500 cursor-pointer">Détails de l'erreur</summary>
              <pre className="mt-2 text-xs bg-gray-100 p-3 rounded-lg overflow-auto max-h-32">
                {renderError.toString()}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }
};

export default Feed;