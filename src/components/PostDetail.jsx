// src/components/PostDetail.jsx - Page dédiée à un post individuel

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

  // ✅ Charger le post principal
  const fetchPost = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Non authentifié');
        return;
      }

      const response = await fetch(`/api/v1/posts/${postId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const postData = await response.json();
        setPost(postData);
        
        // Mettre à jour le titre de la page
        document.title = `${postData.author?.username || 'Post'} sur Cercle`;
      } else if (response.status === 404) {
        setError('Post introuvable');
      } else {
        setError('Erreur lors du chargement du post');
      }
    } catch (error) {
      console.error('❌ Erreur chargement post:', error);
      setError('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Charger les commentaires
  const fetchComments = async () => {
    try {
      setIsLoadingComments(true);
      
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/v1/posts/${postId}/replies?limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setComments(data.replies || []);
      }
    } catch (error) {
      console.error('❌ Erreur chargement commentaires:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  // ✅ Poster un commentaire
  const handlePostComment = async () => {
    if (!newComment.trim() || isPostingComment) return;

    try {
      setIsPostingComment(true);
      
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/v1/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newComment.trim(),
          post_parent: parseInt(postId),
          id_message_type: 1
        })
      });

      if (response.ok) {
        setNewComment('');
        await fetchComments(); // Recharger les commentaires
      } else {
        console.error('❌ Erreur post commentaire');
      }
    } catch (error) {
      console.error('❌ Erreur réseau commentaire:', error);
    } finally {
      setIsPostingComment(false);
    }
  };

  // ✅ Fonction de partage
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
        
        // Notification
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
                <div className="text-red-500 text-4xl mb-4">❌</div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">{error}</h2>
                <button
                  onClick={() => navigate('/feed')}
                  className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Retour au feed
                </button>
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
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between fixed top-0 left-0 right-0 z-30">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h1 className="text-lg font-semibold text-gray-900">Post</h1>
        
        <button 
          onClick={() => setShowMobileMenu(true)}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Menu mobile */}
      {showMobileMenu && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowMobileMenu(false)}></div>
          <div className="fixed right-0 top-0 h-full w-64 bg-white shadow-xl">
            <LeftSidebar />
          </div>
        </div>
      )}

      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar gauche */}
        <div className="hidden lg:block lg:w-64 lg:fixed lg:h-full">
          <LeftSidebar />
        </div>

        {/* Contenu principal */}
        <main className="flex-1 lg:ml-64 lg:mr-80 pt-16 lg:pt-0">
          <div className="max-w-3xl mx-auto px-4 py-6 lg:px-8">
            
            {/* Bouton retour desktop */}
            <div className="hidden lg:block mb-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Retour</span>
              </button>
            </div>

            {/* Post principal */}
            {post && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
                <div className="p-6">
                  {/* Header du post */}
                  <div className="flex items-start space-x-4 mb-4">
                    <div 
                      className={`w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br ${getRandomGradient(0)} flex items-center justify-center text-white font-bold flex-shrink-0 cursor-pointer`}
                      onClick={() => navigate(`/profile/${post.author?.id_user || post.user?.id_user}`)}
                    >
                      {(post.author?.photo_profil || post.user?.photo_profil) ? (
                        <img 
                          src={post.author?.photo_profil || post.user?.photo_profil} 
                          alt="Profile" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        getInitials(post.author || post.user)
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h2 
                          className="font-bold text-lg text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={() => navigate(`/profile/${post.author?.id_user || post.user?.id_user}`)}
                        >
                          {post.author?.prenom && post.author?.nom 
                            ? `${post.author.prenom} ${post.author.nom}`
                            : post.user?.prenom && post.user?.nom
                            ? `${post.user.prenom} ${post.user.nom}`
                            : 'Utilisateur'
                          }
                        </h2>
                        {(post.author?.certified || post.user?.certified) && (
                          <span className="text-blue-500 text-lg">✓</span>
                        )}
                      </div>
                      <p className="text-gray-600">@{post.author?.username || post.user?.username}</p>
                    </div>
                  </div>

                  {/* Contenu du post */}
                  <div className="mb-6">
                    <p className="text-xl leading-relaxed text-gray-900 whitespace-pre-wrap">
                      {post.content}
                    </p>
                  </div>

                  {/* Timestamp détaillé */}
                  <div className="text-gray-500 text-sm mb-4 pb-4 border-b border-gray-100">
                    {formatDate(post.created_at)}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-around py-2 border-b border-gray-100">
                    <button
                      onClick={() => toggleLike(post.id_post)}
                      disabled={pendingLikes.has(post.id_post)}
                      className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
                        post.isLiked || post.isLikedByCurrentUser
                          ? 'text-red-600 bg-red-50 hover:bg-red-100'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <svg 
                        className={`w-6 h-6 ${
                          post.isLiked || post.isLikedByCurrentUser 
                            ? 'fill-current text-red-600' 
                            : 'stroke-current fill-none'
                        }`}
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span className="font-medium">{post.likeCount || post.likesCount || 0}</span>
                    </button>

                    <button className="flex items-center space-x-3 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span className="font-medium">{comments.length}</span>
                    </button>

                    <button 
                      onClick={handleShare}
                      className="flex items-center space-x-3 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                      <span className="font-medium">Partager</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Zone de commentaire */}
            {user && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex space-x-4">
                  <div className={`w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br ${getRandomGradient(1)} flex items-center justify-center text-white font-bold flex-shrink-0`}>
                    {user?.photo_profil ? (
                      <img src={user.photo_profil} alt="Your profile" className="w-full h-full object-cover" />
                    ) : (
                      getInitials(user)
                    )}
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Répondre à ce post..."
                      className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-black focus:border-transparent text-lg"
                      rows="3"
                      maxLength="280"
                    />
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-sm text-gray-500">
                        {newComment.length}/280
                      </span>
                      <button
                        onClick={handlePostComment}
                        disabled={!newComment.trim() || isPostingComment}
                        className="bg-black text-white px-6 py-2 rounded-full font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                      >
                        {isPostingComment ? 'Envoi...' : 'Répondre'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Liste des commentaires */}
            <div className="space-y-4">
              {isLoadingComments ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black mx-auto mb-2"></div>
                  <p className="text-gray-600 text-sm">Chargement des réponses...</p>
                </div>
              ) : comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.id_post} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-start space-x-4">
                      <div 
                        className={`w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br ${getRandomGradient(comment.id_post)} flex items-center justify-center text-white font-bold flex-shrink-0 cursor-pointer`}
                        onClick={() => navigate(`/profile/${comment.author?.id_user || comment.user?.id_user}`)}
                      >
                        {(comment.author?.photo_profil || comment.user?.photo_profil) ? (
                          <img 
                            src={comment.author?.photo_profil || comment.user?.photo_profil} 
                            alt="Profile" 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          getInitials(comment.author || comment.user)
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 
                            className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() => navigate(`/profile/${comment.author?.id_user || comment.user?.id_user}`)}
                          >
                            {comment.author?.prenom && comment.author?.nom 
                              ? `${comment.author.prenom} ${comment.author.nom}`
                              : comment.user?.prenom && comment.user?.nom
                              ? `${comment.user.prenom} ${comment.user.nom}`
                              : 'Utilisateur'
                            }
                          </h3>
                          <span className="text-gray-500">@{comment.author?.username || comment.user?.username}</span>
                          {(comment.author?.certified || comment.user?.certified) && (
                            <span className="text-blue-500">✓</span>
                          )}
                          <span className="text-gray-500 text-sm">·</span>
                          <span className="text-gray-500 text-sm">
                            {formatDate(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-gray-900 leading-relaxed whitespace-pre-wrap mb-3">
                          {comment.content}
                        </p>
                        <div className="flex items-center space-x-6">
                          <button
                            onClick={() => toggleLike(comment.id_post)}
                            className={`flex items-center space-x-1 text-sm transition-colors ${
                              comment.isLiked || comment.isLikedByCurrentUser
                                ? 'text-red-500 hover:text-red-600' 
                                : 'text-gray-500 hover:text-red-500'
                            }`}
                          >
                            <svg className="w-4 h-4" fill={comment.isLiked || comment.isLikedByCurrentUser ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <span>{comment.likeCount || 0}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                  <div className="text-gray-400 text-4xl mb-4">💬</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune réponse pour le moment</h3>
                  <p className="text-gray-600">
                    Soyez le premier à répondre à ce post !
                  </p>
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