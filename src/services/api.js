// src/services/api.js - Version améliorée avec refresh automatique des tokens
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.isRefreshing = false;
    this.failedQueue = [];
  }

  /**
   * Traiter la file d'attente des requêtes qui ont échoué pendant le refresh
   */
  processQueue(error, token = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    
    this.failedQueue = [];
  }

  /**
   * Rafraîchir le token automatiquement
   */
  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      console.log('🔄 Refreshing token...');
      
      const response = await fetch(`${this.baseURL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      
      // Sauvegarder le nouveau token
      localStorage.setItem('accessToken', data.accessToken);
      
      console.log('✅ Token refreshed successfully');
      return data.accessToken;
      
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      
      // Nettoyer le localStorage et rediriger vers login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      // Rediriger vers la page de connexion
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      
      throw error;
    }
  }

  /**
   * Requête principale avec gestion automatique du refresh
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Ajouter le token d'authentification si disponible
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      let response = await fetch(url, config);
      
      // ✅ GESTION AUTOMATIQUE DU REFRESH TOKEN
      if (response.status === 401) {
        console.log('🔑 Token expired, attempting refresh...');
        
        // Si on est déjà en train de rafraîchir, attendre
        if (this.isRefreshing) {
          return new Promise((resolve, reject) => {
            this.failedQueue.push({ resolve, reject });
          }).then(token => {
            config.headers.Authorization = `Bearer ${token}`;
            return fetch(url, config);
          }).then(response => {
            if (!response.ok) {
              throw new Error(`HTTP Error: ${response.status}`);
            }
            return response.json();
          });
        }

        this.isRefreshing = true;

        try {
          const newToken = await this.refreshToken();
          
          // Mettre à jour le header avec le nouveau token
          config.headers.Authorization = `Bearer ${newToken}`;
          
          // Refaire la requête originale
          response = await fetch(url, config);
          
          // Traiter la file d'attente avec le nouveau token
          this.processQueue(null, newToken);
          
        } catch (refreshError) {
          this.processQueue(refreshError, null);
          throw refreshError;
        } finally {
          this.isRefreshing = false;
        }
      }
      
      // Gérer les autres erreurs HTTP
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP Error: ${response.status}`);
      }

      // Retourner les données JSON
      return await response.json();
      
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Méthodes HTTP raccourcies
  async get(endpoint, options = {}) {
    return this.request(endpoint, { method: 'GET', ...options });
  }

  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    });
  }

  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options,
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { method: 'DELETE', ...options });
  }

  /**
   * Méthode pour vérifier si un token est proche de l'expiration
   */
  isTokenNearExpiry() {
    const token = localStorage.getItem('accessToken');
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiryTime = payload.exp * 1000; // Convertir en millisecondes
      const currentTime = Date.now();
      const timeUntilExpiry = expiryTime - currentTime;
      
      // Retourner true si le token expire dans moins de 2 minutes
      return timeUntilExpiry < 2 * 60 * 1000;
    } catch (error) {
      return false;
    }
  }

  /**
   * Refresh préventif du token
   */
  async refreshTokenIfNeeded() {
    if (this.isTokenNearExpiry() && !this.isRefreshing) {
      try {
        await this.refreshToken();
      } catch (error) {
        console.warn('Preemptive token refresh failed:', error);
      }
    }
  }
}

export default new ApiService();