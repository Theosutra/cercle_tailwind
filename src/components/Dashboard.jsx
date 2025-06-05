// src/components/Dashboard.jsx
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import LeftSidebar from './LeftSidebar'

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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar gauche */}
      <LeftSidebar />
      
      {/* Contenu principal avec marge pour la sidebar */}
      <div className="ml-72 flex-1 flex items-center justify-center">
        <div className="text-center space-y-8 bg-white rounded-2xl p-12 shadow-sm max-w-lg w-full mx-6">
          
          {/* Message de bienvenue */}
          <div className="space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-2xl">
                {user?.prenom?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900">
              Bienvenue {user?.prenom || user?.username} !
            </h1>
            
            {/* Informations utilisateur */}
            <div className="text-gray-600 space-y-2 bg-gray-50 rounded-xl p-4">
              <p className="text-sm">
                <span className="font-medium text-gray-800">Email:</span> {user?.mail}
              </p>
              <p className="text-sm">
                <span className="font-medium text-gray-800">Username:</span> @{user?.username}
              </p>
              {user?.nom && (
                <p className="text-sm">
                  <span className="font-medium text-gray-800">Nom complet:</span> {user.prenom} {user.nom}
                </p>
              )}
              {user?.certified && (
                <div className="flex items-center justify-center mt-3">
                  <span className="text-blue-600 font-medium text-sm bg-blue-50 px-3 py-1 rounded-full">
                    ✓ Compte certifié
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <button
              onClick={() => navigate('/feed')}
              className="w-full bg-black text-white font-medium py-3 px-6 rounded-xl hover:bg-gray-800 transition-colors duration-200"
            >
              Aller au Feed
            </button>
            
            <button
              onClick={handleLogout}
              className="w-full bg-gray-100 text-gray-700 font-medium py-3 px-6 rounded-xl hover:bg-gray-200 transition-colors duration-200"
            >
              Se déconnecter
            </button>
          </div>

          {/* Navigation rapide */}
          <div className="pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-3">Navigation rapide</p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => navigate('/profile')}
                className="text-sm bg-gray-50 hover:bg-gray-100 py-2 px-3 rounded-lg transition-colors"
              >
                👤 Profil
              </button>
              <button 
                onClick={() => navigate('/messages')}
                className="text-sm bg-gray-50 hover:bg-gray-100 py-2 px-3 rounded-lg transition-colors"
              >
                ✉️ Messages
              </button>
              <button 
                onClick={() => navigate('/friends')}
                className="text-sm bg-gray-50 hover:bg-gray-100 py-2 px-3 rounded-lg transition-colors"
              >
                👥 Amis
              </button>
              <button 
                onClick={() => navigate('/settings')}
                className="text-sm bg-gray-50 hover:bg-gray-100 py-2 px-3 rounded-lg transition-colors"
              >
                ⚙️ Paramètres
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Dashboard