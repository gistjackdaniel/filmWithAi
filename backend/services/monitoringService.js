const mongoose = require('mongoose');
const os = require('os');

/**
 * 시스템 모니터링 서비스
 * 성능 모니터링, 알림 시스템, 로깅 관리
 */

class MonitoringService {
  constructor() {
    this.metrics = {
      system: {},
      database: {},
      api: {},
      errors: []
    };
    
    this.alerts = [];
    this.thresholds = {
      cpuUsage: 80, // CPU 사용률 임계값 (%)
      memoryUsage: 85, // 메모리 사용률 임계값 (%)
      diskUsage: 90, // 디스크 사용률 임계값 (%)
      responseTime: 5000, // API 응답 시간 임계값 (ms)
      errorRate: 5, // 에러율 임계값 (%)
      databaseConnections: 100 // 데이터베이스 연결 수 임계값
    };
    
    this.startMonitoring();
    console.log('✅ 모니터링 서비스 초기화 완료');
  }
  
  /**
   * 모니터링 시작
   */
  startMonitoring() {
    // 시스템 메트릭 수집 (30초마다)
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);
    
    // 데이터베이스 상태 확인 (1분마다)
    setInterval(() => {
      this.checkDatabaseHealth();
    }, 60000);
    
    // 알림 정리 (1시간마다)
    setInterval(() => {
      this.cleanupAlerts();
    }, 3600000);
  }
  
  /**
   * 시스템 메트릭 수집
   */
  collectSystemMetrics() {
    try {
      const cpuUsage = os.loadavg()[0] * 100; // 1분 평균
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const memoryUsage = ((totalMemory - freeMemory) / totalMemory) * 100;
      
      this.metrics.system = {
        cpuUsage: Math.round(cpuUsage),
        memoryUsage: Math.round(memoryUsage),
        totalMemory: totalMemory,
        freeMemory: freeMemory,
        uptime: os.uptime(),
        platform: os.platform(),
        hostname: os.hostname(),
        timestamp: new Date().toISOString()
      };
      
      // 임계값 체크
      this.checkThresholds('system', this.metrics.system);
      
    } catch (error) {
      console.error('❌ 시스템 메트릭 수집 실패:', error.message);
      this.logError('system_metrics_collection', error);
    }
  }
  
  /**
   * 데이터베이스 상태 확인
   */
  async checkDatabaseHealth() {
    try {
      const startTime = Date.now();
      
      // 데이터베이스 연결 상태 확인
      const dbState = mongoose.connection.readyState;
      const isConnected = dbState === 1;
      
      // 간단한 쿼리로 응답 시간 측정
      let responseTime = 0;
      if (isConnected) {
        const queryStart = Date.now();
        await mongoose.connection.db.admin().ping();
        responseTime = Date.now() - queryStart;
      }
      
      // 연결 풀 정보 (안전한 접근)
      let activeConnections = 0;
      let availableConnections = 0;
      
      try {
        const poolStats = mongoose.connection.db.serverConfig?.s?.pool;
        if (poolStats) {
          activeConnections = poolStats.size || 0;
          availableConnections = poolStats.available || 0;
        }
      } catch (error) {
        console.warn('연결 풀 정보 접근 실패:', error.message);
      }
      
      this.metrics.database = {
        isConnected,
        responseTime,
        activeConnections,
        availableConnections,
        totalConnections: activeConnections + availableConnections,
        timestamp: new Date().toISOString()
      };
      
      // 임계값 체크
      this.checkThresholds('database', this.metrics.database);
      
    } catch (error) {
      console.error('❌ 데이터베이스 상태 확인 실패:', error.message);
      this.logError('database_health_check', error);
      
      this.metrics.database = {
        isConnected: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  /**
   * API 성능 메트릭 기록
   * @param {string} endpoint - API 엔드포인트
   * @param {number} responseTime - 응답 시간 (ms)
   * @param {number} statusCode - HTTP 상태 코드
   */
  recordAPIMetric(endpoint, responseTime, statusCode) {
    try {
      if (!this.metrics.api[endpoint]) {
        this.metrics.api[endpoint] = {
          totalRequests: 0,
          totalResponseTime: 0,
          averageResponseTime: 0,
          statusCodes: {},
          lastRequest: null
        };
      }
      
      const metric = this.metrics.api[endpoint];
      metric.totalRequests++;
      metric.totalResponseTime += responseTime;
      metric.averageResponseTime = metric.totalResponseTime / metric.totalRequests;
      metric.statusCodes[statusCode] = (metric.statusCodes[statusCode] || 0) + 1;
      metric.lastRequest = new Date().toISOString();
      
      // 응답 시간 임계값 체크
      if (responseTime > this.thresholds.responseTime) {
        this.createAlert('high_response_time', {
          endpoint,
          responseTime,
          threshold: this.thresholds.responseTime
        });
      }
      
      // 에러 상태 코드 체크
      if (statusCode >= 400) {
        this.createAlert('api_error', {
          endpoint,
          statusCode,
          responseTime
        });
      }
      
    } catch (error) {
      console.error('❌ API 메트릭 기록 실패:', error.message);
    }
  }
  
  /**
   * 에러 로그 기록
   * @param {string} errorType - 에러 타입
   * @param {Error} error - 에러 객체
   */
  logError(errorType, error) {
    const errorLog = {
      type: errorType,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };
    
    this.metrics.errors.push(errorLog);
    
    // 에러 로그가 너무 많아지면 오래된 로그 제거
    if (this.metrics.errors.length > 1000) {
      this.metrics.errors = this.metrics.errors.slice(-500);
    }
    
    // 에러율 계산 및 임계값 체크
    this.checkErrorRate();
    
    console.error(`❌ ${errorType}:`, error.message);
  }
  
  /**
   * 임계값 체크
   * @param {string} metricType - 메트릭 타입
   * @param {Object} metrics - 메트릭 데이터
   */
  checkThresholds(metricType, metrics) {
    try {
      switch (metricType) {
        case 'system':
          if (metrics.cpuUsage > this.thresholds.cpuUsage) {
            this.createAlert('high_cpu_usage', {
              current: metrics.cpuUsage,
              threshold: this.thresholds.cpuUsage
            });
          }
          
          if (metrics.memoryUsage > this.thresholds.memoryUsage) {
            this.createAlert('high_memory_usage', {
              current: metrics.memoryUsage,
              threshold: this.thresholds.memoryUsage
            });
          }
          break;
          
        case 'database':
          if (!metrics.isConnected) {
            this.createAlert('database_disconnected', {
              state: 'disconnected'
            });
          }
          
          if (metrics.totalConnections > this.thresholds.databaseConnections) {
            this.createAlert('high_database_connections', {
              current: metrics.totalConnections,
              threshold: this.thresholds.databaseConnections
            });
          }
          
          if (metrics.responseTime > this.thresholds.responseTime) {
            this.createAlert('high_database_response_time', {
              current: metrics.responseTime,
              threshold: this.thresholds.responseTime
            });
          }
          break;
      }
    } catch (error) {
      console.error('❌ 임계값 체크 실패:', error.message);
    }
  }
  
  /**
   * 에러율 체크
   */
  checkErrorRate() {
    try {
      const recentErrors = this.metrics.errors.filter(error => 
        Date.now() - new Date(error.timestamp).getTime() < 5 * 60 * 1000 // 5분
      );
      
      const totalRequests = Object.values(this.metrics.api).reduce((sum, metric) => 
        sum + metric.totalRequests, 0
      );
      
      if (totalRequests > 0) {
        const errorRate = (recentErrors.length / totalRequests) * 100;
        
        if (errorRate > this.thresholds.errorRate) {
          this.createAlert('high_error_rate', {
            current: errorRate.toFixed(2),
            threshold: this.thresholds.errorRate,
            errorCount: recentErrors.length,
            totalRequests
          });
        }
      }
    } catch (error) {
      console.error('❌ 에러율 체크 실패:', error.message);
    }
  }
  
  /**
   * 알림 생성
   * @param {string} alertType - 알림 타입
   * @param {Object} data - 알림 데이터
   */
  createAlert(alertType, data) {
    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: alertType,
      data,
      severity: this.getAlertSeverity(alertType),
      timestamp: new Date().toISOString(),
      acknowledged: false
    };
    
    this.alerts.push(alert);
    
    // 알림이 너무 많아지면 오래된 알림 제거
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-50);
    }
    
    console.log(`🚨 알림 생성: ${alertType}`, data);
    
    // 심각한 알림은 즉시 로그
    if (alert.severity === 'critical') {
      console.error(`🚨 심각한 알림: ${alertType}`, data);
    }
  }
  
  /**
   * 알림 심각도 결정
   * @param {string} alertType - 알림 타입
   * @returns {string} 심각도 레벨
   */
  getAlertSeverity(alertType) {
    const criticalAlerts = [
      'database_disconnected',
      'high_error_rate',
      'system_crash'
    ];
    
    const warningAlerts = [
      'high_cpu_usage',
      'high_memory_usage',
      'high_response_time',
      'high_database_connections'
    ];
    
    if (criticalAlerts.includes(alertType)) {
      return 'critical';
    } else if (warningAlerts.includes(alertType)) {
      return 'warning';
    } else {
      return 'info';
    }
  }
  
  /**
   * 알림 정리 (오래된 알림 제거)
   */
  cleanupAlerts() {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    this.alerts = this.alerts.filter(alert => 
      new Date(alert.timestamp).getTime() > oneDayAgo
    );
    
    console.log(`🧹 알림 정리 완료: ${this.alerts.length}개 알림 유지`);
  }
  
  /**
   * 알림 확인 처리
   * @param {string} alertId - 알림 ID
   */
  acknowledgeAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = new Date().toISOString();
      console.log(`✅ 알림 확인: ${alertId}`);
    }
  }
  
  /**
   * 시스템 상태 요약 조회
   * @returns {Object} 시스템 상태
   */
  getSystemStatus() {
    const status = {
      system: this.metrics.system,
      database: this.metrics.database,
      api: this.metrics.api,
      alerts: {
        total: this.alerts.length,
        critical: this.alerts.filter(a => a.severity === 'critical').length,
        warning: this.alerts.filter(a => a.severity === 'warning').length,
        unacknowledged: this.alerts.filter(a => !a.acknowledged).length
      },
      errors: {
        total: this.metrics.errors.length,
        recent: this.metrics.errors.filter(e => 
          Date.now() - new Date(e.timestamp).getTime() < 60 * 60 * 1000 // 1시간
        ).length
      },
      timestamp: new Date().toISOString()
    };
    
    // 전체 상태 결정
    if (status.alerts.critical > 0) {
      status.overallStatus = 'critical';
    } else if (status.alerts.warning > 0) {
      status.overallStatus = 'warning';
    } else {
      status.overallStatus = 'healthy';
    }
    
    return status;
  }
  
  /**
   * 성능 리포트 생성
   * @returns {Object} 성능 리포트
   */
  generatePerformanceReport() {
    const report = {
      system: {
        cpuUsage: this.metrics.system.cpuUsage || 0,
        memoryUsage: this.metrics.system.memoryUsage || 0,
        uptime: this.metrics.system.uptime || 0
      },
      database: {
        isConnected: this.metrics.database.isConnected || false,
        responseTime: this.metrics.database.responseTime || 0,
        connections: this.metrics.database.totalConnections || 0
      },
      api: {
        totalEndpoints: Object.keys(this.metrics.api).length,
        totalRequests: Object.values(this.metrics.api).reduce((sum, metric) => 
          sum + metric.totalRequests, 0
        ),
        averageResponseTime: this.calculateAverageAPIResponseTime()
      },
      alerts: {
        total: this.alerts.length,
        bySeverity: {
          critical: this.alerts.filter(a => a.severity === 'critical').length,
          warning: this.alerts.filter(a => a.severity === 'warning').length,
          info: this.alerts.filter(a => a.severity === 'info').length
        }
      },
      recommendations: this.generateRecommendations(),
      timestamp: new Date().toISOString()
    };
    
    return report;
  }
  
  /**
   * 평균 API 응답 시간 계산
   * @returns {number} 평균 응답 시간 (ms)
   */
  calculateAverageAPIResponseTime() {
    const endpoints = Object.values(this.metrics.api);
    if (endpoints.length === 0) return 0;
    
    const totalResponseTime = endpoints.reduce((sum, metric) => 
      sum + metric.totalResponseTime, 0
    );
    const totalRequests = endpoints.reduce((sum, metric) => 
      sum + metric.totalRequests, 0
    );
    
    return totalRequests > 0 ? Math.round(totalResponseTime / totalRequests) : 0;
  }
  
  /**
   * 권장사항 생성
   * @returns {Array} 권장사항 목록
   */
  generateRecommendations() {
    const recommendations = [];
    
    // CPU 사용률 권장사항
    if (this.metrics.system.cpuUsage > 70) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message: 'CPU 사용률이 높습니다. 서버 리소스를 확장하거나 최적화를 고려하세요.',
        metric: 'cpu_usage',
        value: this.metrics.system.cpuUsage
      });
    }
    
    // 메모리 사용률 권장사항
    if (this.metrics.system.memoryUsage > 80) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message: '메모리 사용률이 높습니다. 메모리 확장이나 가비지 컬렉션 최적화를 고려하세요.',
        metric: 'memory_usage',
        value: this.metrics.system.memoryUsage
      });
    }
    
    // 데이터베이스 연결 권장사항
    if (this.metrics.database.totalConnections > 80) {
      recommendations.push({
        type: 'database',
        priority: 'medium',
        message: '데이터베이스 연결 수가 많습니다. 연결 풀 설정을 검토하세요.',
        metric: 'database_connections',
        value: this.metrics.database.totalConnections
      });
    }
    
    // 에러율 권장사항
    const recentErrors = this.metrics.errors.filter(e => 
      Date.now() - new Date(e.timestamp).getTime() < 60 * 60 * 1000 // 1시간
    );
    
    if (recentErrors.length > 10) {
      recommendations.push({
        type: 'reliability',
        priority: 'high',
        message: '최근 에러가 많이 발생했습니다. 로그를 확인하고 문제를 해결하세요.',
        metric: 'error_count',
        value: recentErrors.length
      });
    }
    
    return recommendations;
  }
  
  /**
   * 서비스 통계 정보 반환
   * @returns {Object} 서비스 통계
   */
  getStats() {
    return {
      metricsCollected: Object.keys(this.metrics).length,
      activeAlerts: this.alerts.filter(a => !a.acknowledged).length,
      totalErrors: this.metrics.errors.length,
      uptime: this.metrics.system.uptime || 0
    };
  }
}

module.exports = MonitoringService; 