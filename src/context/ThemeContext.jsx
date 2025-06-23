import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // ✅ CORRECTION: Initialiser en mode LIGHT et éviter le dark par défaut
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // ✅ CORRECTION: Charger depuis localStorage APRÈS le premier render
  useEffect(() => {
    try {
      const saved = localStorage.getItem('darkMode');
      const savedValue = saved ? JSON.parse(saved) : false;
      
      console.log('💾 Thème chargé depuis localStorage:', savedValue ? 'dark' : 'light');
      
      setIsDarkMode(savedValue);
      setIsInitialized(true);
      
      // Appliquer immédiatement le thème correct
      if (savedValue) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (error) {
      console.error('Erreur lecture localStorage darkMode:', error);
      setIsDarkMode(false);
      setIsInitialized(true);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // ✅ CORRECTION: Sauvegarder et appliquer SEULEMENT après l'initialisation
  useEffect(() => {
    if (!isInitialized) return;
    
    try {
      console.log('🎨 Changement de thème:', isDarkMode ? 'dark' : 'light');
      
      localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
      
      // Appliquer la classe dark au document
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (error) {
      console.error('Erreur sauvegarde localStorage darkMode:', error);
    }
  }, [isDarkMode, isInitialized]);

  // Fonction pour basculer le thème
  const toggleTheme = () => {
    const newValue = !isDarkMode;
    console.log('🔄 Toggle thème:', isDarkMode ? 'dark→light' : 'light→dark');
    console.log('🔄 Nouvelle valeur:', newValue);
    setIsDarkMode(newValue);
  };

  // Fonction pour définir un thème spécifique
  const setTheme = (dark) => {
    console.log('🎯 Définir thème:', dark ? 'dark' : 'light');
    setIsDarkMode(dark);
  };

  const value = {
    isDarkMode,
    toggleTheme,
    setTheme,
    theme: isDarkMode ? 'dark' : 'light',
    isInitialized
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};