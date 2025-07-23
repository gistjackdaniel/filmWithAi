const express = require('express');
const mongoose = require('mongoose');
const Schedule = require('../models/Schedule');
const Project = require('../models/Project');
const jwt = require('jsonwebtoken');
const axios = require('axios');

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

// AI 일일촬영계획표 생성 (OpenAI 연동)
router.post('/daily-shooting-plan/generate', async (req, res) => {
  const { prompt } = req.body;
  console.log('📝 [AI 일일촬영계획표 요청] 받은 프롬프트:', prompt);
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: '당신은 영화 촬영 현장의 전문가입니다. 아래 프롬프트를 바탕으로 실무적으로 유용한 영화 일일촬영계획표를 한국어로 작성하세요.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2000,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );
    const aiResponse = response.data.choices[0].message.content.trim();
    res.json({ result: aiResponse });
  } catch (error) {
    console.error('❌ OpenAI API 호출 오류:', error.message);
    res.json({ result: 'AI 생성 오류: ' + (error.response?.data?.error?.message || error.message) });
  }
});

module.exports = router; 