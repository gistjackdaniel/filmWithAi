import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { 
  Box, 
  Typography, 
  Container,
  AppBar,
  Toolbar,
  IconButton,
  Button
} from '@mui/material'
import { 
  ArrowBack,
  Save,
  PlayArrow
} from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'
import TimelineViewer from '../components/timeline/organisms/TimelineViewer'
import SceneDetailModal from '../components/timeline/organisms/SceneDetailModal'
import ConteEditModal from '../components/StoryGeneration/ConteEditModal'
import ConteDetailModal from '../components/StoryGeneration/ConteDetailModal'
import useTimelineStore from '../stores/timelineStore'

/**
 * 프로젝트 상세 페이지 컴포넌트
 * 특정 프로젝트의 상세 정보를 표시하고 편집 기능을 제공
 * URL 파라미터로 프로젝트 ID를 받아 해당 프로젝트 정보를 로드
 */
const ProjectPage = () => {
  // URL 파라미터에서 프로젝트 ID 가져오기
  const { projectId } = useParams()
  
  // React Router 네비게이션 훅
  const navigate = useNavigate()
  const location = useLocation()
  
  // 타임라인 스토어
  const {
    scenes,
    selectedSceneId,
    loading: timelineLoading,
    error: timelineError,
    modalOpen,
    currentScene,
    setCurrentProjectId,
    loadProjectContes,
    selectScene,
    openModal,
    closeModal,
    disconnectRealtimeUpdates
  } = useTimelineStore()
  
  // 로컬 상태 관리
  const [project, setProject] = useState(null) // 프로젝트 정보
  const [loading, setLoading] = useState(true) // 로딩 상태
  const [editModalOpen, setEditModalOpen] = useState(false) // 편집 모달 열림 상태
  const [editingScene, setEditingScene] = useState(null) // 편집 중인 씬

  // 프로젝트 ID가 변경될 때마다 프로젝트 정보와 타임라인 데이터 로드
  useEffect(() => {
    console.log('ProjectPage useEffect triggered with projectId:', projectId)
    
    // projectId가 undefined이거나 빈 문자열인 경우 처리
    if (!projectId || projectId === 'undefined' || projectId === '') {
      console.error('ProjectPage: Invalid projectId:', projectId)
      toast.error('유효하지 않은 프로젝트 ID입니다.')
      navigate('/')
      return
    }
    
    // 중복 요청 방지를 위한 디바운싱
    const timeoutId = setTimeout(() => {
      // temp-project-id인 경우 로컬 스토리지에서 데이터 로드
      if (projectId === 'temp-project-id') {
        console.log('ProjectPage temp-project-id detected, checking timeline store first')
        
        // 타임라인 스토어에서 이미 설정된 데이터 확인
        const { scenes, currentProjectId } = useTimelineStore.getState()
        
        console.log('🔍 ProjectPage 타임라인 스토어 데이터 확인:')
        console.log('  - currentProjectId:', currentProjectId)
        console.log('  - scenes 배열 길이:', scenes?.length || 0)
        console.log('  - scenes 타입:', typeof scenes)
        console.log('  - scenes가 배열인가:', Array.isArray(scenes))
        
        if (scenes && scenes.length > 0 && currentProjectId === 'temp-project-id') {
          console.log('✅ ProjectPage 타임라인 스토어에서 데이터 발견:', scenes.length, '개 씬')
          
          // 각 씬의 상세 정보 로그
          scenes.forEach((scene, index) => {
            console.log(`📋 씬 ${index + 1} 상세 정보:`)
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
          
          // 임시 프로젝트 정보 생성
          const tempProject = {
            projectTitle: '임시 프로젝트',
            synopsis: '콘티 생성으로 만들어진 임시 프로젝트입니다.',
            story: '',
            conteList: scenes
          }
          
          console.log('📋 임시 프로젝트 정보 생성:')
          console.log('  - 제목:', tempProject.projectTitle)
          console.log('  - 시놉시스:', tempProject.synopsis)
          console.log('  - 콘티 개수:', tempProject.conteList.length)
          
          setProject(tempProject)
          setLoading(false)
          return
        }
        
        // 타임라인 스토어에 데이터가 없으면 로컬 스토리지에서 로드
        console.log('ProjectPage no timeline store data, loading from localStorage')
        loadLocalConteData()
      } else {
        fetchProject()
      }
    }, 100) // 100ms 디바운싱
    
    return () => clearTimeout(timeoutId)
  }, [projectId])

  // 컴포넌트 언마운트 시 실시간 연결 해제
  useEffect(() => {
    return () => {
      console.log('ProjectPage unmounting, disconnecting realtime updates')
      disconnectRealtimeUpdates()
    }
  }, [disconnectRealtimeUpdates])

  /**
   * 시간 문자열을 초 단위로 변환하는 함수
   * @param {string} duration - 시간 문자열 (예: "5분", "2분 30초")
   * @returns {number} 초 단위 시간
   */
  const parseDurationToSeconds = (duration) => {
    if (!duration) {
      console.log('parseDurationToSeconds: no duration, returning 300s')
      return 300 // 기본 5분
    }
    
    console.log(`parseDurationToSeconds: parsing "${duration}"`)
    
    const match = duration.match(/(\d+)분\s*(\d+)?초?/)
    if (match) {
      const minutes = parseInt(match[1]) || 0
      const seconds = parseInt(match[2]) || 0
      const result = minutes * 60 + seconds
      console.log(`parseDurationToSeconds: matched "${duration}" -> ${minutes}m ${seconds}s = ${result}s`)
      return result
    }
    
    // 숫자만 있는 경우 분으로 간주
    const numMatch = duration.match(/(\d+)/)
    if (numMatch) {
      const minutes = parseInt(numMatch[1])
      const result = minutes * 60
      console.log(`parseDurationToSeconds: number only "${duration}" -> ${minutes}m = ${result}s`)
      return result
    }
    
    console.log(`parseDurationToSeconds: no match for "${duration}", returning 300s`)
    return 300 // 기본 5분
  }

  /**
   * 전달받은 콘티 데이터를 로드하는 함수
   */
  const loadPassedConteData = (conteData) => {
    try {
      console.log('ProjectPage loadPassedConteData started')
      setLoading(true)
      
      if (!Array.isArray(conteData) || conteData.length === 0) {
        console.log('ProjectPage invalid passed conte data')
        setProject({
          projectTitle: '임시 프로젝트',
          synopsis: '콘티 생성으로 만들어진 임시 프로젝트입니다.',
          story: '',
          conteList: []
        })
        setLoading(false)
        return
      }
      
      // 임시 프로젝트 정보 생성
      const tempProject = {
        projectTitle: location.state?.projectTitle || '임시 프로젝트',
        synopsis: '콘티 생성으로 만들어진 임시 프로젝트입니다.',
        story: '',
        conteList: conteData
      }
      
      setProject(tempProject)
      
      // 타임라인 스토어에 콘티 데이터 설정
      const { setScenes } = useTimelineStore.getState()
      
      // 이미지 URL과 duration이 있는 경우 포함하여 설정
      const scenesWithImages = conteData.map(scene => {
        const duration = scene.duration || parseDurationToSeconds(scene.estimatedDuration || '5분')
        console.log(`Processing scene ${scene.scene}: estimatedDuration=${scene.estimatedDuration}, parsed duration=${duration}s`)
        
        return {
          ...scene,
          imageUrl: scene.imageUrl || null,
          type: scene.type || 'live_action',
          duration: duration
        }
      })
      
      setScenes(scenesWithImages)
      
      console.log('ProjectPage passed conte data loaded:', conteData.length, 'scenes')
      
    } catch (error) {
      console.error('ProjectPage loadPassedConteData failed:', error)
      setProject({
        projectTitle: '임시 프로젝트',
        synopsis: '콘티 생성으로 만들어진 임시 프로젝트입니다.',
        story: '',
        conteList: []
      })
    } finally {
      setLoading(false)
    }
  }

  /**
   * 로컬 스토리지에서 콘티 데이터를 로드하는 함수
   */
  const loadLocalConteData = () => {
    try {
      console.log('🔍 ProjectPage loadLocalConteData 시작')
      setLoading(true)
      
      const storedData = localStorage.getItem('currentConteData')
      console.log('🔍 로컬 스토리지에서 가져온 원본 데이터:', storedData ? '데이터 존재' : '데이터 없음')
      
      if (!storedData) {
        console.log('❌ ProjectPage 로컬 스토리지에 저장된 콘티 데이터가 없음')
        setProject({
          projectTitle: '임시 프로젝트',
          synopsis: '콘티 생성으로 만들어진 임시 프로젝트입니다.',
          story: '',
          conteList: []
        })
        setLoading(false)
        return
      }
      
      const parsedData = JSON.parse(storedData)
      console.log('🔍 파싱된 콘티 데이터:')
      console.log('  - 데이터 타입:', typeof parsedData)
      console.log('  - 배열인가:', Array.isArray(parsedData))
      console.log('  - 데이터 길이:', parsedData?.length || 0)
      
      if (!Array.isArray(parsedData) || parsedData.length === 0) {
        console.log('❌ ProjectPage 파싱된 콘티 데이터가 유효하지 않음')
        console.log('  - 실제 데이터:', parsedData)
        setProject({
          projectTitle: '임시 프로젝트',
          synopsis: '콘티 생성으로 만들어진 임시 프로젝트입니다.',
          story: '',
          conteList: []
        })
        setLoading(false)
        return
      }
      
      console.log('✅ ProjectPage 로컬 스토리지에서 유효한 콘티 데이터 발견:', parsedData.length, '개')
      
      // 각 콘티의 상세 정보 로그
      parsedData.forEach((conte, index) => {
        console.log(`📋 로컬 스토리지 콘티 ${index + 1} 상세 정보:`)
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
      
      // 임시 프로젝트 정보 생성
      const tempProject = {
        projectTitle: '임시 프로젝트',
        synopsis: '콘티 생성으로 만들어진 임시 프로젝트입니다.',
        story: '',
        conteList: parsedData
      }
      
      console.log('📋 로컬 스토리지 기반 임시 프로젝트 정보 생성:')
      console.log('  - 제목:', tempProject.projectTitle)
      console.log('  - 시놉시스:', tempProject.synopsis)
      console.log('  - 콘티 개수:', tempProject.conteList.length)
      
      setProject(tempProject)
      
      // 타임라인 스토어에 콘티 데이터 설정
      const { setScenes } = useTimelineStore.getState()
      
      // 이미지 URL과 duration이 있는 경우 포함하여 설정
      const scenesWithImages = parsedData.map(scene => {
        const duration = scene.duration || parseDurationToSeconds(scene.estimatedDuration || '5분')
        console.log(`🔄 씬 ${scene.scene} 처리: estimatedDuration=${scene.estimatedDuration}, 파싱된 duration=${duration}초`)
        
        return {
          ...scene,
          imageUrl: scene.imageUrl || null,
          type: scene.type || 'live_action',
          duration: duration
        }
      })
      
      console.log('📋 타임라인 스토어에 설정할 씬 데이터:', scenesWithImages.length, '개')
      setScenes(scenesWithImages)
      
      console.log('✅ ProjectPage 로컬 콘티 데이터 로드 완료:', parsedData.length, '개 씬')
      
    } catch (error) {
      console.error('❌ ProjectPage loadLocalConteData 실패:', error)
      console.error('에러 상세:', {
        message: error.message,
        stack: error.stack
      })
      setProject({
        projectTitle: '임시 프로젝트',
        synopsis: '콘티 생성으로 만들어진 임시 프로젝트입니다.',
        story: '',
        conteList: []
      })
    } finally {
      setLoading(false)
    }
  }

  /**
   * 서버에서 프로젝트 상세 정보를 가져오는 함수
   */
  const fetchProject = async () => {
    try {
      console.log('ProjectPage fetchProject started for projectId:', projectId)
      console.log('ProjectPage API URL:', `/projects/${projectId}`)
      setLoading(true)
      
      const response = await api.get(`/projects/${projectId}?includeContes=true`)
      console.log('ProjectPage API response:', response.data)
      
      // 백엔드 응답 구조: { data: { project: {...}, conteList: [...] } }
      const responseData = response.data?.data
      if (!responseData) {
        throw new Error('서버 응답에 데이터가 없습니다.')
      }
      
      const projectData = responseData.project
      console.log('ProjectPage project data received:', projectData)
      
      // projectData가 존재하는지 확인
      if (!projectData) {
        throw new Error('프로젝트 데이터가 없습니다.')
      }
      
      setProject(projectData)
      
      // 타임라인 스토어에 프로젝트 ID 설정
      setCurrentProjectId(projectId)
      
      // 콘티 데이터 확인 및 타임라인 로드
      const conteList = responseData.conteList || []
      
      console.log('ProjectPage conteList found:', conteList.length, 'items')
      
      if (conteList && Array.isArray(conteList) && conteList.length > 0) {
        console.log('ProjectPage loading contes via timelineStore, count:', conteList.length)
        
        // 타임라인 스토어를 통해 콘티 데이터 로드
        const result = await loadProjectContes(projectId)
        console.log('ProjectPage loadProjectContes result:', result)
        
        if (result.success) {
          console.log('✅ 프로젝트 콘티가 타임라인에 연결되었습니다:', result.data.length, '개')
          toast.success(`${result.data.length}개의 콘티가 타임라인에 로드되었습니다.`)
        } else {
          console.error('❌ 타임라인 데이터 로드 실패:', result.error)
          toast.error(result.error || '타임라인 데이터를 불러올 수 없습니다.')
          
          // 실패 시 로컬 데이터로 폴백
          console.log('ProjectPage falling back to local conte data')
          const { setScenes } = useTimelineStore.getState()
          const localScenes = conteList.map((conte, index) => ({
            id: conte.id || conte._id || `scene_${conte.scene || index + 1}`,
            scene: conte.scene || index + 1,
            title: conte.title || `씬 ${conte.scene || index + 1}`,
            description: conte.description || '',
            type: conte.type || 'live_action',
            estimatedDuration: conte.estimatedDuration || '5분',
            duration: parseDurationToSeconds(conte.estimatedDuration || '5분'),
            imageUrl: conte.imageUrl || null
          }))
          setScenes(localScenes)
          console.log('ProjectPage local fallback scenes set:', localScenes.length, 'scenes')
        }
      } else {
        console.log('ProjectPage no contes found in project data, conteList:', conteList)
        // 빈 배열로 초기화하여 타임라인 컴포넌트가 정상 작동하도록 함
        const { setScenes } = useTimelineStore.getState()
        setScenes([])
        
        // 콘티가 없는 경우 안내 메시지
        toast.info('이 프로젝트에는 콘티가 없습니다. 콘티를 생성해보세요.')
      }
    } catch (error) {
      console.error('프로젝트 조회 실패:', error)
      console.error('ProjectPage error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      
      toast.error('프로젝트를 불러올 수 없습니다.')
      
      // 에러 발생 시 빈 배열로 초기화
      const { setScenes } = useTimelineStore.getState()
      setScenes([])
    } finally {
      setLoading(false)
    }
  }

  /**
   * 뒤로가기 버튼 핸들러
   * 대시보드로 돌아가기
   */
  const handleBack = () => {
    // 이전 페이지에서 전달받은 상태 정보 확인
    const returnToInfo = location.state?.returnTo
    
    if (returnToInfo) {
      // 특정 페이지로 돌아가면서 상태 복원
      navigate(returnToInfo.path, { 
        state: returnToInfo.state,
        replace: true // 브라우저 히스토리에서 현재 페이지 대체
      })
    } else {
      // 일반적인 뒤로가기
      navigate('/')
    }
  }

  /**
   * 저장 버튼 핸들러
   * 프로젝트 정보 업데이트
   */
  const handleSave = async () => {
    try {
      if (!project) {
        toast.error('저장할 프로젝트 정보가 없습니다.')
        return
      }

      // temp-project-id인 경우 임시 프로젝트이므로 저장 불가
      if (projectId === 'temp-project-id') {
        toast.error('임시 프로젝트는 저장할 수 없습니다. 프로젝트를 먼저 저장해주세요.')
        return
      } else {
        // 기존 프로젝트 업데이트
        // 콘티가 있는지 확인하여 상태 결정
        const hasContes = project.conteList && project.conteList.length > 0
        const projectStatus = hasContes ? 'conte_ready' : 'story_ready'
        
        const response = await api.put(`/projects/${projectId}`, {
          projectTitle: project.projectTitle,
          synopsis: project.synopsis,
          story: project.story,
          status: projectStatus
        })

        if (response.data.success) {
          toast.success('프로젝트가 저장되었습니다.')
        } else {
          throw new Error(response.data.message || '저장에 실패했습니다.')
        }
      }
    } catch (error) {
      console.error('프로젝트 저장 실패:', error)
      toast.error('프로젝트 저장에 실패했습니다.')
    }
  }

  /**
   * 콘티 생성 버튼 핸들러
   * 콘티 생성 페이지로 이동
   */
  const handleGenerateConte = () => {
    navigate(`/project/${projectId}/conte`)
  }

  /**
   * 프로젝트 정보 편집 핸들러
   */
  const handleEditProject = () => {
    // 프로젝트 정보 편집 모달 또는 페이지로 이동
    toast.info('프로젝트 정보 편집 기능은 개발 중입니다.')
  }

  /**
   * 씬 클릭 핸들러
   */
  const handleSceneClick = useCallback((scene) => {
    selectScene(scene.id)
    openModal(scene)
  }, [selectScene, openModal])

  /**
   * 씬 편집 핸들러
   */
  const handleSceneEdit = useCallback((scene) => {
    setEditingScene(scene)
    setEditModalOpen(true)
  }, [])

  /**
   * 편집 모달 닫기 핸들러
   */
  const handleEditModalClose = useCallback(() => {
    setEditModalOpen(false)
    setEditingScene(null)
  }, [])

  /**
   * 편집된 씬 저장 핸들러
   */
  const handleSaveScene = useCallback(async (editedScene) => {
    try {
      // 타임라인 스토어에서 씬 업데이트
      const { updateScene } = useTimelineStore.getState()
      updateScene(editedScene.id, editedScene)
      
      // 서버에 변경사항 저장
      const timelineService = (await import('../services/timelineService')).default
      const result = await timelineService.updateScene(projectId, editedScene)
      
      if (result.success) {
        toast.success('씬이 저장되었습니다.')
      } else {
        toast.error(result.error || '씬 저장에 실패했습니다.')
      }
    } catch (error) {
      console.error('씬 저장 실패:', error)
      toast.error('씬 저장에 실패했습니다.')
    }
    handleEditModalClose()
  }, [projectId, handleEditModalClose])

  /**
   * 씬 이미지 재생성 핸들러
   */
  const handleRegenerateImage = useCallback(async (scene) => {
    try {
      // 이미지 재생성 로직 구현
      toast.info('이미지 재생성 기능은 준비 중입니다.')
    } catch (error) {
      console.error('이미지 재생성 실패:', error)
      toast.error('이미지 재생성에 실패했습니다.')
    }
  }, [])

  /**
   * 씬 재생성 핸들러
   */
  const handleRegenerateScene = useCallback(async (scene) => {
    try {
      // 씬 재생성 로직 구현
      toast.info('씬 재생성 기능은 준비 중입니다.')
    } catch (error) {
      console.error('씬 재생성 실패:', error)
      toast.error('씬 재생성에 실패했습니다.')
    }
  }, [])

  /**
   * 씬 정보 핸들러
   */
  const handleSceneInfo = useCallback((scene) => {
    openModal(scene)
  }, [openModal])

  /**
   * 씬 재생성 핸들러
   */
  const handleSceneRegenerate = useCallback((scene) => {
    toast.info('AI 재생성 기능은 향후 구현 예정입니다.')
  }, [])

  /**
   * 씬 순서 변경 핸들러
   */
  const handleScenesReorder = useCallback(async (newScenes) => {
    try {
      // 타임라인 스토어 업데이트
      const { updateScenesOrder } = useTimelineStore.getState()
      updateScenesOrder(newScenes)
      
      // 서버에 순서 변경 저장
      const timelineService = (await import('../services/timelineService')).default
      const result = await timelineService.reorderScenes(projectId, newScenes)
      
      if (result.success) {
        toast.success('씬 순서가 변경되었습니다.')
      } else {
        toast.error(result.error || '씬 순서 변경에 실패했습니다.')
      }
    } catch (error) {
      console.error('씬 순서 변경 실패:', error)
      toast.error('씬 순서 변경에 실패했습니다.')
    }
  }, [projectId])

  /**
   * 스케줄러 보기 핸들러
   * SimpleSchedulePage(간단 스케줄러)로 이동하면서 현재 콘티 데이터 전달
   */
  const handleViewSchedule = useCallback(() => {
    if (scenes && scenes.length > 0) {
      // 현재 페이지의 모든 상태를 저장하여 스케줄러로 이동
      const currentPageState = {
        conteData: scenes,
        returnTo: {
          path: `/project/${projectId}`,
          state: {
            // 현재 페이지 상태 복원을 위한 정보
            projectId: projectId,
            project: project
          }
        }
      }
      
      // 간단 스케줄러 페이지로 이동하면서 현재 상태 전달 (정확한 경로로 수정)
      navigate('/simple-schedule', { 
        state: currentPageState
      })
    } else {
      toast.error('스케줄을 보려면 먼저 콘티를 생성해주세요.')
    }
  }, [scenes, projectId, project, navigate])

  // 로딩 중일 때 로딩 화면 표시
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>로딩 중...</Typography>
      </Box>
    )
  }

  // 프로젝트가 없을 때 에러 화면 표시
  if (!project) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>프로젝트를 찾을 수 없습니다.</Typography>
      </Box>
    )
  }

  return (
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
          
          {/* 프로젝트 제목 */}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {project.projectTitle}
          </Typography>
          
          {/* 저장 버튼 */}
          <Button 
            color="inherit" 
            startIcon={<Save />}
            onClick={handleSave}
            disabled={projectId === 'temp-project-id'}
            title={projectId === 'temp-project-id' ? '임시 프로젝트는 저장할 수 없습니다' : '프로젝트 저장'}
          >
            저장
          </Button>
          
          {/* 콘티 생성 버튼 */}
          <Button 
            color="inherit" 
            startIcon={<PlayArrow />}
            onClick={handleGenerateConte}
            sx={{ ml: 1 }}
          >
            콘티 생성
          </Button>
        </Toolbar>
      </AppBar>

      {/* 메인 컨텐츠 */}
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {/* 프로젝트 정보 헤더 */}
        <Box sx={{ mb: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
          <Typography variant="h4" gutterBottom>
            {project.projectTitle}
          </Typography>
          
          {/* 프로젝트 상태 정보 */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              상태: {project.status || 'draft'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              생성일: {new Date(project.createdAt).toLocaleDateString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              콘티 수: {project.conteList?.length || 0}개
            </Typography>
          </Box>

          {/* 시놉시스 섹션 */}
          {project.synopsis && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                시놉시스
              </Typography>
              <Typography variant="body1" paragraph>
                {project.synopsis}
              </Typography>
            </Box>
          )}

          {/* 스토리 섹션 (있는 경우에만 표시) */}
          {project.story && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                스토리
              </Typography>
              <Typography variant="body1" paragraph>
                {project.story}
              </Typography>
            </Box>
          )}
        </Box>

        {/* 타임라인 섹션 */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              타임라인
            </Typography>
            <Button 
              variant="outlined" 
              startIcon={<PlayArrow />}
              onClick={handleGenerateConte}
              size="small"
            >
              콘티 추가
            </Button>
          </Box>
          
          {/* 디버깅 로그 추가 */}
          {console.log('ProjectPage rendering TimelineViewer with:', {
            scenesCount: scenes?.length || 0,
            scenesType: typeof scenes,
            isArray: Array.isArray(scenes),
            timelineLoading,
            selectedSceneId,
            projectId
          })}
          
          <TimelineViewer
            scenes={scenes || []}
            loading={timelineLoading || false}
            selectedSceneId={selectedSceneId || null}
            onSceneClick={handleSceneClick}
            onSceneEdit={handleSceneEdit}
            onSceneInfo={handleSceneInfo}
            onScenesReorder={handleScenesReorder}
            emptyMessage="콘티가 없습니다. AI를 사용하여 콘티를 생성해보세요."
            timeScale={100} // 1초당 100픽셀로 더 크게 증가
            zoomLevel={1}
            showTimeInfo={true}
            baseScale={1}
            onViewSchedule={handleViewSchedule}
          />
        </Box>

        {/* 프로젝트가 완성되지 않은 경우 안내 메시지 */}
        {(!project.story || !project.conteList || project.conteList.length === 0) && (
          <Box sx={{ textAlign: 'center', py: 8, bgcolor: 'background.paper', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              프로젝트가 아직 완성되지 않았습니다.
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              AI를 사용하여 스토리와 콘티를 생성해보세요.
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<PlayArrow />}
              onClick={handleGenerateConte}
              size="large"
            >
              콘티 생성하기
            </Button>
          </Box>
        )}
      </Container>

      {/* 씬 상세 모달 (타임라인용) */}
      <SceneDetailModal
        open={modalOpen}
        scene={currentScene}
        onClose={closeModal}
        onEdit={handleSceneEdit}
        onRegenerate={handleSceneRegenerate}
      />

      {/* 콘티 상세 모달 (공통 컴포넌트) */}
      <ConteDetailModal
        open={false} // 타임라인에서는 기본적으로 비활성화
        onClose={() => {}}
        conte={null}
        onEdit={null}
        onImageRetry={null}
        imageLoadErrors={{}}
        onImageLoadError={null}
      />

      {/* 씬 편집 모달 */}
      <ConteEditModal
        open={editModalOpen}
        onClose={handleEditModalClose}
        conte={editingScene}
        onSave={handleSaveScene}
        onRegenerateImage={handleRegenerateImage}
        onRegenerateConte={handleRegenerateScene}
      />
    </Box>
  )
}

export default ProjectPage 