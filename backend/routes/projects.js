const express = require('express');
const router = express.Router();

/**
 * 프로젝트 목록 조회
 * GET /api/projects
 */
router.get('/', async (req, res) => {
  try {
    // TODO: 실제 데이터베이스 연동 시 구현
    // 현재는 더미 데이터 반환
    const projects = [
      {
        _id: '1',
        projectTitle: '첫 번째 영화 프로젝트',
        synopsis: 'AI가 만든 영화의 시작',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
      },
      {
        _id: '2',
        projectTitle: '미래의 영화',
        synopsis: '미래를 배경으로 한 SF 영화',
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-12')
      }
    ];

    res.json({
      success: true,
      projects: projects
    });
  } catch (error) {
    console.error('프로젝트 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '프로젝트 목록을 불러올 수 없습니다.'
    });
  }
});

/**
 * 프로젝트 상세 조회
 * GET /api/projects/:projectId
 */
router.get('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    // TODO: 실제 데이터베이스 연동 시 구현
    // 현재는 더미 데이터 반환
    const project = {
      _id: projectId,
      projectTitle: '첫 번째 영화 프로젝트',
      synopsis: 'AI가 만든 영화의 시작',
      story: '이 영화는 AI가 만든 첫 번째 영화입니다...',
      conteList: [
        {
          id: 'scene-1',
          scene: 1,
          description: '주인공이 깨어나는 장면',
          type: 'generated_video',
          details: 'AI가 생성한 비디오로 표현'
        },
        {
          id: 'scene-2',
          scene: 2,
          description: '주인공이 외부 세계를 탐험하는 장면',
          type: 'live_action',
          details: '실제 촬영이 필요한 장면'
        },
        {
          id: 'scene-3',
          scene: 3,
          description: '주인공이 친구를 만나는 장면',
          type: 'generated_video',
          details: 'AI가 생성한 비디오로 표현'
        },
        {
          id: 'scene-4',
          scene: 4,
          description: '주인공이 도전을 극복하는 장면',
          type: 'live_action',
          details: '실제 촬영이 필요한 장면'
        }
      ],
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15')
    };

    res.json({
      success: true,
      project: project
    });
  } catch (error) {
    console.error('프로젝트 상세 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '프로젝트를 불러올 수 없습니다.'
    });
  }
});

/**
 * 새 프로젝트 생성
 * POST /api/projects
 */
router.post('/', async (req, res) => {
  try {
    const { projectTitle, synopsis } = req.body;

    // TODO: 실제 데이터베이스 연동 시 구현
    const newProject = {
      _id: Date.now().toString(),
      projectTitle: projectTitle || '새 프로젝트',
      synopsis: synopsis || '',
      story: '',
      conteList: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    res.status(201).json({
      success: true,
      project: newProject
    });
  } catch (error) {
    console.error('프로젝트 생성 실패:', error);
    res.status(500).json({
      success: false,
      error: '프로젝트를 생성할 수 없습니다.'
    });
  }
});

/**
 * 프로젝트 업데이트
 * PUT /api/projects/:projectId
 */
router.put('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const updateData = req.body;

    // TODO: 실제 데이터베이스 연동 시 구현
    const updatedProject = {
      _id: projectId,
      ...updateData,
      updatedAt: new Date()
    };

    res.json({
      success: true,
      project: updatedProject
    });
  } catch (error) {
    console.error('프로젝트 업데이트 실패:', error);
    res.status(500).json({
      success: false,
      error: '프로젝트를 업데이트할 수 없습니다.'
    });
  }
});

/**
 * 프로젝트 삭제
 * DELETE /api/projects/:projectId
 */
router.delete('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    // TODO: 실제 데이터베이스 연동 시 구현
    res.json({
      success: true,
      message: '프로젝트가 삭제되었습니다.'
    });
  } catch (error) {
    console.error('프로젝트 삭제 실패:', error);
    res.status(500).json({
      success: false,
      error: '프로젝트를 삭제할 수 없습니다.'
    });
  }
});

/**
 * 프로젝트 콘티 순서 변경
 * PUT /api/projects/:projectId/contes/reorder
 */
router.put('/:projectId/contes/reorder', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { conteList } = req.body;

    // TODO: 실제 데이터베이스 연동 시 구현
    // 현재는 더미 데이터 반환
    const updatedProject = {
      _id: projectId,
      projectTitle: '첫 번째 영화 프로젝트',
      synopsis: 'AI가 만든 영화의 시작',
      story: '이 영화는 AI가 만든 첫 번째 영화입니다...',
      conteList: conteList || [],
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date()
    };

    res.json({
      success: true,
      project: updatedProject,
      message: '콘티 순서가 변경되었습니다.'
    });
  } catch (error) {
    console.error('콘티 순서 변경 실패:', error);
    res.status(500).json({
      success: false,
      error: '콘티 순서를 변경할 수 없습니다.'
    });
  }
});

module.exports = router; 