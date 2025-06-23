// src/components/Admin/AdminOverview.jsx - Page vue d'ensemble corrigée
import React from 'react';

const AdminOverview = ({ dashboardData, loading }) => {
  if (loading || !dashboardData) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-32 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      title: 'Utilisateurs',
      value: dashboardData?.global_stats?.active_users || 0,
      total: dashboardData?.global_stats?.total_users || 0,
      suffix: 'actifs',
      icon: '👥',
      color: 'blue',
      trend: dashboardData?.recent_activity?.new_users_7d || 0
    },
    {
      title: 'Posts',
      value: dashboardData?.global_stats?.active_posts || 0,
      total: dashboardData?.global_stats?.total_posts || 0,
      suffix: 'actifs',
      icon: '📝',
      color: 'green',
      trend: dashboardData?.recent_activity?.new_posts_7d || 0
    },
    {
      title: 'Signalements',
      value: dashboardData?.global_stats?.pending_reports || 0,
      total: dashboardData?.global_stats?.total_reports || 0,
      suffix: 'en attente',
      icon: '🚨',
      color: 'red',
      trend: dashboardData?.recent_activity?.new_reports_7d || 0,
      urgent: (dashboardData?.global_stats?.pending_reports || 0) > 0
    },
    {
      title: 'Bannissements',
      value: dashboardData?.global_stats?.active_bans || 0,
      total: dashboardData?.global_stats?.total_bans || 0,
      suffix: 'actifs',
      icon: '🚫',
      color: 'orange',
      trend: dashboardData?.recent_activity?.new_bans_7d || 0
    }
  ];

  const getColorClasses = (color, urgent = false) => {
    if (urgent) {
      return {
        bg: 'bg-red-100',
        hoverBg: 'group-hover:bg-red-200',
        text: 'text-red-600',
        hoverText: 'group-hover:text-red-700'
      };
    }

    const colors = {
      blue: {
        bg: 'bg-blue-100',
        hoverBg: 'group-hover:bg-blue-200',
        text: 'text-blue-600',
        hoverText: 'group-hover:text-blue-700'
      },
      green: {
        bg: 'bg-green-100',
        hoverBg: 'group-hover:bg-green-200',
        text: 'text-green-600',
        hoverText: 'group-hover:text-green-700'
      },
      red: {
        bg: 'bg-red-100',
        hoverBg: 'group-hover:bg-red-200',
        text: 'text-red-600',
        hoverText: 'group-hover:text-red-700'
      },
      orange: {
        bg: 'bg-orange-100',
        hoverBg: 'group-hover:bg-orange-200',
        text: 'text-orange-600',
        hoverText: 'group-hover:text-orange-700'
      }
    };
    return colors[color] || colors.blue;
  };

  const formatTrend = (trend) => {
    if (!trend || trend === 0) return null;
    return `+${trend} cette semaine`;
  };

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vue d'ensemble</h1>
          <p className="text-gray-600 mt-2">Tableau de bord administrateur</p>
        </div>
        <div className="text-sm text-gray-500">
          Dernière mise à jour : {new Date().toLocaleTimeString('fr-FR')}
        </div>
      </div>
      
      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => {
          const colorClasses = getColorClasses(stat.color, stat.urgent);
          
          return (
            <div key={index} className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 group ${stat.urgent ? 'ring-2 ring-red-200' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className={`text-3xl font-bold text-gray-900 ${colorClasses.hoverText} transition-colors duration-300`}>
                    {stat.value}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-xs text-gray-500">{stat.suffix}</p>
                    {stat.total && (
                      <p className="text-xs text-gray-400">sur {stat.total}</p>
                    )}
                  </div>
                  {stat.trend > 0 && (
                    <p className={`text-xs ${colorClasses.text} mt-1 font-medium`}>
                      {formatTrend(stat.trend)}
                    </p>
                  )}
                </div>
                <div className={`w-12 h-12 ${colorClasses.bg} rounded-2xl flex items-center justify-center ${colorClasses.hoverBg} transition-colors duration-300 ${stat.urgent ? 'animate-pulse' : ''}`}>
                  <span className="text-2xl">{stat.icon}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Activité récente */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Activité récente (7 derniers jours)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-800">Nouveaux utilisateurs</span>
              <span className="text-2xl font-bold text-blue-600">
                {dashboardData?.recent_activity?.new_users_7d || 0}
              </span>
            </div>
          </div>
          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-green-800">Nouveaux posts</span>
              <span className="text-2xl font-bold text-green-600">
                {dashboardData?.recent_activity?.new_posts_7d || 0}
              </span>
            </div>
          </div>
          <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-red-800">Nouveaux signalements</span>
              <span className="text-2xl font-bold text-red-600">
                {dashboardData?.recent_activity?.new_reports_7d || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Actions rapides</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <a href="/admin/users" className="p-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 group text-center block">
            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">👥</div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">Gérer utilisateurs</span>
          </a>
          <a href="/admin/posts" className="p-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50 transition-all duration-300 group text-center block">
            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">📝</div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-green-600">Modérer posts</span>
          </a>
          <a href="/admin/reports" className="p-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-red-500 hover:bg-red-50 transition-all duration-300 group text-center block">
            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">🚨</div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-red-600">Traiter signalements</span>
          </a>
          <button className="p-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-purple-500 hover:bg-purple-50 transition-all duration-300 group text-center">
            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">📊</div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-purple-600">Voir rapports</span>
          </button>
        </div>
      </div>

      {/* Système de santé */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">État du système</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-800">Base de données</span>
            </div>
            <span className="text-xs text-green-600 font-medium">Opérationnelle</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-800">API</span>
            </div>
            <span className="text-xs text-green-600 font-medium">Fonctionnelle</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-800">Authentification</span>
            </div>
            <span className="text-xs text-green-600 font-medium">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;