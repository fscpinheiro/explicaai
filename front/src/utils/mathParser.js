/**
 * Parser para resposta estruturada do Gemma
 * Converte texto estruturado em array de objetos Step
 */

export const parseStructuredMathResponse = (responseText) => {
  try {
    const steps = []
    const lines = responseText.split('\n').map(line => line.trim()).filter(line => line)
    
    let currentStep = null
    let stepCounter = 1
    let hasVerification = false // Controlar duplicação

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      // Detectar início de passo
      if (line.match(/^PASSO \d+:/)) {
        if (currentStep) {
          steps.push(currentStep)
        }
        
        currentStep = {
          numero: stepCounter++,
          titulo: line.replace(/^PASSO \d+:\s*/, ''),
          type: 'passo'
        }
      }
      
      // Detectar verificação (APENAS UMA VEZ)
      else if (line.match(/^VERIFICAÇÃO:/) && !hasVerification) {
        if (currentStep) {
          steps.push(currentStep)
        }
        
        currentStep = {
          numero: '✓',
          titulo: 'Verificação',
          type: 'verificacao'
        }
        hasVerification = true // Marcar que já temos
      }
      
      // Detectar resposta final
      else if (line.match(/^RESPOSTA FINAL:/)) {
        if (currentStep) {
          steps.push(currentStep)
        }
        
        const resposta = line.replace(/^RESPOSTA FINAL:\s*/, '')
        steps.push({
          numero: '🎯',
          titulo: 'Resposta Final',
          type: 'resposta',
          resultado: resposta
        })
        break // PARAR aqui para evitar processar mais
      }
      
      // Processar campos do passo atual
      else if (currentStep) {
        if (line.startsWith('Explicação:')) {
          currentStep.explicacao = line.replace(/^Explicação:\s*/, '')
        }
        else if (line.startsWith('Cálculo:')) {
          currentStep.calculo = line.replace(/^Cálculo:\s*/, '')
        }
        else if (line.startsWith('Resultado:')) {
          currentStep.resultado = line.replace(/^Resultado:\s*/, '')
        }
      }
    }

    // Adicionar último passo se não foi adicionado
    if (currentStep && !steps.find(s => s.type === currentStep.type)) {
      steps.push(currentStep)
    }

    return steps.length > 0 ? steps : null
  } catch (error) {
    console.error('❌ Erro no parser:', error)
    return null
  }
}

/**
 * Fallback para resposta não estruturada (formato antigo)
 */
const parseUnstructuredResponse = (responseText) => {
  const steps = []
  const sections = responseText.split(/\*\*([^*]+)\*\*/g)
  
  for (let i = 1; i < sections.length; i += 2) {
    if (sections[i] && sections[i + 1]) {
      const titulo = sections[i].trim()
      const conteudo = sections[i + 1].trim()
      
      steps.push({
        numero: Math.ceil(i / 2),
        titulo,
        explicacao: conteudo,
        type: titulo.toLowerCase().includes('resposta') ? 'resposta' : 'passo'
      })
    }
  }

  // Se não conseguiu parsear, criar um único step
  if (steps.length === 0) {
    steps.push({
      numero: 1,
      titulo: 'Resolução',
      explicacao: responseText,
      type: 'passo'
    })
  }

  return steps
}

/**
 * Verificar se resposta está no formato estruturado
 */
export const isStructuredResponse = (responseText) => {
  return responseText.includes('PASSO 1:') && 
         responseText.includes('Explicação:') && 
         responseText.includes('RESPOSTA FINAL:')
}

/**
 * Extrair apenas a resposta final de qualquer formato
 */
export const extractFinalAnswer = (responseText) => {
  // Tentar encontrar "RESPOSTA FINAL:"
  const finalMatch = responseText.match(/RESPOSTA FINAL:\s*(.+?)(?:\n|$)/i)
  if (finalMatch) {
    return finalMatch[1].trim()
  }
  
  // Tentar encontrar padrão x = valor
  const answerMatch = responseText.match(/x\s*=\s*[^\n]+/i)
  if (answerMatch) {
    return answerMatch[0].trim()
  }
  
  // Fallback
  return responseText.split('\n').pop().trim()
}