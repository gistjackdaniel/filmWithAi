import { useState, useEffect, useCallback } from 'react'
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
import TimelineViewer from '../components/timeline/organisms/TimelineViewer'
import SceneDetailModal from '../components/timeline/organisms/SceneDetailModal'
import useTimelineStore from '../stores/timelineStore'

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
  
  // 타임라인 스토어
  const {
    scenes,
    selectedSceneId,
    loading: timelineLoading,
    error: timelineError,
    modalOpen,
    currentScene,
    setCurrentProjectId,
    loadProjectContes,
    selectScene,
    openModal,
    closeModal,
    disconnectRealtimeUpdates
  } = useTimelineStore()
  
  // 로컬 상태 관리
  const [project, setProject] = useState(null) // 프로젝트 정보
  const [loading, setLoading] = useState(true) // 로딩 상태

  // 프로젝트 ID가 변경될 때마다 프로젝트 정보와 타임라인 데이터 로드
  useEffect(() => {
    console.log('ProjectPage useEffect triggered with projectId:', projectId)
    fetchProject()
  }, [projectId])

  // 컴포넌트 언마운트 시 실시간 연결 해제
  useEffect(() => {
    return () => {
      console.log('ProjectPage unmounting, disconnecting realtime updates')
      disconnectRealtimeUpdates()
    }
  }, [disconnectRealtimeUpdates])

  /**
   * 서버에서 프로젝트 상세 정보를 가져오는 함수
   */
  const fetchProject = async () => {
    try {
      console.log('ProjectPage fetchProject started for projectId:', projectId)
      setLoading(true)
      const response = await api.get(`/projects/${projectId}`)
      const projectData = response.data.project
      console.log('ProjectPage project data received:', projectData)
      setProject(projectData)
      
      // 타임라인 스토어에 프로젝트 ID 설정
      setCurrentProjectId(projectId)
      
      // 콘티 데이터가 있으면 타임라인 데이터 로드
      if (projectData.conteList && projectData.conteList.length > 0) {
        console.log('ProjectPage loading contes, count:', projectData.conteList.length)
        const result = await loadProjectContes(projectId)
        console.log('ProjectPage loadProjectContes result:', result)
        if (!result.success) {
          toast.error(result.error || '타임라인 데이터를 불러올 수 없습니다.')
        }
      } else {
        console.log('ProjectPage no contes found in project data')
      }
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

  /**
   * 씬 클릭 핸들러
   */
  const handleSceneClick = useCallback((scene) => {
    selectScene(scene.id)
    openModal(scene)
  }, [selectScene, openModal])

  /**
   * 씬 편집 핸들러
   */
  const handleSceneEdit = useCallback((scene) => {
    toast.info('씬 편집 기능은 향후 구현 예정입니다.')
  }, [])

  /**
   * 씬 정보 핸들러
   */
  const handleSceneInfo = useCallback((scene) => {
    openModal(scene)
  }, [openModal])

  /**
   * 씬 재생성 핸들러
   */
  const handleSceneRegenerate = useCallback((scene) => {
    toast.info('AI 재생성 기능은 향후 구현 예정입니다.')
  }, [])

  /**
   * 씬 순서 변경 핸들러
   */
  const handleScenesReorder = useCallback(async (newScenes) => {
    try {
      // 타임라인 스토어 업데이트
      const { updateScenesOrder } = useTimelineStore.getState()
      updateScenesOrder(newScenes)
      
      // 서버에 순서 변경 저장
      const timelineService = (await import('../services/timelineService')).default
      const result = await timelineService.reorderScenes(projectId, newScenes)
      
      if (result.success) {
        toast.success('씬 순서가 변경되었습니다.')
      } else {
        toast.error(result.error || '씬 순서 변경에 실패했습니다.')
      }
    } catch (error) {
      console.error('씬 순서 변경 실패:', error)
      toast.error('씬 순서 변경에 실패했습니다.')
    }
  }, [projectId])

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

        {/* 타임라인 섹션 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            타임라인
          </Typography>
          {/* 디버깅 로그 추가 */}
          {console.log('ProjectPage scenes before TimelineViewer:', scenes, 'type:', typeof scenes, 'isArray:', Array.isArray(scenes))}
          <TimelineViewer
            scenes={Array.isArray(scenes) ? scenes : []}
            loading={timelineLoading || false}
            selectedSceneId={selectedSceneId || null}
            onSceneClick={handleSceneClick}
            onSceneEdit={handleSceneEdit}
            onSceneInfo={handleSceneInfo}
            onScenesReorder={handleScenesReorder}
            emptyMessage="콘티가 없습니다. AI를 사용하여 콘티를 생성해보세요."
          />
        </Box>

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

      {/* 씬 상세 모달 */}
      <SceneDetailModal
        open={modalOpen}
        scene={currentScene}
        onClose={closeModal}
        onEdit={handleSceneEdit}
        onRegenerate={handleSceneRegenerate}
      />
    </Box>
  )
}

export default ProjectPage 