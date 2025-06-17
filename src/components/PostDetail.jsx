// src/components/PostDetail.jsx - Endpoints corrigés sans altération du style

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useFeedStore from '../stores/feedStore';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';

const PostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // États pour le post principal
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // États pour les commentaires
  const [comments, setComments] = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  
  // États UI
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Store pour les likes
  const { toggleLike, pendingLikes } = useFeedStore();

  // Fonctions utilitaires
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  const getInitials = (user) => {
    if (!user) return '?';
    const firstInitial = user.prenom?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || '';
    const lastInitial = user.nom?.[0]?.toUpperCase() || '';
    return firstInitial + lastInitial || '?';
  };

  // ✅ CORRECTION: Fonction d'appel API authentifiée réutilisable
  const makeAuthenticatedRequest = async (url, options = {}) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('Non authentifié');
    }

    return fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
  };

  // ✅ CORRECTION: Charger le post principal avec gestion d'erreur améliorée
  const fetchPost = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await makeAuthenticatedRequest(`/api/v1/posts/${postId}`);

      if (response.ok) {
        const postData = await response.json();
        setPost(postData);
        
        // Mettre à jour le titre de la page
        document.title = `${postData.author?.username || 'Post'} sur Cercle`;
      } else if (response.status === 404) {
        setError('Post introuvable');
      } else if (response.status === 401) {
        setError('Non autorisé - veuillez vous reconnecter');
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Erreur lors du chargement du post');
      }
    } catch (error) {
      console.error('❌ Erreur chargement post:', error);
      setError('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ CORRECTION: Charger les commentaires avec endpoint correct
  const fetchComments = async () => {
    try {
      setIsLoadingComments(true);
      
      const response = await makeAuthenticatedRequest(`/api/v1/posts/${postId}/replies?limit=50`);

      if (response.ok) {
        const data = await response.json();
        setComments(data.replies || []);
      } else if (response.status !== 404) {
        // Si 404, c'est normal (pas de commentaires)
        console.error('❌ Erreur chargement commentaires:', response.status);
      }
    } catch (error) {
      console.error('❌ Erreur chargement commentaires:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  // ✅ CORRECTION: Poster un commentaire avec structure correcte
  const handlePostComment = async () => {
    if (!newComment.trim() || isPostingComment) return;

    try {
      setIsPostingComment(true);
      
      const response = await makeAuthenticatedRequest('/api/v1/posts', {
        method: 'POST',
        body: JSON.stringify({
          content: newComment.trim(),
          post_parent: parseInt(postId), // ✅ CORRECTION: Référence au post parent
          id_message_type: 1
        })
      });

      if (response.ok) {
        setNewComment('');
        await fetchComments(); // Recharger les commentaires
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Erreur post commentaire:', errorData.message || response.status);
      }
    } catch (error) {
      console.error('❌ Erreur réseau commentaire:', error);
    } finally {
      setIsPostingComment(false);
    }
  };

  // ✅ CORRECTION: Fonction de like avec store
  const handleLike = async () => {
    if (!post || pendingLikes.has(post.id_post)) return;
    
    try {
      await toggleLike(post.id_post);
      
      // Mettre à jour le post local
      setPost(prev => ({
        ...prev,
        isLiked: !prev.isLiked,
        likeCount: prev.isLiked 
          ? Math.max(0, (prev.likeCount || 0) - 1)
          : (prev.likeCount || 0) + 1
      }));
    } catch (error) {
      console.error('❌ Erreur toggle like:', error);
    }
  };

  // ✅ CORRECTION: Fonction de partage améliorée
  const handleShare = async () => {
    const shareData = {
      title: `Post de ${post.author?.username}`,
      text: post.content,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        
        // Notification simple
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
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
      }
    } catch (error) {
      console.error('❌ Erreur partage:', error);
    }
  };

  // Chargement initial
  useEffect(() => {
    if (postId) {
      fetchPost();
      fetchComments();
    }
  }, [postId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex max-w-7xl mx-auto">
          <div className="hidden lg:block lg:w-64 lg:fixed lg:h-full">
            <LeftSidebar />
          </div>
          
          <main className="flex-1 lg:ml-64 lg:mr-80">
            <div className="max-w-3xl mx-auto px-4 py-6 lg:px-8">
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
                <p className="text-gray-600">Chargement du post...</p>
              </div>
            </div>
          </main>
          
          <div className="hidden lg:block lg:w-80 lg:fixed lg:right-0 lg:h-full">
            <RightSidebar />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex max-w-7xl mx-auto">
          <div className="hidden lg:block lg:w-64 lg:fixed lg:h-full">
            <LeftSidebar />
          </div>
          
          <main className="flex-1 lg:ml-64 lg:mr-80">
            <div className="max-w-3xl mx-auto px-4 py-6 lg:px-8">
              <div className="text-center py-12">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <div className="text-red-600 font-medium mb-2">Erreur</div>
                  <p className="text-red-700 mb-4">{error}</p>
                  <button
                    onClick={() => navigate(-1)}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    Retour
                  </button>
                </div>
              </div>
            </div>
          </main>
          
          <div className="hidden lg:block lg:w-80 lg:fixed lg:right-0 lg:h-full">
            <RightSidebar />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex max-w-7xl mx-auto">
          <div className="hidden lg:block lg:w-64 lg:fixed lg:h-full">
            <LeftSidebar />
          </div>
          
          <main className="flex-1 lg:ml-64 lg:mr-80">
            <div className="max-w-3xl mx-auto px-4 py-6 lg:px-8">
              <div className="text-center py-12">
                <p className="text-gray-600">Post introuvable</p>
              </div>
            </div>
          </main>
          
          <div className="hidden lg:block lg:w-80 lg:fixed lg:right-0 lg:h-full">
            <RightSidebar />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar gauche */}
        <div className="hidden lg:block lg:w-64 lg:fixed lg:h-full">
          <LeftSidebar />
        </div>
        
        {/* Contenu principal */}
        <main className="flex-1 lg:ml-64 lg:mr-80">
          <div className="max-w-3xl mx-auto px-4 py-6 lg:px-8">
            
            {/* Bouton retour */}
            <div className="mb-6">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Retour
              </button>
            </div>

            {/* Post principal */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              {/* En-tête du post */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {post.author?.photo_profil ? (
                    <img
                      src={post.author.photo_profil}
                      alt={post.author.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className={`w-12 h-12 bg-gradient-to-br ${getRandomGradient(0)} rounded-full flex items-center justify-center text-white font-semibold text-lg`}>
                      {getInitials(post.author)}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900">{post.author?.username}</h3>
                      {post.author?.certified && (
                        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{formatDate(post.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Contenu du post */}
              <div className="mb-6">
                <p className="text-gray-900 text-lg leading-relaxed whitespace-pre-wrap">{post.content}</p>
              </div>

              {/* Actions du post */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-6">
                  {/* Like */}
                  <button
                    onClick={handleLike}
                    disabled={pendingLikes.has(post.id_post)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      post.isLiked 
                        ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                        : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                    } ${pendingLikes.has(post.id_post) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <svg className="w-5 h-5" fill={post.isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span className="font-medium">{post.likeCount || 0}</span>
                  </button>

                  {/* Commentaire */}
                  <button
                    onClick={() => document.getElementById('comment-input')?.focus()}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="font-medium">{comments.length}</span>
                  </button>
                </div>

                {/* Partage */}
                <button
                  onClick={handleShare}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 hover:text-green-600 hover:bg-green-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  <span className="font-medium">Partager</span>
                </button>
              </div>
            </div>

            {/* Section commentaires */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Commentaires ({comments.length})
              </h3>

              {/* Formulaire nouveau commentaire */}
              <div className="mb-6">
                <div className="flex space-x-3">
                  {user?.photo_profil ? (
                    <img
                      src={user.photo_profil}
                      alt={user.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className={`w-10 h-10 bg-gradient-to-br ${getRandomGradient(0)} rounded-full flex items-center justify-center text-white font-semibold`}>
                      {getInitials(user)}
                    </div>
                  )}
                  <div className="flex-1">
                    <textarea
                      id="comment-input"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Écrivez un commentaire..."
                      className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-black focus:border-transparent"
                      rows="3"
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={handlePostComment}
                        disabled={!newComment.trim() || isPostingComment}
                        className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isPostingComment ? 'Publication...' : 'Publier'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Liste des commentaires */}
              {isLoadingComments ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black mx-auto"></div>
                  <p className="text-gray-600 mt-2">Chargement des commentaires...</p>
                </div>
              ) : comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((comment, index) => (
                    <div key={comment.id_post} className="flex space-x-3 p-4 bg-gray-50 rounded-lg">
                      {comment.author?.photo_profil ? (
                        <img
                          src={comment.author.photo_profil}
                          alt={comment.author.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className={`w-10 h-10 bg-gradient-to-br ${getRandomGradient(index)} rounded-full flex items-center justify-center text-white font-semibold`}>
                          {getInitials(comment.author)}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold text-gray-900">{comment.author?.username}</h4>
                          {comment.author?.certified && (
                            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                          <span className="text-sm text-gray-500">{formatDate(comment.created_at)}</span>
                        </div>
                        <p className="text-gray-900 whitespace-pre-wrap">{comment.content}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <button
                            onClick={() => toggleLike(comment.id_post)}
                            className={`flex items-center space-x-1 text-sm ${
                              comment.isLiked 
                                ? 'text-red-600' 
                                : 'text-gray-500 hover:text-red-600'
                            } transition-colors`}
                          >
                            <svg className="w-4 h-4" fill={comment.isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <span>{comment.likeCount || 0}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p>Aucun commentaire pour le moment</p>
                  <p className="text-sm">Soyez le premier à commenter ce post !</p>
                </div>
              )}
            </div>
          </div>
        </main>
        
        {/* Sidebar droite */}
        <div className="hidden lg:block lg:w-80 lg:fixed lg:right-0 lg:h-full">
          <RightSidebar />
        </div>
      </div>
    </div>
  );
};

export default PostDetail;