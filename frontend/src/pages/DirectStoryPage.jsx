import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  AlertTitle,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Divider
} from '@mui/material'
import {
  Save,
  TipsAndUpdates,
  Movie,
  Timeline,
  Error,
  Refresh,
  Edit,
  ExpandMore,
  Lightbulb,
  Warning,
  AutoStories,
  Create
} from '@mui/icons-material'
import { useProjectStore } from '../stores/projectStore'
import { useStoryStore } from '../stores/storyStore'
import { shouldUseDevImages, shouldShowDevBadge, getAppName, getCurrentMode } from '../config/appConfig'
import { CommonHeader } from '../components/common'

/**
 * 직접 스토리 작성 페이지
 * 사용자가 직접 스토리를 작성하고 프로젝트로 저장하는 페이지
 * 시놉시스 → 스토리 → 씬 → 컷 플로우의 일부
 */
const DirectStoryPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const projectStore = useProjectStore()
  const storyStore = useStoryStore()
  
  // 전달받은 프로젝트 정보
  const passedProjectId = location.state?.projectId
  const passedProjectTitle = location.state?.projectTitle
  
  // 상태 관리
  const [synopsis, setSynopsis] = useState('')
  const [story, setStory] = useState('')
  const [activeStep, setActiveStep] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [savingProject, setSavingProject] = useState(false)
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [projectTitle, setProjectTitle] = useState('')
  const [projectDescription, setProjectDescription] = useState('')

  // 로컬 스토리지에서 상태 복원
  useEffect(() => {
    const savedState = localStorage.getItem('directStoryPageState')
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState)
        if (parsedState.synopsis) {
          setSynopsis(parsedState.synopsis)
          setHasUnsavedChanges(true)
        }
        if (parsedState.story) {
          setStory(parsedState.story)
          setHasUnsavedChanges(true)
        }
        if (parsedState.projectTitle) {
          setProjectTitle(parsedState.projectTitle)
        }
        if (parsedState.projectDescription) {
          setProjectDescription(parsedState.projectDescription)
        }
      } catch (error) {
        console.error('저장된 상태 복원 실패:', error)
      }
    }
  }, [])

  // 상태 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    const stateToSave = {
      synopsis,
      story,
      projectTitle,
      projectDescription,
      activeStep
    }
    localStorage.setItem('directStoryPageState', JSON.stringify(stateToSave))
  }, [synopsis, story, projectTitle, projectDescription, activeStep])

  // 페이지 이탈 시 경고
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowExitDialog(true)
    } else {
      navigate(-1)
    }
  }

  const handleExitConfirm = () => {
    localStorage.removeItem('directStoryPageState')
    navigate(-1)
  }

  const handleExitCancel = () => {
    setShowExitDialog(false)
  }

  const handleSynopsisChange = (e) => {
    setSynopsis(e.target.value)
    setHasUnsavedChanges(true)
  }

  const handleStoryChange = (e) => {
    setStory(e.target.value)
    setHasUnsavedChanges(true)
  }

  const handleProjectTitleChange = (e) => {
    setProjectTitle(e.target.value)
    setHasUnsavedChanges(true)
  }

  const handleProjectDescriptionChange = (e) => {
    setProjectDescription(e.target.value)
    setHasUnsavedChanges(true)
  }

  const handleNextStep = () => {
    if (activeStep === 0 && synopsis.trim() && story.trim()) {
      setActiveStep(1)
    }
  }

  const handlePrevStep = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1)
    }
  }

  const handleSaveProject = async () => {
    if (!projectTitle.trim()) {
      toast.error('프로젝트 제목을 입력해주세요.')
      return
    }

    if (!synopsis.trim()) {
      toast.error('시놉시스를 입력해주세요.')
      return
    }

    if (!story.trim()) {
      toast.error('스토리를 입력해주세요.')
      return
    }

    setSavingProject(true)
    
    try {
      // 프로젝트 생성
      const projectData = {
        title: projectTitle,
        description: projectDescription,
        synopsis: synopsis,
        story: story,
        status: 'story_ready' // 스토리가 완성된 상태
      }
      
      const createdProject = await projectStore.createProject(projectData)
      
      if (createdProject) {
        toast.success('프로젝트가 성공적으로 저장되었습니다!')
        
        // 로컬 스토리지 정리
        localStorage.removeItem('directStoryPageState')
        setHasUnsavedChanges(false)
        
        // 프로젝트 상세 페이지로 이동
        navigate(`/project/${createdProject._id}`)
      }
    } catch (error) {
      console.error('프로젝트 저장 실패:', error)
      toast.error('프로젝트 저장에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setSavingProject(false)
    }
  }

  const handleContinueToScenes = () => {
    if (projectTitle.trim() && synopsis.trim() && story.trim()) {
      // 임시 프로젝트 데이터로 씬 생성 페이지로 이동
      const tempProjectData = {
        title: projectTitle,
        description: projectDescription,
        synopsis: synopsis,
        story: story
      }
      
      navigate('/project/temp/scene-generation', { 
        state: { 
          tempProjectData,
          fromDirectStory: true
      }
      })
    }
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* 공통 헤더 */}
      <CommonHeader 
        title="직접 스토리 작성"
        showBackButton={true}
        onBack={handleBack}
      >
        <Button 
          color="inherit" 
          startIcon={<Save />}
          onClick={handleSaveProject}
          disabled={
            !projectTitle.trim() || 
            !synopsis.trim() || 
            !story.trim() || 
            savingProject
          }
          sx={{
            backgroundColor: 
              (projectTitle.trim() && synopsis.trim() && story.trim())
                ? 'rgba(255,255,255,0.1)' 
                : 'transparent',
            '&:hover': {
              backgroundColor: 
                (projectTitle.trim() && synopsis.trim() && story.trim())
                  ? 'rgba(255,255,255,0.2)' 
                  : 'transparent',
            }
          }}
        >
          {savingProject ? '저장 중...' : '프로젝트 저장'}
        </Button>
      </CommonHeader>

      {/* 메인 컨텐츠 */}
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {/* 페이지 제목 */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h3" gutterBottom sx={{ 
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold'
          }}>
            ✍️ 직접 스토리 작성
          </Typography>
          <Typography variant="h6" color="text.secondary">
            영화 스토리를 직접 작성하고 프로젝트로 저장하세요
          </Typography>
        </Box>

        {/* 진행 단계 표시 */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          <Step>
            <StepLabel>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AutoStories />
                스토리 작성
              </Box>
            </StepLabel>
          </Step>
          <Step>
            <StepLabel>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Create />
                프로젝트 설정
              </Box>
            </StepLabel>
          </Step>
        </Stepper>

        {/* 스토리 작성 단계 */}
        {activeStep === 0 && (
          <Box>
            {/* 스토리 작성 가이드 */}
            <Card sx={{ mb: 3, backgroundColor: 'rgba(33, 150, 243, 0.05)', border: '1px solid rgba(33, 150, 243, 0.2)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <TipsAndUpdates color="primary" />
                  <Typography variant="h6" color="primary">
                    스토리 작성 가이드
                  </Typography>
                </Box>
                <Typography variant="body1" paragraph>
                  영화의 시놉시스와 스토리를 작성해주세요. 작성한 내용은 프로젝트로 저장되어 
                  씬 생성 및 컷 편집에 활용됩니다.
                </Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>시놉시스:</strong> 영화의 핵심 내용을 간단히 요약한 내용
                    </Typography>
                  <Typography variant="body2">
                    <strong>스토리:</strong> 영화의 전체적인 줄거리와 캐릭터, 장면들을 상세히 기술한 내용
                    </Typography>
                </Alert>
              </CardContent>
            </Card>

            <Grid container spacing={3}>
              {/* 시놉시스 입력 */}
              <Grid item xs={12} md={6}>
                <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                      <Lightbulb sx={{ mr: 1, verticalAlign: 'middle' }} />
                      시놉시스
                </Typography>
                <TextField
                  fullWidth
                  multiline
                      rows={6}
                  variant="outlined"
                      placeholder="영화의 핵심 내용을 간단히 요약해주세요..."
                      value={synopsis}
                      onChange={handleSynopsisChange}
                  sx={{ mb: 2 }}
                />
                    <Typography variant="caption" color="text.secondary">
                      {synopsis.length}/1000자
                    </Typography>
              </CardContent>
            </Card>
              </Grid>

              {/* 스토리 입력 */}
              <Grid item xs={12} md={6}>
                <Card>
              <CardContent>
                  <Typography variant="h6" gutterBottom>
                      <AutoStories sx={{ mr: 1, verticalAlign: 'middle' }} />
                      스토리
                  </Typography>
                <TextField
                  fullWidth
                  multiline
                      rows={6}
                  variant="outlined"
                      placeholder="영화의 전체적인 줄거리와 캐릭터, 장면들을 상세히 기술해주세요..."
                      value={story}
                      onChange={handleStoryChange}
                  sx={{ mb: 2 }}
                />
                    <Typography variant="caption" color="text.secondary">
                      {story.length}/2000자
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

                {/* 다음 단계 버튼 */}
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    size="large"
                onClick={handleNextStep}
                disabled={!synopsis.trim() || !story.trim()}
                startIcon={<TipsAndUpdates />}
                  >
                다음 단계
                  </Button>
                </Box>
          </Box>
        )}

        {/* 프로젝트 설정 단계 */}
        {activeStep === 1 && (
          <Box>
            {/* 프로젝트 설정 가이드 */}
            <Card sx={{ mb: 3, backgroundColor: 'rgba(76, 175, 80, 0.05)', border: '1px solid rgba(76, 175, 80, 0.2)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Create color="success" />
                  <Typography variant="h6" color="success.main">
                    프로젝트 설정
                  </Typography>
                </Box>
                <Typography variant="body1" paragraph>
                  작성한 스토리를 프로젝트로 저장하기 위한 정보를 입력해주세요.
                </Typography>
              </CardContent>
            </Card>

            <Grid container spacing={3}>
              {/* 프로젝트 정보 */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      프로젝트 정보
                    </Typography>
                    
                    <TextField
                      fullWidth
                      label="프로젝트 제목"
                      variant="outlined"
                      value={projectTitle}
                      onChange={handleProjectTitleChange}
                      sx={{ mb: 3 }}
                      required
                    />
                    
                    <TextField
                      fullWidth
                      label="프로젝트 설명"
                  variant="outlined"
                      multiline
                      rows={3}
                      value={projectDescription}
                      onChange={handleProjectDescriptionChange}
                      placeholder="프로젝트에 대한 간단한 설명을 입력해주세요..."
                    />
                  </CardContent>
                </Card>
              </Grid>

              {/* 작성된 스토리 미리보기 */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      작성된 스토리 미리보기
              </Typography>
              
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="subtitle1">시놉시스</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                          {synopsis}
                        </Typography>
                      </AccordionDetails>
                    </Accordion>
                    
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="subtitle1">스토리</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                          {story}
                        </Typography>
                      </AccordionDetails>
                    </Accordion>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* 액션 버튼들 */}
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Button
                variant="outlined"
                onClick={handlePrevStep}
                startIcon={<TipsAndUpdates />}
              >
                이전 단계
                </Button>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleContinueToScenes}
                  disabled={!projectTitle.trim()}
                  startIcon={<Movie />}
                >
                  씬 생성으로 이동
                </Button>
                
                              <Button
                                variant="contained"
                  onClick={handleSaveProject}
                  disabled={!projectTitle.trim() || savingProject}
                  startIcon={<Save />}
                >
                  {savingProject ? '저장 중...' : '프로젝트 저장'}
                              </Button>
                            </Box>
                        </Box>
                        </Box>
                    )}
      </Container>

      {/* 나가기 확인 다이얼로그 */}
      <Dialog
        open={showExitDialog}
        onClose={handleExitCancel}
        aria-labelledby="exit-dialog-title"
        aria-describedby="exit-dialog-description"
      >
        <DialogTitle id="exit-dialog-title">
          <Warning sx={{ mr: 2 }} /> 저장되지 않은 변경사항이 있습니다.
        </DialogTitle>
        <DialogContent>
          <Typography id="exit-dialog-description">
            현재 페이지에서 나가시면 변경사항이 저장되지 않습니다. 정말로 나가시겠습니까?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleExitCancel} color="primary">
            취소
          </Button>
          <Button onClick={handleExitConfirm} color="error" variant="contained">
            나가기
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default DirectStoryPage 