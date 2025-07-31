import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent,
  Grid,
  IconButton,
  Container,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  CircularProgress
} from '@mui/material';
import { 
  Add, 
  Create,
  Movie,
  Schedule,
  Delete,
  Star,
  StarBorder
} from '@mui/icons-material';
import { useAuthStore } from '../stores/authStore';
import { useProjectStore } from '../stores/projectStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ProjectCreationModal from '../components/project/ProjectCreationModal';
import type { Project } from '../types/project';

// ProjectCreationModal에서 사용하는 타입 정의
interface ProjectCreationData {
  title: string;
  synopsis: string;
  tags: string[];
  genre: string[];
  storyGenerationType: 'ai' | 'direct';
}

/**
 * SceneForge 대시보드 페이지 컴포넌트
 * 인증된 사용자의 메인 페이지
 * 스토리 생성, 콘티 생성, 프로젝트 관리 기능을 제공
 */
const Dashboard = () => {
  // Zustand 스토어에서 사용자 정보와 로그아웃 함수 가져오기
  const { user } = useAuthStore();
  const { 
    projects, 
    favoriteProjects, 
    loading, 
    error, 
    togglingFavorite, 
    deletingProject,
    fetchProjects,
    fetchFavoriteProjects,
    toggleFavorite,
    deleteProject,
    createProject
  } = useProjectStore();
  
  // React Router 네비게이션 훅
  const navigate = useNavigate();
  
  // 로컬 상태 관리
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // 컴포넌트 마운트 시 프로젝트 목록 가져오기 및 온보딩 체크
  useEffect(() => {
    // 기존 임시 데이터 정리
    localStorage.removeItem('project-storage');
    localStorage.removeItem('story-storage');
    sessionStorage.clear();
    
    fetchProjects();
    fetchFavoriteProjects();
    
    // 첫 로그인 시 온보딩 표시 (로컬 스토리지 체크)
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, [fetchProjects, fetchFavoriteProjects]);

  // 페이지 포커스 시 프로젝트 목록 새로고침
  useEffect(() => {
    const handleFocus = () => {
      fetchProjects();
      fetchFavoriteProjects();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchProjects, fetchFavoriteProjects]);

  // 에러 처리
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  /**
   * 프로젝트 즐겨찾기 토글 핸들러
   */
  const handleToggleFavorite = async (project: Project, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await toggleFavorite(project._id);
      toast.success(project.isFavorite ? '즐겨찾기에서 제거되었습니다.' : '즐겨찾기에 추가되었습니다.');
    } catch (error) {
      toast.error('즐겨찾기 상태 변경에 실패했습니다.');
    }
  };

  /**
   * 프로젝트 클릭 핸들러
   */
  const handleProjectClick = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  /**
   * 프로젝트 상태 라벨 가져오기
   */
  const getProjectStatusLabel = (project: Project): string => {
    if (project.story) return '스토리 완성';
    if (project.synopsis) return '시놉시스 작성';
    return '프로젝트 생성';
  };

  /**
   * 프로젝트 상태 색상 가져오기
   */
  const getProjectStatusColor = (project: Project): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    if (project.story) return 'success';
    if (project.synopsis) return 'primary';
    return 'default';
  };

  /**
   * 온보딩 완료 핸들러
   */
  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    localStorage.setItem('hasSeenOnboarding', 'true');
  };

  /**
   * 프로젝트 삭제 클릭 핸들러
   */
  const handleDeleteClick = (project: Project, event: React.MouseEvent) => {
    event.stopPropagation();
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  /**
   * 삭제 다이얼로그 닫기 핸들러
   */
  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setProjectToDelete(null);
  };

  /**
   * 삭제 확인 핸들러
   */
  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;
    
    try {
      await deleteProject(projectToDelete._id);
      toast.success('프로젝트가 삭제되었습니다.');
      handleDeleteDialogClose();
    } catch (error) {
      toast.error('프로젝트 삭제에 실패했습니다.');
    }
  };

  /**
   * 프로젝트 생성 모달 열기 핸들러
   */
  const handleCreateProject = () => {
    setShowCreateModal(true);
  };

  /**
   * 프로젝트 생성 확인 핸들러
   */
  const handleConfirmProjectCreation = async (projectData: ProjectCreationData) => {
    try {
      // 프로젝트 생성
      await createProject({
        title: projectData.title,
        synopsis: projectData.synopsis,
        tags: projectData.tags || [],
        genre: projectData.genre || [],
        isPublic: false, // 기본값 추가
        estimatedDuration: '90분' // 기본값 추가
      });
      
      toast.success('새 프로젝트가 생성되었습니다!');
      setShowCreateModal(false);
      
      // 프로젝트 목록 새로고침
      await fetchProjects();
      
      // 생성된 프로젝트의 ID를 가져와서 해당 프로젝트 페이지로 이동
      const { currentProject } = useProjectStore.getState();
      if (currentProject) {
        // 새로 생성된 프로젝트임을 표시하는 state와 함께 이동
        navigate(`/project/${currentProject._id}`, { 
          state: { newProject: true } 
        });
      }
    } catch (error) {
      toast.error('프로젝트 생성에 실패했습니다.');
      throw error;
    }
  };

  /**
   * 스케줄링 핸들러
   */
  const handleScheduleView = () => {
    navigate('/schedule');
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* 메인 컨텐츠 */}
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {/* 페이지 제목 */}
        <Typography variant="h4" gutterBottom>
          🎬 SceneForge 대시보드
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          AI 영화 제작 도구로 창의적인 스토리를 만들어보세요
        </Typography>

        {/* 주요 기능 카드 그리드 */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* 새 프로젝트 만들기 카드 */}
          <Grid item xs={12} sm={6} md={6}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' }
              }}
              onClick={handleCreateProject}
            >
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Add sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  새 프로젝트 만들기
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  새로운 영화 프로젝트를 시작하세요
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* 프로젝트 목록 보기 카드 */}
          <Grid item xs={12} sm={6} md={6}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' }
              }}
              onClick={handleScheduleView}
            >
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Schedule sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  스케줄 보기
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  촬영 스케줄표를 확인하세요
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* 최근 프로젝트 섹션 */}
        <Typography variant="h5" gutterBottom>
          최근 프로젝트
        </Typography>

        {/* 프로젝트 카드 그리드 */}
        <Grid container spacing={2}>
          {projects.length > 0 ? (
            // 프로젝트가 있는 경우: 프로젝트 카드들 표시
            projects.map((project) => (
              <Grid item xs={12} sm={6} md={4} key={project._id}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' },
                    position: 'relative'
                  }}
                  onClick={() => handleProjectClick(project._id)}
                >
                  {/* 삭제 버튼 */}
                  <IconButton
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      backgroundColor: 'transparent',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      }
                    }}
                    onClick={(e) => handleDeleteClick(project, e)}
                    size="small"
                  >
                    <Delete sx={{ fontSize: 16, color: 'error.main' }} />
                  </IconButton>
                  
                  {/* 즐겨찾기 버튼 */}
                  <IconButton
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 40,
                      backgroundColor: 'transparent',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      }
                    }}
                    onClick={(e) => handleToggleFavorite(project, e)}
                    size="small"
                    disabled={togglingFavorite === project._id}
                  >
                    {project.isFavorite ? 
                      <Star sx={{ fontSize: 16, color: 'warning.main' }} /> : 
                      <StarBorder sx={{ fontSize: 16, color: 'warning.main' }} />
                    }
                  </IconButton>
                  
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {project.title || '제목 없음'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {project.synopsis?.substring(0, 100) || '설명 없음'}...
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          수정일: {new Date(project.updatedAt || project.createdAt).toLocaleString('ko-KR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Typography>
                      </Box>
                      <Chip 
                        label={getProjectStatusLabel(project)} 
                        size="small" 
                        color={getProjectStatusColor(project)}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            // 프로젝트가 없는 경우: 빈 상태 메시지
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    아직 프로젝트가 없습니다.
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    첫 번째 영화 프로젝트를 시작해보세요!
                  </Typography>
                  <Button 
                    variant="contained" 
                    startIcon={<Add />}
                    onClick={handleCreateProject}
                    sx={{ mt: 2 }}
                  >
                    첫 프로젝트 만들기
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Container>

      {/* 프로젝트 생성 모달 */}
      <ProjectCreationModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onConfirm={handleConfirmProjectCreation}
      />

      {/* 삭제 확인 다이얼로그 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          프로젝트 삭제 확인
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            <strong>{projectToDelete?.title || '이 프로젝트'}</strong>를 삭제하시겠습니까?
            <br />
            이 작업은 되돌릴 수 없으며, 프로젝트와 관련된 모든 데이터가 함께 삭제됩니다.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose} color="primary">
            취소
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={!!deletingProject}
            startIcon={deletingProject ? <CircularProgress size={16} /> : <Delete />}
          >
            {deletingProject ? '삭제 중...' : '삭제'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard; 