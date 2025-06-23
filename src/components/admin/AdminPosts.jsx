// src/components/admin/AdminPosts.jsx - VERSION COMPLÈTEMENT CORRIGÉE
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminPosts = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });

  const API_BASE_URL = 'http://localhost:3000/api/v1';

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('accessToken');
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  }, []);

  const showNotification = useCallback((message, type = 'success') => {
    if (type === 'success') {
      setSuccess(message);
      setError('');
    } else {
      setError(message);
      setSuccess('');
    }
    setTimeout(() => {
      setSuccess('');
      setError('');
    }, 5000);
  }, []);

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search })
      });

      const response = await axios.get(`${API_BASE_URL}/admin/posts?${params}`, getAuthHeaders());
      
      console.log('✅ Posts chargés:', response.data);
      setPosts(response.data);
    } catch (error) {
      console.error('❌ Erreur chargement posts:', error);
      setError('Erreur lors du chargement des posts');
      setPosts({ posts: [], pagination: { total_count: 0, current_page: 1, total_pages: 1 } });
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, getAuthHeaders]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPosts();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadPosts]);

  // ✅ CORRECTION : Reset pagination quand les filtres changent
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [filters.search, filters.status]);

  // ✅ NOUVEAU : Effect séparé pour la pagination
  useEffect(() => {
    if (currentPage > 1) {
      loadPosts();
    }
  }, [currentPage]);

  const handleSearchChange = useCallback((value) => {
    setFilters(prev => ({
      ...prev,
      search: value
    }));
  }, []);

  const handleFilterChange = useCallback((field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // ✅ CORRECTION : Fonctions de pagination avec scroll vers le haut
  const handlePreviousPage = () => {
    if (posts?.pagination?.has_prev && !loading) {
      setCurrentPage(prev => prev - 1);
      // Scroll vers le haut de la page
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextPage = () => {
    if (posts?.pagination?.has_next && !loading) {
      setCurrentPage(prev => prev + 1);
      // Scroll vers le haut de la page
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce post ?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/admin/posts/${postId}`, {
        ...getAuthHeaders(),
        data: { reason: 'Suppression par administrateur' }
      });
      
      showNotification('Post supprimé avec succès');
      loadPosts();
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors de la suppression';
      showNotification(errorMessage, 'error');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateContent = (content, maxLength = 150) => {
    if (!content) return '';
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  // Loading state
  if (loading && currentPage === 1) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Posts</h1>
            <p className="text-gray-600 mt-2">Modérez et gérez le contenu publié</p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <input
              type="text"
              placeholder="Rechercher dans le contenu..."
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="inactive">Supprimés</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">📝</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{posts?.pagination?.total_count || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Actifs</p>
              <p className="text-2xl font-bold text-gray-900">
                {posts?.posts?.filter(p => p.active).length || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <span className="text-2xl">🗑️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Supprimés</p>
              <p className="text-2xl font-bold text-gray-900">
                {posts?.posts?.filter(p => !p.active).length || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-2xl">👁️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cette page</p>
              <p className="text-2xl font-bold text-gray-900">{posts?.posts?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Posts List */}
      <div className="bg-white rounded-lg shadow-sm">
        {posts?.posts?.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-gray-400 text-2xl">📝</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun post trouvé</h3>
            <p className="text-gray-600">
              {filters.search || filters.status 
                ? 'Aucun post ne correspond à vos critères de recherche.' 
                : 'Aucun post n\'a encore été publié.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {posts?.posts?.map((post) => (
              <div key={post.id_post} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Avatar de l'auteur */}
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      {post.author?.photo_profil ? (
                        <img 
                          src={post.author.photo_profil} 
                          alt={post.author.username}
                          className="w-12 h-12 rounded-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentNode.innerHTML = post.author.username?.charAt(0).toUpperCase() || 'U';
                          }}
                        />
                      ) : (
                        post.author?.username?.charAt(0).toUpperCase() || 'U'
                      )}
                    </div>
                    
                    {/* Contenu du post */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {post.author?.username || 'Utilisateur supprimé'}
                        </h3>
                        {post.author?.certified && (
                          <span className="text-blue-500 text-sm">✓</span>
                        )}
                        <span className="text-gray-500 text-sm">
                          {post.author?.nom} {post.author?.prenom}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 mb-3 whitespace-pre-wrap">
                        {truncateContent(post.content, 200)}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>📅 {formatDate(post.created_at)}</span>
                        <span>❤️ {post.stats?.likes || 0} likes</span>
                        <span>💬 {post.stats?.comments || 0} commentaires</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          post.active 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-red-100 text-red-600'
                        }`}>
                          {post.active ? 'Actif' : 'Supprimé'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleDeletePost(post.id_post)}
                      disabled={!post.active}
                      className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                        post.active 
                          ? 'text-red-600 hover:text-red-700 hover:bg-red-50' 
                          : 'text-gray-400 cursor-not-allowed'
                      }`}
                      title={post.active ? "Supprimer le post" : "Post déjà supprimé"}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {posts?.pagination && posts.pagination.total_pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Affichage de {((posts.pagination.current_page - 1) * posts.pagination.limit) + 1} à{' '}
                {Math.min(posts.pagination.current_page * posts.pagination.limit, posts.pagination.total_count)} sur{' '}
                {posts.pagination.total_count} posts
              </div>
              <div className="flex items-center space-x-1">
                <button
                  disabled={!posts.pagination.has_prev || loading}
                  onClick={handlePreviousPage}
                  className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:shadow-md active:bg-gray-100 active:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:shadow-none transition-all duration-200 transform hover:scale-105 active:scale-95"
                >
                  Précédent
                </button>
                <button
                  disabled={!posts.pagination.has_next || loading}
                  onClick={handleNextPage}
                  className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:shadow-md active:bg-gray-100 active:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:shadow-none transition-all duration-200 transform hover:scale-105 active:scale-95"
                >
                  Suivant
                </button>
                <span className="px-4 py-2 text-sm text-gray-700 bg-gray-50 border border-gray-300 rounded-lg ml-2">
                  Page {posts.pagination.current_page} sur {posts.pagination.total_pages}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPosts;