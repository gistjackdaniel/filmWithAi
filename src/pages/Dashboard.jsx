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
  Container
} from '@mui/material'
import { 
  Add, 
  Folder, 
  AccountCircle,
  Logout 
} from '@mui/icons-material'
import { useAuthStore } from '../stores/authStore'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'
import UserProfile from '../components/UserProfile'
import OnboardingModal from '../components/OnboardingModal'

/**
 * 대시보드 페이지 컴포넌트
 * 인증된 사용자의 메인 페이지
 * 프로젝트 목록과 사용자 메뉴를 제공
 */
const Dashboard = () => {
  // Zustand 스토어에서 사용자 정보와 로그아웃 함수 가져오기
  const { user, logout } = useAuthStore()
  
  // React Router 네비게이션 훅
  const navigate = useNavigate()
  
  // 로컬 상태 관리
  const [projects, setProjects] = useState([]) // 프로젝트 목록
  const [showOnboarding, setShowOnboarding] = useState(false) // 온보딩 모달 표시 여부

  // 컴포넌트 마운트 시 프로젝트 목록 가져오기 및 온보딩 체크
  useEffect(() => {
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
      setProjects(response.data.projects)
    } catch (error) {
      console.error('프로젝트 조회 실패:', error)
    }
  }

  /**
   * 새 프로젝트 생성 버튼 클릭 핸들러
   * 현재는 개발 중 메시지만 표시
   */
  const handleCreateProject = () => {
    toast.success('새 프로젝트 기능은 개발 중입니다.')
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
          🎬 영화 프로젝트 관리
        </Typography>

        {/* 액션 카드 그리드 */}
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

          {/* 프로젝트 목록 보기 카드 */}
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' }
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Folder sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  프로젝트 목록 보기
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
              <Grid item xs={12} sm={6} md={4} key={project._id}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { transform: 'translateY(-2px)', transition: '0.2s' }
                  }}
                  onClick={() => handleProjectClick(project._id)}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {project.projectTitle}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {project.synopsis?.substring(0, 100)}...
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      수정일: {new Date(project.updatedAt).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            // 프로젝트가 없는 경우: 빈 상태 메시지
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    아직 프로젝트가 없습니다.
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
    </Box>
  )
}

export default Dashboard 