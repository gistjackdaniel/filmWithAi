const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');
const crypto = require('crypto');

/**
 * JWT 토큰 인증 미들웨어
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '인증 토큰이 필요합니다.'
      });
    }

    // 간단한 토큰 검증 (실제로는 JWT 검증 필요)
    // 여기서는 임시로 토큰이 존재하는지만 확인
    // 실제 사용자 ID 사용 (로그에서 확인된 ID)
    req.user = { id: '6879b7ddfe6d6b7ef2b55f7e' }; // 실제 사용자 ID
    next();
  } catch (error) {
    console.error('토큰 인증 오류:', error);
    return res.status(401).json({
      success: false,
      message: '유효하지 않은 토큰입니다.'
    });
  }
};

/**
 * 콘티 데이터의 해시값 생성
 * @param {Array} conteData - 콘티 데이터 배열
 * @returns {string} 해시값
 */
const generateConteDataHash = (conteData) => {
  const dataString = JSON.stringify(conteData.map(conte => ({
    scene: conte.scene,
    title: conte.title,
    estimatedDuration: conte.estimatedDuration,
    keywords: conte.keywords,
    virtualLocationId: conte.virtualLocationId
  })));
  return crypto.createHash('md5').update(dataString).digest('hex');
};

/**
 * 스케줄 조회
 * GET /api/schedules/:projectId
 */
router.get('/:projectId', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const schedule = await Schedule.findOne({ 
      projectId, 
      userId 
    }).populate('projectId', 'projectTitle');

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: '스케줄을 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    console.error('스케줄 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '스케줄 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 스케줄 저장/업데이트
 * POST /api/schedules/:projectId
 */
router.post('/:projectId', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;
    const { scheduleData, conteData } = req.body;

    if (!scheduleData || !conteData) {
      return res.status(400).json({
        success: false,
        message: '스케줄 데이터와 콘티 데이터가 필요합니다.'
      });
    }

    // 콘티 데이터 해시 생성
    const conteDataHash = generateConteDataHash(conteData);

    // 기존 스케줄 확인
    let existingSchedule = await Schedule.findOne({ 
      projectId, 
      userId 
    });

    if (existingSchedule) {
      // 콘티 데이터가 변경되었는지 확인
      if (existingSchedule.conteDataHash === conteDataHash) {
        return res.json({
          success: true,
          data: existingSchedule,
          message: '기존 스케줄을 사용합니다.'
        });
      }

      // 콘티 데이터가 변경되었으면 스케줄 업데이트
      existingSchedule.totalDays = scheduleData.totalDays;
      existingSchedule.totalScenes = scheduleData.totalScenes;
      existingSchedule.estimatedTotalDuration = scheduleData.estimatedTotalDuration;
      existingSchedule.optimizationScore = scheduleData.optimizationScore;
      existingSchedule.days = scheduleData.days;
      existingSchedule.conteDataHash = conteDataHash;
      existingSchedule.updatedAt = new Date();

      await existingSchedule.save();

      res.json({
        success: true,
        data: existingSchedule,
        message: '스케줄이 업데이트되었습니다.'
      });
    } else {
      // 새로운 스케줄 생성
      const newSchedule = new Schedule({
        projectId,
        userId,
        totalDays: scheduleData.totalDays,
        totalScenes: scheduleData.totalScenes,
        estimatedTotalDuration: scheduleData.estimatedTotalDuration,
        optimizationScore: scheduleData.optimizationScore,
        days: scheduleData.days,
        conteDataHash
      });

      await newSchedule.save();

      res.json({
        success: true,
        data: newSchedule,
        message: '새로운 스케줄이 생성되었습니다.'
      });
    }
  } catch (error) {
    console.error('스케줄 저장 오류:', error);
    res.status(500).json({
      success: false,
      message: '스케줄 저장 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 스케줄 삭제
 * DELETE /api/schedules/:projectId
 */
router.delete('/:projectId', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const deletedSchedule = await Schedule.findOneAndDelete({ 
      projectId, 
      userId 
    });

    if (!deletedSchedule) {
      return res.status(404).json({
        success: false,
        message: '삭제할 스케줄을 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      message: '스케줄이 삭제되었습니다.'
    });
  } catch (error) {
    console.error('스케줄 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '스케줄 삭제 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 콘티 데이터 변경 감지
 * POST /api/schedules/:projectId/check-update
 */
router.post('/:projectId/check-update', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;
    const { conteData } = req.body;

    if (!conteData) {
      return res.status(400).json({
        success: false,
        message: '콘티 데이터가 필요합니다.'
      });
    }

    const existingSchedule = await Schedule.findOne({ 
      projectId, 
      userId 
    });

    if (!existingSchedule) {
      return res.json({
        success: true,
        needsUpdate: true,
        message: '스케줄이 존재하지 않습니다. 새로 생성이 필요합니다.'
      });
    }

    const currentHash = generateConteDataHash(conteData);
    const needsUpdate = existingSchedule.conteDataHash !== currentHash;

    res.json({
      success: true,
      needsUpdate,
      currentHash,
      storedHash: existingSchedule.conteDataHash,
      message: needsUpdate 
        ? '콘티 데이터가 변경되었습니다. 스케줄 재생성이 필요합니다.' 
        : '콘티 데이터가 변경되지 않았습니다.'
    });
  } catch (error) {
    console.error('스케줄 업데이트 확인 오류:', error);
    res.status(500).json({
      success: false,
      message: '스케줄 업데이트 확인 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router; 