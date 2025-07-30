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
  Save,
  History,
  Tune,
  AutoFixHigh,
  Movie,
  ExpandMore,
  Close,
  Edit,
  Timeline,
  Refresh,
  Error
} from '@mui/icons-material'
import { CircularProgress } from '@mui/material'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import SynopsisInputForm from '../components/project/SynopsisInputForm'
import LoadingSpinner from '../components/project/LoadingSpinner'
import StoryResult from '../components/project/StoryResult'
import StoryQualityEnhancer from '../components/project/StoryQualityEnhancer'
import StoryHistoryPanel from '../components/project/StoryHistoryPanel'
import { generateStoryWithRetry } from '../services/storyGenerationApi'
import { autoSaveProject } from '../services/projectApi'
import api from '../services/api'
import useStoryStore from '../stores/storyStore'
import useStoryHistoryStore from '../stores/storyHistoryStore'
import { CommonHeader } from '../components/common'
import { genreTemplates } from '../data/storyTemplates'

/**
 * AI 스토리 생성 페이지 컴포넌트
 * 프로젝트 ID 기반으로 시놉시스를 입력하고 AI가 스토리를 생성하는 페이지
 * 시놉시스 → 스토리 생성 → 씬 생성 → 컷 생성 로직의 첫 번째 단계
 */
