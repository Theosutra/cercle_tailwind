import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'

const Home = () => {
  const { user, isAuthenticated, logout } = useAuth()
  const location = useLocation()
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Afficher un message de bienvenue s'il y en a un
    if (location.state?.message) {
      setMessage(location.state.message)
      // Nettoyer le message après 5 secondes
      const timer = setTimeout(() => setMessage(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [location.state])

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Erreur de déconnexion:', error)
    }
  }

  return (
    <div className="h-screen lg:bg-gradient-to-br lg:from-purple-200 lg:via-purple-100 lg:to-pink-100 flex flex-col lg:flex-row overflow-hidden">
      
      {/* Message de bienvenue */}
      {message && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-lg z-50 text-sm sm:text-base max-w-xs sm:max-w-none">
          {message}
        </div>
      )}

      {/* Navigation flottante - Repositionnée pour mobile */}
      <nav className="absolute top-4 sm:top-6 right-4 sm:right-6 flex items-center space-x-2 sm:space-x-4 z-40">
        <Link 
          to="/about" 
          className="text-gray-600 hover:text-gray-800 font-medium text-xs sm:text-sm bg-white/80 backdrop-blur-sm px-2 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all duration-200"
        >
          À propos
        </Link>
        {isAuthenticated && (
          <Link 
            to="/feed" 
            className="text-gray-600 hover:text-gray-800 font-medium text-xs sm:text-sm bg-white/80 backdrop-blur-sm px-2 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all duration-200"
          >
            Découvrir
          </Link>
        )}
      </nav>

      {/* Partie principale - Contenu */}
      <div className="w-full xl:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg space-y-6 sm:space-y-8 my-4 pt-12 sm:pt-4">
          
          {/* Logo Cercle */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-6 sm:mb-8">
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 border-2 sm:border-3 border-gray-800 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 lg:w-3 lg:h-3 bg-gray-800 rounded-full"></div>
              </div>
              <span className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight">CERCLE</span>
            </div>
          </div>

          {/* Hero Section */}
          <div className="text-center space-y-4 sm:space-y-6">
            {isAuthenticated ? (
              <>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                  Bienvenue,
                  <br />
                  <span className="bg-gradient-to-r from-purple-300 to-black bg-clip-text text-transparent">
                    {user?.username || user?.prenom || 'Ami'}
                  </span>
                </h1>
                
                <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-xs sm:max-w-md mx-auto px-2 sm:px-0">
                  Votre cercle vous attend. Découvrez ce que vos amis partagent.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Votre cercle,
                  <br />
                  <span className="bg-gradient-to-r from-purple-300 to-black bg-clip-text text-transparent">Votre monde</span>
                </h1>
                
                <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-xs sm:max-w-md mx-auto px-2 sm:px-0">
                  Vous n'avez pas besoin de parler fort. Juste d'être entendu par les bonnes oreilles.
                </p>
              </>
            )}
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3 sm:space-y-4 px-2 sm:px-0">
            {isAuthenticated ? (
              <>
                <Link 
                  to="/feed" 
                  className="w-full bg-black text-white py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-semibold hover:bg-gray-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 block text-center text-sm sm:text-base"
                >
                  Découvrir le Feed
                </Link>
                
                <button 
                  onClick={handleLogout}
                  className="w-full border-2 border-gray-300 text-gray-700 py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 text-sm sm:text-base"
                >
                  Se déconnecter
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/register" 
                  className="w-full bg-black text-white py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-semibold hover:bg-gray-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 block text-center text-sm sm:text-base"
                >
                  Rejoindre Cercle
                </Link>
                
                <Link 
                  to="/login" 
                  className="w-full border-2 border-gray-300 text-gray-700 py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 block text-center text-sm sm:text-base"
                >
                  J'ai déjà un compte
                </Link>
              </>
            )}
          </div>

          {/* Social Proof */}
          {!isAuthenticated && (
            <div className="text-center pt-4 sm:pt-6">
              <p className="text-xs text-gray-500">
                Déjà <span className="font-semibold text-gray-700">10,000+</span> personnes dans leur cercle
              </p>
            </div>
          )}

          {/* User Info */}
          {isAuthenticated && user && (
            <div className="text-center pt-4 sm:pt-6 border-t border-gray-200">
              <p className="text-xs sm:text-sm text-gray-600 break-all sm:break-normal">
                Connecté en tant que <span className="font-semibold text-gray-800">{user.mail}</span>
              </p>
              {user.certified && (
                <p className="text-xs text-blue-600 mt-1">✓ Compte certifié</p>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Partie droite - Image (visible uniquement sur écrans larges xl+) */}
      <div className="hidden xl:flex xl:w-1/2 relative">
        <img 
          src="https://images.unsplash.com/photo-1736536205405-ba8d16887abb?q=80&w=1992&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Personnes connectées et souriantes"
          className="w-full h-full object-cover"
        />
        
        {/* Overlay avec statistiques */}
        <div className="absolute inset-0 bg-black/10 flex items-end justify-start p-6 xl:p-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 xl:p-6 space-y-2 xl:space-y-3">
            <div className="flex items-center space-x-2 xl:space-x-3">
              <div className="w-2.5 h-2.5 xl:w-3 xl:h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs xl:text-sm font-medium text-gray-800">2,847 cercles actifs</span>
            </div>
            <div className="flex items-center space-x-2 xl:space-x-3">
              <div className="w-2.5 h-2.5 xl:w-3 xl:h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-xs xl:text-sm font-medium text-gray-800">156 nouveaux aujourd'hui</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

export default Home