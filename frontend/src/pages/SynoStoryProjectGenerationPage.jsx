import { useState, useEffect, useRef } from 'react'
import { 
  Box, 
  Typography, 
  Container,
  Button,
  Tabs,
  Tab,
  Paper,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Card,
  CardContent,
  Grid,
  Chip,
  Divider,
  LinearProgress
} from '@mui/material'
import { 
  Save,
  History,
  Tune,
  AutoFixHigh,
  Movie,
  Create,
  Edit,
  Timeline,
  Refresh,
  Error,
  CheckCircle,
  PlayArrow,
  Settings
} from '@mui/icons-material'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import SynopsisInputForm from '../components/project/SynopsisInputForm'
import LoadingSpinner from '../components/project/LoadingSpinner'
import StoryResult from '../components/project/StoryResult'
import StoryQualityEnhancer from '../components/project/StoryQualityEnhancer'
import StoryHistoryPanel from '../components/project/StoryHistoryPanel'
import { createProject, updateProject, getProject, generateStory } from '../services/projectApi'
import api from '../services/api'
import useProjectStore from '../stores/projectStore'
import { CommonHeader } from '../components/common'
import { genreTemplates } from '../data/storyTemplates'

/**
 * 시놉시스 → 스토리 생성 페이지 컴포넌트
 * 프로젝트 생성 → 시놉시스 입력 → 스토리 생성 → 저장의 전체 플로우
 * NestJS 백엔드 구조에 맞춰 구현
 */
