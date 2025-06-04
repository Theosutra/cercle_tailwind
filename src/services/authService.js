// src/services/authService.js
import ApiService from './api';

class AuthService {
  /**
   * Inscription d'un nouvel utilisateur
   */
  async register(userData) {
    try {
      const response = await ApiService.post('/api/v1/auth/register', userData);
      
      // Sauvegarder les tokens dans le localStorage
      if (response.accessToken) {
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      
      return response;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Connexion d'un utilisateur
   */
  async login(credentials) {
    try {
      const response = await ApiService.post('/api/v1/auth/login', credentials);
      
      // Sauvegarder les tokens
      if (response.accessToken) {
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      
      return response;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Déconnexion
   */
  async logout() {
    try {
      await ApiService.post('/api/v1/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Nettoyer le localStorage même en cas d'erreur
      this.clearStorage();
    }
  }

  /**
   * Rafraîchir le token d'accès
   */
  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await ApiService.post('/api/v1/auth/refresh', {
        refreshToken
      });

      localStorage.setItem('accessToken', response.accessToken);
      return response.accessToken;
    } catch (error) {
      this.clearStorage();
      throw error;
    }
  }

  /**
   * Obtenir les informations de l'utilisateur connecté
   */
  async getCurrentUser() {
    try {
      const response = await ApiService.get('/api/v1/auth/me');
      localStorage.setItem('user', JSON.stringify(response));
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Vérifier si l'utilisateur est connecté
   */
  isAuthenticated() {
    const token = localStorage.getItem('accessToken');
    return !!token;
  }

  /**
   * Obtenir l'utilisateur depuis le localStorage
   */
  getStoredUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Nettoyer le localStorage
   */
  clearStorage() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  /**
   * Gérer les erreurs d'authentification
   */
  handleAuthError(error) {
    const message = error.message || 'Une erreur est survenue';
    
    // Erreurs spécifiques côté serveur
    if (message.includes('already exists')) {
      return new Error('Cette adresse email ou ce nom d\'utilisateur est déjà utilisé');
    }
    
    if (message.includes('Invalid credentials')) {
      return new Error('Email ou mot de passe incorrect');
    }
    
    if (message.includes('validation')) {
      return new Error('Veuillez vérifier les informations saisies');
    }
    
    return new Error(message);
  }
}

export default new AuthService();