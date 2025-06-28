// ExplicaAI - Middleware de Tratamento de Erros
// Centraliza o tratamento de todos os erros da aplicação

const multer = require('multer');
const { errorResponse, getTimestamp } = require('../utils/helpers');

/**
 * Middleware principal de tratamento de erros
 * Deve ser registrado por último no app.js
 */
const errorHandler = (error, req, res, next) => {
  console.error('❌ Erro capturado pelo middleware:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: getTimestamp()
  });

  // Erro de upload de arquivo (Multer)
  if (error instanceof multer.MulterError) {
    return handleMulterError(error, res);
  }

  // Erro de validação personalizado
  if (error.name === 'ValidationError') {
    return res.status(400).json(errorResponse(
      'Dados inválidos',
      error.message,
      400
    ));
  }

  // Erro de database (SQLite)
  if (error.code && error.code.startsWith('SQLITE_')) {
    return handleDatabaseError(error, res);
  }

  // Erro de timeout
  if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
    return res.status(504).json(errorResponse(
      'Timeout',
      'A operação demorou muito para ser concluída. Tente novamente.',
      504
    ));
  }

  // Erro de conexão com Ollama
  if (error.message.includes('Ollama') || error.message.includes('11434')) {
    return res.status(503).json(errorResponse(
      'Serviço indisponível',
      'Ollama não está respondendo. Verifique se está rodando.',
      503
    ));
  }

  // Erro genérico
  return res.status(500).json(errorResponse(
    'Erro interno do servidor',
    process.env.NODE_ENV === 'development' ? error.message : 'Algo deu errado. Tente novamente.',
    500
  ));
};

/**
 * Tratar erros específicos do Multer (upload de arquivos)
 */
const handleMulterError = (error, res) => {
  switch (error.code) {
    case 'LIMIT_FILE_SIZE':
      return res.status(400).json(errorResponse(
        'Arquivo muito grande',
        'A imagem deve ter no máximo 5MB',
        400
      ));
    
    case 'LIMIT_UNEXPECTED_FILE':
      return res.status(400).json(errorResponse(
        'Arquivo inesperado',
        'Apenas um arquivo por vez é permitido',
        400
      ));
    
    case 'LIMIT_FILE_COUNT':
      return res.status(400).json(errorResponse(
        'Muitos arquivos',
        'Apenas um arquivo por vez é permitido',
        400
      ));
    
    default:
      return res.status(400).json(errorResponse(
        'Erro no upload',
        error.message,
        400
      ));
  }
};

/**
 * Tratar erros específicos do SQLite
 */
const handleDatabaseError = (error, res) => {
  console.error('🗄️ Erro de database:', error);

  switch (error.code) {
    case 'SQLITE_CONSTRAINT_UNIQUE':
      return res.status(409).json(errorResponse(
        'Registro já existe',
        'Já existe um item com esses dados',
        409
      ));
    
    case 'SQLITE_CONSTRAINT_FOREIGN_KEY':
      return res.status(400).json(errorResponse(
        'Referência inválida',
        'O item referenciado não existe',
        400
      ));
    
    case 'SQLITE_CONSTRAINT_NOT_NULL':
      return res.status(400).json(errorResponse(
        'Campo obrigatório',
        'Alguns campos obrigatórios não foram preenchidos',
        400
      ));
    
    case 'SQLITE_BUSY':
      return res.status(503).json(errorResponse(
        'Database ocupado',
        'Tente novamente em alguns segundos',
        503
      ));
    
    default:
      return res.status(500).json(errorResponse(
        'Erro de database',
        'Erro interno do banco de dados',
        500
      ));
  }
};

/**
 * Middleware para capturar erros assíncronos
 * Wrapper para funções async nos routes
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Middleware de validação de entrada
 */
const validateInput = (schema) => {
  return (req, res, next) => {
    try {
      // Validação básica baseada no schema fornecido
      const errors = [];
      
      if (schema.required) {
        for (const field of schema.required) {
          if (!req.body[field]) {
            errors.push(`Campo '${field}' é obrigatório`);
          }
        }
      }
      
      if (schema.maxLength) {
        for (const [field, maxLen] of Object.entries(schema.maxLength)) {
          if (req.body[field] && req.body[field].length > maxLen) {
            errors.push(`Campo '${field}' deve ter no máximo ${maxLen} caracteres`);
          }
        }
      }
      
      if (errors.length > 0) {
        const validationError = new Error(errors.join(', '));
        validationError.name = 'ValidationError';
        throw validationError;
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware para verificar se o Ollama está rodando
 */
const checkOllamaStatus = async (req, res, next) => {
  try {
    const ollamaService = require('../services/ollamaService');
    const isRunning = await ollamaService.checkStatus();
    
    if (!isRunning) {
      return res.status(503).json(errorResponse(
        'Ollama offline',
        'Execute: ollama serve',
        503
      ));
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware para log de requests
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log da request
  console.log(`📥 ${req.method} ${req.path}`, {
    body: req.method !== 'GET' ? req.body : undefined,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    timestamp: getTimestamp()
  });
  
  // Log da response quando finalizar
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode >= 400 ? '❌' : '✅';
    
    console.log(`📤 ${status} ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
};

/**
 * Middleware para verificar se o database está conectado
 */
const checkDatabaseConnection = (req, res, next) => {
  if (!req.db || !req.db.db) {
    return res.status(503).json(errorResponse(
      'Database desconectado',
      'Erro de conexão com o banco de dados',
      503
    ));
  }
  
  next();
};

module.exports = {
  errorHandler,
  asyncHandler,
  validateInput,
  checkOllamaStatus,
  requestLogger,
  checkDatabaseConnection
};