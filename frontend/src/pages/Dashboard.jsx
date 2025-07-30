import { useState, useEffect } from 'react'
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Container,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  CircularProgress
} from '@mui/material'
import { 
  Add, 
  Folder, 
  AccountCircle,
  Logout,
  Create,
  Movie,
  AutoFixHigh,
  History,
  Schedule,
  Delete,
  Star,
  StarBorder
} from '@mui/icons-material'
import { useAuthStore } from '../stores/authStore'
import { useProjectStore } from '../stores/projectStore'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'
import { UserProfile } from '../components/auth'
import { ProjectCreationModal } from '../components/project'
import { CommonHeader } from '../components/common'

/**
 * SceneForge 대시보드 페이지 컴포넌트
 * NestJS 백엔드와 연동하여 프로젝트 관리 기능을 제공
 */
const Dashboard = () => {
  // Zustand 스토어에서 사용자 정보와 로그아웃 함수 가져오기
  const { user, logout } = useAuthStore()
  const { 
    projects, 
    isLoading, 
    error,
    loadProjects,
    loadFavoriteProjects,
    favoriteProjects
  } = useProjectStore()
  
  // React Router 네비게이션 훅
  const navigate = useNavigate()
  
  // 로컬 상태 관리
  const [showOnboarding, setShowOnboarding] = useState(false) // 온보딩 모달 표시 여부
  const [showProjectSelection, setShowProjectSelection] = useState(false) // 프로젝트 선택 모달 표시 여부
  const [showFavoriteSelection, setShowFavoriteSelection] = useState(false) // 즐겨찾기 프로젝트 선택 모달 표시 여부
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false) // 삭제 확인 다이얼로그
  const [projectToDelete, setProjectToDelete] = useState(null) // 삭제할 프로젝트
  const [deletingProject, setDeletingProject] = useState(false) // 삭제 중 상태
  const [togglingFavorite, setTogglingFavorite] = useState(null) // 즐겨찾기 토글 중인 프로젝트 ID

  // 컴포넌트 마운트 시 프로젝트 목록 가져오기 및 온보딩 체크
  useEffect(() => {
    // 기존 임시 데이터 정리
    localStorage.removeItem('project-storage')
    localStorage.removeItem('story-storage')
    sessionStorage.clear()
    
    // 프로젝트 목록 로드
    loadProjects()
    loadFavoriteProjects()
    
    // 첫 로그인 시 온보딩 표시 (로컬 스토리지 체크)
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding')
    if (!hasSeenOnboarding) {
      setShowOnboarding(true)
    }
  }, [loadProjects, loadFavoriteProjects])

  // 페이지 포커스 시 프로젝트 목록 새로고침
  useEffect(() => {
    const handleFocus = () => {
      loadProjects()
      loadFavoriteProjects()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [loadProjects, loadFavoriteProjects])

  /**
   * 즐겨찾기 토글 처리
   */
  const handleToggleFavorite = async (project, event) => {
    event.stopPropagation()
    
    if (togglingFavorite === project._id) return
    
    setTogglingFavorite(project._id)
    
    try {
      // 즐겨찾기 토글 API 호출
      const response = await api.post(`/project/${project._id}/favorite`, {}, {
        timeout: 5000
      })
      
      // 프로젝트 목록 새로고침
      await loadProjects()
      await loadFavoriteProjects()
      
      toast.success('즐겨찾기가 업데이트되었습니다.')
    } catch (error) {
      console.error('즐겨찾기 토글 실패:', error)
      toast.error('즐겨찾기 업데이트에 실패했습니다.')
    } finally {
      setTogglingFavorite(null)
    }
  }

  /**
   * 즐겨찾기 프로젝트 스케줄 보기
   */
  const handleViewFavoriteSchedule = async (project = null) => {
    if (project) {
      // 특정 프로젝트의 스케줄 보기
      navigate(`/project/${project._id}/schedule`)
    } else {
      // 즐겨찾기 프로젝트 선택 모달 표시
      setShowFavoriteSelection(true)
    }
  }

  /**
   * 즐겨찾기 프로젝트 선택 모달 닫기
   */
  const handleFavoriteSelectionClose = () => {
    setShowFavoriteSelection(false)
  }

  /**
   * 즐겨찾기 프로젝트 선택 처리
   */
  const handleSelectFavoriteProject = async (project) => {
    try {
      // 프로젝트 상세 페이지로 이동
      navigate(`/project/${project._id}`)
      setShowFavoriteSelection(false)
    } catch (error) {
      console.error('프로젝트 선택 실패:', error)
      toast.error('프로젝트를 불러오는데 실패했습니다.')
    }
  }

  /**
   * 새 프로젝트 생성 버튼 클릭
   */
  const handleCreateProject = () => {
    setShowProjectSelection(true)
  }

  /**
   * 프로젝트 생성 확인
   */
  const handleConfirmProjectCreation = async (projectData) => {
    try {
      // 프로젝트 생성 API 호출
      const response = await api.post('/project', projectData, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const newProject = response.data
      
      // 프로젝트 목록 새로고침
      await loadProjects()
      
      // 새로 생성된 프로젝트로 이동
      navigate(`/project/${newProject._id}`)
      
      toast.success('프로젝트가 생성되었습니다.')
      setShowProjectSelection(false)
    } catch (error) {
      console.error('프로젝트 생성 실패:', error)
      toast.error('프로젝트 생성에 실패했습니다.')
    }
  }

  /**
   * 프로젝트 선택 모달 닫기
   */
  const handleProjectSelectionClose = () => {
    setShowProjectSelection(false)
  }

  /**
   * 스토리 생성 선택
   */
  const handleSelectStoryGeneration = () => {
    setShowProjectSelection(true)
  }

  /**
   * 콘티 생성 선택
   */
  const handleSelectConteGeneration = () => {
    setShowProjectSelection(true)
  }

  /**
   * 스토리 생성 처리
   */
  const handleStoryGeneration = () => {
    navigate('/story/generate')
  }

  /**
   * 콘티 생성 처리
   */
  const handleConteGeneration = () => {
    navigate('/conte/generate')
  }

  /**
   * 간단한 스케줄 보기
   */
  const handleSimpleSchedule = () => {
    navigate('/schedule/simple')
  }

  /**
   * 프로젝트 클릭 처리
   */
  const handleProjectClick = (projectId) => {
    navigate(`/project/${projectId}`)
  }

  /**
   * 프로젝트 상태 라벨 반환
   */
  const getProjectStatusLabel = (project) => {
    const statusLabels = {
      draft: '초안',
      story_ready: '스토리 준비됨',
      conte_ready: '콘티 준비됨',
      cut_generating: '컷 생성 중',
      cut_generated: '컷 생성 완료',
      production_ready: '제작 준비됨'
    }
    return statusLabels[project.status] || project.status
  }

  /**
   * 프로젝트 상태 색상 반환
   */
  const getProjectStatusColor = (project) => {
    const statusColors = {
      draft: 'default',
      story_ready: 'primary',
      conte_ready: 'secondary',
      cut_generating: 'warning',
      cut_generated: 'info',
      production_ready: 'success'
    }
    return statusColors[project.status] || 'default'
  }

  /**
   * 온보딩 완료 처리
   */
  const handleOnboardingComplete = () => {
    localStorage.setItem('hasSeenOnboarding', 'true')
    setShowOnboarding(false)
  }

  /**
   * 프로젝트 삭제 버튼 클릭
   */
  const handleDeleteClick = (project, event) => {
    event.stopPropagation()
    setProjectToDelete(project)
    setDeleteDialogOpen(true)
  }

  /**
   * 삭제 다이얼로그 닫기
   */
  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false)
    setProjectToDelete(null)
  }

  /**
   * 프로젝트 삭제 확인
   */
  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return
    
    setDeletingProject(true)
    
    try {
      // 프로젝트 삭제 API 호출
      await api.delete(`/project/${projectToDelete._id}`, {
        timeout: 10000
      })
      
      // 프로젝트 목록 새로고침
      await loadProjects()
      await loadFavoriteProjects()
      
      toast.success('프로젝트가 삭제되었습니다.')
      handleDeleteDialogClose()
    } catch (error) {
      console.error('프로젝트 삭제 실패:', error)
      toast.error('프로젝트 삭제에 실패했습니다.')
    } finally {
      setDeletingProject(false)
    }
  }

  /**
   * 스케줄 보기
   */
  const handleScheduleView = () => {
    navigate('/schedule')
  }

  // 로딩 중일 때 스피너 표시
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#1B1B1E', color: '#F5F5F5' }}>
      <CommonHeader />
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* 사용자 정보 및 액션 버튼 */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              {user?.name?.charAt(0) || <AccountCircle />}
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight="bold">
                안녕하세요, {user?.name || '사용자'}님!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                SceneForge에서 영화 제작을 시작해보세요
              </Typography>
            </Box>
          </Box>
          
          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreateProject}
              sx={{ bgcolor: 'primary.main', color: 'white' }}
            >
              새 프로젝트
            </Button>
            <Button
              variant="outlined"
              startIcon={<Logout />}
              onClick={logout}
              sx={{ borderColor: 'primary.main', color: 'primary.main' }}
            >
              로그아웃
            </Button>
          </Box>
        </Box>

        {/* 빠른 액션 카드들 */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#2D2D30', color: '#F5F5F5', cursor: 'pointer' }} onClick={handleSelectStoryGeneration}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Create sx={{ color: 'primary.main', fontSize: 40 }} />
                  <Box>
                    <Typography variant="h6" fontWeight="bold">스토리 생성</Typography>
                    <Typography variant="body2" color="text.secondary">AI로 스토리 생성</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#2D2D30', color: '#F5F5F5', cursor: 'pointer' }} onClick={handleSelectConteGeneration}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Movie sx={{ color: 'secondary.main', fontSize: 40 }} />
                  <Box>
                    <Typography variant="h6" fontWeight="bold">콘티 생성</Typography>
                    <Typography variant="body2" color="text.secondary">씬별 콘티 생성</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#2D2D30', color: '#F5F5F5', cursor: 'pointer' }} onClick={handleScheduleView}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Schedule sx={{ color: 'warning.main', fontSize: 40 }} />
                  <Box>
                    <Typography variant="h6" fontWeight="bold">스케줄</Typography>
                    <Typography variant="body2" color="text.secondary">촬영 스케줄 관리</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#2D2D30', color: '#F5F5F5', cursor: 'pointer' }} onClick={() => handleViewFavoriteSchedule()}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Star sx={{ color: 'info.main', fontSize: 40 }} />
                  <Box>
                    <Typography variant="h6" fontWeight="bold">즐겨찾기</Typography>
                    <Typography variant="body2" color="text.secondary">즐겨찾기 프로젝트</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* 프로젝트 목록 */}
        <Box mb={4}>
          <Typography variant="h4" fontWeight="bold" mb={3}>
            내 프로젝트 ({projects.length})
          </Typography>
          
          {projects.length === 0 ? (
            <Card sx={{ bgcolor: '#2D2D30', color: '#F5F5F5', textAlign: 'center', py: 4 }}>
              <CardContent>
                <Folder sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" mb={2}>
                  아직 프로젝트가 없습니다
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  첫 번째 프로젝트를 생성해보세요
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleCreateProject}
                  sx={{ bgcolor: 'primary.main', color: 'white' }}
                >
                  프로젝트 생성
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {projects.map((project) => (
                <Grid item xs={12} sm={6} md={4} key={project._id}>
                  <Card 
                    sx={{ 
                      bgcolor: '#2D2D30', 
                      color: '#F5F5F5', 
                      cursor: 'pointer',
                      '&:hover': { bgcolor: '#3D3D40' }
                    }} 
                    onClick={() => handleProjectClick(project._id)}
                  >
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Typography variant="h6" fontWeight="bold" sx={{ flex: 1 }}>
                          {project.title}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={(e) => handleToggleFavorite(project, e)}
                          disabled={togglingFavorite === project._id}
                        >
                          {togglingFavorite === project._id ? (
                            <CircularProgress size={20} />
                          ) : (
                            <Star sx={{ color: 'warning.main' }} />
                          )}
                        </IconButton>
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" mb={2} sx={{ 
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {project.synopsis || '시놉시스가 없습니다'}
                      </Typography>
                      
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Chip
                          label={getProjectStatusLabel(project)}
                          color={getProjectStatusColor(project)}
                          size="small"
                        />
                        <Typography variant="caption" color="text.secondary">
                          {new Date(project.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        {/* 즐겨찾기 프로젝트 목록 */}
        {favoriteProjects.length > 0 && (
          <Box>
            <Typography variant="h4" fontWeight="bold" mb={3}>
              즐겨찾기 프로젝트 ({favoriteProjects.length})
            </Typography>
            
            <Grid container spacing={3}>
              {favoriteProjects.map((project) => (
                <Grid item xs={12} sm={6} md={4} key={project._id}>
                  <Card 
                    sx={{ 
                      bgcolor: '#2D2D30', 
                      color: '#F5F5F5', 
                      cursor: 'pointer',
                      border: '2px solid',
                      borderColor: 'warning.main',
                      '&:hover': { bgcolor: '#3D3D40' }
                    }} 
                    onClick={() => handleProjectClick(project._id)}
                  >
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Typography variant="h6" fontWeight="bold" sx={{ flex: 1 }}>
                          {project.title}
                        </Typography>
                        <Star sx={{ color: 'warning.main' }} />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" mb={2} sx={{ 
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {project.synopsis || '시놉시스가 없습니다'}
                      </Typography>
                      
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Chip
                          label={getProjectStatusLabel(project)}
                          color={getProjectStatusColor(project)}
                          size="small"
                        />
                        <Typography variant="caption" color="text.secondary">
                          {new Date(project.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* 모달들 */}
        <ProjectCreationModal
          open={showOnboarding || showProjectSelection}
          onClose={() => {
            if (showOnboarding) {
              handleOnboardingComplete()
            } else {
              handleProjectSelectionClose()
            }
          }}
          onConfirm={handleConfirmProjectCreation}
        />

        {/* 삭제 확인 다이얼로그 */}
        <Dialog open={deleteDialogOpen} onClose={handleDeleteDialogClose}>
          <DialogTitle>프로젝트 삭제</DialogTitle>
          <DialogContent>
            <DialogContentText>
              "{projectToDelete?.title}" 프로젝트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteDialogClose}>취소</Button>
            <Button 
              onClick={handleDeleteConfirm} 
              color="error" 
              disabled={deletingProject}
            >
              {deletingProject ? <CircularProgress size={20} /> : '삭제'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  )
}

export default Dashboard 