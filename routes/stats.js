// ExplicaAI - Routes de Estatísticas
// Dashboard e métricas do sistema

const express = require('express');
const router = express.Router();

const { asyncHandler, validateInput, checkDatabaseConnection } = require('../middleware/errorHandle');
const { successResponse, errorResponse } = require('../utils/helpers');

// Middleware para todas as rotas de stats
router.use(checkDatabaseConnection);

/**
 * GET /api/stats
 * Estatísticas gerais do dashboard
 */
router.get('/', asyncHandler(async (req, res) => {
  try {
    const dashboard = await req.db.Stats.getDashboard();
    
    res.json(successResponse({
      stats: dashboard
    }));
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas:', error.message);
    res.status(500).json(errorResponse(
      'Erro ao obter estatísticas',
      error.message,
      500
    ));
  }
}));

/**
 * GET /api/stats/general
 * Estatísticas gerais básicas
 */
router.get('/general', asyncHandler(async (req, res) => {
  try {
    const stats = await req.db.Stats.getGeneralStats();
    
    res.json(successResponse({
      stats
    }));
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas gerais:', error.message);
    res.status(500).json(errorResponse(
      'Erro ao obter estatísticas gerais',
      error.message,
      500
    ));
  }
}));

/**
 * GET /api/stats/activity
 * Atividade diária dos últimos dias
 */
router.get('/activity', asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  
  try {
    const activity = await req.db.Stats.getDailyActivity(Math.min(parseInt(days), 90));
    
    res.json(successResponse({
      activity,
      period: `${days} dias`
    }));
  } catch (error) {
    console.error('❌ Erro ao obter atividade:', error.message);
    res.status(500).json(errorResponse(
      'Erro ao obter atividade',
      error.message,
      500
    ));
  }
}));

/**
 * GET /api/stats/performance
 * Estatísticas de performance e tempo
 */
router.get('/performance', asyncHandler(async (req, res) => {
  try {
    const performance = await req.db.Stats.getPerformanceStats();
    
    res.json(successResponse({
      performance
    }));
  } catch (error) {
    console.error('❌ Erro ao obter performance:', error.message);
    res.status(500).json(errorResponse(
      'Erro ao obter performance',
      error.message,
      500
    ));
  }
}));

/**
 * GET /api/stats/top-tags
 * Tags mais utilizadas
 */
router.get('/top-tags', asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  
  try {
    const topTags = await req.db.Stats.getTopTags(Math.min(parseInt(limit), 20));
    
    res.json(successResponse({
      tags: topTags,
      count: topTags.length
    }));
  } catch (error) {
    console.error('❌ Erro ao obter top tags:', error.message);
    res.status(500).json(errorResponse(
      'Erro ao obter top tags',
      error.message,
      500
    ));
  }
}));

/**
 * GET /api/stats/weekly-progress
 * Progresso das últimas semanas
 */
router.get('/weekly-progress', asyncHandler(async (req, res) => {
  try {
    const progress = await req.db.Stats.getWeeklyProgress();
    
    res.json(successResponse({
      weeks: progress
    }));
  } catch (error) {
    console.error('❌ Erro ao obter progresso semanal:', error.message);
    res.status(500).json(errorResponse(
      'Erro ao obter progresso semanal',
      error.message,
      500
    ));
  }
}));

/**
 * GET /api/stats/study-patterns
 * Padrões de estudo (horários, dias da semana)
 */
router.get('/study-patterns', asyncHandler(async (req, res) => {
  try {
    const patterns = await req.db.Stats.getStudyPatterns();
    
    res.json(successResponse({
      patterns
    }));
  } catch (error) {
    console.error('❌ Erro ao obter padrões de estudo:', error.message);
    res.status(500).json(errorResponse(
      'Erro ao obter padrões de estudo',
      error.message,
      500
    ));
  }
}));

/**
 * GET /api/stats/productivity
 * Estatísticas de produtividade (hoje, semana, mês)
 */
router.get('/productivity', asyncHandler(async (req, res) => {
  try {
    const productivity = await req.db.Stats.getProductivityStats();
    
    res.json(successResponse({
      productivity
    }));
  } catch (error) {
    console.error('❌ Erro ao obter produtividade:', error.message);
    res.status(500).json(errorResponse(
      'Erro ao obter produtividade',
      error.message,
      500
    ));
  }
}));

/**
 * GET /api/stats/suggestions
 * Sugestões baseadas em estatísticas
 */
router.get('/suggestions', asyncHandler(async (req, res) => {
  try {
    const suggestions = await req.db.Stats.getSuggestions();
    
    res.json(successResponse({
      suggestions,
      count: suggestions.length
    }));
  } catch (error) {
    console.error('❌ Erro ao obter sugestões:', error.message);
    res.status(500).json(errorResponse(
      'Erro ao obter sugestões',
      error.message,
      500
    ));
  }
}));

/**
 * GET /api/stats/export
 * Exportar dados de estatísticas
 */
router.get('/export', asyncHandler(async (req, res) => {
  const { format = 'summary' } = req.query;
  
  try {
    const exportData = await req.db.Stats.exportData(format);
    
    if (format === 'download') {
      res.setHeader('Content-Disposition', 'attachment; filename="explicaai_stats.json"');
      res.setHeader('Content-Type', 'application/json');
      res.json(exportData);
    } else {
      res.json(successResponse({
        export: exportData,
        format
      }));
    }
  } catch (error) {
    console.error('❌ Erro ao exportar estatísticas:', error.message);
    res.status(500).json(errorResponse(
      'Erro ao exportar estatísticas',
      error.message,
      500
    ));
  }
}));

module.exports = router;