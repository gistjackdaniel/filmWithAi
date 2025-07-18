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
 * 프로젝트 생성
 * POST /api/projects
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { projectTitle, synopsis, settings, tags, conteList, story } = req.body;

    console.log('📝 프로젝트 생성 요청:', { 
      userId: req.user._id,
      projectTitle: projectTitle?.substring(0, 50) + '...',
      hasSynopsis: !!synopsis,
      hasStory: !!story,
      conteCount: conteList?.length || 0,
      settings 
    });

    // 필수 필드 검증 (시놉시스는 선택적)
    if (!projectTitle) {
      console.error('❌ 프로젝트 생성 실패: 프로젝트 제목 누락', { projectTitle });
      return res.status(400).json({
        success: false,
        message: '프로젝트 제목은 필수입니다.'
      });
    }

    // 새 프로젝트 생성 (상태는 미들웨어에서 자동 설정)
    const project = new Project({
      userId: req.user._id,
      projectTitle,
      synopsis: synopsis || '',
      story: story || '',
      settings: settings || {},
      tags: tags || []
    });

    console.log('💾 프로젝트 저장 중...');
    await project.save();
    console.log('✅ 프로젝트 저장 완료:', { id: project._id, title: project.projectTitle });

    // 콘티 리스트가 있는 경우 함께 저장
    if (conteList && Array.isArray(conteList) && conteList.length > 0) {
      console.log('📝 콘티 리스트 저장 중...', conteList.length, '개');
      console.log('📝 콘티 데이터 샘플:', conteList[0]);
      
      try {
        const contePromises = conteList.map((conte, index) => {
          console.log(`📝 콘티 ${index + 1} 저장 중:`, {
            scene: conte.scene || index + 1,
            title: conte.title || `씬 ${index + 1}`,
            type: conte.type || 'live_action',
            hasImage: !!conte.imageUrl
          });
          
          // keywords 검증 및 수정
          let validatedKeywords = conte.keywords || {};
          if (validatedKeywords.timeOfDay) {
            // timeOfDay 값 검증 및 변환
            const validTimeOfDayValues = ['새벽', '아침', '오후', '저녁', '밤', '낮'];
            if (!validTimeOfDayValues.includes(validatedKeywords.timeOfDay)) {
              // 유효하지 않은 값인 경우 기본값으로 변경
              if (validatedKeywords.timeOfDay === '주간') {
                validatedKeywords.timeOfDay = '오후';
              } else {
                validatedKeywords.timeOfDay = '오후';
              }
              console.log(`⚠️ 콘티 ${index + 1}의 timeOfDay 값 수정: ${conte.keywords.timeOfDay} → ${validatedKeywords.timeOfDay}`);
            }
          }
          
          const newConte = new Conte({
            projectId: project._id,
            scene: conte.scene || index + 1,
            title: conte.title || `씬 ${index + 1}`,
            description: conte.description || '',
            dialogue: conte.dialogue || '',
            cameraAngle: conte.cameraAngle || '',
            cameraWork: conte.cameraWork || '',
            characterLayout: conte.characterLayout || '',
            props: conte.props || '',
            weather: conte.weather || '',
            lighting: conte.lighting || '',
            visualDescription: conte.visualDescription || '',
            transition: conte.transition || '',
            lensSpecs: conte.lensSpecs || '',
            visualEffects: conte.visualEffects || '',
            type: conte.type || 'live_action',
            estimatedDuration: conte.estimatedDuration || '5분',
            keywords: validatedKeywords,
            weights: conte.weights || {},
            order: conte.order || index + 1,
            imageUrl: conte.imageUrl || null,
            // 스케줄링 관련 필드들 추가
            requiredPersonnel: conte.requiredPersonnel || '',
            requiredEquipment: conte.requiredEquipment || '',
            camera: conte.camera || ''
          });
          return newConte.save();
        });

        const savedContes = await Promise.all(contePromises);
        console.log('✅ 콘티 리스트 저장 완료:', savedContes.length, '개');
        
        // 저장된 콘티 ID들 로깅
        savedContes.forEach((conte, index) => {
          console.log(`✅ 콘티 ${index + 1} 저장됨:`, conte._id);
        });
        
        // 콘티가 저장된 후 프로젝트 상태를 conte_ready로 업데이트
        if (project.status !== 'conte_ready' && project.status !== 'production_ready') {
          project.status = 'conte_ready';
          await project.save();
          console.log('✅ 프로젝트 상태를 conte_ready로 업데이트 완료');
        }
      } catch (conteError) {
        console.error('❌ 콘티 저장 중 오류:', conteError);
        // 콘티 저장 실패해도 프로젝트는 생성됨
        console.log('⚠️ 콘티 저장 실패했지만 프로젝트는 생성됨');
      }
    } else {
      console.log('📝 콘티 리스트가 없어서 콘티 저장 건너뜀');
    }

    res.status(201).json({
      success: true,
      message: '프로젝트가 생성되었습니다.',
      project: {
        _id: project._id,
        projectTitle: project.projectTitle,
        synopsis: project.synopsis,
        story: project.story,
        status: project.status,
        settings: project.settings,
        tags: project.tags,
        createdAt: project.createdAt
      }
    });

  } catch (error) {
    console.error('❌ 프로젝트 생성 오류:', error);
    res.status(500).json({
      success: false,
      message: '프로젝트 생성 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 사용자의 프로젝트 목록 조회
 * GET /api/projects
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, limit = 50, search } = req.query;
    const options = { status, limit: parseInt(limit) };

    console.log('📋 프로젝트 목록 조회:', { 
      userId: req.user._id,
      email: req.user.email 
    });

    let projects;
    
    if (search) {
      // 검색 기능
      projects = await Project.searchProjects(req.user._id, search);
    } else {
      // 일반 목록 조회 - 현재 사용자의 프로젝트만 조회
      projects = await Project.findByUserId(req.user._id, options);
    }

    console.log('✅ 조회된 프로젝트 수:', projects.length);

    res.status(200).json({
      success: true,
      data: {
        projects: projects.map(project => ({
          id: project._id,
          projectTitle: project.projectTitle,
          synopsis: project.synopsis,
          status: project.status,
          settings: project.settings,
          tags: project.tags,
          isFavorite: project.isFavorite,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          lastViewedAt: project.lastViewedAt,
          conteCount: project.conteCount,
          generatedConteCount: project.generatedConteCount,
          liveActionConteCount: project.liveActionConteCount
        }))
      }
    });

  } catch (error) {
    console.error('프로젝트 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '프로젝트 목록 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 즐겨찾기된 프로젝트 목록 조회
 * GET /api/projects/favorites
 */
router.get('/favorites', authenticateToken, async (req, res) => {
  try {
    console.log('⭐ 즐겨찾기 프로젝트 목록 조회:', { 
      userId: req.user._id 
    });

    const favoriteProjects = await Project.find({
      userId: req.user._id,
      isDeleted: false,
      isFavorite: true
    }).sort({ lastViewedAt: -1, updatedAt: -1 });

    console.log('✅ 즐겨찾기 프로젝트 조회 완료:', favoriteProjects.length, '개');

    res.status(200).json({
      success: true,
      data: {
        projects: favoriteProjects.map(project => ({
          id: project._id,
          projectTitle: project.projectTitle,
          synopsis: project.synopsis,
          status: project.status,
          settings: project.settings,
          tags: project.tags,
          isFavorite: project.isFavorite,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          lastViewedAt: project.lastViewedAt,
          conteCount: project.conteCount,
          generatedConteCount: project.generatedConteCount,
          liveActionConteCount: project.liveActionConteCount
        }))
      }
    });

  } catch (error) {
    console.error('❌ 즐겨찾기 프로젝트 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '즐겨찾기 프로젝트 목록 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 특정 프로젝트 조회 (콘티와 함께)
 * GET /api/projects/:id
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { includeContes = 'true' } = req.query;

    // 중복 요청 방지를 위해 로깅 최소화
    const logKey = `project_${id}_${Date.now()}`;
    console.log('📋 프로젝트 조회:', { 
      projectId: id, 
      userId: req.user._id,
      includeContes,
      logKey
    });

    // 프로젝트 조회 (사용자 권한 확인 포함)
    let project;
    if (includeContes === 'true') {
      // 콘티와 함께 조회하되 사용자 권한 확인
      project = await Project.findOne({
        _id: id,
        userId: req.user._id,
        isDeleted: false
      }).populate('userId', 'name email');
      
      if (project) {
        // 콘티 목록 별도 조회
        const contes = await Conte.findByProjectId(id);
        project.contes = contes;
      }
    } else {
      project = await Project.findOne({
        _id: id,
        userId: req.user._id,
        isDeleted: false
      }).populate('userId', 'name email');
    }

    if (!project) {
      return res.status(404).json({
        success: false,
        message: '프로젝트를 찾을 수 없습니다.'
      });
    }

    // 마지막 조회 시간 업데이트
    project.lastViewedAt = new Date();
    await project.save();

    // 중복 로깅 방지
    console.log('✅ 프로젝트 조회 완료:', { 
      projectId: project._id, 
      title: project.projectTitle,
      conteCount: project.contes?.length || 0,
      logKey
    });

    res.status(200).json({
      success: true,
      data: {
        project: {
          id: project._id,
          projectTitle: project.projectTitle,
          synopsis: project.synopsis,
          story: project.story,
          status: project.status,
          settings: project.settings,
          tags: project.tags,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          lastViewedAt: project.lastViewedAt,
          conteCount: project.conteCount,
          generatedConteCount: project.generatedConteCount,
          liveActionConteCount: project.liveActionConteCount,
          user: {
            id: project.userId._id,
            name: project.userId.name,
            email: project.userId.email
          }
        },
        conteList: project.contes ? project.contes.map(conte => ({
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
          order: conte.order,
          status: conte.status,
          imageUrl: conte.imageUrl,
          estimatedDuration: conte.estimatedDuration,
          keywords: conte.keywords,
          weights: conte.weights,
          canEdit: conte.canEdit,
          // 스케줄링 관련 필드들 추가
          requiredPersonnel: conte.requiredPersonnel,
          requiredEquipment: conte.requiredEquipment,
          camera: conte.camera,
          lastModified: conte.lastModified,
          modifiedBy: conte.modifiedBy,
          createdAt: conte.createdAt,
          updatedAt: conte.updatedAt
        })) : []
      }
    });

  } catch (error) {
    console.error('프로젝트 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '프로젝트 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 프로젝트 업데이트
 * PUT /api/projects/:id
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { projectTitle, synopsis, story, settings, tags, status } = req.body;

    const project = await Project.findOne({
      _id: id,
      userId: req.user._id,
      isDeleted: false
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: '프로젝트를 찾을 수 없습니다.'
      });
    }

    // 업데이트할 필드 설정 (상태는 명시적으로 전달된 경우에만 업데이트)
    if (projectTitle) project.projectTitle = projectTitle;
    if (synopsis) project.synopsis = synopsis;
    if (story !== undefined) project.story = story;
    if (settings) project.settings = { ...project.settings, ...settings };
    if (tags) project.tags = tags;
    // status는 명시적으로 전달된 경우에만 업데이트 (기존 상태 유지)
    if (status !== undefined) project.status = status;

    await project.save();

    res.status(200).json({
      success: true,
      message: '프로젝트가 업데이트되었습니다.',
      data: {
        project: {
          id: project._id,
          projectTitle: project.projectTitle,
          synopsis: project.synopsis,
          story: project.story,
          status: project.status,
          settings: project.settings,
          tags: project.tags,
          updatedAt: project.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('프로젝트 업데이트 오류:', error);
    res.status(500).json({
      success: false,
      message: '프로젝트 업데이트 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 프로젝트 삭제 (소프트 삭제)
 * DELETE /api/projects/:id
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findOne({
      _id: id,
      userId: req.user._id,
      isDeleted: false
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: '프로젝트를 찾을 수 없습니다.'
      });
    }

    // 소프트 삭제
    await project.softDelete();

    res.status(200).json({
      success: true,
      message: '프로젝트가 삭제되었습니다.'
    });

  } catch (error) {
    console.error('프로젝트 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '프로젝트 삭제 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 프로젝트 복원
 * PUT /api/projects/:id/restore
 */
router.put('/:id/restore', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findOne({
      _id: id,
      userId: req.user._id,
      isDeleted: true
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: '삭제된 프로젝트를 찾을 수 없습니다.'
      });
    }

    // 프로젝트 복원
    await project.restore();

    res.status(200).json({
      success: true,
      message: '프로젝트가 복원되었습니다.'
    });

  } catch (error) {
    console.error('프로젝트 복원 오류:', error);
    res.status(500).json({
      success: false,
      message: '프로젝트 복원 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 프로젝트 통계 조회
 * GET /api/projects/:id/stats
 */
router.get('/:id/stats', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findOne({
      _id: id,
      userId: req.user._id,
      isDeleted: false
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: '프로젝트를 찾을 수 없습니다.'
      });
    }

    // 콘티 통계 조회
    const [totalContes, generatedContes, liveActionContes] = await Promise.all([
      Conte.countDocuments({ projectId: id }),
      Conte.countDocuments({ projectId: id, type: 'generated_video' }),
      Conte.countDocuments({ projectId: id, type: 'live_action' })
    ]);

    res.status(200).json({
      success: true,
      data: {
        projectId: id,
        stats: {
          totalContes,
          generatedContes,
          liveActionContes,
          completionRate: totalContes > 0 ? Math.round((generatedContes + liveActionContes) / totalContes * 100) : 0
        }
      }
    });

  } catch (error) {
    console.error('프로젝트 통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '프로젝트 통계 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 프로젝트 즐겨찾기 토글
 * PUT /api/projects/:id/favorite
 */
router.put('/:id/favorite', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    console.log('⭐ 프로젝트 즐겨찾기 토글:', { 
      projectId: id, 
      userId: req.user._id 
    });

    const project = await Project.findOne({
      _id: id,
      userId: req.user._id,
      isDeleted: false
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: '프로젝트를 찾을 수 없습니다.'
      });
    }

    // 즐겨찾기 상태 토글
    project.isFavorite = !project.isFavorite;
    await project.save();

    console.log('✅ 즐겨찾기 상태 변경 완료:', { 
      projectId: project._id, 
      isFavorite: project.isFavorite 
    });

    res.status(200).json({
      success: true,
      message: project.isFavorite ? '즐겨찾기에 추가되었습니다.' : '즐겨찾기에서 제거되었습니다.',
      data: {
        projectId: project._id,
        isFavorite: project.isFavorite
      }
    });

  } catch (error) {
    console.error('❌ 프로젝트 즐겨찾기 토글 오류:', error);
    res.status(500).json({
      success: false,
      message: '즐겨찾기 상태 변경 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router; 