// src/components/CommentItem.jsx - Version complète pour les réponses aux commentaires

import React, { useState } from 'react';

const CommentItem = ({ comment, postId, user, onReplyAdded }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isPostingReply, setIsPostingReply] = useState(false);
  const [replies, setReplies] = useState([]);
  const [showReplies, setShowReplies] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);

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

  // Fonction pour récupérer les réponses du commentaire
  const fetchReplies = async () => {
    if (loadingReplies) return;

    try {
      setLoadingReplies(true);
      console.log('🔄 Fetching replies for comment:', comment.id_post, 'in post:', postId);
      
      const response = await makeAuthenticatedRequest(
        `/api/v1/posts/${postId}/comments/${comment.id_post}/replies`
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Replies loaded:', data.replies?.length || 0);
        setReplies(data.replies || []);
        setShowReplies(true);
      } else {
        console.error('❌ Error loading replies:', response.status);
        const errorData = await response.json().catch(() => ({}));
        console.error('Error details:', errorData);
      }
    } catch (error) {
      console.error('❌ Network error loading replies:', error);
    } finally {
      setLoadingReplies(false);
    }
  };

  // Fonction pour répondre au commentaire
  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyContent.trim() || isPostingReply) return;

    try {
      setIsPostingReply(true);
      console.log('🔄 Posting reply to comment:', comment.id_post, 'in post:', postId);
      
      const response = await makeAuthenticatedRequest(
        `/api/v1/posts/${postId}/comments/${comment.id_post}/replies`,
        {
          method: 'POST',
          body: JSON.stringify({
            content: replyContent.trim()
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Reply posted successfully:', data.reply);
        
        // Ajouter la nouvelle réponse à la liste
        setReplies(prev => [...prev, data.reply]);
        setReplyContent('');
        setShowReplyForm(false);
        setShowReplies(true);
        
        // Notifier le parent si nécessaire
        if (onReplyAdded) {
          onReplyAdded(data.reply);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error posting reply:', errorData);
      }
    } catch (error) {
      console.error('❌ Network error posting reply:', error);
    } finally {
      setIsPostingReply(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (userObj) => {
    if (!userObj) return '?';
    const firstInitial = userObj.prenom?.[0]?.toUpperCase() || userObj.username?.[0]?.toUpperCase() || '';
    const lastInitial = userObj.nom?.[0]?.toUpperCase() || '';
    return firstInitial + lastInitial || '?';
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

  return (
    <div className="border-l-2 border-gray-100 pl-4 ml-4">
      {/* Commentaire principal */}
      <div className="bg-gray-50 rounded-lg p-4 mb-3">
        <div className="flex items-start space-x-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {comment.author?.photo_profil ? (
              <img
                src={comment.author.photo_profil}
                alt={comment.author.username}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getRandomGradient(0)} flex items-center justify-center text-white text-sm font-medium`}>
                {getInitials(comment.author)}
              </div>
            )}
          </div>

          {/* Contenu du commentaire */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="text-sm font-semibold text-gray-900">
                {comment.author?.username || 'Utilisateur'}
              </h4>
              {comment.author?.certified && (
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              <span className="text-xs text-gray-500">
                {formatDate(comment.created_at)}
              </span>
            </div>

            <p className="text-sm text-gray-800 mb-2">
              {comment.content}
            </p>

            {/* Actions du commentaire */}
            <div className="flex items-center space-x-4 text-xs">
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                Répondre
              </button>
              
              {/* Bouton pour voir les réponses */}
              <button
                onClick={() => showReplies ? setShowReplies(false) : fetchReplies()}
                className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
                disabled={loadingReplies}
              >
                {loadingReplies ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-gray-600 inline" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Chargement...
                  </>
                ) : showReplies ? (
                  'Masquer les réponses'
                ) : replies.length > 0 ? (
                  `Voir les réponses (${replies.length})`
                ) : (
                  'Voir les réponses'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Formulaire de réponse */}
        {showReplyForm && (
          <div className="mt-3 ml-11">
            <form onSubmit={handleReplySubmit} className="space-y-2">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={`Répondre à ${comment.author?.username}...`}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="2"
                maxLength="280"
                disabled={isPostingReply}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {280 - replyContent.length} caractères restants
                </span>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReplyForm(false);
                      setReplyContent('');
                    }}
                    className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
                    disabled={isPostingReply}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={!replyContent.trim() || isPostingReply}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isPostingReply ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white inline" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Publication...
                      </>
                    ) : (
                      'Répondre'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Réponses au commentaire */}
      {showReplies && replies.length > 0 && (
        <div className="ml-6 space-y-2">
          {replies.map((reply) => (
            <div key={reply.id_post} className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                {/* Avatar de la réponse */}
                <div className="flex-shrink-0">
                  {reply.author?.photo_profil ? (
                    <img
                      src={reply.author.photo_profil}
                      alt={reply.author.username}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${getRandomGradient(1)} flex items-center justify-center text-white text-xs font-medium`}>
                      {getInitials(reply.author)}
                    </div>
                  )}
                </div>

                {/* Contenu de la réponse */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h5 className="text-xs font-semibold text-gray-900">
                      {reply.author?.username || 'Utilisateur'}
                    </h5>
                    {reply.author?.certified && (
                      <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span className="text-xs text-gray-500">
                      {formatDate(reply.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-800">
                    {reply.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Message si pas de réponses */}
      {showReplies && replies.length === 0 && (
        <div className="ml-6 text-center py-4 text-gray-500 text-sm">
          Aucune réponse pour le moment
        </div>
      )}
    </div>
  );
};

export default CommentItem;
