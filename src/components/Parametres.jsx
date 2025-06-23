import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext' // ✅ Ajout du hook theme
import LeftSidebar from './LeftSidebar'

const Parametres = () => {
  const { user, logout, updateUser } = useAuth()
  const navigate = useNavigate()
  const { isDarkMode, toggleTheme, isInitialized } = useTheme() // ✅ Ajout isInitialized
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  
  // Form data
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    username: '',
    mail: '',
    bio: '',
    date_naissance: '',
    telephone: '',
    private: false
  })

  // Initialize form data from user
  useEffect(() => {
    if (user) {
      console.log('Current user data:', user) // Debug pour voir les données
      setFormData({
        prenom: user.prenom || '',
        nom: user.nom || '',
        username: user.username || '',
        mail: user.mail || '',
        bio: user.bio || '',
        date_naissance: user.date_naissance ? user.date_naissance.split('T')[0] : '',
        telephone: user.telephone || '', // S'assurer que le téléphone est bien récupéré
        private: user.private || false
      })
    }
  }, [user])

  // Fonction pour rafraîchir les données utilisateur depuis l'API
  const refreshUserData = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return

      const response = await fetch('/api/v1/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const userData = await response.json()
        console.log('Refreshed user data:', userData) // Debug
        updateUser(userData)
      }
    } catch (error) {
      console.error('Error refreshing user data:', error)
    }
  }

  // Rafraîchir les données au chargement du composant
  useEffect(() => {
    refreshUserData()
  }, [])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSaveProfile = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('accessToken')
      
      const response = await fetch('/api/v1/users/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const updatedUser = await response.json()
        updateUser(updatedUser)
        setSuccess('Profil mis à jour avec succès !')
        setIsEditing(false)
        
        // Rafraîchir les données pour être sûr
        await refreshUserData()
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelEdit = () => {
    // Restaurer les données originales
    if (user) {
      setFormData({
        prenom: user.prenom || '',
        nom: user.nom || '',
        username: user.username || '',
        mail: user.mail || '',
        bio: user.bio || '',
        date_naissance: user.date_naissance ? user.date_naissance.split('T')[0] : '',
        telephone: user.telephone || '',
        private: user.private || false
      })
    }
    setIsEditing(false)
    setError('')
    setSuccess('')
  }

  const handleChangePassword = () => {
    // TODO: Implement password change
    alert('Changement de mot de passe à implémenter')
  }

  const handleDelete2FA = () => {
    // TODO: Implement 2FA management
    alert('Gestion 2FA à implémenter')
  }

  const handleDeleteAccount = () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) {
      // TODO: Implement account deletion
      alert('Suppression de compte à implémenter')
    }
  }

  const getInitials = (user) => {
    if (!user) return 'U'
    if (user.prenom && user.nom) {
      return `${user.prenom[0]}${user.nom[0]}`.toUpperCase()
    }
    return user.username?.[0]?.toUpperCase() || 'U'
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between fixed top-0 left-0 right-0 z-30 transition-colors duration-200">
        <button 
          onClick={() => setShowMobileMenu(true)}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <svg className="w-6 h-6 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Paramètres</h1>
        
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          {user?.photo_profil ? (
            <img src={user.photo_profil} alt="Profile" className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="text-white text-sm font-medium">{getInitials(user)}</span>
          )}
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex">
        {/* Left Sidebar - Desktop */}
        <div className="hidden lg:block">
          <LeftSidebar />
        </div>

        {/* Mobile Menu Overlay */}
        {showMobileMenu && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowMobileMenu(false)} />
            <div className="absolute left-0 top-0 h-full w-80 bg-white dark:bg-gray-800 transition-colors duration-200">
              <LeftSidebar onClose={() => setShowMobileMenu(false)} />
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 lg:pl-80 pt-16 lg:pt-0">
          <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
            
            {/* Header Section */}
            <div className="mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-colors duration-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      {user?.photo_profil ? (
                        <img src={user.photo_profil} alt="Profile" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-white text-xl font-bold">{getInitials(user)}</span>
                      )}
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {user?.prenom && user?.nom ? `${user.prenom} ${user.nom}` : user?.username || 'Utilisateur'}
                      </h1>
                      <p className="text-gray-600 dark:text-gray-400">@{user?.username}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {!isEditing ? (
                      <>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="bg-white dark:bg-black text-black dark:text-white border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium text-sm"
                        >
                          Modifier le profil
                        </button>
                        <button
                          onClick={logout}
                          className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium text-sm"
                        >
                          Se déconnecter
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleSaveProfile}
                          disabled={loading}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 text-sm"
                        >
                          {loading ? 'Sauvegarde...' : 'Sauvegarder'}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium text-sm"
                        >
                          Annuler
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Messages d'état */}
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-3 py-2 rounded-lg mt-4 text-sm">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-3 py-2 rounded-lg mt-4 text-sm">
                    {success}
                  </div>
                )}
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Profile Photo Section */}
              <div className="lg:col-span-1">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-colors duration-200">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Photo de profil</h2>
                  
                  <div className="text-center space-y-4">
                    <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-4 border-gray-100 dark:border-gray-700">
                      {user?.photo_profil ? (
                        <img src={user.photo_profil} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <span className="text-white text-xl font-bold">{getInitials(user)}</span>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <button className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors text-sm font-medium">
                        Changer la photo
                      </button>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">JPG, PNG ou GIF. Max 5MB.</p>
                    </div>
                  </div>
                </div>
                
                {/* Section Préférences - ✅ BOUTON MODE DARK FONCTIONNEL */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mt-6 transition-colors duration-200">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Préférences</h2>
                  
                  <div className="space-y-3">
                    {/* Mode sombre - ✅ BOUTON FONCTIONNEL AVEC DEBUG */}
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Mode sombre</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Activer le thème sombre</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={isDarkMode}
                          onChange={(e) => {
                            console.log('🔄 Bouton cliqué, nouvelle valeur:', !isDarkMode);
                            toggleTheme();
                          }}
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-black dark:peer-focus:ring-white rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black dark:peer-checked:bg-white"></div>
                      </label>
                    </div>

                    {/* Notifications */}
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Notifications</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Recevoir les notifications</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-black dark:peer-focus:ring-white rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black dark:peer-checked:bg-white"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Profile Form */}
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-colors duration-200">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Informations personnelles</h2>
                  
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prénom</label>
                          <input
                            type="text"
                            name="prenom"
                            value={formData.prenom}
                            onChange={handleInputChange}
                            disabled
                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed text-sm"
                            placeholder="Votre prénom"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Non modifiable</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom</label>
                          <input
                            type="text"
                            name="nom"
                            value={formData.nom}
                            onChange={handleInputChange}
                            disabled
                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed text-sm"
                            placeholder="Votre nom"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Non modifiable</p>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom d'utilisateur</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-gray-500 dark:text-gray-400 text-sm">@</span>
                          <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            placeholder="nom_utilisateur"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                        <textarea
                          name="bio"
                          value={formData.bio}
                          onChange={handleInputChange}
                          rows="3"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent text-sm resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          placeholder="Parlez-nous de vous..."
                          maxLength="160"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formData.bio.length}/160 caractères</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date de naissance</label>
                        <input
                          type="date"
                          name="date_naissance"
                          value={formData.date_naissance}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone</label>
                        <input
                          type="tel"
                          name="telephone"
                          value={formData.telephone}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          placeholder="+33 1 23 45 67 89"
                        />
                      </div>

                      {/* Compte privé */}
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Compte privé</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Seuls vos abonnés peuvent voir vos posts</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            name="private"
                            checked={formData.private}
                            onChange={handleInputChange}
                            className="sr-only peer" 
                          />
                          <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-black dark:peer-focus:ring-white rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black dark:peer-checked:bg-white"></div>
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prénom</label>
                          <p className="text-sm text-gray-900 dark:text-gray-100 py-2">{user?.prenom || 'Non renseigné'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom</label>
                          <p className="text-sm text-gray-900 dark:text-gray-100 py-2">{user?.nom || 'Non renseigné'}</p>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom d'utilisateur</label>
                        <p className="text-sm text-gray-900 dark:text-gray-100 py-2">@{user?.username}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                        <p className="text-sm text-gray-900 dark:text-gray-100 py-2">{user?.bio || 'Aucune bio renseignée'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                        <p className="text-sm text-gray-900 dark:text-gray-100 py-2">{user?.mail}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date de naissance</label>
                        <p className="text-sm text-gray-900 dark:text-gray-100 py-2">
                          {user?.date_naissance 
                            ? new Date(user.date_naissance).toLocaleDateString('fr-FR')
                            : 'Non renseignée'
                          }
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone</label>
                        <p className="text-sm text-gray-900 dark:text-gray-100 py-2">{user?.telephone || 'Non renseigné'}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type de compte</label>
                        <p className="text-sm text-gray-900 dark:text-gray-100 py-2">
                          {user?.private ? 'Privé' : 'Public'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section Sécurité */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mt-6 transition-colors duration-200">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Sécurité</h2>
                  
                  <div className="space-y-3">
                    <button 
                      onClick={handleChangePassword}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Changer le mot de passe</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Dernière modification il y a 3 mois</p>
                        </div>
                        <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                    
                    <button 
                      onClick={handleDelete2FA}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Authentification à deux facteurs</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Sécurisez votre compte</p>
                        </div>
                        <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                    
                    <button 
                      onClick={handleDeleteAccount}
                      className="w-full text-left p-3 rounded-lg border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-red-600 dark:text-red-400">Supprimer le compte</p>
                          <p className="text-xs text-red-500 dark:text-red-500">Cette action est irréversible</p>
                        </div>
                        <svg className="w-4 h-4 text-red-400 dark:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Parametres