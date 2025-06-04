// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'
import AuthService from '../services/authService'

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

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté au chargement
    const initAuth = async () => {
      try {
        if (AuthService.isAuthenticated()) {
          const storedUser = AuthService.getStoredUser()
          if (storedUser) {
            setUser(storedUser)
            setIsAuthenticated(true)
            console.log('👤 User restored from storage:', storedUser.username)
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
  }, [])

  const login = async (credentials) => {
    try {
      const response = await AuthService.login(credentials)
      setUser(response.user)
      setIsAuthenticated(true)
      console.log('✅ User logged in:', response.user.username)
      return response
    } catch (error) {
      console.error('❌ Login failed:', error)
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
    }
  }

  const updateUser = (updatedUser) => {
    setUser(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))
  }

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}