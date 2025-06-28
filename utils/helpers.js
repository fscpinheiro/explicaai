// ExplicaAI - Funções Auxiliares
// Utilitários gerais da aplicação

const fs = require('fs');
const path = require('path');

/**
 * Criar diretórios necessários para a aplicação
 */
const createDirectories = () => {
  const dirs = ['uploads', 'public'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Pasta criada: ${dir}/`);
    }
  });
};

/**
 * Validar se um texto é válido para problemas matemáticos
 */
const validateProblemText = (text) => {
  if (!text || typeof text !== 'string') {
    return { valid: false, error: 'Texto não fornecido ou inválido' };
  }
  
  const trimmed = text.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: 'Texto não pode estar vazio' };
  }
  
  if (trimmed.length > 1000) {
    return { valid: false, error: 'Texto deve ter no máximo 1000 caracteres' };
  }
  
  return { valid: true, text: trimmed };
};

/**
 * Limpar nome de arquivo para evitar problemas
 */
const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
};

/**
 * Gerar timestamp para logs
 */
const getTimestamp = () => {
  return new Date().toISOString();
};

/**
 * Calcular tempo decorrido em segundos
 */
const getElapsedTime = (startTime) => {
  return Math.round((Date.now() - startTime) / 1000);
};

/**
 * Formatar tempo para exibição
 */
const formatTime = (seconds) => {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
};

/**
 * Truncar texto para exibição em logs
 */
const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
};

/**
 * Remover arquivo de forma segura
 */
const safeFileRemoval = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Arquivo removido: ${path.basename(filePath)}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('⚠️ Erro ao remover arquivo:', error.message);
    return false;
  }
};

/**
 * Converter array de IDs para inteiros
 */
const parseIntArray = (arr) => {
  if (!Array.isArray(arr)) return [];
  return arr.map(id => parseInt(id)).filter(id => !isNaN(id));
};

/**
 * Validar se um array contém apenas números válidos
 */
const validateIdArray = (arr) => {
  if (!Array.isArray(arr)) {
    return { valid: false, error: 'Deve ser um array' };
  }
  
  const parsed = parseIntArray(arr);
  
  if (parsed.length !== arr.length) {
    return { valid: false, error: 'Array contém IDs inválidos' };
  }
  
  return { valid: true, ids: parsed };
};

/**
 * Gerar resposta padronizada de sucesso
 */
const successResponse = (data, message = null) => {
  const response = {
    success: true,
    ...data,
    timestamp: getTimestamp()
  };
  
  if (message) {
    response.message = message;
  }
  
  return response;
};

/**
 * Gerar resposta padronizada de erro
 */
const errorResponse = (error, message = null, statusCode = 500) => {
  return {
    success: false,
    error: error,
    message: message || error,
    timestamp: getTimestamp(),
    statusCode
  };
};

/**
 * Validar parâmetros obrigatórios
 */
const validateRequired = (obj, requiredFields) => {
  const missing = [];
  
  for (const field of requiredFields) {
    if (!obj[field] || (typeof obj[field] === 'string' && obj[field].trim() === '')) {
      missing.push(field);
    }
  }
  
  if (missing.length > 0) {
    return {
      valid: false,
      error: `Campos obrigatórios ausentes: ${missing.join(', ')}`
    };
  }
  
  return { valid: true };
};

/**
 * Escapar caracteres especiais para SQL LIKE
 */
const escapeLike = (text) => {
  if (!text) return '';
  return text.replace(/[%_]/g, '\\$&');
};

/**
 * Gerar cor aleatória em formato hex
 */
const generateRandomColor = () => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA'
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Gerar emoji aleatório para coleções
 */
const generateRandomIcon = () => {
  const icons = [
    '📚', '📖', '📝', '📊', '📐', '🔢', '📋', '📌',
    '🎯', '⭐', '🔥', '💡', '🧮', '📏', '📑', '🎨'
  ];
  
  return icons[Math.floor(Math.random() * icons.length)];
};

module.exports = {
  createDirectories,
  validateProblemText,
  sanitizeFilename,
  getTimestamp,
  getElapsedTime,
  formatTime,
  truncateText,
  safeFileRemoval,
  parseIntArray,
  validateIdArray,
  successResponse,
  errorResponse,
  validateRequired,
  escapeLike,
  generateRandomColor,
  generateRandomIcon
};