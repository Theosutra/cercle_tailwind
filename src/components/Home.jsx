import { Link } from 'react-router-dom'

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-200 via-purple-100 to-pink-100">
      
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center py-3 px-6">
          
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 border-2 border-gray-800 rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-gray-800 rounded-full"></div>
            </div>
            <span className="text-lg font-bold text-gray-800">Cercle</span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className="text-gray-600 hover:text-gray-800 font-medium text-sm">
              Home
            </Link>
            <Link to="/feed" className="text-gray-600 hover:text-gray-800 font-medium text-sm">
              Feed
            </Link>
            <Link to="/about" className="text-gray-600 hover:text-gray-800 font-medium text-sm">
              About Us
            </Link>
          </nav>

          {/* Boutons */}
          <div className="flex space-x-3">
            <Link to="/login" className="text-gray-600 hover:text-gray-800 px-4 py-1.5 font-medium text-sm">
              Login
            </Link>
            <Link to="/register" className="bg-gray-800 text-white px-5 py-1.5 rounded-full hover:bg-gray-700 font-medium text-sm">
              Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Colonne gauche - Texte */}
            <div className="space-y-6 lg:pr-8">
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Cercle
              </h1>
              
              <h2 className="text-lg font-medium text-gray-800 leading-relaxed">
                Le réseau social qui tourne<br />
                autour de vous.
              </h2>
              
              <p className="text-gray-600 text-sm leading-relaxed max-w-md">
                Pas de followers inutiles. Pas de course à la viralité.<br />
                Juste les bonnes personnes. Au bon endroit.
              </p>
              
              <button className="bg-gray-900 text-white px-6 py-2.5 rounded-full font-medium text-sm hover:bg-gray-800 transition-colors mt-8">
                Start Now
              </button>
            </div>

            {/* Colonne droite - Images en grille */}
            <div className="grid grid-cols-2 gap-3 h-80">
              
              {/* Image 1 - Orange en haut à gauche */}
              <div className="bg-orange-500 rounded-2xl overflow-hidden relative">
                {/* Placeholder pour votre image */}
                <img 
                  src="/path/to/your/orange-image.jpg" 
                  alt="Orange card" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                {/* Fallback si pas d'image */}
                <div className="absolute inset-0 bg-orange-500 flex items-center justify-center" style={{display: 'none'}}>
                  <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                    <div className="w-6 h-6 bg-blue-600 rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Image 2 - Grise en haut à droite */}
              <div className="bg-gray-300 rounded-2xl overflow-hidden relative">
                {/* Placeholder pour votre image */}
                <img 
                  src="/path/to/your/gray-image.jpg" 
                  alt="Gray card" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                {/* Fallback si pas d'image */}
                <div className="absolute inset-0 bg-gray-300" style={{display: 'none'}}></div>
              </div>

              {/* Image 3 - Bleue/teal en bas (2 colonnes) */}
              <div className="col-span-2 bg-teal-400 rounded-2xl overflow-hidden relative">
                {/* Placeholder pour votre image */}
                <img 
                  src="/path/to/your/teal-image.jpg" 
                  alt="Teal card" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                {/* Fallback si pas d'image */}
                <div className="absolute inset-0 bg-teal-400" style={{display: 'none'}}></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Home