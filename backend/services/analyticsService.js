const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
const Conte = require('../models/Conte');

/**
 * 데이터 분석 서비스
 * 사용자 활동 로그 수집 및 통계 분석
 */

class AnalyticsService {
  constructor() {
    this.activityLogs = [];
    this.analyticsCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5분 캐시
  }
  
  /**
   * 사용자 활동 로그 기록
   * @param {Object} logData - 로그 데이터
   */
  logActivity(logData) {
    const log = {
      ...logData,
      timestamp: new Date().toISOString(),
      sessionId: logData.sessionId || this.generateSessionId(),
      userAgent: logData.userAgent || 'unknown',
      ipAddress: logData.ipAddress || 'unknown'
    };
    
    this.activityLogs.push(log);
    
    // 로그가 너무 많아지면 오래된 로그 제거
    if (this.activityLogs.length > 10000) {
      this.activityLogs = this.activityLogs.slice(-5000);
    }
    
    console.log(`📊 활동 로그: ${log.action} - ${log.userEmail || 'anonymous'}`);
  }
  
  /**
   * 세션 ID 생성
   * @returns {string} 세션 ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * 사용자별 활동 통계 분석
   * @param {string} userId - 사용자 ID
   * @returns {Object} 사용자 통계
   */
  async getUserAnalytics(userId) {
    const cacheKey = `user_${userId}`;
    const cached = this.analyticsCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    
    try {
      // 사용자 정보 조회
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }
      
      // 프로젝트 통계
      const projects = await Project.find({ userId });
      const projectStats = {
        total: projects.length,
        active: projects.filter(p => p.status === 'active').length,
        completed: projects.filter(p => p.status === 'completed').length,
        averageDuration: this.calculateAverageProjectDuration(projects)
      };
      
      // 콘티 통계
      const projectIds = projects.map(p => p._id);
      const contes = await Conte.find({ projectId: { $in: projectIds } });
      const conteStats = {
        total: contes.length,
        generatedVideo: contes.filter(c => c.type === 'generated_video').length,
        liveAction: contes.filter(c => c.type === 'live_action').length,
        averageDuration: this.calculateAverageConteDuration(contes)
      };
      
      // 활동 패턴 분석
      const userLogs = this.activityLogs.filter(log => log.userId === userId);
      const activityPatterns = this.analyzeActivityPatterns(userLogs);
      
      // AI 생성 패턴 분석
      const aiGenerationStats = this.analyzeAIGenerationPatterns(userLogs);
      
      const analytics = {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          joinedAt: user.createdAt
        },
        projects: projectStats,
        contes: conteStats,
        activity: activityPatterns,
        aiGeneration: aiGenerationStats,
        lastUpdated: new Date().toISOString()
      };
      
      // 캐시에 저장
      this.analyticsCache.set(cacheKey, {
        data: analytics,
        timestamp: Date.now()
      });
      
