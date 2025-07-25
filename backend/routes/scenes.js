const express = require('express');
const jwt = require('jsonwebtoken');
const Project = require('../models/Project');
const Scene = require('../models/Scene');

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

    // 순환 참조 방지를 위해 함수 내부에서 require
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
 * 씬 생성
 * POST /api/projects/:projectId/scenes
 */
router.post('/:projectId/scenes', authenticateToken, checkProjectAccess, async (req, res) => {
  try {
    const { projectId } = req.params;
    const {
      scene,
      title,
      description,
      dialogues,
      weather,
      lighting,
      visualDescription,

      type,
      estimatedDuration,
      order,
      imageUrl,
      imagePrompt,
      imageGeneratedAt,
      imageModel,
      isFreeTier,
      // 스케줄링 관련 필드들
      location,
      shootingDate,
      timeOfDay,
      crew,
      equipment,
      cast,
      props,
      specialRequirements,
      priorities
    } = req.body;

    console.log('💾 씬 저장 요청 시작:', { 
      projectId, 
      scene, 
      title: title?.substring(0, 50) + '...',
      hasDescription: !!description,
      type,
      requestBody: req.body
    });

    // 필수 필드 검증
    if (!scene || !title || !description) {
      console.error('❌ 씬 저장 실패: 필수 필드 누락', { scene, title, description });
      return res.status(400).json({
        success: false,
        message: '씬 번호, 제목, 설명은 필수입니다.'
      });
    }

    // 프로젝트 존재 확인 (순환 참조 방지를 위해 함수 내부에서 require)
    const ProjectModel = require('../models/Project');
    const existingProject = await ProjectModel.findById(projectId);
    if (!existingProject) {
      console.error('❌ 씬 저장 실패: 프로젝트를 찾을 수 없음', { projectId });
      return res.status(404).json({
        success: false,
        message: '프로젝트를 찾을 수 없습니다.'
      });
    }

    console.log('✅ 프로젝트 확인 완료:', { projectId, projectTitle: existingProject.projectTitle });

    // 중복 저장 방지: 같은 프로젝트의 같은 씬 번호가 이미 존재하는지 확인
    const existingScene = await Scene.findOne({ 
      projectId: projectId, 
      scene: scene 
    });
    
    if (existingScene) {
      console.log('⚠️ 중복 씬 감지:', { 
        projectId, 
        scene, 
        existingSceneId: existingScene._id,
        existingTitle: existingScene.title 
      });
      
      // 기존 씬을 업데이트하는 대신 중복 저장을 방지
      return res.status(409).json({
        success: false,
        message: `씬 ${scene}번 씬이 이미 존재합니다.`,
        data: {
          existingScene: {
            id: existingScene._id,
            scene: existingScene.scene,
            title: existingScene.title
          }
        }
      });
    }

    // === RealLocation 자동 생성/연결 로직 시작 ===
    const RealLocation = require('../models/RealLocation');
    let realLocationId = null;
    // 장소명 추출: location.name 또는 locationName 등
    const locationName = (req.body.location?.name || req.body.locationName || null);
    if (locationName) {
      let realLocation;
      try {
        realLocation = await RealLocation.create({ projectId, name: locationName });
        console.log('✅ RealLocation 새로 생성:', realLocation._id, locationName);
      } catch (err) {
        if (err.code === 11000) { // duplicate key error
          realLocation = await RealLocation.findOne({ projectId, name: locationName });
          console.log('⚠️ 동시성 중복: 기존 RealLocation 사용:', realLocation._id, locationName);
        } else {
          throw err;
        }
      }
      realLocationId = realLocation._id;
    }
    // === RealLocation 자동 생성/연결 로직 끝 ===

    // 새 씬 생성
    const sceneData = new Scene({
      projectId,
      scene,
      title,
      description,
      weather: weather || '',
      lighting: lighting || '',
      visualDescription: visualDescription || '',
      
      type: type || 'live_action',
      estimatedDuration: estimatedDuration || '5분',
      order: order || scene,
      imageUrl: imageUrl || null,
      imagePrompt: imagePrompt || null,
      imageGeneratedAt: imageGeneratedAt || null,
      imageModel: imageModel || null,
      isFreeTier: isFreeTier || false,
      // 스케줄링 정보
      location: {
        name: req.body.location?.name || '',
        realLocationId: realLocationId
      },
      shootingDate: req.body.shootingDate || '',
      timeOfDay: req.body.timeOfDay || '오후',
      crew: req.body.crew || {},
      equipment: req.body.equipment || {},
      cast: req.body.cast || [],
      props: req.body.props || [],
      specialRequirements: req.body.specialRequirements || [],
      priorities: req.body.priorities || {}
    });

    console.log('💾 씬 저장 중...', { 
      sceneId: sceneData._id,
      projectId: sceneData.projectId,
      scene: sceneData.scene,
      title: sceneData.title 
    });
    
    // 이미지 URL을 영구 URL로 변환 (출시 모드에서만)
    const imageService = require('../services/imageService');
    if (sceneData.imageUrl) {
      try {
        const permanentUrl = await imageService.convertToPermanentUrl(
          sceneData.imageUrl,
          `scene_${sceneData.scene}_${Date.now()}.png`
        );
        sceneData.imageUrl = permanentUrl;
        console.log('✅ 이미지 URL 변환 완료:', permanentUrl);
      } catch (error) {
        console.error('❌ 이미지 URL 변환 실패:', error);
        // 변환 실패 시에도 씬은 저장
      }
    }
    
    await sceneData.save();
    console.log('✅ 씬 저장 완료:', { id: sceneData._id, scene: sceneData.scene, title: sceneData.title });

    // 새로운 씬 생성 시에만 프로젝트 상태를 scene_ready로 업데이트 (기존 상태 유지)
    const project = await ProjectModel.findById(projectId);
    if (project) {
      await project.updateStatusOnSceneCreation();
      console.log('✅ 씬 생성으로 인한 프로젝트 상태 업데이트 완료');
    }

    res.status(201).json({
      success: true,
      message: '씬이 생성되었습니다.',
      data: {
        scene: {
          id: sceneData._id,
          scene: sceneData.scene,
          title: sceneData.title,
          description: sceneData.description,
          type: sceneData.type,
          order: sceneData.order,

          createdAt: sceneData.createdAt
        }
      }
    });

  } catch (error) {
    console.error('❌ 씬 생성 오류:', error);
    res.status(500).json({
      success: false,
      message: '씬 생성 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 프로젝트의 씬 목록 조회
 * GET /api/projects/:projectId/scenes
 */
router.get('/:projectId/scenes', authenticateToken, checkProjectAccess, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { type, realLocationId } = req.query;
    const options = { type };

    let scenes;
    if (realLocationId) {
      // realLocationId로 필터링
      scenes = await Scene.find({ projectId, 'location.realLocationId': realLocationId });
    } else {
      scenes = await Scene.findByProjectId(projectId, options);
    }

    res.status(200).json({
      success: true,
      data: {
        scenes: scenes.map(scene => ({
          id: scene._id,
          scene: scene.scene,
          title: scene.title,
          description: scene.description,
          dialogues: scene.dialogues,
          weather: scene.weather,
          lighting: scene.lighting,
          visualDescription: scene.visualDescription,
          type: scene.type,
          estimatedDuration: scene.estimatedDuration,
          order: scene.order,
          canEdit: scene.canEdit,
          imageUrl: scene.imageUrl,
          imagePrompt: scene.imagePrompt,
          imageGeneratedAt: scene.imageGeneratedAt,
          imageModel: scene.imageModel,
          isFreeTier: scene.isFreeTier,
          // 스케줄링 정보
          location: scene.location,
          shootingDate: scene.shootingDate,
          timeOfDay: scene.timeOfDay,
          crew: scene.crew,
          equipment: scene.equipment,
          cast: scene.cast,
          props: scene.props,
          specialRequirements: scene.specialRequirements,
          priorities: scene.priorities,
          createdAt: scene.createdAt,
          updatedAt: scene.updatedAt
        }))
      }
    });

  } catch (error) {
    console.error('씬 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '씬 목록 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 특정 씬 조회
 * GET /api/projects/:projectId/scenes/:sceneId
 */
router.get('/:projectId/scenes/:sceneId', authenticateToken, checkProjectAccess, async (req, res) => {
  try {
    const { projectId, sceneId } = req.params;

    const scene = await Scene.findOne({
      _id: sceneId,
      projectId
    }).populate('projectId', 'projectTitle status');

    if (!scene) {
      return res.status(404).json({
        success: false,
        message: '씬을 찾을 수 없습니다.'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        scene: {
          id: scene._id,
          scene: scene.scene,
          title: scene.title,
          description: scene.description,
          dialogues: scene.dialogues,
          weather: scene.weather,
          lighting: scene.lighting,
          visualDescription: scene.visualDescription,
          type: scene.type,
          estimatedDuration: scene.estimatedDuration,
          order: scene.order,
          canEdit: scene.canEdit,
          imageUrl: scene.imageUrl,
          imagePrompt: scene.imagePrompt,
          imageGeneratedAt: scene.imageGeneratedAt,
          imageModel: scene.imageModel,
          isFreeTier: scene.isFreeTier,
          // 스케줄링 정보
          location: scene.location,
          shootingDate: scene.shootingDate,
          timeOfDay: scene.timeOfDay,
          crew: scene.crew,
          equipment: scene.equipment,
          cast: scene.cast,
          props: scene.props,
          specialRequirements: scene.specialRequirements,
          priorities: scene.priorities,
          lastModified: scene.lastModified,
          modifiedBy: scene.modifiedBy,
          createdAt: scene.createdAt,
          updatedAt: scene.updatedAt,
          project: {
            id: scene.projectId._id,
            projectTitle: scene.projectId.projectTitle,
            status: scene.projectId.status
          }
        }
      }
    });

  } catch (error) {
    console.error('씬 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '씬 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 씬 업데이트
 * PUT /api/projects/:projectId/scenes/:sceneId
 */
router.put('/:projectId/scenes/:sceneId', authenticateToken, checkProjectAccess, async (req, res) => {
  try {
    const { projectId, sceneId } = req.params;
    const updateData = req.body;

    const scene = await Scene.findOne({
      _id: sceneId,
      projectId
    });

    if (!scene) {
      return res.status(404).json({
        success: false,
        message: '씬을 찾을 수 없습니다.'
      });
    }

    // 편집 권한 확인
    if (!scene.canEdit) {
      return res.status(403).json({
        success: false,
        message: '이 씬은 편집할 수 없습니다.'
      });
    }

    // object 타입 필드 배열로 관리
    const objectFields = ['keywords', 'weights', 'scheduling'];
    Object.keys(updateData).forEach(key => {
      if (objectFields.includes(key) && typeof updateData[key] === 'object') {
        scene[key] = updateData[key];
        scene.markModified(key);
      } else if (scene.schema.paths[key]) {
        scene[key] = updateData[key];
      }
    });

    scene.lastModified = new Date();
    scene.modifiedBy = req.user.name;

    await scene.save();

    res.status(200).json({
      success: true,
      message: '씬이 업데이트되었습니다.',
      data: {
        scene: {
          id: scene._id,
          scene: scene.scene,
          title: scene.title,
          description: scene.description,
          type: scene.type,
          order: scene.order,
          imageUrl: scene.imageUrl,
          imagePrompt: scene.imagePrompt,
          imageGeneratedAt: scene.imageGeneratedAt,
          imageModel: scene.imageModel,
          isFreeTier: scene.isFreeTier,
          lastModified: scene.lastModified,
          modifiedBy: scene.modifiedBy,
          updatedAt: scene.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('씬 업데이트 오류:', error);
    res.status(500).json({
      success: false,
      message: '씬 업데이트 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 씬 순서 변경
 * PUT /api/projects/:projectId/scenes/reorder
 */
router.put('/:projectId/scenes/reorder', authenticateToken, checkProjectAccess, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { sceneOrders } = req.body; // [{ sceneId, newOrder }]

    if (!Array.isArray(sceneOrders)) {
      return res.status(400).json({
        success: false,
        message: '씬 순서 정보가 올바르지 않습니다.'
      });
    }

    // 순서 업데이트
    const updatePromises = sceneOrders.map(({ sceneId, newOrder }) => {
      return Scene.findOneAndUpdate(
        { _id: sceneId, projectId },
        { order: newOrder },
        { new: true }
      );
    });

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: '씬 순서가 변경되었습니다.'
    });

  } catch (error) {
    console.error('씬 순서 변경 오류:', error);
    res.status(500).json({
      success: false,
      message: '씬 순서 변경 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 씬 삭제
 * DELETE /api/projects/:projectId/scenes/:sceneId
 */
router.delete('/:projectId/scenes/:sceneId', authenticateToken, checkProjectAccess, async (req, res) => {
  try {
    const { projectId, sceneId } = req.params;

    const scene = await Scene.findOne({
      _id: sceneId,
      projectId
    });

    if (!scene) {
      return res.status(404).json({
        success: false,
        message: '씬을 찾을 수 없습니다.'
      });
    }

    await Scene.findByIdAndDelete(sceneId);

    res.status(200).json({
      success: true,
      message: '씬이 삭제되었습니다.'
    });

  } catch (error) {
    console.error('씬 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '씬 삭제 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 같은 장소의 씬들 조회
 * GET /api/projects/:projectId/scenes/location/:location
 */
router.get('/:projectId/scenes/location/:location', authenticateToken, checkProjectAccess, async (req, res) => {
  try {
    const { projectId, location } = req.params;

    const scenes = await Scene.findByLocation(projectId, location);

    res.status(200).json({
      success: true,
      data: {
        location,
        scenes: scenes.map(scene => ({
          id: scene._id,
          scene: scene.scene,
          title: scene.title,
          type: scene.type,
          order: scene.order
        }))
      }
    });

  } catch (error) {
    console.error('장소별 씬 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '장소별 씬 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 같은 날짜의 씬들 조회
 * GET /api/projects/:projectId/scenes/date/:date
 */
router.get('/:projectId/scenes/date/:date', authenticateToken, checkProjectAccess, async (req, res) => {
  try {
    const { projectId, date } = req.params;

    const scenes = await Scene.findByDate(projectId, date);

    res.status(200).json({
      success: true,
      data: {
        date,
        scenes: scenes.map(scene => ({
          id: scene._id,
          scene: scene.scene,
          title: scene.title,
          type: scene.type,
          order: scene.order
        }))
      }
    });

  } catch (error) {
    console.error('날짜별 씬 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '날짜별 씬 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 같은 배우가 출연하는 씬들 조회
 * GET /api/projects/:projectId/scenes/cast/:castMember
 */
router.get('/:projectId/scenes/cast/:castMember', authenticateToken, checkProjectAccess, async (req, res) => {
  try {
    const { projectId, castMember } = req.params;

    const scenes = await Scene.findByCast(projectId, castMember);

    res.status(200).json({
      success: true,
      data: {
        castMember,
        scenes: scenes.map(scene => ({
          id: scene._id,
          scene: scene.scene,
          title: scene.title,
          type: scene.type,
          order: scene.order
        }))
      }
    });

  } catch (error) {
    console.error('배우별 씬 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '배우별 씬 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * AI 씬 생성
 * POST /api/scene/generate
 */
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { 
      projectId, 
      synopsis, 
      story, 
      settings = {},
      sceneCount = 5 
    } = req.body;

    console.log('🤖 AI 씬 생성 요청:', { 
      projectId, 
      hasSynopsis: !!synopsis,
      hasStory: !!story,
      sceneCount,
      settings 
    });

    // 프로젝트 ID 필수 검증
    if (!projectId) {
      console.error('❌ AI 씬 생성 실패: 프로젝트 ID 누락');
      return res.status(400).json({
        success: false,
        message: '프로젝트 ID는 필수입니다.'
      });
    }

    // 프로젝트 존재 및 권한 확인
    const project = await Project.findOne({
      _id: projectId,
      userId: req.user._id,
      isDeleted: false
    });

    if (!project) {
      console.error('❌ AI 씬 생성 실패: 프로젝트를 찾을 수 없음', { projectId });
      return res.status(404).json({
        success: false,
        message: '프로젝트를 찾을 수 없습니다.'
      });
    }

    // 시놉시스 또는 스토리 중 하나는 필수
    if (!synopsis && !story) {
      console.error('❌ AI 씬 생성 실패: 시놉시스 또는 스토리 누락');
      return res.status(400).json({
        success: false,
        message: '시놉시스 또는 스토리는 필수입니다.'
      });
    }

    // AI 씬 생성 로직 (실제 구현은 OpenAI API 사용)
    const generatedScenes = [];
    const content = story || synopsis;
    
    // 임시로 간단한 씬 생성 (실제로는 OpenAI API 호출)
    for (let i = 1; i <= sceneCount; i++) {
      const scene = {
        projectId,
        scene: i,
        title: `씬 ${i}: ${content.substring(0, 20)}...`,
        description: `AI가 생성한 씬 ${i}의 설명입니다. ${content.substring(0, 100)}...`,
        dialogues: [
          { character: '주인공', text: `씬 ${i}의 대사입니다.` }
        ],
        weather: '맑음',
        lighting: '자연광',
        visualDescription: `씬 ${i}의 시각적 묘사입니다.`,

        type: i % 2 === 0 ? 'generated_video' : 'live_action', // 번갈아가며 생성
        estimatedDuration: '5분',
        order: i,

        // 스케줄링 정보
        location: { name: '실내' },
        shootingDate: '',
        timeOfDay: '오후',
        crew: {},
        equipment: {},
        cast: ['주인공'],
        props: ['기본 소품'],
        specialRequirements: [],
        priorities: {
          location: 1,
          equipment: 1,
          cast: 1,
          time: 1
        }
      };

      // 씬 저장
      const newScene = new Scene(scene);
      await newScene.save();
      generatedScenes.push(newScene);
    }

    console.log('✅ AI 씬 생성 완료:', { 
      projectId, 
      generatedCount: generatedScenes.length 
    });

    res.status(201).json({
      success: true,
      message: 'AI 씬이 생성되었습니다.',
      data: {
        projectId,
        scenes: generatedScenes.map(scene => ({
          id: scene._id,
          scene: scene.scene,
          title: scene.title,
          description: scene.description,
          type: scene.type,
          order: scene.order,

          createdAt: scene.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('❌ AI 씬 생성 오류:', error);
    res.status(500).json({
      success: false,
      message: 'AI 씬 생성 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router; 