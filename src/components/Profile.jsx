import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, useParams } from 'react-router-dom'
import LeftSidebar from './LeftSidebar'

const Profile = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { userId } = useParams()
  const [profileUser, setProfileUser] = useState(null)
  const [selectedTab, setSelectedTab] = useState('posts')
  const [userPosts, setUserPosts] = useState([])
  const [likedPosts, setLikedPosts] = useState([])
  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0,
    likes: 0
  })
  
  // ✅ États de chargement séparés pour un affichage progressif
  const [profileLoading, setProfileLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [postsLoading, setPostsLoading] = useState(true)
  
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [error, setError] = useState('')
  const [isFollowing, setIsFollowing] = useState(false)
  const [isFollowLoading, setIsFollowLoading] = useState(false)

  const isOwnProfile = !userId || parseInt(userId) === parseInt(user?.id_user)
  const targetUserId = isOwnProfile ? user?.id_user : userId
  const displayUser = isOwnProfile ? user : profileUser

  // ✅ 1. Chargement IMMÉDIAT des infos de base (le plus critique)
  const fetchProfileUser = useCallback(async () => {
    if (isOwnProfile) {
      setProfileUser(user)
      setProfileLoading(false)
      return
    }

    if (!userId) {
      setError('ID utilisateur manquant')
      setProfileLoading(false)
      return
    }

    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        setError('Token manquant')
        setProfileLoading(false)
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
    } finally {
      setProfileLoading(false)
    }
  }, [userId, isOwnProfile, user])

  // ✅ 2. Chargement des statistiques (en arrière-plan)
  const fetchUserStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token || !targetUserId) return

      const response = await fetch(`/api/v1/users/${targetUserId}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const statsData = await response.json()
        setStats(statsData)
      }
    } catch (error) {
      console.error('Error fetching user stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }, [targetUserId])

  // ✅ 3. Chargement des posts (pagination pour de meilleures perfs)
  const fetchUserPosts = useCallback(async (page = 1, limit = 10) => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token || !targetUserId) return

      const response = await fetch(`/api/v1/posts/user/${targetUserId}?page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const postsData = await response.json()
        const posts = postsData.posts || postsData || []
        if (page === 1) {
          setUserPosts(Array.isArray(posts) ? posts : [])
        } else {
          setUserPosts(prev => [...prev, ...(Array.isArray(posts) ? posts : [])])
        }
      }
    } catch (error) {
      console.error('Error fetching user posts:', error)
      setUserPosts([])
    } finally {
      setPostsLoading(false)
    }
  }, [targetUserId])

  // ✅ Chargement des posts likés
  const fetchLikedPosts = useCallback(async () => {
    if (!isOwnProfile) return

    try {
      const token = localStorage.getItem('accessToken')
      if (!token || !user?.id_user) return

      const response = await fetch(`/api/v1/likes/users/${user.id_user}/posts?page=1&limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        // La réponse contient { posts: [...], pagination: {...} }
        setLikedPosts(data.posts || [])
      } else {
        console.error('Error response:', response.status, response.statusText)
        setLikedPosts([])
      }
    } catch (error) {
      console.error('Error fetching liked posts:', error)
      setLikedPosts([])
    }
  }, [isOwnProfile, user?.id_user])

  // ✅ CHARGEMENT PROGRESSIF - Affiche immédiatement le profil, puis charge le reste
  useEffect(() => {
    if (!targetUserId) return

    // 1. Charger immédiatement le profil (critique pour l'affichage)
    fetchProfileUser()

    // 2. Charger stats et posts en parallèle après (moins critique)
    const timer = setTimeout(() => {
      Promise.all([
        fetchUserStats(),
        fetchUserPosts(1, 10) // Seulement les 10 premiers posts
      ])
      
      // 3. Charger les posts likés seulement si c'est notre profil
      if (isOwnProfile) {
        setTimeout(() => {
          fetchLikedPosts()
        }, 200) // Légèrement différé pour ne pas surcharger
      }
    }, 100) // Délai minimal pour permettre l'affichage immédiat

    return () => clearTimeout(timer)
  }, [targetUserId, fetchProfileUser, fetchUserStats, fetchUserPosts, fetchLikedPosts, isOwnProfile])

  // ✅ Gestion du follow/unfollow (identique)
  const handleFollowToggle = async () => {
    if (!profileUser || isFollowLoading) return

    setIsFollowLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      const endpoint = isFollowing ? `/api/v1/follow/${profileUser.id_user}` : `/api/v1/follow/${profileUser.id_user}`
      const method = isFollowing ? 'DELETE' : 'POST'
      
      const response = await fetch(endpoint, {
        method: method,
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

  // ✅ Gestion des likes (identique)
  const handleLikePost = async (postId) => {
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
        setUserPosts(prevPosts =>
          prevPosts.map(post =>
            post.id_post === postId
              ? { 
                  ...post, 
                  isLikedByCurrentUser: data.isLiked || data.liked,
                  likeCount: data.likeCount || data.likesCount || post.likeCount
                }
              : post
          )
        )
        
        // Mettre à jour aussi les posts likés si c'est notre profil
        if (isOwnProfile && selectedTab === 'liked') {
          if (data.isLiked) {
            // Ajouter aux posts likés si on vient de liker
            fetchLikedPosts()
          } else {
            // Retirer des posts likés si on a unliké
            setLikedPosts(prev => prev.filter(p => p.id_post !== postId))
          }
        }
      }
    } catch (error) {
      console.error('Error liking post:', error)
    }
  }

  const handleSendMessage = () => {
    if (profileUser) {
      navigate('/messages', { state: { selectedUserId: profileUser.id_user } })
    }
  }

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

  // ✅ Affichage immédiat même pendant le chargement du profil
  if (profileLoading) {
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

  if (!displayUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">👤</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Utilisateur non trouvé</h2>
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
      {/* Header mobile */}
      <div className="lg:hidden bg-white shadow-sm p-4 flex items-center justify-between fixed top-0 left-0 right-0 z-50">
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        <h1 className="text-lg font-semibold">
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

        {/* Menu mobile */}
        {showMobileMenu && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setShowMobileMenu(false)}>
            <div className="w-64 h-full bg-white">
              <LeftSidebar />
            </div>
          </div>
        )}

        {/* Contenu principal */}
        <main className="flex-1 lg:ml-64 pt-16 lg:pt-0">
          <div className="max-w-4xl mx-auto px-4 py-6 lg:px-8">
            {/* En-tête du profil - AFFICHÉ IMMÉDIATEMENT */}
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

                    {/* Boutons d'action pour les autres profils */}
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

              {/* Statistiques - AFFICHAGE PROGRESSIF */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {statsLoading ? (
                      <div className="animate-pulse bg-gray-200 h-8 w-8 mx-auto rounded"></div>
                    ) : (
                      stats.posts
                    )}
                  </div>
                  <div className="text-sm text-gray-600">Publications</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {statsLoading ? (
                      <div className="animate-pulse bg-gray-200 h-8 w-8 mx-auto rounded"></div>
                    ) : (
                      stats.followers
                    )}
                  </div>
                  <div className="text-sm text-gray-600">Abonnés</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {statsLoading ? (
                      <div className="animate-pulse bg-gray-200 h-8 w-8 mx-auto rounded"></div>
                    ) : (
                      stats.following
                    )}
                  </div>
                  <div className="text-sm text-gray-600">Abonnements</div>
                </div>
                {isOwnProfile && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {statsLoading ? (
                        <div className="animate-pulse bg-gray-200 h-8 w-8 mx-auto rounded"></div>
                      ) : (
                        stats.likes
                      )}
                    </div>
                    <div className="text-sm text-gray-600">J'aime</div>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation des onglets */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
              <div className="flex border-b border-gray-100">
                <button
                  onClick={() => setSelectedTab('posts')}
                  className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                    selectedTab === 'posts'
                      ? 'text-black border-b-2 border-black'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Publications
                </button>
                {isOwnProfile && (
                  <button
                    onClick={() => setSelectedTab('liked')}
                    className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                      selectedTab === 'liked'
                        ? 'text-black border-b-2 border-black'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    J'aime
                  </button>
                )}
              </div>

              {/* Contenu des onglets - AFFICHAGE PROGRESSIF */}
              <div className="p-6">
                {selectedTab === 'posts' && (
                  <div>
                    {postsLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="animate-pulse">
                            <div className="flex space-x-3 p-4 border border-gray-100 rounded-lg">
                              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                              <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : userPosts.length > 0 ? (
                      <div className="space-y-6">
                        {userPosts.map((post) => (
                          <article key={post.id_post} className="border border-gray-100 rounded-lg p-6 hover:shadow-sm transition-shadow">
                            <div className="flex items-start space-x-3">
                              <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                {post.author?.photo_profil ? (
                                  <img src={post.author.photo_profil} alt={post.author.username} className="w-full h-full object-cover" />
                                ) : (
                                  getInitials(post.author)
                                )}
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h3 className="font-semibold text-gray-900">{post.author?.username}</h3>
                                  {post.author?.certified && (
                                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                  <span className="text-gray-500 text-sm">{formatDate(post.created_at)}</span>
                                </div>
                                
                                <p className="text-gray-800 mb-4 whitespace-pre-wrap">{post.content}</p>
                                
                                {/* Actions */}
                                <div className="flex items-center space-x-6 text-gray-500">
                                  <button
                                    onClick={() => handleLikePost(post.id_post)}
                                    className={`flex items-center space-x-2 hover:text-red-500 transition-colors ${
                                      post.isLikedByCurrentUser ? 'text-red-500' : ''
                                    }`}
                                  >
                                    <svg className="w-5 h-5" fill={post.isLikedByCurrentUser ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                    <span>{post.likeCount || 0}</span>
                                  </button>
                                  
                                  <button 
                                    onClick={() => navigate(`/post/${post.id_post}`)}
                                    className="flex items-center space-x-2 hover:text-blue-500 transition-colors"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    <span>{post.replyCount || 0}</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="text-gray-400 text-5xl mb-4">📝</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          {isOwnProfile ? 'Aucune publication' : 'Aucune publication pour le moment'}
                        </h3>
                        <p className="text-gray-600">
                          {isOwnProfile 
                            ? 'Commencez à partager vos idées !' 
                            : 'Cet utilisateur n\'a pas encore publié de contenu.'
                          }
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {selectedTab === 'liked' && isOwnProfile && (
                  <div>
                    {likedPosts.length > 0 ? (
                      <div className="space-y-6">
                        {likedPosts.map((post) => (
                          <article key={post.id_post} className="border border-gray-100 rounded-lg p-6 hover:shadow-sm transition-shadow">
                            <div className="flex items-start space-x-3">
                              <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                {post.author?.photo_profil ? (
                                  <img src={post.author.photo_profil} alt={post.author.username} className="w-full h-full object-cover" />
                                ) : (
                                  getInitials(post.author)
                                )}
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h3 className="font-semibold text-gray-900">{post.author?.username}</h3>
                                  {post.author?.certified && (
                                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                  <span className="text-gray-500 text-sm">{formatDate(post.created_at)}</span>
                                </div>
                                
                                <p className="text-gray-800 mb-4 whitespace-pre-wrap">{post.content}</p>
                                
                                {/* Actions */}
                                <div className="flex items-center space-x-6 text-gray-500">
                                  <button
                                    onClick={() => handleLikePost(post.id_post)}
                                    className="flex items-center space-x-2 text-red-500"
                                  >
                                    <svg className="w-5 h-5" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                    <span>{post.likeCount || 0}</span>
                                  </button>
                                  
                                  <button 
                                    onClick={() => navigate(`/post/${post.id_post}`)}
                                    className="flex items-center space-x-2 hover:text-blue-500 transition-colors"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    <span>{post.replyCount || 0}</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="text-gray-400 text-5xl mb-4">❤️</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun post liké</h3>
                        <p className="text-gray-600">Les posts que vous aimez apparaîtront ici.</p>
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