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
import api from '../services/api'
import useStoryGenerationStore from '../stores/storyGenerationStore'
import useStoryHistoryStore from '../stores/storyHistoryStore'
import CommonHeader from '../components/CommonHeader'

/**
 * AI 콘티 생성 페이지 컴포넌트
 * 프로젝트 ID 기반으로 시놉시스를 입력하고 AI가 콘티를 생성하는 페이지
 * PRD 2.1.3 AI 콘티 생성 기능의 핵심 UI
 */
const ConteGenerationPage = () => {
  // React Router 네비게이션 훅
  const navigate = useNavigate()
  const location = useLocation()
  
  // URL 파라미터에서 프로젝트 ID 가져오기
  const { projectId } = useParams()
  
  // 로컬 상태 관리
  const [activeTab, setActiveTab] = useState(0) // 활성 탭 (0: 생성, 1: 히스토리, 2: 템플릿, 3: 품질 개선, 4: 콘티 생성)
  const [selectedConte, setSelectedConte] = useState(null) // 선택된 콘티
  const [conteModalOpen, setConteModalOpen] = useState(false) // 콘티 상세 모달 열림 상태
  const [editModalOpen, setEditModalOpen] = useState(false) // 편집 모달 열림 상태
  const [editingConte, setEditingConte] = useState(null) // 편집 중인 콘티
  
  // 이미지 로딩 실패 상태 관리
  const [imageLoadErrors, setImageLoadErrors] = useState({})

  // 이미지 생성 상태 관리
  const [isGeneratingImages, setIsGeneratingImages] = useState(false)
  const [imageGenerationProgress, setImageGenerationProgress] = useState(0)
  
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
    failConteGenerationfailConteGeneration,
    resetForNewProject
  } = useStoryGenerationStore()

  // 히스토리 스토어
  const { addToHistory } = useStoryHistoryStore()

  // 콘티 생성 상태
  const { isConteGenerating, generatedConte } = conteGeneration
  
  // 프로젝트 정보 상태
  const [projectInfo, setProjectInfo] = useState(null)
  const [loadingProject, setLoadingProject] = useState(true)

  // 프로젝트 상태 실시간 업데이트를 위한 함수
  const updateProjectInfo = async () => {
    if (!projectId) return
    
    try {
      const response = await api.get(`/projects/${projectId}`)
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
        const response = await api.get(`/projects/${projectId}`)
        
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
      const response = await api.put(`/projects/${projectId}`, updateData)
      
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
      
      // 생성된 스토리를 프로젝트에 저장
      if (projectId) {
        try {
          console.log('💾 생성된 스토리를 프로젝트에 저장 중...')
          await api.put(`/projects/${projectId}`, {
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
   * 콘티 생성 시작 핸들러
   */
  const handleConteGenerationStart = () => {
    // 스토어에서 이미 처리됨
  }

   /**
   * 이미지 생성 상태 업데이트 핸들러
   * @param {boolean} isGenerating - 이미지 생성 중 여부
   * @param {number} progress - 진행률 (0-100)
   */
   const handleImageGenerationUpdate = (isGenerating, progress) => {
    setIsGeneratingImages(isGenerating)
    setImageGenerationProgress(progress)
  }

  /**
   * 콘티 생성 완료 핸들러
   * @param {Array} conteList - 생성된 콘티 리스트
   * @param {boolean} isImageUpdate - 이미지 업데이트인지 여부 (중복 저장 방지)
   */
  const handleConteGenerationComplete = async (conteList, isImageUpdate = false) => {
    console.log('🎬 handleConteGenerationComplete 호출됨:', {
      projectId,
      conteListLength: conteList?.length,
      isImageUpdate,
      conteList: conteList
    })
    
    // API 응답의 실제 필드 값들을 모두 출력
    if (conteList && conteList.length > 0) {
      console.log('📋 API 응답의 실제 필드 값들:')
      conteList.forEach((conte, index) => {
        console.log(`📋 콘티 ${index + 1} - API 응답 필드:`, {
          id: conte.id,
          scene: conte.scene,
          title: conte.title,
          description: conte.description,
          dialogue: conte.dialogue,
          cameraAngle: conte.cameraAngle,
          cameraWork: conte.cameraWork,
          characterLayout: conte.characterLayout,
          props: conte.props,
          weather: conte.weather,
          lighting: conte.lighting,
          visualDescription: conte.visualDescription,
          transition: conte.transition,
          lensSpecs: conte.lensSpecs,
          visualEffects: conte.visualEffects,
          type: conte.type,
          estimatedDuration: conte.estimatedDuration,
          // 스케줄링 관련 필드들
          requiredPersonnel: conte.requiredPersonnel,
          requiredEquipment: conte.requiredEquipment,
          camera: conte.camera,
          keywords: conte.keywords,
          weights: conte.weights,
          canEdit: conte.canEdit,
          lastModified: conte.lastModified,
          modifiedBy: conte.modifiedBy
        })
      })
    }
    
    // 스토어에서 이미 처리됨
    
    // 생성된 콘티를 프로젝트에 저장
    if (projectId && conteList && conteList.length > 0) {
      try {
        if (isImageUpdate) {
          // 이미지 생성 완료 시 - 모든 콘티의 이미지 생성 상태 재확인
          console.log('💾 이미지 생성 완료 - 콘티를 DB에 저장 중...', conteList.length, '개')
          
          // 이미지가 포함된 콘티만 필터링
          const contesWithImages = conteList.filter(conte => conte.imageUrl)
          const totalContes = conteList.length
          const contesWithImagesCount = contesWithImages.length
          
          console.log('💾 DB 저장 전 최종 확인:', {
            totalContes,
            contesWithImagesCount,
            allImagesGenerated: contesWithImagesCount === totalContes
          })
          
          // 모든 콘티의 이미지가 생성된 경우에만 DB 저장 진행
          if (contesWithImagesCount === totalContes) {
            console.log('✅ 모든 콘티의 이미지 생성 완료 - DB 저장 진행')
          } else {
            console.log('⚠️ 일부 콘티의 이미지 생성 실패 - DB 저장 건너뜀:', {
              successCount: contesWithImagesCount,
              totalCount: totalContes,
              failedCount: totalContes - contesWithImagesCount
            })
            return // 일부 실패 시 DB 저장하지 않음
          }
          
          const { conteAPI } = await import('../services/api')
          
          const savedContes = await Promise.all(
            contesWithImages.map(async (conte, index) => {
              try {
                console.log(`💾 콘티 ${index + 1} 저장 중:`, conte.title)
                
                const conteData = {
                  scene: conte.scene,
                  title: conte.title,
                  description: conte.description,
                  dialogue: conte.dialogue || '',
                  cameraAngle: conte.cameraAngle || '',
                  cameraWork: conte.cameraWork || '',
                  characterLayout: conte.characterLayout || '',
                  props: conte.props || '',
                  weather: conte.weather || '',
                  lighting: conte.lighting || '',
                  visualDescription: conte.visualDescription || '',
                  transition: conte.transition || '',
                  lensSpecs: conte.lensSpecs || '',
                  visualEffects: conte.visualEffects || '',
                  type: conte.type || 'live_action',
                  estimatedDuration: conte.estimatedDuration || '5분',
                  // 스케줄링 관련 필드들 추가
                  requiredPersonnel: conte.requiredPersonnel || '감독 1명, 촬영감독 1명, 카메라맨 2명, 조명감독 1명, 음향감독 1명, 배우 3명, 스태프 5명',
                  requiredEquipment: conte.requiredEquipment || '카메라 C1, 조명장비 3세트, 마이크 2개, 리플렉터 1개, 삼각대 2개',
                  camera: conte.camera || 'C1',
                  keywords: conte.keywords || {},
                  weights: conte.weights || {},
                  order: conte.order || index + 1,
                  imageUrl: conte.imageUrl,
                  imagePrompt: conte.imagePrompt || null,
                  imageGeneratedAt: conte.imageGeneratedAt || null,
                  imageModel: conte.imageModel || null,
                  isFreeTier: conte.isFreeTier || false
                }
                
                const response = await conteAPI.createConte(projectId, conteData)
                console.log(`✅ 콘티 ${index + 1} 저장 완료:`, response.data)
                console.log(`📋 콘티 ${index + 1} - DB 저장된 필드:`, {
                  scene: conteData.scene,
                  title: conteData.title,
                  description: conteData.description,
                  dialogue: conteData.dialogue,
                  cameraAngle: conteData.cameraAngle,
                  cameraWork: conteData.cameraWork,
                  characterLayout: conteData.characterLayout,
                  props: conteData.props,
                  weather: conteData.weather,
                  lighting: conteData.lighting,
                  visualDescription: conteData.visualDescription,
                  transition: conteData.transition,
                  lensSpecs: conteData.lensSpecs,
                  visualEffects: conteData.visualEffects,
                  type: conteData.type,
                  estimatedDuration: conteData.estimatedDuration,
                  requiredPersonnel: conteData.requiredPersonnel,
                  requiredEquipment: conteData.requiredEquipment,
                  camera: conteData.camera,
                  keywords: conteData.keywords,
                  weights: conteData.weights
                })
                return response.data
              } catch (error) {
                console.error(`❌ 콘티 ${index + 1} 저장 실패:`, error)
                throw error
              }
            })
          )
          
          console.log('✅ 모든 콘티 저장 완료:', savedContes.length, '개')
          
          toast.success('이미지 생성이 완료되어 콘티가 DB에 저장되었습니다!')

          // 프로젝트 정보 업데이트
          await updateProjectInfo()
          
        } else {
          // 콘티 생성 완료 시 - 프로젝트 상태만 업데이트 (DB 저장은 이미지 생성 완료 후에)
          console.log('💾 콘티 생성 완료 - 프로젝트 상태만 업데이트:', conteList.length, '개')
          
          // 프로젝트 상태를 즉시 conte_ready로 업데이트
          console.log('🔄 프로젝트 상태를 conte_ready로 업데이트 중...')
          try {
            const statusResponse = await api.put(`/projects/${projectId}`, {
              status: 'conte_ready'
            })
            console.log('✅ 프로젝트 상태 업데이트 완료:', statusResponse.data)
            
            // 콘티 생성 완료 (조용히 처리)
            
            // 프로젝트 정보 업데이트
            await updateProjectInfo()
          } catch (statusError) {
            console.error('❌ 프로젝트 상태 업데이트 실패:', statusError)
            toast.error('콘티는 생성되었지만 상태 업데이트에 실패했습니다.')
          }
        }
        
      } catch (conteError) {
        console.error('❌ 콘티 저장/업데이트 중 오류:', conteError)
        
        if (!isImageUpdate) {
          // 콘티 생성 실패 시에도 프로젝트 상태만 업데이트 시도
          try {
            console.log('🔄 콘티 생성 실패했지만 프로젝트 상태 업데이트 시도...')
            await api.put(`/projects/${projectId}`, {
              status: 'conte_ready'
            })
            console.log('✅ 프로젝트 상태 업데이트 완료 (콘티 생성 실패 후)')

          } catch (statusError) {
            console.error('❌ 프로젝트 상태 업데이트도 실패:', statusError)
            toast.error('콘티 생성은 완료되었지만 저장에 실패했습니다.')
          }
        } else {
          toast.error('콘티 저장에 실패했습니다.')
        }
      }
    } else {
      console.log('⚠️ 콘티 리스트가 비어있거나 projectId가 없음:', {
        projectId,
        conteListLength: conteList?.length
      })
    }
  }


  /**
   * 탭 변경 핸들러
   * @param {number} newValue - 새로운 탭 인덱스
   */
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)

    // 탭 변경 시 프로젝트 정보 업데이트 (특히 콘티 생성 탭으로 이동할 때)
    if (newValue === 4) { // 콘티 생성 탭
      updateProjectInfo()

      // 새 프로젝트인 경우 콘티 생성 상태 초기화
      if (projectInfo && !projectInfo.synopsis && !projectInfo.story) {
        console.log('🆕 콘티 생성 탭 - 새 프로젝트 감지, 콘티 상태 초기화')
        resetForNewProject()
      }
    }
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
    // 콘티 데이터를 로컬 스토리지에 저장하고 실제 프로젝트 ID로 타임라인 페이지로 이동
    if (generatedConte && generatedConte.length > 0) {
      localStorage.setItem('currentConteData', JSON.stringify(generatedConte))
      // useParams로 받은 projectId를 사용하여 이동
      navigate(`/project/${projectId}`)
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

  // 백엔드 서버 주소를 환경변수 또는 기본값으로 설정
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
  const getImageUrl = (url) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `${BACKEND_URL}${url}`;
  };

  return (
    <ErrorBoundary>
      <NetworkErrorHandler onRetry={() => {
        if (synopsis) {
          handleGenerateStory(synopsis)
        }
      }}>
        <Box sx={{ flexGrow: 1 }}>
          {/* 공통 헤더 */}
          <CommonHeader 
            title={projectInfo?.projectTitle || 'AI 콘티 생성'}
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
          </CommonHeader>

          {/* 메인 컨텐츠 */}
          <Container maxWidth="lg" sx={{ mt: 4 }}>
            {/* 프로젝트 정보 헤더 */}
            <Box sx={{ mb: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
              <Typography variant="h4" gutterBottom>
                🎬 {projectInfo?.projectTitle || 'AI 콘티 생성'}
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
                    projectId="temp-project-id" // TODO: 실제 프로젝트 ID로 교체
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
                  onImageGenerationUpdate={handleImageGenerationUpdate}
                  projectId={projectId}
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
                          {(conte.imageUrl || isGeneratingImages) && (
                            <Grid item xs={12} sm={4}>
                              <Box sx={{ 
                                width: '100%', 
                                height: 150, 
                                borderRadius: 1,
                                overflow: 'hidden',
                                border: '1px solid #ddd',
                                position: 'relative',
                                backgroundColor: 'var(--color-card-bg)'
                              }}>
                                {conte.imageUrl ? (
                                  <img 
                                    src={getImageUrl(conte.imageUrl)} 
                                    alt={`씬 ${conte.scene} 이미지`}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover'
                                    }}
                                    onError={(e) => handleImageLoadError(conte.id, e)}
                                  />
                                ) : isGeneratingImages ? (
                                  <Box sx={{ 
                                    width: '100%', 
                                    height: '100%', 
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    backgroundColor: 'rgba(0, 0, 0, 0.1)'
                                  }}>
                                    <CircularProgress 
                                      size={40} 
                                      sx={{ color: 'var(--color-accent)', mb: 1 }} 
                                    />
                                    <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                                      이미지 생성 중...
                                    </Typography>
                                    {imageGenerationProgress > 0 && (
                                      <Typography variant="caption" color="text.secondary">
                                        {Math.round(imageGenerationProgress)}%
                                      </Typography>
                                    )}
                                  </Box>
                                ) : null}
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
                          <Grid item xs={12} sm={(conte.imageUrl || isGeneratingImages) ? 8 : 12}>
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
                                {conte.imageUrl ? (
                                  <Chip 
                                    label="이미지 있음" 
                                    size="small" 
                                    color="success" 
                                    variant="outlined"
                                  />
                                ) : isGeneratingImages ? (
                                  <Chip 
                                    label="이미지 생성 중" 
                                    size="small" 
                                    color="warning" 
                                    variant="outlined"
                                    icon={<CircularProgress size={12} />}
                                  />
                                ) : null}
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
          isGeneratingImages={isGeneratingImages}
          imageGenerationProgress={imageGenerationProgress}
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

export default ConteGenerationPage