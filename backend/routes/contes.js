const express = require('express');
const jwt = require('jsonwebtoken');
const Project = require('../models/Project');
const Conte = require('../models/Conte');

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

    const project = await Project.findOne({
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
 * 콘티 생성
 * POST /api/projects/:projectId/contes
 */
router.post('/:projectId/contes', authenticateToken, checkProjectAccess, async (req, res) => {
  try {
    const { projectId } = req.params;
    const {
      scene,
      title,
      description,
      dialogue,
      cameraAngle,
      cameraWork,
      characterLayout,
      props,
      weather,
      lighting,
      visualDescription,
      transition,
      lensSpecs,
      visualEffects,
      type,
      estimatedDuration,
      keywords,
      weights,
      order
    } = req.body;

    // 필수 필드 검증
    if (!scene || !title || !description) {
      return res.status(400).json({
        success: false,
        message: '씬 번호, 제목, 설명은 필수입니다.'
      });
    }

    // 새 콘티 생성
    const conte = new Conte({
      projectId,
      scene,
      title,
      description,
      dialogue: dialogue || '',
      cameraAngle: cameraAngle || '',
      cameraWork: cameraWork || '',
      characterLayout: characterLayout || '',
      props: props || '',
      weather: weather || '',
      lighting: lighting || '',
      visualDescription: visualDescription || '',
      transition: transition || '',
      lensSpecs: lensSpecs || '',
      visualEffects: visualEffects || '',
      type: type || 'live_action',
      estimatedDuration: estimatedDuration || '5분',
      keywords: keywords || {},
      weights: weights || {},
      order: order || scene
    });

    await conte.save();

    res.status(201).json({
      success: true,
      message: '콘티가 생성되었습니다.',
      data: {
        conte: {
          id: conte._id,
          scene: conte.scene,
          title: conte.title,
          description: conte.description,
          type: conte.type,
          order: conte.order,
          status: conte.status,
          createdAt: conte.createdAt
        }
      }
    });

  } catch (error) {
    console.error('콘티 생성 오류:', error);
    res.status(500).json({
      success: false,
      message: '콘티 생성 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 프로젝트의 콘티 목록 조회
 * GET /api/projects/:projectId/contes
 */
router.get('/:projectId/contes', authenticateToken, checkProjectAccess, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { type, status } = req.query;
    const options = { type, status };

    const contes = await Conte.findByProjectId(projectId, options);

    res.status(200).json({
      success: true,
      data: {
        contes: contes.map(conte => ({
          id: conte._id,
          scene: conte.scene,
          title: conte.title,
          description: conte.description,
          dialogue: conte.dialogue,
          cameraAngle: conte.cameraAngle,
          cameraWork: conte.cameraWork,
          characterLayout: conte.characterLayout,
          props: conte.props,
          weather: conte.weather,
          lighting: conte.lighting,
          visualDescription: conte.visualDescription,
          transition: conte.transition,
          lensSpecs: conte.lensSpecs,
          visualEffects: conte.visualEffects,
          type: conte.type,
          estimatedDuration: conte.estimatedDuration,
          keywords: conte.keywords,
          weights: conte.weights,
          order: conte.order,
          status: conte.status,
          canEdit: conte.canEdit,
          createdAt: conte.createdAt,
          updatedAt: conte.updatedAt
        }))
      }
    });

  } catch (error) {
    console.error('콘티 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '콘티 목록 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 특정 콘티 조회
 * GET /api/projects/:projectId/contes/:conteId
 */
router.get('/:projectId/contes/:conteId', authenticateToken, checkProjectAccess, async (req, res) => {
  try {
    const { projectId, conteId } = req.params;

    const conte = await Conte.findOne({
      _id: conteId,
      projectId
    }).populate('projectId', 'projectTitle status');

    if (!conte) {
      return res.status(404).json({
        success: false,
        message: '콘티를 찾을 수 없습니다.'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        conte: {
          id: conte._id,
          scene: conte.scene,
          title: conte.title,
          description: conte.description,
          dialogue: conte.dialogue,
          cameraAngle: conte.cameraAngle,
          cameraWork: conte.cameraWork,
          characterLayout: conte.characterLayout,
          props: conte.props,
          weather: conte.weather,
          lighting: conte.lighting,
          visualDescription: conte.visualDescription,
          transition: conte.transition,
          lensSpecs: conte.lensSpecs,
          visualEffects: conte.visualEffects,
          type: conte.type,
          estimatedDuration: conte.estimatedDuration,
          keywords: conte.keywords,
          weights: conte.weights,
          order: conte.order,
          status: conte.status,
          canEdit: conte.canEdit,
          lastModified: conte.lastModified,
          modifiedBy: conte.modifiedBy,
          createdAt: conte.createdAt,
          updatedAt: conte.updatedAt,
          project: {
            id: conte.projectId._id,
            projectTitle: conte.projectId.projectTitle,
            status: conte.projectId.status
          }
        }
      }
    });

  } catch (error) {
    console.error('콘티 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '콘티 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 콘티 업데이트
 * PUT /api/projects/:projectId/contes/:conteId
 */
router.put('/:projectId/contes/:conteId', authenticateToken, checkProjectAccess, async (req, res) => {
  try {
    const { projectId, conteId } = req.params;
    const updateData = req.body;

    const conte = await Conte.findOne({
      _id: conteId,
      projectId
    });

    if (!conte) {
      return res.status(404).json({
        success: false,
        message: '콘티를 찾을 수 없습니다.'
      });
    }

    // 편집 권한 확인
    if (!conte.canEdit) {
      return res.status(403).json({
        success: false,
        message: '이 콘티는 편집할 수 없습니다.'
      });
    }

    // 업데이트할 필드 설정
    Object.keys(updateData).forEach(key => {
      if (conte.schema.paths[key]) {
        conte[key] = updateData[key];
      }
    });

    // 수정 정보 업데이트
    conte.lastModified = new Date();
    conte.modifiedBy = req.user.name;

    await conte.save();

    res.status(200).json({
      success: true,
      message: '콘티가 업데이트되었습니다.',
      data: {
        conte: {
          id: conte._id,
          scene: conte.scene,
          title: conte.title,
          description: conte.description,
          type: conte.type,
          order: conte.order,
          status: conte.status,
          lastModified: conte.lastModified,
          modifiedBy: conte.modifiedBy,
          updatedAt: conte.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('콘티 업데이트 오류:', error);
    res.status(500).json({
      success: false,
      message: '콘티 업데이트 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 콘티 순서 변경
 * PUT /api/projects/:projectId/contes/reorder
 */
router.put('/:projectId/contes/reorder', authenticateToken, checkProjectAccess, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { conteOrders } = req.body; // [{ conteId, newOrder }]

    if (!Array.isArray(conteOrders)) {
      return res.status(400).json({
        success: false,
        message: '콘티 순서 정보가 올바르지 않습니다.'
      });
    }

    // 순서 업데이트
    const updatePromises = conteOrders.map(({ conteId, newOrder }) => {
      return Conte.findOneAndUpdate(
        { _id: conteId, projectId },
        { order: newOrder },
        { new: true }
      );
    });

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: '콘티 순서가 변경되었습니다.'
    });

  } catch (error) {
    console.error('콘티 순서 변경 오류:', error);
    res.status(500).json({
      success: false,
      message: '콘티 순서 변경 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 콘티 삭제
 * DELETE /api/projects/:projectId/contes/:conteId
 */
router.delete('/:projectId/contes/:conteId', authenticateToken, checkProjectAccess, async (req, res) => {
  try {
    const { projectId, conteId } = req.params;

    const conte = await Conte.findOne({
      _id: conteId,
      projectId
    });

    if (!conte) {
      return res.status(404).json({
        success: false,
        message: '콘티를 찾을 수 없습니다.'
      });
    }

    await Conte.findByIdAndDelete(conteId);

    res.status(200).json({
      success: true,
      message: '콘티가 삭제되었습니다.'
    });

  } catch (error) {
    console.error('콘티 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '콘티 삭제 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 같은 장소의 콘티들 조회
 * GET /api/projects/:projectId/contes/location/:location
 */
router.get('/:projectId/contes/location/:location', authenticateToken, checkProjectAccess, async (req, res) => {
  try {
    const { projectId, location } = req.params;

    const contes = await Conte.findByLocation(projectId, location);

    res.status(200).json({
      success: true,
      data: {
        location,
        contes: contes.map(conte => ({
          id: conte._id,
          scene: conte.scene,
          title: conte.title,
          type: conte.type,
          order: conte.order,
          status: conte.status
        }))
      }
    });

  } catch (error) {
    console.error('장소별 콘티 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '장소별 콘티 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 같은 날짜의 콘티들 조회
 * GET /api/projects/:projectId/contes/date/:date
 */
router.get('/:projectId/contes/date/:date', authenticateToken, checkProjectAccess, async (req, res) => {
  try {
    const { projectId, date } = req.params;

    const contes = await Conte.findByDate(projectId, date);

    res.status(200).json({
      success: true,
      data: {
        date,
        contes: contes.map(conte => ({
          id: conte._id,
          scene: conte.scene,
          title: conte.title,
          type: conte.type,
          order: conte.order,
          status: conte.status
        }))
      }
    });

  } catch (error) {
    console.error('날짜별 콘티 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '날짜별 콘티 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 같은 배우가 출연하는 콘티들 조회
 * GET /api/projects/:projectId/contes/cast/:castMember
 */
router.get('/:projectId/contes/cast/:castMember', authenticateToken, checkProjectAccess, async (req, res) => {
  try {
    const { projectId, castMember } = req.params;

    const contes = await Conte.findByCast(projectId, castMember);

    res.status(200).json({
      success: true,
      data: {
        castMember,
        contes: contes.map(conte => ({
          id: conte._id,
          scene: conte.scene,
          title: conte.title,
          type: conte.type,
          order: conte.order,
          status: conte.status
        }))
      }
    });

  } catch (error) {
    console.error('배우별 콘티 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '배우별 콘티 조회 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router; 