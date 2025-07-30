import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { 
  Container,
  Typography, 
  Box, 
  Button,
  Chip, 
  Grid,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  LinearProgress,
  Alert,
  Snackbar,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Tabs,
  Tab,
  Divider
} from '@mui/material'
import { 
  ArrowBack,
  Save,
  PlayArrow,
  Edit,
  Delete,
  Add,
  List,
  Book,
  Schedule,
  Movie,
  Videocam,
  CloudUpload,
  Refresh,
  Settings,
  Info,
  CheckCircle,
  Error,
  Warning,
  Print,
  Visibility,
  Timeline,
  LocationOn,
  Group,
  Build
} from '@mui/icons-material'
import { useAuthStore } from '../stores/authStore'
import useProjectStore from '../stores/projectStore'
import { CommonHeader } from '../components/common'
import StoryResult from '../components/project/StoryResult'
import CutTimelineViewer from '../components/timeline/organisms/CutTimelineViewer'
import VideoPlayer from '../components/timeline/atoms/VideoPlayer'
import { toast } from 'react-hot-toast'
import api from '../services/api'

// Conte 관련 컴포넌트들은 제거됨 - 시놉시스 → 스토리 생성 → 씬 생성 → 컷 생성 로직 사용
import useTimelineStore from '../stores/timelineStore'

/**
 * 프로젝트 상세 페이지 컴포넌트
 * 특정 프로젝트의 상세 정보를 표시하고 편집 기능을 제공
 * URL 파라미터로 프로젝트 ID를 받아 해당 프로젝트 정보를 로드
 * 탭 구조: 프로젝트 정보 → 씬 CRUD → 듀얼 타임라인 → 스케줄링 → 브레이크다운
 */
