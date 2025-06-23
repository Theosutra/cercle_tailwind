// src/components/admin/AdminUsers.jsx - VERSION OPTIMISÉE COMPLÈTE
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';

const AdminUsers = () => {
  // ===== ÉTATS PRINCIPAUX =====
  const [users, setUsers] = useState([]);
  const [bannedUsers, setBannedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('users'); // 'users' ou 'banned'
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ===== FILTRES =====
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    search: ''
  });

  // ===== MODALES =====
  const [showBanModal, setShowBanModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showUnbanModal, setShowUnbanModal] = useState(false);
  const [showUserDetailModal, setShowUserDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedBan, setSelectedBan] = useState(null);

  // ===== FORMULAIRES =====
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState('24');
  const [newRole, setNewRole] = useState('');

  const API_BASE_URL = 'http://localhost:3000/api/v1';

  // ===== UTILITAIRES =====
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

  // ===== CHARGEMENT DES DONNÉES =====
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
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
      setError('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, getAuthHeaders]);

  const loadBannedUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.get(`${API_BASE_URL}/admin/bans?page=${currentPage}&limit=20`, getAuthHeaders());
      setBannedUsers(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs bannis:', error);
      setError('Erreur lors du chargement des utilisateurs bannis');
    } finally {
      setLoading(false);
    }
  }, [currentPage, getAuthHeaders]);

  // ===== EFFECTS =====
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'users') {
        loadUsers();
      } else {
        loadBannedUsers();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [activeTab, loadUsers, loadBannedUsers]);

  // Reset pagination when changing tabs or filters
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, filters]);

  // ===== HANDLERS =====
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

  const handleBanUser = async () => {
    try {
      if (!banReason.trim()) {
        setError('Veuillez spécifier une raison pour le bannissement');
        return;
      }

      await axios.post(`${API_BASE_URL}/admin/users/${selectedUser.id_user}/ban`, {
        raison: banReason.trim(),
        duration_hours: parseInt(banDuration)
      }, getAuthHeaders());
      
      showNotification('Utilisateur banni avec succès');
      setShowBanModal(false);
      setBanReason('');
      setBanDuration('24');
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      console.error('Erreur lors du bannissement:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors du bannissement';
      setError(errorMessage);
    }
  };

  const handleUnbanUser = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/admin/bans/${selectedBan.id_bannissement}/unban`, getAuthHeaders());
      showNotification('Utilisateur débanni avec succès');
      setShowUnbanModal(false);
      setSelectedBan(null);
      loadBannedUsers();
    } catch (error) {
      console.error('Erreur lors du débannissement:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors du débannissement';
      setError(errorMessage);
    }
  };

  const handleChangeRole = async () => {
    try {
      if (!newRole) {
        setError('Veuillez sélectionner un nouveau rôle');
        return;
      }

      await axios.put(`${API_BASE_URL}/admin/users/${selectedUser.id_user}/role`, {
        new_role: newRole.toUpperCase()
      }, getAuthHeaders());
      
      showNotification('Rôle modifié avec succès');
      setShowRoleModal(false);
      setNewRole('');
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      console.error('Erreur lors du changement de rôle:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors du changement de rôle';
      setError(errorMessage);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/admin/users/${userId}`, getAuthHeaders());
      showNotification('Utilisateur supprimé avec succès');
      loadUsers();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors de la suppression';
      setError(errorMessage);
    }
  };

  // ===== UTILITAIRES UI =====
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
      case 'ADMIN': return 'bg-red-100 text-red-800 border border-red-200';
      case 'MODERATOR': return 'bg-blue-100 text-blue-800 border border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getStatusBadgeClass = (isActive) => {
    return isActive 
      ? 'bg-green-100 text-green-800 border border-green-200'
      : 'bg-red-100 text-red-800 border border-red-200';
  };

  const calculateTimeRemaining = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end - now;
    
    if (diff <= 0) return 'Expiré';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}j ${hours}h`;
    return `${hours}h`;
  };

  // ===== DONNÉES CALCULÉES =====
  const currentData = useMemo(() => {
    return activeTab === 'users' ? users : bannedUsers;
  }, [activeTab, users, bannedUsers]);

  const statsUsers = useMemo(() => {
    if (!users.users) return { total: 0, active: 0, inactive: 0 };
    return {
      total: users.pagination?.total_count || 0,
      active: users.users.filter(u => u.is_active).length,
      inactive: users.users.filter(u => !u.is_active).length
    };
  }, [users]);

  const statsBans = useMemo(() => {
    if (!bannedUsers.bans) return { total: 0 };
    return {
      total: bannedUsers.pagination?.total_count || 0
    };
  }, [bannedUsers]);

  // ===== RENDU =====
  if (loading && currentPage === 1) {
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

      {/* Header avec stats */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des utilisateurs</h1>
            <p className="text-gray-600 mt-2">Gérez les comptes utilisateurs et les bannissements</p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{statsUsers.total}</div>
              <div className="text-sm text-blue-600">Total utilisateurs</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{statsUsers.active}</div>
              <div className="text-sm text-green-600">Actifs</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{statsUsers.inactive}</div>
              <div className="text-sm text-red-600">Inactifs</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{statsBans.total}</div>
              <div className="text-sm text-orange-600">Bannis</div>
            </div>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Utilisateurs ({statsUsers.total})
            </button>
            <button
              onClick={() => setActiveTab('banned')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'banned'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Utilisateurs bannis ({statsBans.total})
            </button>
          </nav>
        </div>

        {/* Filtres (seulement pour l'onglet utilisateurs) */}
        {activeTab === 'users' && (
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recherche</label>
                <input
                  type="text"
                  placeholder="Nom d'utilisateur, email..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rôle</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.role}
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                >
                  <option value="">Tous les rôles</option>
                  <option value="USER">Utilisateur</option>
                  <option value="MODERATOR">Modérateur</option>
                  <option value="ADMIN">Administrateur</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">Tous les statuts</option>
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Table des utilisateurs */}
        {activeTab === 'users' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inscription
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Posts
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.users?.map((user) => (
                  <tr key={user.id_user} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {user.username?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.username}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.nom} {user.prenom}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.mail}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeClass(user.role?.role)}`}>
                        {user.role?.role || 'USER'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(user.is_active)}`}>
                        {user.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user._count?.posts || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserDetailModal(true);
                          }}
                          className="text-gray-600 hover:text-gray-900"
                          title="Voir détails"
                        >
                          👁️
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setNewRole(user.role?.role || 'USER');
                            setShowRoleModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Modifier le rôle"
                        >
                          🔧
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowBanModal(true);
                          }}
                          className="text-orange-600 hover:text-orange-900"
                          title="Bannir"
                        >
                          🚫
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id_user)}
                          className="text-red-600 hover:text-red-900"
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table des utilisateurs bannis */}
        {activeTab === 'banned' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Raison
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Banni par
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date de début
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Temps restant
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bannedUsers.bans?.map((ban) => (
                  <tr key={ban.id_bannissement} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-red-700">
                              {ban.user_banni?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {ban.user_banni}
                          </div>
                          <div className="text-sm text-gray-500">
                            {ban.user_email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={ban.raison}>
                        {ban.raison}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ban.banni_by}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(ban.debut_ban)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                        {calculateTimeRemaining(ban.fin_ban)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedBan(ban);
                          setShowUnbanModal(true);
                        }}
                        className="text-green-600 hover:text-green-900"
                        title="Débannir"
                      >
                        ✅ Débannir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {currentData?.pagination && currentData.pagination.total_pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Affichage de {((currentData.pagination.current_page - 1) * currentData.pagination.limit) + 1} à{' '}
                {Math.min(currentData.pagination.current_page * currentData.pagination.limit, currentData.pagination.total_count)} sur{' '}
                {currentData.pagination.total_count} résultats
              </div>
              <div className="flex space-x-2">
                <button
                  disabled={!currentData.pagination.has_prev || loading}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Précédent
                </button>
                <span className="px-4 py-2 text-sm text-gray-700 bg-gray-50 border border-gray-300 rounded-lg">
                  Page {currentData.pagination.current_page} sur {currentData.pagination.total_pages}
                </span>
                <button
                  disabled={!currentData.pagination.has_next || loading}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de bannissement */}
      {showBanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Bannir {selectedUser?.username}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Raison du bannissement *
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Expliquez la raison du bannissement..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durée
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={banDuration}
                  onChange={(e) => setBanDuration(e.target.value)}
                >
                  <option value="1">1 heure</option>
                  <option value="6">6 heures</option>
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
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Annuler
              </button>
              <button
                onClick={handleBanUser}
                disabled={!banReason.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Modifier le rôle de {selectedUser?.username}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rôle actuel
                </label>
                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  {selectedUser?.role?.role || 'USER'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nouveau rôle
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  <option value="USER">Utilisateur</option>
                  <option value="MODERATOR">Modérateur</option>
                  <option value="ADMIN">Administrateur</option>
                </select>
              </div>
              <div className="text-xs text-gray-500 bg-yellow-50 p-2 rounded">
                ⚠️ Cette action modifiera immédiatement les permissions de l'utilisateur
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setNewRole('');
                  setSelectedUser(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Annuler
              </button>
              <button
                onClick={handleChangeRole}
                disabled={!newRole || newRole === selectedUser?.role?.role}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Modifier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de débannissement */}
      {showUnbanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Débannir {selectedBan?.user_banni}
            </h3>
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                <p><strong>Raison du bannissement :</strong> {selectedBan?.raison}</p>
                <p><strong>Banni par :</strong> {selectedBan?.banni_by}</p>
                <p><strong>Date de fin prévue :</strong> {selectedBan?.fin_ban && formatDate(selectedBan.fin_ban)}</p>
                <p><strong>Temps restant :</strong> {selectedBan?.fin_ban && calculateTimeRemaining(selectedBan.fin_ban)}</p>
              </div>
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                ⚠️ Cette action débannira immédiatement l'utilisateur et lui permettra de se reconnecter.
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowUnbanModal(false);
                  setSelectedBan(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Annuler
              </button>
              <button
                onClick={handleUnbanUser}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                Débannir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de détails utilisateur */}
      {showUserDetailModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Détails de {selectedUser.username}
              </h3>
              <button
                onClick={() => {
                  setShowUserDetailModal(false);
                  setSelectedUser(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Informations personnelles</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Nom complet :</strong> {selectedUser.nom} {selectedUser.prenom}</div>
                  <div><strong>Email :</strong> {selectedUser.mail}</div>
                  <div><strong>Téléphone :</strong> {selectedUser.telephone || 'Non renseigné'}</div>
                  <div><strong>Bio :</strong> {selectedUser.bio || 'Aucune bio'}</div>
                  <div><strong>Compte privé :</strong> {selectedUser.private ? 'Oui' : 'Non'}</div>
                  <div><strong>Certifié :</strong> {selectedUser.certified ? 'Oui' : 'Non'}</div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Statistiques</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Rôle :</strong> {selectedUser.role?.role || 'USER'}</div>
                  <div><strong>Statut :</strong> {selectedUser.is_active ? 'Actif' : 'Inactif'}</div>
                  <div><strong>Inscription :</strong> {formatDate(selectedUser.created_at)}</div>
                  <div><strong>Dernière connexion :</strong> {selectedUser.last_login ? formatDate(selectedUser.last_login) : 'Jamais'}</div>
                  <div><strong>Nombre de posts :</strong> {selectedUser._count?.posts || 0}</div>
                  <div><strong>Dernière mise à jour :</strong> {formatDate(selectedUser.updated_at)}</div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowUserDetailModal(false);
                    setNewRole(selectedUser.role?.role || 'USER');
                    setShowRoleModal(true);
                  }}
                  className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200"
                >
                  Modifier le rôle
                </button>
                <button
                  onClick={() => {
                    setShowUserDetailModal(false);
                    setShowBanModal(true);
                  }}
                  className="px-4 py-2 text-sm font-medium text-orange-700 bg-orange-100 rounded-lg hover:bg-orange-200"
                >
                  Bannir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;