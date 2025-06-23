// src/components/CommentThread.jsx - Composant pour conversations hiérarchiques infinies

import React, { useState } from 'react';

const CommentThread = ({ comment, postId, user, onReplyAdded, depth = 0, maxDepth = 999 }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isPostingReply, setIsPostingReply] = useState(false);
  const [showReplies, setShowReplies] = useState(depth < 3); // Auto-expand les 3 premiers niveaux
  const [isCollapsed, setIsCollapsed] = useState(false);

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

  // Fonction pour répondre à ce commentaire/réponse
  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyContent.trim() || isPostingReply || depth >= maxDepth) return;

    try {
      setIsPostingReply(true);
      console.log('🔄 Posting reply to:', comment.id_post, 'depth:', depth);
      
      // Nouvelle API unifiée pour répondre à n'importe quel post
      const response = await makeAuthenticatedRequest(
        `/api/v1/posts/${comment.id_post}/reply`,
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
        
        // Ajouter la nouvelle réponse à ce commentaire
        if (onReplyAdded) {
          onReplyAdded(data.reply, comment.id_post);
        }
        
        setReplyContent('');
        setShowReplyForm(false);
        setShowReplies(true); // Afficher les réponses après en avoir ajouté une
        
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

  // Styles Twitter : pas d'indentation, juste des lignes de connexion
  const getDepthStyles = () => {
    return {
      marginLeft: '0px', // ✅ TWITTER STYLE : Pas d'indentation
      paddingLeft: depth > 0 ? '20px' : '0px', // Juste un petit padding pour la ligne
      borderLeft: depth > 0 ? '2px solid #e1e8ed' : 'none', // Ligne de connexion fine
      position: 'relative'
    };
  };

  const canReply = depth < maxDepth;
  const hasReplies = comment.replies && comment.replies.length > 0;

  if (isCollapsed) {
    return (
      <div style={getDepthStyles()} className="py-1">
        <button
          onClick={() => setIsCollapsed(false)}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Afficher la conversation ({hasReplies ? comment.replies.length + 1 : 1} message{hasReplies ? 's' : ''})</span>
        </button>
      </div>
    );
  }

  return (
    <div style={getDepthStyles()} className="mb-2"> {/* ✅ TWITTER : Espacement réduit */}
      {/* Commentaire principal */}
      <div className={`rounded-lg p-3 ${depth === 0 ? 'bg-gray-50' : 'bg-white'} w-full`}> {/* ✅ TWITTER : Pas de bordure différente selon profondeur */}
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {comment.author?.photo_profil ? (
                <img
                  src={comment.author.photo_profil}
                  alt={comment.author.username}
                  className={`rounded-full object-cover ${depth > 2 ? 'w-6 h-6' : 'w-8 h-8'}`}
                />
              ) : (
                <div className={`rounded-full bg-gradient-to-br ${getRandomGradient(depth)} flex items-center justify-center text-white font-medium ${depth > 2 ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'}`}>
                  {getInitials(comment.author)}
                </div>
              )}
            </div>

            {/* Contenu */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="text-sm font-semibold text-gray-900"> {/* ✅ TWITTER : Taille uniforme */}
                  {comment.author?.username || 'Utilisateur'}
                </h4>
                {comment.author?.certified && (
                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20"> {/* ✅ TWITTER : Taille uniforme */}
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                <span className="text-xs text-gray-500">
                  {formatDate(comment.created_at)}
                </span>
                {depth > 0 && (
                  <span className="text-xs text-gray-400">
                    En réponse à 
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-800 mb-2 leading-relaxed break-words"> {/* ✅ TWITTER : Taille uniforme */}
                {comment.content}
              </p>

              {/* Actions */}
              <div className="flex items-center space-x-4 text-xs">
                {canReply && (
                  <button
                    onClick={() => setShowReplyForm(!showReplyForm)}
                    className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    Répondre
                  </button>
                )}
                
                {hasReplies && (
                  <button
                    onClick={() => setShowReplies(!showReplies)}
                    className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
                  >
                    {showReplies ? 'Masquer' : 'Afficher'} les réponses ({comment.replies.length})
                  </button>
                )}

                {hasReplies && depth > 1 && (
                  <button
                    onClick={() => setIsCollapsed(true)}
                    className="text-gray-500 hover:text-gray-700 text-xs"
                  >
                    Réduire
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Formulaire de réponse */}
        {showReplyForm && canReply && (
          <div className="mt-3 pl-11"> {/* ✅ TWITTER : Aligné avec le contenu */}
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
                        Envoi...
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

      {/* Réponses hiérarchiques */}
      {showReplies && hasReplies && (
        <div className="mt-1"> {/* ✅ TWITTER : Espacement minimal */}
          {comment.replies.map((reply) => (
            <CommentThread
              key={reply.id_post}
              comment={reply}
              postId={postId}
              user={user}
              onReplyAdded={onReplyAdded}
              depth={depth + 1}
              maxDepth={maxDepth}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentThread;