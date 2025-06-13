import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import LeftSidebar from './LeftSidebar'

const Parametres = () => {
  const { user, logout, updateUser } = useAuth()
  const navigate = useNavigate()
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
    try {
      setLoading(true)
      setError('')
      setSuccess('')

      const token = localStorage.getItem('accessToken')
      if (!token) {
        setError('Token d\'authentification manquant')
        return
      }

      // Préparer les données pour l'API
      const updateData = Object.entries(formData).reduce((acc, [key, value]) => {
        // Exclure les champs non modifiables (nom et prenom)
        if (key === 'nom' || key === 'prenom') {
          return acc
        }
        // Inclure seulement les valeurs non vides
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value
        }
        return acc
      }, {})

      console.log('Updating profile with data:', updateData)

      const response = await fetch('/api/v1/users/me', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Erreur ${response.status}`)
      }

      const updatedUser = await response.json()
      
      // Update user in context and localStorage
      updateUser(updatedUser)
      
      setSuccess('Profil mis à jour avec succès')
      setIsEditing(false)
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Error updating profile:', error)
      setError(error.message || 'Erreur lors de la mise à jour du profil')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setError('')
    setSuccess('')
    // Reset form data to original user data
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
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/', { replace: true })
    } catch (error) {
      console.error('Erreur de déconnexion:', error)
    }
  }

  const handleChangePassword = () => {
    // TODO: Implement password change modal or redirect
    alert('Fonctionnalité de changement de mot de passe à implémenter')
  }

  const handleDelete2FA = () => {
    // TODO: Implement 2FA management
    alert('Gestion de l\'authentification à deux facteurs à implémenter')
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
        
        <h1 className="text-lg font-semibold text-gray-900">Paramètres</h1>
        
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          {user?.photo_profil ? (
            <img 
              src={user.photo_profil} 
              alt="Profile" 
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <span className="text-white font-bold text-xs">
              {getInitials(user)}
            </span>
          )}
        </div>
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

            {/* Header - Plus compact */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="mb-4 sm:mb-0">
                  <h1 className="text-2xl font-bold text-gray-900">Paramètres du profil</h1>
                  <p className="text-sm text-gray-600 mt-1">Gérez vos informations personnelles et vos préférences</p>
                </div>
                
                {/* Action buttons - Taille réduite */}
                <div className="flex flex-col sm:flex-row gap-2">
                  {!isEditing ? (
                    <>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm"
                      >
                        Modifier le profil
                      </button>
                      <button
                        onClick={handleLogout}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
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
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                      >
                        Annuler
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Messages d'état - Plus compacts */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mt-4 text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg mt-4 text-sm">
                  {success}
                </div>
              )}
            </div>

            {/* Grid Layout - Responsive et compact */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Profile Photo Section - Plus petit */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Photo de profil</h2>
                  
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-4 border-gray-100 mb-4">
                      {user?.photo_profil ? (
                        <img 
                          src={user.photo_profil} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <span className="text-white font-bold text-xl">
                            {getInitials(user)}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <button className="text-sm bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                      Changer la photo
                    </button>
                  </div>
                </div>
              </div>

              {/* Form Section - Plus organisé */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Informations personnelles */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations personnelles</h2>
                  
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                          <input
                            type="text"
                            name="prenom"
                            value={formData.prenom}
                            onChange={handleInputChange}
                            disabled
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed text-sm"
                            placeholder="Votre prénom"
                          />
                          <p className="text-xs text-gray-500 mt-1">Non modifiable</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                          <input
                            type="text"
                            name="nom"
                            value={formData.nom}
                            onChange={handleInputChange}
                            disabled
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed text-sm"
                            placeholder="Votre nom"
                          />
                          <p className="text-xs text-gray-500 mt-1">Non modifiable</p>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom d'utilisateur</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-gray-500 text-sm">@</span>
                          <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                            placeholder="nom_utilisateur"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                        <textarea
                          name="bio"
                          value={formData.bio}
                          onChange={handleInputChange}
                          rows="3"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm resize-none"
                          placeholder="Parlez-nous de vous..."
                          maxLength="160"
                        />
                        <p className="text-xs text-gray-500 mt-1">{formData.bio.length}/160 caractères</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
                        <input
                          type="date"
                          name="date_naissance"
                          value={formData.date_naissance}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Prénom</label>
                          <p className="text-sm text-gray-900">{user?.prenom || 'Non renseigné'}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Nom</label>
                          <p className="text-sm text-gray-900">{user?.nom || 'Non renseigné'}</p>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Nom d'utilisateur</label>
                        <p className="text-sm text-gray-900">@{user?.username}</p>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Bio</label>
                        <p className="text-sm text-gray-900">{user?.bio || 'Aucune bio configurée'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Date de naissance</label>
                        <p className="text-sm text-gray-900">
                          {user?.date_naissance 
                            ? new Date(user.date_naissance).toLocaleDateString('fr-FR')
                            : 'Non renseignée'
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Informations de contact */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations de contact</h2>
                  
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          name="mail"
                          value={formData.mail}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                          placeholder="votre@email.com"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                        <input
                          type="tel"
                          name="telephone"
                          value={formData.telephone}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                          placeholder="+33 6 12 34 56 78"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                        <p className="text-sm text-gray-900">{user?.mail}</p>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Téléphone</label>
                        <p className="text-sm text-gray-900">{user?.telephone || 'Non renseigné'}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Préférences */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Préférences</h2>
                  
                  <div className="space-y-4">
                    {/* Notifications */}
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Notifications par email</p>
                        <p className="text-xs text-gray-500">Recevoir des notifications par email</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-black rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                      </label>
                    </div>
                    
                    {/* Visibilité du profil */}
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Profil privé</p>
                        <p className="text-xs text-gray-500">Seuls vos followers peuvent voir vos posts</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          name="private"
                          checked={formData.private}
                          onChange={handleInputChange}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-black rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                      </label>
                    </div>
                    
                    {/* Mode sombre */}
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Mode sombre</p>
                        <p className="text-xs text-gray-500">Activer le thème sombre</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-black rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Section Sécurité */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Sécurité</h2>
                  
                  <div className="space-y-3">
                    <button 
                      onClick={handleChangePassword}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Changer le mot de passe</p>
                          <p className="text-xs text-gray-500">Dernière modification il y a 3 mois</p>
                        </div>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                    
                    <button 
                      onClick={handleDelete2FA}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Authentification à deux facteurs</p>
                          <p className="text-xs text-gray-500">Sécurisez votre compte</p>
                        </div>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                    
                    <button 
                      onClick={handleDeleteAccount}
                      className="w-full text-left p-3 rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-red-600">Supprimer le compte</p>
                          <p className="text-xs text-red-500">Cette action est irréversible</p>
                        </div>
                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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