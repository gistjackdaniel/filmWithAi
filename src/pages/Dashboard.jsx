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
  Chip
} from '@mui/material'
import { 
  Add, 
  Folder, 
  AccountCircle,
  Logout,
  Create,
  Movie,
  AutoFixHigh,
  History
} from '@mui/icons-material'
import { useAuthStore } from '../stores/authStore'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'
import UserProfile from '../components/UserProfile'
import OnboardingModal from '../components/OnboardingModal'
import ProjectSelectionModal from '../components/ProjectSelectionModal'

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
  const [showOnboarding, setShowOnboarding] = useState(false) // 온보딩 모달 표시 여부
  const [showProjectSelection, setShowProjectSelection] = useState(false) // 프로젝트 선택 모달 표시 여부

  // 컴포넌트 마운트 시 프로젝트 목록 가져오기 및 온보딩 체크
  useEffect(() => {
    // 기존 임시 데이터 정리
    localStorage.removeItem('project-storage')
    localStorage.removeItem('story-storage')
    sessionStorage.clear()
    
    fetchProjects()
    
    // 첫 로그인 시 온보딩 표시 (로컬 스토리지 체크)
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding')
    if (!hasSeenOnboarding) {
      setShowOnboarding(true)
    }
  }, [])

  /**
   * 서버에서 사용자의 프로젝트 목록을 가져오는 함수
   */
  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects')
      setProjects(response.data.data.projects || [])
    } catch (error) {
      console.error('프로젝트 조회 실패:', error)
      // 에러 시 빈 배열로 설정
      setProjects([])
    }
  }

  /**
   * 새 프로젝트 생성 버튼 클릭 핸들러
   * 프로젝트 선택 모달을 표시
   */
  const handleCreateProject = () => {
    setShowProjectSelection(true)
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
   * 프로젝트 카드 클릭 핸들러
   * @param {string} projectId - 프로젝트 ID
   */
  const handleProjectClick = (projectId) => {
    navigate(`/project/${projectId}`)
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
          <Grid item xs={12} sm={6} md={3}>
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

          {/* 스토리 생성 카드 */}
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' }
              }}
              onClick={handleStoryGeneration}
            >
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Create sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  AI 스토리 생성
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  시놉시스로 AI 스토리를 생성하세요
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* 콘티 생성 카드 */}
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' }
              }}
              onClick={handleConteGeneration}
            >
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Movie sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  콘티 생성
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  나만의 스토리로 콘티를 자동 생성하세요
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* 프로젝트 목록 보기 카드 */}
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' }
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Folder sx={{ fontSize: 48, color: 'info.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  프로젝트 목록
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  기존 프로젝트들을 확인하세요
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
              <Grid item xs={12} sm={6} md={4} key={project.id || project._id}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' }
                  }}
                  onClick={() => handleProjectClick(project.id || project._id)}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {project.projectTitle || '제목 없음'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {project.synopsis?.substring(0, 100) || '설명 없음'}...
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        수정일: {new Date(project.updatedAt || project.createdAt).toLocaleDateString()}
                      </Typography>
                      <Chip 
                        label={project.story ? '스토리 완성' : '진행 중'} 
                        size="small" 
                        color={project.story ? 'success' : 'warning'}
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

      {/* 온보딩 모달 */}
      <OnboardingModal
        open={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={handleOnboardingComplete}
      />

      {/* 프로젝트 선택 모달 */}
      <ProjectSelectionModal
        open={showProjectSelection}
        onClose={handleProjectSelectionClose}
        onSelectStoryGeneration={handleSelectStoryGeneration}
        onSelectConteGeneration={handleSelectConteGeneration}
      />
    </Box>
  )
}

export default Dashboard 