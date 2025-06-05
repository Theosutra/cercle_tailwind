import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const RightSidebar = () => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState([]);
  const [recommendations] = useState([
    { id: 1, icon: '⚽', title: 'Sports', color: 'bg-pink-400' },
    { id: 2, icon: '🌍', title: 'Politique', color: 'bg-green-400' },
    { id: 3, icon: '🐾', title: 'Animaux', color: 'bg-purple-400' },
    { id: 4, icon: '📢', title: 'News', color: 'bg-yellow-400' }
  ]);
  const [followedUsers, setFollowedUsers] = useState(new Set());
  const [loading, setLoading] = useState(true);

  // Récupérer de vrais utilisateurs random depuis la base de données
  useEffect(() => {
    const fetchRandomUsers = async () => {
      try {
        setLoading(true);
        
        // Appel à l'endpoint pour récupérer des utilisateurs suggérés
        const token = localStorage.getItem('accessToken');
        const response = await fetch('/api/v1/users/suggested?limit=3', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setSuggestions(data);
        } else {
          // Si l'endpoint suggested n'existe pas, essayer de récupérer des utilisateurs via search
          const searchResponse = await fetch('/api/v1/users/search?limit=3', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            // Prendre les utilisateurs de la réponse paginée
            setSuggestions(searchData.users || []);
          }
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        // En cas d'erreur, ne pas afficher de suggestions
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchRandomUsers();
    }
  }, [user]);

  const handleFollow = async (userId, username) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/v1/follow/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setFollowedUsers(prev => new Set([...prev, userId]));
        console.log(`Successfully followed ${username}`);
      }
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const getInitials = (prenom, nom, username) => {
    if (prenom && nom) {
      return `${prenom[0]}${nom[0]}`.toUpperCase();
    }
    return username ? username[0].toUpperCase() : 'U';
  };

  const getRandomGradient = (index) => {
    const gradients = [
      'from-blue-400 to-purple-500',
      'from-pink-400 to-red-500',
      'from-green-400 to-blue-500',
      'from-yellow-400 to-pink-500',
      'from-purple-400 to-pink-500',
      'from-indigo-400 to-purple-500'
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div className="w-80 bg-white h-screen fixed right-0 top-0 flex flex-col p-6 overflow-y-auto">
      
      {/* Section Suggestions */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Suggestions</h2>
        
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="w-16 h-8 bg-gray-200 rounded-full"></div>
              </div>
            ))}
          </div>
        ) : suggestions.length > 0 ? (
          <div className="space-y-4">
            {suggestions.map((suggestion, index) => (
              <div key={suggestion.id_user} className="flex items-center space-x-3">
                {/* Photo de profil */}
                <div className="relative">
                  <div className={`w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br ${getRandomGradient(index)} flex items-center justify-center`}>
                    {suggestion.photo_profil ? (
                      <img 
                        src={suggestion.photo_profil} 
                        alt={suggestion.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-sm">
                        {getInitials(suggestion.prenom, suggestion.nom, suggestion.username)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Informations utilisateur */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {suggestion.prenom && suggestion.nom 
                        ? `${suggestion.prenom} ${suggestion.nom}`
                        : suggestion.username
                      }
                    </p>
                    {suggestion.certified && (
                      <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">@{suggestion.username}</p>
                </div>

                {/* Bouton Follow */}
                <button
                  onClick={() => handleFollow(suggestion.id_user, suggestion.username)}
                  disabled={followedUsers.has(suggestion.id_user)}
                  className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                    followedUsers.has(suggestion.id_user)
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : 'bg-black text-white hover:bg-gray-800'
                  }`}
                >
                  {followedUsers.has(suggestion.id_user) ? 'Suivi' : 'Follow'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">Aucune suggestion pour le moment</p>
          </div>
        )}
      </div>

      {/* Section Recommandations - Design plus fidèle à la photo */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-6">Recommandations</h2>
        
        <div className="grid grid-cols-2 gap-4">
          {recommendations.map((recommendation) => (
            <div
              key={recommendation.id}
              className="relative bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors cursor-pointer group min-h-[90px]"
            >
              {/* Icône en haut à gauche */}
              <div className={`w-8 h-8 ${recommendation.color} rounded-lg flex items-center justify-center mb-2 group-hover:scale-105 transition-transform`}>
                <span className="text-sm">{recommendation.icon}</span>
              </div>
              
              {/* Titre en bas */}
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-sm font-semibold text-gray-900">
                  {recommendation.title}
                </h3>
              </div>
              
              {/* Badge de notification en haut à droite pour News */}
              {recommendation.id === 4 && (
                <div className="absolute top-2 right-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-[10px] text-white font-bold">3</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;