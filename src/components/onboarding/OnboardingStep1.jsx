// src/components/onboarding/OnboardingStep1.jsx - Version UX/UI optimisée
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

const OnboardingStep1 = ({ onNext, user, loading, setLoading, stepData }) => {
  const [profileImage, setProfileImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(user?.photo_profil || stepData?.imagePreview || null)
  const [bio, setBio] = useState(user?.bio || stepData?.bio || '')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef(null)
  const { updateUser } = useAuth()

  // Charger les données sauvegardées
  useEffect(() => {
    if (stepData) {
      setBio(stepData.bio || '')
      setImagePreview(stepData.imagePreview || null)
    }
  }, [stepData])

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('L\'image ne doit pas dépasser 5MB')
        return
      }
      
      // Vérifier le type
      if (!file.type.startsWith('image/')) {
        setError('Veuillez sélectionner une image valide')
        return
      }
      
      setError('')
      setProfileImage(file)
      
      // Créer un aperçu
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setProfileImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleContinue = async () => {
    try {
      setLoading(true)
      setError('')
      setSuccess('')
      
      const token = localStorage.getItem('accessToken')
      if (!token) {
        setError('Session expirée, veuillez vous reconnecter')
        return
      }

      // Préparer les données
      const formData = new FormData()
      
      // Ajouter l'image si elle existe
      if (profileImage) {
        formData.append('photo_profil', profileImage)
      }
      
      // Ajouter la bio
      if (bio.trim()) {
        formData.append('bio', bio.trim())
      }
      
      // Envoyer seulement s'il y a des données à mettre à jour
      if (profileImage || bio.trim()) {
        const response = await fetch('/api/v1/users/me', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
            // Ne pas définir Content-Type pour FormData
          },
          body: formData
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Erreur lors de la mise à jour')
        }

        const updatedUser = await response.json()
        updateUser(updatedUser)
        setSuccess('Profil mis à jour avec succès !')
      }
      
      // Sauvegarder les données et passer à l'étape suivante
      const stepData = {
        bio: bio.trim(),
        imagePreview: imagePreview,
        hasImage: !!profileImage
      }
      
      setTimeout(() => {
        onNext(stepData)
      }, success ? 1000 : 0)
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      setError(error.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const getUserInitials = () => {
    return `${user.prenom?.charAt(0) || ''}${user.nom?.charAt(0) || ''}`.toUpperCase()
  }

  return (
    <div className="p-6 sm:p-8">
      {/* En-tête */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Personnalisez votre profil
        </h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Ajoutez une photo de profil et une bio pour que vos amis vous reconnaissent facilement
        </p>
      </div>

      {/* Messages */}
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

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {/* Section Photo de profil */}
        <div className="text-center">
          <label className="block text-sm font-medium text-gray-700 mb-4">Photo de profil</label>
          
          <div className="relative inline-block">
            {/* Cercle de photo */}
            <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-white shadow-lg overflow-hidden mx-auto">
              {imagePreview ? (
                <img 
                  src={imagePreview} 
                  alt="Aperçu" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
                  <span className="text-2xl font-bold text-purple-600">
                    {getUserInitials()}
                  </span>
                </div>
              )}
            </div>
            
            {/* Bouton d'édition */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-2 right-2 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors shadow-lg"
              type="button"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {/* Bouton pour retirer l'image */}
            {imagePreview && (
              <button
                onClick={handleRemoveImage}
                className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-lg"
                type="button"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <div className="mt-4 flex justify-center space-x-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              type="button"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {imagePreview ? 'Changer' : 'Ajouter'}
            </button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>

        {/* Section Bio */}
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
            Bio (optionnel)
          </label>
          <div className="relative">
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Parlez-nous de vous... Vos passions, votre travail, ce qui vous rend unique !"
              maxLength={150}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-colors"
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-400">
              {bio.length}/150
            </div>
          </div>
          
          {/* Suggestions de bio */}
          {!bio.trim() && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                "🎨 Créatif passionné",
                "💻 Développeur curieux", 
                "📚 Étudiant motivé",
                "🌍 Explorateur de la vie"
              ].map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setBio(suggestion)}
                  className="text-left p-2 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  type="button"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Aperçu du profil */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Aperçu de votre profil</h3>
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
              {imagePreview ? (
                <img 
                  src={imagePreview} 
                  alt="Aperçu profil"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-purple-600">
                    {getUserInitials()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h4 className="font-semibold text-gray-900">{user.username}</h4>
                {user.certified && (
                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <p className="text-sm text-gray-600">{user.prenom} {user.nom}</p>
              {bio.trim() && (
                <p className="text-sm text-gray-700 mt-2">{bio}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OnboardingStep1