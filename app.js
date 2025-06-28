// ExplicaAI - API Principal
// Backend Node.js + Express integrado com Ollama + Gemma 3n + SQLite
// Hackathon: Gemma 3n Impact Challenge

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Database = require('./database');

const app = express();
const port = process.env.PORT || 3000;

// Inicializar database
const db = new Database();

console.log('🚀 Iniciando ExplicaAI...');

// Configuração do multer para upload de imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    cb(null, `math_${timestamp}${extension}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas (JPEG, PNG, GIF)'));
    }
  }
});

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir arquivos estáticos (frontend)
app.use(express.static('public'));
console.log('📁 Servindo arquivos estáticos da pasta public/');

// Servir arquivos da pasta uploads (para o frontend acessar imagens)
app.use('/uploads', express.static('uploads'));

// Middleware de log para debug
app.use((req, res, next) => {
  console.log(`📍 ${req.method} ${req.path}`);
  next();
});

// Criar pastas necessárias
const createDirectories = () => {
  const dirs = ['uploads', 'public'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Pasta criada: ${dir}/`);
    }
  });
};

createDirectories();

// Função para verificar se Ollama está rodando
const checkOllamaStatus = async () => {
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch('http://localhost:11434');
    const text = await response.text();
    return text.includes('Ollama is running');
  } catch (error) {
    return false;
  }
};

// Função para chamar Ollama com error handling robusto
const callOllama = async (prompt, imagePath = null) => {
  const fetch = (await import('node-fetch')).default;
  
  const requestBody = {
    model: 'gemma3n:e4b',
    prompt: prompt,
    stream: false,
    options: {
      temperature: 0.3, // Mais determinístico para matemática
      top_p: 0.9,
      top_k: 40
    }
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
    
    const response = await fetch('http://localhost:11434/api/generate', {
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
    const endTime = Date.now();
    
    console.log(`✅ Resposta recebida em ${endTime - startTime}ms`);
    
    if (!data.response) {
      throw new Error('Resposta vazia do modelo');
    }
    
    return data.response;
  } catch (error) {
    console.error('❌ Erro ao chamar Ollama:', error.message);
    if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      throw new Error('Timeout - o modelo está demorando muito para responder. Tente reiniciar o Ollama.');
    }
    throw new Error(`Erro na comunicação com IA: ${error.message}`);
  }
};

// Prompts otimizados baseados nos testes
const createMathPrompt = (problem) => {
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
};

const createSimilarPrompt = (originalProblem) => {
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
};

// ENDPOINTS DA API

// Route para página inicial (fallback)
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  console.log(`📄 Tentando servir: ${indexPath}`);
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({
      error: 'Arquivo index.html não encontrado',
      path: indexPath,
      suggestion: 'Verifique se o arquivo public/index.html existe'
    });
  }
});

// Status da aplicação e Ollama
app.get('/api/status', async (req, res) => {
  try {
    const ollamaRunning = await checkOllamaStatus();
    
    res.json({
      status: 'ExplicaAI funcionando!',
      ollama: ollamaRunning ? 'online' : 'offline',
      model: 'gemma3n:e4b',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao verificar status',
      details: error.message
    });
  }
});

// Explicar problema digitado
app.post('/api/explain-text', async (req, res) => {
  try {
    const { problem, autoSave = false, collectionIds = [] } = req.body;
    
    if (!problem || problem.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Problema não fornecido',
        message: 'Por favor, digite um problema de matemática para resolver.'
      });
    }

    if (problem.length > 1000) {
      return res.status(400).json({
        error: 'Problema muito longo',
        message: 'O problema deve ter no máximo 1000 caracteres.'
      });
    }

    // Verificar se Ollama está rodando
    const ollamaStatus = await checkOllamaStatus();
    if (!ollamaStatus) {
      return res.status(503).json({
        error: 'Serviço indisponível',
        message: 'O Ollama não está rodando. Execute: ollama serve'
      });
    }

    const startTime = Date.now();
    const prompt = createMathPrompt(problem.trim());
    const explanation = await callOllama(prompt);
    const solvedTime = Math.round((Date.now() - startTime) / 1000);
    
    let savedProblem = null;
    
    // Salvar automaticamente se solicitado
    if (autoSave) {
      try {
        const category = await db.categorizeProblem(problem);
        const tags = [category.category.toLowerCase().replace(' ', '-')];

        const problemId = await db.saveProblem({
          text: problem.trim(),
          explanation,
          source: 'text',
          difficulty: 1,
          solvedTime,
          tags
        });

        // Adicionar às coleções especificadas
        for (const collectionId of collectionIds) {
          await db.addProblemToCollection(problemId, collectionId);
        }

        // Auto-categorização se não especificou coleções
        if (collectionIds.length === 0 && category.confidence > 0.6) {
          const suggestedCollection = await db.get("SELECT id FROM collections WHERE name = ?", [category.category]);
          if (suggestedCollection) {
            await db.addProblemToCollection(problemId, suggestedCollection.id);
          }
        }

        savedProblem = await db.getProblem(problemId);
        console.log(`💾 Problema auto-salvo: "${problem.substring(0, 50)}..."`);
      } catch (saveError) {
        console.error('⚠️ Erro ao auto-salvar:', saveError.message);
        // Continuar mesmo se falhar o salvamento
      }
    }
    
    console.log(`✅ Problema resolvido: "${problem.substring(0, 50)}..." em ${solvedTime}s`);
    
    res.json({
      success: true,
      problem: problem.trim(),
      explanation: explanation,
      timestamp: new Date().toISOString(),
      processingTime: `${solvedTime}s`,
      saved: !!savedProblem,
      savedProblem: savedProblem
    });

  } catch (error) {
    console.error('❌ Erro em explain-text:', error.message);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message,
      suggestion: 'Verifique se o Ollama está rodando: ollama serve'
    });
  }
});

// OCR da imagem (retorna apenas o texto detectado)
app.post('/api/ocr-scan', upload.single('image'), async (req, res) => {
  let imagePath = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'Imagem não fornecida',
        message: 'Por favor, envie uma imagem com o problema de matemática.'
      });
    }

    imagePath = req.file.path;
    console.log(`📷 Imagem recebida para OCR: ${req.file.filename}`);

    // Retornar informações da imagem para o frontend processar com Tesseract
    res.json({
      success: true,
      filename: req.file.filename,
      imagePath: `/uploads/${req.file.filename}`,
      message: 'Imagem recebida. Use Tesseract.js no frontend para OCR.',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro em ocr-scan:', error.message);
    res.status(500).json({ 
      error: 'Erro ao processar imagem',
      message: error.message
    });
  }
  // NÃO remover arquivo - será usado pelo frontend
});

// Explicar texto confirmado (após OCR)
app.post('/api/explain-confirmed', async (req, res) => {
  try {
    const { confirmedText, originalImage, autoSave = false, collectionIds = [] } = req.body;
    
    if (!confirmedText || confirmedText.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Texto não fornecido',
        message: 'Por favor, confirme ou corrija o texto detectado pelo OCR.'
      });
    }

    // Verificar se Ollama está rodando
    const ollamaStatus = await checkOllamaStatus();
    if (!ollamaStatus) {
      return res.status(503).json({
        error: 'Serviço indisponível',
        message: 'O Ollama não está rodando. Execute: ollama serve'
      });
    }

    const startTime = Date.now();
    const prompt = createMathPrompt(confirmedText.trim());
    const explanation = await callOllama(prompt);
    const solvedTime = Math.round((Date.now() - startTime) / 1000);
    
    let savedProblem = null;
    
    // Salvar automaticamente se solicitado
    if (autoSave) {
      try {
        const category = await db.categorizeProblem(confirmedText);
        const tags = [category.category.toLowerCase().replace(' ', '-'), 'ocr'];

        const problemId = await db.saveProblem({
          text: confirmedText.trim(),
          explanation,
          source: 'ocr',
          difficulty: 1,
          solvedTime,
          tags
        });

        // Adicionar às coleções especificadas
        for (const collectionId of collectionIds) {
          await db.addProblemToCollection(problemId, collectionId);
        }

        savedProblem = await db.getProblem(problemId);
        console.log(`💾 Problema OCR auto-salvo: "${confirmedText.substring(0, 50)}..."`);
      } catch (saveError) {
        console.error('⚠️ Erro ao auto-salvar OCR:', saveError.message);
      }
    }
    
    console.log(`✅ Texto confirmado resolvido: "${confirmedText.substring(0, 50)}..." em ${solvedTime}s`);
    
    res.json({
      success: true,
      originalText: confirmedText.trim(),
      explanation: explanation,
      timestamp: new Date().toISOString(),
      source: 'OCR + confirmação do usuário',
      processingTime: `${solvedTime}s`,
      saved: !!savedProblem,
      savedProblem: savedProblem
    });

    // Limpar arquivo da imagem após processamento
    if (originalImage) {
      const imagePath = path.join('uploads', path.basename(originalImage));
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
          console.log(`🗑️ Arquivo removido após confirmação: ${path.basename(imagePath)}`);
        } catch (cleanupError) {
          console.error('⚠️ Erro ao remover arquivo:', cleanupError.message);
        }
      }
    }

  } catch (error) {
    console.error('❌ Erro em explain-confirmed:', error.message);
    res.status(500).json({ 
      error: 'Erro ao processar texto confirmado',
      message: error.message
    });
  }
});

// Gerar exercícios similares
app.post('/api/generate-similar', async (req, res) => {
  try {
    const { originalProblem } = req.body;
    
    if (!originalProblem || originalProblem.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Problema original não fornecido',
        message: 'Por favor, forneça um problema base para gerar exercícios similares.'
      });
    }

    // Verificar se Ollama está rodando
    const ollamaStatus = await checkOllamaStatus();
    if (!ollamaStatus) {
      return res.status(503).json({
        error: 'Serviço indisponível',
        message: 'O Ollama não está rodando. Execute: ollama serve'
      });
    }

    const prompt = createSimilarPrompt(originalProblem.trim());
    const similarProblems = await callOllama(prompt);
    
    console.log(`✅ Exercícios similares gerados para: "${originalProblem.substring(0, 50)}..."`);
    
    res.json({
      success: true,
      originalProblem: originalProblem.trim(),
      similarProblems: similarProblems,
      timestamp: new Date().toISOString(),
      count: 3
    });

  } catch (error) {
    console.error('❌ Erro em generate-similar:', error.message);
    res.status(500).json({ 
      error: 'Erro ao gerar exercícios similares',
      message: error.message
    });
  }
});

// Salvar problema resolvido
app.post('/api/problems/save', async (req, res) => {
  try {
    const { text, explanation, source = 'text', difficulty = 1, solvedTime = null, collectionIds = [] } = req.body;
    
    if (!text || !explanation) {
      return res.status(400).json({ 
        error: 'Dados incompletos',
        message: 'Texto do problema e explicação são obrigatórios.'
      });
    }

    // Auto-categorização
    const category = await db.categorizeProblem(text);
    const tags = [category.category.toLowerCase().replace(' ', '-')];

    // Salvar problema
    const problemId = await db.saveProblem({
      text: text.trim(),
      explanation,
      source,
      difficulty,
      solvedTime,
      tags
    });

    // Adicionar às coleções especificadas
    for (const collectionId of collectionIds) {
      await db.addProblemToCollection(problemId, collectionId);
    }

    // Se não especificou coleções, sugerir categoria automática
    if (collectionIds.length === 0 && category.confidence > 0.6) {
      const suggestedCollection = await db.get("SELECT id FROM collections WHERE name = ?", [category.category]);
      if (suggestedCollection) {
        await db.addProblemToCollection(problemId, suggestedCollection.id);
      }
    }

    const savedProblem = await db.getProblem(problemId);
    
    console.log(`💾 Problema salvo: "${text.substring(0, 50)}..."`);
    
    res.json({
      success: true,
      problem: savedProblem,
      suggestion: category,
      message: 'Problema salvo com sucesso!'
    });

  } catch (error) {
    console.error('❌ Erro ao salvar problema:', error.message);
    res.status(500).json({ 
      error: 'Erro ao salvar problema',
      message: error.message
    });
  }
});

// Listar problemas
app.get('/api/problems', async (req, res) => {
  try {
    const { 
      favorite, 
      status, 
      search, 
      collectionId, 
      limit = 20,
      page = 1 
    } = req.query;

    const filters = {};
    if (favorite === 'true') filters.favorite = true;
    if (status) filters.status = status;
    if (search) filters.search = search;
    if (collectionId) filters.collectionId = parseInt(collectionId);
    if (limit) filters.limit = parseInt(limit);

    const problems = await db.getProblems(filters);
    
    res.json({
      success: true,
      problems,
      total: problems.length,
      page: parseInt(page)
    });

  } catch (error) {
    console.error('❌ Erro ao listar problemas:', error.message);
    res.status(500).json({ 
      error: 'Erro ao listar problemas',
      message: error.message
    });
  }
});

// Buscar problema específico
app.get('/api/problems/:id', async (req, res) => {
  try {
    const problem = await db.getProblem(req.params.id);
    
    if (!problem) {
      return res.status(404).json({
        error: 'Problema não encontrado',
        message: 'O problema solicitado não existe.'
      });
    }
    
    res.json({
      success: true,
      problem
    });

  } catch (error) {
    console.error('❌ Erro ao buscar problema:', error.message);
    res.status(500).json({ 
      error: 'Erro ao buscar problema',
      message: error.message
    });
  }
});

// Toggle favorito
app.put('/api/problems/:id/favorite', async (req, res) => {
  try {
    const isFavorite = await db.toggleFavorite(req.params.id);
    
    res.json({
      success: true,
      isFavorite,
      message: isFavorite ? 'Adicionado aos favoritos!' : 'Removido dos favoritos!'
    });

  } catch (error) {
    console.error('❌ Erro ao alterar favorito:', error.message);
    res.status(500).json({ 
      error: 'Erro ao alterar favorito',
      message: error.message
    });
  }
});

// Listar coleções
app.get('/api/collections', async (req, res) => {
  try {
    const collections = await db.getCollections();
    
    res.json({
      success: true,
      collections
    });

  } catch (error) {
    console.error('❌ Erro ao listar coleções:', error.message);
    res.status(500).json({ 
      error: 'Erro ao listar coleções',
      message: error.message
    });
  }
});

// Criar nova coleção
app.post('/api/collections', async (req, res) => {
  try {
    const { name, description, color, icon } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Nome obrigatório',
        message: 'O nome da coleção é obrigatório.'
      });
    }

    const collectionId = await db.createCollection({
      name: name.trim(),
      description: description || '',
      color: color || '#4A90E2',
      icon: icon || '📚'
    });

    const collection = await db.get('SELECT * FROM collections WHERE id = ?', [collectionId]);
    
    res.json({
      success: true,
      collection,
      message: `Coleção '${name}' criada com sucesso!`
    });

  } catch (error) {
    console.error('❌ Erro ao criar coleção:', error.message);
    
    if (error.message.includes('UNIQUE constraint')) {
      res.status(400).json({ 
        error: 'Coleção já existe',
        message: 'Já existe uma coleção com este nome.'
      });
    } else {
      res.status(500).json({ 
        error: 'Erro ao criar coleção',
        message: error.message
      });
    }
  }
});

// Buscar problemas de uma coleção
app.get('/api/collections/:id/problems', async (req, res) => {
  try {
    const problems = await db.getCollectionProblems(req.params.id);
    const collection = await db.get('SELECT * FROM collections WHERE id = ?', [req.params.id]);
    
    if (!collection) {
      return res.status(404).json({
        error: 'Coleção não encontrada',
        message: 'A coleção solicitada não existe.'
      });
    }
    
    res.json({
      success: true,
      collection,
      problems,
      total: problems.length
    });

  } catch (error) {
    console.error('❌ Erro ao buscar problemas da coleção:', error.message);
    res.status(500).json({ 
      error: 'Erro ao buscar problemas da coleção',
      message: error.message
    });
  }
});

// Adicionar problema à coleção
app.post('/api/problems/:problemId/collections/:collectionId', async (req, res) => {
  try {
    await db.addProblemToCollection(req.params.problemId, req.params.collectionId);
    
    res.json({
      success: true,
      message: 'Problema adicionado à coleção!'
    });

  } catch (error) {
    console.error('❌ Erro ao adicionar à coleção:', error.message);
    res.status(500).json({ 
      error: 'Erro ao adicionar à coleção',
      message: error.message
    });
  }
});

// Remover problema da coleção
app.delete('/api/problems/:problemId/collections/:collectionId', async (req, res) => {
  try {
    await db.removeProblemFromCollection(req.params.problemId, req.params.collectionId);
    
    res.json({
      success: true,
      message: 'Problema removido da coleção!'
    });

  } catch (error) {
    console.error('❌ Erro ao remover da coleção:', error.message);
    res.status(500).json({ 
      error: 'Erro ao remover da coleção',
      message: error.message
    });
  }
});

// Histórico de atividades
app.get('/api/history', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const history = await db.getHistory(parseInt(limit));
    
    res.json({
      success: true,
      history,
      total: history.length
    });

  } catch (error) {
    console.error('❌ Erro ao buscar histórico:', error.message);
    res.status(500).json({ 
      error: 'Erro ao buscar histórico',
      message: error.message
    });
  }
});

// Estatísticas gerais
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await db.getStats();
    
    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error.message);
    res.status(500).json({ 
      error: 'Erro ao buscar estatísticas',
      message: error.message
    });
  }
});

// Endpoint para testar conectividade
app.get('/api/test-ollama', async (req, res) => {
  try {
    const isRunning = await checkOllamaStatus();
    
    if (!isRunning) {
      return res.status(503).json({
        status: 'Ollama offline',
        message: 'Execute: ollama serve',
        instructions: [
          '1. Abra um terminal',
          '2. Execute: ollama serve', 
          '3. Em outro terminal: ollama run gemma3n:e4b',
          '4. Teste novamente esta API'
        ]
      });
    }

    // Teste simples com o modelo
    const testPrompt = 'Resolva: 2 + 2 = ?';
    const response = await callOllama(testPrompt);
    
    res.json({
      status: 'Ollama online',
      model: 'gemma3n:e4b',
      testResult: response,
      message: 'Sistema funcionando perfeitamente!'
    });

  } catch (error) {
    res.status(500).json({
      status: 'Erro no teste',
      error: error.message,
      suggestion: 'Verifique se o modelo gemma3n:e4b está baixado: ollama pull gemma3n:e4b'
    });
  }
});

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
  console.error('❌ Erro não tratado:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'Arquivo muito grande',
        message: 'A imagem deve ter no máximo 5MB'
      });
    }
  }
  
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: 'Algo deu errado. Tente novamente.'
  });
});

// Middleware 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint não encontrado',
    availableEndpoints: [
      'GET /api/status',
      'POST /api/explain-text',
      'POST /api/ocr-scan',
      'POST /api/explain-confirmed',
      'POST /api/generate-similar',
      'POST /api/problems/save',
      'GET /api/problems',
      'GET /api/collections',
      'GET /api/stats',
      'GET /api/test-ollama'
    ]
  });
});

// Inicialização do servidor
const startServer = async () => {
  try {
    // Inicializar database
    await db.init();
    console.log('🗄️ Database SQLite inicializado com sucesso!');
    
    // Verificar se Ollama está rodando na inicialização
    const ollamaStatus = await checkOllamaStatus();
    
    app.listen(port, () => {
      console.log('='.repeat(60));
      console.log('🎯 ExplicaAI - Assistente de Matemática Offline');
      console.log('='.repeat(60));
      console.log(`🚀 Servidor rodando em: http://localhost:${port}`);
      console.log(`📚 Interface web: http://localhost:${port}`);
      console.log(`🔧 Status API: http://localhost:${port}/api/status`);
      console.log(`🤖 Ollama: ${ollamaStatus ? '✅ Online' : '❌ Offline'}`);
      console.log(`🗄️ Database: ✅ SQLite conectado`);
      console.log('='.repeat(60));
      
      if (!ollamaStatus) {
        console.log('⚠️  ATENÇÃO: Ollama não está rodando!');
        console.log('   Execute em outro terminal: ollama serve');
        console.log('   Depois: ollama run gemma3n:e4b');
      }
      
      console.log('📋 APIs disponíveis:');
      console.log('   🤖 POST /api/explain-text - Explicar problema');
      console.log('   📷 POST /api/explain-confirmed - Explicar após OCR');
      console.log('   💾 POST /api/problems/save - Salvar problema');
      console.log('   📚 GET /api/collections - Listar coleções');
      console.log('   📊 GET /api/stats - Estatísticas');
      console.log('='.repeat(60));
    });
  } catch (error) {
    console.error('❌ Erro ao inicializar servidor:', error);
    process.exit(1);
  }
};

// Tratamento de sinais do sistema
process.on('SIGINT', () => {
  console.log('\n👋 Encerrando ExplicaAI...');
  db.close();
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('💥 Erro não capturado:', error);
  db.close();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Promise rejeitada:', reason);
  db.close();
  process.exit(1);
});

// Iniciar o servidor
startServer();
      