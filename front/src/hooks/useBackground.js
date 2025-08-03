import { useState, useEffect } from 'react'

const useBackground = () => {
  const [backgroundType, setBackgroundType] = useState('static')

  useEffect(() => {
    const saved = localStorage.getItem('explicaai-background')
    if (saved) {
      if (saved === 'gradient') {
        setBackgroundType('gradient-sunset')
        localStorage.setItem('explicaai-background', 'gradient-sunset')
      } else {
        setBackgroundType(saved)
      }
    }
  }, [])

  const changeBackground = (newType) => {
    setBackgroundType(newType)
    localStorage.setItem('explicaai-background', newType)
    
    if (newType.startsWith('static-')) {
      const color = '#' + newType.replace('static-', '')
      console.log('🎨 Fundo alterado para cor personalizada:', color)
    } else {
      console.log('🎨 Fundo alterado para:', newType)
    }
  }

  const isValidType = (type) => {
    const validStaticTypes = [
      'static', 
      'clouds', 
      'gradient-sunset', 
      'gradient-ocean', 
      'gradient-forest', 
      'gradient-night'
    ]
    
    if (validStaticTypes.includes(type)) {
      return true
    }
      
    if (type.startsWith('static-')) {
      const colorHex = type.replace('static-', '')
      return /^[0-9A-Fa-f]{6}$/.test(colorHex)
    }
    
    return false
  }

  useEffect(() => {
    if (!isValidType(backgroundType)) {
      console.warn('🚨 Tipo de fundo inválido:', backgroundType, '- Resetando para static')
      setBackgroundType('static')
      localStorage.setItem('explicaai-background', 'static')
    }
  }, [backgroundType])

  const getCurrentColor = () => {
    if (backgroundType.startsWith('static-')) {
      return '#' + backgroundType.replace('static-', '')
    }
    return null
  }

  const isStaticBackground = () => {
    return backgroundType === 'static' || backgroundType.startsWith('static-')
  }

  const getBackgroundDisplayName = () => {
    switch (backgroundType) {
      case 'static':
        return 'Estático (Padrão)'
      case 'clouds':
        return 'Nuvens 3D'
      case 'gradient-sunset':
        return 'Gradiente Pôr do Sol'
      case 'gradient-ocean':
        return 'Gradiente Oceano'
      case 'gradient-forest':
        return 'Gradiente Floresta'
      case 'gradient-night':
        return 'Gradiente Noite'
      default:
        if (backgroundType.startsWith('static-')) {
          const color = getCurrentColor()
          return `Estático (${color})`
        }
        return 'Desconhecido'
    }
  }

  return {
    backgroundType,
    changeBackground,
    getCurrentColor,
    isStaticBackground,
    getBackgroundDisplayName,
    isValidType
  }
}

export default useBackground