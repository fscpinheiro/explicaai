// ExplicaAI - Serviço de Integração com Ollama/Gemma 3n
// Centraliza toda comunicação com o modelo de IA

const fs = require('fs');
const path = require('path');
const { getElapsedTime, truncateText } = require('../utils/helpers');

class OllamaService {
  constructor() {
    this.baseUrl = 'http://localhost:11434';
    this.model = 'gemma3n:e4b';
    this.defaultOptions = {
      temperature: 0.3, // Mais determinístico para matemática
      top_p: 0.9,
      top_k: 40
    };
  }

  /**
   * Verificar se o Ollama está rodando
   */
  async checkStatus() {
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(this.baseUrl, { timeout: 5000 });
      const text = await response.text();
      return text.includes('Ollama is running');
    } catch (error) {
      return false;
    }
  }

  /**
   * Chamar Ollama com prompt (com ou sem imagem)
   */
  async generate(prompt, imagePath = null, options = {}, abortSignal = null) {
  const fetch = (await import('node-fetch')).default;
  
  const requestBody = {
    model: this.model,
    prompt: prompt,
    stream: false,
    options: { ...this.defaultOptions, ...options }
  };

  // Adicionar imagem se fornecida
  if (imagePath && fs.existsSync(imagePath)) {
    try {
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      requestBody.images = [base64Image];
      console.log(`📷 Imagem adicionada: ${path.basename(imagePath)}`);
    } catch (error) {
      console.error('❌ Erro ao processar imagem:', error.message);
      throw new Error('Erro ao processar a imagem');
    }
  }

  try {
    console.log('🤖 Enviando para Gemma 3n...');
    const startTime = Date.now();
    
    // ✅ ADICIONAR SUPORTE A CANCELAMENTO
    const fetchOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      timeout: 120000
    };

    // ✅ ADICIONAR AbortSignal se fornecido
    if (abortSignal) {
      fetchOptions.signal = abortSignal;
    }
    
    const response = await fetch(`${this.baseUrl}/api/generate`, fetchOptions);

    if (!response.ok) {
      throw new Error(`Ollama respondeu com status ${response.status}`);
    }

    const data = await response.json();
    const elapsedTime = getElapsedTime(startTime);
    
    console.log(`✅ Resposta recebida em ${elapsedTime}s`);
    
    if (!data.response) {
      throw new Error('Resposta vazia do modelo');
    }
    
    return {
      response: data.response,
      elapsedTime,
      model: this.model
    };
  } catch (error) {
    // ✅ TRATAR CANCELAMENTO
    if (error.name === 'AbortError') {
      console.log('🛑 Requisição cancelada pelo usuário');
      throw new Error('Operação cancelada');
    }
    
    console.error('❌ Erro ao chamar Ollama:', error.message);
    
    if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      throw new Error('Timeout - o modelo está demorando muito para responder. Tente reiniciar o Ollama.');
    }
    
    throw new Error(`Erro na comunicação com IA: ${error.message}`);
  }
}

  /**
   * Analisar imagem com problema matemático
   */
  async analyzeImage(imagePath) {
    const prompt = this.createImagePrompt();
    const result = await this.generate(prompt, imagePath);
    
    console.log(`📷 Imagem analisada: ${path.basename(imagePath)} em ${result.elapsedTime}s`);
    
    return result;
  }

  /**
   * Teste simples de conectividade
   */
  async test() {
    try {
      const result = await this.generate('Resolva: 2 + 2 = ?');
      return {
        status: 'success',
        response: result.response,
        elapsedTime: result.elapsedTime
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Criar prompt para explicação matemática
   */
  createMathPrompt(problem) {
    const complexity = this.detectComplexity(problem);
    
    if (complexity === 'simple') {
      return `Você é um professor de matemática. Resolva este problema simples:

  PROBLEMA: "${problem}"

  Resolva de forma direta seguindo este formato:

  PASSO 1: Operação Direta
  Explicação: O que vamos fazer
  Cálculo: ${problem}
  Resultado: [resposta numérica]

  VERIFICAÇÃO:
  Explicação: Conferindo o resultado
  Cálculo: [verificação]
  Resultado: [confirmação]

  RESPOSTA FINAL: [resposta destacada]`;
    }
    
    // Para médio e complexo
    return `Você é um professor de matemática. Resolva este problema:

  PROBLEMA: "${problem}"

  Resolva seguindo este formato exato:

  PASSO 1: Primeiro Passo
  Explicação: O que fazer neste passo
  Cálculo: operação matemática
  Resultado: resultado do passo

  PASSO 2: Segundo Passo  
  Explicação: O que fazer neste passo
  Cálculo: operação matemática
  Resultado: resultado do passo

  VERIFICAÇÃO:
  Explicação: Como verificar
  Cálculo: verificação
  Resultado: confirmação

  RESPOSTA FINAL: resposta destacada

  IMPORTANTE: Substitua os colchetes pelos valores reais, não copie o formato!`;
  }

  /**
   * ✅ ADICIONAR: Função que estava faltando
   */
  async explainMathAnswerOnly(problem) {
    const prompt = `Resolva este problema de matemática e me dê APENAS a resposta final, sem explicações:

  ${problem}

  RESPOSTA:`;
    
    const result = await this.generate(prompt, null, {
      temperature: 0.1, // Mais determinístico para respostas diretas
      top_p: 0.8
    });
    
    console.log(`⚡ Resposta rápida: "${this.truncateText ? this.truncateText(problem) : problem.substring(0, 50)}..." em ${result.elapsedTime}s`);
    
    return result;
  }


  /**
   * Criar prompt para análise de imagens
   */
  createImagePrompt() {
    return `Você é um professor de matemática analisando uma imagem com um exercício matemático.

IMPORTANTE: Analise cuidadosamente cada símbolo na imagem.

TAREFA:
1. Transcreva EXATAMENTE o que está escrito na imagem
2. Se não conseguir ler algo, mencione a dificuldade
3. Resolva o problema identificado passo a passo

FORMATO DA RESPOSTA:
**Transcrição da imagem:**
[O que conseguiu ler exatamente]

**Análise do Problema:**
[Tipo de problema e o que está sendo pedido]

**Solução Passo a Passo:**
1. [Primeiro passo]
2. [Segundo passo]
3. [Continue até resolver]

**Resposta Final:**
[Resultado destacado]

Use linguagem clara e didática para estudantes.`;
  }

  /**
   * Obter informações do modelo
   */
  async getModelInfo() {
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(`${this.baseUrl}/api/show`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: this.model }),
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`Erro ao obter informações do modelo: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Erro ao obter informações do modelo:', error.message);
      throw error;
    }
  }

  /**
   * Listar modelos disponíveis
   */
  async listModels() {
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`Erro ao listar modelos: ${response.status}`);
      }

      const data = await response.json();
      return data.models || [];
    } catch (error) {
      console.error('❌ Erro ao listar modelos:', error.message);
      throw error;
    }
  }

  /**
   * Explicar problema matemático - VERSÃO DETALHADA
   */
  async explainMath(problem, abortSignal = null) {
    const prompt = this.createMathPrompt(problem);
    const result = await this.generate(prompt, null, {}, abortSignal);
    
    console.log(`📝 Problema estruturado: "${this.truncateText ? this.truncateText(problem) : problem.substring(0, 50)}..." em ${result.elapsedTime}s`);
    
    return result;
  }
 

  /**
   * Gerar exercícios similares
   */
  async generateSimilar(originalProblem) {
    const prompt = this.createSimilarPrompt(originalProblem);
    const result = await this.generate(prompt);
    
    console.log(`🎯 Exercícios similares gerados para: "${truncateText(originalProblem)}" em ${result.elapsedTime}s`);
    
    return result;
  }

  /**
   * Analisar imagem de exercício
   */
  async analyzeImage(image) {
    const prompt = this.createImagePrompt();
    const result = await this.generate(prompt, image);
    
    console.log(`📷 Imagem analisada em ${result.elapsedTime}s`);
    
    return result;
  }

  /**
   * TESTE: Função para debug - retorna Olá Mundo
   */
  async soResposta(problem, abortSignal = null) {
    console.log('🚨 SOLUÇÃO DRAMÁTICA: Passo a passo interno!');
    
    const fullResult = await this.explainMath(problem);
    
    const extractFinalAnswer = (fullText) => {
        const finalMatch = fullText.match(/RESPOSTA FINAL:\s*(.+?)(?:\n|$)/i);
        if (finalMatch) {
            return finalMatch[1].trim();
        }
        
        const xMatch = fullText.match(/x\s*=\s*[^\n]+/gi);
        if (xMatch && xMatch.length > 0) {
            return xMatch[xMatch.length - 1].trim().replace(/[\[\]]/g, ''); 
        }
        
        return "Não foi possível extrair a resposta";
    };
    
    return {
        response: extractFinalAnswer(fullResult.response),
        elapsedTime: fullResult.elapsedTime,
        model: this.model
    };
  }

  /**
 * Criar prompt para gerar exercícios similares
 */
  createSimilarPrompt(originalProblem) {
    return `Você é um professor de matemática criativo. Baseado neste problema original, crie 3 exercícios similares:

  PROBLEMA ORIGINAL: "${originalProblem}"

  INSTRUÇÕES:
  1. Crie 3 exercícios com a mesma estrutura/conceito
  2. Mude apenas os números e contexto
  3. Mantenha o mesmo nível de dificuldade
  4. Use contextos diferentes (idade, dinheiro, objetos, etc.)

  FORMATO DA RESPOSTA:
  **Exercício 1:**
  [Novo problema similar]

  **Exercício 2:** 
  [Novo problema similar]

  **Exercício 3:**
  [Novo problema similar]

  **Dica de Estudo:**
  [Uma dica pedagógica sobre este tipo de problema]

  EXERCÍCIOS SIMILARES:`;
  }

  /**
   * Detectar complexidade do problema matemático
   */
  detectComplexity(problem) {
    const text = problem.toLowerCase().trim();
    
    // Problemas SIMPLES (1-2 passos diretos)
    const simplePatterns = [
      /^\d+\s*[+\-*/]\s*\d+$/, // 36*6, 25+17
      /^\d+\s*[+\-*/]\s*\d+\s*[+\-*/]\s*\d+$/, // 2+3*4
      /^x\s*[+\-]\s*\d+\s*=\s*\d+$/, // x+5=13
      /^\d*x\s*=\s*\d+$/, // 2x=10
    ];
    
    // Problemas COMPLEXOS
    const complexPatterns = [
      /sistema|equação.*equação/i,
      /integral|derivada|limite/i,
      /sen\(|cos\(|tan\(|log\(|ln\(/i,
      /sqrt|raiz|√/i,
      /matriz|determinante/i
    ];
    
    // Verificar se é simples
    if (simplePatterns.some(pattern => pattern.test(text))) {
      return 'simple';
    }
    
    // Verificar se é complexo
    if (complexPatterns.some(pattern => pattern.test(text))) {
      return 'complex';
    }
    
    // Padrão: médio
    return 'medium';
  }

  /**
   * Validar se a resposta está no formato estruturado esperado
   */
  isValidStructuredResponse(responseText) {
    const text = responseText.trim();
    
    // Verificações essenciais
    const hasSteps = /PASSO \d+:/i.test(text);
    const hasExplanation = /Explicação:/i.test(text);
    const hasCalculation = /Cálculo:/i.test(text);
    const hasResult = /Resultado:/i.test(text);
    const hasFinalAnswer = /RESPOSTA FINAL:/i.test(text);
    
    // Pelo menos deve ter passos e resposta final
    return hasSteps && hasFinalAnswer && hasExplanation;
  }

  /**
   * Criar prompt mais rígido para retry
   */
  createStrictMathPrompt(problem) {
    return `Você é um professor de matemática. Resolva EXATAMENTE neste formato:

  PROBLEMA: "${problem}"

  PASSO 1: [título do passo]
  Explicação: [explicação clara]
  Cálculo: [operação matemática]
  Resultado: [resultado numérico]

  VERIFICAÇÃO:
  Explicação: [como verificar]
  Cálculo: [verificação]
  Resultado: [confirmação]

  RESPOSTA FINAL: [resposta destacada]

  OBRIGATÓRIO: Use EXATAMENTE as palavras "PASSO", "Explicação:", "Cálculo:", "Resultado:", "VERIFICAÇÃO:", "RESPOSTA FINAL:".
  NÃO mude o formato. NÃO use outros rótulos.`;
  }

  /**
   * Explicar problema com retry automático se formato inválido
   */
  async explainMathWithRetry(problem, abortSignal = null) {
    try {
      // Primeira tentativa - prompt normal
      console.log('🎯 Primeira tentativa...');
      const prompt = this.createMathPrompt(problem);
      const result = await this.generate(prompt, null, {}, abortSignal);
      
      // Validar formato
      if (this.isValidStructuredResponse(result.response)) {
        console.log('✅ Formato válido na primeira tentativa');
        return result;
      }
      
      // Segunda tentativa - prompt mais rígido
      console.log('⚠️ Formato inválido, tentando prompt mais rígido...');
      const strictPrompt = this.createStrictMathPrompt(problem);
      const retryResult = await this.generate(strictPrompt, null, { temperature: 0.1 }, abortSignal);
      
      // Validar segunda tentativa
      if (this.isValidStructuredResponse(retryResult.response)) {
        console.log('✅ Formato válido na segunda tentativa');
        return retryResult;
      }
      
      // Terceira tentativa - fallback simples
      console.log('❌ Duas tentativas falharam, usando fallback...');
      const fallbackResult = await this.explainMathAnswerOnly(problem, abortSignal);
      
      return {
        response: `Não consegui formatar a resposta corretamente. Aqui está a resposta direta:\n\nRESPOSTA FINAL: ${fallbackResult.response}`,
        elapsedTime: result.elapsedTime + retryResult.elapsedTime + fallbackResult.elapsedTime,
        model: this.model,
        wasRetried: true
      };
      
    } catch (error) {
      console.error('❌ Erro no explainMathWithRetry:', error.message);
      throw error;
    }
  }

}



// Instância singleton
const ollamaService = new OllamaService();

module.exports = ollamaService;