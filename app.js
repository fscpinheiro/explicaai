// ExplicaAI - Servidor Principal Refatorado
// Hackathon: Gemma 3n Impact Challenge

const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('./database');

// Import das rotas
const problemRoutes = require('./routes/problems');
const collectionRoutes = require('./routes/collections');
const ocrRoutes = require('./routes/ocr');
const statsRoutes = require('./routes/stats');
const ollamaRoutes = require('./routes/ollama');

// Import dos middlewares
const errorHandler = require('./middleware/errorHandler');
const { createDirectories } = require('./utils/helpers');

const app = express();
const port = process.env.PORT || 3000;

// Inicializar database
const db = new Database();

console.log('🚀 Iniciando ExplicaAI...');

// Middlewares globais
app.use(cors());
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
createDirectories();

// Tornar database disponível para todas as rotas
app.use((req, res, next) => {
  req.db = db;
  next();
});

// Route para página inicial
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  console.log(`📄 Tentando servir: ${indexPath}`);
  
  if (require('fs').existsSync(indexPath)) {
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
    const ollamaService = require('./services/ollamaService');
    const ollamaRunning = await ollamaService.checkStatus();
    
    res.json({
      status: 'ExplicaAI funcionando!',
      ollama: ollamaRunning ? 'online' : 'offline',
      model: 'gemma3n:e4b',
      database: 'connected',
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

// Registrar rotas
app.use('/api/problems', problemRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/ollama', ollamaRoutes);

// Middleware de tratamento de erros (deve ser o último)
app.use(errorHandler);

// Middleware 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint não encontrado',
    availableEndpoints: [
      'GET /api/status',
      'GET /api/problems',
      'POST /api/problems',
      'GET /api/collections',
      'POST /api/collections',
      'POST /api/ocr/scan',
      'GET /api/stats',
      'POST /api/ollama/explain-text'
    ]
  });
});

// Inicialização do servidor
const startServer = async () => {
  try {
    // Inicializar database
    await db.init();
    console.log('🗄️ Database SQLite inicializado com sucesso!');
    
    // Verificar status do Ollama
    const ollamaService = require('./services/ollamaService');
    const ollamaStatus = await ollamaService.checkStatus();
    
    app.listen(port, () => {
      console.log('='.repeat(60));
      console.log('🎯 ExplicaAI - Assistente de Matemática Offline v2.0');
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
      
      console.log('📋 Arquitetura modular carregada:');
      console.log('   📁 /routes - Endpoints organizados');
      console.log('   🛠️ /services - Lógica de negócio');
      console.log('   🗄️ /database - Modelos de dados');
      console.log('   ⚙️ /middleware - Processamento de requests');
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

module.exports = app;