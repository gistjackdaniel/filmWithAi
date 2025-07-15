import { useState, useEffect, useRef } from 'react'
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
import { useNavigate, useLocation } from 'react-router-dom'
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
import ConteDetailModal from '../components/StoryGeneration/ConteDetailModal'
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
  const location = useLocation()
  
  // 로컬 상태 관리
  const [activeTab, setActiveTab] = useState(0) // 활성 탭 (0: 생성, 1: 히스토리, 2: 템플릿, 3: 품질 개선, 4: 콘티 생성)
  const [selectedConte, setSelectedConte] = useState(null) // 선택된 콘티
  const [conteModalOpen, setConteModalOpen] = useState(false) // 콘티 상세 모달 열림 상태
  const [editModalOpen, setEditModalOpen] = useState(false) // 편집 모달 열림 상태
  const [editingConte, setEditingConte] = useState(null) // 편집 중인 콘티
  
  // 이미지 로딩 실패 상태 관리
  const [imageLoadErrors, setImageLoadErrors] = useState({})
  
  // 상태 복원 (뒤로가기 시) - 중복 토스트 방지용 플래그 추가
  const hasRestored = useRef(false);
  useEffect(() => {
    // location.state가 있고, 아직 복원하지 않은 경우에만 실행
    if (location.state && !hasRestored.current) {
      // 탭 상태 복원
      if (location.state.activeTab !== undefined) {
        setActiveTab(location.state.activeTab)
      }
      
      // 시놉시스 복원
      if (location.state.synopsis) {
        setSynopsis(location.state.synopsis)
      }
      
      // 생성된 스토리 복원
      if (location.state.generatedStory) {
        updateGeneratedStory(location.state.generatedStory)
      }
      
      // 스토리 설정 복원
      if (location.state.storySettings) {
        updateStorySettings(location.state.storySettings)
      }
      
      // 템플릿 선택 복원
      if (location.state.templateSelection) {
        updateTemplateSelection(location.state.templateSelection)
      }
      
      // 품질 개선 설정 복원
      if (location.state.qualityEnhancement) {
        updateQualityEnhancement(location.state.qualityEnhancement)
      }
      
      // 콘티 생성 상태 복원
      if (location.state.conteGeneration) {
        // 콘티 생성 완료 상태로 복원
        completeConteGeneration(location.state.conteGeneration.generatedConte || [])
      }
      
      // 이미지 로딩 에러 상태 복원
      if (location.state.imageLoadErrors) {
        setImageLoadErrors(location.state.imageLoadErrors)
      }
      
      // 선택된 콘티 복원
      if (location.state.selectedConte) {
        setSelectedConte(location.state.selectedConte)
      }
      
      // 모달 상태 복원
      if (location.state.conteModalOpen) {
        setConteModalOpen(location.state.conteModalOpen)
      }
      
      if (location.state.editModalOpen) {
        setEditModalOpen(location.state.editModalOpen)
      }
      
      if (location.state.editingConte) {
        setEditingConte(location.state.editingConte)
      }
      
      // 상태 복원 완료 알림 (중복 방지)
      toast.success('이전 작업 상태가 복원되었습니다.');
      hasRestored.current = true;
    }
  }, []);
  
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
   * 콘티 데이터 콘솔 출력 효과
   * 콘티 생성 탭에서 콘티가 생성되면 모든 필드를 콘솔에 출력
   */
  useEffect(() => {
    if (activeTab === 4 && generatedConte && generatedConte.length > 0) {
      console.log('===== 콘티 데이터 전체 필드 출력 =====');
      generatedConte.forEach((conte, idx) => {
        console.log(`--- 콘티 #${idx + 1} ---`);
        Object.entries(conte).forEach(([key, value]) => {
          // 객체/배열은 JSON.stringify로 보기 좋게 출력
          if (typeof value === 'object' && value !== null) {
            console.log(`${key}: ${JSON.stringify(value, null, 2)}`);
          } else {
            console.log(`${key}: ${value}`);
          }
        });
        console.log(''); // 콘티 간 구분을 위한 빈 줄
      });
      console.log('===============================');
    }
  }, [activeTab, generatedConte]);

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
   * 타임라인 페이지로 이동 (현재 페이지 상태 유지)
   */
  const handleViewTimeline = () => {
    if (generatedConte && generatedConte.length > 0) {
      // 현재 페이지의 모든 상태를 저장하여 타임라인으로 이동
      const currentPageState = {
        conteData: generatedConte,
        projectTitle: 'AI 스토리 프로젝트',
        returnTo: {
          path: '/story-generation',
          state: {
            activeTab: activeTab,
            synopsis: synopsis,
            generatedStory: generatedStory,
            storySettings: storySettings,
            templateSelection: templateSelection,
            qualityEnhancement: qualityEnhancement,
            conteGeneration: conteGeneration,
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
                      
                      <Box sx={{ display: 'flex', gap: 2 }}>
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

        {/* 콘티 상세 정보 모달 (공통 컴포넌트 사용) */}
        <ConteDetailModal
          open={conteModalOpen}
          onClose={handleConteModalClose}
          conte={selectedConte}
          onEdit={handleEditConte}
          onImageRetry={handleImageRetry}
          imageLoadErrors={imageLoadErrors}
          onImageLoadError={handleImageLoadError}
        />

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