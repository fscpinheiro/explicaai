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
  async generate(prompt, imagePath = null, options = {}) {
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
      
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        timeout: 120000 // 2 minutos timeout
      });

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
    return `Você é um professor de matemática muito didático e paciente. Um estudante precisa de ajuda com este problema:

"${problem}"

Por favor, explique a solução seguindo este formato:

**Análise do Problema:**
[Identifique que tipo de problema é e o que está sendo pedido]

**Solução Passo a Passo:**
1. [Primeiro passo com explicação clara]
2. [Segundo passo com justificativa]
3. [Continue até resolver completamente]

**Verificação:**
[Confirme se a resposta está correta substituindo valores]

**Resposta Final:**
[Destaque a resposta de forma clara]

Use linguagem simples e didática, como se estivesse explicando para um estudante do ensino médio. Seja encorajador e paciente.`;
  }

  /**
   * Criar prompt para exercícios similares
   */
  createSimilarPrompt(originalProblem) {
    return `Baseado neste problema de matemática: "${originalProblem}"

Crie 3 exercícios similares que:
- Sejam do mesmo tipo e nível de dificuldade
- Usem números diferentes
- Mantenham a mesma estrutura de raciocínio
- Sejam adequados para praticar o mesmo conceito

FORMATO DA RESPOSTA:
**Exercício 1:**
[Problema similar com números diferentes]

**Exercício 2:**
[Outro problema similar]

**Exercício 3:**
[Terceiro problema similar]

**Dica de Estudo:**
[Uma dica sobre como abordar este tipo de problema]

Certifique-se de que os exercícios sejam interessantes e realistas.`;
  }

  /**
   * Criar prompt para apenas a resposta
   */
  createAnswerOnlyPrompt(problem) {
    console.log('🚨 createAnswerOnlyPrompt chamada com:', problem);
    const prompt = `${problem}

  RESPOSTA FINAL (APENAS O RESULTADO):`;
    console.log('🚨 Prompt criado:', prompt);
    return prompt;
  }

  /**
   * Explicar problema matemático - APENAS RESPOSTA
   */
  async explainMathAnswerOnly(problem) {
    console.log('🚨🚨🚨 FUNÇÃO explainMathAnswerOnly CHAMADA!');
    console.log('🚨 Problem recebido:', problem);
    
    const prompt = this.createAnswerOnlyPrompt(problem);
    console.log('🚨 Prompt gerado:', prompt);
    
    const result = await this.generate(prompt);
    
    console.log(`📝 Problema respondido apenas: "${truncateText(problem)}" em ${result.elapsedTime}s`);
    
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
   * Explicar problema matemático - VERSÃO RESUMIDA
   */
  async explainMathBrief(problem) {
    const prompt = this.createMathBriefPrompt(problem);
    const result = await this.generate(prompt);
    
    console.log(`📝 Problema resumido: "${truncateText(problem)}" em ${result.elapsedTime}s`);
    
    return result;
  }

  /**
   * Explicar problema matemático - VERSÃO DETALHADA
   */
  async explainMath(problem) {
    const prompt = this.createMathPrompt(problem);
    const result = await this.generate(prompt);
    
    console.log(`📝 Problema detalhado: "${this.truncateText ? this.truncateText(problem) : problem.substring(0, 50)}..." em ${result.elapsedTime}s`);
    
    return result;
  }

  /**
   * Criar prompt para explicação RESUMIDA
   */
  createMathBriefPrompt(problem) {
    return `Você é um professor de matemática. Resolva este problema de forma RESUMIDA e DIRETA:

"${problem}"

FORMATO DA RESPOSTA (MÁXIMO 3 PARÁGRAFOS):

**Tipo:** [Identifique rapidamente o tipo de problema]

**Solução:** [Resolva de forma direta, sem muitos detalhes]

**Resposta:** [Destaque a resposta final claramente]

Seja conciso, direto e didático. Foque na solução prática.`;
  }

  /**
   * Criar prompt MELHORADO para explicação detalhada
   */
  createMathPrompt(problem) {
    return `Resolva este problema de matemática passo a passo: ${problem}`;
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
  async testeOlaMundo(problem) {
    console.log('🚨🚨🚨 testeOlaMundo MODIFICADO! Chamando Gemma para resposta apenas!');
    console.log('🚨 Problem recebido:', problem);
    
    // ✅ NOVO: Criar prompt específico para apenas resposta
    const prompt = `Resolva este problema de matemática e me dê APENAS a resposta final, sem explicações:

${problem}

RESPOSTA:`;
    
    console.log('🚨 Prompt para Gemma:', prompt);
    
    try {
      // ✅ NOVO: Chamar o Gemma de verdade
      const result = await this.generate(prompt, null, {
        temperature: 0.1, // Mais determinístico para respostas diretas
        top_p: 0.8
      });
      
      console.log('🚨 Resposta do Gemma:', result.response);
      
      // ✅ NOVO: Limpar a resposta (remover quebras de linha extras, etc.)
      const cleanResponse = result.response.trim().replace(/^(Resposta:|RESPOSTA:)/i, '').trim();
      
      const finalResult = {
        response: cleanResponse,
        elapsedTime: result.elapsedTime,
        model: this.model
      };
      
      console.log('🚨 Resultado final processado:', finalResult);
      return finalResult;
      
    } catch (error) {
      console.error('❌ Erro ao chamar Gemma:', error);
      
      // ✅ Fallback em caso de erro
      return {
        response: "Erro ao conectar com o Gemma. Verifique se o Ollama está rodando.",
        elapsedTime: 0,
        model: this.model
      };
    }
  }
}



// Instância singleton
const ollamaService = new OllamaService();

module.exports = ollamaService;