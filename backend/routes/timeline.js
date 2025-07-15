const express = require('express');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const Project = require('../models/Project');
const Conte = require('../models/Conte');

const router = express.Router();

/**
 * WebSocket 서버 인스턴스
 */
let wss = null;

/**
 * WebSocket 서버 초기화
 * @param {http.Server} server - HTTP 서버 인스턴스
 */
const initializeWebSocket = (server) => {
  wss = new WebSocket.Server({ 
    server,
    path: '/api/timeline/projects'
  });

  console.log('✅ WebSocket 서버 초기화 완료');

  wss.on('connection', (ws, req) => {
    console.log('🔌 WebSocket 클라이언트 연결됨');

    // URL에서 프로젝트 ID 추출
    const url = new URL(req.url, 'http://localhost');
    const projectId = url.pathname.split('/').pop();

    if (!projectId) {
      console.error('❌ 프로젝트 ID가 없습니다.');
      ws.close(1008, 'Project ID required');
      return;
    }

    console.log('📋 프로젝트 연결:', projectId);

    // 연결된 프로젝트 정보 저장
    ws.projectId = projectId;

    // 연결 성공 메시지 전송
    ws.send(JSON.stringify({
      type: 'connection_established',
      projectId: projectId,
      timestamp: new Date().toISOString()
    }));

    // 메시지 수신 처리
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        console.log('📨 WebSocket 메시지 수신:', data);

        switch (data.type) {
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
            break;

          case 'subscribe_updates':
            // 프로젝트 업데이트 구독
            ws.subscribed = true;
            ws.send(JSON.stringify({
              type: 'subscription_confirmed',
              projectId: projectId
            }));
            break;

          default:
            console.log('⚠️ 알 수 없는 메시지 타입:', data.type);
        }
      } catch (error) {
        console.error('❌ WebSocket 메시지 처리 오류:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: '메시지 처리 중 오류가 발생했습니다.'
        }));
      }
    });

    // 연결 해제 처리
    ws.on('close', (code, reason) => {
      console.log('🔌 WebSocket 연결 해제:', { code, reason: reason.toString() });
    });

    // 에러 처리
    ws.on('error', (error) => {
      console.error('❌ WebSocket 에러:', error);
    });
  });
};

/**
 * 프로젝트 업데이트 브로드캐스트
 * @param {string} projectId - 프로젝트 ID
 * @param {Object} updateData - 업데이트 데이터
 */
const broadcastProjectUpdate = (projectId, updateData) => {
  if (!wss) {
    console.warn('⚠️ WebSocket 서버가 초기화되지 않았습니다.');
    return;
  }

  wss.clients.forEach((client) => {
    if (client.projectId === projectId && client.subscribed && client.readyState === WebSocket.OPEN) {
      try {
        client.send(JSON.stringify({
          type: 'project_update',
          projectId: projectId,
          data: updateData,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        console.error('❌ WebSocket 메시지 전송 실패:', error);
      }
    }
  });
};

/**
 * 콘티 업데이트 브로드캐스트
 * @param {string} projectId - 프로젝트 ID
 * @param {Object} conteData - 콘티 데이터
 */
const broadcastConteUpdate = (projectId, conteData) => {
  if (!wss) {
    console.warn('⚠️ WebSocket 서버가 초기화되지 않았습니다.');
    return;
  }

  wss.clients.forEach((client) => {
    if (client.projectId === projectId && client.subscribed && client.readyState === WebSocket.OPEN) {
      try {
        client.send(JSON.stringify({
          type: 'conte_update',
          projectId: projectId,
          data: conteData,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        console.error('❌ WebSocket 메시지 전송 실패:', error);
      }
    }
  });
};

/**
 * WebSocket 상태 확인 API
 * GET /api/timeline/status
 */
router.get('/status', (req, res) => {
  if (!wss) {
    return res.json({
      success: false,
      message: 'WebSocket 서버가 초기화되지 않았습니다.'
    });
  }

  const connectedClients = Array.from(wss.clients).length;
  const projectConnections = {};

  wss.clients.forEach((client) => {
    if (client.projectId) {
      projectConnections[client.projectId] = (projectConnections[client.projectId] || 0) + 1;
    }
  });

  res.json({
    success: true,
    data: {
      connectedClients,
      projectConnections,
      serverTime: new Date().toISOString()
    }
  });
});

module.exports = {
  router,
  initializeWebSocket,
  broadcastProjectUpdate,
  broadcastConteUpdate
}; 