const ConteGenerationPage = () => {
  // React Router 네비게이션 훅
  const navigate = useNavigate()
  const location = useLocation()
  
  // URL 파라미터에서 프로젝트 ID 가져오기
  const { projectId } = useParams()
  
  // 로컬 상태 관리
  const [activeTab, setActiveTab] = useState(0) // 활성 탭 (0: 생성, 1: 히스토리, 2: 템플릿, 3: 품질 개선)
  
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
    setSynopsis,
    startGeneration,
    completeGeneration,
    failGeneration,
    updateGeneratedStory,
    updateStorySettings,
    updateTemplateSelection,
    updateQualityEnhancement,
    getCurrentError,
    resetForNewProject
  } = useStoryStore()

  // 히스토리 스토어
  const { addToHistory } = useStoryHistoryStore()
  
  // 프로젝트 정보 상태
  const [projectInfo, setProjectInfo] = useState(null)
  const [loadingProject, setLoadingProject] = useState(true)

  // 프로젝트 상태 실시간 업데이트를 위한 함수
  const updateProjectInfo = async () => {
    if (!projectId) return
    
    try {
      const response = await api.get(`/project/${projectId}`)
      if (response.data.success) {
        setProjectInfo(response.data.data.project)
        console.log('🔄 프로젝트 정보 업데이트 완료:', response.data.data.project.status)
      }
    } catch (error) {
      console.error('프로젝트 정보 업데이트 실패:', error)
    }
  }
  
  // 프로젝트 정보 로드
  useEffect(() => {
    const loadProjectInfo = async () => {
      if (!projectId) {
        console.error('프로젝트 ID가 없습니다.')
        navigate('/')
        return
      }
      
      try {
        setLoadingProject(true)
        const response = await api.get(`/project/${projectId}`)
        
        if (response.data.success) {
          const project = response.data.data.project
          setProjectInfo(project)
          
          // 새 프로젝트인지 확인 (시놉시스와 스토리가 모두 없는 경우)
          const isNewProject = !project.synopsis && !project.story
          
          if (isNewProject) {
            // 새 프로젝트인 경우 스토어 초기화
            console.log('🆕 새 프로젝트 감지 - 스토어 초기화')
            resetForNewProject()
          } else {
            // 기존 프로젝트인 경우 데이터 로드
            if (project.synopsis) {
              setSynopsis(project.synopsis)
            } else {
              setSynopsis('')
            }
            
            if (project.story) {
              updateGeneratedStory(project.story)
            } else {
              updateGeneratedStory('')
            }
          }
          
          console.log('✅ 프로젝트 정보 로드 완료:', project.projectTitle)
        } else {
          throw new Error(response.data.message || '프로젝트를 찾을 수 없습니다.')
        }
      } catch (error) {
        console.error('프로젝트 정보 로드 실패:', error)
        toast.error('프로젝트 정보를 불러오는데 실패했습니다.')
        navigate('/')
      } finally {
        setLoadingProject(false)
      }
    }
    
    loadProjectInfo()
  }, [projectId, navigate, setSynopsis, updateGeneratedStory])

  /**
   * 뒤로가기 버튼 핸들러
   * 대시보드로 돌아가기
   */
  const handleBack = () => {
    navigate('/')
  }

  /**
   * 저장 버튼 핸들러
   * 시놉시스 또는 스토리를 프로젝트에 저장
   */
  const handleSave = async () => {
    if (!projectId) {
      toast.error('저장할 프로젝트가 없습니다.')
      return
    }

    try {
      console.log('💾 프로젝트 저장 시작:', {
        hasSynopsis: !!synopsis,
        hasStory: !!generatedStory,
        projectId
      })

      // 저장할 데이터 구성
      const updateData = {}
      
      // 시놉시스가 있으면 저장
      if (synopsis && synopsis.trim()) {
        updateData.synopsis = synopsis.trim()
        console.log('📝 시놉시스 저장:', synopsis.trim().substring(0, 50) + '...')
      }
      
      // 스토리가 있으면 저장
      if (generatedStory && generatedStory.trim()) {
        updateData.story = generatedStory.trim()
        updateData.status = 'story_ready'
        console.log('📝 스토리 저장:', generatedStory.trim().substring(0, 50) + '...')
      }

      // 저장할 데이터가 없으면 에러
      if (Object.keys(updateData).length === 0) {
        toast.error('저장할 내용이 없습니다. 시놉시스나 스토리를 입력해주세요.')
        return
      }

      // 프로젝트 업데이트
      const response = await api.patch(`/project/${projectId}`, updateData)
      
      if (response.data.success) {
        console.log('✅ 프로젝트 저장 완료:', response.data)
        
        // 프로젝트 정보 업데이트
        await updateProjectInfo()
        
        // 성공 메시지
        if (updateData.synopsis && updateData.story) {
          toast.success('시놉시스와 스토리가 저장되었습니다.')
        } else if (updateData.synopsis) {
          toast.success('시놉시스가 저장되었습니다.')
        } else if (updateData.story) {
          toast.success('스토리가 저장되었습니다.')
        }
      } else {
        throw new Error(response.data.message || '저장에 실패했습니다.')
      }
      
    } catch (error) {
      console.error('❌ 프로젝트 저장 실패:', error)
      toast.error('저장에 실패했습니다: ' + (error.message || '알 수 없는 오류'))
    }
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
      // 선택된 장르에 따른 템플릿 프롬프트 가져오기
      let templatePrompt = null
      if (storySettings.genre && storySettings.genre !== '일반') {
        const selectedTemplate = genreTemplates[storySettings.genre]
        if (selectedTemplate) {
          templatePrompt = selectedTemplate.prompt
        }
      }
      
      // lengthPresets의 maxLength 값을 백엔드로 전송
      const maxLength = storySettings.maxLength || 600
      
      // AI 스토리 생성 API 호출
      const response = await generateStoryWithRetry({
        synopsis: synopsisText,
        maxLength: maxLength,  // ← lengthPresets에서 설정된 maxLength 값
        genre: storySettings.genre,
        templatePrompt: templatePrompt
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
      
      // 생성된 스토리를 프로젝트에 저장
      if (projectId) {
        try {
          console.log('💾 생성된 스토리를 프로젝트에 저장 중...')
          await api.patch(`/project/${projectId}`, {
            story: response.story,
            status: 'story_ready'
          })
          console.log('✅ 스토리 저장 완료')

          // 프로젝트 정보 업데이트
          await updateProjectInfo()
        } catch (saveError) {
          console.error('❌ 스토리 저장 실패:', saveError)
          // 저장 실패해도 스토리 생성은 성공으로 처리
        }
      }
      
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
   * 씬 생성 페이지로 이동 핸들러
   */
  const handleGoToSceneGeneration = () => {
    if (!generatedStory) {
      toast.error('먼저 스토리를 생성해주세요.')
      return
    }

    // 스토리 생성 완료 후 씬 생성 페이지로 이동
    navigate(`/project/${projectId}/scenes`)
  }

  /**
   * 탭 변경 핸들러
   * @param {number} newValue - 새로운 탭 인덱스
   */
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
  }

  return (
        <Box sx={{ flexGrow: 1 }}>
          {/* 공통 헤더 */}
          <CommonHeader 
        title={projectInfo?.projectTitle || 'AI 스토리 생성'}
            showBackButton={true}
            onBack={handleBack}
          >
            {/* 저장 버튼 */}
            <Button 
              color="inherit" 
              startIcon={<Save />}
              onClick={handleSave}
              disabled={!generatedStory}
            >
              저장
            </Button>
        
        {/* 씬 생성 버튼 */}
        {generatedStory && (
          <Button 
            color="inherit" 
            startIcon={<Movie />}
            onClick={handleGoToSceneGeneration}
            sx={{ ml: 1 }}
          >
            씬 생성
          </Button>
        )}
          </CommonHeader>

          {/* 메인 컨텐츠 */}
          <Container maxWidth="lg" sx={{ mt: 4 }}>
            {/* 프로젝트 정보 헤더 */}
            <Box sx={{ mb: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
              <Typography variant="h4" gutterBottom>
            📝 {projectInfo?.projectTitle || 'AI 스토리 생성'}
              </Typography>
              
              {/* 프로젝트 상태 정보 */}
              {projectInfo && (
                <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                  <Chip 
                    label={`상태: ${projectInfo.status || 'draft'}`} 
                    color="primary" 
                    size="small" 
                  />
                  <Chip 
                    label={`생성일: ${new Date(projectInfo.createdAt).toLocaleDateString()}`} 
                    variant="outlined" 
                    size="small" 
                  />
                </Box>
              )}
              
              {/* 시놉시스 편집 섹션 */}
              {projectInfo?.synopsis && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    📝 시놉시스
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {projectInfo.synopsis}
                  </Typography>
                </Box>
              )}
            </Box>
            
            {/* 설명 텍스트 */}
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              영화 시놉시스를 입력하면 AI가 자동으로 상세한 스토리를 생성합니다.
          생성된 스토리는 씬과 컷으로 세분화됩니다.
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
              </Tabs>
            </Box>

            {/* 스토리 생성 탭 */}
            {activeTab === 0 && (
              <Box>
                {/* 시놉시스 입력 폼 */}
                <SynopsisInputForm 
                  onSubmit={handleGenerateStory}
                  onSave={handleSave}
                  isGenerating={isGenerating}
                />

                {/* 로딩 상태 표시 */}
                {isGenerating && (
                  <Box sx={{ 
                    mt: 3, 
                    p: 3, 
                    bgcolor: 'background.paper', 
                    borderRadius: 2, 
                    boxShadow: 1,
                    textAlign: 'center'
                  }}>
                    <LoadingSpinner message="AI 스토리 생성 중..." />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      시놉시스를 분석하고 상세한 스토리를 생성하고 있습니다...
                    </Typography>
                  </Box>
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
                projectId={projectId}
                  />
                )}

                {/* 에러 상태 표시 */}
                {generationError && (
                  <Box sx={{ 
                    mt: 3, 
                    p: 3, 
                    bgcolor: 'background.paper', 
                    borderRadius: 2, 
                    boxShadow: 1,
                    border: '1px solid #f44336'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Error sx={{ color: '#f44336', mr: 1 }} />
                      <Typography variant="h6" color="error">
                        스토리 생성 실패
                      </Typography>
                    </Box>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                      {generationError}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Button
                        variant="contained"
                        startIcon={<Refresh />}
                        onClick={() => {
                          if (synopsis) {
                            handleGenerateStory(synopsis)
                          }
                        }}
                        size="small"
                      >
                        다시 시도
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => setActiveTab(2)} // 템플릿 탭으로 이동
                        size="small"
                      >
                        템플릿 사용
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>
            )}

            {/* 히스토리 탭 */}
            {activeTab === 1 && (
          <StoryHistoryPanel 
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
          <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
            <Typography variant="h6" gutterBottom>
              📋 스토리 템플릿
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              다양한 장르와 스타일의 템플릿을 선택하여 스토리 생성을 도와줍니다.
            </Typography>
            {/* 템플릿 선택 UI는 별도 컴포넌트로 구현 예정 */}
          </Box>
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
          </Container>
        </Box>
  )
}

export default ConteGenerationPage