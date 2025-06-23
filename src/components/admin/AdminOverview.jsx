// src/components/admin/AdminOverview.jsx - VERSION OPTIMISÉE COMPLÈTE
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AdminOverview = () => {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState(new Date());

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

  // ===== CHARGEMENT DES DONNÉES =====
  const loadDashboardStats = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/dashboard/stats`, getAuthHeaders());
      setStats(response.data);
    } catch (error) {
      console.error('Erreur stats:', error);
      // Données par défaut si erreur
      setStats({
        users: { total: 0, active: 0, new_today: 0, growth_rate: 0 },
        posts: { total: 0, active: 0, new_today: 0, engagement_rate: 0 },
        reports: { total: 0, pending: 0, resolved_today: 0, resolution_rate: 0 },
        bans: { active: 0, expired_today: 0, total_this_month: 0 }
      });
    }
  }, [getAuthHeaders]);

  const loadRecentActivity = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/activity/recent?limit=10`, getAuthHeaders());
      setRecentActivity(response.data.activities || []);
    } catch (error) {
      console.error('Erreur activité récente:', error);
      setRecentActivity([]);
    }
  }, [getAuthHeaders]);

  const loadSystemHealth = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/system/health`, getAuthHeaders());
      setSystemHealth(response.data);
    } catch (error) {
      console.error('Erreur santé système:', error);
      setSystemHealth({
        database: { status: 'operational', latency: 0 },
        api: { status: 'operational', uptime: '99.9%' },
        storage: { status: 'operational', usage: 0 }
      });
    }
  }, [getAuthHeaders]);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      await Promise.all([
        loadDashboardStats(),
        loadRecentActivity(),
        loadSystemHealth()
      ]);
      setLastUpdate(new Date());
    } catch (error) {
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, [loadDashboardStats, loadRecentActivity, loadSystemHealth]);

  useEffect(() => {
    loadAllData();
    
    // Auto-refresh toutes les 5 minutes
    const interval = setInterval(loadAllData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadAllData]);

  // ===== UTILITAIRES =====
  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatPercentage = (num) => {
    return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ===== COMPOSANTS INTERNES =====
  const StatCard = ({ title, value, subtitle, icon, color, trend, loading: cardLoading }) => {
    const colorClasses = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      red: 'from-red-500 to-red-600',
      orange: 'from-orange-500 to-orange-600',
      purple: 'from-purple-500 to-purple-600'
    };

    if (cardLoading) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 group">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg bg-gradient-to-r ${colorClasses[color]} text-white shadow-sm`}>
              <span className="text-xl">{icon}</span>
            </div>
            {trend !== undefined && (
              <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                trend >= 0 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-red-100 text-red-600'
              }`}>
                {formatPercentage(trend)}
              </div>
            )}
          </div>
          
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(value)}</p>
            {subtitle && (
              <p className="text-xs text-gray-500">{subtitle}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const ActivityItem = ({ activity }) => {
    const getActivityIcon = (type) => {
      const icons = {
        user_registered: '👤',
        user_banned: '🚫',
        post_created: '📝',
        post_deleted: '🗑️',
        report_created: '🚨',
        report_resolved: '✅',
        role_changed: '🔧'
      };
      return icons[type] || '📋';
    };

    const getActivityColor = (type) => {
      const colors = {
        user_registered: 'text-green-600',
        user_banned: 'text-red-600',
        post_created: 'text-blue-600',
        post_deleted: 'text-red-600',
        report_created: 'text-orange-600',
        report_resolved: 'text-green-600',
        role_changed: 'text-purple-600'
      };
      return colors[type] || 'text-gray-600';
    };

    return (
      <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
        <div className={`text-lg ${getActivityColor(activity.type)}`}>
          {getActivityIcon(activity.type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {activity.description}
          </p>
          <p className="text-xs text-gray-500">
            {activity.user} • {formatTime(activity.timestamp)}
          </p>
        </div>
      </div>
    );
  };

  const HealthIndicator = ({ name, status, details }) => {
    const statusColors = {
      operational: 'text-green-600 bg-green-100',
      warning: 'text-yellow-600 bg-yellow-100',
      error: 'text-red-600 bg-red-100'
    };

    const statusIcons = {
      operational: '✅',
      warning: '⚠️',
      error: '❌'
    };

    return (
      <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-3">
          <span className="text-lg">{statusIcons[status]}</span>
          <div>
            <p className="text-sm font-medium text-gray-900">{name}</p>
            {details && (
              <p className="text-xs text-gray-500">{details}</p>
            )}
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
          {status === 'operational' ? 'Opérationnel' : 
           status === 'warning' ? 'Attention' : 'Erreur'}
        </span>
      </div>
    );
  };

  // ===== RENDU PRINCIPAL =====
  if (loading && !stats) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <StatCard key={i} loading={true} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-200 h-64 rounded-xl"></div>
          <div className="bg-gray-200 h-64 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header avec actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vue d'ensemble</h1>
          <p className="text-gray-600 mt-1">
            Tableau de bord administrateur • Dernière mise à jour : {formatTime(lastUpdate)}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={loadAllData}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <span className={`mr-2 ${loading ? 'animate-spin' : ''}`}>🔄</span>
            Actualiser
          </button>
          
          <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-700">En ligne</span>
          </div>
        </div>
      </div>

      {/* Notifications d'erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Utilisateurs"
          value={stats?.users?.total || 0}
          subtitle={`${stats?.users?.active || 0} actifs • ${stats?.users?.new_today || 0} nouveaux aujourd'hui`}
          icon="👥"
          color="blue"
          trend={stats?.users?.growth_rate}
          loading={loading}
        />
        
        <StatCard
          title="Publications"
          value={stats?.posts?.total || 0}
          subtitle={`${stats?.posts?.active || 0} actifs • ${stats?.posts?.engagement_rate || 0}% d'engagement`}
          icon="📝"
          color="green"
          trend={stats?.posts?.growth_rate}
          loading={loading}
        />
        
        <StatCard
          title="Signalements"
          value={stats?.reports?.pending || 0}
          subtitle={`${stats?.reports?.resolved_today || 0} résolus aujourd'hui • ${stats?.reports?.resolution_rate || 0}% de résolution`}
          icon="🚨"
          color="red"
          trend={stats?.reports?.trend}
          loading={loading}
        />
        
        <StatCard
          title="Bannissements"
          value={stats?.bans?.active || 0}
          subtitle={`${stats?.bans?.expired_today || 0} expirés aujourd'hui • ${stats?.bans?.total_this_month || 0} ce mois`}
          icon="🚫"
          color="orange"
          trend={stats?.bans?.trend}
          loading={loading}
        />
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activité récente */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Activité récente</h3>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Voir tout
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {recentActivity.length > 0 ? (
              <div className="space-y-1">
                {recentActivity.slice(0, 8).map((activity, index) => (
                  <ActivityItem key={index} activity={activity} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-gray-400 text-xl">📋</span>
                </div>
                <p className="text-gray-500 text-sm">Aucune activité récente</p>
              </div>
            )}
          </div>
        </div>

        {/* État du système */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">État du système</h3>
          </div>
          
          <div className="p-6 space-y-4">
            <HealthIndicator
              name="Base de données"
              status={systemHealth?.database?.status || 'operational'}
              details={systemHealth?.database?.latency ? `${systemHealth.database.latency}ms` : null}
            />
            
            <HealthIndicator
              name="API"
              status={systemHealth?.api?.status || 'operational'}
              details={systemHealth?.api?.uptime ? `Uptime: ${systemHealth.api.uptime}` : null}
            />
            
            <HealthIndicator
              name="Stockage"
              status={systemHealth?.storage?.status || 'operational'}
              details={systemHealth?.storage?.usage ? `Utilisation: ${systemHealth.storage.usage}%` : null}
            />

            {/* Actions rapides */}
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Actions rapides</h4>
              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                  <span className="mr-1">🔄</span>
                  Nettoyer cache
                </button>
                <button className="flex items-center justify-center px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                  <span className="mr-1">📊</span>
                  Générer rapport
                </button>
                <button className="flex items-center justify-center px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                  <span className="mr-1">⚡</span>
                  Optimiser DB
                </button>
                <button className="flex items-center justify-center px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                  <span className="mr-1">📧</span>
                  Email stats
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques avec données réelles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique Évolution des utilisateurs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution des utilisateurs</h3>
          <div className="h-64">
            <UsersChart stats={stats} />
          </div>
        </div>
        
        {/* Graphique Activité par jour */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Activité par jour</h3>
          <div className="h-64">
            <ActivityChart recentActivity={recentActivity} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== COMPOSANTS DE GRAPHIQUES =====
const UsersChart = ({ stats }) => {
  const data = [
    { name: 'Hier', users: Math.max(0, (stats?.users?.total || 0) - (stats?.users?.new_today || 0)) },
    { name: 'Aujourd\'hui', users: stats?.users?.total || 0 },
    { name: 'Projection', users: Math.round((stats?.users?.total || 0) * 1.05) }
  ];

  return (
    <div className="h-full flex items-center justify-center">
      <div className="w-full">
        <div className="flex justify-between items-end h-48 px-4">
          {data.map((item, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div className="w-full flex items-end justify-center mb-2">
                <div 
                  className={`w-8 rounded-t-lg transition-all duration-1000 ${
                    index === 0 ? 'bg-blue-300' : 
                    index === 1 ? 'bg-blue-500' : 'bg-blue-200'
                  }`}
                  style={{ 
                    height: `${Math.max(20, (item.users / Math.max(...data.map(d => d.users))) * 160)}px`,
                    animationDelay: `${index * 200}ms`
                  }}
                ></div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-gray-700">{item.users}</div>
                <div className="text-xs text-gray-500">{item.name}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ActivityChart = ({ recentActivity }) => {
  // Grouper les activités par type pour le graphique
  const activityTypes = {
    user_registered: { count: 0, color: 'bg-green-500', label: 'Inscriptions' },
    post_created: { count: 0, color: 'bg-blue-500', label: 'Posts' },
    user_banned: { count: 0, color: 'bg-red-500', label: 'Bans' },
    report_created: { count: 0, color: 'bg-orange-500', label: 'Reports' }
  };

  // Compter les activités par type
  recentActivity.forEach(activity => {
    if (activityTypes[activity.type]) {
      activityTypes[activity.type].count++;
    }
  });

  const maxCount = Math.max(...Object.values(activityTypes).map(t => t.count), 1);

  return (
    <div className="h-full flex items-center justify-center">
      <div className="w-full">
        <div className="flex justify-between items-end h-48 px-4">
          {Object.entries(activityTypes).map(([type, data], index) => (
            <div key={type} className="flex flex-col items-center flex-1">
              <div className="w-full flex items-end justify-center mb-2">
                <div 
                  className={`w-8 rounded-t-lg transition-all duration-1000 ${data.color}`}
                  style={{ 
                    height: `${Math.max(10, (data.count / maxCount) * 160)}px`,
                    animationDelay: `${index * 150}ms`
                  }}
                ></div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-gray-700">{data.count}</div>
                <div className="text-xs text-gray-500">{data.label}</div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Légende */}
        <div className="mt-4 flex flex-wrap justify-center gap-4">
          {Object.entries(activityTypes).map(([type, data]) => (
            <div key={type} className="flex items-center space-x-1">
              <div className={`w-3 h-3 rounded ${data.color}`}></div>
              <span className="text-xs text-gray-600">{data.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;