const express = require('express');
const mongoose = require('mongoose');
const Schedule = require('../models/Schedule');
const Project = require('../models/Project');
const jwt = require('jsonwebtoken');

const router = express.Router();

// 사용자 인증 미들웨어 (conte.js 방식)
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: '액세스 토큰이 필요합니다.' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const User = require('../models/User');
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ success: false, message: '유효하지 않은 토큰입니다.' });
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: '토큰이 유효하지 않습니다.' });
  }
};

// 프로젝트 권한 확인 미들웨어
const checkProjectAccess = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findOne({ _id: projectId, userId: req.user._id, isDeleted: false });
    if (!project) return res.status(404).json({ success: false, message: '프로젝트를 찾을 수 없습니다.' });
    req.project = project;
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: '프로젝트 권한 확인 중 오류가 발생했습니다.' });
  }
};

// POST /api/projects/:projectId/schedules (스케쥴 저장)
router.post('/:projectId/schedules', authenticateToken, checkProjectAccess, async (req, res) => {
  console.log('🔍 [POST schedules] req.body:', req.body);
  try {
    const { projectId } = req.params;
    const { days, createdAt } = req.body;
    if (!Array.isArray(days) || days.length === 0) {
      return res.status(400).json({ success: false, message: 'days 배열이 필요합니다.' });
    }
    const schedule = new Schedule({ projectId, days, createdAt: createdAt || new Date() });
    await schedule.save();
    res.status(201).json({ success: true, data: schedule });
  } catch (error) {
    res.status(500).json({ success: false, message: '스케쥴 저장 중 오류', error });
  }
});

// GET /api/projects/:projectId/schedules (최신 1개 조회)
router.get('/:projectId/schedules', authenticateToken, checkProjectAccess, async (req, res) => {
  try {
    const { projectId } = req.params;
    const schedule = await Schedule.findOne({ projectId }).sort({ createdAt: -1 });
    if (!schedule) {
      return res.status(404).json({ success: false, message: '스케쥴이 없습니다.' });
    }
    res.json({ success: true, data: schedule });
  } catch (error) {
    res.status(500).json({ success: false, message: '스케쥴 조회 오류', error });
  }
});

module.exports = router; 