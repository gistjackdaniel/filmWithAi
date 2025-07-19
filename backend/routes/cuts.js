const express = require('express');
const jwt = require('jsonwebtoken');
const Project = require('../models/Project');
const Conte = require('../models/Conte');
const Cut = require('../models/Cut');

const router = express.Router();

/**
 * 사용자 인증 미들웨어
 * JWT 토큰을 검증하여 사용자 정보를 req.user에 설정
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

/**
 * 프로젝트 권한 확인 미들웨어
 * 사용자가 해당 프로젝트에 접근 권한이 있는지 확인
 */
const checkProjectAccess = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const ProjectModel = require('../models/Project');
    const project = await ProjectModel.findOne({
      _id: projectId,
      userId: req.user._id,
      isDeleted: false
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: '프로젝트를 찾을 수 없습니다.'
      });
    }

    req.project = project;
    next();
  } catch (error) {
    console.error('프로젝트 권한 확인 오류:', error);
    res.status(500).json({
      success: false,
      message: '프로젝트 권한 확인 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 씬(Conte) 권한 확인 미들웨어
 * 해당 씬이 프로젝트에 속하는지 확인
 */
const checkConteAccess = async (req, res, next) => {
  try {
    const { projectId, conteId } = req.params;

    const conte = await Conte.findOne({
      _id: conteId,
      projectId: projectId
    });

    if (!conte) {
      return res.status(404).json({
        success: false,
        message: '씬을 찾을 수 없습니다.'
      });
    }

    req.conte = conte;
    next();
  } catch (error) {
    console.error('씬 권한 확인 오류:', error);
    res.status(500).json({
      success: false,
      message: '씬 권한 확인 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 컷 생성
 * POST /api/projects/:projectId/contes/:conteId/cuts
 */
router.post('/:projectId/contes/:conteId/cuts', authenticateToken, checkProjectAccess, checkConteAccess, async (req, res) => {
  try {
    const { projectId, conteId } = req.params;
    const {
      shotNumber,
      title,
      description,
      shootingPlan,
      cutType,
      dialogue,
      narration,
      characterMovement,
      productionMethod,
      estimatedDuration,
      shootingConditions,
      requiredPersonnel,
      requiredEquipment,
      order,
      metadata
    } = req.body;

    console.log('💾 컷 저장 요청 시작:', { 
      projectId, 
      conteId,
      shotNumber, 
      title: title?.substring(0, 50) + '...',
      hasDescription: !!description,
      productionMethod,
      requestBody: req.body
    });

    // 필수 필드 검증
    if (!shotNumber || !title || !description) {
      console.error('❌ 컷 저장 실패: 필수 필드 누락', { shotNumber, title, description });
      return res.status(400).json({
        success: false,
        message: '샷 번호, 제목, 설명은 필수입니다.'
      });
    }

    // 중복 저장 방지: 같은 씬의 같은 샷 번호가 이미 존재하는지 확인
    const existingCut = await Cut.findOne({ 
      conteId: conteId, 
      shotNumber: shotNumber 
    });
    
    if (existingCut) {
      console.log('⚠️ 중복 컷 감지:', { 
        conteId, 
        shotNumber, 
        existingCutId: existingCut._id,
        existingTitle: existingCut.title 
      });
      
      return res.status(409).json({
        success: false,
        message: `샷 ${shotNumber}번 컷이 이미 존재합니다.`,
        data: {
          existingCut: {
            id: existingCut._id,
            shotNumber: existingCut.shotNumber,
            title: existingCut.title
          }
        }
      });
    }

    // 새 컷 생성
    const cut = new Cut({
      conteId,
      projectId,
      shotNumber,
      title,
      description,
      shootingPlan: shootingPlan || {},
      cutType: cutType || 'medium_shot',
      dialogue: dialogue || '',
      narration: narration || '',
      characterMovement: characterMovement || {
        characters: [],
        blocking: '',
        cameraPosition: { x: 50, y: 50, z: 0 }
      },
      productionMethod: productionMethod || 'live_action',
      estimatedDuration: estimatedDuration || 5,
      shootingConditions: shootingConditions || {},
      requiredPersonnel: requiredPersonnel || {},
      requiredEquipment: requiredEquipment || {},
      order: order || shotNumber,
      metadata: metadata || {}
    });

    console.log('💾 컷 저장 중...', { 
      cutId: cut._id,
      conteId: cut.conteId,
      shotNumber: cut.shotNumber,
      title: cut.title 
    });
    
    await cut.save();
    console.log('✅ 컷 저장 완료:', { id: cut._id, shotNumber: cut.shotNumber, title: cut.title });

    res.status(201).json({
      success: true,
      message: '컷이 생성되었습니다.',
      data: {
        cut: {
          id: cut._id,
          shotNumber: cut.shotNumber,
          title: cut.title,
          description: cut.description,
          productionMethod: cut.productionMethod,
          estimatedDuration: cut.estimatedDuration,
          order: cut.order,
          status: cut.status,
          createdAt: cut.createdAt
        }
      }
    });

  } catch (error) {
    console.error('❌ 컷 생성 오류:', error);
    res.status(500).json({
      success: false,
      message: '컷 생성 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 씬의 컷 목록 조회
 * GET /api/projects/:projectId/contes/:conteId/cuts
 */
router.get('/:projectId/contes/:conteId/cuts', authenticateToken, checkProjectAccess, checkConteAccess, async (req, res) => {
  try {
    const { conteId } = req.params;
    const { status, productionMethod } = req.query;
    const options = { status, productionMethod };

    const cuts = await Cut.findByConteId(conteId, options);

    res.status(200).json({
      success: true,
      data: {
        cuts: cuts.map(cut => ({
          id: cut._id,
          shotNumber: cut.shotNumber,
          title: cut.title,
          description: cut.description,
          shootingPlan: cut.shootingPlan,
          cutType: cut.cutType,
          dialogue: cut.dialogue,
          narration: cut.narration,
          characterMovement: cut.characterMovement,
          productionMethod: cut.productionMethod,
          estimatedDuration: cut.estimatedDuration,
          durationFormatted: cut.durationFormatted,
          shootingConditions: cut.shootingConditions,
          requiredPersonnel: cut.requiredPersonnel,
          requiredEquipment: cut.requiredEquipment,
          output: cut.output,
          order: cut.order,
          status: cut.status,
          canEdit: cut.canEdit,
          metadata: cut.metadata,
          lastModified: cut.lastModified,
          modifiedBy: cut.modifiedBy,
          createdAt: cut.createdAt,
          updatedAt: cut.updatedAt
        }))
      }
    });

  } catch (error) {
    console.error('컷 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '컷 목록 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 특정 컷 조회
 * GET /api/projects/:projectId/contes/:conteId/cuts/:cutId
 */
router.get('/:projectId/contes/:conteId/cuts/:cutId', authenticateToken, checkProjectAccess, checkConteAccess, async (req, res) => {
  try {
    const { cutId } = req.params;

    const cut = await Cut.findOne({
      _id: cutId,
      conteId: req.params.conteId
    }).populate('conteId', 'scene title').populate('projectId', 'projectTitle');

    if (!cut) {
      return res.status(404).json({
        success: false,
        message: '컷을 찾을 수 없습니다.'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        cut: {
          id: cut._id,
          shotNumber: cut.shotNumber,
          title: cut.title,
          description: cut.description,
          shootingPlan: cut.shootingPlan,
          productionMethod: cut.productionMethod,
          estimatedDuration: cut.estimatedDuration,
          durationFormatted: cut.durationFormatted,
          shootingConditions: cut.shootingConditions,
          requiredPersonnel: cut.requiredPersonnel,
          requiredEquipment: cut.requiredEquipment,
          output: cut.output,
          order: cut.order,
          status: cut.status,
          canEdit: cut.canEdit,
          metadata: cut.metadata,
          lastModified: cut.lastModified,
          modifiedBy: cut.modifiedBy,
          createdAt: cut.createdAt,
          updatedAt: cut.updatedAt,
          conte: {
            id: cut.conteId._id,
            scene: cut.conteId.scene,
            title: cut.conteId.title
          },
          project: {
            id: cut.projectId._id,
            projectTitle: cut.projectId.projectTitle
          }
        }
      }
    });

  } catch (error) {
    console.error('컷 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '컷 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 컷 업데이트
 * PUT /api/projects/:projectId/contes/:conteId/cuts/:cutId
 */
router.put('/:projectId/contes/:conteId/cuts/:cutId', authenticateToken, checkProjectAccess, checkConteAccess, async (req, res) => {
  try {
    const { cutId } = req.params;
    const updateData = req.body;

    const cut = await Cut.findOne({
      _id: cutId,
      conteId: req.params.conteId
    });

    if (!cut) {
      return res.status(404).json({
        success: false,
        message: '컷을 찾을 수 없습니다.'
      });
    }

    // 편집 권한 확인
    if (!cut.canEdit) {
      return res.status(403).json({
        success: false,
        message: '이 컷은 편집할 수 없습니다.'
      });
    }

    // 업데이트할 필드 설정
    Object.keys(updateData).forEach(key => {
      if (cut.schema.paths[key]) {
        cut[key] = updateData[key];
      }
    });

    // 수정 정보 업데이트
    cut.lastModified = new Date();
    cut.modifiedBy = req.user.name;

    await cut.save();

    res.status(200).json({
      success: true,
      message: '컷이 업데이트되었습니다.',
      data: {
        cut: {
          id: cut._id,
          shotNumber: cut.shotNumber,
          title: cut.title,
          description: cut.description,
          productionMethod: cut.productionMethod,
          estimatedDuration: cut.estimatedDuration,
          order: cut.order,
          status: cut.status,
          lastModified: cut.lastModified,
          modifiedBy: cut.modifiedBy,
          updatedAt: cut.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('컷 업데이트 오류:', error);
    res.status(500).json({
      success: false,
      message: '컷 업데이트 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 컷 순서 변경
 * PUT /api/projects/:projectId/contes/:conteId/cuts/reorder
 */
router.put('/:projectId/contes/:conteId/cuts/reorder', authenticateToken, checkProjectAccess, checkConteAccess, async (req, res) => {
  try {
    const { conteId } = req.params;
    const { cutOrders } = req.body; // [{ cutId, newOrder }]

    if (!Array.isArray(cutOrders)) {
      return res.status(400).json({
        success: false,
        message: '컷 순서 정보가 올바르지 않습니다.'
      });
    }

    // 순서 업데이트
    const updatePromises = cutOrders.map(({ cutId, newOrder }) => {
      return Cut.findOneAndUpdate(
        { _id: cutId, conteId },
        { order: newOrder },
        { new: true }
      );
    });

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: '컷 순서가 변경되었습니다.'
    });

  } catch (error) {
    console.error('컷 순서 변경 오류:', error);
    res.status(500).json({
      success: false,
      message: '컷 순서 변경 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 컷 삭제
 * DELETE /api/projects/:projectId/contes/:conteId/cuts/:cutId
 */
router.delete('/:projectId/contes/:conteId/cuts/:cutId', authenticateToken, checkProjectAccess, checkConteAccess, async (req, res) => {
  try {
    const { cutId } = req.params;

    const cut = await Cut.findOne({
      _id: cutId,
      conteId: req.params.conteId
    });

    if (!cut) {
      return res.status(404).json({
        success: false,
        message: '컷을 찾을 수 없습니다.'
      });
    }

    await Cut.findByIdAndDelete(cutId);

    res.status(200).json({
      success: true,
      message: '컷이 삭제되었습니다.'
    });

  } catch (error) {
    console.error('컷 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '컷 삭제 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 같은 장소의 컷들 조회
 * GET /api/projects/:projectId/cuts/location/:location
 */
router.get('/:projectId/cuts/location/:location', authenticateToken, checkProjectAccess, async (req, res) => {
  try {
    const { projectId, location } = req.params;

    const cuts = await Cut.findByLocation(projectId, location);

    res.status(200).json({
      success: true,
      data: {
        location,
        cuts: cuts.map(cut => ({
          id: cut._id,
          shotNumber: cut.shotNumber,
          title: cut.title,
          productionMethod: cut.productionMethod,
          order: cut.order,
          status: cut.status
        }))
      }
    });

  } catch (error) {
    console.error('장소별 컷 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '장소별 컷 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 같은 시간대의 컷들 조회
 * GET /api/projects/:projectId/cuts/time/:timeOfDay
 */
router.get('/:projectId/cuts/time/:timeOfDay', authenticateToken, checkProjectAccess, async (req, res) => {
  try {
    const { projectId, timeOfDay } = req.params;

    const cuts = await Cut.findByTimeOfDay(projectId, timeOfDay);

    res.status(200).json({
      success: true,
      data: {
        timeOfDay,
        cuts: cuts.map(cut => ({
          id: cut._id,
          shotNumber: cut.shotNumber,
          title: cut.title,
          productionMethod: cut.productionMethod,
          order: cut.order,
          status: cut.status
        }))
      }
    });

  } catch (error) {
    console.error('시간대별 컷 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '시간대별 컷 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 제작 방법별 컷들 조회
 * GET /api/projects/:projectId/cuts/method/:method
 */
router.get('/:projectId/cuts/method/:method', authenticateToken, checkProjectAccess, async (req, res) => {
  try {
    const { projectId, method } = req.params;

    const cuts = await Cut.findByProductionMethod(projectId, method);

    res.status(200).json({
      success: true,
      data: {
        productionMethod: method,
        cuts: cuts.map(cut => ({
          id: cut._id,
          shotNumber: cut.shotNumber,
          title: cut.title,
          productionMethod: cut.productionMethod,
          order: cut.order,
          status: cut.status
        }))
      }
    });

  } catch (error) {
    console.error('제작 방법별 컷 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '제작 방법별 컷 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 컷 타입별 컷들 조회
 * GET /api/projects/:projectId/cuts/type/:cutType
 */
router.get('/:projectId/cuts/type/:cutType', authenticateToken, checkProjectAccess, async (req, res) => {
  try {
    const { projectId, cutType } = req.params;

    const cuts = await Cut.find({
      projectId,
      cutType: cutType
    }).sort({ order: 1 });

    res.status(200).json({
      success: true,
      data: {
        cutType: cutType,
        cuts: cuts.map(cut => ({
          id: cut._id,
          shotNumber: cut.shotNumber,
          title: cut.title,
          cutType: cut.cutType,
          order: cut.order,
          status: cut.status
        }))
      }
    });

  } catch (error) {
    console.error('컷 타입별 컷 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '컷 타입별 컷 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * AI 컷 세분화 생성
 * POST /api/projects/:projectId/contes/:conteId/cuts/segment
 */
router.post('/:projectId/contes/:conteId/cuts/segment', authenticateToken, checkProjectAccess, checkConteAccess, async (req, res) => {
  try {
    const { conteId } = req.params;
    const { 
      segmentationMethod = 'auto',
      maxCuts = 5,
      focusAreas = []
    } = req.body;

    console.log('🤖 AI 컷 세분화 요청:', { 
      conteId, 
      segmentationMethod,
      maxCuts,
      focusAreas 
    });

    // 씬 정보 가져오기
    const conte = await Conte.findById(conteId);
    if (!conte) {
      return res.status(404).json({
        success: false,
        message: '씬을 찾을 수 없습니다.'
      });
    }

    // AI 컷 세분화 로직 (실제 구현은 OpenAI API 사용)
    const generatedCuts = [];
    
    // 임시로 간단한 컷 생성 (실제로는 OpenAI API 호출)
    for (let i = 1; i <= maxCuts; i++) {
      const cut = {
        conteId,
        projectId: req.params.projectId,
        shotNumber: i,
        title: `샷 ${i}: ${conte.title.substring(0, 20)}...`,
        description: `AI가 생성한 샷 ${i}의 설명입니다. ${conte.description.substring(0, 100)}...`,
        shootingPlan: {
          cameraAngle: i % 2 === 0 ? '클로즈업' : '와이드샷',
          cameraMovement: i % 3 === 0 ? '팬' : '고정',
          lensSpecs: '50mm',
          cameraSettings: {
            aperture: 'f/2.8',
            shutterSpeed: '1/60',
            iso: '800'
          },
          composition: `샷 ${i}의 구도 설명입니다.`
        },
        cutType: i % 3 === 0 ? 'close_up' : i % 3 === 1 ? 'medium_shot' : 'wide_shot',
        dialogue: i % 2 === 0 ? `샷 ${i}의 대사입니다.` : '',
        narration: i % 4 === 0 ? `샷 ${i}의 내레이션입니다.` : '',
        characterMovement: {
          characters: [
            {
              name: '주인공',
              position: { x: 30 + (i * 10), y: 50 },
              action: '대화 중',
              emotion: '집중'
            }
          ],
          blocking: `샷 ${i}의 블로킹 설명입니다.`,
          cameraPosition: { x: 50, y: 50, z: 0 }
        },
        productionMethod: i % 2 === 0 ? 'live_action' : 'ai_generated',
        estimatedDuration: 5 + (i * 2), // 5초부터 시작해서 2초씩 증가
        shootingConditions: {
          location: conte.keywords?.location || '기본 장소',
          timeOfDay: conte.keywords?.timeOfDay || '오후',
          weather: conte.weather || '맑음',
          lighting: conte.lighting || '자연광',
          specialRequirements: []
        },
        requiredPersonnel: {
          director: '감독',
          cinematographer: '촬영감독',
          cameraOperator: '카메라맨',
          lightingDirector: '조명감독',
          additionalCrew: []
        },
        requiredEquipment: {
          cameras: ['C1'],
          lenses: ['50mm'],
          lighting: ['조명 1세트'],
          audio: ['마이크 1개'],
          grip: ['삼각대'],
          special: []
        },
        order: i,
        status: 'planned',
        metadata: {
          complexity: '보통',
          priority: 1,
          tags: ['AI생성'],
          notes: ''
        }
      };

      // 컷 저장
      const newCut = new Cut(cut);
      await newCut.save();
      generatedCuts.push(newCut);
    }

    console.log('✅ AI 컷 세분화 완료:', { 
      conteId, 
      generatedCount: generatedCuts.length 
    });

    res.status(201).json({
      success: true,
      message: 'AI 컷 세분화가 완료되었습니다.',
      data: {
        conteId,
        cuts: generatedCuts.map(cut => ({
          id: cut._id,
          shotNumber: cut.shotNumber,
          title: cut.title,
          description: cut.description,
          productionMethod: cut.productionMethod,
          estimatedDuration: cut.estimatedDuration,
          order: cut.order,
          status: cut.status,
          createdAt: cut.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('❌ AI 컷 세분화 오류:', error);
    res.status(500).json({
      success: false,
      message: 'AI 컷 세분화 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router; 