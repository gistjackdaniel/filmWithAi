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

    // 새 프로젝트 생성 (기본 상태: draft)
    const project = new Project({
      userId: req.user._id,
      projectTitle,
      synopsis: synopsis || '',
      story: story || '',
      status: 'draft', // 기본 상태 추가
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
          
          const newConte = new Conte({
            projectId: project._id,
            scene: conte.scene || index + 1,
            title: conte.title || `씬 ${index + 1}`,
            description: conte.description || '',
            type: conte.type || 'live_action',
            order: index + 1,
            status: 'draft',
            estimatedDuration: conte.estimatedDuration || '5분',
            imageUrl: conte.imageUrl || null
          });
          return newConte.save();
        });

        const savedContes = await Promise.all(contePromises);
        console.log('✅ 콘티 리스트 저장 완료:', savedContes.length, '개');
        
        // 저장된 콘티 ID들 로깅
        savedContes.forEach((conte, index) => {
          console.log(`✅ 콘티 ${index + 1} 저장됨:`, conte._id);
        });
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
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
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
 * 특정 프로젝트 조회
 * GET /api/projects/:id
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findOne({
      _id: id,
      userId: req.user._id,
      isDeleted: false
    }).populate('userId', 'name email');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: '프로젝트를 찾을 수 없습니다.'
      });
    }

    // 프로젝트의 콘티 목록도 함께 조회
    const contes = await Conte.findByProjectId(id);

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
          user: {
            id: project.userId._id,
            name: project.userId.name,
            email: project.userId.email
          }
        },
        contes: contes.map(conte => ({
          id: conte._id,
          scene: conte.scene,
          title: conte.title,
          description: conte.description,
          type: conte.type,
          order: conte.order,
          status: conte.status
        }))
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

    // 업데이트할 필드 설정
    if (projectTitle) project.projectTitle = projectTitle;
    if (synopsis) project.synopsis = synopsis;
    if (story !== undefined) project.story = story;
    if (settings) project.settings = { ...project.settings, ...settings };
    if (tags) project.tags = tags;
    if (status) project.status = status;

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

module.exports = router; 