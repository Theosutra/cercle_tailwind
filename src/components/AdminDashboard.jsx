import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [posts, setPosts] = useState([]);
  const [reportedPosts, setReportedPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    userRole: '',
    userStatus: '',
    postStatus: '',
    search: ''
  });

  // État pour les modales
  const [showBanModal, setShowBanModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const API_BASE_URL = 'http://localhost:3000/api/v1';

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === 'posts') {
      loadPosts();
    } else if (activeTab === 'reports') {
      loadReportedPosts();
    } else if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab, currentPage, filters]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  const loadDashboardData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/dashboard`, getAuthHeaders());
      setDashboardData(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement du dashboard:', error);
      if (error.response?.status === 403) {
        alert('Accès refusé : Vous n\'avez pas les permissions nécessaires');
        navigate('/feed');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...(filters.postStatus && { status: filters.postStatus }),
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

  const loadReportedPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        processed: 'false'
      });

      const response = await axios.get(`${API_BASE_URL}/admin/posts/reported?${params}`, getAuthHeaders());
      setReportedPosts(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des posts signalés:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...(filters.userRole && { role: filters.userRole }),
        ...(filters.userStatus && { status: filters.userStatus }),
        ...(filters.search && { search: filters.search })
      });

      const response = await axios.get(`${API_BASE_URL}/admin/users?${params}`, getAuthHeaders());
      setUsers(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId, reason, durationHours) => {
    try {
      await axios.post(`${API_BASE_URL}/admin/users/${userId}/ban`, {
        raison: reason,
        duration_hours: parseInt(durationHours)
      }, getAuthHeaders());
      
      alert('Utilisateur banni avec succès');
      setShowBanModal(false);
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

  const handleChangeRole = async (userId, newRole) => {
    try {
      await axios.put(`${API_BASE_URL}/admin/users/${userId}/role`, {
        new_role: newRole
      }, getAuthHeaders());
      
      alert('Rôle modifié avec succès');
      setShowRoleModal(false);
      loadUsers();
    } catch (error) {
      console.error('Erreur lors du changement de rôle:', error);
      alert('Erreur lors du changement de rôle');
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      await logout();
      navigate('/');
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

  const menuItems = [
    { id: 'overview', label: '📊 Vue d\'ensemble', icon: '📊' },
    { id: 'users', label: '👥 Utilisateurs', icon: '👥' },
    { id: 'posts', label: '📝 Posts', icon: '📝' },
    { id: 'reports', label: `🚨 Signalements (${dashboardData?.global_stats?.pending_reports || 0})`, icon: '🚨' }
  ];

  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du backoffice...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ✅ Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header avec profil admin */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-4 p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100 transition-all duration-300 hover:shadow-lg group">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
              {user?.prenom?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 transition-colors duration-300 group-hover:text-black">
                {user?.prenom} {user?.nom}
              </h3>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeClass(dashboardData?.user_role)}`}>
                  {dashboardData?.user_role}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Logo Cercle */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-center space-x-3 p-4 rounded-2xl cursor-pointer transition-all duration-300 hover:bg-gray-50 hover:scale-105 group">
            <div className="w-8 h-8 border-2 border-black rounded-full flex items-center justify-center transition-all duration-300 group-hover:border-gray-600 group-hover:shadow-lg group-hover:rotate-12">
              <div className="w-2 h-2 bg-black rounded-full transition-all duration-300 group-hover:bg-gray-600 group-hover:scale-125"></div>
            </div>
            <span className="text-2xl font-bold text-black tracking-wide transition-all duration-300 group-hover:text-gray-700 group-hover:tracking-wider">
              CERCLE
            </span>
            <span className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">
              ADMIN
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-6 py-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-start space-x-4 px-6 py-4 rounded-2xl text-left transition-all duration-300 group relative overflow-hidden ${
                    activeTab === item.id 
                      ? 'bg-black text-white shadow-lg' 
                      : 'text-gray-700 hover:bg-gray-100 hover:shadow-md hover:scale-105'
                  }`}
                >
                  <div className={`absolute left-0 top-0 h-full w-1 bg-black transform transition-all duration-300 ${
                    activeTab === item.id ? 'scale-y-100' : 'scale-y-0 group-hover:scale-y-75'
                  } rounded-r-full`}></div>

                  <div className={`text-xl flex-shrink-0 relative z-10 transition-all duration-300 ${
                    activeTab !== item.id ? 'group-hover:scale-110' : ''
                  }`}>
                    {item.icon}
                  </div>
                  
                  <span className={`font-medium text-lg relative z-10 transition-all duration-300 ${
                    activeTab !== item.id ? 'group-hover:text-black group-hover:font-semibold' : ''
                  }`}>
                    {item.label}
                  </span>

                  <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 ${
                    activeTab !== item.id ? 'group-hover:opacity-20' : ''
                  } transform -skew-x-12 transition-all duration-700 group-hover:translate-x-full`}></div>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bouton Déconnexion */}
        <div className="p-6 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-3 px-6 py-4 rounded-2xl text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-300 group border border-red-200 hover:border-red-300"
          >
            <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="font-medium">Déconnexion</span>
          </button>
        </div>
      </div>

      {/* ✅ Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Vue d'ensemble</h1>
                <div className="text-sm text-gray-500">
                  Dernière mise à jour : {new Date().toLocaleTimeString('fr-FR')}
                </div>
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Utilisateurs</p>
                      <p className="text-3xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                        {dashboardData?.global_stats?.active_users}
                      </p>
                      <p className="text-xs text-gray-500">sur {dashboardData?.global_stats?.total_users} total</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-300">
                      <span className="text-2xl">👥</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Posts</p>
                      <p className="text-3xl font-bold text-gray-900 group-hover:text-green-600 transition-colors duration-300">
                        {dashboardData?.global_stats?.active_posts}
                      </p>
                      <p className="text-xs text-gray-500">sur {dashboardData?.global_stats?.total_posts} total</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center group-hover:bg-green-200 transition-colors duration-300">
                      <span className="text-2xl">📝</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Signalements</p>
                      <p className="text-3xl font-bold text-gray-900 group-hover:text-red-600 transition-colors duration-300">
                        {dashboardData?.global_stats?.pending_reports}
                      </p>
                      <p className="text-xs text-gray-500">en attente</p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center group-hover:bg-red-200 transition-colors duration-300">
                      <span className="text-2xl">🚨</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Bannissements</p>
                      <p className="text-3xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors duration-300">
                        {dashboardData?.global_stats?.active_bans}
                      </p>
                      <p className="text-xs text-gray-500">actuellement actifs</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center group-hover:bg-orange-200 transition-colors duration-300">
                      <span className="text-2xl">🚫</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Activité récente (7 derniers jours)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-blue-800">Nouveaux utilisateurs</span>
                      <span className="text-2xl font-bold text-blue-600">{dashboardData?.recent_activity?.new_users_7d}</span>
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-green-800">Nouveaux posts</span>
                      <span className="text-2xl font-bold text-green-600">{dashboardData?.recent_activity?.new_posts_7d}</span>
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-red-800">Nouveaux signalements</span>
                      <span className="text-2xl font-bold text-red-600">{dashboardData?.recent_activity?.new_reports_7d}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Gestion des utilisateurs</h1>
                <div className="flex space-x-4">
                  <select 
                    value={filters.userRole} 
                    onChange={(e) => setFilters({...filters, userRole: e.target.value})}
                    className="border border-gray-300 rounded-xl px-4 py-2 bg-white focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="">Tous les rôles</option>
                    <option value="USER">Utilisateur</option>
                    <option value="MODERATOR">Modérateur</option>
                    <option value="ADMIN">Administrateur</option>
                  </select>
                  <select 
                    value={filters.userStatus} 
                    onChange={(e) => setFilters({...filters, userStatus: e.target.value})}
                    className="border border-gray-300 rounded-xl px-4 py-2 bg-white focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="">Tous les statuts</option>
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                    <option value="banned">Banni</option>
                  </select>
                  <input 
                    type="text" 
                    placeholder="Rechercher un utilisateur..."
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                    className="border border-gray-300 rounded-xl px-4 py-2 w-64 focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inscription</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {users.users?.map(user => (
                        <tr key={user.id_user} className={`hover:bg-gray-50 transition-colors duration-200 ${user.is_banned ? 'bg-red-50' : ''}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center text-gray-600 font-semibold mr-4">
                                {user.prenom?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center">
                                  <span className="text-sm font-medium text-gray-900">@{user.username}</span>
                                  {user.certified && <span className="ml-1 text-blue-500">✓</span>}
                                </div>
                                <div className="text-sm text-gray-500">{user.nom} {user.prenom}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{user.mail}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeClass(user.role)}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              user.is_banned ? 'bg-red-100 text-red-800' : 
                              user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {user.is_banned ? '🚫 Banni' : user.is_active ? '✅ Actif' : '❌ Inactif'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{formatDate(user.created_at)}</td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              {!user.is_banned && (
                                <button 
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowBanModal(true);
                                  }}
                                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200"
                                >
                                  🚫 Bannir
                                </button>
                              )}
                              <button 
                                onClick={() => handleDeleteUser(user.id_user)}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200"
                              >
                                🗑️ Supprimer
                              </button>
                              {dashboardData?.user_role === 'ADMIN' && (
                                <button 
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowRoleModal(true);
                                  }}
                                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200"
                                >
                                  👑 Rôle
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {users.pagination && (
                  <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t border-gray-200">
                    <button 
                      disabled={!users.pagination.has_prev}
                      onClick={() => setCurrentPage(currentPage - 1)}
                      className="bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium transition-colors duration-200"
                    >
                      Précédent
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {users.pagination.current_page} sur {users.pagination.total_pages}
                    </span>
                    <button 
                      disabled={!users.pagination.has_next}
                      onClick={() => setCurrentPage(currentPage + 1)}
                      className="bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium transition-colors duration-200"
                    >
                      Suivant
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'posts' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Gestion des posts</h1>
                <div className="flex space-x-4">
                  <select 
                    value={filters.postStatus} 
                    onChange={(e) => setFilters({...filters, postStatus: e.target.value})}
                    className="border border-gray-300 rounded-xl px-4 py-2 bg-white focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="">Tous les statuts</option>
                    <option value="active">Actifs</option>
                    <option value="inactive">Supprimés</option>
                  </select>
                  <input 
                    type="text" 
                    placeholder="Rechercher dans le contenu..."
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                    className="border border-gray-300 rounded-xl px-4 py-2 w-64 focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid gap-6">
                {posts.posts?.map(post => (
                  <div key={post.id_post} className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 ${!post.active ? 'opacity-60 border-red-200' : ''}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center text-gray-600 font-semibold mr-3">
                          {post.user.prenom?.[0]?.toUpperCase() || post.user.username?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-900">@{post.user.username}</span>
                            {post.user.certified && <span className="ml-1 text-blue-500">✓</span>}
                          </div>
                          <span className="text-xs text-gray-500">{formatDate(post.created_at)}</span>
                        </div>
                      </div>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        post.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {post.active ? '✅ Actif' : '❌ Supprimé'}
                      </span>
                    </div>
                    
                    <div className="text-gray-900 mb-4 bg-gray-50 p-4 rounded-xl">
                      {post.content}
                    </div>
                    
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <div className="flex space-x-6">
                        <span className="flex items-center space-x-1">
                          <span>👍</span>
                          <span>{post._count?.likes || 0}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <span>💬</span>
                          <span>{post._count?.children || 0}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {posts.pagination && (
                <div className="flex justify-between items-center">
                  <button 
                    disabled={!posts.pagination.has_prev}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    className="bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium transition-colors duration-200"
                  >
                    Précédent
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {posts.pagination.current_page} sur {posts.pagination.total_pages}
                  </span>
                  <button 
                    disabled={!posts.pagination.has_next}
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className="bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium transition-colors duration-200"
                  >
                    Suivant
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6">
              <h1 className="text-3xl font-bold text-gray-900">Posts signalés en attente</h1>
              
              <div className="space-y-4">
                {reportedPosts.reported_posts?.length > 0 ? (
                  reportedPosts.reported_posts.map(item => (
                    <div key={item.post.id_post} className="bg-white p-6 rounded-2xl shadow-sm border border-red-200">
                      <div className="flex justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-3">
                            <span className="font-medium text-gray-900">@{item.post.user.username}</span>
                            {item.post.user.certified && <span className="ml-1 text-blue-500">✓</span>}
                            <span className="ml-2 text-sm text-gray-500">{formatDate(item.post.created_at)}</span>
                          </div>
                          
                          <div className="text-gray-900 mb-4 bg-gray-50 p-4 rounded-xl">{item.post.content}</div>
                          
                          <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                            <h4 className="font-medium text-red-900 mb-2">Signalements ({item.total_reports})</h4>
                            <div className="space-y-2">
                              {item.reports.map(report => (
                                <div key={report.id_report} className="text-sm">
                                  <span className="font-medium">@{report.reporter.username}</span>: {report.reason}
                                  <br />
                                  <span className="text-gray-500">{formatDate(report.reported_at)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center">
                    <div className="text-6xl mb-4">🎉</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun signalement en attente</h3>
                    <p className="text-gray-500">Votre communauté se comporte bien !</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de bannissement */}
      {showBanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-96 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Bannir l'utilisateur @{selectedUser?.username}
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              handleBanUser(
                selectedUser.id_user,
                formData.get('reason'),
                formData.get('duration')
              );
            }}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Raison du bannissement:
                </label>
                <textarea 
                  name="reason" 
                  required 
                  placeholder="Expliquez la raison du bannissement..."
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 h-24 focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durée:
                </label>
                <select name="duration" required className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-black focus:border-transparent">
                  <option value="24">24 heures</option>
                  <option value="72">3 jours</option>
                  <option value="168">7 jours</option>
                  <option value="720">30 jours</option>
                  <option value="8760">1 an</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={() => setShowBanModal(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors duration-200"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors duration-200"
                >
                  Bannir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de changement de rôle */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-96 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Changer le rôle de @{selectedUser?.username}
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              handleChangeRole(selectedUser.id_user, formData.get('role'));
            }}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nouveau rôle:
                </label>
                <select 
                  name="role" 
                  required 
                  defaultValue={selectedUser?.role}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="USER">Utilisateur</option>
                  <option value="MODERATOR">Modérateur</option>
                  <option value="ADMIN">Administrateur</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors duration-200"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200"
                >
                  Modifier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;