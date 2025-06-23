// src/components/Admin/AdminReports.jsx - Version ultra-simplifiée
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminReports = () => {
  const [reportedPosts, setReportedPosts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = 'http://localhost:3000/api/v1';

  const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  const loadReportedPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_BASE_URL}/admin/posts/reported?page=1&limit=20&processed=false`, getAuthHeaders());
      console.log('Reports response:', response.data);
      setReportedPosts(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des posts signalés:', error);
      setError('Erreur lors du chargement des signalements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportedPosts();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Date invalide';
    }
  };

  // État de chargement
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Signalements</h1>
          <p className="text-gray-600 mt-2">Chargement des signalements...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-200 h-20 rounded-xl animate-pulse"></div>
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-200 h-32 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  // État d'erreur
  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Signalements</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-red-800 font-semibold mb-2">Erreur de chargement</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button 
            onClick={loadReportedPosts}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Extraire les données
  const reportsList = reportedPosts?.reported_posts || [];
  const totalReports = reportsList.length;

  return (
    <div className="space-y-6">
      {/* En-tête simple */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Signalements</h1>
          <p className="text-gray-600 mt-2">Gérez les contenus signalés</p>
        </div>
        <div className="bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-medium">
          {totalReports} en attente
        </div>
      </div>

      {/* Statistiques simples */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="text-center">
            <div className="text-3xl mb-2">🚨</div>
            <div className="text-2xl font-bold text-gray-900">{totalReports}</div>
            <div className="text-sm text-gray-600">Signalements total</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="text-center">
            <div className="text-3xl mb-2">⚠️</div>
            <div className="text-2xl font-bold text-gray-900">
              {reportsList.filter(item => (item.total_reports || 1) >= 3).length}
            </div>
            <div className="text-sm text-gray-600">Haute priorité</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="text-center">
            <div className="text-3xl mb-2">📊</div>
            <div className="text-2xl font-bold text-gray-900">0</div>
            <div className="text-sm text-gray-600">Traités aujourd'hui</div>
          </div>
        </div>
      </div>

      {/* Liste des signalements */}
      <div className="space-y-6">
        {totalReports === 0 ? (
          // Aucun signalement
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun signalement</h3>
            <p className="text-gray-600">Excellent ! Aucun contenu signalé à traiter.</p>
          </div>
        ) : (
          // Liste des signalements
          reportsList.map((item, index) => {
            const post = item.post || {};
            const author = post.user || {};
            const reportCount = item.total_reports || item.reports?.length || 1;
            const isHighPriority = reportCount >= 3;
            
            return (
              <div 
                key={post.id_post || `report-${index}`}
                className={`bg-white rounded-xl border-2 p-6 ${
                  isHighPriority ? 'border-red-300' : 'border-gray-200'
                }`}
              >
                {/* Header du signalement */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                      isHighPriority 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      🚨 {reportCount} signalement{reportCount > 1 ? 's' : ''}
                    </div>
                    {isHighPriority && (
                      <div className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
                        URGENT
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    Post #{post.id_post || 'N/A'}
                  </div>
                </div>

                {/* Informations de l'auteur */}
                <div className="flex items-start space-x-4 mb-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    {author.prenom?.[0] || author.username?.[0] || 'U'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-semibold text-gray-900">
                        {author.prenom} {author.nom}
                      </span>
                      <span className="text-gray-500">@{author.username}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-500 text-sm">
                        {formatDate(post.created_at)}
                      </span>
                    </div>
                    
                    {/* Contenu du post */}
                    <div className={`p-4 rounded-lg border-l-4 ${
                      isHighPriority 
                        ? 'bg-red-50 border-red-400' 
                        : 'bg-gray-50 border-yellow-400'
                    }`}>
                      <p className="text-gray-900">
                        {post.content || 'Contenu non disponible'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Détails des signalements si disponibles */}
                {item.reports && item.reports.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Détails ({item.reports.length} signalement{item.reports.length > 1 ? 's' : ''}) :
                    </h4>
                    <div className="space-y-2">
                      {item.reports.slice(0, 3).map((report, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-700">
                            • {report.reason || 'Raison non spécifiée'}
                          </span>
                          <span className="text-gray-500">
                            @{report.reporter?.username || 'Anonyme'}
                          </span>
                        </div>
                      ))}
                      {item.reports.length > 3 && (
                        <div className="text-xs text-gray-500 text-center">
                          ... et {item.reports.length - 3} autre(s)
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>👍 {post._count?.likes || 0}</span>
                    <span>💬 {post._count?.children || 0}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {post.id_post && (
                      <button 
                        onClick={() => window.open(`/post/${post.id_post}`, '_blank')}
                        className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors"
                      >
                        Voir
                      </button>
                    )}
                    <button className="px-3 py-1 text-sm text-green-600 hover:bg-green-50 border border-green-200 rounded-lg transition-colors">
                      Rejeter
                    </button>
                    <button className="px-3 py-1 text-sm text-yellow-600 hover:bg-yellow-50 border border-yellow-200 rounded-lg transition-colors">
                      Avertir
                    </button>
                    <button className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors">
                      Supprimer
                    </button>
                    {isHighPriority && (
                      <button className="px-3 py-1 text-sm bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors">
                        Bannir
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination simple si nécessaire */}
      {reportedPosts?.pagination && reportedPosts.pagination.total_pages > 1 && (
        <div className="flex justify-center space-x-4 mt-8">
          <button 
            disabled={!reportedPosts.pagination.has_prev}
            className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Précédent
          </button>
          <span className="px-4 py-2 text-sm text-gray-600">
            Page {reportedPosts.pagination.current_page || 1}
          </span>
          <button 
            disabled={!reportedPosts.pagination.has_next}
            className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminReports;