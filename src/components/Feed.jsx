import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import LeftSidebar from './LeftSideBar';
import RightSidebar from './RightSidebar';

const Feed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar */}
      <LeftSidebar />
      
      {/* Main Content */}
      <div className="ml-72 mr-80 flex-1 p-6 max-w-2xl mx-auto">
        
        {/* Create Post Form */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex space-x-4">
            {/* User Avatar */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                {user?.photo_profil ? (
                  <img 
                    src={user.photo_profil} 
                    alt="Your profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-lg">
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
                className="w-full p-4 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-black focus:border-transparent outline-none text-gray-900 placeholder-gray-500"
                rows={3}
                maxLength={280}
                disabled={isPosting}
              />
              
              {/* Post Actions */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-4 text-gray-500">
                  <button type="button" className="hover:text-gray-700 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button type="button" className="hover:text-gray-700 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <span className="text-sm">{280 - newPost.length}</span>
                </div>
                
                <button
                  onClick={handleCreatePost}
                  disabled={!newPost.trim() || isPosting}
                  className="bg-black text-white px-6 py-2 rounded-full font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPosting ? 'Publication...' : 'Publier'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Posts Feed */}
        <div className="space-y-6">
          {isLoading ? (
            // Loading Skeleton
            [...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm p-6 animate-pulse">
                <div className="flex space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            ))
          ) : posts.length === 0 ? (
            // Empty State
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📝</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Aucun post pour le moment
              </h3>
              <p className="text-gray-600 mb-6">
                Soyez le premier à partager quelque chose avec votre cercle !
              </p>
            </div>
          ) : (
            // Posts
            posts.map((post, index) => (
              <div 
                key={post.id_post} 
                className={`rounded-2xl shadow-sm p-6 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                {/* Post Header */}
                <div className="flex items-center space-x-3 mb-4">
                  {/* Author Avatar */}
                  <div className={`w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br ${getRandomGradient(index)} flex items-center justify-center`}>
                    {post.author?.photo_profil ? (
                      <img 
                        src={post.author.photo_profil} 
                        alt={getDisplayName(post.author)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-lg">
                        {getInitials(post.author)}
                      </span>
                    )}
                  </div>

                  {/* Author Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-gray-900">
                        {getDisplayName(post.author)}
                      </h3>
                      {post.author?.certified && (
                        <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>@{post.author?.username}</span>
                      <span>•</span>
                      <span>{formatTimeAgo(post.created_at)}</span>
                    </div>
                  </div>

                  {/* Post Options */}
                  <button className="text-gray-400 hover:text-gray-600 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                </div>

                {/* Post Content */}
                <div className="mb-4">
                  <p className="text-gray-900 text-base leading-relaxed whitespace-pre-wrap">
                    {post.content}
                  </p>
                </div>

                {/* Post Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-6">
                    {/* Like Button */}
                    <button
                      onClick={() => handleLike(post.id_post)}
                      className={`flex items-center space-x-2 text-sm transition-colors ${
                        post.isLiked 
                          ? 'text-red-600 hover:text-red-700' 
                          : 'text-gray-500 hover:text-red-600'
                      }`}
                    >
                      <svg 
                        className={`w-5 h-5 transition-colors ${post.isLiked ? 'fill-current' : ''}`}
                        fill={post.isLiked ? 'currentColor' : 'none'} 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span>{post.likeCount || 0}</span>
                    </button>

                    {/* Comment Button */}
                    <button className="flex items-center space-x-2 text-sm text-gray-500 hover:text-blue-600 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span>{post.commentCount || 0}</span>
                    </button>

                    {/* Share Button */}
                    <button className="flex items-center space-x-2 text-sm text-gray-500 hover:text-green-600 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                    </button>
                  </div>

                  {/* Bookmark Button */}
                  <button className="text-gray-500 hover:text-yellow-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <RightSidebar />
    </div>
  );
};

export default Feed;