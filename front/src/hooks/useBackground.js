import { useState, useEffect } from 'react'

const useBackground = () => {
  const [backgroundType, setBackgroundType] = useState('static')

  // Carregar preferência salva
  useEffect(() => {
    const saved = localStorage.getItem('explicaai-background')
    if (saved) {
      setBackgroundType(saved)
    }
  }, [])

  // Salvar preferência
  const changeBackground = (newType) => {
    setBackgroundType(newType)
    localStorage.setItem('explicaai-background', newType)
    console.log('🎨 Fundo alterado para:', newType)
  }

  return {
    backgroundType,
    changeBackground
  }
}

export default useBackground