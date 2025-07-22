const express = require('express');
const Group = require('../models/Group');
const RealLocation = require('../models/RealLocation');
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

// 프로젝트별 그룹 목록 조회
router.get('/:projectId/groups', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const groups = await Group.find({ projectId });
    res.json({ success: true, data: groups });
  } catch (error) {
    res.status(500).json({ success: false, message: '그룹 목록 조회 오류', error });
  }
});

// 그룹 생성
router.post('/:projectId/groups', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, address } = req.body;
    const group = await Group.create({ projectId, name, address });
    res.status(201).json({ success: true, data: group });
  } catch (error) {
    res.status(400).json({ success: false, message: '그룹 생성 오류', error });
  }
});

// 그룹 상세 조회
router.get('/:projectId/groups/:groupId', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: '그룹을 찾을 수 없습니다.' });
    res.json({ success: true, data: group });
  } catch (error) {
    res.status(500).json({ success: false, message: '그룹 상세 조회 오류', error });
  }
});

// 그룹 수정
router.put('/:projectId/groups/:groupId', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, address } = req.body;
    const group = await Group.findByIdAndUpdate(groupId, { name, address }, { new: true });
    if (!group) return res.status(404).json({ success: false, message: '그룹을 찾을 수 없습니다.' });
    res.json({ success: true, data: group });
  } catch (error) {
    res.status(400).json({ success: false, message: '그룹 수정 오류', error });
  }
});

// 그룹 삭제 (관련 realLocation의 groupId null 처리)
router.delete('/:projectId/groups/:groupId', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findByIdAndDelete(groupId);
    if (!group) return res.status(404).json({ success: false, message: '그룹을 찾을 수 없습니다.' });
    // 관련 realLocation의 groupId null 처리
    await RealLocation.updateMany({ groupId }, { $set: { groupId: null } });
    res.json({ success: true, message: '그룹 삭제 및 관련 장소 미분류 처리 완료' });
  } catch (error) {
    res.status(500).json({ success: false, message: '그룹 삭제 오류', error });
  }
});

module.exports = router; 