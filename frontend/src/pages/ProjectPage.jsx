import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { 
  Container,
  Typography, 
  Box, 
  Button,
  Chip, 
  Grid,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  LinearProgress,
  Alert,
  Snackbar,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper
} from '@mui/material'
import { 
  ArrowBack,
  Save,
  PlayArrow,
  Edit,
  Delete,
  Add,
  List,
  Book,
  Schedule,
  Movie,
  Videocam,
  CloudUpload,
  Refresh,
  Settings,
  Info,
  CheckCircle,
  Error,
  Warning,
  Print,
  Visibility
} from '@mui/icons-material'
import { useAuthStore } from '../stores/authStore'
import useProjectStore from '../stores/projectStore'
import { CommonHeader } from '../components/common'
import StoryResult from '../components/story/StoryResult'
import CutTimelineViewer from '../components/timeline/organisms/CutTimelineViewer'
import VideoPlayer from '../components/timeline/atoms/VideoPlayer'
import { toast } from 'react-hot-toast'
import api from '../services/api'

import ConteEditModal from '../components/story/ConteEditModal'
import CutEditModal from '../components/story/CutEditModal'
import ConteDetailModal from '../components/story/ConteDetailModal'
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
  
  // 인증 상태 확인
  const { isAuthenticated, token, user } = useAuthStore()
  
  // 타임라인 스토어에서 데이터 가져오기
  const {
    cuts,
    scenes,
    selectedCutId,
    selectedSceneId,
    loading: timelineLoading,
    error: timelineError,
    currentProjectId,
    modalOpen,
    currentCut,
    currentScene,
    selectCut,
    loadProjectCuts,
    setCurrentProjectId,
    openModal,
    closeModal,
    disconnectRealtimeUpdates,
    loadCutDetails,
    updateCutWithAPI,
    deleteCutWithAPI
  } = useTimelineStore()
  
  // 디버깅: cuts 데이터 확인
  console.log('🔍 ProjectPage cuts 데이터 확인:', {
    cutsLength: cuts?.length || 0,
    cutsType: typeof cuts,
    cutsIsArray: Array.isArray(cuts),
    cuts: cuts?.slice(0, 3) // 처음 3개만 로그
  })
  
  // 로컬 상태 관리
  const [project, setProject] = useState(null) // 프로젝트 정보
  const [loading, setLoading] = useState(true) // 로딩 상태
  const [editModalOpen, setEditModalOpen] = useState(false) // 편집 모달 열림 상태
  const [editingScene, setEditingScene] = useState(null) // 편집 중인 씬
  const [showSceneList, setShowSceneList] = useState(true) // 씬 리스트 표시 여부
  const [showTimeline, setShowTimeline] = useState(false) // 타임라인 표시 여부
  const [showCutList, setShowCutList] = useState(false)
  const [showContinuityBook, setShowContinuityBook] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [v2Videos, setV2Videos] = useState([])
  const [showV2Track, setShowV2Track] = useState(true)
  const playStateTimeoutRef = useRef(null)
  const playbackIntervalRef = useRef(null)

  // 총 지속 시간 계산 함수
  const calculateTotalDuration = useCallback(() => {
    if (!project?.conteList) return 0
    
    let totalDuration = 0
    
    // 모든 씬의 컷 지속 시간 합계
    project.conteList.forEach(scene => {
      if (scene.cuts && Array.isArray(scene.cuts)) {
        scene.cuts.forEach(cut => {
          totalDuration += cut.estimatedDuration || cut.duration || 5
        })
      }
    })
    
    // V2 비디오 지속 시간과 비교하여 더 긴 시간 사용
    const v2TotalDuration = v2Videos.reduce((total, video) => {
      return total + (video.duration || 5)
    }, 0)
    
    return Math.max(totalDuration, v2TotalDuration)
  }, [project, v2Videos])

  // 컷 선택 핸들러 (Playhead 이동 시)
  const handleCutSelect = useCallback((cutId) => {
    console.log('🎬 컷 선택 (비디오 플레이어용):', cutId)
    selectCut(cutId)
  }, [selectCut])

  // 컷 생성 관련 함수들 (로컬에서 구현)
  const generateCutsForScene = useCallback(async (scene) => {
    try {
      console.log('🎬 씬 컷 생성 시작:', scene)
      
      // 실제 컷 생성 로직은 백엔드 API를 호출
      const response = await api.post(`/cuts/generate`, {
        projectId: projectId,
        sceneId: scene.id,
        sceneData: scene
      })
      
      if (response.data.success) {
        return {
          success: true,
          cuts: response.data.cuts || []
        }
      } else {
        return {
          success: false,
          error: response.data.message || '컷 생성에 실패했습니다.'
        }
      }
    } catch (error) {
      console.error('❌ 컷 생성 오류:', error)
      return {
        success: false,
        error: '컷 생성 중 오류가 발생했습니다.'
      }
    }
  }, [projectId])

  const generateCutsForAllScenes = useCallback(async () => {
    try {
      console.log('🎬 모든 씬 컷 생성 시작')
      
      if (!project?.conteList || project.conteList.length === 0) {
        return {
          success: false,
          error: '씬이 없습니다.'
        }
      }
      
      const results = []
      
      // 각 씬에 대해 컷 생성
      for (const scene of project.conteList) {
        try {
          const result = await generateCutsForScene(scene)
          results.push({
            sceneId: scene.id,
            sceneTitle: scene.title,
            success: result.success,
            cuts: result.cuts || [],
            error: result.error
          })
        } catch (error) {
          results.push({
            sceneId: scene.id,
            sceneTitle: scene.title,
            success: false,
            cuts: [],
            error: error.message
          })
        }
      }
      
      const successCount = results.filter(r => r.success).length
      
      return {
        success: successCount > 0,
        results: results,
        error: successCount === 0 ? '모든 씬에서 컷 생성에 실패했습니다.' : null
      }
    } catch (error) {
      console.error('❌ 모든 씬 컷 생성 오류:', error)
      return {
        success: false,
        error: '컷 생성 중 오류가 발생했습니다.'
      }
    }
  }, [project, generateCutsForScene])

  // 프로젝트 상태 업데이트 함수
  const updateProjectStatus = useCallback(async (status) => {
    try {
      if (projectId === 'temp-project-id') {
        console.log('임시 프로젝트 상태 업데이트:', status)
        return
      }
      
      const response = await api.put(`/projects/${projectId}/status`, { status })
      
      if (response.data.success) {
        console.log('프로젝트 상태 업데이트 완료:', status)
      } else {
        console.error('프로젝트 상태 업데이트 실패:', response.data.message)
      }
    } catch (error) {
      console.error('프로젝트 상태 업데이트 오류:', error)
    }
  }, [projectId])

  // URL 파라미터 확인
  const searchParams = new URLSearchParams(location.search)
  const mode = searchParams.get('mode')
  const generateCuts = searchParams.get('generateCuts') === 'true'

  // 프로젝트 ID가 변경될 때마다 프로젝트 정보와 타임라인 데이터 로드
  useEffect(() => {
    console.log('ProjectPage useEffect triggered with projectId:', projectId)
    console.log('URL 파라미터 - mode:', mode, 'generateCuts:', generateCuts)
    
    // projectId가 undefined이거나 빈 문자열인 경우 처리
    if (!projectId || projectId === 'undefined' || projectId === '') {
      console.error('ProjectPage: Invalid projectId:', projectId)
      toast.error('유효하지 않은 프로젝트 ID입니다.')
      navigate('/')
      return
    }
    
    // 중복 요청 방지를 위한 디바운싱
    const timeoutId = setTimeout(async () => {
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
          
          // 컷 데이터 자동 로드 (temp-project-id인 경우)
          console.log('🔄 컷 데이터 자동 로드 시작')
          loadProjectCuts('temp-project-id')
          
          // 컷 생성이 요청된 경우
          if (generateCuts && mode === 'timeline') {
            console.log('🎬 컷 생성 및 타임라인 표시 시작')
            await handleGenerateCutsAndShowTimeline(scenes)
          }
          
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
  }, [projectId, mode, generateCuts])

  // 컴포넌트 언마운트 시 실시간 연결 해제
  useEffect(() => {
    return () => {
      console.log('ProjectPage unmounting, disconnecting realtime updates')
      disconnectRealtimeUpdates()
    }
  }, [disconnectRealtimeUpdates])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (playStateTimeoutRef.current) {
        clearTimeout(playStateTimeoutRef.current)
      }
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current)
      }
    }
  }, [])

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
    
    console.log(`parseDurationToSeconds: parsing "${duration}" (type: ${typeof duration})`)
    
    // 숫자인 경우 그대로 반환 (이미 초 단위)
    if (typeof duration === 'number') {
      console.log(`parseDurationToSeconds: number "${duration}" -> ${duration}s`)
      return duration
    }
    
    // 문자열인 경우 파싱
    if (typeof duration === 'string') {
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
    }
    
    console.log(`parseDurationToSeconds: no match for "${duration}", returning 300s`)
    return 300 // 기본 5분
  }

  /**
   * 컷 클릭 핸들러 (일반 클릭 - CutEditModal 열기)
   */
  const handleCutClick = useCallback((cut) => {
    console.log('🎬 컷 클릭 (CutEditModal):', cut)
    
    // 선택된 컷 ID 업데이트 (비디오 플레이어용)
    const { selectCut } = useTimelineStore.getState()
    selectCut(cut.id)
    
    // CutEditModal에서 편집할 수 있도록 컷 데이터 설정
    setEditingScene({
      ...cut,
      isCut: true
    })
    setEditModalOpen(true)
  }, [])

  /**
   * 씬 클릭 핸들러 (Shift + 클릭 - ConteEditModal 열기)
   */
  const handleSceneClick = useCallback((scene) => {
    console.log('🎬 씬 클릭 (ConteEditModal):', scene)
    
    // ConteEditModal에서 편집할 수 있도록 씬 데이터 설정
    setEditingScene({
      ...scene,
      isCut: false
    })
    setEditModalOpen(true)
  }, [])

  /**
   * 컷 편집 핸들러
   */
  const handleCutEdit = useCallback((cut) => {
    console.log('✏️ 컷 편집:', cut)
    handleCutClick(cut)
  }, [handleCutClick])

  /**
   * 컷 정보 핸들러
   */
  const handleCutInfo = useCallback((cut) => {
    console.log('ℹ️ 컷 정보:', cut)
    handleCutClick(cut)
  }, [handleCutClick])



  /**
   * 컷 생성 및 타임라인 표시 처리 함수
   */
  const handleGenerateCutsAndShowTimeline = async (scenes) => {
    try {
      console.log('🎬 컷 생성 및 타임라인 표시 시작:', scenes.length, '개 씬')
      
      // 로딩 상태 표시
      toast.loading('컷을 생성하고 타임라인을 준비하고 있습니다...', { id: 'cuts-generation' })
      
      // 모든 씬에 대해 컷 생성
      for (const scene of scenes) {
        console.log(`🎬 씬 ${scene.scene} 컷 생성 시작:`, scene.title)
        
        try {
          await generateCutsForScene(scene)
          console.log(`✅ 씬 ${scene.scene} 컷 생성 완료`)
        } catch (error) {
          console.error(`❌ 씬 ${scene.scene} 컷 생성 실패:`, error)
          toast.error(`씬 ${scene.scene} 컷 생성에 실패했습니다.`)
        }
      }
      
      // 타임라인 모달 열기
      console.log('🎬 타임라인 모달 열기')
      openModal('timeline')
      
      toast.success('컷 생성이 완료되었습니다!', { id: 'cuts-generation' })
      
    } catch (error) {
      console.error('❌ 컷 생성 및 타임라인 표시 실패:', error)
      toast.error('컷 생성에 실패했습니다.', { id: 'cuts-generation' })
    }
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
          projectTitle: location.state?.projectTitle || '임시 프로젝트',
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
      
      // 인증 상태 확인
      console.log('🔐 인증 상태 확인:', {
        isAuthenticated,
        hasToken: !!token,
        hasUser: !!user,
        tokenLength: token?.length || 0
      })
      
      // 인증되지 않은 경우 로그인 페이지로 리다이렉트
      if (!isAuthenticated || !token) {
        console.log('❌ 인증되지 않은 사용자. 로그인 페이지로 리다이렉트...')
        toast.error('로그인이 필요합니다.')
        navigate('/')
        return
      }
      
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
      
      // 콘티 데이터 확인 및 타임라인 로드
      const conteList = responseData.conteList || []
      
      console.log('ProjectPage conteList found:', conteList.length, 'items')
      
      // 프로젝트 데이터에 콘티 리스트 추가
      const projectWithContes = {
        ...projectData,
        conteList: conteList
      }
      
      console.log('ProjectPage project with contes:', {
        projectTitle: projectWithContes.projectTitle,
        conteListLength: projectWithContes.conteList?.length || 0,
        contes: projectWithContes.conteList?.map(conte => ({
          id: conte.id,
          scene: conte.scene,
          title: conte.title,
          type: conte.type
        }))
      })
      
      setProject(projectWithContes)
      
      // 타임라인 스토어에 프로젝트 ID 설정
      setCurrentProjectId(projectId)
      
      // 각 콘티의 컷 데이터 확인
      conteList.forEach((conte, index) => {
        console.log(`ProjectPage conte ${index + 1}:`, {
          id: conte.id,
          scene: conte.scene,
          title: conte.title,
          cuts: conte.cuts,
          cutsLength: conte.cuts?.length || 0
        })
      })
      
      if (conteList && Array.isArray(conteList) && conteList.length > 0) {
        console.log('ProjectPage loading contes via timelineStore, count:', conteList.length)
        
        // 타임라인 스토어를 통해 컷 데이터 로드
        const result = await loadProjectCuts(projectId)
        console.log('ProjectPage loadProjectCuts result:', result)
        
        if (result.success) {
          console.log('✅ 프로젝트 컷이 타임라인에 연결되었습니다:', result.data.length, '개')
          toast.success(`${result.data.length}개의 컷이 타임라인에 로드되었습니다.`)
        } else {
          console.error('❌ 타임라인 데이터 로드 실패:', result.error)
          toast.error(result.error || '타임라인 데이터를 불러올 수 없습니다.')
          
          // 실패 시 로컬 데이터로 폴백
          console.log('ProjectPage falling back to local cuts data')
          const { setCuts } = useTimelineStore.getState()
          const localCuts = []
          conteList.forEach((conte, sceneIndex) => {
            if (conte.cuts && Array.isArray(conte.cuts)) {
              conte.cuts.forEach((cut, cutIndex) => {
                localCuts.push({
                  id: cut.id || cut._id || `cut_${sceneIndex}_${cutIndex}`,
                  shotNumber: cut.shotNumber || cutIndex + 1,
                  title: cut.title || `컷 ${cut.shotNumber || cutIndex + 1}`,
                  description: cut.description || '',
                  cutType: cut.cutType || 'MS',
                  estimatedDuration: cut.estimatedDuration || 5,
                  duration: parseDurationToSeconds(cut.estimatedDuration || 5),
                  imageUrl: cut.imageUrl || null,
                  sceneId: conte.id || conte._id,
                  sceneNumber: conte.scene || sceneIndex + 1,
                  sceneTitle: conte.title || `씬 ${conte.scene || sceneIndex + 1}`
                })
              })
            }
          })
          setCuts(localCuts)
          console.log('ProjectPage local fallback cuts set:', localCuts.length, 'cuts')
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
    // 일반적인 뒤로가기 - 브라우저 히스토리에서 이전 페이지로 이동
    navigate(-1)
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
        // 기존 프로젝트 업데이트 (상태는 기존 상태 유지)
        const response = await api.put(`/projects/${projectId}`, {
          projectTitle: project.projectTitle,
          synopsis: project.synopsis,
          story: project.story
          // status는 제거하여 기존 상태 유지
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
   * 편집 모달 닫기 핸들러
   */
  const handleEditModalClose = useCallback(() => {
    setEditModalOpen(false)
    setEditingScene(null)
  }, [])

  /**
   * 편집된 컷 저장 핸들러
   */
  const handleSaveScene = useCallback(async (editedCut) => {
    try {
      // 타임라인 스토어에서 컷 업데이트
      const { updateCut } = useTimelineStore.getState()
      updateCut(editedCut.id, editedCut)
      
      // 서버에 변경사항 저장
      const timelineService = (await import('../services/timelineService')).default
      const result = await timelineService.updateCut(projectId, editedCut)
      
      if (result.success) {
        toast.success('컷이 저장되었습니다.')
      } else {
        toast.error(result.error || '컷 저장에 실패했습니다.')
      }
    } catch (error) {
      console.error('컷 저장 실패:', error)
      toast.error('컷 저장에 실패했습니다.')
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
   * 씬 편집 핸들러
   */
  const handleSceneEdit = useCallback((editedScene) => {
    try {
      console.log('✏️ 씬 편집:', editedScene)
      // 씬 편집 로직 구현
      toast.success('씬이 수정되었습니다.')
    } catch (error) {
      console.error('❌ 씬 편집 실패:', error)
      toast.error('씬 편집에 실패했습니다.')
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
   * 컷 순서 변경 핸들러
   */
  const handleCutsReorder = useCallback(async (newCuts) => {
    try {
      // 타임라인 스토어 업데이트
      const { updateCutsOrder } = useTimelineStore.getState()
      updateCutsOrder(newCuts)
      
      // 서버에 순서 변경 저장
      const timelineService = (await import('../services/timelineService')).default
      const result = await timelineService.reorderCuts(projectId, newCuts)
      
      if (result.success) {
        toast.success('컷 순서가 변경되었습니다.')
      } else {
        toast.error(result.error || '컷 순서 변경에 실패했습니다.')
      }
    } catch (error) {
      console.error('컷 순서 변경 실패:', error)
      toast.error('컷 순서 변경에 실패했습니다.')
    }
  }, [projectId])

  /**
   * 프로젝트 상태 업데이트
   */
  /**
   * 컷 생성 상태 확인
   */
  const getCutGenerationStatus = useCallback(() => {
    if (!project?.conteList || project.conteList.length === 0) return 'no_scenes'
    
    const scenesWithCuts = project.conteList.filter(scene => scene.cuts && scene.cuts.length > 0)
    const totalScenes = project.conteList.length
    const scenesWithCutsCount = scenesWithCuts.length
    
    if (scenesWithCutsCount === 0) return 'no_cuts'
    if (scenesWithCutsCount === totalScenes) return 'all_cuts_generated'
    return 'partial_cuts_generated'
  }, [project])

  /**
   * 특정 씬에 컷 생성
   */
  const handleGenerateCutsForScene = useCallback(async (scene) => {
    try {
      console.log('🎬 씬 컷 생성 시작:', scene)
      
      // 상태를 cut_generating으로 업데이트
      await updateProjectStatus('cut_generating')
      
      const result = await generateCutsForScene(scene)
      
      if (result.success) {
        toast.success(`${scene.title} 씬에 ${result.cuts.length}개의 컷이 생성되었습니다.`)
        console.log('✅ 컷 생성 완료:', result.cuts)
        
        // 타임라인 스토어에 컷 데이터 추가
        const { cuts: existingCuts, setCuts } = useTimelineStore.getState()
        const newCuts = result.cuts.map((cut, index) => ({
          id: cut.id || cut._id || `cut_${scene.scene}_${index}`,
          shotNumber: cut.shotNumber || index + 1,
          title: cut.title || `컷 ${cut.shotNumber || index + 1}`,
          description: cut.description || '',
          cutType: cut.cutType || 'MS',
          estimatedDuration: cut.estimatedDuration || 5,
          duration: parseDurationToSeconds(cut.estimatedDuration || 5),
          imageUrl: cut.imageUrl || null,
          sceneId: scene.id || scene._id,
          sceneNumber: scene.scene,
          sceneTitle: scene.title
        }))
        
        // 기존 컷과 새 컷을 합쳐서 타임라인 스토어에 설정
        const updatedCuts = [...existingCuts, ...newCuts]
        setCuts(updatedCuts)
        
        console.log('✅ 타임라인 스토어에 컷 데이터 추가됨:', newCuts.length, '개')
        console.log('✅ 전체 컷 개수:', updatedCuts.length, '개')
        
        // 컷 생성 후 프로젝트 데이터를 다시 불러와서 컷 데이터를 포함
        await fetchProject()
        
        // 컷 생성 후 상태 확인 및 업데이트
        const cutStatus = getCutGenerationStatus()
        if (cutStatus === 'all_cuts_generated') {
          await updateProjectStatus('cut_generated')
        }
        
        // 컷이 생성되었으면 타임라인으로 자동 전환
        if (result.cuts && result.cuts.length > 0) {
          setShowTimeline(true)
          setShowSceneList(false)
          toast.success('컷이 생성되었습니다. 타임라인으로 이동합니다.')
        }
      } else {
        toast.error(`컷 생성 실패: ${result.error}`)
        console.error('❌ 컷 생성 실패:', result.error)
      }
    } catch (error) {
      toast.error('컷 생성 중 오류가 발생했습니다.')
      console.error('❌ 컷 생성 오류:', error)
    }
  }, [generateCutsForScene, updateProjectStatus, getCutGenerationStatus, fetchProject])

  /**
   * 프로젝트 상태 라벨 반환
   */
  const getProjectStatusLabel = useCallback((status) => {
    const statusLabels = {
      'draft': '초안',
      'story_generated': '스토리 생성됨',
      'conte_generated': '콘티 생성됨',
      'cut_generating': '컷 생성 중',
      'cut_generated': '컷 생성 완료',
      'in_progress': '진행 중',
      'completed': '완료'
    }
    return statusLabels[status] || status
  }, [])

  /**
   * 프로젝트 상태 색상 반환
   */
  const getProjectStatusColor = useCallback((status) => {
    const statusColors = {
      'draft': 'default',
      'story_generated': 'primary',
      'conte_generated': 'secondary',
      'cut_generating': 'warning',
      'cut_generated': 'success',
      'in_progress': 'info',
      'completed': 'success'
    }
    return statusColors[status] || 'default'
  }, [])

  /**
   * 컷 생성 진행률 반환 (씬과 컷 모두 체크)
   */
  const getCutGenerationProgress = useCallback(() => {
    if (!project?.conteList || project.conteList.length === 0) return ''
    
    const scenesWithCuts = project.conteList.filter(scene => scene.cuts && scene.cuts.length > 0)
    const totalScenes = project.conteList.length
    const scenesWithCutsCount = scenesWithCuts.length
    
    // 전체 컷 개수 계산
    const totalCuts = project.conteList.reduce((total, scene) => {
      return total + (scene.cuts ? scene.cuts.length : 0)
    }, 0)
    
    return `${scenesWithCutsCount}/${totalScenes} 씬, ${totalCuts}개 컷`
  }, [project])

  /**
   * 모든 씬에 컷 생성
   */
  const handleGenerateCutsForAllScenes = useCallback(async () => {
    try {
      console.log('🎬 모든 씬 컷 생성 시작')
      console.log('현재 project 상태:', { 
        projectTitle: project?.projectTitle,
        conteListLength: project?.conteList?.length || 0,
        projectId: projectId
      })
      
      // 씬이 없으면 에러 메시지
      if (!project?.conteList || project.conteList.length === 0) {
        toast.error('씬이 없습니다. 먼저 콘티를 생성해주세요.')
        console.error('❌ 씬이 없습니다:', project?.conteList)
        return
      }
      
      // 상태를 cut_generating으로 업데이트
      await updateProjectStatus('cut_generating')
      
      const result = await generateCutsForAllScenes()
      
      if (result.success) {
        const successCount = result.results.filter(r => r.success).length
        toast.success(`${successCount}개 씬에 컷이 생성되었습니다.`)
        console.log('✅ 모든 씬 컷 생성 완료:', result.results)
        
        // 타임라인 스토어에 모든 컷 데이터 추가
        const { cuts: existingCuts, setCuts } = useTimelineStore.getState()
        const allNewCuts = []
        
        result.results.forEach(resultItem => {
          if (resultItem.success && resultItem.cuts) {
            const scene = project.conteList.find(s => s.id === resultItem.sceneId)
            const newCuts = resultItem.cuts.map((cut, index) => ({
              id: cut.id || cut._id || `cut_${scene?.scene || resultItem.sceneId}_${index}`,
              shotNumber: cut.shotNumber || index + 1,
              title: cut.title || `컷 ${cut.shotNumber || index + 1}`,
              description: cut.description || '',
              cutType: cut.cutType || 'MS',
              estimatedDuration: cut.estimatedDuration || 5,
              duration: typeof cut.estimatedDuration === 'number' ? cut.estimatedDuration : parseDurationToSeconds(cut.estimatedDuration || 5),
              imageUrl: cut.imageUrl || null,
              sceneId: scene?.id || scene?._id || resultItem.sceneId,
              sceneNumber: scene?.scene || 1,
              sceneTitle: scene?.title || resultItem.sceneTitle
            }))
            allNewCuts.push(...newCuts)
          }
        })
        
        // 기존 컷과 새 컷을 합쳐서 타임라인 스토어에 설정
        const updatedCuts = [...existingCuts, ...allNewCuts]
        setCuts(updatedCuts)
        
        console.log('✅ 타임라인 스토어에 모든 컷 데이터 추가됨:', allNewCuts.length, '개')
        console.log('✅ 전체 컷 개수:', updatedCuts.length, '개')
        
        // 컷 생성 후 프로젝트 데이터를 다시 불러와서 컷 데이터를 포함
        await fetchProject()
        
        // 모든 씬에 컷이 생성되었으면 상태를 cut_generated로 업데이트
        const cutStatus = getCutGenerationStatus()
        if (cutStatus === 'all_cuts_generated') {
          await updateProjectStatus('cut_generated')
        }
        
        // 컷이 생성되었으면 타임라인으로 자동 전환
        if (successCount > 0) {
          setShowTimeline(true)
          setShowSceneList(false)
          toast.success(`${successCount}개 씬에 컷이 생성되었습니다. 타임라인으로 이동합니다.`)
        }
      } else {
        toast.error(`컷 생성 실패: ${result.error}`)
        console.error('❌ 모든 씬 컷 생성 실패:', result.error)
      }
    } catch (error) {
      toast.error('컷 생성 중 오류가 발생했습니다.')
      console.error('❌ 모든 씬 컷 생성 오류:', error)
    }
  }, [generateCutsForAllScenes, updateProjectStatus, getCutGenerationStatus, fetchProject, project])

  /**
   * 씬 재생성 핸들러
   */
  const handleSceneRegenerate = useCallback(async (scene) => {
    try {
      console.log('🔄 씬 재생성 시작:', scene)
      toast.info('씬 재생성 기능은 향후 구현 예정입니다.')
    } catch (error) {
      console.error('❌ 씬 재생성 실패:', error)
      toast.error('씬 재생성에 실패했습니다.')
    }
  }, [])

  /**
   * 씬 편집 핸들러
   */
  const handleEditScene = useCallback((scene) => {
    setEditingScene(scene)
    openModal(scene)
  }, [openModal])

  /**
   * 씬 상세 보기 핸들러
   */
  const handleViewScene = useCallback((scene) => {
    setEditingScene(scene)
    // 상세 모달 열기
  }, [])

  /**
   * 스케줄러 보기 핸들러
   * SimpleSchedulePage(간단 스케줄러)로 이동하면서 현재 콘티 데이터 전달
   */
  const handleViewSchedule = useCallback(() => {
    if (project?.conteList && project.conteList.length > 0) {
      // 간단 스케줄러 페이지로 이동하면서 씬 데이터 전달
      const currentPageState = {
        conteData: project.conteList
      }
      
      // 간단 스케줄러 페이지로 이동하면서 현재 상태 전달
      // URL 파라미터로도 프로젝트 ID 전달하여 확실하게 구분
      navigate(`/simple-schedule/${projectId}`, { 
        state: currentPageState
        // replace: true 제거하여 브라우저 히스토리 유지
      })
    } else {
      toast.error('스케줄을 보려면 먼저 콘티를 생성해주세요.')
    }
  }, [project, projectId, navigate])

  /**
   * 컷리스트 출력 핸들러
   */
  const handleShowCutList = () => {
    setShowCutList(true)
  }

  /**
   * 콘티북 출력 핸들러
   */
  const handleShowContinuityBook = () => {
    setShowContinuityBook(true)
  }

  /**
   * 컷리스트 데이터 생성 - 씬별로 그룹화
   */
  const generateCutListData = () => {
    if (!project?.conteList || !cuts) return []
    
    const cutListData = []
    
    // 씬별로 컷을 그룹화
    project.conteList.forEach((scene, sceneIndex) => {
      // sceneId와 sceneNumber 모두로 매칭 시도
      const sceneCuts = cuts.filter(cut => {
        const sceneIdMatch = cut.sceneId === scene.id || cut.sceneId === scene._id
        const sceneNumberMatch = cut.sceneNumber === scene.scene
        const conteIdMatch = cut.sceneId === scene.conteId
        
        return sceneIdMatch || sceneNumberMatch || conteIdMatch
      })
      
      // 씬별 컷 데이터 생성
      if (sceneCuts && sceneCuts.length > 0) {
        sceneCuts.forEach(cut => {
      const shotSize = cut.shootingPlan?.shotSize || cut.shotSize || 'MS'
      const angleDirection = cut.shootingPlan?.angleDirection || cut.angleDirection || 'Eye-Level'
      const cameraMovement = cut.shootingPlan?.cameraMovement || cut.cameraMovement || 'Static'
      const lensSpecs = cut.shootingPlan?.lensSpecs || cut.lensSpecs || ''
      const equipment = cut.requiredEquipment?.cameras?.join(', ') || ''
      
          cutListData.push({
            scene: scene.scene || sceneIndex + 1,
            sceneTitle: scene.title,
        cut: cut.shotNumber,
        description: cut.description,
        shotSize,
        angleDirection,
        cameraMovement,
        lensSpecs,
        equipment
          })
        })
      }
    })
    
    return cutListData
  }

  /**
   * 콘티북 데이터 생성 - 씬별로 그룹화
   */
  const generateContinuityBookData = () => {
    if (!project?.conteList || !cuts) return []
    
    const continuityBookData = []
    
    // 씬별로 컷을 그룹화
    project.conteList.forEach((scene, sceneIndex) => {
      // sceneId와 sceneNumber 모두로 매칭 시도
      const sceneCuts = cuts.filter(cut => {
        const sceneIdMatch = cut.sceneId === scene.id || cut.sceneId === scene._id
        const sceneNumberMatch = cut.sceneNumber === scene.scene
        const conteIdMatch = cut.sceneId === scene.conteId
        
        return sceneIdMatch || sceneNumberMatch || conteIdMatch
      })
      
      // 씬별 컷 데이터 생성
      if (sceneCuts && sceneCuts.length > 0) {
        sceneCuts.forEach(cut => {
      const shotSize = cut.shootingPlan?.shotSize || cut.shotSize || 'MS'
      const angleDirection = cut.shootingPlan?.angleDirection || cut.angleDirection || 'Eye-Level'
      const cameraMovement = cut.shootingPlan?.cameraMovement || cut.cameraMovement || 'Static'
      
          continuityBookData.push({
            scene: scene.scene || sceneIndex + 1,
            sceneTitle: scene.title,
        cutNumber: cut.shotNumber,
        imageUrl: cut.imageUrl,
        description: cut.description,
        shotSize,
        angleDirection,
        cameraMovement
          })
        })
      }
    })
    
    return continuityBookData
  }

  // 정렬된 컷 목록 계산 함수
  const getSortedCuts = useCallback(() => {
    if (!project?.conteList || !cuts) return []
    
    const sortedCuts = []
    let globalCutIndex = 0
    
    project.conteList.forEach((scene, sceneIndex) => {
      // sceneId와 sceneNumber 모두로 매칭 시도
      const sceneCuts = cuts.filter(cut => {
        const sceneIdMatch = cut.sceneId === scene.id || cut.sceneId === scene._id
        const sceneNumberMatch = cut.sceneNumber === scene.scene
        const conteIdMatch = cut.sceneId === scene.conteId
        
        return sceneIdMatch || sceneNumberMatch || conteIdMatch
      })
      
      if (sceneCuts && Array.isArray(sceneCuts)) {
        sceneCuts.forEach((cut, cutIndex) => {
          sortedCuts.push({
            ...cut,
            sceneId: scene.id,
            sceneIndex: sceneIndex,
            sceneTitle: scene.title,
            sceneNumber: scene.scene,
            globalIndex: globalCutIndex,
            isLastCutInScene: cutIndex === sceneCuts.length - 1
          })
          globalCutIndex++
        })
      }
    })
    
    return sortedCuts
  }, [project?.conteList, cuts])

  // V1 컷 이미지 렌더링 함수
  const renderV1CutImage = useCallback(() => {
    // 정렬된 컷 목록 사용
    const sortedCuts = getSortedCuts()
    
    // 현재 시간에 해당하는 V1 컷 찾기
    let accumulatedTime = 0
    let currentCut = null
    
    if (sortedCuts && sortedCuts.length > 0) {
      for (const cut of sortedCuts) {
        const cutDuration = cut.estimatedDuration || cut.duration || 5
        const cutEndTime = accumulatedTime + cutDuration
        
        if (currentTime >= accumulatedTime && currentTime < cutEndTime) {
          currentCut = cut
          break
        }
        accumulatedTime = cutEndTime
      }
      
      // 현재 시간이 모든 컷 범위를 벗어난 경우 마지막 컷 선택
      if (!currentCut && sortedCuts.length > 0) {
        currentCut = sortedCuts[sortedCuts.length - 1]
      }
    }
    
    if (currentCut?.imageUrl) {
      return (
        <img
          key={`${currentCut.id}-${currentTime}`} // 시간이 변경될 때마다 이미지 재로드
          src={currentCut.imageUrl.startsWith('/') ? `http://localhost:5001${currentCut.imageUrl}` : currentCut.imageUrl}
          alt={`컷 ${currentCut.shotNumber} - ${currentCut.title}`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain'
          }}
          onError={(e) => console.error('🎬 컷 이미지 로딩 오류:', currentCut.title)}
        />
      )
    } else {
      return (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: 'white',
          textAlign: 'center'
        }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            V1 컷 이미지 플레이어
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            컷 이미지 미리보기
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            {currentCut ? `컷 ${currentCut.shotNumber}: ${currentCut.title}` : '컷을 선택하거나 생성해주세요'}
          </Typography>
        </Box>
      )
    }
  }, [currentTime, getSortedCuts])

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
      {/* 공통 헤더 */}
      <CommonHeader 
        title={project?.projectTitle || '프로젝트'}
        showBackButton={true}
        onBack={handleBack}
      >
        {/* 저장 버튼 */}
        <Button 
          color="inherit" 
          startIcon={<Save />}
          onClick={handleSave}
          disabled={projectId === 'temp-project-id'}
          title={projectId === 'temp-project-id' ? '임시 프로젝트는 저장할 수 없습니다' : '프로젝트 저장'}
          sx={{ mr: 1 }}
        >
          저장
        </Button>
        
        {/* 콘티 생성 버튼 */}
        <Button 
          color="inherit" 
          startIcon={<PlayArrow />}
          onClick={handleGenerateConte}
          sx={{ mr: 1 }}
        >
          콘티 생성
        </Button>
        
        {/* 컷 생성 드롭다운 메뉴 */}
        <Box sx={{ display: 'flex', gap: 1, mr: 1 }}>
          <Button
            color="inherit"
            startIcon={<PlayArrow />}
            onClick={handleGenerateCutsForAllScenes}
            disabled={!project?.conteList || project.conteList.length === 0}
            title={!project?.conteList || project.conteList.length === 0 ? '먼저 콘티를 생성해주세요' : '모든 씬에 컷 생성'}
            variant="outlined"
          >
            모든 씬 컷 생성
          </Button>
        </Box>
      </CommonHeader>

      {/* 메인 컨텐츠 */}
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {/* 프로젝트 정보 헤더 */}
        <Box sx={{ mb: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
          <Typography variant="h4" gutterBottom>
            {project.projectTitle}
          </Typography>
          
          {/* 프로젝트 상태 정보 */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
            <Chip 
              label={getProjectStatusLabel(project.status || 'draft')}
              color={getProjectStatusColor(project.status || 'draft')}
              size="small"
            />
            <Typography variant="body2" color="text.secondary">
              생성일: {new Date(project.createdAt).toLocaleDateString()}
            </Typography>
            {project?.conteList && project.conteList.length > 0 && (
            <Typography variant="body2" color="text.secondary">
                씬: {project.conteList.length}개
            </Typography>
            )}
            {getCutGenerationStatus() !== 'no_cuts' && (
              <Typography variant="body2" color="text.secondary">
                컷 생성: {getCutGenerationProgress()}
              </Typography>
            )}
          </Box>

          {/* 시놉시스 섹션 (씬 리스트 모드에서만 표시) */}
          {!showTimeline && project.synopsis && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                시놉시스
              </Typography>
              <Typography variant="body1" paragraph>
                {project.synopsis}
              </Typography>
            </Box>
          )}

          {/* 스토리 섹션 (씬 리스트 모드에서만 표시) */}
          {!showTimeline && project.story && (
            <Box sx={{ mb: 3 }}>
              <StoryResult 
                story={project.story}
                onSave={(editedStory) => {
                  // 스토리 저장 로직
                  console.log('스토리 편집 완료:', editedStory)
                  toast.success('스토리가 업데이트되었습니다.')
                }}
                onRegenerate={() => {
                  // 스토리 재생성 로직 (현재는 안내 메시지만)
                  toast.info('스토리 재생성은 콘티 생성 페이지에서 가능합니다.')
                }}
                isGenerating={false}
                onAutoSave={null}
                projectId={projectId}
              />
            </Box>
          )}

          {/* 비디오 플레이어 영역 (타임라인 모드에서만 표시) */}
          {showTimeline && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                비디오 플레이어 ({showV2Track && v2Videos.length > 0 ? 'V2 - 비디오' : 'V1 - 컷 이미지 미리보기'})
              </Typography>
              <Box 
                sx={{ 
                  width: '100%', 
                  height: 300, 
                  bgcolor: 'black', 
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* V2 트랙이 활성화되고 비디오가 있는 경우 V2 비디오 표시 */}
                {showV2Track && v2Videos.length > 0 ? (
                  (() => {
                    // 현재 시간에 해당하는 V2 비디오 찾기
                    let accumulatedTime = 0
                    let currentVideo = null
                    
                    for (const video of v2Videos) {
                      const videoDuration = video.duration || 5
                      const videoEndTime = accumulatedTime + videoDuration
                      
                      if (currentTime >= accumulatedTime && currentTime < videoEndTime) {
                        currentVideo = video
                        break
                      }
                      accumulatedTime = videoEndTime
                    }
                    
                    // 현재 시간이 모든 비디오 범위를 벗어난 경우 V1 컷 이미지 표시
                    if (!currentVideo) {
                      return renderV1CutImage()
                    }

                    if (currentVideo?.videoUrl) {
                      
                      // 비디오 URL 처리
                      const videoUrl = (() => {
                        const url = currentVideo.videoUrl
                        
                        // 이미 완전한 URL인 경우
                        if (url.startsWith('http://') || url.startsWith('https://')) {
                          return url
                        }
                        
                        // 로컬 파일 경로인 경우 (blob: 또는 /uploads/ 형식)
                        if (url.startsWith('blob:')) {
                          return url
                        }
                        
                        // 상대 경로인 경우 백엔드 서버 URL 추가
                        if (url.startsWith('/')) {
                          return `http://localhost:5001${url}`
                        }
                        
                        // 파일명만 있는 경우 uploads 폴더 경로로 가정
                        return `http://localhost:5001/uploads/videos/${url}`
                      })()
                      
                      // 현재 시간에 해당하는 비디오 내 상대 시간 계산
                      let relativeTime = 0
                      let videoStartTime = 0
                      
                      for (const video of v2Videos) {
                        const videoDuration = video.duration || 5
                        const videoEndTime = videoStartTime + videoDuration
                        
                        if (currentTime >= videoStartTime && currentTime < videoEndTime) {
                          relativeTime = currentTime - videoStartTime
                          break
                        }
                        videoStartTime = videoEndTime
                      }
                      
                      // 로그 제거 - 불필요한 중복 로그
                      
                    return (
                        <VideoPlayer
                          key={`${currentVideo.id}`}
                          src={videoUrl}
                          poster={currentVideo.imageUrl}
                          isPlaying={isPlaying}
                          currentTime={relativeTime}
                          onTimeUpdate={(videoTime) => {
                            // 비디오 시간을 타임라인 시간으로 변환
                            const timelineTime = videoStartTime + videoTime
                            setCurrentTime(timelineTime)
                          }}
                        style={{
                          width: '100%',
                            height: '100%'
                          }}
                          onError={(error) => {
                            console.error('🎬 비디오 로딩 오류:', currentVideo.title, error)
                        }}
                      />
                    )
                  } else {
                      return renderV1CutImage()
                    }
                  })()
                ) : (
                  // V2 트랙이 비활성화이거나 비디오가 없는 경우 V1 컷 이미지 표시
                  renderV1CutImage()
                )}
                
                {/* 플레이어 컨트롤 오버레이 */}
                <Box sx={{
                  position: 'absolute',
                  bottom: 16,
                  left: 16,
                  right: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  bgcolor: 'rgba(0, 0, 0, 0.7)',
                  borderRadius: 1,
                  p: 1
                }}>
                  <Typography variant="caption" color="white">
                    {(() => {
                      if (showV2Track && v2Videos.length > 0) {
                        // V2 비디오 정보 표시 - 동일한 시간 계산 로직 사용
                        let accumulatedTime = 0
                        let currentVideo = null
                        
                        for (const video of v2Videos) {
                          const videoDuration = video.duration || 5
                          const videoEndTime = accumulatedTime + videoDuration
                          
                          if (currentTime >= accumulatedTime && currentTime < videoEndTime) {
                            currentVideo = video
                            break
                          }
                          accumulatedTime = videoEndTime
                        }
                        
                        // 현재 시간에 해당하는 V2 비디오가 있는 경우
                        if (currentVideo) {
                          return `${currentVideo.title} (${currentVideo.duration}s)`
                        } else {
                          // V2 비디오가 없으면 V1 컷 정보 표시
                          let cutAccumulatedTime = 0
                          let currentCut = null
                          
                          const sortedCuts = getSortedCuts()
                          
                          if (sortedCuts && sortedCuts.length > 0) {
                            for (const cut of sortedCuts) {
                              const cutDuration = cut.estimatedDuration || cut.duration || 5
                              const cutEndTime = cutAccumulatedTime + cutDuration
                              
                              if (currentTime >= cutAccumulatedTime && currentTime < cutEndTime) {
                                currentCut = cut
                                break
                              }
                              cutAccumulatedTime = cutEndTime
                            }
                            
                            if (!currentCut && sortedCuts.length > 0) {
                              currentCut = sortedCuts[sortedCuts.length - 1]
                            }
                          }
                          
                      return currentCut ? `컷 ${currentCut.shotNumber}: ${currentCut.title}` : '컷 없음'
                        }
                      } else {
                        // V1 컷 정보 표시 - 동일한 시간 계산 로직 사용
                        let accumulatedTime = 0
                        let currentCut = null
                        
                        const sortedCuts = getSortedCuts()
                        
                        if (sortedCuts && sortedCuts.length > 0) {
                          for (const cut of sortedCuts) {
                            const cutDuration = cut.estimatedDuration || cut.duration || 5
                            const cutEndTime = accumulatedTime + cutDuration
                            
                            if (currentTime >= accumulatedTime && currentTime < cutEndTime) {
                              currentCut = cut
                              break
                            }
                            accumulatedTime = cutEndTime
                          }
                          
                          if (!currentCut && sortedCuts.length > 0) {
                            currentCut = sortedCuts[sortedCuts.length - 1]
                          }
                        }
                        
                        return currentCut ? `컷 ${currentCut.shotNumber}: ${currentCut.title}` : '컷 없음'
                      }
                    })()}
                  </Typography>
                  {/* 재생 제어는 CutTimelineViewer에서만 처리 */}
                </Box>
              </Box>
            </Box>
          )}
        </Box>

        {/* 뷰 토글 버튼 */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
          <Button
            variant={showSceneList ? "contained" : "outlined"}
            startIcon={<List />}
            onClick={() => {
              setShowSceneList(true)
              setShowTimeline(false)
            }}
          >
            씬 리스트
          </Button>
          <Button
            variant={showTimeline ? "contained" : "outlined"}
            startIcon={<PlayArrow />}
            onClick={() => {
              setShowTimeline(true)
              setShowSceneList(false)
            }}
            disabled={!project?.conteList || project.conteList.length === 0}
          >
            컷 타임라인
          </Button>
        </Box>

        {/* 씬 리스트 섹션 */}
        {showSceneList && (
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
                생성된 콘티 리스트 ({project?.conteList?.length || 0}개)
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setShowTimeline(true)
                  setShowSceneList(false)
                }}
                disabled={!project?.conteList || project.conteList.length === 0}
              >
                컷 타임라인 보기
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleGenerateCutsForAllScenes}
                disabled={!project?.conteList || project.conteList.length === 0}
              >
                모든 씬에 컷 생성
              </Button>
            </Box>
          </Box>
          
            {project?.conteList && project.conteList.length > 0 ? (
              <Grid container spacing={2}>
                {project.conteList.map((scene, index) => (
                  <Grid item xs={12} md={6} lg={4} key={scene.id || index}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography variant="h6" component="h3">
                            씬 {scene.scene || index + 1}
                          </Typography>
                          <Chip 
                            label={scene.type || 'live_action'} 
                            size="small" 
                            color={scene.type === 'generated_video' ? 'primary' : 'default'}
                          />
                        </Box>
                        
                        <Typography variant="h6" gutterBottom>
                          {scene.title}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {scene.description?.substring(0, 100)}...
                        </Typography>
                        
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                          <Chip label={`${scene.estimatedDuration || '5분'}`} size="small" />
                          {scene.cuts && scene.cuts.length > 0 ? (
                            <Chip 
                              label={`${scene.cuts.length}개 컷`} 
                              size="small" 
                              color="success" 
                              variant="outlined"
                            />
                          ) : (
                            <Chip 
                              label="컷 생성 필요" 
                              size="small" 
                              color="warning" 
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </CardContent>
                      
                      <CardActions sx={{ justifyContent: 'space-between' }}>
                        <Box>
                          <Tooltip title="씬 편집">
                            <IconButton size="small" onClick={() => handleEditScene(scene)}>
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="씬 상세 보기">
                            <IconButton size="small" onClick={() => handleViewScene(scene)}>
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                        </Box>
                        
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleGenerateCutsForScene(scene)}
                            disabled={scene.cuts && scene.cuts.length > 0}
                            title={scene.cuts && scene.cuts.length > 0 ? '이미 컷이 생성되었습니다' : '이 씬에 컷 생성'}
                          >
                            컷 생성
                          </Button>
                          {scene.cuts && scene.cuts.length > 0 && (
                            <Chip 
                              label={`${scene.cuts.length}개 컷`} 
                              size="small" 
                              color="success" 
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  씬이 없습니다
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  AI를 사용하여 콘티를 생성해보세요.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<PlayArrow />}
                  onClick={handleGenerateConte}
                  sx={{ mt: 2 }}
                >
                  콘티 생성
                </Button>
              </Box>
            )}
          </Box>
        )}

        {/* 타임라인 섹션 */}
        {showTimeline && (
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
                컷 타임라인
            </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setShowSceneList(true)
                    setShowTimeline(false)
                  }}
                >
                  씬 리스트로
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleViewSchedule}
                >
                  스케줄러 보기
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<List />}
                  onClick={handleShowCutList}
                >
                  컷리스트
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Book />}
                  onClick={handleShowContinuityBook}
                >
                  콘티북
                </Button>
              </Box>
          </Box>
          
            {/* V1 타임라인 (컷 타임라인) */}
            {cuts && cuts.length > 0 ? (
              <CutTimelineViewer
                scenes={(() => {
                  // 타임라인 스토어의 cuts 데이터를 씬별로 그룹화
                  const scenesWithCuts = project?.conteList?.map(scene => {
                    // sceneId와 sceneNumber 모두로 매칭 시도
                    const sceneCuts = cuts.filter(cut => {
                      const sceneIdMatch = cut.sceneId === scene.id || cut.sceneId === scene._id
                      const sceneNumberMatch = cut.sceneNumber === scene.scene
                      const conteIdMatch = cut.sceneId === scene.conteId
                      
                      return sceneIdMatch || sceneNumberMatch || conteIdMatch
                    })
                    
                    return {
                      ...scene,
                      cuts: sceneCuts
                    }
                  }) || []
                  
                  // 디버깅 로그 추가
                  console.log('🔍 ProjectPage CutTimelineViewer scenes 데이터:', {
                    cutsLength: cuts.length,
                    projectConteListLength: project?.conteList?.length || 0,
                    scenesWithCutsLength: scenesWithCuts.length,
                    scenesWithCuts: scenesWithCuts.map(scene => ({
                      id: scene.id,
                      title: scene.title,
                      cutsLength: scene.cuts?.length || 0,
                      cuts: scene.cuts?.map(cut => ({
                        id: cut.id,
                        shotNumber: cut.shotNumber,
                        title: cut.title
                      }))
                    }))
                  })
                  
                  return scenesWithCuts
                })()}
            loading={timelineLoading || false}
                selectedCutId={selectedCutId || null}
                onCutClick={handleCutClick}
                onCutEdit={handleCutEdit}
                onCutInfo={handleCutInfo}
                onCutsReorder={handleCutsReorder}
                onGenerateConte={handleGenerateConte}
                onGenerateCuts={handleGenerateCutsForAllScenes}
                emptyMessage="컷이 없습니다. 씬 리스트에서 컷을 생성해보세요."
                timeScale={100}
            zoomLevel={1}
            showTimeInfo={true}
            baseScale={1}
            onViewSchedule={handleViewSchedule}
                onCutSelect={handleCutSelect}
                currentTime={currentTime}
                onTimeChange={setCurrentTime}
                isPlaying={isPlaying}
                onPlayStateChange={(playing) => {
                  // 강화된 디바운싱 - 현재 상태와 동일하면 완전히 무시
                  if (playing === isPlaying) {
                    return
                  }
                  
                  // 추가 안전장치 - 이전 상태 저장
                  const prevIsPlaying = isPlaying
                  
                  // 상태 변경
                  setIsPlaying(playing)
                  
                  // 재생 상태에 따라 인터벌 관리 - 더 안전한 조건 체크
                  if (playing && !prevIsPlaying) {
                    // 재생 시작 시에만 인터벌 설정
                    if (playbackIntervalRef.current) {
                      clearInterval(playbackIntervalRef.current)
                    }
                    playbackIntervalRef.current = setInterval(() => {
                      setCurrentTime(prevTime => {
                        const newTime = prevTime + 0.1 // 0.1초씩 증가
                        
                        // 재생 완료 시 자동 정지
                        const totalDuration = calculateTotalDuration()
                        if (newTime >= totalDuration) {
                          // 재생 완료 시 정지
                          if (playbackIntervalRef.current) {
                            clearInterval(playbackIntervalRef.current)
                            playbackIntervalRef.current = null
                          }
                          setIsPlaying(false)
                          return totalDuration
                        }
                        
                        return newTime
                      })
                    }, 200) // 200ms로 증가하여 비디오 재생과의 충돌 방지
                  } else if (!playing && prevIsPlaying) {
                    // 재생 정지 시에만 인터벌 정리
                    if (playbackIntervalRef.current) {
                      clearInterval(playbackIntervalRef.current)
                      playbackIntervalRef.current = null
                    }
                  }
                }}
                onV2StateChange={(v2State) => {
                  setShowV2Track(v2State.showV2Track)
                  setV2Videos(v2State.v2Videos)
                }}
              />
            ) : (
              <Box sx={{ 
                textAlign: 'center', 
                py: 8, 
                bgcolor: 'background.paper', 
                borderRadius: 2,
                border: '2px dashed rgba(212, 175, 55, 0.3)'
              }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  컷이 없습니다
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  씬 리스트에서 컷을 생성한 후 타임라인을 확인할 수 있습니다.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => {
                    setShowSceneList(true)
                    setShowTimeline(false)
                  }}
                >
                  씬 리스트로 이동
                </Button>
        </Box>
            )}


          </Box>
        )}


      </Container>


      {/* 씬 상세 모달 (타임라인용) */}
      <ConteEditModal
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

      {/* 컷 편집 모달 */}
      <CutEditModal
        open={editModalOpen && editingScene?.isCut}
        onClose={handleEditModalClose}
        cut={editingScene?.isCut ? editingScene : null}
        onSave={handleSaveScene}
        onRegenerateImage={handleRegenerateImage}
        projectId={projectId}
      />

      {/* 씬 편집 모달 */}
      <ConteEditModal
        open={editModalOpen && !editingScene?.isCut}
        onClose={handleEditModalClose}
        conte={!editingScene?.isCut ? editingScene : null}
        onSave={handleSaveScene}
        onRegenerateImage={handleRegenerateImage}
        onRegenerateConte={handleRegenerateScene}
        onEdit={handleSceneEdit}
        onRegenerate={handleSceneRegenerate}
      />

      {/* 컷리스트 모달 */}
      <Dialog
        open={showCutList}
        onClose={() => setShowCutList(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">컷리스트</Typography>
            <Button
              startIcon={<Print />}
              onClick={() => window.print()}
            >
              인쇄
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>씬</TableCell>
                  <TableCell>씬 제목</TableCell>
                  <TableCell>컷</TableCell>
                  <TableCell>설명</TableCell>
                  <TableCell>사이즈</TableCell>
                  <TableCell>앵글</TableCell>
                  <TableCell>무빙</TableCell>
                  <TableCell>렌즈</TableCell>
                  <TableCell>장비</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(() => {
                  const cutListData = generateCutListData()
                  const groupedData = []
                  let currentScene = null
                  
                  cutListData.forEach((cut, index) => {
                    // 새로운 씬이 시작되면 구분선 추가
                    if (currentScene !== cut.scene) {
                      if (currentScene !== null) {
                        // 이전 씬 구분선
                        groupedData.push({
                          type: 'separator',
                          scene: currentScene,
                          key: `separator-${currentScene}`
                        })
                      }
                      currentScene = cut.scene
                    }
                    
                    groupedData.push({
                      type: 'cut',
                      data: cut,
                      key: `cut-${index}`
                    })
                  })
                  
                  return groupedData.map((item) => {
                    if (item.type === 'separator') {
                      return (
                        <TableRow key={item.key} sx={{ backgroundColor: 'grey.100' }}>
                          <TableCell colSpan={9} sx={{ textAlign: 'center', fontWeight: 'bold' }}>
                            ─── 씬 {item.scene} ───
                          </TableCell>
                        </TableRow>
                      )
                    } else {
                      const cut = item.data
                      return (
                        <TableRow key={item.key}>
                    <TableCell>{cut.scene}</TableCell>
                          <TableCell>{cut.sceneTitle}</TableCell>
                    <TableCell>{cut.cut}</TableCell>
                    <TableCell>{cut.description}</TableCell>
                    <TableCell>{cut.shotSize}</TableCell>
                    <TableCell>{cut.angleDirection}</TableCell>
                    <TableCell>{cut.cameraMovement}</TableCell>
                    <TableCell>{cut.lensSpecs}</TableCell>
                    <TableCell>{cut.equipment}</TableCell>
                  </TableRow>
                      )
                    }
                  })
                })()}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCutList(false)}>닫기</Button>
        </DialogActions>
      </Dialog>

      {/* 콘티북 모달 */}
      <Dialog
        open={showContinuityBook}
        onClose={() => setShowContinuityBook(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">콘티북</Typography>
            <Button
              startIcon={<Print />}
              onClick={() => window.print()}
            >
              인쇄
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>씬</TableCell>
                  <TableCell>씬 제목</TableCell>
                  <TableCell>컷 번호</TableCell>
                  <TableCell>콘티 이미지</TableCell>
                  <TableCell>설명</TableCell>
                  <TableCell>샷 사이즈</TableCell>
                  <TableCell>앵글</TableCell>
                  <TableCell>카메라 움직임</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(() => {
                  const continuityBookData = generateContinuityBookData()
                  const groupedData = []
                  let currentScene = null
                  
                  continuityBookData.forEach((cut, index) => {
                    // 새로운 씬이 시작되면 구분선 추가
                    if (currentScene !== cut.scene) {
                      if (currentScene !== null) {
                        // 이전 씬 구분선
                        groupedData.push({
                          type: 'separator',
                          scene: currentScene,
                          key: `separator-${currentScene}`
                        })
                      }
                      currentScene = cut.scene
                    }
                    
                    groupedData.push({
                      type: 'cut',
                      data: cut,
                      key: `cut-${index}`
                    })
                  })
                  
                  return groupedData.map((item) => {
                    if (item.type === 'separator') {
                      return (
                        <TableRow key={item.key} sx={{ backgroundColor: 'grey.100' }}>
                          <TableCell colSpan={8} sx={{ textAlign: 'center', fontWeight: 'bold' }}>
                            ─── 씬 {item.scene} ───
                          </TableCell>
                        </TableRow>
                      )
                    } else {
                      const cut = item.data
                      return (
                        <TableRow key={item.key}>
                          <TableCell>{cut.scene}</TableCell>
                          <TableCell>{cut.sceneTitle}</TableCell>
                    <TableCell>{cut.cutNumber}</TableCell>
                    <TableCell>
                      {cut.imageUrl ? (
                        <img
                          src={cut.imageUrl.startsWith('/') ? `http://localhost:5001${cut.imageUrl}` : cut.imageUrl}
                          alt={`컷 ${cut.cutNumber}`}
                          style={{ width: 100, height: 60, objectFit: 'cover' }}
                        />
                      ) : (
                        <Box sx={{ width: 100, height: 60, bgcolor: 'grey.300', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Typography variant="caption">이미지 없음</Typography>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>{cut.description}</TableCell>
                    <TableCell>{cut.shotSize}</TableCell>
                    <TableCell>{cut.angleDirection}</TableCell>
                    <TableCell>{cut.cameraMovement}</TableCell>
                  </TableRow>
                      )
                    }
                  })
                })()}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowContinuityBook(false)}>닫기</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ProjectPage 