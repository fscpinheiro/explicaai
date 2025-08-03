import { useState, useEffect } from 'react'

const BackgroundManager = ({ backgroundType, children }) => {
  const [vantaEffect, setVantaEffect] = useState(null)

  useEffect(() => {
    // Cleanup do Vanta anterior
    if (vantaEffect) {
      vantaEffect.destroy()
      setVantaEffect(null)
    }

    // Inicializar Vanta Clouds se necessário
    if (backgroundType === 'clouds') {
      // Aguardar um tick para garantir que o DOM esteja pronto
      setTimeout(() => {
        if (window.VANTA && window.VANTA.CLOUDS) {
          const effect = window.VANTA.CLOUDS({
            el: "#vanta-bg",
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            skyColor: 0x68b8d7,
            cloudColor: 0xadc1de,
            cloudShadowColor: 0x183550,
            sunColor: 0xff9919,
            sunGlareColor: 0xff6633,
            sunlightColor: 0xff9933,
            speed: 0.3 // 30%
          })
          setVantaEffect(effect)
        }
      }, 100)
    }

    // Cleanup quando componente desmonta ou muda tipo
    return () => {
      if (vantaEffect) {
        vantaEffect.destroy()
      }
    }
  }, [backgroundType])

  const getBackgroundClasses = () => {
    switch (backgroundType) {
      case 'static':
        return "min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
      
      case 'clouds':
        return "min-h-screen relative"
      
      // ✅ GRADIENTES ESPECÍFICOS
      case 'gradient-sunset':
        return "min-h-screen animated-gradient-sunset"
      
      case 'gradient-ocean':
        return "min-h-screen animated-gradient-ocean"
      
      case 'gradient-forest':
        return "min-h-screen animated-gradient-forest"
      
      case 'gradient-night':
        return "min-h-screen animated-gradient-night"
      
      // ✅ COMPATIBILIDADE COM O ANTIGO
      case 'gradient':
        return "min-h-screen animated-gradient-sunset"
      
      default:
        return "min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
    }
  }

  return (
    <div className={getBackgroundClasses()}>
      {/* Vanta Background para nuvens */}
      {backgroundType === 'clouds' && (
        <div 
          id="vanta-bg" 
          className="absolute inset-0 -z-10"
        />
      )}
      
      {/* Conteúdo */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

export default BackgroundManager