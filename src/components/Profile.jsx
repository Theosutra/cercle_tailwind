// src/components/Profile.jsx
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import LeftSidebar from './LeftSidebar'

const Profile = () => {
  const { user, logout, updateUser } = useAuth()
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    prenom: user?.prenom || '',
    nom: user?.nom || '',
    username: user?.username || '',
    mail: user?.mail || '',
    telephone: user?.telephone || '',
    bio: user?.bio || ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/', { replace: true })
    } catch (error) {
      console.error('Erreur de déconnexion:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSaveProfile = async () => {
    setLoading(true)
    setError('')
    setSuccess('')
    
    try {
      // Ici vous pourrez ajouter l'appel API pour mettre à jour le profil
      // const updatedUser = await UserService.updateProfile(editForm)
      
      // Pour l'instant, on simule la mise à jour
      const updatedUser = { ...user, ...editForm }
      updateUser(updatedUser)
      
      setSuccess('Profil mis à jour avec succès!')
      setIsEditing(false)
      
      // Masquer le message de succès après 3 secondes
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError('Erreur lors de la mise à jour du profil')
      console.error('Profile update error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setEditForm({
      prenom: user?.prenom || '',
      nom: user?.nom || '',
      username: user?.username || '',
      mail: user?.mail || '',
      telephone: user?.telephone || '',
      bio: user?.bio || ''
    })
    setIsEditing(false)
    setError('')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar gauche */}
      <LeftSidebar />
      
      {/* Contenu principal avec marge pour la sidebar */}
      <div className="ml-72 flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          
          {/* En-tête */}
          <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-6">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-200">
                    {user?.photo_profil ? (
                      <img 
                        src={user.photo_profil} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                        <span className="text-white font-bold text-3xl">
                          {user?.prenom?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Badge certifié */}
                  {user?.certified && (
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center border-4 border-white">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    </div>
                  )}
                </div>

                {/* Informations de base */}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {user?.prenom && user?.nom 
                      ? `${user.prenom} ${user.nom}` 
                      : user?.username || 'Utilisateur'
                    }
                  </h1>
                  <p className="text-lg text-gray-500 mt-1">@{user?.username}</p>
                  {user?.bio && (
                    <p className="text-gray-600 mt-2 max-w-md">{user.bio}</p>
                  )}
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex items-center space-x-3">
                {!isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="bg-black text-white px-6 py-2 rounded-xl hover:bg-gray-800 transition-colors duration-200 font-medium"
                    >
                      Modifier le profil
                    </button>
                    <button
                      onClick={handleLogout}
                      className="bg-gray-100 text-gray-700 px-6 py-2 rounded-xl hover:bg-gray-200 transition-colors duration-200 font-medium"
                    >
                      Se déconnecter
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleSaveProfile}
                      disabled={loading}
                      className="bg-green-600 text-white px-6 py-2 rounded-xl hover:bg-green-700 transition-colors duration-200 font-medium disabled:opacity-50"
                    >
                      {loading ? 'Sauvegarde...' : 'Sauvegarder'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="bg-gray-100 text-gray-700 px-6 py-2 rounded-xl hover:bg-gray-200 transition-colors duration-200 font-medium"
                    >
                      Annuler
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Messages d'état */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
                {success}
              </div>
            )}
          </div>

          {/* Informations détaillées */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Informations personnelles */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Informations personnelles</h2>
              
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                      <input
                        type="text"
                        name="prenom"
                        value={editForm.prenom}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Prénom"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                      <input
                        type="text"
                        name="nom"
                        value={editForm.nom}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Nom"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom d'utilisateur</label>
                    <input
                      type="text"
                      name="username"
                      value={editForm.username}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Nom d'utilisateur"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                    <textarea
                      name="bio"
                      value={editForm.bio}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Parlez-nous de vous..."
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Prénom</label>
                      <p className="text-gray-900">{user?.prenom || 'Non renseigné'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Nom</label>
                      <p className="text-gray-900">{user?.nom || 'Non renseigné'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Nom d'utilisateur</label>
                    <p className="text-gray-900">@{user?.username}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Bio</label>
                    <p className="text-gray-900">{user?.bio || 'Aucune bio ajoutée'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Informations de contact */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Contact</h2>
              
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      name="mail"
                      value={editForm.mail}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Email"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                    <input
                      type="tel"
                      name="telephone"
                      value={editForm.telephone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Numéro de téléphone"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                    <p className="text-gray-900">{user?.mail}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Téléphone</label>
                    <p className="text-gray-900">{user?.telephone || 'Non renseigné'}</p>
                  </div>
                  
                  {user?.certified && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Statut</label>
                      <div className="flex items-center">
                        <span className="text-blue-600 font-medium text-sm bg-blue-50 px-3 py-1 rounded-full">
                          ✓ Compte certifié
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* Statistiques */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Statistiques</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-2xl font-bold text-gray-900">0</div>
                <div className="text-sm text-gray-500">Publications</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-2xl font-bold text-gray-900">0</div>
                <div className="text-sm text-gray-500">Amis</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-2xl font-bold text-gray-900">0</div>
                <div className="text-sm text-gray-500">Messages</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Profile