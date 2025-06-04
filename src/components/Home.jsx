import { Link } from 'react-router-dom'

const Home = () => {
  return (
    <div className="h-screen bg-gradient-to-br from-purple-200 via-purple-100 to-pink-100 flex overflow-hidden">
      
      {/* Partie gauche - Contenu principal */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-y-auto bg-white">
        <div className="w-full max-w-lg space-y-8 my-4">
          
          {/* Logo Cercle */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-8">
              <div className="w-12 h-12 border-3 border-gray-800 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-gray-800 rounded-full"></div>
              </div>
              <span className="text-3xl font-bold text-gray-800 tracking-tight">CERCLE</span>
            </div>
          </div>

          {/* Hero Section */}
          <div className="text-center space-y-6">
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Votre cercle,
              <br />
              <span className="bg-gradient-to-r from-purple-300 to-black bg-clip-text text-transparent">Votre monde</span>
            </h1>
            
            <p className="text-lg text-gray-600 leading-relaxed max-w-md mx-auto">
              Vous n’avez pas besoin de parler fort. Juste d’être entendu par les bonnes oreilles.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-4">
            <Link 
              to="/register" 
              className="w-full bg-black text-white py-4 px-6 rounded-lg font-semibold hover:bg-gray-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 block text-center"
            >
              Rejoindre Cercle
            </Link>
            
            <Link 
              to="/login" 
              className="w-full border-2 border-gray-300 text-gray-700 py-4 px-6 rounded-lg font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 block text-center"
            >
              J'ai déjà un compte
            </Link>
          </div>

          {/* Social Proof */}
          <div className="text-center pt-6">
            <p className="text-xs text-gray-500">
              Déjà <span className="font-semibold text-gray-700">10,000+</span> personnes dans leur cercle
            </p>
          </div>

        </div>
      </div>

      {/* Partie droite - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img 
          src="https://images.unsplash.com/photo-1736536205405-ba8d16887abb?q=80&w=1992&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Personnes connectées et souriantes"
          className="w-full h-full object-cover"
        />
        
        {/* Overlay avec statistiques */}
        <div className="absolute inset-0 bg-black/10 flex items-end justify-start p-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-800">2,847 cercles actifs</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-800">156 nouveaux aujourd'hui</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation flottante */}
      <nav className="absolute top-6 right-6 flex items-center space-x-4">
        <Link 
          to="/about" 
          className="text-gray-600 hover:text-gray-800 font-medium text-sm bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full transition-all duration-200"
        >
          À propos
        </Link>
        <Link 
          to="/feed" 
          className="text-gray-600 hover:text-gray-800 font-medium text-sm bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full transition-all duration-200"
        >
          Découvrir
        </Link>
      </nav>

      {/* Indicateur de scroll (mobile) */}
      <div className="lg:hidden absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="w-1 h-8 bg-gray-300 rounded-full overflow-hidden">
          <div className="w-full h-4 bg-purple-500 rounded-full animate-bounce"></div>
        </div>
      </div>

    </div>
  )
}

export default Home