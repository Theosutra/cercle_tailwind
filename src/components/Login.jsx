import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext' // Importer useAuth
// Supprimer l'import direct d'AuthService
// import AuthService from '../services/authService'

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth() // Utiliser le login du contexte
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Nettoyer l'erreur quand l'utilisateur tape
    if (error) {
      setError('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Préparer les données pour l'API
      const credentials = {
        mail: formData.email.trim(),
        password: formData.password
      }

      // Utiliser le login du contexte au lieu d'AuthService directement
      const response = await login(credentials)
      
      console.log('Connexion réussie:', response)
      console.log('Redirect info:', response.redirect) // Debug pour voir les infos de redirection
      
      // ✅ AJOUT: Vérifier la redirection AVANT de naviguer
      if (response.redirect && response.redirect.should_redirect) {
        console.log(`🔄 Redirecting ${response.user.role} to admin dashboard`)
        navigate(response.redirect.redirect_to)
      } else {
        // Redirection normale vers le feed pour les utilisateurs
        navigate('/feed', { 
          replace: true
        })
      }
      
    } catch (error) {
      console.error('Erreur de connexion:', error)
      
      // ✅ AJOUT: Gestion spéciale pour les comptes bannis
      if (error.response?.data?.ban_info) {
        const banInfo = error.response.data.ban_info
        const endDate = new Date(banInfo.end_date).toLocaleDateString('fr-FR')
        setError(`Compte banni jusqu'au ${endDate}. Raison: ${banInfo.reason}`)
      } else {
        setError(error.response?.data?.message || error.message || 'Une erreur est survenue lors de la connexion')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen xl:bg-gradient-to-br xl:from-purple-200 xl:via-purple-100 xl:to-pink-100 flex flex-col xl:flex-row overflow-hidden">
      
      {/* Partie gauche - Image (visible uniquement sur écrans larges xl+) */}
      <div className="hidden xl:flex xl:w-1/2 relative">
        <img 
          src="https://images.unsplash.com/photo-1736943993999-3889ed6a8b18?q=80&w=1848&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Personne nageant dans l'eau avec des bulles"
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
      <div className="w-full xl:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8 xl:overflow-y-auto bg-white min-h-screen xl:min-h-0">
        <div className="w-full max-w-xs sm:max-w-sm md:max-w-md space-y-4 sm:space-y-6">
          
          {/* Logo Cercle (visible sur mobile/tablette) */}
          <div className="text-center xl:hidden">
            <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-6 sm:mb-8">
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

          {/* Titre de connexion */}
          <div className="text-center space-y-1 sm:space-y-2">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Se connecter</h1>
            <p className="text-sm text-gray-600">Retrouvez votre cercle</p>
          </div>

          {/* Affichage des erreurs */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            
            {/* Champ Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="exemple@email.com"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-500 text-sm sm:text-base"
                required
                disabled={loading}
              />
            </div>

            {/* Champ Mot de passe */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Votre mot de passe"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-500 text-sm sm:text-base"
                required
                disabled={loading}
              />
            </div>

            {/* Bouton de connexion */}
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
                  <span className="text-sm sm:text-base">Connexion en cours...</span>
                </>
              ) : (
                'Se connecter'
              )}
            </button>

            {/* Lien "Je n'ai pas de compte" */}
            <div className="text-center">
              <Link
                to="/register"
                className="text-sm text-gray-600 hover:text-purple-600 transition-colors duration-200 underline"
              >
                Je n'ai pas de compte ? S'inscrire
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

export default Login