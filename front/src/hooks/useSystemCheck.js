import { useState, useEffect } from 'react'
import systemService from '../service/systemService'

const useSystemCheck = () => {
  const [systemStatus, setSystemStatus] = useState({
    isChecking: true,
    isComplete: false,
    api: null,
    database: null,
    ollama: null,
    model: null,
    error: null,
    progress: 0,
    currentStep: 'Iniciando verificações...',
    canProceed: false
  })

  const updateProgress = (step, progress, status = {}) => {
    setSystemStatus(prev => ({
      ...prev,
      currentStep: step,
      progress: Math.min(progress, 100),
      ...status
    }))
  }

  const performSystemCheck = async () => {
    try {
      // Step 1: Inicialização
      updateProgress('Conectando com o servidor...', 10)
      await new Promise(resolve => setTimeout(resolve, 800))

      // Step 2: Verificação da API
      updateProgress('Verificando API do ExplicaAI...', 25)
      const healthCheck = await systemService.fullSystemCheck(1)
      
      if (!healthCheck.success) {
        throw new Error(healthCheck.error || 'Servidor não está respondendo')
      }

      // Step 3: Status do Database
      updateProgress('Verificando banco de dados...', 50, {
        api: true,
        database: healthCheck.database
      })
      await new Promise(resolve => setTimeout(resolve, 600))

      // Step 4: Status do Ollama
      updateProgress('Verificando IA (Ollama/Gemma)...', 75, {
        ollama: healthCheck.ollama,
        model: healthCheck.model
      })
      await new Promise(resolve => setTimeout(resolve, 900))

      // Step 5: Finalização
      updateProgress('Carregando ExplicaAI...', 100, {
        isChecking: false,
        isComplete: true,
        canProceed: true,
        error: null
      })

      // Pequena pausa antes de liberar
      await new Promise(resolve => setTimeout(resolve, 700))

    } catch (error) {
      console.error('❌ Erro na verificação do sistema:', error)
      
      updateProgress('Erro na inicialização', 100, {
        isChecking: false,
        isComplete: true,
        error: error.message,
        api: false,
        database: false,
        ollama: false,
        canProceed: true // Permite prosseguir mesmo com erro
      })
    }
  }

  useEffect(() => {
    // Inicia verificações após mount
    const timer = setTimeout(() => {
      performSystemCheck()
    }, 800) // Pequeno delay para mostrar a splash

    return () => clearTimeout(timer)
  }, [])

  // Função para retry manual
  const retryCheck = () => {
    setSystemStatus(prev => ({
      ...prev,
      isChecking: true,
      isComplete: false,
      progress: 0,
      currentStep: 'Tentando novamente...',
      error: null,
      canProceed: false
    }))
    
    setTimeout(performSystemCheck, 500)
  }

  // Status simplificado para o resto do app
  const getSystemSummary = () => ({
    isOnline: systemStatus.ollama === true,
    isOffline: systemStatus.ollama === false,
    hasError: !!systemStatus.error,
    isLoading: systemStatus.isChecking,
    canUseAI: systemStatus.api && systemStatus.ollama,
    canStudy: systemStatus.api && systemStatus.database,
    details: {
      api: systemStatus.api,
      database: systemStatus.database, 
      ollama: systemStatus.ollama,
      model: systemStatus.model,
      error: systemStatus.error
    }
  })

  return {
    // Estado completo
    systemStatus,
    
    // Status simplificado  
    summary: getSystemSummary(),
    
    // Ações
    retryCheck,
    
    // Flags úteis
    isReady: systemStatus.isComplete && systemStatus.canProceed,
    showSplash: systemStatus.isChecking || !systemStatus.isComplete,
    
    // Para debug
    __debug: {
      raw: systemStatus,
      service: systemService
    }
  }
}

export default useSystemCheck