import { useState, useEffect } from 'react'
import { 
  Box, 
  Typography, 
  Container,
  AppBar,
  Toolbar,
  IconButton,
  Button,
  Tabs,
  Tab,
  Divider,
  Modal,
  Card,
  CardContent,
  Grid,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material'
import { 
  ArrowBack,
  Save,
  History,
  Tune,
  AutoFixHigh,
  Movie,
  ExpandMore,
  Close,
  Edit,
  Timeline
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import SynopsisInputForm from '../components/StoryGeneration/SynopsisInputForm'
import LoadingSpinner from '../components/StoryGeneration/LoadingSpinner'
import StoryResult from '../components/StoryGeneration/StoryResult'
import ErrorBoundary from '../components/StoryGeneration/ErrorBoundary'
import NetworkErrorHandler from '../components/StoryGeneration/NetworkErrorHandler'
import HistoryList from '../components/StoryGeneration/HistoryList'
import TemplateSelector from '../components/StoryGeneration/TemplateSelector'
import StoryQualityEnhancer from '../components/StoryGeneration/StoryQualityEnhancer'
import ConteGenerator from '../components/StoryGeneration/ConteGenerator'
import ConteEditModal from '../components/StoryGeneration/ConteEditModal'
import { generateStoryWithRetry, regenerateConteWithRetry, generateSceneImage } from '../services/storyGenerationApi'
import { autoSaveProject } from '../services/projectApi'
import useStoryGenerationStore from '../stores/storyGenerationStore'
import useStoryHistoryStore from '../stores/storyHistoryStore'

/**
 * AI 스토리 생성 페이지 컴포넌트
 * 사용자가 시놉시스를 입력하고 AI가 스토리를 생성하는 메인 페이지
 * PRD 2.1.2 AI 스토리 생성 기능의 핵심 UI
 */
const StoryGenerationPage = () => {
  // React Router 네비게이션 훅
  const navigate = useNavigate()
  
  // 로컬 상태 관리
  const [activeTab, setActiveTab] = useState(0) // 활성 탭 (0: 생성, 1: 히스토리, 2: 템플릿, 3: 품질 개선, 4: 콘티 생성)
  const [selectedConte, setSelectedConte] = useState(null) // 선택된 콘티
  const [conteModalOpen, setConteModalOpen] = useState(false) // 콘티 상세 모달 열림 상태
  const [editModalOpen, setEditModalOpen] = useState(false) // 편집 모달 열림 상태
  const [editingConte, setEditingConte] = useState(null) // 편집 중인 콘티
  
  // 이미지 로딩 실패 상태 관리
  const [imageLoadErrors, setImageLoadErrors] = useState({})
  
  // Zustand 스토어에서 상태 가져오기
  const {
    synopsis,
    generatedStory,
    isGenerating,
    generationError,
    storySettings,
    templateSelection,
    qualityEnhancement,
    conteGeneration,
    setSynopsis,
    startGeneration,
    completeGeneration,
    failGeneration,
    updateGeneratedStory,
    updateStorySettings,
    updateTemplateSelection,
    updateQualityEnhancement,
    getCurrentError,
    completeConteGeneration,
    startConteGeneration,
    failConteGeneration
  } = useStoryGenerationStore()

  // 히스토리 스토어
  const { addToHistory } = useStoryHistoryStore()

  // 콘티 생성 상태
  const { isConteGenerating, generatedConte } = conteGeneration

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
    toast.success('스토리가 저장되었습니다.')
  }

  /**
   * 자동 저장 핸들러
   * @param {string} projectId - 프로젝트 ID
   * @param {string} story - 저장할 스토리
   */
  const handleAutoSave = async (projectId, story) => {
    try {
      await autoSaveProject(projectId, {
        story,
        synopsis,
        projectTitle: `AI 스토리 프로젝트 - ${new Date().toLocaleDateString()}`
      })
    } catch (error) {
      console.error('자동 저장 실패:', error)
      throw error
    }
  }

  /**
   * AI 스토리 생성 핸들러
   * @param {string} synopsisText - 입력된 시놉시스
   */
  const handleGenerateStory = async (synopsisText) => {
    setSynopsis(synopsisText)
    startGeneration()
    
    const startTime = Date.now()
    
    try {
      // AI 스토리 생성 API 호출
      const response = await generateStoryWithRetry({
        synopsis: synopsisText,
        maxLength: storySettings.maxLength,
        genre: storySettings.genre
      })
      
      const generationTime = Math.round((Date.now() - startTime) / 1000)
      
      completeGeneration(response.story)
      
      // 히스토리에 추가
      addToHistory({
        synopsis: synopsisText,
        story: response.story,
        settings: storySettings,
        generationTime
      })
      
      toast.success('스토리 생성이 완료되었습니다.')
    } catch (error) {
      console.error('스토리 생성 실패:', error)
      const errorMessage = error.message || '스토리 생성에 실패했습니다.'
      failGeneration(errorMessage)
      toast.error(errorMessage)
    }
  }

  /**
   * 히스토리 재사용 핸들러
   * @param {Object} historyData - 재사용할 히스토리 데이터
   */
  const handleReuseHistory = (historyData) => {
    setSynopsis(historyData.synopsis)
    if (historyData.settings) {
      updateStorySettings(historyData.settings)
    }
    // 스토리 내용도 함께 업데이트
    if (historyData.story) {
      updateGeneratedStory(historyData.story)
    }
    toast.success('이전 설정이 복원되었습니다.')
  }

  /**
   * 템플릿 선택 핸들러
   * @param {Object} template - 선택된 템플릿
   */
  const handleTemplateSelect = (template) => {
    // 템플릿 설정이 있으면 적용
    if (template.settings) {
      updateStorySettings(template.settings)
    }
    toast.success(`${template.name} 템플릿이 적용되었습니다.`)
  }

  /**
   * 설정 변경 핸들러
   * @param {Object} newSettings - 새로운 설정
   */
  const handleSettingsChange = (newSettings) => {
    updateStorySettings(newSettings)
  }

  /**
   * 스토리 품질 개선 핸들러
   * @param {Object} enhancementOptions - 개선 옵션
   */
  const handleStoryEnhance = async (enhancementOptions) => {
    if (!synopsis) {
      toast.error('개선할 시놉시스가 없습니다.')
      return
    }

    try {
      // 개선된 설정으로 스토리 재생성
      const enhancedSettings = {
        ...storySettings,
        maxLength: Math.round(storySettings.maxLength * enhancementOptions.lengthMultiplier),
        style: enhancementOptions.style || storySettings.style
      }

      updateStorySettings(enhancedSettings)
      
      // 개선된 설정으로 스토리 재생성
      await handleGenerateStory(synopsis)
      
      toast.success('스토리가 개선되었습니다.')
    } catch (error) {
      console.error('스토리 개선 실패:', error)
      toast.error('스토리 개선에 실패했습니다.')
    }
  }

  /**
   * 콘티 생성 시작 핸들러
   */
  const handleConteGenerationStart = () => {
    // 스토어에서 이미 처리됨
  }

  /**
   * 콘티 생성 완료 핸들러
   * @param {Array} conteList - 생성된 콘티 리스트
   */
  const handleConteGenerationComplete = () => {
    // 스토어에서 이미 처리됨
  }

  /**
   * 탭 변경 핸들러
   * @param {number} newValue - 새로운 탭 인덱스
   */
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
  }

  /**
   * 콘티 상세 정보 모달 열기
   * @param {Object} conte - 선택된 콘티 데이터
   */
  const handleConteClick = (conte) => {
    setSelectedConte(conte)
    setConteModalOpen(true)
  }

  /**
   * 콘티 상세 정보 모달 닫기
   */
  const handleConteModalClose = () => {
    setConteModalOpen(false)
    setSelectedConte(null)
  }

  /**
   * 콘티 편집 모달 열기
   * @param {Object} conte - 편집할 콘티 데이터
   */
  const handleEditConte = (conte) => {
    setEditingConte(conte)
    setEditModalOpen(true)
  }

  /**
   * 콘티 편집 모달 닫기
   */
  const handleEditModalClose = () => {
    setEditModalOpen(false)
    setEditingConte(null)
  }

  /**
   * 콘티 저장 핸들러
   * @param {Object} updatedConte - 업데이트된 콘티 데이터
   */
  const handleSaveConte = (updatedConte) => {
    // 스토어에서 콘티 리스트 업데이트
    const updatedConteList = generatedConte.map(conte => 
      conte.id === updatedConte.id ? updatedConte : conte
    )
    
    // 스토어에 업데이트된 콘티 리스트 저장
    completeConteGeneration(updatedConteList)
    
    toast.success('콘티가 저장되었습니다.')
  }

  /**
   * 이미지 재생성 핸들러
   * @param {Object} updatedConte - 이미지가 재생성된 콘티 데이터
   */
  const handleRegenerateImage = (updatedConte) => {
    // 스토어에서 콘티 리스트 업데이트
    const updatedConteList = generatedConte.map(conte => 
      conte.id === updatedConte.id ? updatedConte : conte
    )
    
    // 스토어에 업데이트된 콘티 리스트 저장
    completeConteGeneration(updatedConteList)
  }

  /**
   * 콘티 재생성 핸들러
   * @param {Object} conte - 재생성할 콘티 데이터
   */
  const handleRegenerateConte = async (conte) => {
    try {
      console.log('🎬 콘티 재생성 시작:', conte.title)
      
      // 실제 API가 없으므로 임시로 시뮬레이션
      // const updatedConte = await regenerateConteWithRetry(conte)
      
      // 임시로 기존 콘티를 업데이트 (실제로는 API 호출)
      const updatedConte = {
        ...conte,
        lastModified: new Date().toISOString(),
        modifiedBy: '사용자',
        description: `${conte.description} (재생성됨)`,
        dialogue: conte.dialogue ? `${conte.dialogue} (재생성됨)` : '새로운 대사가 생성되었습니다.'
      }
      
      // 스토어에서 콘티 리스트 업데이트
      const updatedConteList = generatedConte.map(c => 
        c.id === updatedConte.id ? updatedConte : c
      )
      
      // 스토어에 업데이트된 콘티 리스트 저장
      completeConteGeneration(updatedConteList)
      
      console.log('✅ 콘티 재생성 완료:', updatedConte.title)
      
    } catch (error) {
      console.error('❌ 콘티 재생성 실패:', error)
      throw error
    }
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
   * 타임라인 보기 핸들러
   */
  const handleViewTimeline = () => {
    // 콘티 데이터를 로컬 스토리지에 저장하고 프로젝트 페이지로 이동
    if (generatedConte && generatedConte.length > 0) {
      localStorage.setItem('currentConteData', JSON.stringify(generatedConte))
      navigate('/project/temp-project-id')
    } else {
      toast.error('타임라인을 보려면 먼저 콘티를 생성해주세요.')
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
      
      // 스토어에 업데이트된 콘티 리스트 저장
      completeConteGeneration(updatedConteList)
      
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
    <ErrorBoundary>
      <NetworkErrorHandler onRetry={() => {
        if (synopsis) {
          handleGenerateStory(synopsis)
        }
      }}>
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
              
              {/* 페이지 제목 */}
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                AI 스토리 생성
              </Typography>
              
              {/* 저장 버튼 */}
              <Button 
                color="inherit" 
                startIcon={<Save />}
                onClick={handleSave}
                disabled={!generatedStory}
              >
                저장
              </Button>
            </Toolbar>
          </AppBar>

          {/* 메인 컨텐츠 */}
          <Container maxWidth="lg" sx={{ mt: 4 }}>
            {/* 페이지 제목 */}
            <Typography variant="h4" gutterBottom>
              🎬 AI 스토리 생성
            </Typography>
            
            {/* 설명 텍스트 */}
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              영화 시놉시스를 입력하면 AI가 자동으로 상세한 스토리를 생성합니다.
            </Typography>
            
            {/* 탭 네비게이션 */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs 
                value={activeTab} 
                onChange={handleTabChange}
                aria-label="스토리 생성 기능 탭"
              >
                <Tab 
                  label="스토리 생성" 
                  icon={<AutoFixHigh />} 
                  iconPosition="start"
                />
                <Tab 
                  label="히스토리" 
                  icon={<History />} 
                  iconPosition="start"
                />
                <Tab 
                  label="템플릿" 
                  icon={<Tune />} 
                  iconPosition="start"
                />
                <Tab 
                  label="품질 개선" 
                  icon={<AutoFixHigh />} 
                  iconPosition="start"
                />
                <Tab 
                  label="콘티 생성" 
                  icon={<Movie />} 
                  iconPosition="start"
                />
              </Tabs>
            </Box>

            {/* 스토리 생성 탭 */}
            {activeTab === 0 && (
              <Box>
                {/* 시놉시스 입력 폼 */}
                <SynopsisInputForm 
                  onSubmit={handleGenerateStory}
                  isGenerating={isGenerating}
                />

                {/* 로딩 상태 표시 */}
                {isGenerating && (
                  <LoadingSpinner message="AI 스토리 생성 중..." />
                )}

                {/* 생성된 스토리 표시 */}
                {!isGenerating && generatedStory && (
                  <StoryResult 
                    story={generatedStory}
                    onSave={(editedStory) => {
                      updateGeneratedStory(editedStory)
                      toast.success('스토리가 업데이트되었습니다.')
                    }}
                    onRegenerate={() => {
                      if (synopsis) {
                        handleGenerateStory(synopsis)
                      }
                    }}
                    isGenerating={isGenerating}
                    onAutoSave={handleAutoSave}
                    projectId="temp-project-id" // TODO: 실제 프로젝트 ID로 교체
                  />
                )}

                {/* 에러 상태 표시 */}
                {generationError && (
                  <Box sx={{ mt: 2, p: 2, backgroundColor: 'var(--color-danger)', borderRadius: 1 }}>
                    <Typography variant="body2" color="white">
                      ❌ {generationError}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {/* 히스토리 탭 */}
            {activeTab === 1 && (
              <HistoryList 
                onSelectHistory={(historyItem) => {
                  setSynopsis(historyItem.synopsis)
                  if (historyItem.settings) {
                    updateStorySettings(historyItem.settings)
                  }
                  // 스토리 내용도 함께 업데이트
                  if (historyItem.story) {
                    updateGeneratedStory(historyItem.story)
                  }
                  setActiveTab(0) // 생성 탭으로 이동
                }}
                onReuseHistory={handleReuseHistory}
              />
            )}

            {/* 템플릿 탭 */}
            {activeTab === 2 && (
              <TemplateSelector 
                synopsis={synopsis}
                onTemplateSelect={handleTemplateSelect}
                onSettingsChange={handleSettingsChange}
                currentSettings={storySettings}
                templateSelection={templateSelection}
                onTemplateSelectionChange={updateTemplateSelection}
              />
            )}

            {/* 품질 개선 탭 */}
            {activeTab === 3 && (
              <StoryQualityEnhancer 
                currentStory={generatedStory}
                onRegenerate={() => {
                  if (synopsis) {
                    handleGenerateStory(synopsis)
                  }
                }}
                onEnhance={handleStoryEnhance}
                isGenerating={isGenerating}
                qualityEnhancement={qualityEnhancement}
                onQualityEnhancementChange={updateQualityEnhancement}
              />
            )}

            {/* 콘티 생성 탭 */}
            {activeTab === 4 && (
              <Box>
                <ConteGenerator 
                  story={generatedStory}
                  onConteGenerated={handleConteGenerationComplete}
                  onGenerationStart={handleConteGenerationStart}
                  onGenerationComplete={handleConteGenerationComplete}
                />
                
                {/* 생성된 콘티 결과 표시 */}
                {generatedConte && generatedConte.length > 0 && (
                  <Box sx={{ mt: 4 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      mb: 2 
                    }}>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          생성된 콘티 리스트
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          총 {generatedConte.length}개의 씬이 생성되었습니다.
                        </Typography>
                      </Box>
                      
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
                      <Box 
                        key={index} 
                        sx={{ 
                          mb: 2, 
                          p: 2, 
                          border: '1px solid #ddd', 
                          borderRadius: 1,
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.04)',
                            borderColor: 'primary.main'
                          },
                          transition: 'all 0.2s ease'
                        }}
                        onClick={() => handleConteClick(conte)}
                      >
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
                                    width: '100%', 
                                    height: '100%', 
                                    backgroundColor: 'rgba(0, 0, 0, 0.7)', 
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    zIndex: 1 
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
                          
                          {/* 씬 정보 */}
                          <Grid item xs={12} sm={conte.imageUrl ? 8 : 12}>
                            <Typography variant="subtitle1" gutterBottom>
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
                                    label="이미지 있음" 
                                    size="small" 
                                    color="success" 
                                    variant="outlined"
                                  />
                                )}
                                <Chip 
                                  label="상세보기" 
                                  size="small" 
                                  color="primary" 
                                  variant="outlined"
                                />
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<Edit />}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEditConte(conte)
                                  }}
                                  sx={{ minWidth: 'auto', px: 1 }}
                                >
                                  편집
                                </Button>
                              </Box>
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            )}
          </Container>
        </Box>

        {/* 콘티 상세 정보 모달 */}
        <Modal
          open={conteModalOpen}
          onClose={handleConteModalClose}
          aria-labelledby="conte-detail-modal"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2
          }}
        >
          <Box sx={{
            width: '90%',
            maxWidth: 800,
            maxHeight: '90vh',
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 24,
            overflow: 'auto'
          }}>
            {selectedConte && (
              <>
                {/* 모달 헤더 */}
                <Box sx={{
                  p: 3,
                  borderBottom: '1px solid #ddd',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Typography variant="h5" component="h2">
                    씬 {selectedConte.scene}: {selectedConte.title}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<Edit />}
                      onClick={() => {
                        handleEditConte(selectedConte)
                        handleConteModalClose()
                      }}
                    >
                      편집
                    </Button>
                    <IconButton onClick={handleConteModalClose}>
                      <Close />
                    </IconButton>
                  </Box>
                </Box>

                {/* 모달 내용 */}
                <Box sx={{ p: 3 }}>
                  <Grid container spacing={3}>
                    {/* 씬 이미지 */}
                    {selectedConte.imageUrl && (
                      <Grid item xs={12}>
                        <Box sx={{ 
                          width: '100%', 
                          height: 300, 
                          borderRadius: 2,
                          overflow: 'hidden',
                          border: '1px solid #ddd',
                          mb: 2,
                          position: 'relative'
                        }}>
                          <img 
                            src={selectedConte.imageUrl} 
                            alt={`씬 ${selectedConte.scene} 이미지`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                            onError={(e) => handleImageLoadError(selectedConte.id, e)}
                          />
                          {imageLoadErrors[selectedConte.id] && (
                            <Box sx={{ 
                              position: 'absolute', 
                              top: 0, 
                              left: 0, 
                              width: '100%', 
                              height: '100%', 
                              backgroundColor: 'rgba(0, 0, 0, 0.7)', 
                              display: 'flex', 
                              flexDirection: 'column',
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              zIndex: 1 
                            }}>
                              <Error sx={{ color: 'white', mb: 1, fontSize: 48 }} />
                              <Typography variant="h6" color="white" sx={{ mb: 1, textAlign: 'center' }}>
                                이미지 로딩 실패
                              </Typography>
                              <Button
                                variant="contained"
                                startIcon={<Refresh />}
                                onClick={() => handleImageRetry(selectedConte)}
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
                    
                    {/* 기본 정보 */}
                    <Grid item xs={12}>
                      <Accordion defaultExpanded>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Typography variant="h6">기본 정보</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Grid container spacing={2}>
                            <Grid item xs={12}>
                              <Typography variant="subtitle2" color="text.secondary">설명</Typography>
                              <Typography variant="body1" paragraph>
                                {selectedConte.description}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="subtitle2" color="text.secondary">타입</Typography>
                              <Chip 
                                label={selectedConte.type === 'generated_video' ? 'AI 생성 비디오' : '실사 촬영용'} 
                                color={selectedConte.type === 'generated_video' ? 'secondary' : 'primary'}
                                sx={{ mt: 1 }}
                              />
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="subtitle2" color="text.secondary">예상 시간</Typography>
                              <Typography variant="body1">
                                {selectedConte.estimatedDuration || '5분'}
                              </Typography>
                            </Grid>
                          </Grid>
                        </AccordionDetails>
                      </Accordion>
                    </Grid>

                    {/* 촬영 정보 */}
                    <Grid item xs={12}>
                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Typography variant="h6">촬영 정보</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="subtitle2" color="text.secondary">카메라 앵글</Typography>
                              <Typography variant="body1" paragraph>
                                {selectedConte.cameraAngle || '설정 없음'}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="subtitle2" color="text.secondary">카메라 워크</Typography>
                              <Typography variant="body1" paragraph>
                                {selectedConte.cameraWork || '설정 없음'}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="subtitle2" color="text.secondary">렌즈 스펙</Typography>
                              <Typography variant="body1" paragraph>
                                {selectedConte.lensSpecs || '설정 없음'}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="subtitle2" color="text.secondary">시각 효과</Typography>
                              <Typography variant="body1" paragraph>
                                {selectedConte.visualEffects || '설정 없음'}
                              </Typography>
                            </Grid>
                          </Grid>
                        </AccordionDetails>
                      </Accordion>
                    </Grid>

                    {/* 장면 설정 */}
                    <Grid item xs={12}>
                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Typography variant="h6">장면 설정</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="subtitle2" color="text.secondary">인물 배치</Typography>
                              <Typography variant="body1" paragraph>
                                {selectedConte.characterLayout || '설정 없음'}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="subtitle2" color="text.secondary">소품</Typography>
                              <Typography variant="body1" paragraph>
                                {selectedConte.props || '설정 없음'}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="subtitle2" color="text.secondary">조명</Typography>
                              <Typography variant="body1" paragraph>
                                {selectedConte.lighting || '설정 없음'}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="subtitle2" color="text.secondary">날씨</Typography>
                              <Typography variant="body1" paragraph>
                                {selectedConte.weather || '설정 없음'}
                              </Typography>
                            </Grid>
                            <Grid item xs={12}>
                              <Typography variant="subtitle2" color="text.secondary">시각적 설명</Typography>
                              <Typography variant="body1" paragraph>
                                {selectedConte.visualDescription || '설정 없음'}
                              </Typography>
                            </Grid>
                            <Grid item xs={12}>
                              <Typography variant="subtitle2" color="text.secondary">전환</Typography>
                              <Typography variant="body1" paragraph>
                                {selectedConte.transition || '설정 없음'}
                              </Typography>
                            </Grid>
                          </Grid>
                        </AccordionDetails>
                      </Accordion>
                    </Grid>

                    {/* 대사 */}
                    {selectedConte.dialogue && (
                      <Grid item xs={12}>
                        <Accordion>
                          <AccordionSummary expandIcon={<ExpandMore />}>
                            <Typography variant="h6">대사</Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Typography variant="body1" sx={{ 
                              fontStyle: 'italic',
                              p: 2,
                              bgcolor: 'rgba(0, 0, 0, 0.04)',
                              borderRadius: 1,
                              border: '1px solid #ddd'
                            }}>
                              {selectedConte.dialogue}
                            </Typography>
                          </AccordionDetails>
                        </Accordion>
                      </Grid>
                    )}

                    {/* 키워드 정보 */}
                    {selectedConte.keywords && (
                      <Grid item xs={12}>
                        <Accordion>
                          <AccordionSummary expandIcon={<ExpandMore />}>
                            <Typography variant="h6">키워드 정보</Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Grid container spacing={2}>
                              <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary">사용자 정보</Typography>
                                <Typography variant="body1" paragraph>
                                  {selectedConte.keywords.userInfo || '기본 사용자'}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary">장소</Typography>
                                <Typography variant="body1" paragraph>
                                  {selectedConte.keywords.location || '기본 장소'}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary">장비</Typography>
                                <Typography variant="body1" paragraph>
                                  {selectedConte.keywords.equipment || '기본 장비'}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary">조명</Typography>
                                <Typography variant="body1" paragraph>
                                  {selectedConte.keywords.lighting || '기본 조명'}
                                </Typography>
                              </Grid>
                              {selectedConte.keywords.cast && selectedConte.keywords.cast.length > 0 && (
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="subtitle2" color="text.secondary">배우</Typography>
                                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                                    {selectedConte.keywords.cast.map((actor, index) => (
                                      <Chip key={index} label={actor} size="small" variant="outlined" />
                                    ))}
                                  </Box>
                                </Grid>
                              )}
                              {selectedConte.keywords.props && selectedConte.keywords.props.length > 0 && (
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="subtitle2" color="text.secondary">소품</Typography>
                                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                                    {selectedConte.keywords.props.map((prop, index) => (
                                      <Chip key={index} label={prop} size="small" variant="outlined" />
                                    ))}
                                  </Box>
                                </Grid>
                              )}
                            </Grid>
                          </AccordionDetails>
                        </Accordion>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              </>
            )}
          </Box>
        </Modal>

        {/* 콘티 편집 모달 */}
        <ConteEditModal
          open={editModalOpen}
          onClose={handleEditModalClose}
          conte={editingConte}
          onSave={handleSaveConte}
          onRegenerateImage={handleRegenerateImage}
          onRegenerateConte={handleRegenerateConte}
        />
      </NetworkErrorHandler>
    </ErrorBoundary>
  )
}

export default StoryGenerationPage 