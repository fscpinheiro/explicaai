import { useState, useEffect } from 'react'

const useBackground = () => {
  const [backgroundType, setBackgroundType] = useState('static')

  // Carregar preferência salva
  useEffect(() => {
    const saved = localStorage.getItem('explicaai-background')
    if (saved) {
      // ✅ MIGRAÇÃO: Converter 'gradient' antigo para 'gradient-sunset'
      if (saved === 'gradient') {
        setBackgroundType('gradient-sunset')
        localStorage.setItem('explicaai-background', 'gradient-sunset')
      } else {
        setBackgroundType(saved)
      }
    }
  }, [])

  // Salvar preferência
  const changeBackground = (newType) => {
    setBackgroundType(newType)
    localStorage.setItem('explicaai-background', newType)
    console.log('🎨 Fundo alterado para:', newType)
  }

  // ✅ VALIDAR TIPOS SUPORTADOS
  const validTypes = [
    'static', 
    'clouds', 
    'gradient-sunset', 
    'gradient-ocean', 
    'gradient-forest', 
    'gradient-night'
  ]

  // Se tipo não for válido, resetar para static
  useEffect(() => {
    if (!validTypes.includes(backgroundType)) {
      console.warn('🚨 Tipo de fundo inválido:', backgroundType, '- Resetando para static')
      setBackgroundType('static')
      localStorage.setItem('explicaai-background', 'static')
    }
  }, [backgroundType])

  return {
    backgroundType,
    changeBackground,
    validTypes
  }
}

export default useBackground