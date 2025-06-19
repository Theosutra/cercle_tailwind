// src/components/onboarding/OnboardingStep2.jsx - Version UX/UI optimisée
import { useState, useEffect } from 'react'

const OnboardingStep2 = ({ onNext, user, loading, setLoading, stepData }) => {
  const [recommendedUsers, setRecommendedUsers] = useState([])
  const [followingUsers, setFollowingUsers] = useState(new Set(stepData?.followingUsers || []))
  const [error, setError] = useState('')
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)

  // Charger les recommandations d'utilisateurs
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setIsLoadingUsers(true)
        const token = localStorage.getItem('accessToken')
        if (!token) {
          setError('Session expirée')
          return
        }

        const response = await fetch('/api/v1/users/recommendations?limit=8', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          setRecommendedUsers(Array.isArray(data) ? data : data.users || [])
        } else {
          // Fallback vers les utilisateurs suggérés
          const fallbackResponse = await fetch('/api/v1/users/suggested?limit=8', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json()
            const users = fallbackData.users || []
            setRecommendedUsers(users.filter(u => u.id_user !== user.id_user))
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des recommandations:', error)
        setError('Impossible de charger les recommandations')
      } finally {
        setIsLoadingUsers(false)
      }
    }

    fetchRecommendations()
  }, [user.id_user])

  const handleFollow = async (userId) => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return

      const response = await fetch(`/api/v1/follow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ followed_id: userId })
      })

      if (response.ok) {
        setFollowingUsers(prev => new Set([...prev, userId]))
      } else {
        const errorData = await response.json()
        console.error('Erreur lors du suivi:', errorData)
      }
    } catch (error) {
      console.error('Erreur lors du suivi:', error)
    }
  }

  const handleUnfollow = async (userId) => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return

      const response = await fetch(`/api/v1/follow/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        setFollowingUsers(prev => {
          const newSet = new Set(prev)
          newSet.delete(userId)
          return newSet
        })
      }
    } catch (error) {
      console.error('Erreur lors du désabonnement:', error)
    }
  }

  const handleContinue = () => {
    const stepData = {
      followingUsers: Array.from(followingUsers),
      followedCount: followingUsers.size
    }
    onNext(stepData)
  }

  const getUserInitials = (user) => {
    return `${user.prenom?.charAt(0) || ''}${user.nom?.charAt(0) || ''}`.toUpperCase()
  }

  return (
    <div className="p-6 sm:p-8">
      {/* En-tête */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Trouvez vos amis
        </h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Découvrez des personnes que vous pourriez connaître et commencez à construire votre réseau
        </p>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Statistiques */}
      {followingUsers.size > 0 && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-center">
            <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-green-700 text-sm font-medium">
              Vous suivez maintenant {followingUsers.size} {followingUsers.size === 1 ? 'personne' : 'personnes'}
            </p>
          </div>
        </div>
      )}

      {/* Liste des utilisateurs recommandés */}
      <div className="space-y-4">
        {isLoadingUsers ? (
          // Skeleton loading
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="w-20 h-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : recommendedUsers.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune recommandation</h3>
            <p className="text-gray-500">Nous n'avons pas trouvé d'utilisateurs à vous recommander pour le moment.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {recommendedUsers.map((recommendedUser) => (
              <div 
                key={recommendedUser.id_user} 
                className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  {/* Photo de profil */}
                  <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                    {recommendedUser.photo_profil ? (
                      <img 
                        src={recommendedUser.photo_profil} 
                        alt={recommendedUser.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                        <span className="text-gray-600 font-medium text-sm">
                          {getUserInitials(recommendedUser)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Infos utilisateur */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {recommendedUser.username}
                      </h3>
                      {recommendedUser.certified && (
                        <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {recommendedUser.prenom} {recommendedUser.nom}
                    </p>
                    {recommendedUser.bio && (
                      <p className="text-xs text-gray-400 truncate mt-1">
                        {recommendedUser.bio}
                      </p>
                    )}
                    {/* Stats */}
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>{recommendedUser._count?.followers || 0} followers</span>
                      <span>{recommendedUser._count?.posts || 0} posts</span>
                    </div>
                  </div>

                  {/* Bouton de suivi */}
                  <button
                    onClick={() => 
                      followingUsers.has(recommendedUser.id_user) 
                        ? handleUnfollow(recommendedUser.id_user)
                        : handleFollow(recommendedUser.id_user)
                    }
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 min-w-[80px] ${
                      followingUsers.has(recommendedUser.id_user)
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : 'bg-black text-white hover:bg-gray-800'
                    }`}
                  >
                    {followingUsers.has(recommendedUser.id_user) ? (
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>Suivi</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>Suivre</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message d'encouragement */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center space-x-2 text-sm text-gray-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Vous pourrez toujours suivre d'autres personnes plus tard</span>
        </div>
      </div>
    </div>
  )
}

export default OnboardingStep2