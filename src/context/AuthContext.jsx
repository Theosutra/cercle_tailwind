// src/context/AuthContext.jsx - Version améliorée avec gestion proactive des tokens
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import AuthService from '../services/authService'
import ApiService from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // ✅ NOUVEAU: Fonction pour vérifier la validité du token
  const checkTokenValidity = useCallback(async () => {
    const token = localStorage.getItem('accessToken')
    const refreshToken = localStorage.getItem('refreshToken')
    
    if (!token || !refreshToken) {
      return false
    }

    try {
      // Vérifier si le token est proche de l'expiration
      await ApiService.refreshTokenIfNeeded()
      
      // Tester le token avec un appel API
      const response = await ApiService.get('/api/v1/auth/me')
      return !!response
    } catch (error) {
      console.error('Token validation failed:', error)
      return false
    }
  }, [])

  // ✅ NOUVEAU: Intervalles pour refresh automatique
  useEffect(() => {
    let tokenCheckInterval

    if (isAuthenticated) {
      // Vérifier le token toutes les 5 minutes
      tokenCheckInterval = setInterval(async () => {
        console.log('🔍 Checking token validity...')
        
        const isValid = await checkTokenValidity()
        if (!isValid) {
          console.log('❌ Token invalid, logging out...')
          await logout()
        }
      }, 5 * 60 * 1000) // 5 minutes
    }

    return () => {
      if (tokenCheckInterval) {
        clearInterval(tokenCheckInterval)
      }
    }
  }, [isAuthenticated, checkTokenValidity])

  // ✅ AMÉLIORÉ: Initialisation avec vérification du token
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (AuthService.isAuthenticated()) {
          const storedUser = AuthService.getStoredUser()
          
          if (storedUser) {
            // Vérifier que le token est encore valide
            const isValid = await checkTokenValidity()
            
            if (isValid) {
              setUser(storedUser)
              setIsAuthenticated(true)
              console.log('👤 User restored from storage:', storedUser.username)
            } else {
              console.log('🔑 Stored token invalid, clearing storage')
              AuthService.clearStorage()
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error)
        AuthService.clearStorage()
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [checkTokenValidity])

  // ✅ AMÉLIORÉ: Login avec gestion des erreurs
  const login = async (credentials) => {
    try {
      const response = await AuthService.login(credentials)
      setUser(response.user)
      setIsAuthenticated(true)
      console.log('✅ User logged in:', response.user.username)
      return response
    } catch (error) {
      console.error('❌ Login failed:', error)
      // Si l'erreur est liée aux tokens, nettoyer le storage
      if (error.message.includes('token') || error.message.includes('authentication')) {
        AuthService.clearStorage()
      }
      throw error
    }
  }

  const register = async (userData) => {
    try {
      const response = await AuthService.register(userData)
      setUser(response.user)
      setIsAuthenticated(true)
      console.log('✅ User registered:', response.user.username)
      return response
    } catch (error) {
      console.error('❌ Registration failed:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await AuthService.logout()
      console.log('👋 User logged out')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setIsAuthenticated(false)
      // Redirection sera gérée par le composant
    }
  }

  // ✅ NOUVEAU: Fonction pour rafraîchir les données utilisateur
  const refreshUser = async () => {
    if (!isAuthenticated) return

    try {
      const updatedUser = await ApiService.get('/api/v1/auth/me')
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
      console.log('🔄 User data refreshed')
    } catch (error) {
      console.error('Failed to refresh user data:', error)
      // Si l'erreur est d'authentification, déconnecter
      if (error.message.includes('401') || error.message.includes('authentication')) {
        await logout()
      }
    }
  }

  const updateUser = (updatedUser) => {
    setUser(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))
  }

  // ✅ NOUVEAU: Fonction utilitaire pour vérifier l'expiration du token
  const getTokenExpiryInfo = () => {
    const token = localStorage.getItem('accessToken')
    if (!token) return null

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const expiryTime = payload.exp * 1000
      const currentTime = Date.now()
      const timeUntilExpiry = expiryTime - currentTime

      return {
        expiresAt: new Date(expiryTime),
        timeUntilExpiry,
        isExpired: timeUntilExpiry <= 0,
        isNearExpiry: timeUntilExpiry < 2 * 60 * 1000 // < 2 minutes
      }
    } catch (error) {
      return null
    }
  }

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    refreshUser, // ✅ NOUVEAU
    checkTokenValidity, // ✅ NOUVEAU
    getTokenExpiryInfo // ✅ NOUVEAU
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}