import { useState } from 'react'
import { 
  Box, 
  Typography, 
  Container,
  AppBar,
  Toolbar,
  IconButton,
  Button,
  TextField,
  Card,
  CardContent,
  Grid,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  LinearProgress
} from '@mui/material'
import { 
  ArrowBack,
  Save,
  PlayArrow,
  Edit,
  Refresh,
  Error,
  Movie,
  ExpandMore,
  Lightbulb,
  TipsAndUpdates,
  Timeline
} from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import ConteGenerator from '../components/StoryGeneration/ConteGenerator'
import ConteEditModal from '../components/StoryGeneration/ConteEditModal'
import { generateSceneImage } from '../services/storyGenerationApi'
import useStoryGenerationStore from '../stores/storyGenerationStore'
// react에서 useEffect import
import { useEffect } from 'react';

/**
 * 직접 스토리 작성 페이지 컴포넌트
 * 사용자가 직접 스토리를 작성하고 AI가 콘티를 생성할 수 있는 페이지
 */
const DirectStoryPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  
  // 로컬 상태 관리
  const [story, setStory] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatingImages, setGeneratingImages] = useState(false)
  const [imageGenerationProgress, setImageGenerationProgress] = useState(0)
  const [generatedConte, setGeneratedConte] = useState([])
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingConte, setEditingConte] = useState(null)
  const [activeStep, setActiveStep] = useState(0)
  const [selectedConte, setSelectedConte] = useState(null)
  const [conteModalOpen, setConteModalOpen] = useState(false)

  // 이미지 로딩 실패 상태 관리
  const [imageLoadErrors, setImageLoadErrors] = useState({})
  
  // 상태 복원 (뒤로가기 시)
  useEffect(() => {
    const restoredState = location.state
    
    if (restoredState) {
      // 단계 상태 복원
      if (restoredState.activeStep !== undefined) {
        setActiveStep(restoredState.activeStep)
      }
      
      // 스토리 복원
      if (restoredState.story) {
        setStory(restoredState.story)
      }
      
      // 생성된 콘티 복원
      if (restoredState.generatedConte) {
        setGeneratedConte(restoredState.generatedConte)
      }
      
      // 이미지 로딩 에러 상태 복원
      if (restoredState.imageLoadErrors) {
        setImageLoadErrors(restoredState.imageLoadErrors)
      }
      
      // 선택된 콘티 복원
      if (restoredState.selectedConte) {
        setSelectedConte(restoredState.selectedConte)
      }
      
      // 모달 상태 복원
      if (restoredState.conteModalOpen) {
        setConteModalOpen(restoredState.conteModalOpen)
      }
      
      if (restoredState.editModalOpen) {
        setEditModalOpen(restoredState.editModalOpen)
      }
      
      if (restoredState.editingConte) {
        setEditingConte(restoredState.editingConte)
      }
      
      // 상태 복원 완료 알림
      toast.success('이전 작업 상태가 복원되었습니다.')
    }
  }, [location.state])

  // DirectStoryPage는 로컬 상태를 사용하므로 스토어 함수는 사용하지 않음

  // 스토리 작성 예시
  const storyExample = `예시: "도시의 밤거리를 걷는 한 남자가 우연히 옛 연인을 만난다. 
그녀는 지금은 성공한 사업가가 되었지만, 과거의 아픈 기억 때문에 그를 피하고 있다. 
남자는 그녀의 마음을 돌리기 위해 과거의 아름다운 추억들을 하나씩 되살려나간다. 
하지만 시간이 지나면서 둘 사이의 갈등은 깊어지고, 결국 그들은 서로의 진심을 확인하는 
중요한 선택의 순간에 놓이게 된다."`

  // 이벤트 핸들러들
  const handleBack = () => navigate('/')
  const handleSave = () => toast.success('스토리가 저장되었습니다.')

  const handleConteGenerationStart = () => {
    setIsGenerating(true)
    setActiveStep(1)
    toast.loading('콘티를 생성하고 있습니다...')
    console.log('🎬 콘티 생성 시작')
  }

  const handleConteGenerationComplete = (conteList) => {
    setIsGenerating(false)
    
    // conteList가 null이면 생성 실패
    if (conteList === null) {
      console.error('❌ 콘티 생성 실패: null 데이터')
      toast.error('콘티 생성에 실패했습니다. 다시 시도해주세요.')
      return
    }
    
    // conteList가 유효한지 확인
    if (!conteList || !Array.isArray(conteList)) {
      console.error('❌ 콘티 생성 실패: 유효하지 않은 데이터:', conteList)
      toast.error('콘티 생성에 실패했습니다. 다시 시도해주세요.')
      return
    }
    
    // 콘티 데이터에 필요한 기본 필드들 추가
    const processedConteList = conteList.map((conte, index) => ({
      ...conte,
      id: conte.id || `conte-${index}-${Date.now()}`,
      scene: conte.scene || index + 1,
      title: conte.title || `씬 ${index + 1}`,
      description: conte.description || '설명 없음',
      type: conte.type || 'live_action',
      estimatedDuration: conte.estimatedDuration || '5분',
      cameraAngle: conte.cameraAngle || '',
      cameraWork: conte.cameraWork || '',
      lensSpecs: conte.lensSpecs || '',
      visualEffects: conte.visualEffects || '',
      characterLayout: conte.characterLayout || '',
      props: conte.props || '',
      lighting: conte.lighting || '',
      weather: conte.weather || '',
      visualDescription: conte.visualDescription || '',
      transition: conte.transition || '',
      dialogue: conte.dialogue || '',
      keywords: conte.keywords || {},
      weights: conte.weights || {}
    }))
    
    setGeneratedConte(processedConteList)
    toast.dismiss()
    toast.success(`${processedConteList.length}개의 씬이 생성되었습니다!`)
    
    // 콘티 생성 완료 후 결과를 바로 표시
    console.log('✅ 콘티 생성 완료:', processedConteList.length, '개 씬')
  }

  const handleImageGenerationUpdate = (isGenerating, progress) => {
    console.log('🖼️ 이미지 생성 상태 업데이트:', { isGenerating, progress })
    setGeneratingImages(isGenerating)
    setImageGenerationProgress(progress)
  }

  const handleEditConte = (conte) => {
    console.log('🔄 편집 버튼 클릭:', conte)
    setEditingConte(conte)
    setEditModalOpen(true)
    console.log('✅ 편집 모달 상태:', { editingConte: conte, editModalOpen: true })
  }

  const handleEditModalClose = () => {
    setEditModalOpen(false)
    setEditingConte(null)
  }

  const handleSaveConte = (updatedConte) => {
    console.log('💾 DirectStoryPage handleSaveConte 호출됨')
    console.log('updatedConte:', updatedConte)
    console.log('현재 generatedConte 길이:', generatedConte.length)
    
    const updatedConteList = generatedConte.map(conte => 
      conte.id === updatedConte.id ? updatedConte : conte
    )
    
    console.log('업데이트된 콘티 리스트:', updatedConteList)
    setGeneratedConte(updatedConteList)
    toast.success('콘티가 저장되었습니다.')
  }

  const handleRegenerateImage = (updatedConte) => {
    const updatedConteList = generatedConte.map(conte => 
      conte.id === updatedConte.id ? updatedConte : conte
    )
    setGeneratedConte(updatedConteList)
  }

  const handleRegenerateConte = async (conte) => {
    try {
      console.log('🎬 콘티 재생성 시작:', conte.title)
      
      const updatedConte = {
        ...conte,
        lastModified: new Date().toISOString(),
        modifiedBy: '사용자',
        description: `${conte.description} (재생성됨)`,
        dialogue: conte.dialogue ? `${conte.dialogue} (재생성됨)` : '새로운 대사가 생성되었습니다.'
      }
      
      const updatedConteList = generatedConte.map(c => 
        c.id === updatedConte.id ? updatedConte : c
      )
      
      setGeneratedConte(updatedConteList)
      console.log('✅ 콘티 재생성 완료:', updatedConte.title)
      
    } catch (error) {
      console.error('❌ 콘티 재생성 실패:', error)
      throw error
    }
  }

  const handleViewTimeline = () => {
    if (generatedConte.length > 0) {
      // 현재 페이지의 모든 상태를 저장하여 타임라인으로 이동
      const currentPageState = {
        conteData: generatedConte,
        projectTitle: '직접 스토리 프로젝트',
        returnTo: {
          path: '/direct-story',
          state: {
            activeStep: activeStep,
            story: story,
            generatedConte: generatedConte,
            imageLoadErrors: imageLoadErrors,
            selectedConte: selectedConte,
            conteModalOpen: conteModalOpen,
            editModalOpen: editModalOpen,
            editingConte: editingConte
          }
        }
      }
      
      // 타임라인 페이지로 이동하면서 현재 상태 전달
      navigate('/project/temp-project-id', { 
        state: currentPageState
      })
    } else {
      toast.error('타임라인을 보려면 먼저 콘티를 생성해주세요.')
    }
  }

  const handleStoryComplete = () => {
    if (story.trim().length < 100) {
      toast.error('스토리를 더 자세히 작성해주세요. (최소 100자)')
      return
    }
    setActiveStep(1)
  }

  /**
   * 이미지 로딩 실패 핸들러
   * @param {string} conteId - 콘티 ID
   * @param {Event} event - 이미지 로딩 에러 이벤트
   */
  const handleImageLoadError = (conteId, event) => {
    console.error('이미지 로딩 실패:', conteId)
    setImageLoadErrors(prev => ({
      ...prev,
      [conteId]: true
    }))
    // 이미지 요소 숨기기
    if (event.target) {
      event.target.style.display = 'none'
    }
  }

  /**
   * 이미지 재시도 핸들러
   * @param {Object} conte - 콘티 객체
   */
  const handleImageRetry = async (conte) => {
    try {
      console.log('🔄 이미지 재시도 시작:', conte.scene)
      
      // 이미지 생성 API 호출
      const imagePrompt = `${conte.title}: ${conte.description}. ${conte.visualDescription || ''} ${conte.genre || '영화'} 스타일, 시네마틱한 구도, 고품질 이미지`
      
      const imageResponse = await generateSceneImage({
        sceneDescription: imagePrompt,
        style: 'cinematic',
        genre: conte.genre || '일반',
        size: '1024x1024'
      })
      
      // 콘티 리스트에서 해당 콘티 업데이트
      const updatedConteList = generatedConte.map(c => 
        c.id === conte.id ? {
          ...c,
          imageUrl: imageResponse.imageUrl,
          imagePrompt: imagePrompt,
          imageGeneratedAt: imageResponse.generatedAt,
          imageModel: imageResponse.model,
          isFreeTier: imageResponse.isFreeTier
        } : c
      )
      
      // 로컬 상태에 업데이트된 콘티 리스트 저장
      setGeneratedConte(updatedConteList)
      
      // 에러 상태 제거
      setImageLoadErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[conte.id]
        return newErrors
      })
      
      toast.success('이미지가 재생성되었습니다!')
      
    } catch (error) {
      console.error('❌ 이미지 재시도 실패:', error)
      toast.error('이미지 재생성에 실패했습니다.')
    }
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* 상단 앱바 */}
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleBack}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            직접 스토리 작성
          </Typography>
          <Button 
            color="inherit" 
            startIcon={<Save />}
            onClick={handleSave}
          >
            저장
          </Button>
        </Toolbar>
      </AppBar>

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
            영화 스토리를 직접 작성하고 AI가 콘티를 생성해드립니다
          </Typography>
        </Box>

        {/* 진행 단계 표시 */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          <Step>
            <StepLabel>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TipsAndUpdates />
                스토리 작성
              </Box>
            </StepLabel>
          </Step>
          <Step>
            <StepLabel>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Movie />
                콘티 생성
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
                  영화의 전체적인 스토리를 자세히 작성해주세요. AI가 이를 바탕으로 씬별 콘티를 생성합니다.
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      ✅ 좋은 스토리의 특징
                    </Typography>
                    <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
                      <li>명확한 등장인물과 배경</li>
                      <li>흥미로운 갈등과 전개</li>
                      <li>감정적 연결과 공감</li>
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      📝 작성 팁
                    </Typography>
                    <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
                      <li>최소 100자 이상 작성</li>
                      <li>구체적인 장면 묘사</li>
                      <li>대화와 행동 포함</li>
                      <li>감정과 분위기 표현</li>
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* 스토리 작성 영역 */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    영화 스토리 작성
                  </Typography>
                  <Chip 
                    label={`${story.length} / 5000자`}
                    color={story.length > 4000 ? 'error' : story.length > 3000 ? 'warning' : 'default'}
                    variant="outlined"
                  />
                </Box>
                
                <TextField
                  fullWidth
                  multiline
                  rows={15}
                  label="스토리 내용"
                  placeholder="여기에 영화 스토리를 작성하세요..."
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
                
                {/* 스토리 예시 */}
                <Accordion sx={{ mb: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Lightbulb color="warning" />
                      <Typography>스토리 작성 예시</Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" sx={{ 
                      fontStyle: 'italic',
                      p: 2,
                      bgcolor: 'rgba(0, 0, 0, 0.04)',
                      borderRadius: 1,
                      border: '1px solid #ddd'
                    }}>
                      {storyExample}
                    </Typography>
                  </AccordionDetails>
                </Accordion>

                {/* 다음 단계 버튼 */}
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<Movie />}
                    onClick={handleStoryComplete}
                    disabled={!story.trim() || story.length < 100}
                    sx={{
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem'
                    }}
                  >
                    콘티 생성하기
                  </Button>
                </Box>

                {/* 안내 메시지 */}
                {story.length > 0 && story.length < 100 && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    스토리를 더 자세히 작성해주세요. (최소 100자)
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Box>
        )}

        {/* 콘티 생성 단계 */}
        {activeStep === 1 && (
          <Box>
            {/* 콘티 생성 안내 */}
            <Card sx={{ mb: 3, backgroundColor: 'rgba(156, 39, 176, 0.05)', border: '1px solid rgba(156, 39, 176, 0.2)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Movie color="secondary" />
                  <Typography variant="h6" color="secondary">
                    콘티 생성 단계
                  </Typography>
                </Box>
                <Typography variant="body1" paragraph>
                  작성하신 스토리를 바탕으로 AI가 씬별 콘티를 생성합니다. 
                  각 씬에는 촬영 정보, 대사, 시각적 요소가 포함됩니다.
                </Typography>
              </CardContent>
            </Card>

            {/* 콘티 생성기 컴포넌트 */}
            <ConteGenerator 
              story={story}
              onConteGenerated={handleConteGenerationComplete}
              onGenerationStart={handleConteGenerationStart}
              onGenerationComplete={handleConteGenerationComplete}
              onImageGenerationUpdate={handleImageGenerationUpdate}
              isDirectMode={true}
            />
          </Box>
        )}

        {/* 생성된 콘티 결과 표시 */}
        {generatedConte.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 3 
            }}>
              <Typography variant="h5" gutterBottom sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1
              }}>
                🎬 생성된 콘티 리스트
                <Chip 
                  label={`${generatedConte.length}개 씬`} 
                  color="primary" 
                  variant="outlined"
                />
              </Typography>
              
              <Button
                variant="contained"
                startIcon={<Timeline />}
                onClick={handleViewTimeline}
                sx={{
                  backgroundColor: 'var(--color-success)',
                  '&:hover': {
                    backgroundColor: 'var(--color-success-dark)',
                  }
                }}
              >
                타임라인 보기
              </Button>
            </Box>
            
            {generatedConte.map((conte, index) => (
              <Card 
                key={index} 
                sx={{ 
                  mb: 2,
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3,
                    transition: 'all 0.2s ease'
                  }
                }}
              >
                <CardContent>
                  <Grid container spacing={2}>
                    {/* 씬 이미지 */}
                    {conte.imageUrl && (
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ 
                          width: '100%', 
                          height: 150, 
                          borderRadius: 1,
                          overflow: 'hidden',
                          border: '1px solid #ddd',
                          position: 'relative'
                        }}>
                          <img 
                            src={conte.imageUrl} 
                            alt={`씬 ${conte.scene} 이미지`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                            onError={(e) => handleImageLoadError(conte.id, e)}
                          />
                          {imageLoadErrors[conte.id] && (
                            <Box sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: 'rgba(0,0,0,0.7)',
                              color: 'white',
                              textAlign: 'center',
                              padding: '16px'
                            }}>
                              <Error sx={{ color: 'white', mb: 1 }} />
                              <Typography variant="caption" color="white" sx={{ mb: 1, textAlign: 'center' }}>
                                이미지 로딩 실패
                              </Typography>
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<Refresh />}
                                onClick={() => handleImageRetry(conte)}
                                sx={{ 
                                  backgroundColor: 'var(--color-primary)',
                                  '&:hover': {
                                    backgroundColor: 'var(--color-accent)',
                                  }
                                }}
                              >
                                재시도
                              </Button>
                            </Box>
                          )}
                        </Box>
                      </Grid>
                    )}
                    
                    {/* 이미지 생성 중 로딩 표시 */}
                    {!conte.imageUrl && (generatingImages || isGenerating) && (
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ 
                          width: '100%', 
                          height: 150, 
                          borderRadius: 1,
                          border: '1px dashed #ddd',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: 'rgba(0,0,0,0.05)',
                          position: 'relative'
                        }}>
                          <CircularProgress size={40} sx={{ mb: 1 }} />
                          <Typography variant="caption" color="text.secondary" align="center">
                            {generatingImages ? '이미지 생성 중...' : '콘티 생성 중...'}
                          </Typography>
                          {generatingImages && (
                            <LinearProgress 
                              variant="determinate" 
                              value={imageGenerationProgress}
                              sx={{
                                width: '80%',
                                mt: 1,
                                height: 4,
                                borderRadius: 2,
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: 'var(--color-accent)',
                                }
                              }}
                            />
                          )}
                        </Box>
                      </Grid>
                    )}
                    
                    {/* 씬 정보 */}
                    <Grid item xs={12} sm={conte.imageUrl ? 8 : 12}>
                      {/* 이미지가 없고 생성 중이 아닐 때만 플레이스홀더 */}
                      {!conte.imageUrl && !generatingImages && (
                        <Box sx={{ 
                          width: '100%', 
                          height: 150, 
                          borderRadius: 1,
                          border: '1px dashed #ddd',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: 'rgba(0,0,0,0.05)',
                          mb: 2
                        }}>
                          <Typography variant="body2" color="text.secondary">
                            이미지 없음
                          </Typography>
                        </Box>
                      )}
                      <Typography variant="h6" gutterBottom>
                        씬 {conte.scene || index + 1}: {conte.title}
                      </Typography>
                      <Typography variant="body2" paragraph>
                        {conte.description}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          타입: {conte.type === 'generated_video' ? 'AI 생성 비디오' : '실사 촬영용'}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {conte.imageUrl && (
                            <Chip 
                              label={conte.imageModel === 'unsplash-api' ? 'AI 이미지' : '실제 AI'} 
                              size="small" 
                              color={conte.imageModel === 'unsplash-api' ? 'warning' : 'success'} 
                              variant="outlined"
                            />
                          )}
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Edit />}
                            onClick={() => handleEditConte(conte)}
                            sx={{ minWidth: 'auto', px: 1 }}
                          >
                            편집
                          </Button>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}


      </Container>

      {/* 콘티 편집 모달 */}
      <ConteEditModal
        open={editModalOpen}
        onClose={handleEditModalClose}
        conte={editingConte}
        onSave={handleSaveConte}
        onRegenerateImage={handleRegenerateImage}
        onRegenerateConte={handleRegenerateConte}
      />
    </Box>
  )
}

export default DirectStoryPage 