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

  const dashboardStats = [
    { label: 'Publications', value: '0', icon: '📝' },
    { label: 'Amis', value: '0', icon: '👥' },
    { label: 'Messages', value: '0', icon: '✉️' },
    { label: 'Notifications', value: '0', icon: '🔔' },
  ]

  const quickActions = [
    { 
      title: 'Créer une publication', 
      description: 'Partagez vos moments avec votre cercle',
      icon: '✍️',
      action: () => navigate('/create-post'),
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    { 
      title: 'Trouver des amis', 
      description: 'Découvrez et connectez-vous avec de nouvelles personnes',
      icon: '🔍',
      action: () => navigate('/friends'),
      color: 'bg-green-500 hover:bg-green-600'
    },
    { 
      title: 'Modifier mon profil', 
      description: 'Mettez à jour vos informations personnelles',
      icon: '👤',
      action: () => navigate('/profile'),
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    { 
      title: 'Paramètres', 
      description: 'Gérez vos préférences et votre confidentialité',
      icon: '⚙️',
      action: () => navigate('/settings'),
      color: 'bg-gray-500 hover:bg-gray-600'
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar gauche */}
      <LeftSidebar />
      
      {/* Contenu principal avec marge pour la sidebar */}
      <div className="ml-72 flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          
          {/* En-tête du dashboard */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Bienvenue, {user?.prenom || user?.username} !
                </h1>
                <p className="text-gray-600 mt-2">
                  Voici un aperçu de votre activité sur Cercle
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigate('/feed')}
                  className="bg-black text-white px-6 py-2 rounded-xl hover:bg-gray-800 transition-colors duration-200 font-medium"
                >
                  Voir le Feed
                </button>
              </div>
            </div>
          </div>

          {/* Statistiques en carte */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {dashboardStats.map((stat, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className="text-3xl">{stat.icon}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Actions rapides */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Actions rapides</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quickActions.map((action, index) => (
                <div 
                  key={index}
                  onClick={action.action}
                  className="bg-white rounded-2xl shadow-sm p-6 cursor-pointer hover:shadow-md transition-all duration-200 group"
                >
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center text-white text-xl transition-colors duration-200`}>
                      {action.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {action.description}
                      </p>
                    </div>
                    <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
                      →
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activité récente */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Activité récente</h2>
            
            <div className="text-center py-12">
              <div className="text-gray-400 text-5xl mb-4">📭</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune activité récente
              </h3>
              <p className="text-gray-600 mb-6">
                Commencez à interagir avec votre cercle pour voir votre activité ici
              </p>
              <button
                onClick={() => navigate('/feed')}
                className="bg-black text-white px-6 py-2 rounded-xl hover:bg-gray-800 transition-colors duration-200 font-medium"
              >
                Découvrir le Feed
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Dashboard