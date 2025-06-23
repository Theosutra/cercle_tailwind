// src/components/admin/AdminPosts.jsx - VERSION COMPLÈTE CORRIGÉE
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AdminPosts = () => {
  const [posts, setPosts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });

  const API_BASE_URL = 'http://localhost:3000/api/v1';

  const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    console.log('🔑 Token présent:', !!token);
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  // ✅ CORRECTION : useCallback sans LoaderProvider
  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search })
      });

      const url = `${API_BASE_URL}/admin/posts?${params}`;
      console.log('🔍 Chargement posts depuis:', url);

      const response = await axios.get(url, getAuthHeaders());
      
      console.log('✅ Réponse API posts:', response.data);
      console.log('📊 Nombre de posts:', response.data?.posts?.length || 0);
      
      setPosts(response.data);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des posts:', error);
      console.error('📋 Détails erreur:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        url: error.config?.url
      });
      
      setError(error.response?.data?.message || error.message);
      setPosts({ posts: [], pagination: null });
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters.search, filters.status]);

  // ✅ CORRECTION : Debounce simple pour la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      loadPosts();
    }, 300);

    return () => clearTimeout(timer);
  }, [loadPosts]);

  // ✅ CORRECTION : Handlers optimisés
  const handleSearchChange = (value) => {
    setCurrentPage(1);
    setFilters(prev => ({
      ...prev,
      search: value
    }));
  };

  const handleFilterChange = (field, value) => {
    setCurrentPage(1);
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // ✅ CORRECTION : Suppression sans LoaderProvider
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce post ?')) {
      return;
    }

    try {
      console.log('🗑️ Suppression du post:', postId);
      
      // ✅ Route admin correcte
      const response = await axios.delete(`${API_BASE_URL}/admin/posts/${postId}`, {
        ...getAuthHeaders(),
        data: { reason: 'Suppression par administrateur' }
      });
      
      console.log('✅ Post supprimé:', response.data);
      alert('Post supprimé avec succès');
      
      // Recharger les posts
      loadPosts();
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      console.error('📋 Détails suppression:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        postId
      });
      
      const errorMessage = error.response?.data?.message || 'Erreur lors de la suppression du post';
      alert(errorMessage);
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

  // ✅ DEBUGGING: Afficher l'état actuel
  console.log('🔄 AdminPosts state:', {
    loading,
    error,
    posts: posts?.posts?.length || 0,
    pagination: posts?.pagination
  });

  // ✅ CORRECTION : Loading simple sans AdminPageLoader
  if (loading && !posts) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  // Affichage d'erreur
  if (error && !posts) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Posts</h1>
          <p className="text-gray-600 mt-2">Modérez et gérez le contenu publié</p>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-red-600 font-bold">⚠️</span>
            </div>
            <div>
              <h3 className="text-red-800 font-semibold">Erreur de chargement</h3>
              <p className="text-red-600 mt-1">{error}</p>
              <button 
                onClick={loadPosts}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête et filtres */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Posts</h1>
          <p className="text-gray-600 mt-2">Modérez et gérez le contenu publié</p>
        </div>
        
        <div className="flex flex-wrap gap-4">
          {/* ✅ CORRECTION : Input de recherche optimisé */}
          <input
            type="text"
            placeholder="Rechercher dans le contenu..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>
        </div>
      </div>

      {/* ✅ DEBUGGING: Afficher le nombre de posts trouvés */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-blue-800">
          <strong>Debug:</strong> {posts?.posts?.length || 0} posts chargés
          {posts?.pagination && ` - Page ${posts.pagination.current_page}/${posts.pagination.total_pages}`}
        </p>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-bold">📝</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-xl font-bold text-gray-900">{posts?.pagination?.total || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 font-bold">✅</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Actifs</p>
              <p className="text-xl font-bold text-gray-900">{posts?.posts?.filter(p => p.active).length || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-red-600 font-bold">🗑️</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Supprimés</p>
              <p className="text-xl font-bold text-gray-900">{posts?.posts?.filter(p => !p.active).length || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-yellow-600 font-bold">👁️</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Cette page</p>
              <p className="text-xl font-bold text-gray-900">{posts?.posts?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des posts */}
      <div className="space-y-4">
        {posts?.posts?.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
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
          posts?.posts?.map((post) => (
            <div key={post.id_post} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all duration-300">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  {/* Avatar de l'auteur */}
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                    {post.author?.photo_profil ? (
                      <img src={post.author.photo_profil} alt={post.author.username} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      post.author?.prenom?.[0]?.toUpperCase() || post.author?.username?.[0]?.toUpperCase() || 'U'
                    )}
                  </div>

                  {/* Contenu du post */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {post.author?.prenom} {post.author?.nom}
                      </h3>
                      <span className="text-gray-500">@{post.author?.username}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-500 text-sm">{formatDate(post.created_at)}</span>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          post.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {post.active ? 'Actif' : 'Supprimé'}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-800 mb-3 leading-relaxed">
                      {truncateContent(post.content)}
                    </p>
                    
                    <div className="flex items-center text-sm text-gray-500 space-x-4">
                      <span>❤️ {post.likeCount || 0} likes</span>
                      <span>💬 {post.replyCount || 0} réponses</span>
                      <span>ID: {post.id_post}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  {/* ✅ CORRECTION : Bouton de suppression avec état intelligent */}
                  <button
                    onClick={() => handleDeletePost(post.id_post)}
                    disabled={!post.active} // Désactiver si déjà supprimé
                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                      post.active 
                        ? 'bg-red-600 text-white hover:bg-red-700' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {post.active ? 'Supprimer' : 'Supprimé'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {posts?.pagination && posts.pagination.total_pages > 1 && (
        <div className="flex justify-between items-center p-4 bg-white rounded-xl border border-gray-200">
          <div className="text-sm text-gray-600">
            Affichage de {((posts.pagination.current_page - 1) * posts.pagination.limit) + 1} à{' '}
            {Math.min(posts.pagination.current_page * posts.pagination.limit, posts.pagination.total)} sur{' '}
            {posts.pagination.total} posts
          </div>
          <div className="flex space-x-2">
            <button 
              disabled={!posts.pagination.has_prev}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="px-4 py-2 text-sm bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Précédent
            </button>
            <span className="px-4 py-2 text-sm text-gray-600">
              Page {posts.pagination.current_page} sur {posts.pagination.total_pages}
            </span>
            <button 
              disabled={!posts.pagination.has_next}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="px-4 py-2 text-sm bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPosts;