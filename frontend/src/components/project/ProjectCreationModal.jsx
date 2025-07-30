import React, { useState } from 'react'
import {
  Box,
  Typography,
  Modal,
  TextField,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material'
import {
  Close,
  Create,
  ArrowForward,
  Movie as MovieIcon,
  Timeline as TimelineIcon,
  AutoAwesome as AIIcon,
  Description as SynopsisIcon,
  Book as StoryIcon
} from '@mui/icons-material'
import { createProject } from '../../services/projectApi'
import { useProjectStore } from '../../stores/projectStore'
import { ProjectStatus } from '../../types/project'
import toast from 'react-hot-toast'

/**
 * 프로젝트 생성 모달 컴포넌트
 * 시놉시스와 스토리를 함께 관리하는 통합 프로젝트 생성 모달
 */
const ProjectCreationModal = ({ 
  open, 
  onClose, 
  onConfirm,
  showOnboarding = false,
  onOnboardingComplete
}) => {
  // 프로젝트 스토어
  const { createProject: createProjectStore, isCreating, createError } = useProjectStore()
  
  // 프로젝트 생성 상태
  const [projectData, setProjectData] = useState({
    title: '',
    synopsis: '',
    story: '',
    genre: '일반',
    estimatedDuration: '90분',
    isPublic: false,
    storyGenerationType: 'ai', // 'ai' 또는 'direct'
    tags: []
  })
  
  // UI 상태
  const [showOnboardingModal, setShowOnboardingModal] = useState(showOnboarding)
  const [activeStep, setActiveStep] = useState(0)
  const [errors, setErrors] = useState({})

  // 온보딩 스텝 정의
  const onboardingSteps = [
    {
      label: 'SceneForge에 오신 것을 환영합니다!',
      description: 'AI 기반 영화 제작 타임라인 툴로 당신의 영화를 더 쉽게 만들어보세요.',
      icon: <MovieIcon sx={{ fontSize: 40, color: 'var(--color-accent)' }} />
    },
    {
      label: '시놉시스 작성',
      description: '영화의 핵심 아이디어를 간단히 설명해주세요. AI가 이를 바탕으로 완전한 스토리를 생성합니다.',
      icon: <SynopsisIcon sx={{ fontSize: 40, color: 'var(--color-accent)' }} />
    },
    {
      label: 'AI 스토리 생성',
      description: '시놉시스만 입력하면 AI가 자동으로 완전한 스토리를 생성해드립니다.',
      icon: <AIIcon sx={{ fontSize: 40, color: 'var(--color-accent)' }} />
    },
    {
      label: 'AI 콘티 생성',
      description: '생성된 스토리를 바탕으로 AI가 씬별 콘티를 자동으로 만들어줍니다.',
      icon: <AIIcon sx={{ fontSize: 40, color: 'var(--color-accent)' }} />
    },
    {
      label: '타임라인 시각화',
      description: '실사 촬영용과 AI 생성 비디오를 구분하여 직관적인 타임라인으로 확인하세요.',
      icon: <TimelineIcon sx={{ fontSize: 40, color: 'var(--color-accent)' }} />
    }
  ]

  // 입력 필드 변경 핸들러
  const handleInputChange = (field, value) => {
    setProjectData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // 에러 상태 초기화
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  // 유효성 검사
  const validateForm = () => {
    const newErrors = {}
    
    if (!projectData.title.trim()) {
      newErrors.title = '프로젝트 제목은 필수입니다.'
    }
    
    if (!projectData.synopsis.trim()) {
      newErrors.synopsis = '시놉시스는 필수입니다.'
    }
    
    if (projectData.storyGenerationType === 'direct' && !projectData.story.trim()) {
      newErrors.story = '직접 입력 모드에서는 스토리가 필수입니다.'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      // 백엔드 API를 통한 프로젝트 생성
      const result = await createProject({
        title: projectData.title.trim(),
        synopsis: projectData.synopsis.trim(),
        story: projectData.story.trim(),
        genre: [projectData.genre],
        estimatedDuration: projectData.estimatedDuration,
        isPublic: projectData.isPublic,
        tags: projectData.tags,
        status: ProjectStatus.DRAFT
      })

      if (result.success) {
        // 스토어에 프로젝트 추가
        await createProjectStore(result.data)
        
        toast.success('프로젝트가 성공적으로 생성되었습니다.')
        
        // 콜백 호출
        onConfirm?.(result.data)
        
        // 성공 시 폼 초기화
        handleClose()
      } else {
        toast.error(result.error || '프로젝트 생성에 실패했습니다.')
      }
    } catch (error) {
      console.error('프로젝트 생성 실패:', error)
      toast.error('프로젝트 생성 중 오류가 발생했습니다.')
    }
  }

  // 모달 닫기 시 폼 초기화
  const handleClose = () => {
    setProjectData({
      title: '',
      synopsis: '',
      story: '',
      genre: '일반',
      estimatedDuration: '90분',
      isPublic: false,
      storyGenerationType: 'ai',
      tags: []
    })
    setErrors({})
    onClose()
  }

  // 온보딩 핸들러
  const handleOnboardingNext = () => {
    if (activeStep === onboardingSteps.length - 1) {
      setShowOnboardingModal(false)
      onOnboardingComplete?.()
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1)
    }
  }

  const handleOnboardingBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1)
  }

  const handleOnboardingSkip = () => {
    setShowOnboardingModal(false)
    onOnboardingComplete?.()
  }

  return (
    <>
      {/* 온보딩 모달 */}
      <Dialog
        open={showOnboardingModal}
        onClose={handleOnboardingSkip}
        maxWidth="md"
        fullWidth
        aria-labelledby="onboarding-dialog-title"
        PaperProps={{
          sx: {
            background: 'rgba(47, 47, 55, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(212, 175, 55, 0.2)',
            color: 'var(--color-text-primary)',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          }
        }}
      >
        <DialogTitle 
          id="onboarding-dialog-title"
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            pb: 1
          }}
        >
          <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
            SceneForge 시작하기
          </Typography>
          <IconButton
            onClick={handleOnboardingSkip}
            sx={{ color: 'var(--color-text-secondary)' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          <Stepper activeStep={activeStep} orientation="vertical">
            {onboardingSteps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel
                  StepIconComponent={() => step.icon}
                  sx={{
                    '& .MuiStepLabel-label': {
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      color: 'var(--color-text-primary)'
                    }
                  }}
                >
                  {step.label}
                </StepLabel>
                <StepContent>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: 'var(--color-text-secondary)',
                      mt: 1,
                      mb: 2
                    }}
                  >
                    {step.description}
                  </Typography>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleOnboardingBack}
            sx={{ mr: 1 }}
          >
            이전
          </Button>
          <Button
            variant="contained"
            onClick={handleOnboardingNext}
            sx={{
              background: 'var(--color-accent)',
              '&:hover': {
                background: 'var(--color-accent-hover)'
              }
            }}
          >
            {activeStep === onboardingSteps.length - 1 ? '시작하기' : '다음'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 프로젝트 생성 모달 */}
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="project-creation-modal"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2
        }}
      >
        <Box sx={{
          width: '95%',
          maxWidth: 800,
          maxHeight: '90vh',
          bgcolor: 'background.paper',
          borderRadius: 3,
          boxShadow: 24,
          overflow: 'hidden'
        }}>
          {/* 모달 헤더 */}
          <Box sx={{
            p: 3,
            borderBottom: '1px solid #ddd',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
              새 프로젝트 생성
            </Typography>
            <IconButton onClick={handleClose}>
              <Close />
            </IconButton>
          </Box>

          {/* 에러 메시지 표시 */}
          {createError && (
            <Alert severity="error" sx={{ m: 3, mb: 0 }}>
              {createError}
            </Alert>
          )}

          {/* 모달 내용 */}
          <Box sx={{ p: 3, overflowY: 'auto', maxHeight: 'calc(90vh - 140px)' }}>
            <form onSubmit={handleSubmit}>
              {/* 프로젝트 기본 정보 */}
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                프로젝트 정보
              </Typography>
              
              <TextField
                fullWidth
                label="프로젝트 제목"
                value={projectData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                error={!!errors.title}
                helperText={errors.title}
                sx={{ mb: 2 }}
              />

              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>장르</InputLabel>
                  <Select
                    value={projectData.genre}
                    onChange={(e) => handleInputChange('genre', e.target.value)}
                    label="장르"
                  >
                    <MenuItem value="일반">일반</MenuItem>
                    <MenuItem value="액션">액션</MenuItem>
                    <MenuItem value="드라마">드라마</MenuItem>
                    <MenuItem value="코미디">코미디</MenuItem>
                    <MenuItem value="로맨스">로맨스</MenuItem>
                    <MenuItem value="스릴러">스릴러</MenuItem>
                    <MenuItem value="호러">호러</MenuItem>
                    <MenuItem value="SF">SF</MenuItem>
                    <MenuItem value="판타지">판타지</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>예상 지속시간</InputLabel>
                  <Select
                    value={projectData.estimatedDuration}
                    onChange={(e) => handleInputChange('estimatedDuration', e.target.value)}
                    label="예상 지속시간"
                  >
                    <MenuItem value="30분">30분</MenuItem>
                    <MenuItem value="60분">60분</MenuItem>
                    <MenuItem value="90분">90분</MenuItem>
                    <MenuItem value="120분">120분</MenuItem>
                    <MenuItem value="150분">150분</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* 시놉시스 입력 */}
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                시놉시스
              </Typography>
              
              <TextField
                fullWidth
                multiline
                rows={4}
                label="영화의 핵심 아이디어를 간단히 설명해주세요"
                value={projectData.synopsis}
                onChange={(e) => handleInputChange('synopsis', e.target.value)}
                error={!!errors.synopsis}
                helperText={errors.synopsis || "영화의 기본 줄거리와 핵심 요소들을 포함해주세요"}
                sx={{ mb: 2 }}
              />

              {/* 스토리 생성 방식 선택 */}
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                스토리 생성 방식
              </Typography>
              
              <FormControl component="fieldset" sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant={projectData.storyGenerationType === 'ai' ? 'contained' : 'outlined'}
                    onClick={() => handleInputChange('storyGenerationType', 'ai')}
                    startIcon={<AIIcon />}
                    sx={{ flex: 1 }}
                  >
                    AI 자동 생성
                  </Button>
                  <Button
                    variant={projectData.storyGenerationType === 'direct' ? 'contained' : 'outlined'}
                    onClick={() => handleInputChange('storyGenerationType', 'direct')}
                    startIcon={<StoryIcon />}
                    sx={{ flex: 1 }}
                  >
                    직접 입력
                  </Button>
                </Box>
              </FormControl>

              {/* 직접 입력 모드일 때 스토리 입력 필드 */}
              {projectData.storyGenerationType === 'direct' && (
                <>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    스토리
                  </Typography>
                  
                  <TextField
                    fullWidth
                    multiline
                    rows={8}
                    label="완전한 스토리를 직접 작성해주세요"
                    value={projectData.story}
                    onChange={(e) => handleInputChange('story', e.target.value)}
                    error={!!errors.story}
                    helperText={errors.story || "캐릭터, 플롯, 대화 등을 포함한 완전한 스토리를 작성해주세요"}
                    sx={{ mb: 2 }}
                  />
                </>
              )}

              {/* 공개 설정 */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Button
                  variant={projectData.isPublic ? 'contained' : 'outlined'}
                  onClick={() => handleInputChange('isPublic', !projectData.isPublic)}
                  size="small"
                >
                  {projectData.isPublic ? '공개' : '비공개'}
                </Button>
                <Typography variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
                  {projectData.isPublic ? '다른 사용자들이 볼 수 있습니다' : '나만 볼 수 있습니다'}
                </Typography>
              </Box>

              {/* 제출 버튼 */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button onClick={handleClose}>
                  취소
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isCreating}
                  startIcon={<Create />}
                  sx={{
                    background: 'var(--color-accent)',
                    '&:hover': {
                      background: 'var(--color-accent-hover)'
                    }
                  }}
                >
                  {isCreating ? '생성 중...' : '프로젝트 생성'}
                </Button>
              </Box>
            </form>
          </Box>
        </Box>
      </Modal>
    </>
  )
}

export default ProjectCreationModal 