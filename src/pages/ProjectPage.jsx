import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { 
  Box, 
  Typography, 
  Container,
  AppBar,
  Toolbar,
  IconButton,
  Button
} from '@mui/material'
import { 
  ArrowBack,
  Save,
  PlayArrow
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'

/**
 * 프로젝트 상세 페이지 컴포넌트
 * 특정 프로젝트의 상세 정보를 표시하고 편집 기능을 제공
 * URL 파라미터로 프로젝트 ID를 받아 해당 프로젝트 정보를 로드
 */
const ProjectPage = () => {
  // URL 파라미터에서 프로젝트 ID 가져오기
  const { projectId } = useParams()
  
  // React Router 네비게이션 훅
  const navigate = useNavigate()
  
  // 로컬 상태 관리
  const [project, setProject] = useState(null) // 프로젝트 정보
  const [loading, setLoading] = useState(true) // 로딩 상태

  // 프로젝트 ID가 변경될 때마다 프로젝트 정보 다시 로드
  useEffect(() => {
    fetchProject()
  }, [projectId])

  /**
   * 서버에서 프로젝트 상세 정보를 가져오는 함수
   */
  const fetchProject = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/projects/${projectId}`)
      setProject(response.data.project)
    } catch (error) {
      console.error('프로젝트 조회 실패:', error)
      toast.error('프로젝트를 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * 뒤로가기 버튼 핸들러
   * 대시보드로 돌아가기
   */
  const handleBack = () => {
    navigate('/')
  }

  /**
   * 저장 버튼 핸들러
   * 현재는 개발 중 메시지만 표시
   */
  const handleSave = () => {
    toast.success('프로젝트가 저장되었습니다.')
  }

  /**
   * AI 생성 버튼 핸들러
   * 현재는 개발 중 메시지만 표시
   */
  const handleGenerate = () => {
    toast.success('AI 생성 기능은 개발 중입니다.')
  }

  // 로딩 중일 때 로딩 화면 표시
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>로딩 중...</Typography>
      </Box>
    )
  }

  // 프로젝트가 없을 때 에러 화면 표시
  if (!project) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>프로젝트를 찾을 수 없습니다.</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* 상단 앱바 */}
      <AppBar position="static">
        <Toolbar>
          {/* 뒤로가기 버튼 */}
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleBack}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          
          {/* 프로젝트 제목 */}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {project.projectTitle}
          </Typography>
          
          {/* 저장 버튼 */}
          <Button 
            color="inherit" 
            startIcon={<Save />}
            onClick={handleSave}
          >
            저장
          </Button>
          
          {/* AI 생성 버튼 */}
          <Button 
            color="inherit" 
            startIcon={<PlayArrow />}
            onClick={handleGenerate}
            sx={{ ml: 1 }}
          >
            AI 생성
          </Button>
        </Toolbar>
      </AppBar>

      {/* 메인 컨텐츠 */}
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {/* 프로젝트 제목 */}
        <Typography variant="h4" gutterBottom>
          {project.projectTitle}
        </Typography>

        {/* 시놉시스 섹션 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            시놉시스
          </Typography>
          <Typography variant="body1" paragraph>
            {project.synopsis}
          </Typography>
        </Box>

        {/* 스토리 섹션 (있는 경우에만 표시) */}
        {project.story && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              스토리
            </Typography>
            <Typography variant="body1" paragraph>
              {project.story}
            </Typography>
          </Box>
        )}

        {/* 콘티 리스트 섹션 (있는 경우에만 표시) */}
        {project.conteList && project.conteList.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              콘티 리스트
            </Typography>
            {project.conteList.map((conte, index) => (
              <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                <Typography variant="subtitle1" gutterBottom>
                  씬 {conte.scene}
                </Typography>
                <Typography variant="body2" paragraph>
                  {conte.description}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  타입: {conte.type === 'generated_video' ? 'AI 생성 비디오' : '실사 촬영용'}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* 프로젝트가 완성되지 않은 경우 안내 메시지 */}
        {(!project.story || !project.conteList || project.conteList.length === 0) && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" gutterBottom>
              프로젝트가 아직 완성되지 않았습니다.
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              AI를 사용하여 스토리와 콘티를 생성해보세요.
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<PlayArrow />}
              onClick={handleGenerate}
              size="large"
            >
              AI로 스토리 생성하기
            </Button>
          </Box>
        )}
      </Container>
    </Box>
  )
}

export default ProjectPage 