// src/context/LoaderContext.jsx - CORRIGÉ avec message personnalisé
import React, { createContext, useContext, useState } from 'react'

const LoaderContext = createContext()

export const useLoader = () => {
  const context = useContext(LoaderContext)
  if (!context) {
    throw new Error('useLoader doit être utilisé dans un LoaderProvider')
  }
  return context
}

export const LoaderProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('Chargement...')

  const showLoader = (message = 'Chargement...') => {
    setLoadingMessage(message)
    setIsLoading(true)
  }

  const hideLoader = () => {
    setIsLoading(false)
  }

  // ✅ CORRECTION : Fonction avec message personnalisé
  const navigateWithLoader = async (navigationFunction, minLoadTime = 500, customMessage = 'Chargement...') => {
    showLoader(customMessage) // ✅ MODIFIÉ : Utilise le message personnalisé
    
    const startTime = Date.now()
    
    try {
      // Exécuter la navigation/action
      await navigationFunction()
      
      // Calculer le temps écoulé
      const elapsedTime = Date.now() - startTime
      
      // Si l'opération a été trop rapide, attendre pour atteindre le temps minimum
      if (elapsedTime < minLoadTime) {
        await new Promise(resolve => setTimeout(resolve, minLoadTime - elapsedTime))
      }
    } catch (error) {
      console.error('Erreur lors de la navigation:', error)
    } finally {
      hideLoader()
    }
  }

  const value = {
    isLoading,
    loadingMessage,
    showLoader,
    hideLoader,
    navigateWithLoader
  }

  return (
    <LoaderContext.Provider value={value}>
      {children}
    </LoaderContext.Provider>
  )
}