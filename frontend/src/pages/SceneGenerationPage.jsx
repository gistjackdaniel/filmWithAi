import { useState, useEffect } from 'react'
import { 
  Box, 
  Typography, 
  Container,
  Button,
  Tabs,
  Tab,
  Paper,
  Alert,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress
} from '@mui/material'
import { 
  Add,
  Edit,
  Delete,
  Visibility,
  Movie,
  AutoFixHigh,
  Refresh,
  CheckCircle,
  Error,
  PlayArrow,
  Settings,
  Timeline
} from '@mui/icons-material'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getProject } from '../services/projectApi'
import { createScene, updateScene, deleteScene, getScenes } from '../services/sceneApi'
import useSceneStore from '../stores/sceneStore'
import useProjectStore from '../stores/projectStore'
import { CommonHeader } from '../components/common'
import LoadingSpinner from '../components/project/LoadingSpinner'

/**
 * 스토리 기반 씬 생성 및 관리 페이지
 * 프로젝트의 스토리를 바탕으로 씬을 생성하고 관리
 */
const SceneGenerationPage = () => {
  const navigate = useNavigate()
  const { projectId } = useParams()
  
  // 로컬 상태 관리
  const [activeTab, setActiveTab] = useState(0) // 0: 씬 목록, 1: 씬 생성, 2: 씬 편집
  const [scenes, setScenes] = useState([])
  const [selectedScene, setSelectedScene] = useState(null)
  const [projectInfo, setProjectInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [sceneForm, setSceneForm] = useState({
    title: '',
    description: '',
    duration: '5분',
    location: '',
    characters: '',
    props: '',
    equipment: '',
    notes: ''
  })

  // Zustand 스토어
  const { 
    createScene: createSceneStore,
    updateScene: updateSceneStore,
    deleteScene: deleteSceneStore,
    scenes: storeScenes,
    isLoading,
    error
  } = useSceneStore()

  const { currentProject } = useProjectStore()

  // 프로젝트 정보 로드
  useEffect(() => {
    if (projectId) {
      loadProjectInfo()
      loadScenes()
    }
  }, [projectId])

  /**
   * 프로젝트 정보 로드
   */
  const loadProjectInfo = async () => {
    try {
      setLoading(true)
      const response = await getProject(projectId)
      
      if (response.success && response.data) {
        setProjectInfo(response.data)
        console.log('✅ 프로젝트 정보 로드 완료:', response.data.title)
      } else {
        throw new Error(response.error || '프로젝트를 찾을 수 없습니다.')
      }
    } catch (error) {
      console.error('❌ 프로젝트 정보 로드 실패:', error)
      toast.error('프로젝트 정보를 불러오는데 실패했습니다.')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  /**
   * 씬 목록 로드
   */
  const loadScenes = async () => {
    try {
      setLoading(true)
      const response = await getScenes(projectId)
      
      if (response.success) {
        setScenes(response.data || [])
        console.log('✅ 씬 목록 로드 완료:', response.data?.length || 0, '개')
      } else {
        console.warn('⚠️ 씬 목록 로드 실패:', response.error)
      }
    } catch (error) {
      console.error('❌ 씬 목록 로드 실패:', error)
      toast.error('씬 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * 뒤로가기 핸들러
   */
  const handleBack = () => {
    navigate(`/project/${projectId}`)
  }

  /**
   * 탭 변경 핸들러
   */
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
  }

  /**
   * 씬 생성 핸들러
   */
  const handleCreateScene = async () => {
    if (!sceneForm.title.trim()) {
      toast.error('씬 제목을 입력해주세요.')
      return
    }

    try {
      setIsGenerating(true)
      const sceneData = {
        ...sceneForm,
        projectId,
        order: scenes.length + 1
      }

      const result = await createSceneStore(sceneData)
      
      if (result.success) {
        toast.success('씬이 생성되었습니다.')
        setSceneForm({
          title: '',
          description: '',
          duration: '5분',
          location: '',
          characters: '',
          props: '',
          equipment: '',
          notes: ''
        })
        setActiveTab(0) // 씬 목록 탭으로 이동
        loadScenes() // 씬 목록 새로고침
      } else {
        throw new Error(result.error || '씬 생성에 실패했습니다.')
      }
    } catch (error) {
      console.error('❌ 씬 생성 실패:', error)
      toast.error('씬 생성에 실패했습니다: ' + error.message)
    } finally {
      setIsGenerating(false)
    }
  }

  /**
   * 씬 편집 핸들러
   */
  const handleEditScene = (scene) => {
    setSelectedScene(scene)
    setSceneForm({
      title: scene.title || '',
      description: scene.description || '',
      duration: scene.duration || '5분',
      location: scene.location || '',
      characters: scene.characters || '',
      props: scene.props || '',
      equipment: scene.equipment || '',
      notes: scene.notes || ''
    })
    setEditDialogOpen(true)
  }

  /**
   * 씬 업데이트 핸들러
   */
  const handleUpdateScene = async () => {
    if (!selectedScene?._id) {
      toast.error('편집할 씬이 선택되지 않았습니다.')
      return
    }

    try {
      setIsGenerating(true)
      const result = await updateSceneStore(selectedScene._id, sceneForm)
      
      if (result.success) {
        toast.success('씬이 업데이트되었습니다.')
        setEditDialogOpen(false)
        setSelectedScene(null)
        loadScenes() // 씬 목록 새로고침
      } else {
        throw new Error(result.error || '씬 업데이트에 실패했습니다.')
      }
    } catch (error) {
      console.error('❌ 씬 업데이트 실패:', error)
      toast.error('씬 업데이트에 실패했습니다: ' + error.message)
    } finally {
      setIsGenerating(false)
    }
  }

  /**
   * 씬 삭제 핸들러
   */
  const handleDeleteScene = async (sceneId) => {
    if (!confirm('정말로 이 씬을 삭제하시겠습니까?')) {
      return
    }

    try {
      const result = await deleteSceneStore(sceneId)
      
      if (result.success) {
        toast.success('씬이 삭제되었습니다.')
        loadScenes() // 씬 목록 새로고침
      } else {
        throw new Error(result.error || '씬 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('❌ 씬 삭제 실패:', error)
      toast.error('씬 삭제에 실패했습니다: ' + error.message)
    }
  }

  /**
   * 컷 생성 페이지로 이동
   */
  const handleGoToCuts = (sceneId) => {
    navigate(`/project/${projectId}/scenes/${sceneId}/cuts`)
  }

  /**
   * 폼 입력 핸들러
   */
  const handleFormChange = (field, value) => {
    setSceneForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* 공통 헤더 */}
      <CommonHeader 
        title={`${projectInfo?.title || '프로젝트'} - 씬 관리`}
        showBackButton={true}
        onBack={handleBack}
      >
        {/* 컷 생성 버튼 */}
        {scenes.length > 0 && (
          <Button 
            color="inherit" 
            startIcon={<Timeline />}
            onClick={() => navigate(`/project/${projectId}/cuts`)}
            sx={{ ml: 1 }}
          >
            컷 관리
          </Button>
        )}
      </CommonHeader>

      {/* 메인 컨텐츠 */}
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {/* 프로젝트 정보 */}
        {projectInfo && (
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              📁 프로젝트 정보
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  프로젝트명
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {projectInfo.title || projectInfo.projectTitle}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  상태
                </Typography>
                <Chip 
                  label={projectInfo.status || 'draft'} 
                  color="primary" 
                  size="small" 
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  스토리
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, maxHeight: 100, overflow: 'auto' }}>
                  {projectInfo.story || '스토리가 없습니다.'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* 탭 네비게이션 */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            aria-label="씬 관리 탭"
          >
            <Tab 
              label="씬 목록" 
              icon={<Movie />} 
              iconPosition="start"
            />
            <Tab 
              label="씬 생성" 
              icon={<Add />} 
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* 씬 목록 탭 */}
        {activeTab === 0 && (
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                🎬 씬 목록 ({scenes.length}개)
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setActiveTab(1)}
              >
                새 씬 생성
              </Button>
            </Box>

            {loading ? (
              <LoadingSpinner message="씬 목록을 불러오는 중..." />
            ) : scenes.length === 0 ? (
              <Alert severity="info">
                아직 생성된 씬이 없습니다. "새 씬 생성" 버튼을 클릭하여 첫 번째 씬을 만들어보세요.
              </Alert>
            ) : (
              <Grid container spacing={2}>
                {scenes.map((scene, index) => (
                  <Grid item xs={12} md={6} lg={4} key={scene._id}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Typography variant="h6" component="h3">
                            씬 {scene.order || index + 1}: {scene.title}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleEditScene(scene)}
                            >
                              <Edit />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteScene(scene._id)}
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {scene.description || '설명이 없습니다.'}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                          <Chip 
                            label={`${scene.duration || '5분'}`} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                          {scene.location && (
                            <Chip 
                              label={scene.location} 
                              size="small" 
                              color="secondary" 
                              variant="outlined"
                            />
                          )}
                        </Box>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            {scene.characters ? `캐릭터: ${scene.characters}` : '캐릭터 없음'}
                          </Typography>
                          <Button
                            size="small"
                            startIcon={<Timeline />}
                            onClick={() => handleGoToCuts(scene._id)}
                          >
                            컷 관리
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        )}

        {/* 씬 생성 탭 */}
        {activeTab === 1 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              ✨ 새 씬 생성
            </Typography>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              프로젝트의 스토리를 바탕으로 새로운 씬을 생성합니다.
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="씬 제목"
                  value={sceneForm.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                  required
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>지속시간</InputLabel>
                  <Select
                    value={sceneForm.duration}
                    onChange={(e) => handleFormChange('duration', e.target.value)}
                    label="지속시간"
                  >
                    <MenuItem value="1분">1분</MenuItem>
                    <MenuItem value="3분">3분</MenuItem>
                    <MenuItem value="5분">5분</MenuItem>
                    <MenuItem value="10분">10분</MenuItem>
                    <MenuItem value="15분">15분</MenuItem>
                    <MenuItem value="30분">30분</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="씬 설명"
                  value={sceneForm.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  multiline
                  rows={4}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="촬영 장소"
                  value={sceneForm.location}
                  onChange={(e) => handleFormChange('location', e.target.value)}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="등장 캐릭터"
                  value={sceneForm.characters}
                  onChange={(e) => handleFormChange('characters', e.target.value)}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="소품"
                  value={sceneForm.props}
                  onChange={(e) => handleFormChange('props', e.target.value)}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="필요 장비"
                  value={sceneForm.equipment}
                  onChange={(e) => handleFormChange('equipment', e.target.value)}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="추가 노트"
                  value={sceneForm.notes}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                  multiline
                  rows={3}
                  sx={{ mb: 3 }}
                />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleCreateScene}
                disabled={isGenerating || !sceneForm.title.trim()}
              >
                {isGenerating ? '씬 생성 중...' : '씬 생성'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => setActiveTab(0)}
              >
                취소
              </Button>
            </Box>

            {isGenerating && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  씬을 생성하고 있습니다...
                </Typography>
              </Box>
            )}
          </Paper>
        )}

        {/* 에러 상태 표시 */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Container>

      {/* 씬 편집 다이얼로그 */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          씬 편집: {selectedScene?.title}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="씬 제목"
                value={sceneForm.title}
                onChange={(e) => handleFormChange('title', e.target.value)}
                required
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>지속시간</InputLabel>
                <Select
                  value={sceneForm.duration}
                  onChange={(e) => handleFormChange('duration', e.target.value)}
                  label="지속시간"
                >
                  <MenuItem value="1분">1분</MenuItem>
                  <MenuItem value="3분">3분</MenuItem>
                  <MenuItem value="5분">5분</MenuItem>
                  <MenuItem value="10분">10분</MenuItem>
                  <MenuItem value="15분">15분</MenuItem>
                  <MenuItem value="30분">30분</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="씬 설명"
                value={sceneForm.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                multiline
                rows={4}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="촬영 장소"
                value={sceneForm.location}
                onChange={(e) => handleFormChange('location', e.target.value)}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="등장 캐릭터"
                value={sceneForm.characters}
                onChange={(e) => handleFormChange('characters', e.target.value)}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="소품"
                value={sceneForm.props}
                onChange={(e) => handleFormChange('props', e.target.value)}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="필요 장비"
                value={sceneForm.equipment}
                onChange={(e) => handleFormChange('equipment', e.target.value)}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="추가 노트"
                value={sceneForm.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                multiline
                rows={3}
                sx={{ mb: 2 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            취소
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateScene}
            disabled={isGenerating}
          >
            {isGenerating ? '업데이트 중...' : '업데이트'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default SceneGenerationPage
