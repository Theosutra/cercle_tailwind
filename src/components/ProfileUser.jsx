// src/components/ProfileUser.jsx - Style identique à Profile.jsx
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, useParams } from 'react-router-dom'
import LeftSidebar from './LeftSidebar'

const ProfileUser = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { userId } = useParams()
  
  const [profileUser, setProfileUser] = useState(null)
  const [selectedTab, setSelectedTab] = useState('posts')
  const [userPosts, setUserPosts] = useState([])
  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0,
    likes: 0
  })
  const [loading, setLoading] = useState(true)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [error, setError] = useState('')
  const [isFollowing, setIsFollowing] = useState(false)
  const [isFollowLoading, setIsFollowLoading] = useState(false)

  // ✅ Rediriger si c'est son propre profil
  useEffect(() => {
    if (userId && user?.id_user && parseInt(userId) === parseInt(user.id_user)) {
      navigate('/profile')
      return
    }
  }, [userId, user?.id_user, navigate])

  // ✅ Fetch profile user data
  const fetchProfileUser = useCallback(async () => {
    if (!userId) {
      setError('ID utilisateur manquant')
      return
    }

    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        setError('Token manquant')
        return
      }

      const response = await fetch(`/api/v1/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const userData = await response.json()
        setProfileUser(userData)
        setIsFollowing(userData.isFollowing || false)
      } else if (response.status === 404) {
        setError('Utilisateur non trouvé')
      } else if (response.status === 403) {
        setError('Ce compte est privé et vous ne le suivez pas')
      } else {
        setError('Erreur lors du chargement du profil')
      }
    } catch (error) {
      console.error('Error fetching profile user:', error)
      setError('Erreur de connexion')
    }
  }, [userId])

  // ✅ Fetch user stats
  const fetchUserStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token || !userId) return

      const response = await fetch(`/api/v1/users/${userId}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const statsData = await response.json()
        setStats({
          posts: statsData.posts || 0,
          followers: statsData.followers || 0,
          following: statsData.following || 0,
          likes: statsData.likes || 0
        })
      }
    } catch (error) {
      console.error('Error fetching user stats:', error)
    }
  }, [userId])

  // ✅ Fetch user posts
  const fetchUserPosts = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token || !userId) return

      const response = await fetch(`/api/v1/posts/user/${userId}?limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        const posts = data.posts || data || []
        setUserPosts(Array.isArray(posts) ? posts : [])
      }
    } catch (error) {
      console.error('Error fetching user posts:', error)
      setUserPosts([])
    }
  }, [userId])

  // ✅ Suivre/Ne plus suivre
  const handleFollowToggle = async () => {
    if (!profileUser || isFollowLoading) return

    try {
      setIsFollowLoading(true)
      const token = localStorage.getItem('accessToken')

      const response = await fetch(`/api/v1/follow/${profileUser.id_user}`, {
        method: isFollowing ? 'DELETE' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        setIsFollowing(!isFollowing)
        setStats(prev => ({
          ...prev,
          followers: isFollowing ? prev.followers - 1 : prev.followers + 1
        }))
      }
    } catch (error) {
      console.error('Error toggling follow:', error)
    } finally {
      setIsFollowLoading(false)
    }
  }

  // ✅ Fonction pour liker un post
  const handleLike = async (postId) => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/v1/likes/posts/${postId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUserPosts(prev => 
          prev.map(post => 
            post.id_post === postId 
              ? { 
                  ...post, 
                  isLikedByCurrentUser: data.isLiked || data.liked,
                  likeCount: data.likeCount || data.likesCount || post.likeCount
                }
              : post
          )
        )
      }
    } catch (error) {
      console.error('Error liking post:', error)
    }
  }

  // ✅ Naviguer vers les messages
  const handleSendMessage = () => {
    if (profileUser) {
      navigate('/messages', { state: { selectedUserId: profileUser.id_user } })
    }
  }

  // ✅ Charger toutes les données
  useEffect(() => {
    const loadData = async () => {
      if (!userId) return
      
      setLoading(true)
      setError('')
      
      try {
        await Promise.all([
          fetchProfileUser(),
          fetchUserStats(),
          fetchUserPosts()
        ])
      } catch (error) {
        setError('Erreur lors du chargement des données')
        console.error('Error loading profile data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [userId, fetchProfileUser, fetchUserStats, fetchUserPosts])

  // ✅ Fonctions utilitaires identiques à Profile.jsx
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

  // ✅ États de chargement et d'erreur avec style identique
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/feed')}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Retour au feed
          </button>
        </div>
      </div>
    )
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">👤</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Utilisateur non trouvé</h2>
          <p className="text-gray-600 mb-4">Ce profil n'existe pas ou n'est pas accessible.</p>
          <button
            onClick={() => navigate('/feed')}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Retour au feed
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header - Style identique */}
      <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between fixed top-0 left-0 right-0 z-30">
        <button 
          onClick={() => setShowMobileMenu(true)}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        <h1 className="text-lg font-semibold text-gray-900">
          @{profileUser.username}
        </h1>
        
        <div className="w-10"></div>
      </div>

      <div className="flex">
        {/* Sidebar gauche */}
        <div className="hidden lg:block lg:w-64 lg:fixed lg:h-full">
          <LeftSidebar />
        </div>

        {/* Menu mobile overlay */}
        {showMobileMenu && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowMobileMenu(false)}></div>
            <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-xl">
              <LeftSidebar />
            </div>
          </div>
        )}

        {/* Contenu principal - Style identique */}
        <main className="flex-1 lg:ml-64 pt-16 lg:pt-0">
          <div className="max-w-4xl mx-auto px-4 py-6 lg:px-8">
            
            {/* En-tête du profil - Style identique */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-6">
                
                {/* Photo de profil */}
                <div className="flex justify-center lg:justify-start mb-4 lg:mb-0">
                  <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl lg:text-3xl font-bold shadow-lg">
                    {profileUser.photo_profil ? (
                      <img src={profileUser.photo_profil} alt="Photo de profil" className="w-full h-full object-cover" />
                    ) : (
                      getInitials(profileUser)
                    )}
                  </div>
                </div>

                {/* Informations du profil */}
                <div className="flex-1 text-center lg:text-left">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
                    <div>
                      <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
                        {profileUser.prenom} {profileUser.nom}
                      </h1>
                      <div className="flex items-center justify-center lg:justify-start space-x-2 mb-2">
                        <p className="text-gray-600">@{profileUser.username}</p>
                        {profileUser.certified && (
                          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      {profileUser.bio && (
                        <p className="text-gray-700 mb-3">{profileUser.bio}</p>
                      )}
                      <p className="text-sm text-gray-500">
                        Membre depuis {formatDate(profileUser.created_at)}
                      </p>
                    </div>

                    {/* Boutons d'action - Style identique mais pour autre utilisateur */}
                    <div className="flex flex-col sm:flex-row gap-3 mt-4 lg:mt-0">
                      <button
                        onClick={handleFollowToggle}
                        disabled={isFollowLoading}
                        className={`px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                          isFollowing
                            ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                            : 'bg-black text-white hover:bg-gray-800'
                        }`}
                      >
                        {isFollowLoading ? 'Chargement...' : (isFollowing ? 'Ne plus suivre' : 'Suivre')}
                      </button>
                      
                      <button
                        onClick={handleSendMessage}
                        className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                      >
                        Message
                      </button>
                    </div>
                  </div>

                  {/* Statistiques - Style identique */}
                  <div className="grid grid-cols-3 gap-6 text-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{stats.posts}</div>
                      <div className="text-sm text-gray-600">Publications</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{stats.followers}</div>
                      <div className="text-sm text-gray-600">Abonnés</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{stats.following}</div>
                      <div className="text-sm text-gray-600">Abonnements</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Onglets - Style identique (seulement Posts pour les autres) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
              <div className="flex border-b border-gray-100">
                <button
                  onClick={() => setSelectedTab('posts')}
                  className="flex-1 px-6 py-4 text-sm font-medium text-black border-b-2 border-black"
                >
                  Publications ({userPosts.length})
                </button>
              </div>

              {/* Contenu des onglets - Style identique */}
              <div className="p-6">
                <div>
                  {userPosts.length > 0 ? (
                    <div className="space-y-4">
                      {userPosts.map((post) => (
                        <div key={post.id_post} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                          <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                              {profileUser.photo_profil ? (
                                <img 
                                  src={profileUser.photo_profil} 
                                  alt={profileUser.username} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-sm">
                                  {getInitials(profileUser)}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className="font-medium text-gray-900 text-sm">
                                  {profileUser.username}
                                </h3>
                                <span className="text-gray-500 text-xs">
                                  {new Date(post.created_at).toLocaleDateString('fr-FR')}
                                </span>
                              </div>
                              <p className="text-gray-900 text-sm leading-relaxed mb-3">
                                {post.content}
                              </p>
                              
                              {/* Tags */}
                              {post.tags && post.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {post.tags.map((tag, tagIndex) => (
                                    <span 
                                      key={tagIndex}
                                      className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                                    >
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Actions du post - Style identique */}
                              <div className="flex items-center space-x-4">
                                <button 
                                  onClick={() => handleLike(post.id_post)}
                                  className={`flex items-center space-x-1 transition-colors text-sm ${
                                    post.isLikedByCurrentUser 
                                      ? 'text-red-500 hover:text-red-600' 
                                      : 'text-gray-500 hover:text-red-500'
                                  }`}
                                >
                                  <svg className="w-4 h-4" fill={post.isLikedByCurrentUser ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                  </svg>
                                  <span>{post.likeCount || 0}</span>
                                </button>
                                
                                <button className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 text-sm">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                  </svg>
                                  <span>{post.commentCount || 0}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-gray-400 text-4xl mb-4">📝</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune publication</h3>
                      <p className="text-gray-600">
                        Cet utilisateur n'a pas encore publié de contenu.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default ProfileUser