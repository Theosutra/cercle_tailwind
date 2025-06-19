// src/components/onboarding/OnboardingStep3.jsx - Version corrigée
import { useState, useRef } from 'react'

const OnboardingStep3 = ({ onNext, user, loading, setLoading, stepData }) => {
  const [postContent, setPostContent] = useState(stepData?.postContent || '')
  const [selectedImages, setSelectedImages] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const fileInputRef = useRef(null)

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files)
    
    if (files.length === 0) return

    // Limiter à 4 images maximum
    if (selectedImages.length + files.length > 4) {
      setError('Maximum 4 images autorisées par post')
      return
    }

    // Vérifier la taille de chaque fichier (max 5MB)
    const invalidFiles = files.filter(file => file.size > 5 * 1024 * 1024)
    if (invalidFiles.length > 0) {
      setError('Certaines images dépassent 5MB')
      return
    }

    // Vérifier le type de fichier
    const invalidTypes = files.filter(file => !file.type.startsWith('image/'))
    if (invalidTypes.length > 0) {
      setError('Seules les images sont autorisées')
      return
    }

    setError('')
    
    // Ajouter les nouveaux fichiers
    const newImages = [...selectedImages, ...files]
    setSelectedImages(newImages)
    
    // Créer les aperçus
    const newPreviews = [...imagePreviews]
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        newPreviews.push({
          file,
          url: e.target.result
        })
        setImagePreviews([...newPreviews])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleRemoveImage = (index) => {
    const newImages = selectedImages.filter((_, i) => i !== index)
    const newPreviews = imagePreviews.filter((_, i) => i !== index)
    setSelectedImages(newImages)
    setImagePreviews(newPreviews)
  }

  const handleCreatePost = async () => {
    if (!postContent.trim() && selectedImages.length === 0) {
      setError('Veuillez ajouter du contenu ou une image')
      return
    }

    try {
      setIsPosting(true)
      setError('')
      
      const token = localStorage.getItem('accessToken')
      if (!token) {
        setError('Session expirée')
        return
      }

      const formData = new FormData()
      formData.append('content', postContent.trim())
      
      // Ajouter les images
      selectedImages.forEach((image) => {
        formData.append('images', image)
      })

      const response = await fetch('/api/v1/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Ne pas définir Content-Type pour FormData
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la création du post')
      }

      setSuccess('Post créé avec succès ! 🎉')
      
      // Attendre un peu pour montrer le succès puis finir l'onboarding
      setTimeout(() => {
        const stepData = {
          postContent: postContent.trim(),
          imageCount: selectedImages.length,
          hasCreatedPost: true
        }
        onNext(stepData)
      }, 1500)
      
    } catch (error) {
      console.error('Erreur lors de la création du post:', error)
      setError(error.message || 'Une erreur est survenue')
    } finally {
      setIsPosting(false)
    }
  }

  const handleSkipPost = () => {
    const stepData = {
      postContent: '',
      imageCount: 0,
      hasCreatedPost: false
    }
    onNext(stepData)
  }

  const getUserInitials = () => {
    return `${user.prenom?.charAt(0) || ''}${user.nom?.charAt(0) || ''}`.toUpperCase()
  }

  const suggestedPosts = [
    "Salut tout le monde ! 👋 Ravi de rejoindre Cercle !",
    "Premier post sur Cercle ! Hâte de découvrir cette communauté 🚀",
    "Hello ! Je suis nouveau ici, quelqu'un pour me faire visiter ? 😊",
    "Enfin sur Cercle ! Qui partage mes centres d'intérêt ? 🎯"
  ]

  return (
    <div className="p-6 sm:p-8">
      {/* En-tête */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Créez votre premier post
        </h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Partagez quelque chose avec votre nouveau réseau pour commencer les conversations
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
            <p className="text-green-700 text-sm font-medium">{success}</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Zone de création du post */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Header du post */}
          <div className="flex items-center space-x-3 p-4 border-b border-gray-100">
            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
              {user.photo_profil ? (
                <img 
                  src={user.photo_profil} 
                  alt={user.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                  <span className="text-gray-600 font-medium text-xs">
                    {getUserInitials()}
                  </span>
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <p className="text-sm font-semibold text-gray-900">{user.username}</p>
                {user.certified && (
                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <p className="text-xs text-gray-500">Public • À l'instant</p>
            </div>
          </div>

          {/* Zone de texte */}
          <div className="p-4">
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Que voulez-vous partager ?"
              maxLength={500}
              rows={4}
              className="w-full resize-none border-none outline-none text-gray-900 placeholder-gray-500 bg-transparent"
            />
            
            {/* Compteur de caractères */}
            <div className="flex justify-between items-center mt-2">
              <div className="text-xs text-gray-400">
                {postContent.length}/500 caractères
              </div>
              <div className={`w-8 h-8 rounded-full border-2 ${
                postContent.length >= 450 ? 'border-red-300' : 
                postContent.length >= 350 ? 'border-yellow-300' : 'border-gray-200'
              } flex items-center justify-center`}>
                <div className={`w-2 h-2 rounded-full ${
                  postContent.length >= 450 ? 'bg-red-400' : 
                  postContent.length >= 350 ? 'bg-yellow-400' : 'bg-gray-300'
                }`}></div>
              </div>
            </div>
          </div>

          {/* Images sélectionnées */}
          {imagePreviews.length > 0 && (
            <div className="px-4 pb-4">
              <div className="grid grid-cols-2 gap-2">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img 
                      src={preview.url} 
                      alt={`Aperçu ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => handleRemoveImage(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-lg"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions du post */}
          <div className="border-t border-gray-100 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Ajouter à votre post</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={selectedImages.length >= 4}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Ajouter des images"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
            
            {selectedImages.length >= 4 && (
              <p className="text-xs text-gray-500 mt-1">
                Maximum 4 images par post
              </p>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>

        {/* Suggestions de contenu */}
        {!postContent.trim() && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-blue-800 text-sm font-medium mb-3">💡 Idées de premier post :</h3>
            <div className="grid gap-2">
              {suggestedPosts.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setPostContent(suggestion)}
                  className="text-left p-3 text-sm text-blue-700 bg-white rounded-lg hover:bg-blue-50 transition-colors border border-blue-100"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message d'encouragement */}
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 text-sm text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Votre premier post vous aidera à engager votre communauté</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OnboardingStep3