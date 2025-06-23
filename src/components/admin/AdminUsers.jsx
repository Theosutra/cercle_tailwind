// src/components/admin/AdminUsers.jsx - CORRIGÉ
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    search: ''
  });

  // États pour les modales
  const [showBanModal, setShowBanModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState('24');
  const [newRole, setNewRole] = useState('');

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

  // ✅ CORRECTION : useCallback pour éviter les re-créations
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...(filters.role && { role: filters.role }),
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search })
      });

      const response = await axios.get(`${API_BASE_URL}/admin/users?${params}`, getAuthHeaders());
      setUsers(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters.role, filters.status, filters.search]);

  // ✅ CORRECTION : Debounce pour la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 300); // Délai de 300ms pour éviter trop d'appels API

    return () => clearTimeout(timer);
  }, [loadUsers]);

  // ✅ CORRECTION : Handler de recherche optimisé
  const handleSearchChange = (value) => {
    setCurrentPage(1); // Reset la page à 1 lors d'une nouvelle recherche
    setFilters(prev => ({
      ...prev,
      search: value
    }));
  };

  const handleFilterChange = (field, value) => {
    setCurrentPage(1); // Reset la page à 1 lors d'un changement de filtre
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBanUser = async () => {
    try {
      await axios.post(`${API_BASE_URL}/admin/users/${selectedUser.id_user}/ban`, {
        raison: banReason,
        duration_hours: parseInt(banDuration)
      }, getAuthHeaders());
      
      alert('Utilisateur banni avec succès');
      setShowBanModal(false);
      setBanReason('');
      setBanDuration('24');
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      console.error('Erreur lors du bannissement:', error);
      alert('Erreur lors du bannissement de l\'utilisateur');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/admin/users/${userId}`, getAuthHeaders());
      alert('Utilisateur supprimé avec succès');
      loadUsers();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression de l\'utilisateur');
    }
  };

  const handleChangeRole = async () => {
    try {
      await axios.put(`${API_BASE_URL}/admin/users/${selectedUser.id_user}/role`, {
        new_role: newRole
      }, getAuthHeaders());
      
      alert('Rôle modifié avec succès');
      setShowRoleModal(false);
      setNewRole('');
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      console.error('Erreur lors du changement de rôle:', error);
      alert('Erreur lors du changement de rôle');
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

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'ADMIN': return 'bg-gradient-to-r from-red-500 to-red-600 text-white';
      case 'MODERATOR': return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
      default: return 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800';
    }
  };

  const getStatusBadgeClass = (isActive) => {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-20 rounded-lg"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">Gestion des utilisateurs</h1>
          <p className="text-gray-600 mt-2">Gérez les comptes utilisateurs</p>
        </div>
        
        <div className="flex flex-wrap gap-4">
          {/* ✅ CORRECTION : Input de recherche optimisé */}
          <input
            type="text"
            placeholder="Rechercher..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-2 bg-white focus:ring-2 focus:ring-black focus:border-transparent w-full lg:w-auto"
          />
          <select 
            value={filters.role} 
            onChange={(e) => handleFilterChange('role', e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-2 bg-white focus:ring-2 focus:ring-black focus:border-transparent"
          >
            <option value="">Tous les rôles</option>
            <option value="USER">Utilisateur</option>
            <option value="MODERATOR">Modérateur</option>
            <option value="ADMIN">Administrateur</option>
          </select>
          <select 
            value={filters.status} 
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-2 bg-white focus:ring-2 focus:ring-black focus:border-transparent"
          >
            <option value="">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="banned">Banni</option>
            <option value="inactive">Inactif</option>
          </select>
        </div>
      </div>

      {/* Liste des utilisateurs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 font-semibold text-gray-900">Utilisateur</th>
                <th className="text-left p-4 font-semibold text-gray-900">Rôle</th>
                <th className="text-left p-4 font-semibold text-gray-900">Statut</th>
                <th className="text-left p-4 font-semibold text-gray-900">Inscription</th>
                <th className="text-left p-4 font-semibold text-gray-900">Posts</th>
                <th className="text-right p-4 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users?.users?.map((user) => (
                <tr key={user.id_user} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {user.photo_profil ? (
                          <img src={user.photo_profil} alt={user.username} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          user.prenom?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || 'U'
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {user.prenom} {user.nom}
                        </p>
                        <p className="text-sm text-gray-500">@{user.username}</p>
                        <p className="text-xs text-gray-400">{user.mail}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeClass(user.role?.role)}`}>
                      {user.role?.role || 'USER'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(user.is_active)}`}>
                      {user.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-gray-600">
                      {formatDate(user.created_at)}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm font-medium text-gray-900">
                      {user._count?.posts || 0}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setNewRole(user.role?.role || 'USER');
                          setShowRoleModal(true);
                        }}
                        className="px-3 py-1 text-xs bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                      >
                        Rôle
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowBanModal(true);
                        }}
                        className="px-3 py-1 text-xs bg-yellow-600 text-white hover:bg-yellow-700 rounded-lg transition-colors"
                      >
                        Bannir
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id_user)}
                        className="px-3 py-1 text-xs bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {users?.pagination && users.pagination.total_pages > 1 && (
        <div className="flex justify-between items-center p-4 bg-white rounded-xl border border-gray-200">
          <div className="text-sm text-gray-600">
            Affichage de {((users.pagination.current_page - 1) * users.pagination.limit) + 1} à{' '}
            {Math.min(users.pagination.current_page * users.pagination.limit, users.pagination.total_count)} sur{' '}
            {users.pagination.total_count} utilisateurs
          </div>
          <div className="flex space-x-2">
            <button 
              disabled={!users.pagination.has_prev}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="px-4 py-2 text-sm bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Précédent
            </button>
            <span className="px-4 py-2 text-sm text-gray-600">
              Page {users.pagination.current_page} sur {users.pagination.total_pages}
            </span>
            <button 
              disabled={!users.pagination.has_next}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="px-4 py-2 text-sm bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Suivant
            </button>
          </div>
        </div>
      )}

      {/* Modal de bannissement */}
      {showBanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bannir l'utilisateur</h3>
            <p className="text-gray-600 mb-4">
              Vous êtes sur le point de bannir <strong>{selectedUser?.username}</strong>
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Raison du bannissement
                </label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  rows="3"
                  placeholder="Expliquez la raison du bannissement..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durée (en heures)
                </label>
                <select
                  value={banDuration}
                  onChange={(e) => setBanDuration(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="24">24 heures</option>
                  <option value="72">3 jours</option>
                  <option value="168">1 semaine</option>
                  <option value="720">1 mois</option>
                  <option value="8760">1 an</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowBanModal(false);
                  setBanReason('');
                  setBanDuration('24');
                  setSelectedUser(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleBanUser}
                disabled={!banReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Bannir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de changement de rôle */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Changer le rôle</h3>
            <p className="text-gray-600 mb-4">
              Modifier le rôle de <strong>{selectedUser?.username}</strong>
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nouveau rôle
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="USER">Utilisateur</option>
                <option value="MODERATOR">Modérateur</option>
                <option value="ADMIN">Administrateur</option>
              </select>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setNewRole('');
                  setSelectedUser(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleChangeRole}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Modifier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;