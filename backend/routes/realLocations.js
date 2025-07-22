const express = require('express');
const RealLocation = require('../models/RealLocation');
const Conte = require('../models/Conte');
const jwt = require('jsonwebtoken');

const router = express.Router();

/**
 * 사용자 인증 미들웨어 (conte.js 방식)
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: '액세스 토큰이 필요합니다.' 
      });
    }

    // JWT 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const User = require('../models/User');
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: '유효하지 않은 토큰입니다.' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('토큰 검증 오류:', error);
    return res.status(403).json({ 
      success: false, 
      message: '토큰이 유효하지 않습니다.' 
    });
  }
};

// 프로젝트별 realLocation 목록 조회
router.get('/:projectId/realLocations', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { groupId } = req.query;
    let realLocations;
    if (groupId) {
      realLocations = await RealLocation.find({ projectId, groupId });
    } else {
      realLocations = await RealLocation.find({ projectId });
    }
    res.json({ success: true, data: realLocations });
  } catch (error) {
    res.status(500).json({ success: false, message: '장소 목록 조회 오류', error });
  }
});

// realLocation 생성
router.post('/:projectId/realLocations', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, groupId } = req.body;
    const realLocation = await RealLocation.create({ projectId, name, groupId: groupId || null });
    res.status(201).json({ success: true, data: realLocation });
  } catch (error) {
    res.status(400).json({ success: false, message: '장소 생성 오류', error });
  }
});

// realLocation 상세 조회
router.get('/:projectId/realLocations/:realLocationId', authenticateToken, async (req, res) => {
  try {
    const { realLocationId } = req.params;
    const realLocation = await RealLocation.findById(realLocationId);
    if (!realLocation) return res.status(404).json({ success: false, message: '장소를 찾을 수 없습니다.' });
    res.json({ success: true, data: realLocation });
  } catch (error) {
    res.status(500).json({ success: false, message: '장소 상세 조회 오류', error });
  }
});

// realLocation 수정
router.put('/:projectId/realLocations/:realLocationId', authenticateToken, async (req, res) => {
  try {
    const { realLocationId } = req.params;
    const { name, groupId } = req.body;
    const realLocation = await RealLocation.findByIdAndUpdate(realLocationId, { name, groupId: groupId || null }, { new: true });
    if (!realLocation) return res.status(404).json({ success: false, message: '장소를 찾을 수 없습니다.' });
    res.json({ success: true, data: realLocation });
  } catch (error) {
    res.status(400).json({ success: false, message: '장소 수정 오류', error });
  }
});

// realLocation 삭제 (관련 conte의 keywords.realLocationId null 처리)
router.delete('/:projectId/realLocations/:realLocationId', authenticateToken, async (req, res) => {
  try {
    const { realLocationId } = req.params;
    const realLocation = await RealLocation.findByIdAndDelete(realLocationId);
    if (!realLocation) return res.status(404).json({ success: false, message: '장소를 찾을 수 없습니다.' });
    // 관련 conte의 keywords.realLocationId null 처리
    await Conte.updateMany({ 'keywords.realLocationId': realLocationId }, { $set: { 'keywords.realLocationId': null } });
    res.json({ success: true, message: '장소 삭제 및 관련 콘티 미분류 처리 완료' });
  } catch (error) {
    res.status(500).json({ success: false, message: '장소 삭제 오류', error });
  }
});

module.exports = router; 