import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const AISphere = ({ 
  state = 'idle', 
  text = '', 
  size = 'medium',
  className = '' 
}) => {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const particlesRef = useRef(null)
  const animationRef = useRef(null)
  const clockRef = useRef(new THREE.Clock())
  const isAnimatingRef = useRef(false)
  const currentStateRef = useRef('sphere')
  
  // Configurações baseadas no tamanho
  const configs = {
    small: { particleCount: 2000, radius: 4, cameraZ: 12 },
    medium: { particleCount: 4000, radius: 6, cameraZ: 18 },
    large: { particleCount: 8000, radius: 8, cameraZ: 25 },
    fullscreen: { particleCount: 15000, radius: 15, cameraZ: 30 } 
  }
  
  const config = configs[size] || configs.medium

  useEffect(() => {
    if (!mountRef.current) return

    // Inicialização do Three.js
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000) // aspect ratio 1:1 para container quadrado
    camera.position.z = config.cameraZ

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true // fundo transparente
    })
    const rendererSize = size === 'fullscreen' ? [window.innerWidth, window.innerHeight] : [200, 200]
    renderer.setSize(rendererSize[0], rendererSize[1])
    renderer.setClearColor(0x000000, 0) // transparente
    mountRef.current.appendChild(renderer.domElement)

    sceneRef.current = { scene, camera, renderer }
    
    // Criar sistema de partículas
    createParticleSystem()
    
    // Iniciar loop de animação
    animate()

    return () => {
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [])

  // Reação a mudanças de estado
  useEffect(() => {
    if (!sceneRef.current) return
    console.log('🤖 AISphere state mudou para:', state) 

    switch (state) {
      case 'idle':
        returnToSphere()
        break
      case 'processing':
        fastPulseAnimation()
        break
      case 'thinking':
        thinkingWaveAnimation()
        break
      case 'success':
        explosionAnimation()
        break
      case 'error':
        rainAnimation()
        break
      case 'loading':
        waveAnimation()
        break
      case 'spinning':
        spinAnimation()
        break
      case 'typing':
        fastTypingAnimation()
        break
      default:
        returnToSphere()
    }
  }, [state])

  // Reação a mudanças de texto
  useEffect(() => {
    if (text && sceneRef.current) {
      const textPoints = createTextPoints(text)
      morphTo(textPoints, 2)
    }
  }, [text])

  function createParticleSystem() {
    if (!sceneRef.current) return
    
    const { scene } = sceneRef.current
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(config.particleCount * 3)
    const colors = new Float32Array(config.particleCount * 3)

    // Distribuição esférica usando algoritmo de Fibonacci
    for (let i = 0; i < config.particleCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / config.particleCount)
      const theta = Math.sqrt(config.particleCount * Math.PI) * phi
      
      const x = config.radius * Math.cos(theta) * Math.sin(phi)
      const y = config.radius * Math.sin(theta) * Math.sin(phi)
      const z = config.radius * Math.cos(phi)

      positions[i * 3] = x + (Math.random() - 0.5) * 0.5
      positions[i * 3 + 1] = y + (Math.random() - 0.5) * 0.5
      positions[i * 3 + 2] = z + (Math.random() - 0.5) * 0.5

      // Gradiente dourado
      const distanceFromCenter = Math.sqrt(x * x + y * y + z * z) / config.radius
      const color = new THREE.Color()
      
      if (distanceFromCenter > 0.8) {
        color.setHSL(0.15, 0.7, 0.8 + Math.random() * 0.2)
      } else if (distanceFromCenter > 0.5) {
        color.setHSL(0.08, 0.8, 0.6 + Math.random() * 0.2)
      } else {
        color.setHSL(0.05, 0.9, 0.3 + Math.random() * 0.2)
      }

      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const material = new THREE.PointsMaterial({
      size: size === 'small' ? 0.06 : size === 'large' ? 0.1 : 0.08,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true
    })

    if (particlesRef.current) scene.remove(particlesRef.current)
    particlesRef.current = new THREE.Points(geometry, material)
    scene.add(particlesRef.current)
  }

  function createTextPoints(text) {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const fontSize = size === 'small' ? 80 : size === 'large' ? 160 : 120
    const padding = 40

    ctx.font = `bold ${fontSize}px Arial`
    const textMetrics = ctx.measureText(text)
    const textWidth = textMetrics.width
    const textHeight = fontSize

    canvas.width = textWidth + padding * 2
    canvas.height = textHeight + padding * 2

    ctx.fillStyle = 'white'
    ctx.font = `bold ${fontSize}px Arial`
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    ctx.fillText(text, canvas.width / 2, canvas.height / 2)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const pixels = imageData.data
    const points = []
    const threshold = 128

    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i] > threshold) {
        const x = (i / 4) % canvas.width
        const y = Math.floor((i / 4) / canvas.width)
        
        if (Math.random() < 0.25) {
          points.push({
            x: (x - canvas.width / 2) / (fontSize / (config.radius * 1.5)),
            y: -(y - canvas.height / 2) / (fontSize / (config.radius * 1.5)),
            z: 0
          })
        }
      }
    }

    return points
  }

  function thinkingWaveAnimation() {
  if (isAnimatingRef.current || !particlesRef.current) return
  
  const startTime = clockRef.current.getElapsedTime()
  const duration = 6
  const positions = particlesRef.current.geometry.attributes.position.array
  const originalPositions = [...positions]
  
  function wave() {
      const elapsed = clockRef.current.getElapsedTime() - startTime
      
      if (elapsed < duration) {
        // Ondas suaves + rotação lenta
        for (let i = 0; i < positions.length; i += 3) {
          const x = originalPositions[i]
          const y = originalPositions[i + 1]
          const z = originalPositions[i + 2]
          
          const distFromCenter = Math.sqrt(x * x + y * y + z * z)
          const wave1 = Math.sin(elapsed * 2 - distFromCenter * 0.2) * 0.8
          const wave2 = Math.sin(elapsed * 3 + distFromCenter * 0.1) * 0.5
          
          const factor = 1 + (wave1 + wave2) * 0.15
          positions[i] = x * factor
          positions[i + 1] = y * factor
          positions[i + 2] = z * factor
        }
        
        // Rotação suave
        particlesRef.current.rotation.y += 0.01
        particlesRef.current.rotation.z += 0.005
        
        particlesRef.current.geometry.attributes.position.needsUpdate = true
        requestAnimationFrame(wave)
      } else {
        // Resetar para esfera normal
        for (let i = 0; i < positions.length; i++) {
          positions[i] = originalPositions[i]
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true
        particlesRef.current.rotation.set(0, 0, 0)
      }
    }
    
    wave()
  }

  function fastTypingAnimation() {
    if (!particlesRef.current) return
    
    const startTime = clockRef.current.getElapsedTime()
    const duration = 2 // 2 segundos (vai ser interrompido quando parar de digitar)
    
    function typeRotation() {
      const elapsed = clockRef.current.getElapsedTime() - startTime
      
      if (elapsed < duration && currentStateRef.current !== 'typing') {
        return // Parar se mudou de state
      }
      
      // Rotação 3x mais rápida que o normal
      particlesRef.current.rotation.y += 0.006 // Normal é 0.002
      particlesRef.current.rotation.x += 0.001
      
      if (elapsed < duration) {
        requestAnimationFrame(typeRotation)
      }
    }
    
    typeRotation()
  }

  function createInterrogationPoints() {
    const points = []
    const detail = 200
    const scale = config.radius / 8 // escala baseada no tamanho

    // Parte curva da interrogação
    for (let i = 0; i < detail * 0.7; i++) {
      const t = i / (detail * 0.7)
      const angle = t * Math.PI * 1.5 + Math.PI * 0.25
      const radius = 3 * scale
      const x = Math.cos(angle) * radius
      const y = Math.sin(angle) * radius + 2 * scale
      points.push({ x, y, z: 0 })
    }

    // Linha vertical
    for (let i = 0; i < detail * 0.2; i++) {
      const t = i / (detail * 0.2)
      const x = 0
      const y = (-1 - t * 2) * scale
      points.push({ x, y, z: 0 })
    }

    // Ponto
    const dotPoints = 15
    for (let i = 0; i < dotPoints; i++) {
      const angle = (i / dotPoints) * Math.PI * 2
      const radius = 0.3 * scale
      const x = Math.cos(angle) * radius
      const y = (-4.5 * scale) + Math.sin(angle) * radius
      points.push({ x, y, z: 0 })
    }

    return points
  }

  function morphTo(targetPoints, duration = 2) {
    if (isAnimatingRef.current || !particlesRef.current) return
    
    isAnimatingRef.current = true
    particlesRef.current.rotation.set(0, 0, 0)
    
    const positions = particlesRef.current.geometry.attributes.position.array
    const basePositions = [...positions]
    const targetPositions = new Float32Array(config.particleCount * 3)
    
    for (let i = 0; i < config.particleCount; i++) {
      if (i < targetPoints.length) {
        targetPositions[i * 3] = targetPoints[i].x
        targetPositions[i * 3 + 1] = targetPoints[i].y
        targetPositions[i * 3 + 2] = targetPoints[i].z
      } else {
        const angle = Math.random() * Math.PI * 2
        const radius = config.radius * 2 + Math.random() * config.radius
        targetPositions[i * 3] = Math.cos(angle) * radius
        targetPositions[i * 3 + 1] = Math.sin(angle) * radius
        targetPositions[i * 3 + 2] = (Math.random() - 0.5) * config.radius
      }
    }

    const startTime = clockRef.current.getElapsedTime()
    
    function animateMorph() {
      const elapsed = clockRef.current.getElapsedTime() - startTime
      const progress = Math.min(1, elapsed / duration)
      const eased = progress * progress * (3 - 2 * progress)
      
      for (let i = 0; i < positions.length; i++) {
        positions[i] = THREE.MathUtils.lerp(basePositions[i], targetPositions[i], eased)
      }
      
      particlesRef.current.geometry.attributes.position.needsUpdate = true
      
      if (progress < 1) {
        requestAnimationFrame(animateMorph)
      } else {
        isAnimatingRef.current = false
      }
    }
    
    animateMorph()
  }

  function returnToSphere() {
    if (isAnimatingRef.current || !particlesRef.current) return
    
    currentStateRef.current = 'sphere'
    createParticleSystem() // recria a esfera perfeita
  }

  function fastPulseAnimation() {
    if (isAnimatingRef.current || !particlesRef.current) return
    
    const startTime = clockRef.current.getElapsedTime()
    const duration = 3
    const positions = particlesRef.current.geometry.attributes.position.array
    const originalPositions = [...positions]
    
    function pulse() {
      const elapsed = clockRef.current.getElapsedTime() - startTime
      const progress = elapsed / duration
      
      if (progress < 1) {
        const pulseFreq = 12
        const pulseIntensity = Math.sin(elapsed * pulseFreq) * 0.25
        const fadeOut = 1 - progress * 0.2
        
        for (let i = 0; i < positions.length; i += 3) {
          const scale = 1 + pulseIntensity * fadeOut
          positions[i] = originalPositions[i] * scale
          positions[i + 1] = originalPositions[i + 1] * scale
          positions[i + 2] = originalPositions[i + 2] * scale
        }
        
        particlesRef.current.geometry.attributes.position.needsUpdate = true
        particlesRef.current.material.opacity = 0.7 + Math.abs(pulseIntensity) * 0.3
        
        requestAnimationFrame(pulse)
      } else {
        for (let i = 0; i < positions.length; i++) {
          positions[i] = originalPositions[i]
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true
        particlesRef.current.material.opacity = 0.9
      }
    }
    
    pulse()
  }

  function spinAnimation() {
    if (!particlesRef.current) return
    
    const startTime = clockRef.current.getElapsedTime()
    const duration = 3
    
    function spin() {
      const elapsed = clockRef.current.getElapsedTime() - startTime
      const progress = elapsed / duration
      
      if (progress < 1) {
        const speedMultiplier = Math.sin(progress * Math.PI)
        particlesRef.current.rotation.y += 0.2 * speedMultiplier
        particlesRef.current.rotation.x += 0.05 * speedMultiplier
        
        requestAnimationFrame(spin)
      } else {
        particlesRef.current.rotation.set(0, 0, 0)
      }
    }
    
    spin()
  }

  function explosionAnimation() {
    if (isAnimatingRef.current || !particlesRef.current) return
    
    const startTime = clockRef.current.getElapsedTime()
    const duration = 2
    const positions = particlesRef.current.geometry.attributes.position.array
    const originalPositions = [...positions]
    
    function explode() {
      const elapsed = clockRef.current.getElapsedTime() - startTime
      const progress = elapsed / duration
      
      if (progress < 1) {
        let expansionFactor
        if (progress < 0.2) {
          expansionFactor = 1 + (progress / 0.2) * 3
        } else if (progress < 0.6) {
          expansionFactor = 4
        } else {
          const returnProgress = (progress - 0.6) / 0.4
          expansionFactor = 4 - (returnProgress * 3)
        }
        
        for (let i = 0; i < positions.length; i += 3) {
          positions[i] = originalPositions[i] * expansionFactor
          positions[i + 1] = originalPositions[i + 1] * expansionFactor
          positions[i + 2] = originalPositions[i + 2] * expansionFactor
        }
        
        particlesRef.current.geometry.attributes.position.needsUpdate = true
        particlesRef.current.material.opacity = Math.max(0.3, 1 - (expansionFactor - 1) * 0.1)
        
        requestAnimationFrame(explode)
      } else {
        for (let i = 0; i < positions.length; i++) {
          positions[i] = originalPositions[i]
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true
        particlesRef.current.material.opacity = 0.9
      }
    }
    
    explode()
  }

  function waveAnimation() {
    if (isAnimatingRef.current || !particlesRef.current) return
    
    const startTime = clockRef.current.getElapsedTime()
    const duration = 4
    const positions = particlesRef.current.geometry.attributes.position.array
    const originalPositions = [...positions]
    
    function wave() {
      const elapsed = clockRef.current.getElapsedTime() - startTime
      const progress = elapsed / duration
      
      if (progress < 1) {
        for (let i = 0; i < positions.length; i += 3) {
          const x = originalPositions[i]
          const y = originalPositions[i + 1]
          const z = originalPositions[i + 2]
          
          const distFromCenter = Math.sqrt(x * x + y * y + z * z)
          const wave = Math.sin(elapsed * 3 - distFromCenter * 0.3) * 1.5
          const fadeOut = 1 - progress * 0.3
          
          const factor = 1 + (wave * fadeOut * 0.08)
          positions[i] = x * factor
          positions[i + 1] = y * factor
          positions[i + 2] = z * factor
        }
        
        particlesRef.current.geometry.attributes.position.needsUpdate = true
        requestAnimationFrame(wave)
      } else {
        for (let i = 0; i < positions.length; i++) {
          positions[i] = originalPositions[i]
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true
      }
    }
    
    wave()
  }

  function rainAnimation() {
    if (isAnimatingRef.current || !particlesRef.current) return
    
    const startTime = clockRef.current.getElapsedTime()
    const duration = 3
    const positions = particlesRef.current.geometry.attributes.position.array
    const originalPositions = [...positions]
    const velocities = new Float32Array(config.particleCount * 3)
    
    for (let i = 0; i < config.particleCount; i++) {
      velocities[i * 3] = (Math.random() - 0.5) * 4
      velocities[i * 3 + 1] = Math.random() * 8 + 4
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 4
    }
    
    function rain() {
      const elapsed = clockRef.current.getElapsedTime() - startTime
      const progress = elapsed / duration
      
      if (progress < 1) {
        const gravity = -15
        const dampening = 0.98
        
        for (let i = 0; i < positions.length; i += 3) {
          if (progress < 0.4) {
            velocities[i + 1] += gravity * 0.016
            velocities[i] *= dampening
            velocities[i + 2] *= dampening
            
            positions[i] += velocities[i] * 0.016
            positions[i + 1] += velocities[i + 1] * 0.016
            positions[i + 2] += velocities[i + 2] * 0.016
          } else {
            const returnProgress = (progress - 0.4) / 0.6
            const eased = returnProgress * returnProgress * (3 - 2 * returnProgress)
            
            positions[i] = THREE.MathUtils.lerp(positions[i], originalPositions[i], eased * 0.08)
            positions[i + 1] = THREE.MathUtils.lerp(positions[i + 1], originalPositions[i + 1], eased * 0.08)
            positions[i + 2] = THREE.MathUtils.lerp(positions[i + 2], originalPositions[i + 2], eased * 0.08)
          }
        }
        
        particlesRef.current.geometry.attributes.position.needsUpdate = true
        requestAnimationFrame(rain)
      } else {
        for (let i = 0; i < positions.length; i++) {
          positions[i] = originalPositions[i]
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true
      }
    }
    
    rain()
  }

  function createInterrogation() {
    const interrogationPoints = createInterrogationPoints()
    morphTo(interrogationPoints, 2)
  }

  function animate() {
    if (!sceneRef.current || !particlesRef.current) return
    
    const { scene, camera, renderer } = sceneRef.current
    const elapsed = clockRef.current.getElapsedTime()
    
    // Rotação suave apenas quando em estado idle
    if (currentStateRef.current === 'sphere' && !isAnimatingRef.current) {
      particlesRef.current.rotation.y += 0.002
      
      // Pulsação suave
      const positions = particlesRef.current.geometry.attributes.position.array
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i]
        const y = positions[i + 1]
        const z = positions[i + 2]
        const dist = Math.sqrt(x * x + y * y + z * z)
        
        const pulse = Math.sin(elapsed * 1.5 + dist * 0.1) * 0.1
        const scale = 1 + pulse * 0.015
        
        positions[i] *= scale
        positions[i + 1] *= scale
        positions[i + 2] *= scale
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true
    }
    
    renderer.render(scene, camera)
    animationRef.current = requestAnimationFrame(animate)
  }

  return (
    <div 
      ref={mountRef} 
      className={`ai-sphere ${className}`}
      style={{ 
        width: '100%', 
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    />
  )
}

export default AISphere