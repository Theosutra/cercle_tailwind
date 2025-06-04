// src/components/Dashboard.jsx
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const Dashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/', { replace: true })
    } catch (error) {
      console.error('Erreur de déconnexion:', error)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center space-y-8">
        
        {/* Message de bienvenue */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">
            Bonjour {user?.prenom || user?.username} {user?.nom}
          </h1>
          
          {/* Informations utilisateur */}
          <div className="text-gray-600 space-y-2">
            <p>Email: {user?.mail}</p>
            <p>Nom d'utilisateur: {user?.username}</p>
            {user?.certified && (
              <p className="text-blue-600 font-medium">✓ Compte certifié</p>
            )}
          </div>
        </div>

        {/* Bouton de déconnexion */}
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
        >
          Se déconnecter
        </button>

      </div>
    </div>
  )
}

export default Dashboard