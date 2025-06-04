// src/components/RightSidebar.jsx
import React, { useState, useEffect } from 'react';

const RightSidebar = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  const recommendations = [
    { name: 'Sports', icon: '🏃', color: 'bg-pink-400' },
    { name: 'Politique', icon: '🌍', color: 'bg-green-400' },
    { name: 'Animaux', icon: '🐾', color: 'bg-purple-400' },
    { name: 'News', icon: '📢', color: 'bg-lime-400' }
  ];

  // Simuler le chargement des suggestions d'utilisateurs
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        // TODO: Remplacer par l'appel API réel
        // const response = await ApiService.get('/api/v1/users/suggested');
        // setSuggestions(response);
        
        // Données temporaires pour la démo
        setSuggestions([
          { id: 1, username: 'lola_lui', nom: 'Lola', prenom: 'Lui', photo_profil: null },
          { id: 2, username: 'thomas_grall', nom: 'Thomas', prenom: 'Grall', photo_profil: null },
          { id: 3, username: 'lea_dumail', nom: 'Lea', prenom: 'Dumail', photo_profil: null }
        ]);
      } catch (error) {
        console.error('Erreur lors du chargement des suggestions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, []);

  const handleFollow = async (userId) => {
    try {
      // TODO: Appel API pour suivre l'utilisateur
      // await ApiService.post(`/api/v1/follow/${userId}`);
      
      // Retirer l'utilisateur des suggestions après le follow
      setSuggestions(prev => prev.filter(user => user.id !== userId));
      
      console.log(`Suivi de l'utilisateur ${userId}`);
    } catch (error) {
      console.error('Erreur lors du suivi:', error);
    }
  };

  const handleRecommendationClick = (recommendation) => {
    // TODO: Naviguer vers la page de la recommandation ou filtrer le feed
    console.log(`Clic sur la recommandation: ${recommendation.name}`);
  };

  return (
    <div className="w-80 fixed right-0 top-0 h-screen p-6 overflow-y-auto">
      {/* Section Suggestions */}
      <div className="bg-white rounded-2xl p-6 mb-6 border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Suggestions</h3>
        
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded-full w-16"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.length > 0 ? (
              suggestions.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                      {user.photo_profil ? (
                        <img 
                          src={user.photo_profil} 
                          alt={`${user.prenom} ${user.nom}`}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-semibold text-sm">
                          {user.prenom?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {user.prenom && user.nom ? `${user.prenom} ${user.nom}` : user.username}
                      </p>
                      <p className="text-xs text-gray-500">@{user.username}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleFollow(user.id)}
                    className="bg-black text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
                  >
                    Follow
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm">Aucune suggestion pour le moment</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section Recommandations */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Recommandations</h3>
        <div className="grid grid-cols-2 gap-3">
          {recommendations.map((item, index) => (
            <button 
              key={index} 
              onClick={() => handleRecommendationClick(item)}
              className={`${item.color} rounded-xl p-4 text-white cursor-pointer hover:scale-105 transition-transform duration-200 text-left`}
            >
              <div className="text-2xl mb-2">{item.icon}</div>
              <div className="font-semibold text-sm">{item.name}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;