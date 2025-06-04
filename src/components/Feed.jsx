// src/components/Feed.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import RightSidebar from './RightSidebar';

// Composant Post individuel
const Post = ({ post, onLike, onComment, onShare }) => {
  const [liked, setLiked] = useState(post.isLiked || false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);

  const handleLike = async () => {
    try {
      await onLike(post.id_post);
      setLiked(!liked);
      setLikeCount(prev => liked ? prev - 1 : prev + 1);
    } catch (error) {
      console.error('Erreur lors du like:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Il y a moins d\'1h';
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    if (diffInHours < 48) return 'Il y a 1 jour';
    return `Il y a ${Math.floor(diffInHours / 24)} jours`;
  };

  return (
    <div className="bg-white rounded-2xl p-6 mb-6 border border-gray-100">
      {/* Header du post */}
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
          {post.author?.photo_profil ? (
            <img 
              src={post.author.photo_profil} 
              alt={post.author.username}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-white font-semibold text-sm">
              {post.author?.username?.[0]?.toUpperCase() || 'U'}
            </span>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <p className="font-semibold text-gray-900">
              {post.author?.prenom && post.author?.nom 
                ? `${post.author.prenom} ${post.author.nom}` 
                : post.author?.username
              }
            </p>
            {post.author?.certified && (
              <span className="text-blue-500 text-sm">✓</span>
            )}
          </div>
          <p className="text-xs text-gray-500">
            @{post.author?.username} • {formatDate(post.created_at)}
          </p>
        </div>
      </div>

      {/* Contenu du post */}
      <div className="mb-4">
        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>
      </div>

      {/* Actions du post */}
      <div className="flex items-center space-x-6 pt-3 border-t border-gray-100">
        <button 
          onClick={handleLike}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
            liked 
              ? 'text-red-500 bg-red-50' 
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <span className="text-lg">{liked ? '❤️' : '🤍'}</span>
          <span className="text-sm font-medium">{likeCount} Like{likeCount > 1 ? 's' : ''}</span>
        </button>
        
        <button 
          onClick={() => onComment(post.id_post)}
          className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-50 transition-all duration-200"
        >
          <span className="text-lg">💬</span>
          <span className="text-sm font-medium">Commenter</span>
        </button>
        
        <button 
          onClick={() => onShare(post.id_post)}
          className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-50 transition-all duration-200"
        >
          <span className="text-lg">📤</span>
          <span className="text-sm font-medium">Partager</span>
        </button>
      </div>
    </div>
  );
};

// Composant principal Feed
const Feed = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Récents');
  const [newPost, setNewPost] = useState('');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  
  const tabs = ['Récents', 'Amis', 'Populaire'];

  // Charger les posts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        
        // TODO: Remplacer par les vraies API calls
        let endpoint;
        switch (activeTab) {
          case 'Amis':
            endpoint = '/api/v1/posts/timeline/personal';
            break;
          case 'Populaire':
            endpoint = '/api/v1/posts/trending';
            break;
          default:
            endpoint = '/api/v1/posts/public';
        }
        
        // const response = await ApiService.get(endpoint);
        // setPosts(response);
        
        // Simulation temporaire
        setPosts([]);
        
      } catch (error) {
        console.error('Erreur lors du chargement des posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [activeTab]);

  // Créer un nouveau post
  const handleCreatePost = async () => {
    if (!newPost.trim() || posting) return;

    try {
      setPosting(true);
      
      // TODO: Appel API pour créer le post
      // const response = await ApiService.post('/api/v1/posts', {
      //   content: newPost.trim()
      // });
      
      // Ajouter le nouveau post en haut de la liste
      // setPosts(prev => [response.post, ...prev]);
      
      setNewPost('');
      console.log('Post créé:', newPost);
      
    } catch (error) {
      console.error('Erreur lors de la création du post:', error);
    } finally {
      setPosting(false);
    }
  };

  // Liker un post
  const handleLike = async (postId) => {
    try {
      // TODO: Appel API pour liker/unliker
      // await ApiService.post(`/api/v1/likes/posts/${postId}`);
      console.log('Like post:', postId);
    } catch (error) {
      console.error('Erreur lors du like:', error);
      throw error;
    }
  };

  // Commenter un post
  const handleComment = (postId) => {
    // TODO: Ouvrir modal de commentaire ou naviguer vers la page du post
    console.log('Comment post:', postId);
  };

  // Partager un post
  const handleShare = (postId) => {
    // TODO: Implémenter le partage
    console.log('Share post:', postId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar gauche */}
      <Sidebar />
      
      {/* Contenu principal */}
      <div className="ml-72 mr-80">
        <div className="p-6">
          <div className="flex-1 max-w-2xl mx-auto">
            
            {/* Header avec titre et tabs */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">Feeds</h1>
              
              {/* Tabs */}
              <div className="flex space-x-1 bg-gray-100 rounded-xl p-1">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                      activeTab === tab
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Zone de création de post */}
            <div className="bg-white rounded-2xl p-6 mb-6 border border-gray-100">
              <div className="flex space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                  {user?.photo_profil ? (
                    <img 
                      src={user.photo_profil} 
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-semibold text-sm">
                      {user?.prenom?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <textarea
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder="Partager quelques choses"
                    className="w-full p-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows="3"
                    maxLength="280"
                  />
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex space-x-4">
                      <button className="flex items-center space-x-2 text-gray-500 hover:text-purple-600 transition-colors">
                        <span>📁</span>
                        <span className="text-sm">Fichier</span>
                      </button>
                      <button className="flex items-center space-x-2 text-gray-500 hover:text-purple-600 transition-colors">
                        <span>🖼️</span>
                        <span className="text-sm">Image</span>
                      </button>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-xs text-gray-500">
                        {newPost.length}/280
                      </span>
                      <button
                        onClick={handleCreatePost}
                        disabled={!newPost.trim() || posting}
                        className="bg-purple-600 text-white px-6 py-2 rounded-full hover:bg-purple-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {posting ? 'Publication...' : 'Publier'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Liste des posts */}
            <div>
              {loading ? (
                // Skeleton loading
                <div className="space-y-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                        </div>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </div>
                      <div className="flex space-x-6 pt-3 border-t border-gray-100">
                        <div className="h-8 bg-gray-200 rounded w-16"></div>
                        <div className="h-8 bg-gray-200 rounded w-20"></div>
                        <div className="h-8 bg-gray-200 rounded w-18"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : posts.length > 0 ? (
                posts.map((post) => (
                  <Post 
                    key={post.id_post} 
                    post={post} 
                    onLike={handleLike}
                    onComment={handleComment}
                    onShare={handleShare}
                  />
                ))
              ) : (
                // État vide
                <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {activeTab === 'Amis' ? 'Aucun post de vos amis' : 
                     activeTab === 'Populaire' ? 'Aucun post populaire' : 
                     'Aucun post récent'}
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {activeTab === 'Amis' 
                      ? 'Suivez plus d\'utilisateurs pour voir leurs posts ici' 
                      : 'Soyez le premier à publier quelque chose !'}
                  </p>
                  {activeTab !== 'Amis' && (
                    <button 
                      onClick={() => document.querySelector('textarea').focus()}
                      className="bg-purple-600 text-white px-6 py-3 rounded-full hover:bg-purple-700 transition-colors font-medium"
                    >
                      Créer votre premier post
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Sidebar droite */}
      <RightSidebar />
    </div>
  );
};

export default Feed;