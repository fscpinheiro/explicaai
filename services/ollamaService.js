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
      return `Você é um professor de matemática prático. Resolva este problema SIMPLES de forma DIRETA:

  PROBLEMA: "${problem}"

  INSTRUÇÕES:
  - Este é um problema SIMPLES, resolva em 1-3 passos diretos
  - NÃO complique com decomposições desnecessárias
  - Seja objetivo e prático

  FORMATO:
  PASSO 1: [Operação direta]
  Explicação: [Breve explicação do que fazer]
  Cálculo: [Operação matemática]
  Resultado: [Resultado direto]

  VERIFICAÇÃO:
  Explicação: [Conferir se está correto]
  Cálculo: [Verificação rápida]
  Resultado: [Confirmação]

  RESPOSTA FINAL: [Resultado destacado]

  IMPORTANTE: Mantenha SIMPLES e DIRETO!`;
    }
    
    if (complexity === 'complex') {
      return `Você é um professor de matemática especializado. Resolva este problema COMPLEXO passo a passo:

  PROBLEMA: "${problem}"

  INSTRUÇÕES:
  - Este é um problema COMPLEXO, pode usar 5-10 passos
  - Explique conceitos importantes
  - Seja didático e detalhado

  FORMATO:
  PASSO 1: [Título claro do primeiro passo]
  Explicação: [Explique o conceito e por quê]
  Cálculo: [Operação matemática detalhada]
  Resultado: [Resultado deste passo]

  [Continue com PASSO 2, PASSO 3, etc conforme necessário]

  VERIFICAÇÃO:
  Explicação: [Substitua o resultado na equação original]
  Cálculo: [Mostre a verificação completa]
  Resultado: [Confirmação se está correto]

  RESPOSTA FINAL: [Destaque a resposta de forma clara]

  IMPORTANTE: Use EXATAMENTE os rótulos "PASSO X:", "Explicação:", "Cálculo:", "Resultado:"`;
    }
    
    // Problemas médios (padrão atual melhorado)
    return `Você é um professor de matemática didático. Resolva este problema seguindo o formato:

  PROBLEMA: "${problem}"

  INSTRUÇÕES:
  - Use 3-6 passos conforme necessário
  - Seja claro e educativo
  - Mantenha consistência no formato

  FORMATO:
  PASSO 1: [Título claro do primeiro passo]
  Explicação: [Explique o que fazer e por quê]
  Cálculo: [Mostre a operação matemática]
  Resultado: [Resultado deste passo]

  PASSO 2: [Título claro do segundo passo]
  Explicação: [Explique o que fazer e por quê]
  Cálculo: [Mostre a operação matemática]
  Resultado: [Resultado deste passo]

  [Continue conforme necessário]

  VERIFICAÇÃO:
  Explicação: [Substitua o resultado na equação original para confirmar]
  Cálculo: [Mostre a verificação]
  Resultado: [Confirmação se está correto]

  RESPOSTA FINAL: [Destaque a resposta de forma clara]

  IMPORTANTE: Use EXATAMENTE os rótulos "PASSO X:", "Explicação:", "Cálculo:", "Resultado:"`;
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

}



// Instância singleton
const ollamaService = new OllamaService();

module.exports = ollamaService;