const SynoStoryProjectGenerationPage = () => {
  // React Router 네비게이션 훅
  const navigate = useNavigate()
  const location = useLocation()
  
  // URL 파라미터에서 프로젝트 ID 가져오기 (기존 프로젝트 편집 시)
  const { projectId } = useParams()
  
  // 로컬 상태 관리
  const [activeTab, setActiveTab] = useState(0) // 활성 탭 (0: 프로젝트 생성, 1: 시놉시스, 2: 스토리 생성, 3: 히스토리, 4: 품질 개선)
  const [currentStep, setCurrentStep] = useState(0) // 현재 단계 (0: 프로젝트 생성, 1: 시놉시스 입력, 2: 스토리 생성, 3: 완료)
  const [projectCreated, setProjectCreated] = useState(false) // 프로젝트 생성 완료 여부
  const [storyGenerated, setStoryGenerated] = useState(false) // 스토리 생성 완료 여부
  
  // 프로젝트 관련 상태
  const [projectData, setProjectData] = useState({
    title: '',
    synopsis: '',
    story: '',
    genre: '일반',
    tags: [],
    status: 'draft'
  })
  
  // 스토리 관련 로컬 상태
  const [synopsis, setSynopsis] = useState('')
  const [generatedStory, setGeneratedStory] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState('')
  const [storySettings, setStorySettings] = useState({
    genre: '일반',
    maxLength: 600
  })
  
  // 프로젝트 정보 상태
  const [projectInfo, setProjectInfo] = useState(null)
  const [loadingProject, setLoadingProject] = useState(false)
  
  // 상태 복원 (뒤로가기 시)
  const hasRestored = useRef(false)
  useEffect(() => {
    if (location.state && !hasRestored.current) {
      if (location.state.activeTab !== undefined) {
        setActiveTab(location.state.activeTab)
      }
      if (location.state.currentStep !== undefined) {
        setCurrentStep(location.state.currentStep)
      }
      if (location.state.projectData) {
        setProjectData(location.state.projectData)
      }
      if (location.state.projectCreated) {
        setProjectCreated(location.state.projectCreated)
      }
      if (location.state.storyGenerated) {
        setStoryGenerated(location.state.storyGenerated)
      }
      
      toast.success('이전 작업 상태가 복원되었습니다.')
      hasRestored.current = true
    }
  }, [])
  
  // 프로젝트 스토어
  const {
    createProject: createProjectStore,
    updateProject: updateProjectStore,
    loadProject,
    isCreating,
    isUpdating,
    isGeneratingStory,
    storyGenerationError,
    createError,
    updateError,
    currentProject
  } = useProjectStore()
  
  // 기존 프로젝트 로드 (편집 모드)
  useEffect(() => {
    if (projectId) {
      loadExistingProject()
    }
  }, [projectId])

  /**
   * 기존 프로젝트 로드
   */
  const loadExistingProject = async () => {
      try {
        setLoadingProject(true)
      const response = await getProject(projectId)
        
      if (response.success && response.data) {
        const project = response.data
          setProjectInfo(project)
        setProjectData({
          title: project.title || project.projectTitle || '',
          synopsis: project.synopsis || '',
          story: project.story || '',
          genre: project.genre || '일반',
          tags: project.tags || [],
          status: project.status || 'draft'
        })
        
                // 로컬 상태에 데이터 설정
            if (project.synopsis) {
              setSynopsis(project.synopsis)
            }
            if (project.story) {
          setGeneratedStory(project.story)
          setStoryGenerated(true)
            }
          
        setProjectCreated(true)
        setCurrentStep(project.story ? 3 : 1) // 스토리가 있으면 완료, 없으면 시놉시스 단계
          
        console.log('✅ 기존 프로젝트 로드 완료:', project.title)
        } else {
        throw new Error(response.error || '프로젝트를 찾을 수 없습니다.')
        }
      } catch (error) {
      console.error('❌ 기존 프로젝트 로드 실패:', error)
        toast.error('프로젝트 정보를 불러오는데 실패했습니다.')
        navigate('/')
      } finally {
        setLoadingProject(false)
      }
    }

  /**
   * 뒤로가기 버튼 핸들러
   */
  const handleBack = () => {
    navigate('/')
  }

  /**
   * 프로젝트 생성 핸들러
   * @param {Object} projectData - 프로젝트 데이터
   */
  const handleCreateProject = async (projectData) => {
    try {
      console.log('📁 프로젝트 생성 시작:', projectData)
      
      const result = await createProjectStore(projectData)
      
      if (result.success) {
        setProjectInfo(result.project)
        setProjectCreated(true)
        setCurrentStep(1) // 시놉시스 입력 단계로 이동
        setActiveTab(1) // 시놉시스 탭으로 이동
        
        toast.success('프로젝트가 생성되었습니다.')
        console.log('✅ 프로젝트 생성 완료:', result.project._id)
        
        return result.project
      } else {
        throw new Error(result.error || '프로젝트 생성에 실패했습니다.')
      }
    } catch (error) {
      console.error('❌ 프로젝트 생성 실패:', error)
      toast.error('프로젝트 생성에 실패했습니다: ' + error.message)
      throw error
    }
      }

  /**
   * 시놉시스 저장 핸들러
   * @param {string} synopsisText - 시놉시스 텍스트
   */
  const handleSaveSynopsis = async (synopsisText) => {
    if (!projectInfo?._id) {
      toast.error('저장할 프로젝트가 없습니다.')
        return
      }

    try {
      console.log('📝 시놉시스 저장 시작:', synopsisText.substring(0, 50) + '...')
      
      const result = await updateProjectStore(projectInfo._id, {
        synopsis: synopsisText,
        status: 'synopsis_ready'
      })
      
      if (result.success) {
        setProjectData(prev => ({ ...prev, synopsis: synopsisText }))
        setSynopsis(synopsisText)
        setCurrentStep(2) // 스토리 생성 단계로 이동
        setActiveTab(2) // 스토리 생성 탭으로 이동
        
          toast.success('시놉시스가 저장되었습니다.')
        console.log('✅ 시놉시스 저장 완료')
      } else {
        throw new Error(result.error || '시놉시스 저장에 실패했습니다.')
      }
    } catch (error) {
      console.error('❌ 시놉시스 저장 실패:', error)
      toast.error('시놉시스 저장에 실패했습니다: ' + error.message)
    }
  }

  /**
   * AI 스토리 생성 핸들러
   * @param {string} synopsisText - 입력된 시놉시스
   */
  const handleGenerateStory = async (synopsisText) => {
    if (!projectInfo?._id) {
      toast.error('스토리를 생성할 프로젝트가 없습니다.')
      return
    }

    setSynopsis(synopsisText)
    setIsGenerating(true)
    setGenerationError('')
    
    const startTime = Date.now()
    
    try {
      console.log('📝 스토리 생성 시작:', {
        projectId: projectInfo._id,
        synopsis: synopsisText.substring(0, 50) + '...',
        genre: storySettings.genre,
        maxLength: storySettings.maxLength
      })
      
      // 선택된 장르에 따른 템플릿 프롬프트 가져오기
      let templatePrompt = null
      if (storySettings.genre && storySettings.genre !== '일반') {
        const selectedTemplate = genreTemplates[storySettings.genre]
        if (selectedTemplate) {
          templatePrompt = selectedTemplate.prompt
        }
      }
      
      // AI 스토리 생성 API 호출
      const response = await generateStory(projectInfo._id)
      
      const generationTime = Math.round((Date.now() - startTime) / 1000)
      
      if (response.success && response.data) {
        setGeneratedStory(response.data.story)
        setStoryGenerated(true)
        setCurrentStep(3) // 완료 단계로 이동
      
      // 생성된 스토리를 프로젝트에 저장
        try {
          console.log('💾 생성된 스토리를 프로젝트에 저장 중...')
          const saveResult = await updateProjectStore(projectInfo._id, {
            story: response.data.story,
            status: 'story_ready'
          })
          
          if (saveResult.success) {
            setProjectData(prev => ({ ...prev, story: response.data.story }))
          console.log('✅ 스토리 저장 완료')
          } else {
            console.warn('⚠️ 스토리 저장 실패:', saveResult.error)
          }
        } catch (saveError) {
          console.error('❌ 스토리 저장 실패:', saveError)
          // 저장 실패해도 스토리 생성은 성공으로 처리
        }
      } else {
        throw new Error(response.error || '스토리 생성에 실패했습니다.')
      }
      
      toast.success('스토리 생성이 완료되었습니다.')
      console.log('✅ 스토리 생성 완료 (소요시간:', generationTime, '초)')
      
    } catch (error) {
      console.error('❌ 스토리 생성 실패:', error)
      const errorMessage = error.message || '스토리 생성에 실패했습니다.'
      setGenerationError(errorMessage)
      setIsGenerating(false)
      toast.error(errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }

  /**
   * 스토리 저장 핸들러
   * @param {string} storyText - 저장할 스토리 텍스트
   */
  const handleSaveStory = async (storyText) => {
    if (!projectInfo?._id) {
      toast.error('저장할 프로젝트가 없습니다.')
      return
    }

    try {
      console.log('💾 스토리 저장 시작:', storyText.substring(0, 50) + '...')
      
      const result = await updateProjectStore(projectInfo._id, {
        story: storyText,
        status: 'story_ready'
      })
      
            if (result.success) {
        setProjectData(prev => ({ ...prev, story: storyText }))
        setGeneratedStory(storyText)
        
        toast.success('스토리가 저장되었습니다.')
        console.log('✅ 스토리 저장 완료')
          } else {
        throw new Error(result.error || '스토리 저장에 실패했습니다.')
      }
              } catch (error) {
      console.error('❌ 스토리 저장 실패:', error)
      toast.error('스토리 저장에 실패했습니다: ' + error.message)
    }
  }

  /**
   * 프로젝트 완료 핸들러
   */
  const handleCompleteProject = () => {
    if (projectInfo?._id) {
      navigate(`/project/${projectInfo._id}`)
        } else {
      navigate('/')
        }
      }

  /**
   * 탭 변경 핸들러
   * @param {number} newValue - 새로운 탭 인덱스
   */
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
  }

  /**
   * 단계 변경 핸들러
   * @param {number} step - 이동할 단계
   */
  const handleStepChange = (step) => {
    setCurrentStep(step)
  }

  // 단계별 완료 여부
  const isProjectCreated = projectCreated || projectInfo?._id
  const isSynopsisReady = projectData.synopsis && projectData.synopsis.trim().length > 0
  const isStoryReady = storyGenerated || (projectData.story && projectData.story.trim().length > 0)

  return (
        <Box sx={{ flexGrow: 1 }}>
          {/* 공통 헤더 */}
          <CommonHeader 
        title={projectInfo?.title || projectInfo?.projectTitle || '시놉시스 → 스토리 생성'}
            showBackButton={true}
            onBack={handleBack}
          >
        {/* 완료 버튼 */}
        {isStoryReady && (
            <Button 
              color="inherit" 
            startIcon={<CheckCircle />}
            onClick={handleCompleteProject}
            sx={{ ml: 1 }}
            >
            프로젝트 완료
            </Button>
        )}
          </CommonHeader>

          {/* 메인 컨텐츠 */}
          <Container maxWidth="lg" sx={{ mt: 4 }}>
        {/* 진행 단계 표시 */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            📋 프로젝트 생성 단계
              </Typography>
              
          <Stepper activeStep={currentStep} orientation="horizontal" sx={{ mt: 3 }}>
            <Step>
              <StepLabel 
                icon={isProjectCreated ? <CheckCircle /> : <Create />}
                error={createError ? true : false}
              >
                프로젝트 생성
              </StepLabel>
            </Step>
            <Step>
              <StepLabel 
                icon={isSynopsisReady ? <CheckCircle /> : <Edit />}
              >
                시놉시스 입력
              </StepLabel>
            </Step>
            <Step>
              <StepLabel 
                icon={isStoryReady ? <CheckCircle /> : <AutoFixHigh />}
                error={generationError ? true : false}
              >
                스토리 생성
              </StepLabel>
            </Step>
            <Step>
              <StepLabel icon={<CheckCircle />}>
                완료
              </StepLabel>
            </Step>
          </Stepper>
        </Paper>

        {/* 프로젝트 정보 표시 */}
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
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  생성일
                  </Typography>
                <Typography variant="body2">
                  {new Date(projectInfo.createdAt).toLocaleDateString()}
                  </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  장르
                </Typography>
                <Typography variant="body2">
                  {projectInfo.genre || '일반'}
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
            aria-label="프로젝트 생성 단계 탭"
              >
                <Tab 
              label="프로젝트 생성" 
              icon={<Create />} 
                  iconPosition="start"
              disabled={!isProjectCreated}
                />
                <Tab 
              label="시놉시스 입력" 
              icon={<Edit />} 
                  iconPosition="start"
              disabled={!isProjectCreated}
                />
                <Tab 
              label="스토리 생성" 
              icon={<AutoFixHigh />} 
                  iconPosition="start"
              disabled={!isSynopsisReady}
                />
                <Tab 
              label="히스토리" 
              icon={<History />} 
                  iconPosition="start"
                />
                <Tab 
              label="품질 개선" 
              icon={<Tune />} 
                  iconPosition="start"
              disabled={!isStoryReady}
                />
              </Tabs>
            </Box>

        {/* 프로젝트 생성 탭 */}
            {activeTab === 0 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              📁 새 프로젝트 생성
            </Typography>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              영화 제작을 위한 새 프로젝트를 생성합니다. 프로젝트명과 기본 정보를 입력해주세요.
            </Typography>
            
                <SynopsisInputForm 
              onSubmit={handleCreateProject}
              isGenerating={isCreating}
              isProjectCreation={true}
              initialData={projectData}
                />

            {createError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {createError}
              </Alert>
            )}
          </Paper>
        )}

        {/* 시놉시스 입력 탭 */}
        {activeTab === 1 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              📝 시놉시스 입력
                    </Typography>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              영화의 기본 줄거리를 입력하면 AI가 상세한 스토리를 생성합니다.
            </Typography>
            
            <SynopsisInputForm 
              onSubmit={handleSaveSynopsis}
              onSave={handleSaveSynopsis}
              isGenerating={isUpdating}
              initialSynopsis={projectData.synopsis}
            />
            
            {updateError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {updateError}
              </Alert>
            )}
          </Paper>
        )}

        {/* 스토리 생성 탭 */}
        {activeTab === 2 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              ✨ AI 스토리 생성
            </Typography>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              입력된 시놉시스를 바탕으로 AI가 상세한 스토리를 생성합니다.
            </Typography>
            
            {/* 시놉시스 미리보기 */}
            {projectData.synopsis && (
              <Card sx={{ mb: 3, bgcolor: 'grey.50' }}>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    📝 입력된 시놉시스
                  </Typography>
                  <Typography variant="body2">
                    {projectData.synopsis}
                  </Typography>
                </CardContent>
              </Card>
            )}

            {/* 스토리 생성 버튼 */}
            {!isStoryReady && (
              <Box sx={{ mb: 3 }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<AutoFixHigh />}
                  onClick={() => handleGenerateStory(projectData.synopsis)}
                  disabled={isGenerating || !projectData.synopsis}
                  sx={{ mb: 2 }}
                >
                  {isGenerating ? '스토리 생성 중...' : '스토리 생성 시작'}
                </Button>
                
                {isGenerating && (
                  <Box sx={{ mt: 2 }}>
                    <LoadingSpinner message="AI가 스토리를 생성하고 있습니다..." />
                  </Box>
                )}
                  </Box>
                )}

                {/* 생성된 스토리 표시 */}
            {isStoryReady && (
                  <StoryResult 
                story={generatedStory || projectData.story}
                onSave={handleSaveStory}
                onRegenerate={() => handleGenerateStory(projectData.synopsis)}
                    isGenerating={isGenerating}
                projectId={projectInfo?._id}
                  />
                )}

                {/* 에러 상태 표시 */}
                {generationError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                        스토리 생성 실패
                      </Typography>
                <Typography variant="body2">
                      {generationError}
                    </Typography>
                      <Button
                        variant="contained"
                        startIcon={<Refresh />}
                  onClick={() => handleGenerateStory(projectData.synopsis)}
                  sx={{ mt: 2 }}
                      >
                        다시 시도
                      </Button>
              </Alert>
                )}
          </Paper>
            )}

            {/* 히스토리 탭 */}
        {activeTab === 3 && (
          <StoryHistoryPanel 
                onSelectHistory={(historyItem) => {
                  setSynopsis(historyItem.synopsis)
                  if (historyItem.settings) {
                setStorySettings(historyItem.settings)
                  }
                  if (historyItem.story) {
                setGeneratedStory(historyItem.story)
                  }
              setActiveTab(2) // 스토리 생성 탭으로 이동
                }}
              />
            )}

            {/* 품질 개선 탭 */}
        {activeTab === 4 && (
              <StoryQualityEnhancer 
            currentStory={generatedStory || projectData.story}
            onRegenerate={() => handleGenerateStory(projectData.synopsis)}
            onEnhance={handleGenerateStory}
                isGenerating={isGenerating}
            qualityEnhancement={{}}
            onQualityEnhancementChange={() => {}}
          />
            )}
          </Container>
        </Box>
  )
}

export default SynoStoryProjectGenerationPage
