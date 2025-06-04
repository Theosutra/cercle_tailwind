// src/hooks/useAuth.js
import { useState, useEffect } from 'react'
import AuthService from '../services/authService'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté au chargement
    const checkAuth = async () => {
      try {
        if (AuthService.isAuthenticated()) {
          const storedUser = AuthService.getStoredUser()
          if (storedUser) {
            setUser(storedUser)
            setIsAuthenticated(true)
          } else {
            // Récupérer les infos depuis l'API
            const currentUser = await AuthService.getCurrentUser()
            setUser(currentUser)
            setIsAuthenticated(true)
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        AuthService.clearStorage()
        setUser(null)
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (credentials) => {
    try {
      const response = await AuthService.login(credentials)
      setUser(response.user)
      setIsAuthenticated(true)
      return response
    } catch (error) {
      throw error
    }
  }

  const register = async (userData) => {
    try {
      const response = await AuthService.register(userData)
      setUser(response.user)
      setIsAuthenticated(true)
      return response
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      await AuthService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setIsAuthenticated(false)
    }
  }

  return {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout
  }
}