      return analytics;
      
    } catch (error) {
      console.error('❌ 사용자 분석 실패:', error.message);
      throw error;
    }
  }
  
  /**
   * 전체 시스템 통계 분석
   * @returns {Object} 시스템 통계
   */
  async getSystemAnalytics() {
    const cacheKey = 'system_analytics';
    const cached = this.analyticsCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    
    try {
      // 전체 사용자 통계
      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ isActive: true });
      
      // 전체 프로젝트 통계
      const totalProjects = await Project.countDocuments();
      const activeProjects = await Project.countDocuments({ status: 'active' });
      
      // 전체 콘티 통계
      const totalContes = await Conte.countDocuments();
      const generatedVideos = await Conte.countDocuments({ type: 'generated_video' });
      const liveActions = await Conte.countDocuments({ type: 'live_action' });
      
      // 활동 로그 분석
      const recentLogs = this.activityLogs.filter(log => 
        Date.now() - new Date(log.timestamp).getTime() < 24 * 60 * 60 * 1000 // 24시간
      );
      
      const systemStats = {
        users: {
          total: totalUsers,
          active: activeUsers,
          growthRate: this.calculateGrowthRate(recentLogs, 'user_registration')
        },
        projects: {
          total: totalProjects,
          active: activeProjects,
          averagePerUser: totalUsers > 0 ? (totalProjects / totalUsers).toFixed(2) : 0
        },
        contes: {
          total: totalContes,
          generatedVideo: generatedVideos,
          liveAction: liveActions,
          averagePerProject: totalProjects > 0 ? (totalContes / totalProjects).toFixed(2) : 0
        },
        activity: {
          totalActions: recentLogs.length,
          topActions: this.getTopActions(recentLogs),
          peakHours: this.getPeakActivityHours(recentLogs)
        },
        aiGeneration: {
          totalRequests: this.countAIGenerationRequests(recentLogs),
          successRate: this.calculateAISuccessRate(recentLogs),
          averageResponseTime: this.calculateAverageAIResponseTime(recentLogs)
        },
        lastUpdated: new Date().toISOString()
      };
      
      // 캐시에 저장
      this.analyticsCache.set(cacheKey, {
        data: systemStats,
        timestamp: Date.now()
      });
      
      return systemStats;
      
    } catch (error) {
      console.error('❌ 시스템 분석 실패:', error.message);
      throw error;
    }
  }
  
  /**
   * 프로젝트별 상세 통계
   * @param {string} projectId - 프로젝트 ID
   * @returns {Object} 프로젝트 통계
   */
  async getProjectAnalytics(projectId) {
    try {
      const project = await Project.findById(projectId);
      if (!project) {
        throw new Error('프로젝트를 찾을 수 없습니다.');
      }
      
      const contes = await Conte.find({ projectId });
      const projectLogs = this.activityLogs.filter(log => 
        log.projectId === projectId
      );
      
      const analytics = {
        project: {
          id: project._id,
          title: project.projectTitle,
          status: project.status,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt
        },
        contes: {
          total: contes.length,
          byType: {
            generatedVideo: contes.filter(c => c.type === 'generated_video').length,
            liveAction: contes.filter(c => c.type === 'live_action').length
          },
          byDuration: this.groupContesByDuration(contes),
          averageDuration: this.calculateAverageConteDuration(contes)
        },
        activity: {
          totalActions: projectLogs.length,
          actionBreakdown: this.getActionBreakdown(projectLogs),
          editingSessions: this.getEditingSessions(projectLogs),
          collaborationMetrics: this.getCollaborationMetrics(projectLogs)
        },
        keywords: this.analyzeProjectKeywords(contes),
        lastUpdated: new Date().toISOString()
      };
      
      return analytics;
      
    } catch (error) {
      console.error('❌ 프로젝트 분석 실패:', error.message);
      throw error;
    }
  }
  
  /**
   * 평균 프로젝트 기간 계산
   * @param {Array} projects - 프로젝트 배열
   * @returns {number} 평균 기간 (일)
   */
  calculateAverageProjectDuration(projects) {
    if (projects.length === 0) return 0;
    
    const durations = projects.map(project => {
      const created = new Date(project.createdAt);
      const updated = new Date(project.updatedAt);
      return (updated - created) / (1000 * 60 * 60 * 24); // 일 단위
    });
    
    return (durations.reduce((sum, duration) => sum + duration, 0) / durations.length).toFixed(1);
  }
  
  /**
   * 평균 콘티 기간 계산
   * @param {Array} contes - 콘티 배열
   * @returns {string} 평균 기간
   */
  calculateAverageConteDuration(contes) {
    if (contes.length === 0) return '0분';
    
    const durations = contes.map(conte => {
      const durationStr = conte.estimatedDuration || '5분';
      const minutes = parseInt(durationStr.match(/\d+/)[0]);
      return minutes;
    });
    
    const averageMinutes = durations.reduce((sum, minutes) => sum + minutes, 0) / durations.length;
    return `${Math.round(averageMinutes)}분`;
  }
  
  /**
   * 활동 패턴 분석
   * @param {Array} logs - 활동 로그
   * @returns {Object} 활동 패턴
   */
  analyzeActivityPatterns(logs) {
    const patterns = {
      totalActions: logs.length,
      actionTypes: {},
      hourlyDistribution: new Array(24).fill(0),
      dailyDistribution: new Array(7).fill(0),
      averageSessionDuration: 0
    };
    
    logs.forEach(log => {
      // 액션 타입별 카운트
      patterns.actionTypes[log.action] = (patterns.actionTypes[log.action] || 0) + 1;
      
      // 시간대별 분포
      const hour = new Date(log.timestamp).getHours();
      patterns.hourlyDistribution[hour]++;
      
      // 요일별 분포
      const day = new Date(log.timestamp).getDay();
      patterns.dailyDistribution[day]++;
    });
    
    return patterns;
  }
  
  /**
   * AI 생성 패턴 분석
   * @param {Array} logs - 활동 로그
   * @returns {Object} AI 생성 패턴
   */
  analyzeAIGenerationPatterns(logs) {
    const aiLogs = logs.filter(log => 
      log.action === 'ai_story_generation' || 
      log.action === 'ai_conte_generation' ||
      log.action === 'ai_image_generation'
    );
    
    return {
      totalRequests: aiLogs.length,
      byType: {
        story: aiLogs.filter(log => log.action === 'ai_story_generation').length,
        conte: aiLogs.filter(log => log.action === 'ai_conte_generation').length,
        image: aiLogs.filter(log => log.action === 'ai_image_generation').length
      },
      successRate: this.calculateAISuccessRate(aiLogs),
      averageResponseTime: this.calculateAverageAIResponseTime(aiLogs)
    };
  }
  
  /**
   * 성장률 계산
   * @param {Array} logs - 활동 로그
   * @param {string} actionType - 액션 타입
   * @returns {number} 성장률 (%)
   */
  calculateGrowthRate(logs, actionType) {
    const actionLogs = logs.filter(log => log.action === actionType);
    if (actionLogs.length < 2) return 0;
    
    const sortedLogs = actionLogs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const midPoint = Math.floor(sortedLogs.length / 2);
    
    const firstHalf = sortedLogs.slice(0, midPoint).length;
    const secondHalf = sortedLogs.slice(midPoint).length;
    
    if (firstHalf === 0) return 100;
    
    return ((secondHalf - firstHalf) / firstHalf * 100).toFixed(1);
  }
  
  /**
   * 상위 액션 조회
   * @param {Array} logs - 활동 로그
   * @returns {Array} 상위 액션 목록
   */
  getTopActions(logs) {
    const actionCounts = {};
    logs.forEach(log => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    });
    
    return Object.entries(actionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([action, count]) => ({ action, count }));
  }
  
  /**
   * 피크 활동 시간 조회
   * @param {Array} logs - 활동 로그
   * @returns {Array} 피크 시간 목록
   */
  getPeakActivityHours(logs) {
    const hourlyCounts = new Array(24).fill(0);
    logs.forEach(log => {
      const hour = new Date(log.timestamp).getHours();
      hourlyCounts[hour]++;
    });
    
    const maxCount = Math.max(...hourlyCounts);
    return hourlyCounts
      .map((count, hour) => ({ hour, count }))
      .filter(({ count }) => count === maxCount)
      .map(({ hour }) => hour);
  }
  
  /**
   * AI 생성 요청 수 계산
   * @param {Array} logs - 활동 로그
   * @returns {number} AI 요청 수
   */
  countAIGenerationRequests(logs) {
    return logs.filter(log => 
      log.action.includes('ai_') && 
      log.action.includes('generation')
    ).length;
  }
  
  /**
   * AI 성공률 계산
   * @param {Array} logs - 활동 로그
   * @returns {number} 성공률 (%)
   */
  calculateAISuccessRate(logs) {
    const aiLogs = logs.filter(log => log.action.includes('ai_'));
    if (aiLogs.length === 0) return 0;
    
    const successLogs = aiLogs.filter(log => log.success !== false);
    return ((successLogs.length / aiLogs.length) * 100).toFixed(1);
  }
  
  /**
   * 평균 AI 응답 시간 계산
   * @param {Array} logs - 활동 로그
   * @returns {number} 평균 응답 시간 (ms)
   */
  calculateAverageAIResponseTime(logs) {
    const aiLogs = logs.filter(log => 
      log.action.includes('ai_') && 
      log.responseTime
    );
    
    if (aiLogs.length === 0) return 0;
    
    const totalTime = aiLogs.reduce((sum, log) => sum + log.responseTime, 0);
    return Math.round(totalTime / aiLogs.length);
  }
  
  /**
   * 콘티를 기간별로 그룹화
   * @param {Array} contes - 콘티 배열
   * @returns {Object} 기간별 그룹
   */
  groupContesByDuration(contes) {
    const groups = {
      short: 0, // 1-3분
      medium: 0, // 4-7분
      long: 0 // 8분 이상
    };
    
    contes.forEach(conte => {
      const durationStr = conte.estimatedDuration || '5분';
      const minutes = parseInt(durationStr.match(/\d+/)[0]);
      
      if (minutes <= 3) groups.short++;
      else if (minutes <= 7) groups.medium++;
      else groups.long++;
    });
    
    return groups;
  }
  
  /**
   * 액션 분류 조회
   * @param {Array} logs - 활동 로그
   * @returns {Object} 액션 분류
   */
  getActionBreakdown(logs) {
    const breakdown = {};
    logs.forEach(log => {
      breakdown[log.action] = (breakdown[log.action] || 0) + 1;
    });
    return breakdown;
  }
  
  /**
   * 편집 세션 조회
   * @param {Array} logs - 활동 로그
   * @returns {Array} 편집 세션 목록
   */
  getEditingSessions(logs) {
    const editLogs = logs.filter(log => 
      log.action === 'conte_edit' || 
      log.action === 'project_edit'
    );
    
    // 세션별로 그룹화 (30분 간격)
    const sessions = [];
    let currentSession = [];
    
    editLogs.forEach(log => {
      if (currentSession.length === 0) {
        currentSession.push(log);
      } else {
        const lastLog = currentSession[currentSession.length - 1];
        const timeDiff = new Date(log.timestamp) - new Date(lastLog.timestamp);
        
        if (timeDiff <= 30 * 60 * 1000) { // 30분 이내
          currentSession.push(log);
        } else {
          if (currentSession.length > 0) {
            sessions.push(currentSession);
          }
          currentSession = [log];
        }
      }
    });
    
    if (currentSession.length > 0) {
      sessions.push(currentSession);
    }
    
    return sessions.map(session => ({
      startTime: session[0].timestamp,
      endTime: session[session.length - 1].timestamp,
      duration: new Date(session[session.length - 1].timestamp) - new Date(session[0].timestamp),
      actionCount: session.length
    }));
  }
  
  /**
   * 협업 메트릭 조회
   * @param {Array} logs - 활동 로그
   * @returns {Object} 협업 메트릭
   */
  getCollaborationMetrics(logs) {
    const collaborationLogs = logs.filter(log => 
      log.action === 'user_joined' || 
      log.action === 'user_left' ||
      log.action === 'conte_updated'
    );
    
    return {
      totalCollaborationEvents: collaborationLogs.length,
      uniqueCollaborators: new Set(collaborationLogs.map(log => log.userId)).size,
      averageCollaborationDuration: this.calculateAverageCollaborationDuration(collaborationLogs)
    };
  }
  
  /**
   * 평균 협업 기간 계산
   * @param {Array} logs - 협업 로그
   * @returns {number} 평균 기간 (분)
   */
  calculateAverageCollaborationDuration(logs) {
    const sessions = [];
    let currentSession = null;
    
    logs.forEach(log => {
      if (log.action === 'user_joined') {
        currentSession = {
          startTime: new Date(log.timestamp),
          userId: log.userId
        };
      } else if (log.action === 'user_left' && currentSession && currentSession.userId === log.userId) {
        currentSession.endTime = new Date(log.timestamp);
        sessions.push(currentSession);
        currentSession = null;
      }
    });
    
    if (sessions.length === 0) return 0;
    
    const totalDuration = sessions.reduce((sum, session) => {
      return sum + (session.endTime - session.startTime);
    }, 0);
    
    return Math.round(totalDuration / sessions.length / (1000 * 60)); // 분 단위
  }
  
  /**
   * 프로젝트 키워드 분석
   * @param {Array} contes - 콘티 배열
   * @returns {Object} 키워드 분석
   */
  analyzeProjectKeywords(contes) {
    const keywordCounts = {};
    
    contes.forEach(conte => {
      if (conte.keywords) {
        Object.entries(conte.keywords).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach(item => {
              const keyword = `${key}:${item}`;
              keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
            });
          } else if (typeof value === 'string') {
            const keyword = `${key}:${value}`;
            keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
          }
        });
      }
    });
    
    return {
      totalKeywords: Object.keys(keywordCounts).length,
      topKeywords: Object.entries(keywordCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([keyword, count]) => ({ keyword, count }))
    };
  }
  
  /**
   * 캐시 정리
   */
  clearCache() {
    this.analyticsCache.clear();
    console.log('🧹 분석 캐시 정리 완료');
  }
  
  /**
   * 서비스 통계 정보 반환
   * @returns {Object} 서비스 통계
   */
  getStats() {
    return {
      totalLogs: this.activityLogs.length,
      cacheSize: this.analyticsCache.size,
      lastCacheClear: new Date().toISOString()
    };
  }
}

module.exports = AnalyticsService; 