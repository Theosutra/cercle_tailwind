import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, useParams } from 'react-router-dom'
import LeftSidebar from './LeftSidebar'

const Profile = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { userId } = useParams() // ✅ NOUVEAU: Pour récupérer l'ID utilisateur depuis l'URL
  const [profileUser, setProfileUser] = useState(null) // ✅ NOUVEAU: Utilisateur dont on voit le profil
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
  const [isFollowing, setIsFollowing] = useState(false) // ✅ NOUVEAU: État de suivi
  const [isFollowLoading, setIsFollowLoading] = useState(false) // ✅ NOUVEAU: Chargement du bouton follow

  // ✅ NOUVEAU: Déterminer si c'est le profil de l'utilisateur connecté ou d'un autre
  const isOwnProfile = !userId || parseInt(userId) === parseInt(user?.id_user)
  const targetUserId = isOwnProfile ? user?.id_user : parseInt(userId)

  // ✅ NOUVEAU: Fetch profile user data
  const fetchProfileUser = useCallback(async () => {
    if (isOwnProfile) {
      setProfileUser(user)
      return
    }

    try {
      const token = localStorage.getItem('accessToken')
      if (!token || !userId) return

      const response = await fetch(`/api/v1/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const userData = await response.json()
        setProfileUser(userData)
        
        // ✅ NOUVEAU: Vérifier le statut de suivi
        if (userData.id_user !== user?.id_user) {
          checkFollowStatus(userData.id_user)
        }
      } else {
        setError('Utilisateur non trouvé')
      }
    } catch (error) {
      console.error('Error fetching profile user:', error)
      setError('Erreur lors du chargement du profil')
    }
  }, [userId, isOwnProfile, user])

  // ✅ NOUVEAU: Vérifier le statut de suivi
  const checkFollowStatus = useCallback(async (targetId) => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return

      const response = await fetch(`/api/v1/follow/status/${targetId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setIsFollowing(data.isFollowing || false)
      }
    } catch (error) {
      console.error('Error checking follow status:', error)
    }
  }, [])

  // ✅ NOUVEAU: Suivre/Ne plus suivre un utilisateur
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
        const data = await response.json()
        setIsFollowing(!isFollowing)
        
        // Mettre à jour les statistiques
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

  // Fetch user stats from API
  const fetchUserStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token || !targetUserId) return

      const endpoint = isOwnProfile ? '/api/v1/auth/me' : `/api/v1/users/${targetUserId}`
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const userData = await response.json()
        setStats({
          posts: userData.stats?.posts || userData._count?.posts || 0,
          followers: userData.stats?.followers || userData._count?.followers || 0,
          following: userData.stats?.following || userData._count?.following || 0,
          likes: userData.stats?.likes || userData._count?.likes || 0
        })
      }
    } catch (error) {
      console.error('Error fetching user stats:', error)
    }
  }, [targetUserId, isOwnProfile])

  // Fetch user posts from API
  const fetchUserPosts = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token || !targetUserId) return

      const response = await fetch(`/api/v1/posts/user/${targetUserId}?limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUserPosts(data.posts || [])
      }
    } catch (error) {
      console.error('Error fetching user posts:', error)
      setUserPosts([])
    }
  }, [targetUserId])

  // Fetch liked posts from API (seulement pour son propre profil)
  const fetchLikedPosts = useCallback(async () => {
    if (!isOwnProfile) return // Les likes privés ne sont visibles que pour soi

    try {
      const token = localStorage.getItem('accessToken')
      if (!token || !targetUserId) return

      const response = await fetch(`/api/v1/likes/users/${targetUserId}/posts`, {
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
  }, [targetUserId, isOwnProfile])

  // ✅ NOUVEAU: Naviguer vers les messages avec cet utilisateur
  const handleSendMessage = () => {
    if (profileUser && !isOwnProfile) {
      navigate('/messages', { state: { selectedUserId: profileUser.id_user } })
    }
  }

  // Load all data
  useEffect(() => {
    const loadData = async () => {
      if (!targetUserId) return
      
      setLoading(true)
      setError('')
      
      try {
        await Promise.all([
          fetchProfileUser(),
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
  }, [targetUserId, fetchProfileUser, fetchUserStats, fetchUserPosts, fetchLikedPosts])

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

  // ✅ NOUVEAU: Fonction pour liker un post
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
        // Mettre à jour les posts
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

  const displayUser = profileUser || user

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
        
        <h1 className="text-lg font-semibold text-gray-900">
          {isOwnProfile ? 'Mon Profil' : `@${displayUser?.username}`}
        </h1>
        
        {isOwnProfile && (
          <button
            onClick={() => navigate('/parametres')}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex">
        {/* Sidebar gauche */}
        <div className="hidden lg:block lg:w-64 lg:fixed lg:h-full">
          <LeftSidebar />
        </div>

        {/* Contenu principal */}
        <main className="flex-1 lg:ml-64 pt-16 lg:pt-0">
          <div className="max-w-4xl mx-auto px-4 py-6 lg:px-8">
            {/* En-tête du profil */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-6">
                {/* Photo de profil */}
                <div className="flex justify-center lg:justify-start mb-4 lg:mb-0">
                  <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl lg:text-3xl font-bold shadow-lg">
                    {displayUser?.photo_profil ? (
                      <img 
                        src={displayUser.photo_profil} 
                        alt={displayUser.username} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getInitials(displayUser)
                    )}
                  </div>
                </div>

                {/* Informations du profil */}
                <div className="flex-1 text-center lg:text-left">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
                    <div>
                      <div className="flex items-center justify-center lg:justify-start space-x-2 mb-2">
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                          {displayUser?.username}
                        </h1>
                        {displayUser?.certified && (
                          <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      {displayUser?.prenom && displayUser?.nom && (
                        <p className="text-gray-600 text-lg mb-2">
                          {displayUser.prenom} {displayUser.nom}
                        </p>
                      )}
                    </div>

                    {/* ✅ NOUVEAU: Boutons d'action pour les autres profils */}
                    {!isOwnProfile && (
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                        <button
                          onClick={handleFollowToggle}
                          disabled={isFollowLoading}
                          className={`px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                            isFollowing 
                              ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' 
                              : 'bg-black text-white hover:bg-gray-800'
                          }`}
                        >
                          {isFollowLoading ? '...' : isFollowing ? 'Ne plus suivre' : 'Suivre'}
                        </button>
                        <button
                          onClick={handleSendMessage}
                          className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                        >
                          Message
                        </button>
                      </div>
                    )}

                    {/* Bouton Modifier pour son propre profil */}
                    {isOwnProfile && (
                      <div className="flex space-x-3">
                        <button
                          onClick={() => navigate('/parametres')}
                          className="px-6 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                        >
                          Modifier le profil
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Bio */}
                  {displayUser?.bio && (
                    <p className="text-gray-700 mb-4 text-sm lg:text-base">
                      {displayUser.bio}
                    </p>
                  )}

                  {/* Date d'inscription */}
                  <p className="text-gray-500 text-sm">
                    Membre depuis {formatDate(displayUser?.created_at)}
                  </p>
                </div>
              </div>

              {/* Statistiques */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
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
                {isOwnProfile && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{stats.likes}</div>
                    <div className="text-sm text-gray-600">J'aime</div>
                  </div>
                )}
              </div>
            </div>

            {/* Onglets */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
              <div className="flex border-b border-gray-100">
                <button
                  onClick={() => setSelectedTab('posts')}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                    selectedTab === 'posts'
                      ? 'text-black border-b-2 border-black'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Publications ({userPosts.length})
                </button>
                {isOwnProfile && (
                  <button
                    onClick={() => setSelectedTab('liked')}
                    className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                      selectedTab === 'liked'
                        ? 'text-black border-b-2 border-black'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    J'aime ({likedPosts.length})
                  </button>
                )}
              </div>

              {/* Contenu des onglets */}
              <div className="p-6">
                {selectedTab === 'posts' && (
                  <div>
                    {userPosts.length > 0 ? (
                      <div className="space-y-4">
                        {userPosts.map((post) => (
                          <div key={post.id_post} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                            <div className="flex items-start space-x-3">
                              <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                {displayUser?.photo_profil ? (
                                  <img 
                                    src={displayUser.photo_profil} 
                                    alt={displayUser.username} 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-sm">
                                    {getInitials(displayUser)}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h3 className="font-medium text-gray-900 text-sm">
                                    {displayUser?.username}
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

                                {/* Actions du post */}
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

                                  <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors text-sm">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    <span>{post.replyCount || 0}</span>
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
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          {isOwnProfile ? 'Aucune publication' : `${displayUser?.username} n'a pas encore publié`}
                        </h3>
                        <p className="text-gray-600 text-sm mb-6">
                          {isOwnProfile ? 'Commencez à partager vos moments avec votre cercle' : 'Revenez plus tard pour voir ses publications'}
                        </p>
                        {isOwnProfile && (
                          <button
                            onClick={() => navigate('/feed')}
                            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                          >
                            Créer une publication
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {selectedTab === 'liked' && isOwnProfile && (
                  <div>
                    {likedPosts.length > 0 ? (
                      <div className="space-y-4">
                        {likedPosts.map((post) => (
                          <div key={post.id_post} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                {post.author?.photo_profil ? (
                                  <img 
                                    src={post.author.photo_profil} 
                                    alt={post.author.username} 
                                    className="w-full h-full object-cover rounded-full"
                                  />
                                ) : (
                                  <span className="text-white text-sm font-bold">
                                    {getInitials(post.author)}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h3 className="font-medium text-gray-900 text-sm">
                                    {post.author?.username}
                                  </h3>
                                  <span className="text-gray-500 text-xs">
                                    {new Date(post.created_at).toLocaleDateString('fr-FR')}
                                  </span>
                                </div>
                                <p className="text-gray-900 text-sm">{post.content}</p>
                                <div className="flex items-center space-x-4 mt-3">
                                  <button className="flex items-center space-x-1 text-red-500">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                    <span className="text-sm">{post.likeCount || 0}</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="text-gray-400 text-4xl mb-3">❤️</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun post aimé</h3>
                        <p className="text-gray-600 text-sm mb-6">Les posts que vous aimez apparaîtront ici</p>
                        <button
                          onClick={() => navigate('/feed')}
                          className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                        >
                          Découvrir des posts
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Menu mobile overlay */}
      {showMobileMenu && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setShowMobileMenu(false)}>
          <div className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl">
            <LeftSidebar />
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile