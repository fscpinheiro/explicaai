// ExplicaAI - Model de Estatísticas e Relatórios
// Dashboards e métricas avançadas

class Stats {
  constructor(database) {
    this.db = database;
  }

  /**
   * Estatísticas gerais do sistema
   */
  async getGeneralStats() {
    try {
      const [
        totalProblems,
        totalCollections,
        favoritesCount,
        todayProblems,
        weekProblems,
        avgDifficulty,
        totalSolveTime
      ] = await Promise.all([
        this.db.get('SELECT COUNT(*) as count FROM problems'),
        this.db.get('SELECT COUNT(*) as count FROM collections WHERE is_system = 0'),
        this.db.get('SELECT COUNT(*) as count FROM problems WHERE is_favorite = 1'),
        this.db.get('SELECT COUNT(*) as count FROM problems WHERE DATE(created_at) = DATE("now")'),
        this.db.get('SELECT COUNT(*) as count FROM problems WHERE created_at >= datetime("now", "-7 days")'),
        this.db.get('SELECT AVG(difficulty_level) as avg FROM problems'),
        this.db.get('SELECT SUM(solved_time) as total FROM problems WHERE solved_time IS NOT NULL')
      ]);

      // Status breakdown
      const statusBreakdown = await this.db.all(
        'SELECT status, COUNT(*) as count FROM problems GROUP BY status'
      );

      // Source breakdown
      const sourceBreakdown = await this.db.all(
        'SELECT source, COUNT(*) as count FROM problems GROUP BY source'
      );

      // Difficulty breakdown
      const difficultyBreakdown = await this.db.all(
        'SELECT difficulty_level, COUNT(*) as count FROM problems GROUP BY difficulty_level ORDER BY difficulty_level'
      );

      return {
        totals: {
          problems: totalProblems.count,
          collections: totalCollections.count,
          favorites: favoritesCount.count
        },
        activity: {
          today: todayProblems.count,
          thisWeek: weekProblems.count,
          avgDifficulty: Math.round((avgDifficulty.avg || 0) * 10) / 10,
          totalSolveTime: totalSolveTime.total || 0
        },
        breakdowns: {
          status: statusBreakdown,
          source: sourceBreakdown,
          difficulty: difficultyBreakdown
        }
      };
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas gerais:', error.message);
      throw error;
    }
  }

  /**
   * Coleções mais utilizadas
   */
  async getTopCollections(limit = 5) {
    try {
      return await this.db.all(
        `SELECT c.name, c.icon, c.color, COUNT(pc.problem_id) as count
         FROM collections c
         LEFT JOIN problem_collections pc ON c.id = pc.collection_id
         GROUP BY c.id
         ORDER BY count DESC, c.name ASC
         LIMIT ?`,
        [limit]
      );
    } catch (error) {
      console.error('❌ Erro ao obter top coleções:', error.message);
      throw error;
    }
  }

  /**
   * Atividade diária (últimos 30 dias)
   */
  async getDailyActivity(days = 30) {
    try {
      return await this.db.all(
        `SELECT 
           DATE(created_at) as date,
           COUNT(*) as problems_created,
           AVG(difficulty_level) as avg_difficulty,
           SUM(CASE WHEN source = 'text' THEN 1 ELSE 0 END) as text_problems,
           SUM(CASE WHEN source = 'ocr' THEN 1 ELSE 0 END) as ocr_problems
         FROM problems 
         WHERE created_at >= datetime('now', '-${days} days')
         GROUP BY DATE(created_at)
         ORDER BY date DESC`,
        []
      );
    } catch (error) {
      console.error('❌ Erro ao obter atividade diária:', error.message);
      throw error;
    }
  }

