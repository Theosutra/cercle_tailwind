import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import LeftSidebar from './LeftSidebar'

const Profile = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [selectedTab, setSelectedTab] = useState('posts')
  const [userPosts, setUserPosts] = useState([])
  const [likedPosts, setLikedPosts] = useState([])
  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0,
    likes: 0
  })
  const [loading, setLoading] = useState(true)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [error, setError] = useState('')

  // Fetch user stats from API
  const fetchUserStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token || !user?.id_user) return

      const response = await fetch('/api/v1/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const userData = await response.json()
        setStats({
          posts: userData.stats?.posts || 0,
          followers: userData.stats?.followers || 0,
          following: userData.stats?.following || 0,
          likes: userData.stats?.likes || 0
        })
      }
    } catch (error) {
      console.error('Error fetching user stats:', error)
    }
  }, [user?.id_user])

  // Fetch user posts from API
  const fetchUserPosts = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token || !user?.id_user) return

      const response = await fetch(`/api/v1/posts/user/${user.id_user}?limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUserPosts(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching user posts:', error)
      setUserPosts([])
    }
  }, [user?.id_user])

  // Fetch liked posts from API
  const fetchLikedPosts = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token || !user?.id_user) return

      const response = await fetch(`/api/v1/likes/users/${user.id_user}/posts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setLikedPosts(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching liked posts:', error)
      setLikedPosts([])
    }
  }, [user?.id_user])

  // Load all data
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id_user) return
      
      setLoading(true)
      setError('')
      
      try {
        await Promise.all([
          fetchUserStats(),
          fetchUserPosts(),
          fetchLikedPosts()
        ])
      } catch (error) {
        setError('Erreur lors du chargement des données')
        console.error('Error loading profile data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user?.id_user, fetchUserStats, fetchUserPosts, fetchLikedPosts])

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long'
    })
  }

  const getInitials = (user) => {
    if (!user) return 'U'
    if (user.prenom && user.nom) {
      return `${user.prenom[0]}${user.nom[0]}`.toUpperCase()
    }
    return user.username?.[0]?.toUpperCase() || 'U'
  }

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
        
        <h1 className="text-lg font-semibold text-gray-900">Profil</h1>
        
        <button
          onClick={() => navigate('/parametres')}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div 
            className="fixed inset-0 bg-black bg-opacity-10"
            onClick={() => setShowMobileMenu(false)}
          ></div>
          <div className="fixed top-0 left-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out overflow-y-auto">
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
        <main className="flex-1 lg:ml-72 pt-16 lg:pt-0">
          <div className="max-w-4xl mx-auto px-4 lg:px-8 py-6">

            {/* Profile Header - Plus compact */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
              {/* Cover background - Gradient rose vers blanc, pale */}
              <div className="h-32 sm:h-40 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-50/50 to-transparent"></div>
              </div>

              {/* Profile content - Redesigné plus compact */}
              <div className="px-4 sm:px-6 pb-6">
                <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-6 -mt-16 sm:-mt-20 relative">
                  {/* Avatar - Taille réduite avec bordure blanche plus épaisse */}
                  <div className="flex-shrink-0 mx-auto sm:mx-0">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600">
                      {user?.photo_profil ? (
                        <img 
                          src={user.photo_profil} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white font-bold text-xl">
                          {getInitials(user)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* User info - Layout amélioré avec meilleur contraste */}
                  <div className="flex-1 text-center sm:text-left mt-4 sm:mt-0 sm:pb-4">
                    <div className="mb-3">
                      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 drop-shadow-sm">
                        {user?.prenom && user?.nom 
                          ? `${user.prenom} ${user.nom}` 
                          : user?.username || 'Utilisateur'
                        }
                      </h1>
                      <p className="text-sm text-gray-600 mt-1 font-medium">@{user?.username}</p>
                    </div>

                    {/* Bio - Plus compacte avec meilleur contraste */}
                    {user?.bio && (
                      <p className="text-sm text-gray-800 mb-3 max-w-md mx-auto sm:mx-0 bg-white/60 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
                        {user.bio}
                      </p>
                    )}

                    {/* Stats - Plus compactes avec fond semi-transparent */}
                    <div className="flex justify-center sm:justify-start space-x-6 text-sm bg-white/70 backdrop-blur-sm rounded-lg px-4 py-2 inline-flex shadow-sm">
                      <div className="text-center">
                        <span className="font-semibold text-gray-900">{stats.posts}</span>
                        <span className="text-gray-700 ml-1">Posts</span>
                      </div>
                      <div className="text-center">
                        <span className="font-semibold text-gray-900">{stats.followers}</span>
                        <span className="text-gray-700 ml-1">Followers</span>
                      </div>
                      <div className="text-center">
                        <span className="font-semibold text-gray-900">{stats.following}</span>
                        <span className="text-gray-700 ml-1">Following</span>
                      </div>
                    </div>
                  </div>

                  {/* Action button - Plus petit */}
                  <div className="mt-4 sm:mt-0 sm:pb-4">
                    <button 
                      onClick={() => navigate('/parametres')}
                      className="w-full sm:w-auto px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors text-sm shadow-lg"
                    >
                      Modifier le profil
                    </button>
                  </div>
                </div>

                {/* Join date - Plus discret avec meilleur contraste */}
                <div className="mt-4 pt-4 border-t border-gray-100 text-center sm:text-left">
                  <div className="text-xs text-gray-600 flex items-center justify-center sm:justify-start bg-gray-50 rounded-md px-3 py-1 inline-flex">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Membre depuis {formatDate(user?.created_at)}
                  </div>
                </div>
              </div>
            </div>

            {/* Content Tabs - Design plus moderne et compact */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Tab Navigation - Plus compact */}
              <div className="border-b border-gray-200">
                <nav className="flex">
                  <button
                    onClick={() => setSelectedTab('posts')}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
                      selectedTab === 'posts'
                        ? 'text-black bg-gray-50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Publications
                    {selectedTab === 'posts' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setSelectedTab('liked')}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
                      selectedTab === 'liked'
                        ? 'text-black bg-gray-50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    J'aime
                    {selectedTab === 'liked' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setSelectedTab('media')}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
                      selectedTab === 'media'
                        ? 'text-black bg-gray-50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Médias
                    {selectedTab === 'media' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>
                    )}
                  </button>
                </nav>
              </div>

              {/* Tab Content - Plus compact */}
              <div className="p-6">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                    <p className="text-gray-500 mt-2 text-sm">Chargement...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <div className="text-red-400 text-4xl mb-3">⚠️</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur</h3>
                    <p className="text-gray-600 text-sm">{error}</p>
                  </div>
                ) : (
                  <div>
                    {selectedTab === 'posts' && (
                      <div>
                        {userPosts.length > 0 ? (
                          <div className="space-y-4">
                            {userPosts.map((post) => (
                              <div key={post.id_post} className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-start space-x-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                    {user?.photo_profil ? (
                                      <img 
                                        src={user.photo_profil} 
                                        alt="Profile" 
                                        className="w-full h-full object-cover rounded-full"
                                      />
                                    ) : (
                                      <span className="text-white font-bold text-sm">
                                        {getInitials(user)}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <span className="font-semibold text-gray-900">@{user?.username}</span>
                                      <span className="text-gray-500 text-sm">
                                        {new Date(post.created_at).toLocaleDateString('fr-FR')}
                                      </span>
                                    </div>
                                    <p className="text-gray-900 text-sm">{post.content}</p>
                                    <div className="flex items-center space-x-4 mt-3">
                                      <button className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                        <span className="text-sm">{post.like_count || 0}</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <div className="text-gray-400 text-4xl mb-3">📝</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune publication</h3>
                            <p className="text-gray-600 text-sm mb-6">Commencez à partager vos moments avec votre cercle</p>
                            <button
                              onClick={() => navigate('/feed')}
                              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                            >
                              Créer une publication
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedTab === 'liked' && (
                      <div>
                        {likedPosts.length > 0 ? (
                          <div className="space-y-4">
                            {likedPosts.map((post) => (
                              <div key={post.id_post} className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-start space-x-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                    {post.user?.photo_profil ? (
                                      <img 
                                        src={post.user.photo_profil} 
                                        alt="Profile" 
                                        className="w-full h-full object-cover rounded-full"
                                      />
                                    ) : (
                                      <span className="text-white font-bold text-sm">
                                        {getInitials(post.user)}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <span className="font-semibold text-gray-900">@{post.user?.username}</span>
                                      <span className="text-gray-500 text-sm">
                                        {new Date(post.created_at).toLocaleDateString('fr-FR')}
                                      </span>
                                    </div>
                                    <p className="text-gray-900 text-sm">{post.content}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <div className="text-gray-400 text-4xl mb-3">❤️</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun like</h3>
                            <p className="text-gray-600 text-sm">Les publications que vous aimez apparaîtront ici</p>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedTab === 'media' && (
                      <div className="text-center py-12">
                        <div className="text-gray-400 text-4xl mb-3">📸</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun média</h3>
                        <p className="text-gray-600 text-sm">Vos photos et vidéos seront affichées ici</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}

export default Profile