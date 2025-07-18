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
  DialogActions
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
  Warning
} from '@mui/icons-material'
import ConteGenerator from '../components/StoryGeneration/ConteGenerator'
import ConteResult from '../components/StoryGeneration/ConteResult'
import ConteEditModal from '../components/StoryGeneration/ConteEditModal'
import { generateSceneImage } from '../services/storyGenerationApi'
import useProjectStore from '../stores/projectStore'
import useTimelineStore from '../stores/timelineStore' // 타임라인 스토어 추가
import { shouldUseDevImages, shouldShowDevBadge, getAppName, getCurrentMode } from '../config/appConfig'
import { adaptConteForBackend, validateConteData } from '../utils/conteDataAdapter'
import CommonHeader from '../components/CommonHeader'

/**
 * 직접 스토리 작성 페이지
 * 사용자가 직접 스토리를 작성하고 AI가 콘티를 생성하는 페이지
 */
const DirectStoryPage = () => {
  const navigate = useNavigate()
  const { createConte, saveStoryAndConteAsProject } = useProjectStore()
  const location = useLocation()
  
  // 전달받은 프로젝트 정보
  const passedProjectId = location.state?.projectId
  const passedProjectTitle = location.state?.projectTitle
  
  // 상태 관리
  const [synopsis, setSynopsis] = useState('')
  const [story, setStory] = useState('')
  const [activeStep, setActiveStep] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedConte, setGeneratedConte] = useState([])
  const [generatingImages, setGeneratingImages] = useState(false)
  const [imageGenerationProgress, setImageGenerationProgress] = useState(0)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingConte, setEditingConte] = useState(null)

  // 이미지 로딩 실패 상태 관리
  const [imageLoadErrors, setImageLoadErrors] = useState({})
  const [savingProject, setSavingProject] = useState(false)
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

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
        if (parsedState.generatedConte && parsedState.generatedConte.length > 0) {
          setGeneratedConte(parsedState.generatedConte)
          setActiveStep(1)
          setHasUnsavedChanges(true)
        }
        if (parsedState.activeStep !== undefined) {
          setActiveStep(parsedState.activeStep)
        }
        console.log('✅ 페이지 상태 복원 완료')
      } catch (error) {
        console.error('❌ 상태 복원 실패:', error)
      }
    }
  }, [])

  // 상태 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    const stateToSave = {
      synopsis,
      story,
      generatedConte,
      activeStep,
      timestamp: Date.now()
    }
    localStorage.setItem('directStoryPageState', JSON.stringify(stateToSave))
    
    // 변경사항이 있는지 확인
    const hasChanges = synopsis.trim() || story.trim() || generatedConte.length > 0
    setHasUnsavedChanges(hasChanges)
  }, [synopsis, story, generatedConte, activeStep])

  // 페이지 언로드 시 경고
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = '저장되지 않은 변경사항이 있습니다. 정말로 나가시겠습니까?'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  // 스토리 예시
  const storyExample = `예시: "도시의 밤거리를 걷는 한 남자가 우연히 옛 연인을 만난다. 
그녀는 지금은 성공한 사업가가 되었지만, 과거의 아픈 기억 때문에 그를 피하고 있다. 
남자는 그녀의 마음을 돌리기 위해 과거의 아름다운 추억들을 하나씩 되살려나간다. 
하지만 시간이 지나면서 둘 사이의 갈등은 깊어지고, 결국 그들은 서로의 진심을 확인하는 
중요한 선택의 순간에 놓이게 된다."`

  // 이벤트 핸들러들
  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowExitDialog(true)
    } else {
      navigate('/')
    }
  }

  const handleExitConfirm = () => {
    // 로컬 스토리지에서 상태 삭제
    localStorage.removeItem('directStoryPageState')
    setShowExitDialog(false)
    navigate('/')
  }

  const handleExitCancel = () => {
    setShowExitDialog(false)
  }

  const handleSave = () => toast.success('스토리가 저장되었습니다.')

  const handleConteGenerationStart = () => {
    setIsGenerating(true)
    setActiveStep(1)
    toast.loading('콘티를 생성하고 있습니다...')
    console.log('🎬 콘티 생성 시작')
  }

  const handleConteGenerationComplete = async (conteList) => {
    console.log('🎯 handleConteGenerationComplete 호출됨!')
    console.log('🎯 받은 데이터:', {
      conteList: conteList?.length || 0,
      isArray: Array.isArray(conteList),
      firstItem: conteList?.[0]?.title || '없음',
      conteListType: typeof conteList,
      isNull: conteList === null,
      isUndefined: conteList === undefined
    })
    
    setIsGenerating(false)
    
    // conteList가 null이면 생성 실패
    if (conteList === null) {
      console.error('❌ 콘티 생성 실패: null 데이터')
      toast.error('콘티 생성에 실패했습니다. 다시 시도해주세요.')
      return
    }
    // conteList가 undefined이면 생성 실패
    if (conteList === undefined) {
      console.error('❌ 콘티 생성 실패: undefined 데이터')
      toast.error('콘티 생성에 실패했습니다. 다시 시도해주세요.')
      return
    }
    // conteList가 배열이 아니면 생성 실패
    if (!Array.isArray(conteList)) {
      console.error('❌ 콘티 생성 실패: 배열이 아닌 데이터', conteList)
      toast.error('콘티 생성에 실패했습니다. 다시 시도해주세요.')
      return
    }
    // conteList가 비어있으면 생성 실패
    if (conteList.length === 0) {
      console.error('❌ 콘티 생성 실패: 빈 배열')
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
      estimatedDuration: conte.estimatedDuration || '1분',
      genre: conte.genre || '일반',
      keywords: conte.keywords || {
        timeOfDay: '낮',
        weather: '맑음',
        mood: '평온함',
        location: '실내',
        lighting: '자연광'
      },
      visualDescription: conte.visualDescription || conte.description || '시각적 설명 없음',
      dialogue: conte.dialogue || '',
      cameraAngle: conte.cameraAngle || '중간 샷',
      cameraWork: conte.cameraWork || '고정',
      characterLayout: conte.characterLayout || '중앙 배치',
      props: conte.props || '기본 소품',
      weather: conte.weather || '맑음',
      lighting: conte.lighting || '자연광',
      // 스케줄링 관련 필드 추가
      requiredPersonnel: conte.requiredPersonnel || '감독 1명, 촬영감독 1명, 카메라맨 2명, 조명감독 1명, 음향감독 1명, 배우 3명, 스태프 5명',
      requiredEquipment: conte.requiredEquipment || '카메라 C1, 조명장비 3세트, 마이크 2개, 리플렉터 1개, 삼각대 2개',
      camera: conte.camera || 'C1',
      createdAt: new Date().toISOString(),
      isDevelopment: true // 개발용 플래그 추가
    }))
    
    console.log('✅ 콘티 생성 완료:', processedConteList.length, '개')
    
    // 실제 OpenAI API로 이미지 생성
    const conteWithImages = await Promise.all(
      processedConteList.map(async (conte) => {
        try {
          console.log(`🖼️ 이미지 생성 중: 씬 ${conte.scene}`)
          
          // 실제 OpenAI API로 이미지 생성
          const imageResult = await generateDevelopmentImage(
            `${conte.title}: ${conte.description}`
          )
          
          return {
            ...conte,
            imageUrl: imageResult.url,
            imagePrompt: imageResult.prompt,
            imageGeneratedAt: new Date().toISOString(),
            imageModel: imageResult.model,
            isDevelopment: imageResult.isDevelopment,
            isFreeTier: imageResult.isFreeTier
          }
        } catch (error) {
          console.error(`❌ 이미지 생성 실패 (씬 ${conte.scene}):`, error)
          // 이미지 생성 실패 시에도 콘티는 유지하되 이미지 없이 반환
          return {
            ...conte,
            imageUrl: null,
            imagePrompt: null,
            imageGeneratedAt: new Date().toISOString(),
            imageModel: null,
            isDevelopment: false,
            isFreeTier: false,
            imageError: error.message
          }
        }
      })
    )
    
    setGeneratedConte(conteWithImages)
    toast.success(`✅ ${conteWithImages.length}개의 콘티가 생성되었습니다!`)
    
    // 콘티 생성 완료 후에는 프로젝트를 자동으로 생성하지 않음
    // 사용자가 명시적으로 저장 버튼을 클릭할 때만 프로젝트 생성
    console.log('✅ 콘티 생성 완료 - 사용자가 저장 버튼을 클릭할 때까지 대기')
    
    // 콘티 생성 완료 후 onGenerationComplete 호출 (이미지 포함된 최종 데이터)
    if (onGenerationComplete) {
      onGenerationComplete(conteWithImages)
    }
  }

  // 자동 저장 함수는 제거됨 - 사용자가 명시적으로 저장 버튼을 클릭할 때만 프로젝트 생성

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



  /**
   * 스토리만 저장하는 함수 (story_ready 상태)
   */
  const handleSaveStory = async () => {
    if (!story.trim()) {
      toast.error('저장할 스토리가 없습니다.')
      return
    }

    setSavingProject(true)
    
    try {
      // projectStore의 createProject 함수 사용 (콘티 없이)
      const { createProject } = useProjectStore.getState()
      
      console.log('📝 스토리 프로젝트 생성 시작:', {
        storyLength: story.length
      })
      
      // 스토리만 저장 (콘티 없이)
      const storySynopsis = story.substring(0, 200) + (story.length > 200 ? '...' : '')
      
      // 프로젝트 데이터 구성 (콘티 없이)
      const projectData = {
        projectTitle: `스토리 - ${new Date().toLocaleDateString()}`,
        synopsis: storySynopsis,
        story: story,
        storyLength: story.length,
        storyCreatedAt: new Date().toISOString(),
        conteCount: 0,
        conteCreatedAt: new Date().toISOString(),
        settings: {
          genre: '일반',
          type: 'story_only',
          estimatedDuration: '미정'
        }
      }
      
      const newProject = await createProject(projectData, null) // 콘티 리스트를 null로 전달
      
      if (newProject && (newProject._id || newProject.id)) {
        console.log('✅ 스토리 저장 완료:', newProject._id || newProject.id)
        
        // 프로젝트 상태를 story_ready로 설정
        console.log('🔄 프로젝트 상태 업데이트 중...')
        const { updateProject } = useProjectStore.getState()
        
        await updateProject(newProject._id || newProject.id, {
          status: 'story_ready'
        })
        
        console.log('✅ 프로젝트 상태 업데이트 완료: story_ready')
        
        // 로컬 스토리지에서 임시 데이터 삭제
        localStorage.removeItem('directStoryPageState')
        
        // 상태 초기화
        setStory('')
        setGeneratedConte([])
        setActiveStep(0)
        setHasUnsavedChanges(false)
        
        // 성공 메시지 표시
        toast.success('스토리가 저장되었습니다!')
        
        // 프로젝트 페이지로 이동
        navigate(`/project/${newProject._id || newProject.id}`)
      } else {
        throw new Error('스토리 저장에 실패했습니다.')
      }
      
    } catch (error) {
      console.error('❌ 스토리 저장 실패:', error)
      toast.error(error.message || '스토리 저장에 실패했습니다.')
    } finally {
      setSavingProject(false)
    }
  }

  /**
   * 프로젝트와 콘티를 함께 저장하는 함수 (conte_ready 상태)
   */
  const handleSaveProjectWithContes = async (conteWithImages) => {
    if (!conteWithImages || conteWithImages.length === 0) {
      toast.error('저장할 콘티가 없습니다.')
      return
    }

    setSavingProject(true)
    
    try {
      // projectStore의 createProject 함수 사용 (콘티 없이)
      const { createProject } = useProjectStore.getState()
      
      console.log('📝 프로젝트와 콘티 저장 시작:', {
        storyLength: story.length,
        conteCount: conteWithImages.length
      })
      
      // 직접 스토리 입력 페이지에서는 스토리의 앞부분을 시놉시스로 사용
      const storySynopsis = story.substring(0, 200) + (story.length > 200 ? '...' : '')
      
      // 프로젝트 데이터 구성 (콘티 없이)
      const projectData = {
        projectTitle: passedProjectTitle || `직접 작성 스토리 - ${new Date().toLocaleDateString()}`,
        synopsis: storySynopsis,
        story: story,
        storyLength: story.length,
        storyCreatedAt: new Date().toISOString(),
        conteCount: conteWithImages.length,
        conteCreatedAt: new Date().toISOString(),
        settings: {
          genre: '일반',
          maxScenes: conteWithImages.length,
          estimatedDuration: '90분',
          type: 'story_with_conte'
        }
      }
      
      const newProject = await createProject(projectData, null) // 콘티 리스트를 null로 전달
      
      if (newProject && (newProject._id || newProject.id)) {
        console.log('✅ 프로젝트 저장 완료:', newProject._id || newProject.id)
        
        // 프로젝트 생성 후 콘티들을 저장
        try {
          console.log('💾 프로젝트 생성 후 콘티 저장 시작...')
          const { saveConte } = useProjectStore.getState()
          const projectId = newProject._id || newProject.id
          
          // 각 콘티를 개별적으로 저장
          for (const conte of conteWithImages) {
            console.log(`💾 콘티 저장 중: ${conte.title}`)
            console.log(`📋 저장할 콘티 데이터:`, {
              scene: conte.scene,
              title: conte.title,
              description: conte.description,
              requiredPersonnel: conte.requiredPersonnel,
              requiredEquipment: conte.requiredEquipment,
              camera: conte.camera,
              keywords: conte.keywords
            })
            await saveConte(projectId, conte)
            console.log(`✅ 콘티 저장 완료: ${conte.title}`)
          }
          
          console.log('✅ 모든 콘티 저장 완료')
          
          // 프로젝트 상태를 conte_ready로 업데이트
          console.log('🔄 프로젝트 상태 업데이트 중...')
          const { updateProject } = useProjectStore.getState()
          
          await updateProject(projectId, {
            status: 'conte_ready'
          })
          
          console.log('✅ 프로젝트 상태 업데이트 완료: conte_ready')
          
          // 로컬 스토리지에서 임시 데이터 삭제
          localStorage.removeItem('directStoryPageState')
          
          // 상태 초기화
          setStory('')
          setGeneratedConte([])
          setActiveStep(0)
          setHasUnsavedChanges(false)
          
          // 성공 메시지 표시
          toast.success(`✅ 프로젝트와 ${conteWithImages.length}개의 콘티가 성공적으로 저장되었습니다!`)

          // currentProject 상태 업데이트
          setCurrentProject(newProject)
          
          // 저장된 프로젝트 페이지로 이동
          navigate(`/project/${projectId}`)
          
        } catch (error) {
          console.error('❌ 콘티 저장 실패:', error)
          toast.error('콘티 저장에 실패했습니다: ' + error.message)
        }
      } else {
        throw new Error('프로젝트 저장에 실패했습니다.')
      }
      
    } catch (error) {
      console.error('❌ 프로젝트 저장 실패:', error)
      toast.error(error.message || '프로젝트 저장에 실패했습니다.')
    } finally {
      setSavingProject(false)
    }
  }
          
          // // 타임라인 스토어에 콘티 데이터 설정
          // const { setScenes, setCurrentProjectId } = useTimelineStore.getState()
          
          // // 콘티 데이터를 타임라인 형식으로 변환
          // const timelineScenes = conteWithImages.map((conte, index) => ({
          //   id: conte.id || `scene_${conte.scene || index + 1}`,
          //   scene: conte.scene || index + 1,
          //   title: conte.title || `씬 ${conte.scene || index + 1}`,
          //   description: conte.description || '',
          //   type: conte.type || 'live_action',
          //   estimatedDuration: conte.estimatedDuration || '5분',
          //   duration: parseDurationToSeconds(conte.estimatedDuration || '5분'),
          //   imageUrl: conte.imageUrl || null,
          //   keywords: conte.keywords || {},
          //   visualDescription: conte.visualDescription || '',
          //   dialogue: conte.dialogue || '',
          //   cameraAngle: conte.cameraAngle || '',
          //   cameraWork: conte.cameraWork || '',
          //   characterLayout: conte.characterLayout || '',
          //   props: conte.props || '',
          //   weather: conte.weather || '',
          //   lighting: conte.lighting || '',
          //   transition: conte.transition || '',
          //   lensSpecs: conte.lensSpecs || '',
          //   visualEffects: conte.visualEffects || ''
          // }))
          
  //         console.log('📋 타임라인 스토어에 저장된 콘티 데이터 설정:', timelineScenes.length, '개')
          
  //         // 타임라인 스토어에 데이터 설정
  //         setScenes(timelineScenes)
  //         setCurrentProjectId(projectId)
          
  //         // 저장된 프로젝트 페이지로 이동
  //         navigate(`/project/${projectId}`)
          
  //       } catch (error) {
  //         console.error('❌ 콘티 저장 실패:', error)
  //         toast.error('콘티 저장에 실패했습니다: ' + error.message)
  //       }
  //     } else {
  //       throw new Error('프로젝트 저장에 실패했습니다.')
  //     }
      
  //   } catch (error) {
  //     console.error('❌ 프로젝트 저장 실패:', error)
  //     toast.error(error.message || '프로젝트 저장에 실패했습니다.')
  //   } finally {
  //     setSavingProject(false)
  //   }
  // }

  /**
   * 기존 프로젝트 저장 함수 (하위 호환성)
   */
  const handleSaveProject = async () => {
    if (generatedConte.length === 0) {
      toast.error('저장할 콘티가 없습니다.')
      return
    }

    await handleSaveProjectWithContes(generatedConte)
  }

  const handleViewTimeline = () => {
    if (generatedConte.length > 0) {
      console.log('📋 타임라인 보기 - 콘티 데이터:', generatedConte.length, '개')
      
      // 원본 콘티 데이터 로그
      console.log('🔍 DirectStoryPage 원본 콘티 데이터:')
      generatedConte.forEach((conte, index) => {
        console.log(`📋 원본 콘티 ${index + 1}:`)
        console.log('  - ID:', conte.id)
        console.log('  - 씬 번호:', conte.scene)
        console.log('  - 제목:', conte.title)
        console.log('  - 설명:', conte.description?.substring(0, 100) + '...')
        console.log('  - 타입:', conte.type)
        console.log('  - 예상 시간:', conte.estimatedDuration)
        console.log('  - 이미지 URL:', conte.imageUrl)
        console.log('  - 키워드:', conte.keywords)
        console.log('  - 시각적 설명:', conte.visualDescription?.substring(0, 50) + '...')
        console.log('  - 대사:', conte.dialogue?.substring(0, 50) + '...')
        console.log('  - 카메라 앵글:', conte.cameraAngle)
        console.log('  - 카메라 워크:', conte.cameraWork)
        console.log('  - 캐릭터 배치:', conte.characterLayout)
        console.log('  - 소품:', conte.props)
        console.log('  - 날씨:', conte.weather)
        console.log('  - 조명:', conte.lighting)
        console.log('  - 전환:', conte.transition)
        console.log('  - 렌즈 사양:', conte.lensSpecs)
        console.log('  - 시각 효과:', conte.visualEffects)
        console.log('  ---')
      })
      
      // 타임라인 스토어에 콘티 데이터 직접 설정
      const { setScenes, setCurrentProjectId } = useTimelineStore.getState()
      const { currentProject } = useProjectStore.getState() // 현재 프로젝트 정보 가져오기
      
      // 콘티 데이터를 타임라인 형식으로 변환
      const timelineScenes = generatedConte.map((conte, index) => {
        const duration = parseDurationToSeconds(conte.estimatedDuration || '5분')
        console.log(`🔄 타임라인 변환 - 씬 ${index + 1}:`)
        console.log('  - 원본 시간:', conte.estimatedDuration)
        console.log('  - 변환된 시간(초):', duration)
        
        return {
          id: conte.id || `scene_${conte.scene || index + 1}`,
          scene: conte.scene || index + 1,
          title: conte.title || `씬 ${conte.scene || index + 1}`,
          description: conte.description || '',
          type: conte.type || 'live_action',
          estimatedDuration: conte.estimatedDuration || '5분',
          duration: duration,
          imageUrl: conte.imageUrl || null,
          keywords: conte.keywords || {},
          visualDescription: conte.visualDescription || '',
          dialogue: conte.dialogue || '',
          cameraAngle: conte.cameraAngle || '',
          cameraWork: conte.cameraWork || '',
          characterLayout: conte.characterLayout || '',
          props: conte.props || '',
          weather: conte.weather || '',
          lighting: conte.lighting || '',
          transition: conte.transition || '',
          lensSpecs: conte.lensSpecs || '',
          visualEffects: conte.visualEffects || ''
        }
      })
      
      console.log('📋 타임라인 스토어에 설정할 변환된 씬 데이터:', timelineScenes.length, '개')
      
      // 변환된 씬 데이터 상세 로그
      timelineScenes.forEach((scene, index) => {
        console.log(`📋 변환된 씬 ${index + 1}:`)
        console.log('  - ID:', scene.id)
        console.log('  - 씬 번호:', scene.scene)
        console.log('  - 제목:', scene.title)
        console.log('  - 설명:', scene.description?.substring(0, 100) + '...')
        console.log('  - 타입:', scene.type)
        console.log('  - 예상 시간:', scene.estimatedDuration)
        console.log('  - 실제 시간(초):', scene.duration)
        console.log('  - 이미지 URL:', scene.imageUrl)
        console.log('  - 키워드:', scene.keywords)
        console.log('  - 시각적 설명:', scene.visualDescription?.substring(0, 50) + '...')
        console.log('  - 대사:', scene.dialogue?.substring(0, 50) + '...')
        console.log('  - 카메라 앵글:', scene.cameraAngle)
        console.log('  - 카메라 워크:', scene.cameraWork)
        console.log('  - 캐릭터 배치:', scene.characterLayout)
        console.log('  - 소품:', scene.props)
        console.log('  - 날씨:', scene.weather)
        console.log('  - 조명:', scene.lighting)
        console.log('  - 전환:', scene.transition)
        console.log('  - 렌즈 사양:', scene.lensSpecs)
        console.log('  - 시각 효과:', scene.visualEffects)
        console.log('  ---')
      })
      
      // 타임라인 스토어에 데이터 설정
      console.log('🔧 타임라인 스토어에 데이터 설정 중...')
      setScenes(timelineScenes)
      // 실제 프로젝트 ID로 타임라인 연결
      let projectId = 'temp-project-id'
      if (currentProject && (currentProject._id || currentProject.id)) {
        projectId = currentProject._id || currentProject.id
      }
      setCurrentProjectId(projectId)
      console.log('✅ 타임라인 스토어 데이터 설정 완료')
      
      // 로컬 스토리지에도 백업 저장
      console.log('💾 로컬 스토리지에 백업 저장 중...')
      localStorage.setItem('currentConteData', JSON.stringify(generatedConte))
      console.log('✅ 로컬 스토리지 백업 저장 완료')
      
      // 타임라인 페이지로 이동 (실제 프로젝트 ID 사용)
      console.log('🚀 타임라인 페이지로 이동 중...')
      navigate(`/project/${projectId}`)
      
      toast.success(`${timelineScenes.length}개의 콘티가 타임라인에 로드되었습니다.`)
    } else {
      console.log('❌ 타임라인 보기 실패: 생성된 콘티가 없음')
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
      
      // 실제 OpenAI API로 이미지 생성
      const imageResult = await generateDevelopmentImage(
        `${conte.title}: ${conte.description}`
      )
      
      // 콘티 리스트에서 해당 콘티 업데이트
      const updatedConteList = generatedConte.map(c => 
        c.id === conte.id ? {
          ...c,
          imageUrl: imageResult.url,
          imagePrompt: imageResult.prompt,
          imageGeneratedAt: new Date().toISOString(),
          imageModel: imageResult.model,
          isDevelopment: imageResult.isDevelopment,
          isFreeTier: imageResult.isFreeTier
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
      toast.error('이미지 재생성에 실패했습니다: ' + error.message)
    }
  }

  /**
   * 실제 OpenAI API를 사용한 이미지 생성 함수
   * 개발 모드에서도 실제 API를 사용하여 더미데이터 방지
   */
  const generateDevelopmentImage = async (sceneDescription) => {
    try {
      console.log('🖼️ OpenAI API로 이미지 생성 중...')
      
      // 실제 OpenAI API 호출
      const imageResponse = await generateSceneImage({
        sceneDescription: sceneDescription,
        style: 'cinematic',
        genre: '일반',
        size: '1024x1024'
      })
      
      return {
        url: imageResponse.imageUrl,
        prompt: imageResponse.prompt || sceneDescription,
        isDevelopment: false,
        model: imageResponse.model,
        isFreeTier: imageResponse.isFreeTier
      }
    } catch (error) {
      console.error('❌ OpenAI API 이미지 생성 실패:', error)
      
      // API 실패 시 에러를 던져서 더미데이터 생성 방지
      throw new Error(`이미지 생성에 실패했습니다: ${error.message}`)
    }
  }
  
  /**
   * 시간 문자열을 초로 변환하는 함수
   * @param {string} duration - "X분", "X시간", "X일" 등 형태의 문자열
   * @returns {number} 초 단위의 숫자
   */
  const parseDurationToSeconds = (duration) => {
    if (!duration) return 0;
    const match = duration.match(/(\d+)(분|시간|일)/);
    if (!match) return 0;

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case '분':
        return value * 60;
      case '시간':
        return value * 60 * 60;
      case '일':
        return value * 24 * 60 * 60;
      default:
        return 0;
    }
  };

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
          onClick={activeStep === 0 ? handleSaveStory : handleSaveProject}
          disabled={
            (activeStep === 0 && !story.trim()) || 
            (activeStep === 1 && generatedConte.length === 0) || 
            savingProject
          }
          sx={{
            backgroundColor: 
              (activeStep === 0 && story.trim()) || 
              (activeStep === 1 && generatedConte.length > 0) 
                ? 'rgba(255,255,255,0.1)' 
                : 'transparent',
            '&:hover': {
              backgroundColor: 
                (activeStep === 0 && story.trim()) || 
                (activeStep === 1 && generatedConte.length > 0) 
                  ? 'rgba(255,255,255,0.2)' 
                  : 'transparent',
            }
          }}
        >
          {savingProject ? '저장 중...' : activeStep === 0 ? '스토리 저장' : '프로젝트 저장'}
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

            {/* 시놉시스 입력 영역 */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  시놉시스 (선택사항)
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="시놉시스"
                  placeholder="영화의 기본 줄거리를 간단히 설명해주세요..."
                  value={synopsis}
                  onChange={(e) => setSynopsis(e.target.value)}
                  variant="outlined"
                  sx={{ mb: 2 }}
                  helperText="시놉시스는 나중에 수정할 수 있습니다."
                />
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
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<Save />}
                    onClick={handleSaveStory}
                    disabled={!story.trim() || story.length < 100 || savingProject}
                    sx={{
                      px: 3,
                      py: 1.5,
                      fontSize: '1rem'
                    }}
                  >
                    {savingProject ? '저장 중...' : '스토리 저장'}
                  </Button>
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
            <Box sx={{ mb: 3 }}>
              {shouldUseDevImages() && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <AlertTitle>💡 개발 모드 ({getCurrentMode()})</AlertTitle>
                  현재 <strong>개발용 이미지</strong>를 사용하여 OpenAI API 비용을 절약하고 있습니다.
                  실제 서비스에서는 고품질 AI 이미지가 생성됩니다.
                  <br />
                  <small>출시 시 환경 변수만 변경하면 실제 OpenAI API를 사용할 수 있습니다.</small>
                </Alert>
              )}
              <ConteGenerator 
                story={story}
                onConteGenerated={handleConteGenerationComplete}
                onGenerationStart={handleConteGenerationStart}
                onGenerationComplete={handleConteGenerationComplete}
                onImageGenerationUpdate={handleImageGenerationUpdate}
                isDirectMode={true}
                projectId={passedProjectId || currentProject?._id || currentProject?.id || null}
              />
            </Box>
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
              
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleSaveProject}
                  disabled={savingProject}
                  sx={{
                    backgroundColor: 'var(--color-primary)',
                    '&:hover': {
                      backgroundColor: 'var(--color-primary-dark)',
                    }
                  }}
                >
                  {savingProject ? (
                    <>
                      <CircularProgress size={16} sx={{ mr: 1 }} />
                      저장 중...
                    </>
                  ) : (
                    '프로젝트 저장'
                  )}
                </Button>
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
                
                {/* 저장 상태 표시 */}
                {hasUnsavedChanges && (
                  <Chip
                    icon={<Warning />}
                    label="저장되지 않은 변경사항"
                    color="warning"
                    variant="outlined"
                    size="small"
                  />
                )}
              </Box>
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
                          {/* 개발용 이미지 배지 */}
                          {conte.isDevelopment && shouldShowDevBadge() && (
                            <Box sx={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              backgroundColor: 'rgba(255, 193, 7, 0.9)',
                              color: '#000',
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              zIndex: 1
                            }}>
                              🧪 개발용
                            </Box>
                          )}
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