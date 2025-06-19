import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext' // Importer useAuth
// Supprimer l'import direct d'AuthService
// import AuthService from '../services/authService'

const Register = () => {
  const navigate = useNavigate()
  const { register } = useAuth() // Utiliser le register du contexte
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    telephone: ''
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Nettoyer l'erreur du champ modifié
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    // Validation côté client
    if (!formData.username.trim()) {
      newErrors.username = 'Le nom d\'utilisateur est requis'
    } else if (formData.username.length < 3) {
      newErrors.username = 'Le nom d\'utilisateur doit contenir au moins 3 caractères'
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres et _'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide'
    }

    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères'
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas'
    }

    if (formData.telephone && !/^[\+]?[\d\s\-\(\)]+$/.test(formData.telephone)) {
      newErrors.telephone = 'Format de téléphone invalide'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError('')

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // Préparer les données pour l'API
      const apiData = {
        username: formData.username.trim(),
        mail: formData.email.trim(),
        password: formData.password,
        nom: formData.lastName.trim() || undefined,
        prenom: formData.firstName.trim() || undefined,
        telephone: formData.telephone.trim() || undefined
      }

      // Utiliser le register du contexte au lieu d'AuthService directement
      const response = await register(apiData)
      
      console.log('Inscription réussie:', response)
      
      // ✅ SEULE MODIFICATION: Redirection vers l'onboarding au lieu du feed
      navigate('/onboarding', { 
        replace: true,
        state: { 
          message: `Bienvenue ${response.user.prenom} ! Configurons votre profil.` 
        }
      })
      
    } catch (error) {
      console.error('Erreur d\'inscription:', error)
      setApiError(error.message || 'Une erreur est survenue lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen xl:h-screen xl:bg-gradient-to-br xl:from-purple-200 xl:via-purple-100 xl:to-pink-100 flex flex-col xl:flex-row overflow-hidden">
      
      {/* Partie gauche - Image (visible uniquement sur écrans larges xl+) */}
      <div className="hidden xl:flex xl:w-1/2 relative">
        <img 
          src="https://images.unsplash.com/photo-1735252723552-138dc3fb6f14?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Équipe de travail collaborative"
          className="w-full h-full object-cover"
        />
        
        {/* Logo Cercle en overlay */}
        <div className="absolute bottom-6 xl:bottom-8 left-6 xl:left-8 flex items-center space-x-2 xl:space-x-3">
          <div className="w-8 h-8 xl:w-10 xl:h-10 border-2 border-white rounded-full flex items-center justify-center backdrop-blur-sm bg-black/10">
            <div className="w-2 h-2 xl:w-2.5 xl:h-2.5 bg-white rounded-full"></div>
          </div>
          <span className="text-lg xl:text-xl font-bold text-white drop-shadow-lg">CERCLE</span>
        </div>
      </div>

      {/* Partie droite - Formulaire */}
      <div className="w-full xl:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8 xl:overflow-y-auto bg-white">
        <div className="w-full max-w-xs sm:max-w-sm md:max-w-md space-y-3 sm:space-y-5 py-8 xl:py-4">
          
          {/* Logo Cercle (visible sur mobile/tablette) */}
          <div className="text-center xl:hidden">
            <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
              <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-gray-800 rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-800 rounded-full"></div>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-gray-800">CERCLE</span>
            </div>
          </div>

          {/* Logo Cercle (visible sur desktop xl+) */}
          <div className="text-center hidden xl:block">
            <div className="flex items-center justify-center space-x-3 mb-2">
              <div className="w-8 h-8 border-2 border-gray-800 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
              </div>
              <span className="text-2xl font-bold text-gray-800">CERCLE</span>
            </div>
          </div>

          {/* Titre d'inscription */}
          <div className="text-center space-y-1 sm:space-y-2">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">S'inscrire</h1>
            <p className="text-sm text-gray-600">Rejoignez votre cercle dès maintenant</p>
          </div>

          {/* Affichage des erreurs API */}
          {apiError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-sm">
              {apiError}
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-5">
            
            {/* Prénom et Nom */}
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Prénom
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="Prénom"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={`w-full px-2 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-500 text-sm sm:text-base ${
                    errors.firstName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                )}
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Nom
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Nom"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={`w-full px-2 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-500 text-sm sm:text-base ${
                    errors.lastName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Nom d'utilisateur */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Nom d'utilisateur *
              </label>
              <input
                id="username"
                name="username"
                type="text"
                placeholder="nom_utilisateur"
                value={formData.username}
                onChange={handleInputChange}
                className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-500 text-sm sm:text-base ${
                  errors.username ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                required
              />
              {errors.username && (
                <p className="text-red-500 text-xs mt-1">{errors.username}</p>
              )}
            </div>

            {/* Champ Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Email *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="exemple@email.com"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-500 text-sm sm:text-base ${
                  errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                required
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Téléphone */}
            <div>
              <label htmlFor="telephone" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Téléphone
              </label>
              <input
                id="telephone"
                name="telephone"
                type="tel"
                placeholder="+33 1 23 45 67 89"
                value={formData.telephone}
                onChange={handleInputChange}
                className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-500 text-sm sm:text-base ${
                  errors.telephone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors.telephone && (
                <p className="text-red-500 text-xs mt-1">{errors.telephone}</p>
              )}
            </div>

            {/* Champ Mot de passe */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Mot de passe *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Créer un mot de passe"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-500 text-sm sm:text-base ${
                  errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                required
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            {/* Confirmation mot de passe */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Confirmer le mot de passe *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirmer le mot de passe"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-500 text-sm sm:text-base ${
                  errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                required
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Bouton d'inscription */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-2.5 sm:py-3 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm sm:text-base">Inscription en cours...</span>
                </>
              ) : (
                'S\'inscrire'
              )}
            </button>

            {/* Lien "J'ai déjà un compte" */}
            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-gray-600 hover:text-purple-600 transition-colors duration-200 underline"
              >
                J'ai déjà un compte ? Se connecter
              </Link>
            </div>

          </form>

          {/* Lien retour à l'accueil */}
          <div className="text-center pt-2 sm:pt-4">
            <Link
              to="/"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
            >
              ← Retour à l'accueil
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Register