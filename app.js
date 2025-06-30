// ExplicaAI - Servidor Principal Refatorado
// Hackathon: Gemma 3n Impact Challenge

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Verificar se os arquivos de rotas existem antes de importar
let problemRoutes = null;
let collectionRoutes = null;

try {
  if (fs.existsSync('./routes/problems.js')) {
    problemRoutes = require('./routes/problems');
  }
} catch (error) {
  console.log('⚠️ Arquivo routes/problems.js não encontrado ou com erro');
}

try {
  if (fs.existsSync('./routes/collections.js')) {
    collectionRoutes = require('./routes/collections');
  }
} catch (error) {
  console.log('⚠️ Arquivo routes/collections.js não encontrado ou com erro');
}

// Import do Database
let Database = null;
try {
  Database = require('./database/index');
  console.log('✅ Database modular carregado');
} catch (error) {
  console.error('❌ Erro ao importar Database:', error.message);
}

// Import dos middlewares
let errorHandler = null;
try {
  if (fs.existsSync('./middleware/errorHandle.js')) {
    errorHandler = require('./middleware/errorHandle').errorHandler;
  }
} catch (error) {
  console.log('⚠️ Middleware errorHandle não encontrado');
}

// Import das funções auxiliares
let createDirectories = null;
try {
  if (fs.existsSync('./utils/helpers.js')) {
    const helpers = require('./utils/helpers');
    createDirectories = helpers.createDirectories;
  }
} catch (error) {
  console.log('⚠️ Helpers não encontrados');
  // Função básica de criar diretórios se helpers não existir
  createDirectories = () => {
    const dirs = ['uploads', 'public'];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Pasta criada: ${dir}/`);
      }
    });
  };
}

const app = express();
const port = process.env.PORT || 3000;

// Inicializar database se disponível
let db = null;
if (Database) {
  db = new Database();
}

console.log('🚀 Iniciando ExplicaAI...');

// Middlewares globais
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir arquivos estáticos
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Middleware de log para debug
app.use((req, res, next) => {
  console.log(`📍 ${req.method} ${req.path}`);
  next();
});

// Criar pastas necessárias
if (createDirectories) {
  createDirectories();
}

// Tornar database disponível para todas as rotas (se existir)
if (db) {
  app.use((req, res, next) => {
    req.db = db;
    next();
  });
}

// Route para página inicial
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

// Status geral da aplicação
app.get('/api/status', async (req, res) => {
  try {
    let ollamaStatus = false;
    
    // Verificar Ollama se o serviço existir
    try {
      if (fs.existsSync('./services/ollamaService.js')) {
        const ollamaService = require('./services/ollamaService');
        ollamaStatus = await ollamaService.checkStatus();
      }
    } catch (error) {
      console.log('⚠️ OllamaService não disponível');
    }
    
    res.json({
      status: 'ExplicaAI funcionando!',
      ollama: ollamaStatus ? 'online' : 'offline',
      model: 'gemma3n:e4b',
      database: db ? 'connected' : 'not available',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '2.0.0'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao verificar status',
      details: error.message
    });
  }
});

// Endpoint básico para explicar texto (fallback se routes não existirem)
app.post('/api/explain-text', async (req, res) => {
  const { problem, text } = req.body;
  const problemText = problem || text;
  
  if (!problemText) {
    return res.status(400).json({
      success: false,
      error: 'Texto do problema é obrigatório'
    });
  }

  try {
    // Verificar se OllamaService existe
    if (fs.existsSync('./services/ollamaService.js')) {
      const ollamaService = require('./services/ollamaService');
      const result = await ollamaService.generate(
        ollamaService.createMathPrompt(problemText)
      );
      
      res.json({
        success: true,
        explanation: result.response,
        processingTime: result.elapsedTime
      });
    } else {
      // Resposta simulada se OllamaService não existir
      res.json({
        success: true,
        explanation: `Explicação simulada para: ${problemText}\n\nPara ativar a IA real, configure o OllamaService.`,
        processingTime: 1
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Registrar rotas se existirem
if (problemRoutes) {
  app.use('/api/problems', problemRoutes);
  console.log('✅ Rotas de problemas carregadas');
} else {
  console.log('⚠️ Rotas de problemas não disponíveis');
}

if (collectionRoutes) {
  app.use('/api/collections', collectionRoutes);
  console.log('✅ Rotas de coleções carregadas');
} else {
  console.log('⚠️ Rotas de coleções não disponíveis');
}

// Middleware de tratamento de erros (deve ser o último)
if (errorHandler) {
  app.use(errorHandler);
} else {
  // Middleware de erro básico se errorHandle não existir
  app.use((error, req, res, next) => {
    console.error('❌ Erro:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  });
}

// Middleware 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint não encontrado',
    availableEndpoints: [
      'GET /api/status',
      'POST /api/explain-text',
      'GET /api/problems (se disponível)',
      'GET /api/collections (se disponível)'
    ]
  });
});

// Inicialização do servidor
const startServer = async () => {
  try {
    // Inicializar database se disponível
    if (db) {
      await db.init();
      console.log('🗄️ Database SQLite inicializado com sucesso!');
    } else {
      console.log('⚠️ Database não disponível');
    }
    
    // Verificar status do Ollama
    let ollamaStatus = false;
    try {
      if (fs.existsSync('./services/ollamaService.js')) {
        const ollamaService = require('./services/ollamaService');
        ollamaStatus = await ollamaService.checkStatus();
      }
    } catch (error) {
      console.log('⚠️ OllamaService não disponível');
    }
    
    app.listen(port, () => {
      console.log('='.repeat(60));
      console.log('🎯 ExplicaAI - Assistente de Matemática Offline v2.0');
      console.log('='.repeat(60));
      console.log(`🚀 Servidor rodando em: http://localhost:${port}`);
      console.log(`📚 Interface web: http://localhost:${port}`);
      console.log(`🔧 Status API: http://localhost:${port}/api/status`);
      console.log(`🤖 Ollama: ${ollamaStatus ? '✅ Online' : '❌ Offline'}`);
      console.log(`🗄️ Database: ${db ? '✅ SQLite conectado' : '⚠️ Não disponível'}`);
      console.log('='.repeat(60));
      
      if (!ollamaStatus) {
        console.log('⚠️  ATENÇÃO: Ollama não está rodando!');
        console.log('   Execute em outro terminal: ollama serve');
        console.log('   Depois: ollama run gemma3n:e4b');
      }
      
      console.log('📋 Status dos módulos:');
      console.log(`   📁 Routes: ${problemRoutes ? '✅' : '❌'} Problems, ${collectionRoutes ? '✅' : '❌'} Collections`);
      console.log(`   🛠️ Services: ${fs.existsSync('./services/ollamaService.js') ? '✅' : '❌'} OllamaService`);
      console.log(`   🗄️ Database: ${Database ? '✅' : '❌'} Database Models`);
      console.log(`   ⚙️ Middleware: ${errorHandler ? '✅' : '❌'} ErrorHandler`);
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
  if (db && db.close) {
    db.close();
  }
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('💥 Erro não capturado:', error);
  if (db && db.close) {
    db.close();
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Promise rejeitada:', reason);
  if (db && db.close) {
    db.close();
  }
  process.exit(1);
});

// Iniciar o servidor
startServer();

module.exports = app;