  /**
   * Estatísticas de performance
   */
  async getPerformanceStats() {
    try {
      const [
        avgSolveTime,
        fastestSolve,
        slowestSolve,
        totalSolved,
        efficiency
      ] = await Promise.all([
        this.db.get('SELECT AVG(solved_time) as avg FROM problems WHERE solved_time IS NOT NULL'),
        this.db.get('SELECT MIN(solved_time) as min FROM problems WHERE solved_time IS NOT NULL'),
        this.db.get('SELECT MAX(solved_time) as max FROM problems WHERE solved_time IS NOT NULL'),
        this.db.get('SELECT COUNT(*) as count FROM problems WHERE solved_time IS NOT NULL'),
        this.db.get(`
          SELECT 
            AVG(CASE WHEN difficulty_level <= 2 THEN solved_time END) as easy_avg,
            AVG(CASE WHEN difficulty_level >= 4 THEN solved_time END) as hard_avg
          FROM problems WHERE solved_time IS NOT NULL
        `)
      ]);

      return {
        averageSolveTime: Math.round(avgSolveTime.avg || 0),
        fastestSolve: fastestSolve.min || 0,
        slowestSolve: slowestSolve.max || 0,
        totalSolved: totalSolved.count,
        efficiency: {
          easyProblems: Math.round(efficiency.easy_avg || 0),
          hardProblems: Math.round(efficiency.hard_avg || 0)
        }
      };
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas de performance:', error.message);
      throw error;
    }
  }

