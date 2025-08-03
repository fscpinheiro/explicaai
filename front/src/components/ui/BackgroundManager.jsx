import { useState, useEffect } from 'react'

const BackgroundManager = ({ backgroundType, children }) => {
  const [vantaEffect, setVantaEffect] = useState(null)

  useEffect(() => {
    if (vantaEffect) {
      vantaEffect.destroy()
      setVantaEffect(null)
    }

    if (backgroundType === 'clouds') {
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
            speed: 0.3 
          })
          setVantaEffect(effect)
        }
      }, 100)
    }

    return () => {
      if (vantaEffect) {
        vantaEffect.destroy()
      }
    }
  }, [backgroundType])


  const getCustomStaticStyle = (colorHex) => {
    const color = `#${colorHex}`
        
    return {
      background: `linear-gradient(135deg, ${color}22 0%, ${color}44 25%, ${color}66 50%, ${color}44 75%, ${color}22 100%)`
    }
  }

  const getBackgroundClasses = () => {
    switch (backgroundType) {
      case 'static':
        return "min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
      
      case 'clouds':
        return "min-h-screen relative"
      
      case 'gradient-sunset':
        return "min-h-screen animated-gradient-sunset"
      
      case 'gradient-ocean':
        return "min-h-screen animated-gradient-ocean"
      
      case 'gradient-forest':
        return "min-h-screen animated-gradient-forest"
      
      case 'gradient-night':
        return "min-h-screen animated-gradient-night"
      
      case 'gradient':
        return "min-h-screen animated-gradient-sunset"
      
      default:
        if (backgroundType?.startsWith('static-')) {
          return "min-h-screen" 
        }
        return "min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
    }
  }

  const getCustomStyle = () => {
    if (backgroundType?.startsWith('static-')) {
      const colorHex = backgroundType.replace('static-', '')
      return getCustomStaticStyle(colorHex)
    }
    return {}
  }

  return (
    <div 
      className={getBackgroundClasses()} 
      style={getCustomStyle()}
    >
      
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