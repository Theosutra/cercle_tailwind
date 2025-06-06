import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';

const Feed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [error, setError] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Fetch posts from API
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('accessToken');
      
      // Try personal timeline first, fallback to public
      let response;
      try {
        response = await fetch('/api/v1/posts/timeline/personal', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (err) {
        // Fallback to public timeline
        response = await fetch('/api/v1/posts/public', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }

      if (response.ok) {
        const data = await response.json();
        setPosts(Array.isArray(data) ? data : []);
      } else {
        throw new Error('Failed to fetch posts');
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Impossible de charger les posts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.trim() || isPosting) return;

    try {
      setIsPosting(true);
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
        const newPostData = await response.json();
        setPosts(prev => [newPostData.post, ...prev]);
        setNewPost('');
      } else {
        throw new Error('Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      setError('Impossible de créer le post');
    } finally {
      setIsPosting(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/v1/likes/posts/${postId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(prev => 
          prev.map(post => 
            post.id_post === postId 
              ? { ...post, isLiked: data.isLiked, likeCount: data.likeCount }
              : post
          )
        );
      }
    } catch (error) {
      console.error('Error liking post:', error);
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
    return author?.username?.[0]?.toUpperCase() || 'U';
  };

  const getDisplayName = (author) => {
    if (author?.prenom && author?.nom) {
      return `${author.prenom} ${author.nom}`;
    }
    return author?.username || 'Utilisateur';
  };

  const getRandomGradient = (index) => {
    const gradients = [
      'from-blue-400 to-purple-500',
      'from-pink-400 to-red-500',
      'from-green-400 to-blue-500',
      'from-yellow-400 to-pink-500',
      'from-purple-400 to-pink-500',
      'from-indigo-400 to-purple-500'
    ];
    return gradients[index % gradients.length];
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleCreatePost();
    }
  };

  const handleImageUpload = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      console.log('Images sélectionnées:', files);
      // Ici vous pouvez ajouter la logique pour traiter les images
    }
  };

  const handleFileUpload = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      console.log('Fichiers sélectionnés:', files);
      // Ici vous pouvez ajouter la logique pour traiter les fichiers
    }
  };

  const handleEmojiClick = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  const insertEmoji = (emoji) => {
    setNewPost(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const emojiList = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
    '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸',
    '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️',
    '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡',
    '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓',
    '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄',
    '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵',
    '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Mobile Menu Button */}
          <button 
            onClick={() => setShowMobileMenu(true)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo/Title */}
          <h1 className="text-xl font-bold text-gray-900">Feed</h1>

          {/* User Avatar */}
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
            {user?.photo_profil ? (
              <img 
                src={user.photo_profil} 
                alt="Your profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white font-bold text-sm">
                {getInitials(user)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop - Fond très légèrement teinté */}
          <div 
            className="fixed inset-0"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}
            onClick={() => setShowMobileMenu(false)}
          ></div>
          
          {/* Menu Content */}
          <div className="fixed top-0 left-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out overflow-y-auto">
            {/* Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
              <button 
                onClick={() => setShowMobileMenu(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Sidebar Content */}
            <div className="p-4">
              <LeftSidebar />
            </div>
          </div>
        </div>
      )}

      <div className="flex max-w-7xl mx-auto">
        
        {/* Left Sidebar - Hidden on mobile */}
        <div className="hidden lg:block lg:fixed lg:left-0 lg:w-72 lg:h-screen lg:overflow-y-auto">
          <LeftSidebar />
        </div>
        
        {/* Main Content - Full width on mobile, centered on desktop */}
        <main className="flex-1 lg:ml-72 xl:mr-80 pt-16 lg:pt-0">
          <div className="max-w-2xl mx-auto px-3 sm:px-4 lg:px-8 py-4 lg:py-6 pb-32">

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center space-x-2">
                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Posts Feed */}
            <div className="space-y-4 lg:space-y-6">
              {isLoading ? (
                // Loading Skeleton
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
                          <div className="h-4 bg-gray-200 rounded w-12"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : posts.length === 0 ? (
                // Empty State
                <div className="text-center py-12 lg:py-16 bg-white rounded-xl lg:rounded-2xl shadow-sm border border-gray-100">
                  <div className="text-gray-300 text-5xl lg:text-6xl mb-4 lg:mb-6">📝</div>
                  <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-2 lg:mb-3">
                    Aucun post pour le moment
                  </h3>
                  <p className="text-gray-600 mb-4 lg:mb-6 max-w-md mx-auto text-sm lg:text-base px-4">
                    Soyez le premier à partager quelque chose avec votre cercle ! Vos pensées comptent.
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
                posts.map((post, index) => (
                  <article 
                    key={post.id_post} 
                    className="bg-white rounded-xl lg:rounded-2xl shadow-sm p-4 lg:p-6 border border-gray-100 hover:shadow-md transition-shadow duration-200"
                  >
                    {/* Post Header */}
                    <header className="flex items-start space-x-3 lg:space-x-4 mb-3 lg:mb-4">
                      {/* Author Avatar */}
                      <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full overflow-hidden bg-gradient-to-br ${getRandomGradient(index)} flex items-center justify-center ring-2 ring-white shadow-sm flex-shrink-0`}>
                        {post.author?.photo_profil ? (
                          <img 
                            src={post.author.photo_profil} 
                            alt={getDisplayName(post.author)}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-bold text-sm lg:text-lg">
                            {getInitials(post.author)}
                          </span>
                        )}
                      </div>

                      {/* Author Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-bold text-gray-900 truncate text-sm lg:text-base">
                            {getDisplayName(post.author)}
                          </h3>
                          {post.author?.certified && (
                            <svg className="w-3 h-3 lg:w-4 lg:h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-xs lg:text-sm text-gray-500">
                          <span className="truncate">@{post.author?.username}</span>
                          <span>•</span>
                          <time className="flex-shrink-0">{formatTimeAgo(post.created_at)}</time>
                        </div>
                      </div>

                      {/* Post Options */}
                      <button className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100 flex-shrink-0">
                        <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                    </header>

                    {/* Post Content */}
                    <div className="mb-4 lg:mb-6">
                      <p className="text-gray-900 text-sm lg:text-base leading-relaxed whitespace-pre-wrap break-words">
                        {post.content}
                      </p>
                    </div>

                    {/* Post Actions */}
                    <footer className="flex items-center justify-between pt-3 lg:pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-6 lg:space-x-8">
                        {/* Like Button */}
                        <button
                          onClick={() => handleLike(post.id_post)}
                          className={`flex items-center space-x-1 lg:space-x-2 text-xs lg:text-sm transition-all duration-200 hover:scale-105 ${
                            post.isLiked 
                              ? 'text-red-600 hover:text-red-700' 
                              : 'text-gray-500 hover:text-red-600'
                          }`}
                        >
                          <svg 
                            className={`w-4 h-4 lg:w-5 lg:h-5 transition-all duration-200 ${post.isLiked ? 'fill-current scale-110' : ''}`}
                            fill={post.isLiked ? 'currentColor' : 'none'} 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          <span className="font-medium">{post.likeCount || 0}</span>
                        </button>

                        {/* Comment Button */}
                        <button className="flex items-center space-x-1 lg:space-x-2 text-xs lg:text-sm text-gray-500 hover:text-blue-600 transition-all duration-200 hover:scale-105">
                          <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span className="font-medium">{post.commentCount || 0}</span>
                        </button>

                        {/* Share Button */}
                        <button className="flex items-center space-x-1 lg:space-x-2 text-xs lg:text-sm text-gray-500 hover:text-green-600 transition-all duration-200 hover:scale-105">
                          <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                          </svg>
                        </button>
                      </div>

                      {/* Bookmark Button */}
                      <button className="text-gray-500 hover:text-yellow-600 transition-all duration-200 hover:scale-105">
                        <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </button>
                    </footer>
                  </article>
                ))
              )}
            </div>
          </div>
        </main>

        {/* Right Sidebar - Hidden on mobile */}
        <aside className="hidden xl:block xl:fixed xl:right-0 xl:w-80 xl:h-screen xl:overflow-y-auto">
          <RightSidebar />
        </aside>

        {/* Create Post Form - Mobile friendly - Masqué quand le menu est ouvert */}
        {!showMobileMenu && (
          <div className="fixed bottom-4 lg:bottom-6 left-0 right-0 z-50 flex justify-center">
            <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 lg:px-8">
              <div className="bg-white rounded-xl lg:rounded-2xl shadow-xl p-3 sm:p-4 lg:p-6 border border-gray-200 backdrop-blur-sm relative">
                <div className="flex space-x-2 sm:space-x-3 lg:space-x-4">
                  {/* User Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center ring-2 ring-white shadow-lg">
                      {user?.photo_profil ? (
                        <img 
                          src={user.photo_profil} 
                          alt="Your profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-bold text-xs sm:text-sm lg:text-lg">
                          {getInitials(user)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Post Input */}
                  <div className="flex-1">
                    <textarea
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Qu'est-ce qui vous passe par la tête ?"
                      className="w-full p-2 sm:p-3 lg:p-4 border border-gray-200 rounded-lg lg:rounded-xl resize-none focus:ring-2 focus:ring-black focus:border-transparent outline-none text-gray-900 placeholder-gray-500 transition-all duration-200 text-sm lg:text-base"
                      rows={2}
                      maxLength={280}
                      disabled={isPosting}
                    />
                    
                    {/* Post Actions */}
                    <div className="flex items-center justify-between mt-2 sm:mt-3 lg:mt-4">
                      <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 text-gray-500">
                        {/* Image Upload Button */}
                        <label 
                          htmlFor="image-upload"
                          className="hover:text-blue-600 transition-colors p-1 rounded-full hover:bg-blue-50 cursor-pointer"
                          title="Ajouter une image"
                        >
                          <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleImageUpload}
                          />
                        </label>

                        {/* File Upload Button - Hidden on very small screens */}
                        <label 
                          htmlFor="file-upload"
                          className="hidden sm:block hover:text-green-600 transition-colors p-1 rounded-full hover:bg-green-50 cursor-pointer"
                          title="Ajouter un fichier"
                        >
                          <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          <input
                            id="file-upload"
                            type="file"
                            multiple
                            className="hidden"
                            onChange={handleFileUpload}
                          />
                        </label>

                        {/* Emoji Button */}
                        <div className="relative">
                          <button 
                            type="button" 
                            className={`hover:text-yellow-600 transition-colors p-1 rounded-full hover:bg-yellow-50 ${showEmojiPicker ? 'text-yellow-600 bg-yellow-50' : ''}`}
                            title="Ajouter un emoji"
                            onClick={handleEmojiClick}
                          >
                            <span className="text-base lg:text-lg">😊</span>
                          </button>

                          {/* Emoji Picker */}
                          {showEmojiPicker && (
                            <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg lg:rounded-xl shadow-lg p-2 lg:p-3 w-64 lg:w-72 max-h-40 lg:max-h-48 overflow-y-auto z-50">
                              <div className="grid grid-cols-8 gap-1">
                                {emojiList.map((emoji, index) => (
                                  <button
                                    key={index}
                                    type="button"
                                    className="text-lg lg:text-xl p-1 lg:p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    onClick={() => insertEmoji(emoji)}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Character Counter */}
                        <div className="ml-1 lg:ml-2">
                          <span className={`text-xs lg:text-sm font-medium ${newPost.length > 250 ? 'text-red-500' : newPost.length > 200 ? 'text-yellow-500' : 'text-gray-400'}`}>
                            {280 - newPost.length}
                          </span>
                        </div>
                      </div>
                      
                      <button
                        onClick={handleCreatePost}
                        disabled={!newPost.trim() || isPosting || newPost.length > 280}
                        className="bg-black text-white px-3 sm:px-4 lg:px-6 py-1.5 lg:py-2 rounded-full font-medium hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 text-xs sm:text-sm lg:text-base"
                      >
                        {isPosting ? (
                          <div className="flex items-center space-x-1 lg:space-x-2">
                            <svg className="animate-spin h-3 w-3 lg:h-4 lg:w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="hidden sm:inline">Publication...</span>
                            <span className="sm:hidden">...</span>
                          </div>
                        ) : (
                          <>
                            <span className="hidden sm:inline">Publier</span>
                            <span className="sm:hidden">Post</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Feed;