const ProjectPage = () => {
  // URL 파라미터에서 프로젝트 ID 가져오기
  const { projectId } = useParams()
  
  // React Router 네비게이션 훅
  const navigate = useNavigate()
  const location = useLocation()
  
  // 인증 상태 확인
  const { isAuthenticated, token, user } = useAuthStore()
  
  // 타임라인 스토어에서 데이터 가져오기
  const {
    cuts,
    scenes,
    selectedCutId,
    selectedSceneId,
    loading: timelineLoading,
    error: timelineError,
    currentProjectId,
    modalOpen,
    currentCut,
    currentScene,
    selectCut,
    loadProjectCuts,
    setCurrentProjectId,
    openModal,
    closeModal,
    disconnectRealtimeUpdates,
    loadCutDetails,
    updateCutWithAPI,
    deleteCutWithAPI,
    createCutWithAPI,
    updateSceneWithAPI,
    deleteSceneWithAPI,
    createSceneWithAPI,
    loadSceneDetails,
    selectScene,
    updateCut,
    deleteCut,
    createCut,
    updateScene,
    deleteScene,
    createScene,
    reorderCuts,
    reorderScenes,
    setModalOpen,
    setCurrentCut,
    setCurrentScene,
    setSelectedCutId,
    setSelectedSceneId,
    setTimelineLoading,
    setTimelineError,
    setCuts,
    setScenes,
    resetTimelineState
  } = useTimelineStore()
  
  // 프로젝트 스토어에서 데이터 가져오기
  const {
    project,
    loading: projectLoading,
    error: projectError,
    fetchProject: fetchProjectFromStore,
    updateProject,
    deleteProject,
    createProject,
    resetProjectState
  } = useProjectStore()
  
  // 로컬 상태 관리
  const [activeTab, setActiveTab] = useState(0) // 0: 프로젝트 정보, 1: 씬 CRUD, 2: 듀얼 타임라인, 3: 스케줄링, 4: 브레이크다운
  const [showSceneList, setShowSceneList] = useState(true)
  const [showTimeline, setShowTimeline] = useState(false)
  const [showV2Track, setShowV2Track] = useState(false)
  const [v2Videos, setV2Videos] = useState([])
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackIntervalRef] = useState(useRef(null))
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingScene, setEditingScene] = useState(null)
  const [showCutList, setShowCutList] = useState(false)
  const [showContinuityBook, setShowContinuityBook] = useState(false)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState('success')

  // 탭 변경 핸들러
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
      
    // 탭에 따라 적절한 상태 설정
    if (newValue === 1) { // 씬 CRUD 탭
      setShowSceneList(true)
      setShowTimeline(false)
    } else if (newValue === 2) { // 듀얼 타임라인 탭
          setShowSceneList(false)
          setShowTimeline(true)
    }
  }

  // 탭 렌더링 함수
  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // 프로젝트 정보 탭
        return renderProjectInfoTab()
      case 1: // 씬 CRUD 탭
        return renderSceneCRUDTab()
      case 2: // 듀얼 타임라인 탭
        return renderTimelineTab()
      case 3: // 스케줄링 탭
        return renderSchedulingTab()
      case 4: // 브레이크다운 탭
        return renderBreakdownTab()
      default:
        return renderProjectInfoTab()
    }
  }

  // 프로젝트 정보 탭 렌더링
  const renderProjectInfoTab = () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        프로젝트 정보
      </Typography>
      
      {project ? (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  기본 정보
          </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1">
                    <strong>제목:</strong> {project.title}
          </Typography>
                  <Typography variant="body1">
                    <strong>상태:</strong> {project.status}
                  </Typography>
                  <Typography variant="body1">
                    <strong>생성일:</strong> {new Date(project.createdAt).toLocaleDateString('ko-KR')}
          </Typography>
        </Box>
                
        <Button 
            variant="outlined"
                  startIcon={<Edit />}
                  onClick={handleEditProject}
          >
                  프로젝트 편집
          </Button>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
              <Typography variant="h6" gutterBottom>
                시놉시스
              </Typography>
                <Typography variant="body2" paragraph>
                  {project.synopsis || '시놉시스가 없습니다.'}
              </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12}>
            <Card>
              <CardContent>
              <Typography variant="h6" gutterBottom>
                  스토리
              </Typography>
                <Typography variant="body2" paragraph>
                  {project.story || '스토리가 없습니다.'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        <Alert severity="info">
          프로젝트 정보를 불러오는 중입니다...
        </Alert>
      )}
    </Box>
  )

  // 씬 CRUD 탭 렌더링
  const renderSceneCRUDTab = () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        씬 관리
                  </Typography>
      
      <Box sx={{ mb: 3 }}>
              <Button
                variant="contained"
                startIcon={<Add />}
          onClick={() => navigate(`/scene-generation/${projectId}`)}
              >
          씬 생성
              </Button>
          </Box>
          
            {project?.conteList && project.conteList.length > 0 ? (
              <Grid container spacing={2}>
                {project.conteList.map((scene, index) => (
                  <Grid item xs={12} md={6} lg={4} key={scene.id || index}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    씬 {scene.scene}: {scene.title}
                          </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {scene.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Chip 
                      icon={<LocationOn />}
                      label={scene.keywords?.location || '장소 미정'}
                            size="small" 
                      color="primary"
                          />
                            <Chip 
                      icon={<Schedule />}
                      label={scene.keywords?.timeOfDay || '시간 미정'}
                              size="small" 
                      color="secondary"
                            />
                            <Chip 
                      icon={<Group />}
                      label={`${scene.cast?.length || 0}명 출연`}
                              size="small" 
                      color="info"
                            />
                        </Box>
                      </CardContent>
                <CardActions>
                          <Button
                            size="small"
                    startIcon={<Edit />}
                    onClick={() => handleEditScene(scene)}
                  >
                    편집
                  </Button>
                  <Button
                    size="small"
                    startIcon={<Movie />}
                            onClick={() => handleGenerateCutsForScene(scene)}
                          >
                            컷 생성
                          </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
        <Alert severity="info">
          씬이 없습니다. 씬을 생성해주세요.
        </Alert>
            )}
          </Box>
  )

  // 듀얼 타임라인 탭 렌더링
  const renderTimelineTab = () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        듀얼 타임라인
            </Typography>
      
            {cuts && cuts.length > 0 ? (
              <CutTimelineViewer
                scenes={(() => {
                  const scenesWithCuts = project?.conteList?.map(scene => {
                    const sceneCuts = cuts.filter(cut => {
                      const sceneIdMatch = cut.sceneId === scene.id || cut.sceneId === scene._id
                      const sceneNumberMatch = cut.sceneNumber === scene.scene
                      const conteIdMatch = cut.sceneId === scene.conteId
                      
                      return sceneIdMatch || sceneNumberMatch || conteIdMatch
                    })
                    
                    return {
                      ...scene,
                      cuts: sceneCuts
                    }
                  }) || []
                  
                  return scenesWithCuts
                })()}
            loading={timelineLoading || false}
                selectedCutId={selectedCutId || null}
                onCutClick={handleCutClick}
                onCutEdit={handleCutEdit}
                onCutInfo={handleCutInfo}
          onCutDelete={handleCutDelete}
                onCutsReorder={handleCutsReorder}
                onGenerateConte={handleGenerateConte}
                onGenerateCuts={handleGenerateCutsForAllScenes}
                emptyMessage="컷이 없습니다. 씬 리스트에서 컷을 생성해보세요."
                timeScale={100}
            zoomLevel={1}
            showTimeInfo={true}
            baseScale={1}
            onViewSchedule={handleViewSchedule}
                onCutSelect={handleCutSelect}
                currentTime={currentTime}
                onTimeChange={setCurrentTime}
                isPlaying={isPlaying}
                onPlayStateChange={(playing) => {
            if (playing === isPlaying) return
                  
                  const prevIsPlaying = isPlaying
                  setIsPlaying(playing)
                  
                  if (playing && !prevIsPlaying) {
                    if (playbackIntervalRef.current) {
                      clearInterval(playbackIntervalRef.current)
                    }
                    playbackIntervalRef.current = setInterval(() => {
                      setCurrentTime(prevTime => {
                  const newTime = prevTime + 0.1
                        const totalDuration = calculateTotalDuration()
                        if (newTime >= totalDuration) {
                          if (playbackIntervalRef.current) {
                            clearInterval(playbackIntervalRef.current)
                            playbackIntervalRef.current = null
                          }
                          setIsPlaying(false)
                          return totalDuration
                        }
                        return newTime
                      })
              }, 200)
                  } else if (!playing && prevIsPlaying) {
                    if (playbackIntervalRef.current) {
                      clearInterval(playbackIntervalRef.current)
                      playbackIntervalRef.current = null
                    }
                  }
                }}
                onV2StateChange={(v2State) => {
                  setShowV2Track(v2State.showV2Track)
                  setV2Videos(v2State.v2Videos)
                }}
              />
            ) : (
              <Box sx={{ 
                textAlign: 'center', 
                py: 8, 
                bgcolor: 'background.paper', 
                borderRadius: 2,
                border: '2px dashed rgba(212, 175, 55, 0.3)'
              }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  컷이 없습니다
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  씬 리스트에서 컷을 생성한 후 타임라인을 확인할 수 있습니다.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
            onClick={() => setActiveTab(1)}
                >
                  씬 리스트로 이동
                </Button>
        </Box>
            )}
    </Box>
  )

  // 스케줄링 탭 렌더링
  const renderSchedulingTab = () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        스케줄링
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<Schedule />}
          onClick={() => navigate(`/all-schedule/${projectId}`)}
        >
          스케줄러 보기
        </Button>
          </Box>
      
      <Alert severity="info">
        스케줄링 기능을 사용하려면 "스케줄러 보기" 버튼을 클릭하세요.
      </Alert>
    </Box>
  )

  // 브레이크다운 탭 렌더링
  const renderBreakdownTab = () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        일일 브레이크다운
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<Build />}
          onClick={() => navigate(`/daily-breakdown/${projectId}`)}
        >
          브레이크다운 보기
        </Button>
      </Box>
      
      <Alert severity="info">
        일일 브레이크다운을 확인하려면 "브레이크다운 보기" 버튼을 클릭하세요.
      </Alert>
    </Box>
  )

  // 기존 핸들러 함수들...
  const handleEditProject = () => {
    // 프로젝트 편집 로직
    toast.info('프로젝트 편집 기능은 개발 중입니다.')
  }

  const handleEditScene = (scene) => {
    // 씬 편집 로직
    navigate(`/scene-generation/${projectId}?editScene=${scene.id}`)
  }

  const handleGenerateCutsForScene = (scene) => {
    // 특정 씬의 컷 생성 로직
    toast.info(`${scene.title} 씬의 컷을 생성합니다.`)
  }

  const handleCutClick = (cut) => {
    // 컷 클릭 핸들러
    console.log('컷 클릭:', cut)
  }

  const handleCutEdit = (cut) => {
    // 컷 편집 핸들러
    console.log('컷 편집:', cut)
  }

  const handleCutInfo = (cut) => {
    // 컷 정보 핸들러
    console.log('컷 정보:', cut)
  }

  const handleCutDelete = (cut) => {
    // 컷 삭제 핸들러
    console.log('컷 삭제:', cut)
  }

  const handleCutsReorder = (cuts) => {
    // 컷 순서 변경 핸들러
    console.log('컷 순서 변경:', cuts)
  }

  const handleGenerateConte = () => {
    // 콘티 생성 핸들러
    console.log('콘티 생성')
  }

  const handleGenerateCutsForAllScenes = () => {
    // 모든 씬의 컷 생성 핸들러
    console.log('모든 씬의 컷 생성')
  }

  const handleViewSchedule = () => {
    // 스케줄 보기 핸들러
    navigate(`/all-schedule/${projectId}`)
  }

  const handleCutSelect = (cut) => {
    // 컷 선택 핸들러
    console.log('컷 선택:', cut)
  }

  const calculateTotalDuration = () => {
    // 총 재생 시간 계산
    return cuts?.reduce((total, cut) => total + (cut.estimatedDuration || 5), 0) || 0
  }

  // 뒤로가기 핸들러
  const handleBack = () => {
    navigate(-1)
  }

  // 프로젝트 데이터 로드
  const fetchProject = async () => {
    try {
      if (!projectId) return
      
      await fetchProjectFromStore(projectId)
      
      // 타임라인 데이터도 함께 로드
      if (projectId !== currentProjectId) {
        setCurrentProjectId(projectId)
        await loadProjectCuts(projectId)
      }
    } catch (error) {
      console.error('프로젝트 로드 실패:', error)
      toast.error('프로젝트를 불러오는데 실패했습니다.')
    }
  }

  // 컴포넌트 마운트 시 프로젝트 데이터 로드
  useEffect(() => {
    if (projectId && isAuthenticated) {
      fetchProject()
    }
  }, [projectId, isAuthenticated])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current)
                      }
      disconnectRealtimeUpdates()
    }
  }, [])

  if (!isAuthenticated) {
                      return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography variant="h6">로그인이 필요합니다.</Typography>
      </Box>
                      )
  }

  if (projectLoading) {
                      return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <LinearProgress />
                        </Box>
    )
  }

  if (projectError) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Alert severity="error">프로젝트를 불러오는데 실패했습니다.</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--color-background)' }}>
      {/* 공통 헤더 */}
      <CommonHeader 
        title={project?.title || '프로젝트'}
        showBackButton={true}
        onBack={handleBack}
      />

      {/* 메인 컨텐츠 */}
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* 탭 네비게이션 */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="프로젝트 탭">
            <Tab 
              icon={<Info />} 
              label="프로젝트 정보" 
              iconPosition="start"
            />
            <Tab 
              icon={<Movie />} 
              label="씬 관리" 
              iconPosition="start"
            />
            <Tab 
              icon={<Timeline />} 
              label="듀얼 타임라인" 
              iconPosition="start"
            />
            <Tab 
              icon={<Schedule />} 
              label="스케줄링" 
              iconPosition="start"
            />
            <Tab 
              icon={<Build />} 
              label="브레이크다운" 
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* 탭 컨텐츠 */}
        {renderTabContent()}
      </Container>

      {/* 스낵바 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default ProjectPage 