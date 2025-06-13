import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0,
    likes: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('posts'); // posts, liked, saved
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Fetch user stats
  const fetchUserStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/v1/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setStats({
          posts: userData.stats?.posts || 0,
          followers: userData.stats?.followers || 0,
          following: userData.stats?.following || 0,
          likes: userData.stats?.likes || 0
        });
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  }, []);

  // Fetch user posts
  const fetchUserPosts = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/v1/posts/user/${user?.id_user}?limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching user posts:', error);
      setPosts([]);
    }
  }, [user?.id_user]);

  // Effects
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchUserStats(),
        fetchUserPosts()
      ]);
      setLoading(false);
    };

    if (user?.id_user) {
      loadData();
    }
  }, [user?.id_user, fetchUserStats, fetchUserPosts]);

  // Get user initials for avatar fallback
  const getInitials = useCallback((user) => {
    if (user?.prenom && user?.nom) {
      return `${user.prenom[0]}${user.nom[0]}`.toUpperCase();
    }
    return user?.username?.substring(0, 2).toUpperCase() || '?';
  }, []);

  // Format numbers for display
  const formatNumber = useCallback((num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }, []);

  // Format date
  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between fixed top-0 left-0 right-0 z-30">
        <button 
          onClick={() => setShowMobileMenu(true)}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        <h1 className="text-xl font-bold text-gray-900">@{user?.username}</h1>
        
        <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setShowMobileMenu(false)}
          ></div>
          <div className="fixed top-0 left-0 h-full w-80 bg-white shadow-xl overflow-y-auto">
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
        
        {/* Main Content */}
        <main className="flex-1 lg:ml-72 xl:mr-80 pt-16 lg:pt-0 px-4 lg:px-8 py-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Profile Header */}
              <div className="bg-white rounded-2xl shadow-sm p-6 lg:p-8 mb-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-12">
                  
                  {/* Avatar */}
                  <div className="flex justify-center lg:justify-start mb-6 lg:mb-0">
                    <div className="relative">
                      <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                        {user?.photo_profil ? (
                          <img 
                            src={user.photo_profil} 
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-bold text-4xl lg:text-5xl">
                            {getInitials(user)}
                          </span>
                        )}
                      </div>
                      
                      {/* Certified badge */}
                      {user?.certified && (
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Profile Info */}
                  <div className="flex-1 text-center lg:text-left">
                    
                    {/* Name and Username */}
                    <div className="mb-6">
                      <div className="flex items-center justify-center lg:justify-start space-x-3 mb-2">
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                          @{user?.username}
                        </h1>
                        {user?.certified && (
                          <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      
                      {(user?.prenom || user?.nom) && (
                        <p className="text-lg text-gray-600 font-medium">
                          {user?.prenom} {user?.nom}
                        </p>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-8 mb-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{formatNumber(stats.posts)}</div>
                        <div className="text-sm text-gray-500 font-medium">Publications</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{formatNumber(stats.followers)}</div>
                        <div className="text-sm text-gray-500 font-medium">Abonnés</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{formatNumber(stats.following)}</div>
                        <div className="text-sm text-gray-500 font-medium">Abonnements</div>
                      </div>
                    </div>

                    {/* Bio */}
                    {user?.bio && (
                      <div className="mb-6">
                        <p className="text-gray-700 leading-relaxed max-w-md mx-auto lg:mx-0">
                          {user.bio}
                        </p>
                      </div>
                    )}

                    {/* Join Date */}
                    <div className="text-sm text-gray-500">
                      <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Membre depuis {formatDate(user?.created_at)}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-6 lg:mt-0">
                    <button 
                      onClick={() => navigate('/parametres')}
                      className="w-full lg:w-auto px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                    >
                      Modifier le profil
                    </button>
                  </div>
                </div>
              </div>

              {/* Content Tabs */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                
                {/* Tab Navigation */}
                <div className="border-b border-gray-200">
                  <nav className="flex">
                    <button
                      onClick={() => setSelectedTab('posts')}
                      className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                        selectedTab === 'posts'
                          ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      Publications
                    </button>
                    
                    <button
                      onClick={() => setSelectedTab('liked')}
                      className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                        selectedTab === 'liked'
                          ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      J'aime
                    </button>
                    
                    <button
                      onClick={() => setSelectedTab('saved')}
                      className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                        selectedTab === 'saved'
                          ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                      Sauvegardés
                    </button>
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {selectedTab === 'posts' && (
                    <div>
                      {posts.length === 0 ? (
                        <div className="text-center py-16">
                          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune publication</h3>
                          <p className="text-gray-600 mb-6">Commencez à partager vos moments !</p>
                          <button className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors">
                            Créer votre première publication
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {posts.map((post) => (
                            <div key={post.id_post} className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors cursor-pointer">
                              <div className="flex items-start space-x-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                                  {user?.photo_profil ? (
                                    <img 
                                      src={user.photo_profil} 
                                      alt="Profile"
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-white font-bold text-sm">
                                      {getInitials(user)}
                                    </span>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-semibold text-gray-900">@{user?.username}</span>
                                    {user?.certified && (
                                      <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </div>
                                  <span className="text-sm text-gray-500">
                                    {formatDate(post.created_at)}
                                  </span>
                                </div>
                              </div>
                              
                              <p className="text-gray-800 leading-relaxed mb-4">
                                {post.content}
                              </p>
                              
                              <div className="flex items-center justify-between text-sm text-gray-500">
                                <div className="flex items-center space-x-4">
                                  <div className="flex items-center space-x-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                    <span>{post.likeCount || 0}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    <span>0</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {selectedTab === 'liked' && (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun like</h3>
                      <p className="text-gray-600">Les publications que vous aimez apparaîtront ici</p>
                    </div>
                  )}

                  {selectedTab === 'saved' && (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune sauvegarde</h3>
                      <p className="text-gray-600">Les publications que vous sauvegardez apparaîtront ici</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </main>

        {/* Right Sidebar - Hidden on mobile */}
        <aside className="hidden xl:block xl:fixed xl:right-0 xl:w-80 xl:h-screen xl:overflow-y-auto">
          <RightSidebar />
        </aside>
      </div>
    </div>
  );
};

export default Profile;