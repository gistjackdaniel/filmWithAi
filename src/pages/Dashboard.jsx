import { useState, useEffect } from 'react'
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent,
  Grid,
  AppBar,
  Toolbar,
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
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'
import UserProfile from '../components/UserProfile'
import OnboardingModal from '../components/OnboardingModal'
import ProjectSelectionModal from '../components/ProjectSelectionModal'
import { toggleProjectFavorite, getFavoriteProjects } from '../services/projectApi'

/**
 * SceneForge 대시보드 페이지 컴포넌트
 * 인증된 사용자의 메인 페이지
 * 스토리 생성, 콘티 생성, 프로젝트 관리 기능을 제공
 */
const Dashboard = () => {
  // Zustand 스토어에서 사용자 정보와 로그아웃 함수 가져오기
  const { user, logout } = useAuthStore()
  
  // React Router 네비게이션 훅
  const navigate = useNavigate()
  
  // 로컬 상태 관리
  const [projects, setProjects] = useState([]) // 프로젝트 목록
  const [favoriteProjects, setFavoriteProjects] = useState([]) // 즐겨찾기 프로젝트 목록
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
    
    fetchProjects()
    fetchFavoriteProjects()
    
    // 첫 로그인 시 온보딩 표시 (로컬 스토리지 체크)
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding')
    if (!hasSeenOnboarding) {
      setShowOnboarding(true)
    }
  }, [])

  // 페이지 포커스 시 프로젝트 목록 새로고침
  useEffect(() => {
    const handleFocus = () => {
      fetchProjects()
      fetchFavoriteProjects()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  /**
   * 서버에서 사용자의 프로젝트 목록을 가져오는 함수
   */
  const fetchProjects = async () => {
    try {
      console.log('📋 프로젝트 목록 조회 시작')
      const response = await api.get('/projects')
      console.log('📋 프로젝트 목록 API 응답:', response.data)
      
      const projectsData = response.data.data?.projects || response.data.projects || []
      console.log('📋 프로젝트 목록 데이터:', projectsData)
      console.log('📋 프로젝트 개수:', projectsData.length)
      
      // 즐겨찾기 상태 확인
      const favoriteProjects = projectsData.filter(p => p.isFavorite)
      console.log('📋 즐겨찾기된 프로젝트:', favoriteProjects)
      console.log('📋 즐겨찾기된 프로젝트 개수:', favoriteProjects.length)
      
      setProjects(projectsData)
    } catch (error) {
      console.error('프로젝트 조회 실패:', error)
      console.error('프로젝트 조회 에러 상세:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      // 에러 시 빈 배열로 설정
      setProjects([])
    }
  }

  /**
   * 서버에서 즐겨찾기된 프로젝트 목록을 가져오는 함수
   */
  const fetchFavoriteProjects = async () => {
    try {
      console.log('⭐ 즐겨찾기 프로젝트 조회 시작')
      const response = await getFavoriteProjects()
      console.log('⭐ 즐겨찾기 프로젝트 API 응답:', response)
      
      const favoriteProjectsData = response.data?.projects || response.projects || []
      console.log('⭐ 즐겨찾기 프로젝트 데이터:', favoriteProjectsData)
      console.log('⭐ 즐겨찾기 프로젝트 개수:', favoriteProjectsData.length)
      
      setFavoriteProjects(favoriteProjectsData)
    } catch (error) {
      console.error('즐겨찾기 프로젝트 조회 실패:', error)
      console.error('즐겨찾기 프로젝트 조회 에러 상세:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      // 에러 시 빈 배열로 설정
      setFavoriteProjects([])
    }
  }

  /**
   * 프로젝트 즐겨찾기 토글 핸들러
   * @param {Object} project - 토글할 프로젝트
   * @param {Event} event - 클릭 이벤트
   */
  const handleToggleFavorite = async (project, event) => {
    event.stopPropagation() // 카드 클릭 이벤트 방지
    
    const projectId = project._id || project.id
    console.log('⭐ 즐겨찾기 토글 시작 - 프로젝트 ID:', projectId)
    console.log('⭐ 현재 프로젝트 즐겨찾기 상태:', project.isFavorite)
    setTogglingFavorite(projectId)
    
    try {
      const response = await toggleProjectFavorite(projectId)
      console.log('⭐ 즐겨찾기 토글 API 응답:', response)
      
      // 토글 성공 메시지 표시
      const message = response.data?.message || response.message || '즐겨찾기가 업데이트되었습니다.'
      toast.success(message)
      
      console.log('⭐ 토글 후 즉시 즐겨찾기 목록 새로고침 시작')
      // 즐겨찾기 목록 먼저 새로고침
      await fetchFavoriteProjects()
      console.log('⭐ 즐겨찾기 목록 새로고침 완료')
      
      console.log('⭐ 프로젝트 목록 새로고침 시작')
      // 프로젝트 목록 새로고침
      await fetchProjects()
      console.log('⭐ 프로젝트 목록 새로고침 완료')
      
      console.log('⭐ 즐겨찾기 토글 완료 - 모든 데이터 새로고침됨')
    } catch (error) {
      console.error('즐겨찾기 토글 실패:', error)
      console.error('즐겨찾기 토글 에러 상세:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      toast.error('즐겨찾기 토글에 실패했습니다.')
    } finally {
      setTogglingFavorite(null)
    }
  }

  /**
   * 즐겨찾기된 프로젝트 스케줄 보기 핸들러
   * @param {Object} project - 선택된 프로젝트 (선택사항)
   */
  const handleViewFavoriteSchedule = (project = null) => {
    console.log('📅 handleViewFavoriteSchedule 호출됨')
    console.log('📅 전달된 프로젝트:', project)
    console.log('📅 현재 즐겨찾기 프로젝트 목록:', favoriteProjects)
    
    if (favoriteProjects.length === 0) {
      toast.error('즐겨찾기된 프로젝트가 없습니다.')
      return
    }

    if (favoriteProjects.length === 1 && !project) {
      // 즐겨찾기가 1개인 경우 바로 해당 프로젝트의 스케줄로 이동
      const singleProject = favoriteProjects[0]
      const projectId = singleProject._id || singleProject.id
      console.log('📅 단일 즐겨찾기 프로젝트로 스케줄 페이지 이동:', projectId)
      navigate(`/schedule/${projectId}`)
    } else if (project) {
      // 특정 프로젝트가 선택된 경우
      const projectId = project._id || project.id
      console.log('📅 선택된 프로젝트로 스케줄 페이지 이동:', projectId)
      navigate(`/schedule/${projectId}`)
    } else {
      // 즐겨찾기가 여러 개인 경우 선택 모달 표시
      console.log('📅 여러 즐겨찾기 프로젝트 - 선택 모달 표시')
      setShowFavoriteSelection(true)
    }
  }

  /**
   * 즐겨찾기 프로젝트 선택 모달 닫기 핸들러
   */
  const handleFavoriteSelectionClose = () => {
    setShowFavoriteSelection(false)
  }

  /**
   * 즐겨찾기 프로젝트 선택 핸들러
   * @param {Object} project - 선택된 프로젝트
   */
  const handleSelectFavoriteProject = (project) => {
    console.log('📅 즐겨찾기 프로젝트 선택됨:', project)
    const projectId = project._id || project.id
    console.log('📅 선택된 프로젝트 ID:', projectId)
    
    // 선택된 프로젝트로 스케줄 페이지 이동
    navigate(`/schedule/${projectId}`)
    setShowFavoriteSelection(false)
  }

  /**
   * 새 프로젝트 생성 버튼 클릭 핸들러
   * 프로젝트 제목 입력 모달 표시
   */
  const handleCreateProject = () => {
    setShowProjectSelection(true)
  }

  /**
   * 프로젝트 생성 확인 핸들러
   * @param {Object} projectData - 프로젝트 데이터
   */
  const handleConfirmProjectCreation = async (projectData) => {
    try {
      const response = await api.post('/projects', {
        projectTitle: projectData.title,
        synopsis: projectData.synopsis || '',
        status: 'draft'
      })
      
      if (response.data.success) {
        const projectId = response.data.project._id
        toast.success('새 프로젝트가 생성되었습니다!')
        
        // 스토리 생성 방식에 따라 다른 페이지로 이동
        if (projectData.storyGenerationType === 'direct') {
          // 직접 스토리 작성 페이지로 이동
          navigate('/direct-story')
        } else {
          // AI 스토리 생성 페이지로 이동
          navigate(`/project/${projectId}/conte`)
        }
      } else {
        throw new Error(response.data.message || '프로젝트 생성에 실패했습니다.')
      }
    } catch (error) {
      console.error('프로젝트 생성 실패:', error)
      toast.error('프로젝트 생성에 실패했습니다.')
    }
  }

  /**
   * 프로젝트 선택 모달 닫기 핸들러
   */
  const handleProjectSelectionClose = () => {
    setShowProjectSelection(false)
  }

  /**
   * 스토리 생성 선택 핸들러
   */
  const handleSelectStoryGeneration = () => {
    setShowProjectSelection(false)
    navigate('/story-generation')
  }

  /**
   * 콘티 생성 선택 핸들러
   */
  const handleSelectConteGeneration = () => {
    setShowProjectSelection(false)
    navigate('/direct-story')
  }

  /**
   * 스토리 생성 버튼 클릭 핸들러
   */
  const handleStoryGeneration = () => {
    navigate('/story-generation')
  }

  /**
   * 콘티 생성 버튼 클릭 핸들러
   */
  const handleConteGeneration = () => {
    navigate('/direct-story')
  }

  
  /**
   * 간단한 스케줄 페이지로 이동하는 핸들러
   */
  const handleSimpleSchedule = () => {
    navigate('/simple-schedule')
  }

  /**
   * 즐겨찾기된 프로젝트 목록 보기 핸들러 (기존 함수 제거)
   */
  // const handleViewFavorites = () => {
  //   if (favoriteProjects.length > 0) {
  //     // 즐겨찾기된 프로젝트들을 로컬 스토리지에 저장하고 스케줄 페이지로 이동
  //     localStorage.setItem('favoriteProjects', JSON.stringify(favoriteProjects))
  //     navigate('/simple-schedule?view=favorites')
  //   } else {
  //     toast.error('즐겨찾기된 프로젝트가 없습니다.')
  //   }
  // }

  /**
   * 프로젝트 카드 클릭 핸들러
   * @param {string} projectId - 프로젝트 ID
   */
  const handleProjectClick = (projectId) => {
    navigate(`/project/${projectId}`)
  }

  /**
   * 프로젝트 상태 라벨 반환
   * @param {Object} project - 프로젝트 객체
   * @returns {string} 상태 라벨
   */
  const getProjectStatusLabel = (project) => {
    if (project.status === 'production_ready') return '촬영 준비 완료'
    if (project.status === 'conte_ready') return '콘티 준비 완료'
    if (project.status === 'story_ready') return '스토리 준비 완료'
    if (project.conteCount > 0) return '콘티 생성됨'
    if (project.story) return '스토리 완성'
    return '초안'
  }

  /**
   * 프로젝트 상태 색상 반환
   * @param {Object} project - 프로젝트 객체
   * @returns {string} 상태 색상
   */
  const getProjectStatusColor = (project) => {
    if (project.status === 'production_ready') return 'success'
    if (project.status === 'conte_ready') return 'info'
    if (project.status === 'story_ready') return 'warning'
    if (project.conteCount > 0) return 'info'
    if (project.story) return 'primary'
    return 'default'
  }

  /**
   * 온보딩 완료 핸들러
   * 로컬 스토리지에 온보딩 완료 표시를 저장
   */
  const handleOnboardingComplete = () => {
    localStorage.setItem('hasSeenOnboarding', 'true')
    setShowOnboarding(false)
    toast.success('SceneForge를 시작합니다!')
  }

  /**
   * 프로젝트 삭제 버튼 클릭 핸들러
   * @param {Object} project - 삭제할 프로젝트
   * @param {Event} event - 클릭 이벤트
   */
  const handleDeleteClick = (project, event) => {
    event.stopPropagation() // 카드 클릭 이벤트 방지
    setProjectToDelete(project)
    setDeleteDialogOpen(true)
  }

  /**
   * 삭제 확인 다이얼로그 닫기 핸들러
   */
  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false)
    setProjectToDelete(null)
  }

  /**
   * 프로젝트 삭제 실행 핸들러
   */
  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return

    setDeletingProject(true)
    
    try {
      const projectId = projectToDelete._id || projectToDelete.id
      const response = await api.delete(`/projects/${projectId}`)
      
      if (response.data.success) {
        toast.success('프로젝트가 삭제되었습니다.')
        // 프로젝트 목록에서 삭제된 프로젝트 제거
        setProjects(prev => prev.filter(p => (p._id || p.id) !== projectId))
      } else {
        throw new Error(response.data.message || '프로젝트 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('프로젝트 삭제 실패:', error)
      toast.error('프로젝트 삭제에 실패했습니다.')
    } finally {
      setDeletingProject(false)
      handleDeleteDialogClose()
    }
  }

  /**
   * 스케줄 보기 버튼 클릭 핸들러
   */
  const handleScheduleView = () => {
    console.log('📅 스케줄 보기 버튼 클릭')
    console.log('📅 현재 즐겨찾기 프로젝트 목록:', favoriteProjects)
    console.log('📅 즐겨찾기 프로젝트 개수:', favoriteProjects.length)
    console.log('📅 즐겨찾기 프로젝트 상세 정보:')
    favoriteProjects.forEach((project, index) => {
      console.log(`📅 프로젝트 ${index + 1}:`, {
        id: project._id || project.id,
        title: project.projectTitle,
        isFavorite: project.isFavorite,
        synopsis: project.synopsis?.substring(0, 50) + '...'
      })
    })
    
    if (favoriteProjects.length === 0) {
      console.log('📅 즐겨찾기된 프로젝트가 없음 - 에러 메시지 표시')
      toast.error('즐겨찾기된 프로젝트가 없습니다. 먼저 프로젝트를 즐겨찾기에 추가해주세요.')
      return
    }
    
    if (favoriteProjects.length === 1) {
      // 즐겨찾기된 프로젝트가 1개인 경우 바로 스케줄 페이지로 이동
      const projectId = favoriteProjects[0]._id || favoriteProjects[0].id
      console.log('📅 단일 즐겨찾기 프로젝트로 스케줄 페이지 이동:', projectId)
      navigate(`/schedule/${projectId}`)
    } else {
      // 즐겨찾기된 프로젝트가 여러 개인 경우 선택 모달 표시
      console.log('📅 여러 즐겨찾기 프로젝트 - 선택 모달 표시')
      setShowFavoriteSelection(true)
    }
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* 상단 앱바 */}
      <AppBar position="static">
        <Toolbar>
          {/* 앱 제목 */}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            SceneForge
          </Typography>
          
          {/* 사용자 프로필 컴포넌트 */}
          <UserProfile />
        </Toolbar>
      </AppBar>

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
              <Grid item xs={12} sm={6} md={4} key={project._id || project.id}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' },
                    position: 'relative'
                  }}
                  onClick={() => handleProjectClick(project._id || project.id)}
                >
                  {/* 삭제 버튼 */}
                  <IconButton
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8, // 삭제 버튼을 맨 오른쪽에 배치
                      backgroundColor: 'transparent', // 투명 배경으로 변경
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)', // 호버 시 약간의 반투명 배경
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
                      right: 40, // 즐겨찾기 버튼을 오른쪽에서 두 번째로 배치
                      backgroundColor: 'transparent', // 투명 배경으로 변경
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)', // 호버 시 약간의 반투명 배경
                      }
                    }}
                    onClick={(e) => handleToggleFavorite(project, e)}
                    size="small"
                    disabled={togglingFavorite === project._id || togglingFavorite === project.id}
                  >
                    {project.isFavorite ? <Star sx={{ fontSize: 16, color: 'warning.main' }} /> : <StarBorder sx={{ fontSize: 16, color: 'warning.main' }} />}
                  </IconButton>
                  
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {project.projectTitle || '제목 없음'}
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
                        {project.lastViewedAt && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            최근 조회: {new Date(project.lastViewedAt).toLocaleString('ko-KR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Typography>
                        )}
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

      {/* 즐겨찾기 프로젝트 선택 모달 */}
      <Dialog
        open={showFavoriteSelection}
        onClose={handleFavoriteSelectionClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          즐겨찾기된 프로젝트 선택
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            스케줄을 볼 프로젝트를 선택해주세요.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {favoriteProjects.map((project) => (
              <Card
                key={project._id || project.id}
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    transform: 'translateY(-1px)',
                    transition: 'all 0.2s ease'
                  }
                }}
                onClick={() => handleSelectFavoriteProject(project)}
              >
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    {project.projectTitle || '제목 없음'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {project.synopsis?.substring(0, 100) || '설명 없음'}...
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      수정일: {new Date(project.updatedAt || project.createdAt).toLocaleString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Typography>
                    <Chip 
                      label={getProjectStatusLabel(project)} 
                      size="small" 
                      color={getProjectStatusColor(project)}
                    />
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFavoriteSelectionClose}>
            취소
          </Button>
        </DialogActions>
      </Dialog>

      {/* 온보딩 모달 */}
      <OnboardingModal
        open={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={handleOnboardingComplete}
      />

      {/* 프로젝트 생성 모달 */}
      <ProjectSelectionModal
        open={showProjectSelection}
        onClose={handleProjectSelectionClose}
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
            <strong>{projectToDelete?.projectTitle || '이 프로젝트'}</strong>를 삭제하시겠습니까?
            <br />
            이 작업은 되돌릴 수 없으며, 프로젝트와 관련된 모든 콘티 데이터가 함께 삭제됩니다.
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
            disabled={deletingProject}
            startIcon={deletingProject ? <CircularProgress size={16} /> : <Delete />}
          >
            {deletingProject ? '삭제 중...' : '삭제'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Dashboard 