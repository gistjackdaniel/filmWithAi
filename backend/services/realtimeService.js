const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Project = require('../models/Project');
// const Conte = require('../models/Conte'); // Conte 모델이 없으므로 주석 처리

/**
 * 실시간 협업 서비스
 * Socket.io를 통한 실시간 프로젝트 동기화
 */

class RealtimeService {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? ['https://yourdomain.com'] 
          : ['http://localhost:3002', 'http://localhost:3000'],
        credentials: true
      }
    });
    
    this.activeUsers = new Map(); // userId -> socketId
    this.projectRooms = new Map(); // projectId -> Set of socketIds
    
    this.setupMiddleware();
    this.setupEventHandlers();
    
    console.log('✅ 실시간 협업 서비스 초기화 완료');
  }
  
  /**
   * Socket.io 미들웨어 설정
   * JWT 토큰 검증 및 사용자 인증
   */
  setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('인증 토큰이 필요합니다.'));
        }
        
        // JWT 토큰 검증
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        socket.userEmail = decoded.email;
        
        console.log(`🔗 사용자 연결: ${socket.userEmail} (${socket.id})`);
        next();
      } catch (error) {
        console.error('❌ Socket 인증 실패:', error.message);
        next(new Error('유효하지 않은 토큰입니다.'));
      }
    });
  }
  
  /**
   * Socket 이벤트 핸들러 설정
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`👤 사용자 연결됨: ${socket.userEmail} (${socket.id})`);
      
      // 사용자 활성 상태 관리
      this.activeUsers.set(socket.userId, socket.id);
      
      // 프로젝트 참여 이벤트
      socket.on('join-project', async (data) => {
        await this.handleJoinProject(socket, data);
      });
      
      // 프로젝트 나가기 이벤트
      socket.on('leave-project', (data) => {
        this.handleLeaveProject(socket, data);
      });
      
      // 콘티 업데이트 이벤트
      socket.on('conte-update', async (data) => {
        await this.handleConteUpdate(socket, data);
      });
      
      // 프로젝트 동기화 이벤트
      socket.on('project-sync', async (data) => {
        await this.handleProjectSync(socket, data);
      });
      
      // 실시간 편집 이벤트
      socket.on('edit-start', (data) => {
        this.handleEditStart(socket, data);
      });
      
      socket.on('edit-end', (data) => {
        this.handleEditEnd(socket, data);
      });
      
      // 타이핑 상태 이벤트
      socket.on('typing-start', (data) => {
        this.handleTypingStart(socket, data);
      });
      
      socket.on('typing-end', (data) => {
        this.handleTypingEnd(socket, data);
      });
      
      // 연결 해제 이벤트
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }
  
  /**
   * 프로젝트 참여 처리
   * @param {Socket} socket - 소켓 객체
   * @param {Object} data - 프로젝트 정보
   */
  async handleJoinProject(socket, data) {
    try {
      const { projectId } = data;
      
      // 프로젝트 존재 여부 및 권한 확인
      const project = await Project.findById(projectId);
      if (!project) {
        socket.emit('error', { message: '프로젝트를 찾을 수 없습니다.' });
        return;
      }
      
      // 프로젝트 소유권 확인
      if (project.userId.toString() !== socket.userId) {
        socket.emit('error', { message: '프로젝트에 대한 권한이 없습니다.' });
        return;
      }
      
      // 프로젝트 룸에 참여
      socket.join(`project-${projectId}`);
      
      // 프로젝트 룸 사용자 관리
      if (!this.projectRooms.has(projectId)) {
        this.projectRooms.set(projectId, new Set());
      }
      this.projectRooms.get(projectId).add(socket.id);
      
      // 다른 사용자들에게 참여 알림
      socket.to(`project-${projectId}`).emit('user-joined', {
        userId: socket.userId,
        userEmail: socket.userEmail,
        timestamp: new Date().toISOString()
      });
      
      console.log(`📁 프로젝트 참여: ${socket.userEmail} -> ${projectId}`);
      
      // 프로젝트 정보 전송
      socket.emit('project-joined', {
        projectId,
        projectTitle: project.projectTitle,
        activeUsers: Array.from(this.projectRooms.get(projectId)).length
      });
      
    } catch (error) {
      console.error('❌ 프로젝트 참여 실패:', error.message);
      socket.emit('error', { message: '프로젝트 참여 중 오류가 발생했습니다.' });
    }
  }
  
  /**
   * 프로젝트 나가기 처리
   * @param {Socket} socket - 소켓 객체
   * @param {Object} data - 프로젝트 정보
   */
  handleLeaveProject(socket, data) {
    const { projectId } = data;
    
    socket.leave(`project-${projectId}`);
    
    // 프로젝트 룸에서 사용자 제거
    if (this.projectRooms.has(projectId)) {
      this.projectRooms.get(projectId).delete(socket.id);
      
      // 룸이 비어있으면 제거
      if (this.projectRooms.get(projectId).size === 0) {
        this.projectRooms.delete(projectId);
      }
    }
    
    // 다른 사용자들에게 나가기 알림
    socket.to(`project-${projectId}`).emit('user-left', {
      userId: socket.userId,
      userEmail: socket.userEmail,
      timestamp: new Date().toISOString()
    });
    
    console.log(`🚪 프로젝트 나가기: ${socket.userEmail} <- ${projectId}`);
  }
  
  /**
   * 콘티 업데이트 처리
   * @param {Socket} socket - 소켓 객체
   * @param {Object} data - 콘티 업데이트 데이터
   */
  async handleConteUpdate(socket, data) {
    try {
      const { projectId, conteId, updates } = data;
      
      // 프로젝트 권한 확인
      const project = await Project.findById(projectId);
      if (!project || project.userId.toString() !== socket.userId) {
        socket.emit('error', { message: '프로젝트에 대한 권한이 없습니다.' });
        return;
      }
      
      // 콘티 업데이트
      const updatedConte = await Conte.findByIdAndUpdate(
        conteId,
        {
          ...updates,
          lastModified: new Date().toISOString(),
          modifiedBy: socket.userEmail
        },
        { new: true }
      );
      
      if (!updatedConte) {
        socket.emit('error', { message: '콘티를 찾을 수 없습니다.' });
        return;
      }
      
      // 프로젝트 룸의 다른 사용자들에게 업데이트 알림
      socket.to(`project-${projectId}`).emit('conte-updated', {
        conteId,
        updates: updatedConte,
        updatedBy: socket.userEmail,
        timestamp: new Date().toISOString()
      });
      
      console.log(`✏️ 콘티 업데이트: ${socket.userEmail} -> ${conteId}`);
      
    } catch (error) {
      console.error('❌ 콘티 업데이트 실패:', error.message);
      socket.emit('error', { message: '콘티 업데이트 중 오류가 발생했습니다.' });
    }
  }
  
  /**
   * 프로젝트 동기화 처리
   * @param {Socket} socket - 소켓 객체
   * @param {Object} data - 프로젝트 동기화 데이터
   */
  async handleProjectSync(socket, data) {
    try {
      const { projectId } = data;
      
      // 프로젝트 권한 확인
      const project = await Project.findById(projectId);
      if (!project || project.userId.toString() !== socket.userId) {
        socket.emit('error', { message: '프로젝트에 대한 권한이 없습니다.' });
        return;
      }
      
      // 최신 프로젝트 데이터 조회
      const contes = await Conte.find({ projectId }).sort({ order: 1 });
      
      // 프로젝트 룸의 모든 사용자에게 동기화 데이터 전송
      this.io.to(`project-${projectId}`).emit('project-synced', {
        projectId,
        project: {
          ...project.toObject(),
          contes: contes
        },
        syncedBy: socket.userEmail,
        timestamp: new Date().toISOString()
      });
      
      console.log(`🔄 프로젝트 동기화: ${socket.userEmail} -> ${projectId}`);
      
    } catch (error) {
      console.error('❌ 프로젝트 동기화 실패:', error.message);
      socket.emit('error', { message: '프로젝트 동기화 중 오류가 발생했습니다.' });
    }
  }
  
  /**
   * 편집 시작 처리
   * @param {Socket} socket - 소켓 객체
   * @param {Object} data - 편집 정보
   */
  handleEditStart(socket, data) {
    const { projectId, conteId, field } = data;
    
    // 다른 사용자들에게 편집 시작 알림
    socket.to(`project-${projectId}`).emit('edit-started', {
      conteId,
      field,
      editedBy: socket.userEmail,
      timestamp: new Date().toISOString()
    });
    
    console.log(`✏️ 편집 시작: ${socket.userEmail} -> ${conteId}.${field}`);
  }
  
  /**
   * 편집 종료 처리
   * @param {Socket} socket - 소켓 객체
   * @param {Object} data - 편집 정보
   */
  handleEditEnd(socket, data) {
    const { projectId, conteId, field } = data;
    
    // 다른 사용자들에게 편집 종료 알림
    socket.to(`project-${projectId}`).emit('edit-ended', {
      conteId,
      field,
      editedBy: socket.userEmail,
      timestamp: new Date().toISOString()
    });
    
    console.log(`✅ 편집 종료: ${socket.userEmail} -> ${conteId}.${field}`);
  }
  
  /**
   * 타이핑 시작 처리
   * @param {Socket} socket - 소켓 객체
   * @param {Object} data - 타이핑 정보
   */
  handleTypingStart(socket, data) {
    const { projectId, conteId } = data;
    
    // 다른 사용자들에게 타이핑 시작 알림
    socket.to(`project-${projectId}`).emit('typing-started', {
      conteId,
      typingBy: socket.userEmail,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * 타이핑 종료 처리
   * @param {Socket} socket - 소켓 객체
   * @param {Object} data - 타이핑 정보
   */
  handleTypingEnd(socket, data) {
    const { projectId, conteId } = data;
    
    // 다른 사용자들에게 타이핑 종료 알림
    socket.to(`project-${projectId}`).emit('typing-ended', {
      conteId,
      typingBy: socket.userEmail,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * 연결 해제 처리
   * @param {Socket} socket - 소켓 객체
   */
  handleDisconnect(socket) {
    console.log(`👋 사용자 연결 해제: ${socket.userEmail} (${socket.id})`);
    
    // 활성 사용자 목록에서 제거
    this.activeUsers.delete(socket.userId);
    
    // 모든 프로젝트 룸에서 제거
    for (const [projectId, socketIds] of this.projectRooms.entries()) {
      if (socketIds.has(socket.id)) {
        socketIds.delete(socket.id);
        
        // 룸이 비어있으면 제거
        if (socketIds.size === 0) {
          this.projectRooms.delete(projectId);
        }
        
        // 다른 사용자들에게 나가기 알림
        socket.to(`project-${projectId}`).emit('user-disconnected', {
          userId: socket.userId,
          userEmail: socket.userEmail,
          timestamp: new Date().toISOString()
        });
      }
    }
  }
  
  /**
   * 서비스 통계 정보 반환
   * @returns {Object} 서비스 통계
   */
  getStats() {
    return {
      activeUsers: this.activeUsers.size,
      activeProjects: this.projectRooms.size,
      totalConnections: this.io.engine.clientsCount
    };
  }
}

module.exports = RealtimeService; 