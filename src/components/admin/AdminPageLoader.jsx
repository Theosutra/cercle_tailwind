// src/components/admin/AdminPageLoader.jsx - Loader spécifique pour l'admin
import React from 'react'
import { useLoader } from '../../context/LoaderContext'

const AdminPageLoader = () => {
  const { isLoading, loadingMessage } = useLoader()

  if (!isLoading) return null

  return (
    <>
      {/* Overlay pour la zone admin (exclut la sidebar de 320px) */}
      <div className="fixed left-80 right-0 top-0 bottom-0 bg-white z-[9999] flex items-center justify-center">
        
        {/* Contenu du loader */}
        <div className="relative flex flex-col items-center justify-center space-y-6">
          
          {/* Animation de la roue principale */}
          <div className="relative">
            {/* Cercle extérieur fixe */}
            <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
            
            {/* Cercle animé */}
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
            
            {/* Point central */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-black rounded-full animate-pulse"></div>
          </div>

          {/* Message de chargement */}
          <div className="text-center">
            <p className="text-gray-700 font-medium text-lg animate-pulse">
              {loadingMessage}
            </p>
          </div>

          {/* Logo CERCLE pendant le chargement admin */}
          <div className="flex items-center space-x-3 opacity-60">
            <div className="w-6 h-6 border-2 border-gray-400 rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
            </div>
            <span className="text-xl font-bold text-gray-400 tracking-wide">
              CERCLE
            </span>
            <span className="text-sm bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
              ADMIN
            </span>
          </div>
        </div>
      </div>

      {/* Overlay responsive pour mobile (plein écran) */}
      <div className="fixed inset-0 bg-white z-[9998] flex items-center justify-center lg:hidden">
        
        {/* Contenu du loader pour mobile */}
        <div className="relative flex flex-col items-center justify-center space-y-6">
          
          {/* Animation de la roue principale */}
          <div className="relative">
            {/* Cercle extérieur fixe */}
            <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
            
            {/* Cercle animé */}
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
            
            {/* Point central */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-black rounded-full animate-pulse"></div>
          </div>

          {/* Message de chargement */}
          <div className="text-center">
            <p className="text-gray-700 font-medium text-lg animate-pulse">
              {loadingMessage}
            </p>
          </div>

          {/* Logo CERCLE pour mobile */}
          <div className="flex items-center space-x-3 opacity-60">
            <div className="w-6 h-6 border-2 border-gray-400 rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
            </div>
            <span className="text-xl font-bold text-gray-400 tracking-wide">
              CERCLE
            </span>
            <span className="text-sm bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
              ADMIN
            </span>
          </div>
        </div>
      </div>
    </>
  )
}

export default AdminPageLoader