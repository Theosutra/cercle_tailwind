// src/components/admin/AdminDashboard.jsx - VERSION CORRIGÉE avec AdminPageLoader
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLoader } from '../../context/LoaderContext'; // ✅ AJOUT du loader
import axios from 'axios';

// Import des composants admin
import AdminSidebar from './AdminSidebar';
import AdminOverview from './AdminOverview';
import AdminUsers from './AdminUsers';
import AdminPosts from './AdminPosts';
import AdminReports from './AdminReports';
import AdminPageLoader from './AdminPageLoader'; // ✅ AJOUT du loader admin

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { showLoader, hideLoader } = useLoader(); // ✅ AJOUT
  
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = 'http://localhost:3000/api/v1';

  // Déterminer la page active basée sur l'URL
  const getActivePageFromPath = () => {
    const path = location.pathname;
    if (path === '/admin/dashboard') return 'overview';
    if (path === '/admin/users') return 'users';
    if (path === '/admin/posts') return 'posts';
    if (path === '/admin/reports') return 'reports';
    return 'overview';
  };

  const activePage = getActivePageFromPath();

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
      // ✅ AJOUT : Loader pour le chargement initial
      showLoader('Chargement du dashboard admin...');
      
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
      hideLoader(); // ✅ AJOUT : Cacher le loader
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Préparer les stats pour la sidebar
  const sidebarStats = {
    activeUsers: dashboardData?.global_stats?.active_users,
    activePosts: dashboardData?.global_stats?.active_posts,
    pendingReports: dashboardData?.global_stats?.pending_reports
  };

  // ✅ CORRECTION : Affichage de chargement simple (pas de loader complexe)
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

  // Rendu du contenu selon la page active
  const renderActiveContent = () => {
    switch (activePage) {
      case 'overview':
        return <AdminOverview dashboardData={dashboardData} loading={loading} />;
      case 'users':
        return <AdminUsers />;
      case 'posts':
        return <AdminPosts />;
      case 'reports':
        return <AdminReports />;
      default:
        return <AdminOverview dashboardData={dashboardData} loading={loading} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar fixe */}
      <AdminSidebar stats={sidebarStats} />
      
      {/* AdminPageLoader spécifique */}
      <AdminPageLoader />
      
      {/* Contenu principal */}
      <div className="flex-1 ml-80 overflow-auto">
        <div className="p-8">
          {renderActiveContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;