  /**
   * Tags mais utilizadas
   */
  async getTopTags(limit = 10) {
    try {
      const problems = await this.db.all('SELECT tags FROM problems WHERE tags IS NOT NULL');
      const tagCount = new Map();

      problems.forEach(problem => {
        try {
          const tags = JSON.parse(problem.tags);
          tags.forEach(tag => {
            tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
          });
        } catch (e) {
          // Ignorar tags inválidas
        }
      });

      return Array.from(tagCount.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    } catch (error) {
      console.error('❌ Erro ao obter top tags:', error.message);
      throw error;
    }
  }

  /**
   * Relatório de progresso semanal
   */
  async getWeeklyProgress() {
    try {
      const weeks = [];
      for (let i = 0; i < 4; i++) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (i + 1) * 7);
        const endDate = new Date();
        endDate.setDate(endDate.getDate() - i * 7);

        const weekStats = await this.db.get(
          `SELECT 
             COUNT(*) as problems_solved,
             AVG(difficulty_level) as avg_difficulty,
             SUM(solved_time) as total_time,
             COUNT(DISTINCT DATE(created_at)) as active_days
           FROM problems 
           WHERE created_at >= ? AND created_at < ?`,
          [startDate.toISOString(), endDate.toISOString()]
        );

        weeks.push({
          week: i + 1,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          ...weekStats
        });
      }

      return weeks.reverse();
    } catch (error) {
      console.error('❌ Erro ao obter progresso semanal:', error.message);
      throw error;
    }
  }

  /**
   * Análise de padrões de estudo
   */
  async getStudyPatterns() {
    try {
      // Horários mais ativos
      const hourlyActivity = await this.db.all(
        `SELECT 
           strftime('%H', created_at) as hour,
           COUNT(*) as count
         FROM problems 
         GROUP BY strftime('%H', created_at)
         ORDER BY hour`
      );

      // Dias da semana mais ativos
      const weekdayActivity = await this.db.all(
        `SELECT 
           CASE strftime('%w', created_at)
             WHEN '0' THEN 'Domingo'
             WHEN '1' THEN 'Segunda'
             WHEN '2' THEN 'Terça'
             WHEN '3' THEN 'Quarta'
             WHEN '4' THEN 'Quinta'
             WHEN '5' THEN 'Sexta'
             WHEN '6' THEN 'Sábado'
           END as weekday,
           COUNT(*) as count
         FROM problems 
         GROUP BY strftime('%w', created_at)`
      );

      // Sequências de estudo
      const studyStreaks = await this.calculateStudyStreaks();

      return {
        hourlyActivity,
        weekdayActivity,
        studyStreaks
      };
    } catch (error) {
      console.error('❌ Erro ao obter padrões de estudo:', error.message);
      throw error;
    }
  }

  /**
   * Calcular sequências de dias estudando
   */
  async calculateStudyStreaks() {
    try {
      const dailyActivity = await this.db.all(
        `SELECT DISTINCT DATE(created_at) as study_date
         FROM problems 
         ORDER BY study_date DESC
         LIMIT 90`
      );

      if (dailyActivity.length === 0) {
        return { currentStreak: 0, longestStreak: 0, totalStudyDays: 0 };
      }

      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 1;
      
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      // Verificar se estudou hoje ou ontem para streak atual
      if (dailyActivity[0].study_date === today || dailyActivity[0].study_date === yesterday) {
        currentStreak = 1;
        
        for (let i = 1; i < dailyActivity.length; i++) {
          const currentDate = new Date(dailyActivity[i - 1].study_date);
          const prevDate = new Date(dailyActivity[i].study_date);
          const diffDays = (currentDate - prevDate) / (1000 * 60 * 60 * 24);
          
          if (diffDays === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }

      // Calcular maior sequência histórica
      for (let i = 1; i < dailyActivity.length; i++) {
        const currentDate = new Date(dailyActivity[i - 1].study_date);
        const prevDate = new Date(dailyActivity[i].study_date);
        const diffDays = (currentDate - prevDate) / (1000 * 60 * 60 * 24);
        
        if (diffDays === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);

      return {
        currentStreak,
        longestStreak,
        totalStudyDays: dailyActivity.length
      };
    } catch (error) {
      console.error('❌ Erro ao calcular sequências:', error.message);
      return { currentStreak: 0, longestStreak: 0, totalStudyDays: 0 };
    }
  }

  /**
   * Estatísticas de crescimento mensal
   */
  async getMonthlyGrowth() {
    try {
      return await this.db.all(
        `SELECT 
           strftime('%Y-%m', created_at) as month,
           COUNT(*) as problems_solved,
           AVG(difficulty_level) as avg_difficulty,
           COUNT(DISTINCT DATE(created_at)) as active_days,
           SUM(CASE WHEN is_favorite = 1 THEN 1 ELSE 0 END) as favorites_added
         FROM problems 
         WHERE created_at >= datetime('now', '-12 months')
         GROUP BY strftime('%Y-%m', created_at)
         ORDER BY month DESC`
      );
    } catch (error) {
      console.error('❌ Erro ao obter crescimento mensal:', error.message);
      throw error;
    }
  }

  /**
   * Análise de dificuldade progressiva
   */
  async getDifficultyProgression() {
    try {
      return await this.db.all(
        `SELECT 
           DATE(created_at) as date,
           AVG(difficulty_level) as avg_difficulty,
           MIN(difficulty_level) as min_difficulty,
           MAX(difficulty_level) as max_difficulty,
           COUNT(*) as problems_count
         FROM problems 
         WHERE created_at >= datetime('now', '-30 days')
         GROUP BY DATE(created_at)
         ORDER BY date ASC`
      );
    } catch (error) {
      console.error('❌ Erro ao obter progressão de dificuldade:', error.message);
      throw error;
    }
  }

  /**
   * Relatório de histórico de ações
   */
  async getActivityHistory(limit = 20) {
    try {
      return await this.db.all(
        `SELECT 
           h.action,
           h.created_at,
           h.details,
           p.text as problem_text
         FROM history_log h
         LEFT JOIN problems p ON h.problem_id = p.id
         ORDER BY h.created_at DESC
         LIMIT ?`,
        [limit]
      );
    } catch (error) {
      console.error('❌ Erro ao obter histórico:', error.message);
      throw error;
    }
  }

  /**
   * Dashboard completo
   */
  async getDashboard() {
    try {
      const [
        generalStats,
        topCollections,
        topTags,
        weeklyProgress,
        studyPatterns,
        performanceStats
      ] = await Promise.all([
        this.getGeneralStats(),
        this.getTopCollections(3),
        this.getTopTags(5),
        this.getWeeklyProgress(),
        this.getStudyPatterns(),
        this.getPerformanceStats()
      ]);

      return {
        general: generalStats,
        topCollections,
        topTags,
        weeklyProgress,
        studyPatterns,
        performance: performanceStats,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Erro ao gerar dashboard:', error.message);
      throw error;
    }
  }

  /**
   * Estatísticas de produtividade
   */
  async getProductivityStats() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const thisWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const thisMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [todayStats, weekStats, monthStats] = await Promise.all([
        this.db.get(
          `SELECT 
             COUNT(*) as problems,
             AVG(difficulty_level) as avg_difficulty,
             SUM(solved_time) as total_time
           FROM problems 
           WHERE DATE(created_at) = ?`,
          [today]
        ),
        this.db.get(
          `SELECT 
             COUNT(*) as problems,
             AVG(difficulty_level) as avg_difficulty,
             SUM(solved_time) as total_time,
             COUNT(DISTINCT DATE(created_at)) as active_days
           FROM problems 
           WHERE created_at >= ?`,
          [thisWeek]
        ),
        this.db.get(
          `SELECT 
             COUNT(*) as problems,
             AVG(difficulty_level) as avg_difficulty,
             SUM(solved_time) as total_time,
             COUNT(DISTINCT DATE(created_at)) as active_days
           FROM problems 
           WHERE created_at >= ?`,
          [thisMonth]
        )
      ]);

      return {
        today: {
          problems: todayStats.problems || 0,
          avgDifficulty: Math.round((todayStats.avg_difficulty || 0) * 10) / 10,
          totalTime: todayStats.total_time || 0
        },
        thisWeek: {
          problems: weekStats.problems || 0,
          avgDifficulty: Math.round((weekStats.avg_difficulty || 0) * 10) / 10,
          totalTime: weekStats.total_time || 0,
          activeDays: weekStats.active_days || 0
        },
        thisMonth: {
          problems: monthStats.problems || 0,
          avgDifficulty: Math.round((monthStats.avg_difficulty || 0) * 10) / 10,
          totalTime: monthStats.total_time || 0,
          activeDays: monthStats.active_days || 0
        }
      };
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas de produtividade:', error.message);
      throw error;
    }
  }

  /**
   * Ranking de categorias por performance
   */
  async getCategoryRanking() {
    try {
      const collections = await this.db.all(
        `SELECT 
           c.name,
           c.icon,
           c.color,
           COUNT(pc.problem_id) as total_problems,
           AVG(p.difficulty_level) as avg_difficulty,
           AVG(p.solved_time) as avg_solve_time,
           SUM(CASE WHEN p.is_favorite = 1 THEN 1 ELSE 0 END) as favorites
         FROM collections c
         LEFT JOIN problem_collections pc ON c.id = pc.collection_id
         LEFT JOIN problems p ON pc.problem_id = p.id
         WHERE c.is_system = 1
         GROUP BY c.id
         HAVING total_problems > 0
         ORDER BY total_problems DESC, avg_difficulty DESC`
      );

      return collections.map(collection => ({
        ...collection,
        avg_difficulty: Math.round((collection.avg_difficulty || 0) * 10) / 10,
        avg_solve_time: Math.round(collection.avg_solve_time || 0)
      }));
    } catch (error) {
      console.error('❌ Erro ao obter ranking de categorias:', error.message);
      throw error;
    }
  }

  /**
   * Sugestões baseadas em estatísticas
   */
  async getSuggestions() {
    try {
      const suggestions = [];

      // Verificar atividade recente
      const recentActivity = await this.db.get(
        'SELECT COUNT(*) as count FROM problems WHERE created_at >= datetime("now", "-3 days")'
      );

      if (recentActivity.count === 0) {
        suggestions.push({
          type: 'activity',
          priority: 'high',
          message: 'Que tal resolver alguns problemas? Você não estuda há 3 dias!',
          action: 'practice'
        });
      }

      // Verificar dificuldade
      const avgDifficulty = await this.db.get(
        'SELECT AVG(difficulty_level) as avg FROM problems WHERE created_at >= datetime("now", "-7 days")'
      );

      if (avgDifficulty.avg && avgDifficulty.avg < 2.5) {
        suggestions.push({
          type: 'challenge',
          priority: 'medium',
          message: 'Você tem dominado problemas fáceis. Que tal tentar algo mais desafiador?',
          action: 'increase_difficulty'
        });
      }

      // Verificar coleções vazias
      const emptyCollections = await this.db.get(
        `SELECT COUNT(*) as count 
         FROM collections c 
         LEFT JOIN problem_collections pc ON c.id = pc.collection_id 
         WHERE pc.collection_id IS NULL AND c.is_system = 0`
      );

      if (emptyCollections.count > 0) {
        suggestions.push({
          type: 'organization',
          priority: 'low',
          message: `Você tem ${emptyCollections.count} coleção(ões) vazia(s). Que tal organizá-las?`,
          action: 'organize_collections'
        });
      }

      return suggestions;
    } catch (error) {
      console.error('❌ Erro ao gerar sugestões:', error.message);
      return [];
    }
  }

  /**
   * Exportar dados para relatório
   */
  async exportData(format = 'summary') {
    try {
      if (format === 'detailed') {
        return {
          dashboard: await this.getDashboard(),
          monthlyGrowth: await this.getMonthlyGrowth(),
          difficultyProgression: await this.getDifficultyProgression(),
          categoryRanking: await this.getCategoryRanking(),
          productivity: await this.getProductivityStats()
        };
      }

      return await this.getDashboard();
    } catch (error) {
      console.error('❌ Erro ao exportar dados:', error.message);
      throw error;
    }
  }
}

module.exports = Stats;