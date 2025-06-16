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

      const page = reset ? 1 : pagination.page;
      const endpoint = getAPIEndpoint();
      
      console.log('🔄 Fetching posts from:', endpoint, 'page:', page);

      const response = await fetch(`${endpoint}?page=${page}&limit=${pagination.limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Posts fetched successfully:', data);

        const newPosts = data.posts || [];
        setPosts(reset ? newPosts : [...posts, ...newPosts]);
        setPagination({
          page: data.pagination?.page || page,
          limit: data.pagination?.limit || pagination.limit,
          hasNext: data.pagination?.hasNext || false,
          total: data.pagination?.total || 0
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error fetching posts:', response.status, errorData);
        setError(errorData.message || 'Erreur lors du chargement des posts');
      }
    } catch (error) {
      console.error('❌ Network error fetching posts:', error);
      setError('Erreur de connexion lors du chargement des posts');
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
          content: newPost.trim(),
          id_message_type: 1
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Post created successfully:', data);
        
        // Ajouter le nouveau post en haut de la liste
        setPosts(prevPosts => [data.post, ...prevPosts]);
        setNewPost('');
        
        // Faire défiler vers le haut pour voir le nouveau post
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error creating post:', errorData);
        setError(errorData.message || 'Erreur lors de la création du post');
      }
    } catch (error) {
      console.error('❌ Network error creating post:', error);
      setError('Erreur de connexion lors de la création du post');
    } finally {
      setIsPosting(false);
    }
  };

  // ✅ CORRECTION: Fonction handleLike avec persistance améliorée
  const handleLike = async (postId) => {
    if (!user?.id_user) {
      setError('Vous devez être connecté pour liker');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      
      // ✅ OPTIMISTIC UPDATE: Mettre à jour l'UI immédiatement
      const currentPost = posts.find(p => p.id_post === postId);
      const wasLiked = currentPost?.isLikedByCurrentUser || currentPost?.isLiked;
      
      // Mettre à jour l'état local immédiatement pour une UX fluide
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id_post === postId
            ? { 
                ...post, 
                isLiked: !wasLiked,
                isLikedByCurrentUser: !wasLiked,
                likeCount: wasLiked ? (post.likeCount || 0) - 1 : (post.likeCount || 0) + 1,
                likesCount: wasLiked ? (post.likesCount || 0) - 1 : (post.likesCount || 0) + 1
              }
            : post
        )
      );

      console.log('🔄 Sending like request for post:', postId);
      
      const response = await fetch(`/api/v1/likes/posts/${postId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Like response:', data);
        
        // ✅ CORRECTION: Synchroniser avec la réponse du serveur
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id_post === postId
              ? { 
                  ...post, 
                  isLiked: data.isLiked,
                  isLikedByCurrentUser: data.isLiked,
                  likeCount: data.likeCount,
                  likesCount: data.likeCount
                }
              : post
          )
        );
        
      } else {
        // ✅ ROLLBACK: Annuler le changement optimiste en cas d'erreur
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id_post === postId
              ? { 
                  ...post, 
                  isLiked: wasLiked,
                  isLikedByCurrentUser: wasLiked,
                  likeCount: wasLiked ? (post.likeCount || 0) + 1 : (post.likeCount || 0) - 1,
                  likesCount: wasLiked ? (post.likesCount || 0) + 1 : (post.likesCount || 0) - 1
                }
              : post
          )
        );
        
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Like error response:', errorData);
        setError('Erreur lors du like');
      }
    } catch (error) {
      console.error('❌ Error liking post:', error);
      setError('Erreur de connexion lors du like');
      
      // ✅ ROLLBACK en cas d'erreur réseau
      const wasLiked = !posts.find(p => p.id_post === postId)?.isLikedByCurrentUser;
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id_post === postId
            ? { 
                ...post, 
                isLiked: wasLiked,
                isLikedByCurrentUser: wasLiked,
                likeCount: wasLiked ? (post.likeCount || 0) + 1 : (post.likeCount || 0) - 1,
                likesCount: wasLiked ? (post.likesCount || 0) + 1 : (post.likesCount || 0) - 1
              }
            : post
        )
      );
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
      
      console.log('🔄 Posting comment:', { postId, comment, userFromContext: user?.id_user });
      
      // ✅ CORRECTION: Utiliser POST /api/v1/posts avec post_parent au lieu de replies
      const response = await fetch('/api/v1/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: comment.trim(),
          post_parent: parseInt(postId), // ✅ IMPORTANT: Spécifier le post parent
          id_message_type: 1 // Type normal de message
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Comment posted successfully:', data);
        
        // Vider le champ de commentaire
        setNewComment(prev => ({ ...prev, [postId]: '' }));
        
        // Recharger les commentaires pour ce post
        await loadComments(postId);
        
        // Optionnel: Afficher un message de succès
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

  // ✅ AJOUT: Fonction pour s'assurer que l'état des likes est à jour
  const refreshPostLikeStatus = async (postId) => {
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`/api/v1/likes/posts/${postId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id_post === postId
              ? { 
                  ...post, 
                  isLiked: data.isLikedByCurrentUser,
                  isLikedByCurrentUser: data.isLikedByCurrentUser,
                  likeCount: data.likeCount,
                  likesCount: data.likeCount
                }
              : post
          )
        );
      }
    } catch (error) {
      console.error('❌ Error refreshing like status:', error);
    }
  };

  // ✅ UTILISATION: Appeler cette fonction après navigation si nécessaire
  useEffect(() => {
    // Rafraîchir l'état des likes après chargement des posts
    if (posts.length > 0 && user?.id_user) {
      // posts.forEach(post => {
      //   refreshPostLikeStatus(post.id_post);
      // });
    }
  }, [posts.length, user?.id_user]);

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

              {/* Box de création de post */}
              <div
                ref={postBoxRef}
                className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all duration-300 ${
                  isPostBoxSticky ? 'lg:sticky lg:top-4 lg:z-10' : ''
                }`}
              >
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
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500"
                      rows="3"
                      maxLength="280"
                    />
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-400">
                          {newPost.length}/280
                        </span>
                      </div>
                      <button
                        onClick={handleCreatePost}
                        disabled={!newPost.trim() || isPosting}
                        className="bg-black text-white px-6 py-2 rounded-full font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isPosting ? 'Publication...' : 'Publier'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Message d'erreur */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <svg className="w-5 h-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{error}</p>
                      <button
                        onClick={() => setError('')}
                        className="text-xs text-red-600 hover:text-red-800 mt-1"
                      >
                        Fermer
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Liste des posts */}
              <div className="space-y-6">
                {isLoading && posts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
                    <p className="text-gray-600">Chargement des posts...</p>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-5xl mb-4">📝</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun post pour le moment</h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      {getEmptyStateMessage()}
                    </p>
                  </div>
                ) : (
                  posts.map((post, index) => (
                    <div key={post.id_post} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      {/* En-tête du post */}
                      <div className="p-6 pb-4">
                        <div className="flex items-start space-x-3">
                          <div 
                            className={`w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br ${getRandomGradient(index)} flex items-center justify-center text-white font-bold flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-500 hover:ring-offset-2 transition-all`}
                            onClick={() => navigate(`/profile/${post.author?.id_user || post.user?.id_user}`)}
                          >
                            {(post.author?.photo_profil || post.user?.photo_profil) ? (
                              <img 
                                src={post.author?.photo_profil || post.user?.photo_profil} 
                                alt="Profil" 
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              (post.author?.username || post.user?.username)?.charAt(0).toUpperCase() || 'U'
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <h3 
                                className="font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                                onClick={() => navigate(`/profile/${post.author?.id_user || post.user?.id_user}`)}
                              >
                                {post.author?.username || post.user?.username}
                                {(post.author?.certified || post.user?.certified) && (
                                  <span className="ml-1 text-blue-500">✓</span>
                                )}
                              </h3>
                              <span className="text-gray-500 text-sm">·</span>
                              <span className="text-gray-500 text-sm">
                                {formatDate(post.created_at)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              {post.author?.nom && post.author?.prenom ? `${post.author.prenom} ${post.author.nom}` : 
                               post.user?.nom && post.user?.prenom ? `${post.user.prenom} ${post.user.nom}` : ''}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Contenu du post */}
                      <div className="px-6 pb-4">
                        <div 
                          className="text-gray-900 text-base leading-relaxed whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{ __html: formatContent(post.content) }}
                        />
                        
                        {/* Tags */}
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {post.tags.map((tag, tagIndex) => (
                              <span key={tagIndex} className="text-blue-600 text-sm">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions du post */}
                      <div className="px-6 py-4 border-t border-gray-100">
                        <div className="flex items-center space-x-6">
                          <button 
                            onClick={() => handleLike(post.id_post)}
                            className={`flex items-center space-x-2 text-sm transition-colors ${
                              post.isLiked || post.isLikedByCurrentUser
                                ? 'text-red-500 hover:text-red-600' 
                                : 'text-gray-500 hover:text-red-500'
                            }`}
                          >
                            <svg className="w-5 h-5" fill={post.isLiked || post.isLikedByCurrentUser ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <span>{post.likeCount || post.likesCount || 0}</span>
                          </button>

                          <button 
                            onClick={() => toggleComments(post.id_post)}
                            className="flex items-center space-x-2 text-sm text-gray-500 hover:text-blue-500 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span>{post.replyCount || 0}</span>
                          </button>

                          <button className="flex items-center space-x-2 text-sm text-gray-500 hover:text-green-500 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            <span>Partager</span>
                          </button>
                        </div>
                      </div>

                      {/* Section commentaires */}
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
                                        (comment.author?.username || comment.user?.username)?.charAt(0).toUpperCase() || 'U'
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center space-x-2">
                                        <span className="font-medium text-gray-900 text-sm">
                                          {comment.author?.username || comment.user?.username}
                                          {(comment.author?.certified || comment.user?.certified) && (
                                            <span className="ml-1 text-blue-500 text-xs">✓</span>
                                          )}
                                        </span>
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
                                          <span>{comment.likeCount || 0}</span>
                                        </button>
                                        
                                        <button className="text-xs text-gray-500 hover:text-blue-500 transition-colors">
                                          Répondre
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-center py-6">
                                  <p className="text-gray-500 text-sm">Aucun commentaire pour le moment</p>
                                  <p className="text-gray-400 text-xs">Soyez le premier à commenter !</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}

                {/* Bouton charger plus */}
                {pagination.hasNext && !isLoading && (
                  <div className="text-center py-6">
                    <button
                      onClick={() => fetchPosts(false)}
                      className="bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-full font-medium hover:bg-gray-50 transition-colors"
                    >
                      Charger plus de posts
                    </button>
                  </div>
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