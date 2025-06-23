// src/components/PostDetail.jsx - Mis à jour pour conversations hiérarchiques

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useFeedStore from '../stores/feedStore';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import CommentThread from './CommentThread';

const PostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // États pour le post principal
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // États pour les commentaires
  const [conversation, setConversation] = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [viewMode, setViewMode] = useState('tree'); // 'tree' ou 'flat'
  
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

  const getInitials = (userObj) => {
    if (!userObj) return '?';
    const firstInitial = userObj.prenom?.[0]?.toUpperCase() || userObj.username?.[0]?.toUpperCase() || '';
    const lastInitial = userObj.nom?.[0]?.toUpperCase() || '';
    return firstInitial + lastInitial || '?';
  };

  // Fonction d'appel API authentifiée
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

  // Charger le post principal
  const fetchPost = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await makeAuthenticatedRequest(`/api/v1/posts/${postId}`);

      if (response.ok) {
        const postData = await response.json();
        setPost(postData);
        document.title = `${postData.author?.username || 'Post'} sur Breezy`;
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

  // Charger la conversation complète (mode arbre)
  const fetchConversation = async () => {
    try {
      setIsLoadingComments(true);
      console.log('🔄 Fetching conversation for post:', postId);
      
      const response = await makeAuthenticatedRequest(`/api/v1/posts/${postId}/conversation?maxDepth=999`);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Conversation loaded:', data.conversation?.length || 0, 'top-level comments');
        setConversation(data.conversation || []);
      } else if (response.status !== 404) {
        console.error('❌ Erreur chargement conversation:', response.status);
      }
    } catch (error) {
      console.error('❌ Erreur chargement conversation:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  // Poster un commentaire principal
  const handlePostComment = async () => {
    if (!newComment.trim() || isPostingComment) return;

    try {
      setIsPostingComment(true);
      console.log('🔄 Posting main comment to post:', postId);
      
      const response = await makeAuthenticatedRequest(`/api/v1/posts/${postId}/reply`, {
        method: 'POST',
        body: JSON.stringify({
          content: newComment.trim()
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Comment posted successfully:', data.reply);
        
        // Ajouter le nouveau commentaire à la conversation
        setConversation(prev => [...prev, { ...data.reply, replies: [] }]);
        setNewComment('');
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

  // Fonction de like
  const handleLike = async () => {
    if (!post || pendingLikes.has(post.id_post)) return;
    
    try {
      await toggleLike(post.id_post);
      
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

  // Fonction de partage
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
        
        const notification = document.createElement('div');
        notification.textContent = 'Lien copié dans le presse-papiers !';
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg z-50';
        document.body.appendChild(notification);
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 3000);
      }
    } catch (error) {
      console.error('❌ Erreur partage:', error);
    }
  };

  // Callback quand une réponse est ajoutée dans l'arbre
  const handleReplyAdded = (newReply, parentId) => {
    console.log('🔄 Adding reply to conversation tree:', newReply.id_post, 'parent:', parentId);
    
    // Fonction récursive pour ajouter la réponse au bon endroit dans l'arbre
    const addReplyToTree = (comments) => {
      return comments.map(comment => {
        if (comment.id_post === parentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), { ...newReply, replies: [] }]
          };
        } else if (comment.replies && comment.replies.length > 0) {
          return {
            ...comment,
            replies: addReplyToTree(comment.replies)
          };
        }
        return comment;
      });
    };

    setConversation(prev => addReplyToTree(prev));
  };

  // Fonction pour compter le total de messages dans la conversation
  const countTotalMessages = (comments) => {
    return comments.reduce((total, comment) => {
      return total + 1 + (comment.replies ? countTotalMessages(comment.replies) : 0);
    }, 0);
  };

  // Effects
  useEffect(() => {
    if (postId) {
      fetchPost();
      fetchConversation();
    }
  }, [postId]);

  // Chargement initial
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex max-w-7xl mx-auto">
          <div className="hidden lg:block lg:w-64 lg:fixed lg:h-full">
            <LeftSidebar />
          </div>
          
          <main className="flex-1 lg:ml-64 lg:mr-80">
            <div className="max-w-3xl mx-auto px-4 py-6 lg:px-8 overflow-hidden"> {/* ✅ AJOUT: overflow-hidden */}
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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

  // Erreur
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex max-w-7xl mx-auto">
          <div className="hidden lg:block lg:w-64 lg:fixed lg:h-full">
            <LeftSidebar />
          </div>
          
          <main className="flex-1 lg:ml-64 lg:mr-80">
            <div className="max-w-3xl mx-auto px-4 py-6 lg:px-8">
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
              <div className="text-center py-8">
                <button
                  onClick={() => navigate('/feed')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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

  const totalMessages = countTotalMessages(conversation);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Menu mobile overlay */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowMobileMenu(false)}></div>
          <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg">
            <LeftSidebar onClose={() => setShowMobileMenu(false)} />
          </div>
        </div>
      )}

      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar gauche */}
        <div className="hidden lg:block lg:w-64 lg:fixed lg:h-full">
          <LeftSidebar />
        </div>
        
        {/* Contenu principal */}
        <main className="flex-1 lg:ml-64 lg:mr-80 min-w-0"> {/* ✅ AJOUT: min-w-0 pour forcer la compression */}
          <div className="max-w-3xl mx-auto px-4 py-6 lg:px-8">
            
            {/* Header mobile */}
            <div className="lg:hidden mb-4 flex items-center justify-between">
              <button
                onClick={() => setShowMobileMenu(true)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-xl font-bold">Breezy</h1>
              <div className="w-10"></div>
            </div>

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
                    <div className={`w-12 h-12 bg-gradient-to-br ${getRandomGradient(0)} rounded-full flex items-center justify-center text-white font-semibold`}>
                      {getInitials(post.author)}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900">
                        {post.author?.username || 'Utilisateur'}
                      </h3>
                      {post.author?.certified && (
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
                
                {/* Menu actions */}
                <div className="relative">
                  <button className="p-2 hover:bg-gray-100 rounded-full">
                    <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Contenu du post */}
              <div className="mb-6">
                <p className="text-gray-900 text-lg leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </p>
              </div>

              {/* Actions du post */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-4">
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
                    <span className="font-medium">{totalMessages}</span>
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

            {/* Section conversation */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 overflow-hidden"> {/* ✅ AJOUT: overflow-hidden */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Conversation ({totalMessages} message{totalMessages > 1 ? 's' : ''})
                </h3>
              </div>

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
                      placeholder="Que pensez-vous de ce post ?"
                      className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                      maxLength="280"
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-gray-500">
                        {280 - newComment.length} caractères restants
                      </span>
                      <button
                        onClick={handlePostComment}
                        disabled={!newComment.trim() || isPostingComment}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isPostingComment ? 'Publication...' : 'Publier'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conversation hiérarchique */}
              {isLoadingComments ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Chargement de la conversation...</p>
                </div>
              ) : conversation.length > 0 ? (
                <div className="space-y-4 overflow-hidden"> {/* ✅ AJOUT: overflow-hidden */}
                  {conversation.map((comment) => (
                    <CommentThread
                      key={comment.id_post}
                      comment={comment}
                      postId={postId}
                      user={user}
                      onReplyAdded={handleReplyAdded}
                      depth={0}
                      maxDepth={999}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p>Aucun commentaire pour le moment</p>
                  <p className="text-sm">Commencez la conversation !</p>
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