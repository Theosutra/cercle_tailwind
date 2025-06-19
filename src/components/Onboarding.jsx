// src/components/Onboarding.jsx - Version UX/UI optimisée
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import OnboardingStep1 from './onboarding/OnboardingStep1'
import OnboardingStep2 from './onboarding/OnboardingStep2'
import OnboardingStep3 from './onboarding/OnboardingStep3'

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [stepData, setStepData] = useState({})
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const handleNext = (data = {}) => {
    // Sauvegarder les données de l'étape
    setStepData(prev => ({ ...prev, [`step${currentStep}`]: data }))
    
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    } else {
      handleFinish()
    }
  }

  const handleSkipToEnd = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')
      
      await fetch('/api/v1/users/onboarding-complete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      navigate('/feed', { replace: true })
    } catch (error) {
      console.error('Erreur lors de la finalisation de l\'onboarding:', error)
      navigate('/feed', { replace: true })
    } finally {
      setLoading(false)
    }
  }

  const handleFinish = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')
      
      await fetch('/api/v1/users/onboarding-complete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      navigate('/feed', { 
        replace: true,
        state: { message: 'Profil configuré avec succès ! Bienvenue sur Cercle 🎉' }
      })
    } catch (error) {
      console.error('Erreur lors de la finalisation de l\'onboarding:', error)
      navigate('/feed', { replace: true })
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const progressPercentage = (currentStep / 3) * 100

  const steps = [
    { number: 1, title: "Profil", description: "Photo et bio" },
    { number: 2, title: "Amis", description: "Trouvez des contacts" },
    { number: 3, title: "Premier post", description: "Partagez du contenu" }
  ]

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec progression */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          {/* Logo et titre */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 border-2 border-gray-800 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Configuration du profil</h1>
                <p className="text-sm text-gray-500">Personnalisez votre expérience</p>
              </div>
            </div>
            
            <button
              onClick={handleSkipToEnd}
              disabled={loading}
              className="text-sm text-gray-500 hover:text-gray-700 font-medium px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Ignorer tout
            </button>
          </div>
          
          {/* Indicateur d'étapes */}
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    currentStep >= step.number 
                      ? 'bg-black text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {currentStep > step.number ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      step.number
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p className={`text-xs font-medium ${currentStep >= step.number ? 'text-gray-900' : 'text-gray-500'}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-400">{step.description}</p>
                  </div>
                </div>
                
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    currentStep > step.number ? 'bg-black' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          
          {/* Barre de progression */}
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className="bg-black h-1 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Message de bienvenue si disponible */}
        {location.state?.message && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 text-sm">{location.state.message}</p>
          </div>
        )}

        {/* Contenu de l'étape */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {currentStep === 1 && (
            <OnboardingStep1 
              onNext={handleNext}
              user={user}
              loading={loading}
              setLoading={setLoading}
              stepData={stepData.step1}
            />
          )}
          
          {currentStep === 2 && (
            <OnboardingStep2 
              onNext={handleNext}
              user={user}
              loading={loading}
              setLoading={setLoading}
              stepData={stepData.step2}
            />
          )}
          
          {currentStep === 3 && (
            <OnboardingStep3 
              onNext={handleNext}
              user={user}
              loading={loading}
              setLoading={setLoading}
              stepData={stepData.step3}
            />
          )}
        </div>
      </div>

      {/* Footer avec navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 1 || loading}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              currentStep === 1 || loading
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Retour</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleNext()}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Passer
            </button>
            
            <button
              onClick={() => handleNext()}
              disabled={loading}
              className="px-6 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center space-x-2 transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Chargement...</span>
                </>
              ) : (
                <>
                  <span>{currentStep === 3 ? 'Terminer' : 'Continuer'}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Padding bottom pour éviter le chevauchement avec le footer fixe */}
      <div className="h-20"></div>
    </div>
  )
}

export default Onboarding