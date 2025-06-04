import { Link } from 'react-router-dom'

const Navbar = () => {
  return (
    <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/20 shadow-sm">
      <div className="max-w-7xl mx-auto flex justify-between items-center py-4 px-6 lg:px-10">
        
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border-2 border-gray-800 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
          </div>
          <span className="text-xl font-bold text-gray-800 tracking-tight">Cercle</span>
        </div>

        {/* Navigation centrale - cachée sur mobile */}
        <nav className="hidden md:flex gap-8 lg:gap-10 items-center">
          <Link 
            to="/" 
            className="text-gray-700 hover:text-blue-600 font-medium text-sm lg:text-base transition-all duration-300 py-2 relative group"
          >
            Home
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-cyan-400 transition-all duration-300 group-hover:w-full"></span>
          </Link>
          <Link 
            to="/feed" 
            className="text-gray-700 hover:text-blue-600 font-medium text-sm lg:text-base transition-all duration-300 py-2 relative group"
          >
            Feed
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-cyan-400 transition-all duration-300 group-hover:w-full"></span>
          </Link>
          <Link 
            to="/about" 
            className="text-gray-700 hover:text-blue-600 font-medium text-sm lg:text-base transition-all duration-300 py-2 relative group"
          >
            About Us
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-cyan-400 transition-all duration-300 group-hover:w-full"></span>
          </Link>
        </nav>

        {/* Boutons d'authentification - cachés sur très petit écran */}
        <div className="hidden sm:flex gap-3 lg:gap-4 items-center">
          <Link 
            to="/login" 
            className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 font-medium py-2 px-4 lg:py-2.5 lg:px-5 transition-all duration-300 rounded-lg text-sm lg:text-base"
          >
            Login
          </Link>
          <Link 
            to="/register" 
            className="bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2.5 px-5 lg:py-3 lg:px-6 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-sm lg:text-base"
          >
            Sign up
          </Link>
        </div>

        {/* Menu burger pour mobile */}
        <button className="md:hidden flex flex-col gap-1 p-2">
          <span className="w-5 h-0.5 bg-gray-800 transition-all"></span>
          <span className="w-5 h-0.5 bg-gray-800 transition-all"></span>
          <span className="w-5 h-0.5 bg-gray-800 transition-all"></span>
        </button>
      </div>
    </header>
  )
}

export default Navbar