// src/components/Admin/AdminPosts.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });

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

  const loadPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search })
      });

      const response = await axios.get(`${API_BASE_URL}/admin/posts?${params}`, getAuthHeaders());
      setPosts(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [currentPage, filters]);

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce post ?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/posts/${postId}`, getAuthHeaders());
      alert('Post supprimé avec succès');
      loadPosts();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression du post');
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
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (loading) {
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

  return (
    <div className="space-y-6">
      {/* En-tête et filtres */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Posts</h1>
          <p className="text-gray-600 mt-2">Modérez et gérez le contenu publié</p>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Rechercher dans le contenu..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
            className="border border-gray-300 rounded-xl px-4 py-2 bg-white focus:ring-2 focus:ring-black focus:border-transparent w-full lg:w-auto"
          />
          <select 
            value={filters.status} 
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="border border-gray-300 rounded-xl px-4 py-2 bg-white focus:ring-2 focus:ring-black focus:border-transparent"
          >
            <option value="">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="deleted">Supprimés</option>
          </select>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-bold">📝</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Posts</p>
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
              <p className="text-sm text-gray-600">En cours</p>
              <p className="text-xl font-bold text-gray-900">{posts?.posts?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des posts */}
      <div className="space-y-4">
        {posts?.posts?.map((post) => (
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
                        {post.active ? '✅ Actif' : '❌ Supprimé'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-gray-900 mb-4 bg-gray-50 p-4 rounded-xl">
                    {truncateContent(post.content)}
                  </div>
                  
                  {/* Statistiques du post */}
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <span>👍</span>
                      <span>{post._count?.likes || 0} likes</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span>💬</span>
                      <span>{post._count?.children || 0} commentaires</span>
                    </div>
                    {post._count?.reports > 0 && (
                      <div className="flex items-center space-x-1 text-red-600">
                        <span>🚨</span>
                        <span>{post._count.reports} signalements</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => window.open(`/post/${post.id_post}`, '_blank')}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                  title="Voir le post"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                
                <button
                  onClick={() => handleDeletePost(post.id_post)}
                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200"
                  title="Supprimer le post"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Message si aucun post */}
        {posts?.posts?.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun post trouvé</h3>
            <p className="text-gray-600">Aucun post ne correspond à vos critères de recherche.</p>
          </div>
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