import { useState } from 'react'
import { Link } from 'react-router-dom'

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      alert('Les mots de passe ne correspondent pas')
      return
    }
    // Logique d'inscription ici
    console.log('Données d\'inscription:', formData)
  }

  return (
    <div className="h-screen bg-gradient-to-br from-purple-200 via-purple-100 to-pink-100 flex overflow-hidden">
      
      {/* Partie gauche - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img 
          src="https://images.unsplash.com/photo-1735252723552-138dc3fb6f14?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Équipe de travail collaborative"
          className="w-full h-full object-cover"
        />
        
        {/* Logo Cercle en overlay */}
        <div className="absolute bottom-8 left-8 flex items-center space-x-3">
          <div className="w-10 h-10 border-2 border-white rounded-full flex items-center justify-center backdrop-blur-sm bg-black/10">
            <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
          </div>
          <span className="text-xl font-bold text-white drop-shadow-lg">CERCLE</span>
        </div>
      </div>

      {/* Partie droite - Formulaire */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="w-full max-w-md space-y-5 my-4">
          
          {/* Logo Cercle */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-2">
              <div className="w-8 h-8 border-2 border-gray-800 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
              </div>
              <span className="text-2xl font-bold text-gray-800">CERCLE</span>
            </div>
          </div>

          {/* Titre d'inscription */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">S'inscrire</h1>
            <p className="text-sm text-gray-600">Rejoignez votre cercle dès maintenant</p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Prénom et Nom */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="Prénom"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nom
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Nom"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-500"
                  required
                />
              </div>
            </div>

            {/* Champ Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="exemple@email.com"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-500"
                required
              />
            </div>

            {/* Champ Mot de passe */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Créer un mot de passe"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-500"
                required
              />
            </div>

            {/* Confirmation mot de passe */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmer le mot de passe
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirmer le mot de passe"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-500"
                required
              />
            </div>

            {/* Bouton d'inscription */}
            <button
              type="submit"
              className="w-full bg-black text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              S'inscrire
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
          <div className="text-center pt-4">
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