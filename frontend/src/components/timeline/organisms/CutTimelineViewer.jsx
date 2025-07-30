import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { Box, Typography, CircularProgress, Button, ToggleButton, ToggleButtonGroup, Switch, FormControlLabel, IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Alert, Snackbar, LinearProgress } from '@mui/material'
import { Schedule, PlayArrow, Pause, Stop, Movie, Videocam, Visibility, VisibilityOff, Add, VideoLibrary, AutoAwesome, Delete } from '@mui/icons-material'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import TimelineScroll from '../atoms/TimelineScroll'
import TimelineNavigation from '../molecules/TimelineNavigation'
import TimelineFilters from '../molecules/TimelineFilters'
import CutCard from '../atoms/CutCard'
import VideoCard from '../atoms/VideoCard'
import VideoUploader from '../atoms/VideoUploader'
import { generateVideoWithVeo2, checkVeo2ApiAvailability } from '../../../services/veo2Api'

import TimeRuler from '../atoms/TimeRuler'
import { SceneType } from '../../../types/scene'
import { 
  calculateTimeScale,
  calculateTotalDuration,
  calculateSceneStartTime,
  calculateSceneEndTime,
  formatTimeFromSeconds,
  formatTimeHumanReadable,
  calculateMinSceneWidth,
  timeToPixels,
  pixelsToTime
} from '../../../utils/timelineUtils'

/**
 * 컷 기반 타임라인 뷰어 컴포넌트
 * 씬(캡션카드) 안의 개별 컷들을 타임라인 형태로 표시
 * 컷 클릭 시 ConteEditModal 열림
 * 씬 경계에 하얀색 막대로 구분 표시
 * 
 * 프리미어 프로 스타일 트랙 타임라인:
 * - V1 트랙: 컷 이미지 타임라인 (스토리보드 형태)
 * - V2 트랙: 비디오 파일 타임라인 (실사 촬영 + AI 생성 비디오)
 * - 각 트랙은 독립적으로 표시/숨김 가능
 */
const CutTimelineViewer = (props) => {
  // props를 안전하게 구조분해
  const {
    scenes = [], // 씬 배열 (각 씬 안에 컷들이 포함됨)
    loading = false,
    selectedCutId = null,
    onCutClick, // 컷 클릭 핸들러
    onCutEdit, // 컷 편집 핸들러
    onCutInfo, // 컷 정보 핸들러
    onCutDelete, // 컷 삭제 핸들러 추가
    onCutsReorder, // 컷 순서 변경 핸들러
    onGenerateConte,
    onGenerateCuts, // 컷 생성 핸들러 추가
    onCutSelect, // 컷 선택 핸들러 (Playhead 이동 시)
    onCutDragToV2, // V1에서 V2로 컷 드래그 시 호출될 콜백
    onV2StateChange, // V2 상태 변경 콜백
    currentTime = 0, // 현재 시간
    onTimeChange, // 시간 변경 핸들러
    isPlaying = false, // 외부에서 제어하는 재생 상태
    onPlayStateChange, // 재생 상태 변경 콜백
    emptyMessage = "컷이 없습니다. AI를 사용하여 콘티를 생성해보세요.",
    timeScale = 1,
    zoomLevel = 1,
    showTimeInfo = true,
    baseScale = 1,
    onViewSchedule = null
  } = props || {}

  // 트랙 표시 상태 관리
  const [showV1Track, setShowV1Track] = useState(true)
  const [showV2Track, setShowV2Track] = useState(true)
  
  // V2 비디오 관련 상태
  const [v2Videos, setV2Videos] = useState([])
  const [showVideoUploadDialog, setShowVideoUploadDialog] = useState(false)
  const [showAIGenerationDialog, setShowAIGenerationDialog] = useState(false)
  const [aiGenerationProgress, setAiGenerationProgress] = useState(0)
  const [aiGenerationMessage, setAiGenerationMessage] = useState('')
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState('success')
  const [isDragOver, setIsDragOver] = useState(false)

  // 디버깅 로그
  console.log('🔍 CutTimelineViewer received props:', {
    scenesLength: scenes?.length || 0,
    loading,
    selectedCutId
  })
  console.log('🔍 CutTimelineViewer received scenes:', scenes)
  console.log('🎬 CutTimelineViewer 트랙 표시 상태:', { showV1Track, showV2Track })
  
  // 각 씬의 컷 데이터 확인
  scenes.forEach((scene, index) => {
    console.log(`🔍 Scene ${index}:`, {
      id: scene.id,
      title: scene.title,
      cuts: scene.cuts,
      cutsLength: scene.cuts?.length || 0
    })
  })
  
  // 컷만 평면화하여 타임라인에 표시 (씬별 캡션카드 제거)
  const allCuts = useMemo(() => {
    if (!scenes || !Array.isArray(scenes)) {
      console.log('❌ CutTimelineViewer scenes가 없거나 배열이 아님:', scenes)
      return []
    }
    
    const cuts = []
    let globalCutIndex = 0
    
    scenes.forEach((scene, sceneIndex) => {
      if (scene.cuts && Array.isArray(scene.cuts)) {
        scene.cuts.forEach((cut, cutIndex) => {
          cuts.push({
            ...cut,
            sceneId: scene.id,
            sceneIndex: sceneIndex,
            sceneTitle: scene.title,
            sceneNumber: scene.scene,
            globalIndex: globalCutIndex,
            isLastCutInScene: cutIndex === scene.cuts.length - 1
          })
          globalCutIndex++
        })
      }
      // 컷이 없는 씬은 타임라인에 표시하지 않음
    })
    
    console.log('🎬 CutTimelineViewer allCuts 생성 완료:', {
      totalCuts: cuts.length,
      cuts: cuts.map(cut => ({
        id: cut.id,
        shotNumber: cut.shotNumber,
        title: cut.title,
        sceneTitle: cut.sceneTitle
      }))
    })
    
    return cuts
  }, [scenes])
  
  const [hoveredCutId, setHoveredCutId] = useState(null)
  const [scrollPosition, setScrollPosition] = useState(0)
  const [currentCutIndex, setCurrentCutIndex] = useState(0)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [filters, setFilters] = useState({})
  const [selectedCuts, setSelectedCuts] = useState(new Set())
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
  const scrollRef = useRef(null)

  // 시간 기반 타임라인 관련 상태
  const [currentTimeScale, setCurrentTimeScale] = useState(timeScale)
  const [currentZoomLevel, setCurrentZoomLevel] = useState(zoomLevel)
  const [totalDuration, setTotalDuration] = useState(0)

  // 재생 관련 상태 추가
  const [playbackSpeed, setPlaybackSpeed] = useState(1) // 재생 속도 (1 = 실시간)
  const currentTimeRef = useRef(currentTime) // currentTime의 최신 값을 참조하기 위한 ref
  const playStateTimeoutRef = useRef(null)

  // currentTime 디버깅 및 ref 업데이트
  useEffect(() => {
    // console.log('🎬 CutTimelineViewer currentTime 변경:', currentTime)
    currentTimeRef.current = currentTime
  }, [currentTime])

  // 테스트용 currentTime 변경 함수
  const handleTestTimeChange = useCallback((newTime) => {
    // console.log('🎬 테스트 시간 변경:', currentTime, '→', newTime)
    if (onTimeChange && typeof onTimeChange === 'function') {
      onTimeChange(newTime)
    }
  }, [currentTime, onTimeChange])

  // 시간 기반 계산 로직
  const calculatedTimeScale = useMemo(() => {
    const scale = calculateTimeScale(currentZoomLevel, baseScale)
    // console.log(`CutTimelineViewer calculatedTimeScale: zoomLevel=${currentZoomLevel}, baseScale=${baseScale}, result=${scale}`)
    return Math.max(scale, 0.1)
  }, [currentZoomLevel, baseScale])

  const calculatedTotalDuration = useMemo(() => {
    // V1 컷의 총 지속 시간
    const v1TotalDuration = allCuts.reduce((total, cut) => total + (cut.estimatedDuration || 5), 0)
    
    // V2 비디오의 총 지속 시간
    const v2TotalDuration = v2Videos.reduce((total, video) => total + (video.duration || 5), 0)
    
    // V1과 V2 중 더 긴 지속 시간 사용
    const totalDuration = Math.max(v1TotalDuration, v2TotalDuration)
    
    // console.log(`�� CutTimelineViewer 총 지속 시간: V1=${v1TotalDuration}s, V2=${v2TotalDuration}s, 총=${totalDuration}s`)
    
    return totalDuration
  }, [allCuts, v2Videos])

  // 재생 제어 함수들 - 외부에서만 제어받도록 수정
  const startPlayback = useCallback(() => {
    // 로그 제거 - 불필요한 중복 로그
    // 외부에서만 재생 상태를 제어하므로 내부 로직 제거
    if (onPlayStateChange && !isPlaying) {
      onPlayStateChange(true)
    }
  }, [onPlayStateChange, isPlaying])

  const pausePlayback = useCallback(() => {
    // 로그 제거 - 불필요한 중복 로그
    // 외부에서만 재생 상태를 제어하므로 내부 로직 제거
    if (onPlayStateChange && isPlaying) {
      onPlayStateChange(false)
    }
  }, [onPlayStateChange, isPlaying])

  const stopPlayback = useCallback(() => {
    // 로그 제거 - 불필요한 중복 로그
    // 외부에서만 재생 상태를 제어하므로 내부 로직 제거
    if (onPlayStateChange && isPlaying) {
      onPlayStateChange(false)
    }
    if (onTimeChange && typeof onTimeChange === 'function') {
      onTimeChange(0)
    }
  }, [onTimeChange, onPlayStateChange, isPlaying])

  const togglePlayback = useCallback(() => {
    // 로그 제거 - 불필요한 중복 로그
    if (isPlaying) {
      pausePlayback()
    } else {
      startPlayback()
    }
  }, [isPlaying, startPlayback, pausePlayback])

  // 키보드 단축키로 playhead 조정
  const handleKeyDown = useCallback((event) => {
    const step = event.shiftKey ? 10 : 1 // Shift 키와 함께 누르면 10초씩, 아니면 1초씩
    
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault()
        if (onTimeChange && typeof onTimeChange === 'function') {
          onTimeChange(Math.max(0, currentTimeRef.current - step))
        }
        break
      case 'ArrowRight':
        event.preventDefault()
        if (onTimeChange && typeof onTimeChange === 'function') {
          onTimeChange(Math.min(calculatedTotalDuration, currentTimeRef.current + step))
        }
        break
      case 'Home':
        event.preventDefault()
        if (onTimeChange && typeof onTimeChange === 'function') {
          onTimeChange(0)
        }
        break
      case 'End':
        event.preventDefault()
        if (onTimeChange && typeof onTimeChange === 'function') {
          onTimeChange(calculatedTotalDuration)
        }
        break
      case ' ':
        event.preventDefault()
        togglePlayback()
        break
      case 'Escape':
        event.preventDefault()
        stopPlayback()
        break
    }
  }, [calculatedTotalDuration, togglePlayback, stopPlayback, onTimeChange])

  // 키보드 이벤트 리스너 추가
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  // 재생 상태 변경 시 인터벌 정리
  useEffect(() => {
    return () => {
      if (playStateTimeoutRef.current) {
        clearTimeout(playStateTimeoutRef.current)
      }
    }
  }, [])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (playStateTimeoutRef.current) {
        clearTimeout(playStateTimeoutRef.current)
      }
    }
  }, [])

  // 현재 시간이 변경될 때 스크롤 위치 업데이트
  useEffect(() => {
    // console.log(`🎬 currentTime 변경: ${currentTime}s, calculatedTimeScale: ${calculatedTimeScale}`)
    if (scrollRef.current) {
      const newScrollPosition = timeToPixels(currentTime, calculatedTimeScale)
      // console.log(`🎬 스크롤 위치 업데이트: ${scrollPosition}px → ${newScrollPosition}px`)
      scrollRef.current.scrollLeft = newScrollPosition
      setScrollPosition(newScrollPosition)
    }
  }, [currentTime, calculatedTimeScale])

  // playhead 중심 확대/축소를 위한 시간 스케일 계산
  const dynamicTimeScale = useMemo(() => {
    // 줌 레벨에 따른 동적 시간 스케일 계산
    const basePixelsPerSecond = 10 // 기본 1초당 10px
    const zoomedPixelsPerSecond = basePixelsPerSecond * currentZoomLevel
    const timeScale = 1 / zoomedPixelsPerSecond // 픽셀당 시간 (초)
    
    // console.log(`🎬 CutTimelineViewer dynamicTimeScale: zoomLevel=${currentZoomLevel}, pixelsPerSecond=${zoomedPixelsPerSecond}, timeScale=${timeScale}`)
    return timeScale
  }, [currentZoomLevel])

  // 타임라인 너비 계산 - TimeRuler와 동일한 방식 사용
  const timelineWidth = useMemo(() => {
    if (calculatedTotalDuration <= 0) return 0
    // TimeRuler와 동일한 pixelsPerSecond 계산 사용
    const pixelsPerSecond = 1 / dynamicTimeScale
    const totalWidth = calculatedTotalDuration * pixelsPerSecond
    const minWidth = Math.max(1000, totalWidth) // 최소 1000px 보장
    
    // console.log(`🎬 CutTimelineViewer timelineWidth: totalDuration=${calculatedTotalDuration}s, dynamicTimeScale=${dynamicTimeScale}, pixelsPerSecond=${pixelsPerSecond}, totalWidth=${totalWidth}px, finalWidth=${minWidth}px`)
    return minWidth
  }, [calculatedTotalDuration, dynamicTimeScale])

  // 카드 너비 계산을 위한 pixelsPerSecond 값
  const pixelsPerSecond = useMemo(() => {
    const pps = 1 / dynamicTimeScale
    // console.log(`🎬 CutTimelineViewer pixelsPerSecond: ${pps} (1/${dynamicTimeScale})`)
    return pps
  }, [dynamicTimeScale])

  // 각 카드의 너비 계산 - 모든 줌 레벨에서 순수 시간 기반 계산
  const cardWidths = useMemo(() => {
    const widths = []
    
    // V1 컷들의 너비 계산
    allCuts.forEach(cut => {
      const cutDuration = cut.estimatedDuration || cut.duration || 5
      const pixelsPerSecond = 1 / dynamicTimeScale
      const timeBasedWidth = cutDuration * pixelsPerSecond
      
      // console.log(`🎬 CutTimelineViewer V1 카드 너비 계산: 컷 ${cut.shotNumber}, duration=${cutDuration}s, pixelsPerSecond=${pixelsPerSecond}, width=${timeBasedWidth}px`)
      
      widths.push({
        cutId: cut.id,
        width: timeBasedWidth
      })
    })
    
    // V2 비디오들의 너비 계산
    v2Videos.forEach(video => {
      const videoDuration = video.duration || 5
      const pixelsPerSecond = 1 / dynamicTimeScale
      const timeBasedWidth = videoDuration * pixelsPerSecond
      
      // console.log(`🎬 CutTimelineViewer V2 카드 너비 계산: 비디오 ${video.id}, duration=${videoDuration}s, pixelsPerSecond=${pixelsPerSecond}, width=${timeBasedWidth}px`)
      
      widths.push({
        videoId: video.id,
        width: timeBasedWidth
      })
    })
    
    return widths
  }, [allCuts, v2Videos, dynamicTimeScale])

  // playhead 위치 계산 - 모든 줌 레벨에서 순수 시간 기반 계산
  const playheadPosition = useMemo(() => {
    const pixelsPerSecond = 1 / dynamicTimeScale
    return currentTime * pixelsPerSecond
  }, [currentTime, dynamicTimeScale])

  // playhead 중심 스크롤 위치 계산
  const playheadCenteredScrollPosition = useMemo(() => {
    const containerWidth = 800 // 예상 컨테이너 너비
    const playheadCenter = playheadPosition - (containerWidth / 2)
    return Math.max(0, playheadCenter)
  }, [playheadPosition])

  // 드래그 앤 드롭 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 트랙 표시 토글 핸들러
  const handleV1TrackToggle = useCallback(() => {
    setShowV1Track(!showV1Track)
  }, [showV1Track])

  const handleV2TrackToggle = useCallback(() => {
    setShowV2Track(!showV2Track)
    // V2 상태 변경 시 콜백 호출
    if (onV2StateChange && typeof onV2StateChange === 'function') {
      onV2StateChange({
        showV2Track: !showV2Track,
        v2Videos: v2Videos
      })
    }
  }, [showV2Track, v2Videos, onV2StateChange])

  // 컷 클릭 핸들러
  const handleCutClick = useCallback((cut) => {
    // console.log('🎬 컷 클릭:', cut)
    if (onCutClick) {
      onCutClick(cut)
    }
  }, [onCutClick])

  // 컷 편집 핸들러
  const handleCutEdit = useCallback((cut) => {
    // console.log('✏️ 컷 편집:', cut)
    if (onCutEdit) {
      onCutEdit(cut)
    }
  }, [onCutEdit])

  // 컷 정보 핸들러
  const handleCutInfo = useCallback((cut) => {
    // console.log('ℹ️ 컷 정보:', cut)
    if (onCutInfo) {
      onCutInfo(cut)
    }
  }, [onCutInfo])

  /**
   * V2 비디오 업로드 핸들러
   */
  const handleVideoUpload = useCallback(async (file, onProgress) => {
    try {
      // console.log('🎬 V2 비디오 업로드 시작:', file.name)
      
      // 파일 유효성 검사
      const validTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv']
      if (!validTypes.includes(file.type)) {
        throw new Error('지원하지 않는 비디오 형식입니다. MP4, AVI, MOV, WMV 형식을 사용해주세요.')
      }
      
      if (file.size > 100 * 1024 * 1024) { // 100MB 제한
        throw new Error('파일 크기가 100MB를 초과합니다.')
      }

      // 비디오 메타데이터 추출
      const video = document.createElement('video')
      video.preload = 'metadata'
      
      const videoUrl = URL.createObjectURL(file)
      video.src = videoUrl
      
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
          const duration = Math.round(video.duration)
          const newVideo = {
            id: `upload_${Date.now()}`,
            title: file.name.replace(/\.[^/.]+$/, ''),
            description: `업로드된 비디오 (${duration}초)`,
            duration: duration,
            videoUrl: videoUrl, // blob URL
            fileSize: file.size,
            type: 'uploaded',
            createdAt: new Date().toISOString()
          }
          
          setV2Videos(prev => {
            const updatedVideos = [...prev, newVideo]
            // V2 상태 변경 시 콜백 호출
            if (onV2StateChange && typeof onV2StateChange === 'function') {
              onV2StateChange({
                showV2Track: showV2Track,
                v2Videos: updatedVideos
              })
            }
            return updatedVideos
          })
          // console.log('✅ V2 비디오 업로드 완료:', newVideo)
          resolve()
        }
        video.onerror = () => reject(new Error('비디오 메타데이터를 읽을 수 없습니다.'))
        video.load()
      })

      setShowVideoUploadDialog(false)
      setSnackbarMessage('비디오가 성공적으로 업로드되었습니다.')
      setSnackbarSeverity('success')
      
    } catch (error) {
      // console.error('❌ V2 비디오 업로드 실패:', error)
      setSnackbarMessage(error.message)
      setSnackbarSeverity('error')
    }
  }, [showV2Track, onV2StateChange])

  /**
   * V2 비디오 삭제 핸들러
   */
  const handleVideoDelete = useCallback((videoId) => {
    setV2Videos(prev => {
      const updatedVideos = prev.filter(video => video.id !== videoId)
      // V2 상태 변경 시 콜백 호출
      if (onV2StateChange && typeof onV2StateChange === 'function') {
        onV2StateChange({
          showV2Track: showV2Track,
          v2Videos: updatedVideos
        })
      }
      return updatedVideos
    })
    setSnackbarMessage('비디오가 삭제되었습니다.')
    setSnackbarSeverity('success')
  }, [showV2Track, onV2StateChange])

  /**
   * AI 비디오 생성 핸들러
   */
  const handleAIGeneration = useCallback(async (cut) => {
    try {
      setIsGeneratingAI(true)
      setAiGenerationProgress(0)
      setAiGenerationMessage('AI 비디오 생성을 시작합니다...')
      setShowAIGenerationDialog(true)

      const onProgress = (progressData) => {
        setAiGenerationProgress(progressData.progress || 0)
        setAiGenerationMessage(progressData.message || 'AI 비디오를 생성하고 있습니다...')
      }

      const result = await generateVideoWithVeo2(cut, onProgress)
      
      const newVideo = {
        id: `ai_${Date.now()}`,
        title: cut.title || 'AI 생성 비디오',
        description: cut.description || 'AI가 생성한 비디오',
        duration: result.duration || 8,
        videoUrl: result.videoUrl,
        type: 'ai_generated',
        createdAt: new Date().toISOString(),
        cutId: cut.id
      }
      
      setV2Videos(prev => {
        const updatedVideos = [...prev, newVideo]
        // V2 상태 변경 시 콜백 호출
        if (onV2StateChange && typeof onV2StateChange === 'function') {
          onV2StateChange({
            showV2Track: showV2Track,
            v2Videos: updatedVideos
          })
        }
        return updatedVideos
      })
      setShowAIGenerationDialog(false)
      setSnackbarMessage('AI 비디오가 성공적으로 생성되었습니다.')
      setSnackbarSeverity('success')
      
    } catch (error) {
      // console.error('❌ AI 비디오 생성 실패:', error)
      setAiGenerationMessage(`오류: ${error.message}`)
      setSnackbarMessage('AI 비디오 생성에 실패했습니다.')
      setSnackbarSeverity('error')
    } finally {
      setIsGeneratingAI(false)
    }
  }, [showV2Track, onV2StateChange])

  /**
   * V1에서 V2로 컷 드래그 핸들러
   */
  const handleCutDropToV2 = useCallback((cut) => {
    // console.log('🎬 V1에서 V2로 컷 드롭됨:', cut)
    handleAIGeneration(cut)
  }, [handleAIGeneration])

  // 드래그 앤 드롭 핸들러
  const handleDragEnd = useCallback((event) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = allCuts.findIndex(cut => cut.id === active.id)
      const newIndex = allCuts.findIndex(cut => cut.id === over?.id)

      if (onCutsReorder) {
        onCutsReorder(oldIndex, newIndex)
      }
    }
  }, [allCuts, onCutsReorder])

  /**
   * V2로 컷 드래그 시작 핸들러
   */
  const handleCutDragStart = useCallback((event, cut) => {
    // V2로 드래그할 수 있도록 데이터 설정
    event.dataTransfer.setData('application/json', JSON.stringify({
      type: 'cut-from-v1',
      cut: cut,
      source: 'timeline-v1'
    }))
    
    // 드래그 이미지 설정
    if (event.target) {
      event.dataTransfer.setDragImage(event.target, 0, 0)
    }
    
    // console.log('🎬 V1에서 컷 드래그 시작:', cut)
  }, [])

  /**
   * V2로 컷 드래그 종료 핸들러
   */
  const handleCutDragEnd = useCallback((event) => {
    // V2로 드래그되었는지 확인
    const data = event.dataTransfer.getData('application/json')
    if (data) {
      try {
        const dragData = JSON.parse(data)
        if (dragData.type === 'cut-from-v1' && dragData.source === 'timeline-v1') {
          // console.log('🎬 V1에서 V2로 컷 드래그 완료:', dragData.cut)
          
          // V2로 전달할 콜백이 있다면 호출
          if (onCutDragToV2) {
            onCutDragToV2(dragData.cut)
          }
        }
      } catch (error) {
        // console.error('드래그 데이터 파싱 오류:', error)
      }
    }
  }, [onCutDragToV2])

  // 스크롤 핸들러
  const handleScroll = useCallback((scrollLeft) => {
    setScrollPosition(scrollLeft)
  }, [])

  // 시간 클릭 핸들러 - playhead 이동
  const handleTimeClick = useCallback((time) => {
    // console.log('🎬 시간 클릭:', time)
    if (onTimeChange && typeof onTimeChange === 'function') {
      onTimeChange(time)
    }
    
    // 해당 시간으로 스크롤 이동 (playhead 중심)
    if (scrollRef.current) {
      const pixelsPerSecond = 1 / dynamicTimeScale
      const targetPosition = time * pixelsPerSecond
      const containerWidth = scrollRef.current.clientWidth || 800
      const playheadCenter = targetPosition - (containerWidth / 2)
      const scrollPosition = Math.max(0, playheadCenter)
      
      scrollRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      })
      
      // console.log('🎬 playhead 중심 스크롤:', {
      //   time,
      //   targetPosition,
      //   scrollPosition
      // })
    }
  }, [dynamicTimeScale, onTimeChange])

  // 줌 레벨 변경 핸들러 - playhead 중심 확대/축소
  const handleZoomChange = useCallback((newZoomLevel) => {
    // console.log('🎬 줌 레벨 변경:', currentZoomLevel, '→', newZoomLevel)
    
    // 현재 playhead 위치 저장
    const currentPlayheadPosition = playheadPosition
    
    // 줌 레벨 업데이트 (이것이 dynamicTimeScale과 cardWidths를 자동으로 재계산함)
    setCurrentZoomLevel(newZoomLevel)
    
    // 새로운 playhead 위치 계산
    const newPixelsPerSecond = 1 / dynamicTimeScale
    const newPlayheadPosition = currentTime * newPixelsPerSecond
    
    // playhead 중심으로 스크롤 위치 조정
    setTimeout(() => {
      if (scrollRef.current) {
        const containerWidth = scrollRef.current.clientWidth || 800
        const playheadCenter = newPlayheadPosition - (containerWidth / 2)
        const targetScrollPosition = Math.max(0, playheadCenter)
        
        scrollRef.current.scrollTo({
          left: targetScrollPosition,
          behavior: 'smooth'
        })
        
        // console.log('🎬 playhead 중심 스크롤:', {
        //   currentTime,
        //   newPlayheadPosition,
        //   targetScrollPosition
        // })
      }
    }, 100)
  }, [currentZoomLevel, currentTime, playheadPosition, dynamicTimeScale])

  // 필터 변경 핸들러
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters)
  }, [])

  // 스크롤 버튼 상태 업데이트
  useEffect(() => {
    const updateScrollButtons = () => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
        setCanScrollLeft(scrollLeft > 0)
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
      }
    }

    updateScrollButtons()
    window.addEventListener('resize', updateScrollButtons)
    return () => window.removeEventListener('resize', updateScrollButtons)
  }, [allCuts])

  // 키보드 이벤트 리스너 추가
  useEffect(() => {
    const handleGlobalKeyDown = (event) => {
      // 타임라인 영역이 포커스되어 있거나 전체 페이지에서 키보드 단축키 허용
      handleKeyDown(event)
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [handleKeyDown])

  // currentTime 변경 시 해당하는 컷 선택
  useEffect(() => {
    if (onCutSelect && allCuts.length > 0) {
      // 현재 시간에 해당하는 컷 찾기
      let currentCut = null
      let accumulatedTime = 0
      
      for (const cut of allCuts) {
        const cutDuration = cut.estimatedDuration || cut.duration || 5
        if (currentTime >= accumulatedTime && currentTime < accumulatedTime + cutDuration) {
          currentCut = cut
          break
        }
        accumulatedTime += cutDuration
      }
      
      // 마지막 컷인 경우
      if (!currentCut && currentTime >= accumulatedTime) {
        currentCut = allCuts[allCuts.length - 1]
      }
      
      if (currentCut && currentCut.id !== selectedCutId) {
        // console.log('🎬 Playhead 위치에 따른 컷 선택:', currentCut.id, '시간:', currentTime)
        onCutSelect(currentCut.id)
      }
    }
  }, [currentTime, allCuts, onCutSelect, selectedCutId])

  // 로딩 상태 표시
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: 400,
        p: 4
      }}>
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography variant="h6" sx={{ color: 'var(--color-text-secondary)' }}>
          타임라인 로딩 중...
        </Typography>
      </Box>
    )
  }

  // 빈 상태 표시
  if (!allCuts || allCuts.length === 0) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: 400,
        p: 4,
        textAlign: 'center'
      }}>
        <Schedule sx={{ fontSize: 80, color: 'var(--color-text-secondary)', mb: 2 }} />
        <Typography variant="h6" sx={{ color: 'var(--color-text-primary)', mb: 1 }}>
          컷이 없습니다
        </Typography>
        <Typography variant="body1" sx={{ color: 'var(--color-text-secondary)', mb: 3 }}>
          {emptyMessage}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {onGenerateConte && (
            <Button
              variant="contained"
              startIcon={<PlayArrow />}
              onClick={onGenerateConte}
              sx={{
                backgroundColor: 'var(--color-accent)',
                color: 'var(--color-text-primary)',
                '&:hover': {
                  backgroundColor: 'var(--color-primary)'
                }
              }}
            >
              AI로 콘티 생성하기
            </Button>
          )}
          
          {onGenerateCuts && scenes && scenes.length > 0 && (
            <Button
              variant="outlined"
              startIcon={<PlayArrow />}
              onClick={onGenerateCuts}
              sx={{
                borderColor: 'var(--color-accent)',
                color: 'var(--color-accent)',
                '&:hover': {
                  borderColor: 'var(--color-primary)',
                  backgroundColor: 'rgba(212, 175, 55, 0.1)'
                }
              }}
            >
              컷 생성하기
            </Button>
          )}
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ 
      width: '100%', 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--color-bg)'
    }}>
      {/* 타임라인 헤더 */}
      <Box sx={{ 
        p: 1.5, 
        borderBottom: '1px solid var(--color-scene-card-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="subtitle1" sx={{ color: 'var(--color-text-primary)', fontWeight: 'bold' }}>
            타임라인
          </Typography>
          
          {/* 트랙 표시 토글 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={showV2Track}
                  onChange={handleV2TrackToggle}
                  size="small"
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: 'var(--color-accent)',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: 'var(--color-accent)',
                    },
                  }}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Videocam sx={{ fontSize: 14 }} />
                  <Typography variant="caption">V2</Typography>
                </Box>
              }
              sx={{ mr: 0.5 }}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={showV1Track}
                  onChange={handleV1TrackToggle}
                  size="small"
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: 'var(--color-accent)',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: 'var(--color-accent)',
                    },
                  }}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Movie sx={{ fontSize: 14 }} />
                  <Typography variant="caption">V1</Typography>
                </Box>
              }
            />
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {/* 재생 컨트롤 버튼들 */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <IconButton
              onClick={() => {
                togglePlayback()
              }}
              sx={{
                color: isPlaying ? 'var(--color-accent)' : 'var(--color-primary)',
                '&:hover': {
                  backgroundColor: 'rgba(212, 175, 55, 0.1)'
                }
              }}
              title={isPlaying ? '일시정지 (스페이스바)' : '재생 (스페이스바)'}
            >
              {isPlaying ? <Pause /> : <PlayArrow />}
            </IconButton>
            
            <IconButton
              onClick={() => {
                // console.log('🎬 정지 버튼 클릭됨')
                stopPlayback()
              }}
              sx={{
                color: 'var(--color-text-secondary)',
                '&:hover': {
                  backgroundColor: 'rgba(160, 163, 177, 0.1)'
                }
              }}
              title="정지 (ESC)"
            >
              <Stop />
            </IconButton>
          </Box>

          {/* 현재 시간 표시 */}
          <Typography
            variant="body2"
            sx={{
              font: 'var(--font-body-2)',
              color: 'var(--color-text-secondary)',
              minWidth: '80px',
              textAlign: 'center'
            }}
          >
            현재: {formatTimeFromSeconds(currentTime)}
            {isPlaying && ' (재생 중)'}
          </Typography>

          <TimelineFilters
            filters={filters}
            onFilterChange={handleFilterChange}
          />
          <TimelineNavigation
            canScrollLeft={canScrollLeft}
            canScrollRight={canScrollRight}
            onScrollLeft={() => scrollRef.current?.scrollBy({ left: -300, behavior: 'smooth' })}
            onScrollRight={() => scrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' })}
            zoomLevel={currentZoomLevel}
            onZoomChange={handleZoomChange}
          />
          {/* 테스트용 시간 변경 버튼 */}
          <Button
            size="small"
            variant="outlined"
            onClick={() => handleTestTimeChange(currentTime + 5)}
            sx={{ minWidth: 'auto', px: 1 }}
          >
            +5s
          </Button>
          {/* 키보드 단축키 안내 */}
          <Typography variant="caption" sx={{ color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center' }}>
            ←→: 이동 | Home/End: 처음/끝 | Shift+←→: 10초씩 | Space: 재생/일시정지
          </Typography>
        </Box>
      </Box>

      {/* 통합 스크롤 컨테이너 */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <TimelineScroll
          ref={scrollRef}
          onScroll={handleScroll}
          data-scroll-container="true"
          sx={{
            height: '100%',
            overflowX: 'auto',
            overflowY: 'hidden'
          }}
        >
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            minWidth: timelineWidth,
            position: 'relative'
          }}>
            {/* 시간 눈금자 */}
            {showTimeInfo && (
              <Box sx={{
                position: 'sticky',
                top: 0,
                zIndex: 10,
                height: '48px',
                borderBottom: '1px solid var(--color-scene-card-border)',
                backgroundColor: 'var(--color-bg)'
              }}>
                <TimeRuler
                  totalDuration={calculatedTotalDuration}
                  currentTime={currentTime}
                  timeScale={dynamicTimeScale}
                  zoomLevel={currentZoomLevel}
                  width={timelineWidth}
                  onTimeClick={handleTimeClick}
                  sx={{
                    width: timelineWidth > 0 ? timelineWidth : 'fit-content'
                  }}
                />
              </Box>
            )}

            {/* V2 트랙 (비디오 파일) - 위쪽 */}
            {showV2Track && (
              <Box sx={{
                borderBottom: '1px solid var(--color-scene-card-border)',
                backgroundColor: 'rgba(52, 152, 219, 0.05)',
                minHeight: 120
              }}>
                {/* V2 트랙 헤더 */}
                <Box sx={{
                  p: 1,
                  borderBottom: '1px solid var(--color-scene-card-border)',
                  backgroundColor: 'rgba(52, 152, 219, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <Videocam sx={{ fontSize: 14, color: 'var(--color-primary)' }} />
                  <Typography variant="caption" sx={{ color: 'var(--color-text-primary)', fontWeight: 'bold' }}>
                    V2 - 비디오
                  </Typography>
                </Box>
                
                {/* V2 트랙 컨텐츠 */}
                <Box sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  minHeight: 80
                }}>
                  {/* 비디오 목록 표시 - VideoCard 사용 */}
                  {v2Videos.length > 0 && (
                    <Box 
                      sx={{
                        display: 'flex',
                        gap: 0, // 연속 배치를 위해 여백 제거
                        minHeight: 80,
                        flexWrap: 'nowrap', // 가로 스크롤을 위해 줄바꿈 방지
                        overflowX: 'auto', // 가로 스크롤 허용
                        position: 'relative',
                        border: '2px dashed transparent',
                        borderRadius: 2,
                        transition: 'all 0.2s ease',
                        '&.drag-over': {
                          borderColor: 'var(--color-primary)',
                          backgroundColor: 'rgba(52, 152, 219, 0.1)',
                          transform: 'scale(1.01)'
                        }
                      }}
                      onDragOver={(event) => {
                        event.preventDefault()
                        event.currentTarget.classList.add('drag-over')
                      }}
                      onDragLeave={(event) => {
                        event.currentTarget.classList.remove('drag-over')
                      }}
                      onDrop={(event) => {
                        event.preventDefault()
                        event.currentTarget.classList.remove('drag-over')
                        
                        // 파일 드롭 처리
                        const files = event.dataTransfer.files
                        if (files.length > 0) {
                          const file = files[0]
                          if (file.type.startsWith('video/')) {
                            handleVideoUpload(file)
                            setSnackbarMessage(`${file.name} 파일이 V2 트랙에 추가되었습니다!`)
                            setSnackbarSeverity('success')
                          } else {
                            // console.error('비디오 파일이 아닙니다:', file.type)
                            setSnackbarMessage('비디오 파일만 업로드할 수 있습니다.')
                            setSnackbarSeverity('error')
                          }
                        }
                        
                        // V1 컷 드롭 처리
                        const data = event.dataTransfer.getData('application/json')
                        if (data) {
                          try {
                            const dragData = JSON.parse(data)
                            if (dragData.type === 'cut-from-v1' && dragData.source === 'timeline-v1') {
                              handleCutDropToV2(dragData.cut)
                              setSnackbarMessage('V1 컷이 V2 트랙으로 이동되었습니다!')
                              setSnackbarSeverity('success')
                            }
                          } catch (error) {
                            // console.error('드롭 데이터 파싱 오류:', error)
                          }
                        }
                      }}
                    >
                      {v2Videos.map((video, index) => {
                        // VideoCard용 데이터 구조로 변환
                        const videoCardData = {
                          id: video.id,
                          shotNumber: index + 1,
                          title: video.title,
                          description: video.description,
                          videoUrl: video.videoUrl,
                          duration: video.duration,
                          estimatedDuration: video.duration, // VideoCard의 너비 계산에 사용
                          type: video.type === 'ai_generated' ? 'ai-generated' : 'real',
                          createdAt: video.createdAt,
                          fileSize: video.fileSize
                        }

                        // 계산된 너비 찾기
                        const calculatedWidth = cardWidths.find(cw => cw.videoId === video.id)?.width || 200

                        return (
                          <VideoCard
                            key={video.id}
                            video={videoCardData}
                            onClick={() => console.log('V2 비디오 클릭:', video)}
                            onEdit={() => console.log('V2 비디오 편집:', video)}
                            onDelete={() => handleVideoDelete(video.id)}
                            selected={false}
                            loading={false}
                            isDraggable={false}
                          timeScale={dynamicTimeScale}
                          zoomLevel={currentZoomLevel}
                          showTimeInfo={showTimeInfo}
                            width={calculatedWidth} // 계산된 너비 전달
                          currentTime={currentTime}
                            allCuts={v2Videos} // V2 비디오들을 allCuts로 전달
                            showV1Track={false}
                            showV2Track={true}
                          />
                        )
                      })}
                    </Box>
                  )}

                  {/* 드래그 앤 드롭 영역 - 비디오 파일 업로드용 */}
                  <Box
                    sx={{
                      width: '100%',
                      minHeight: 60,
                      border: '2px dashed var(--color-accent)',
                      borderRadius: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(212, 175, 55, 0.02)',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      position: 'relative',
                      '&:hover': {
                        borderColor: 'var(--color-primary)',
                        backgroundColor: 'rgba(212, 175, 55, 0.05)'
                      }
                    }}
                                          onDragOver={(event) => {
                        event.preventDefault()
                        setIsDragOver(true)
                        event.currentTarget.style.borderColor = 'var(--color-primary)'
                        event.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.1)'
                        event.currentTarget.style.transform = 'scale(1.02)'
                      }}
                      onDragLeave={(event) => {
                        setIsDragOver(false)
                        event.currentTarget.style.borderColor = 'var(--color-accent)'
                        event.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.02)'
                        event.currentTarget.style.transform = 'scale(1)'
                      }}
                    onDrop={(event) => {
                      event.preventDefault()
                      event.currentTarget.style.borderColor = 'var(--color-accent)'
                      event.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.02)'
                      event.currentTarget.style.transform = 'scale(1)'
                      setIsDragOver(false)
                      
                      // 파일 드롭 처리
                      const files = event.dataTransfer.files
                      if (files.length > 0) {
                        const file = files[0]
                        if (file.type.startsWith('video/')) {
                          handleVideoUpload(file)
                          setSnackbarMessage(`${file.name} 파일이 V2 트랙에 추가되었습니다!`)
                          setSnackbarSeverity('success')
                        } else {
                          // console.error('비디오 파일이 아닙니다:', file.type)
                          setSnackbarMessage('비디오 파일만 업로드할 수 있습니다.')
                          setSnackbarSeverity('error')
                        }
                      }
                      
                      // V1 컷 드롭 처리
                      const data = event.dataTransfer.getData('application/json')
                      if (data) {
                        try {
                          const dragData = JSON.parse(data)
                          if (dragData.type === 'cut-from-v1' && dragData.source === 'timeline-v1') {
                            handleCutDropToV2(dragData.cut)
                            setSnackbarMessage('V1 컷이 V2 트랙으로 이동되었습니다!')
                            setSnackbarSeverity('success')
                          }
                        } catch (error) {
                          // console.error('드롭 데이터 파싱 오류:', error)
                        }
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <VideoLibrary sx={{
                        fontSize: 20,
                        color: 'var(--color-accent)'
                      }} />
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'var(--color-text-primary)',
                          fontWeight: 'bold'
                        }}
                      >
                        비디오 파일 드래그 앤 드롭
                      </Typography>
                    </Box>

                    <Typography
                      variant="caption"
                      sx={{
                        mb: 1,
                        color: 'var(--color-text-secondary)',
                        textAlign: 'center',
                        fontSize: '0.7rem'
                      }}
                    >
                      컴퓨터에서 비디오 파일을 여기에 놓으세요
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<Add />}
                        onClick={() => setShowVideoUploadDialog(true)}
                        sx={{
                          backgroundColor: 'var(--color-accent)',
                          color: 'var(--color-text-primary)',
                          fontSize: '0.7rem',
                          py: 0.5,
                          px: 1,
                          '&:hover': {
                            backgroundColor: 'var(--color-primary)'
                          }
                        }}
                      >
                        파일 선택
                      </Button>

                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AutoAwesome />}
                        onClick={() => setShowAIGenerationDialog(true)}
                        sx={{
                          borderColor: 'var(--color-accent)',
                          color: 'var(--color-accent)',
                          fontSize: '0.7rem',
                          py: 0.5,
                          px: 1,
                          '&:hover': {
                            borderColor: 'var(--color-primary)',
                            backgroundColor: 'rgba(52, 152, 219, 0.1)'
                          }
                        }}
                      >
                        AI 생성
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </Box>
            )}

            {/* V1 트랙 (컷 이미지) - 아래쪽 */}
            {showV1Track && (
              <Box sx={{
                backgroundColor: 'rgba(212, 175, 55, 0.05)',
                minHeight: 120
              }}>
                {/* V1 트랙 헤더 */}
                <Box sx={{
                  p: 1,
                  borderBottom: '1px solid var(--color-scene-card-border)',
                  backgroundColor: 'rgba(212, 175, 55, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <Movie sx={{ fontSize: 14, color: 'var(--color-accent)' }} />
                  <Typography variant="caption" sx={{ color: 'var(--color-text-primary)', fontWeight: 'bold' }}>
                    V1 - 컷
                  </Typography>
                </Box>
                
                {/* V1 트랙 컨텐츠 */}
                <Box sx={{
                  p: 2,
                  display: 'flex',
                  gap: 0, // 여백 제거
                  minHeight: 80
                }}>
                  {allCuts.map((cut, index) => {
                    const cardWidth = cardWidths.find(cw => cw.cutId === cut.id)?.width || 200
                    return (
                      <Box key={`v1-${cut.id || cut.cutId || index}`} sx={{ 
                        position: 'relative',
                        display: 'inline-block' // 연속 배치를 위해 인라인 블록으로 설정
                      }}>
                        <CutCard
                          cut={cut}
                          onClick={() => handleCutClick(cut)}
                          onEdit={() => handleCutEdit(cut)}
                          onInfo={() => handleCutInfo(cut)}
                          onDelete={onCutDelete} // 삭제 핸들러 추가
                          selected={selectedCutId === cut.id}
                          isMultiSelected={selectedCuts.has(cut.id)}
                          loading={loading}
                          isDraggable={true}
                          onMouseEnter={() => setHoveredCutId(cut.id)}
                          onMouseLeave={() => setHoveredCutId(null)}
                          timeScale={dynamicTimeScale}
                          zoomLevel={currentZoomLevel}
                          showTimeInfo={showTimeInfo}
                          width={cardWidth} // 계산된 너비 전달
                        />
                        
                        {/* 씬 경계 표시 (마지막 컷 뒤에 하얀색 막대) */}
                        {cut.isLastCutInScene && (
                          <Box sx={{
                            position: 'absolute',
                            right: -8,
                            top: 0,
                            bottom: 0,
                            width: 4,
                            backgroundColor: 'white',
                            borderRadius: '2px',
                            zIndex: 10,
                            boxShadow: '0 0 8px rgba(255, 255, 255, 0.5)'
                          }} />
                        )}
                      </Box>
                    )
                  })}
                </Box>
              </Box>
            )}
          </Box>
        </TimelineScroll>
      </Box>

      {/* 타임라인 푸터 */}
      <Box sx={{ 
        p: 1.5, 
        borderTop: '1px solid var(--color-scene-card-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'var(--color-bg)'
      }}>
        <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)' }}>
          {allCuts.length}개 컷 + {v2Videos.length}개 비디오 • {formatTimeHumanReadable(calculatedTotalDuration)}
          {showV1Track && showV2Track ? ' • V1+V2' : 
           showV1Track ? ' • V1' : 
           showV2Track ? ' • V2' : ' • 없음'}
        </Typography>
        
        {onViewSchedule && (
          <Button
            variant="outlined"
            startIcon={<Schedule />}
            onClick={onViewSchedule}
            size="small"
            sx={{
              borderColor: 'var(--color-accent)',
              color: 'var(--color-accent)',
              '&:hover': {
                borderColor: 'var(--color-primary)',
                backgroundColor: 'rgba(212, 175, 55, 0.1)'
              }
            }}
          >
            스케줄
          </Button>
        )}
      </Box>

      {/* 비디오 업로드 다이얼로그 */}
      <Dialog
        open={showVideoUploadDialog}
        onClose={() => setShowVideoUploadDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>비디오 업로드</DialogTitle>
        <DialogContent>
          <VideoUploader
            onVideoUpload={handleVideoUpload}
            accept="video/*"
            maxSize={100 * 1024 * 1024} // 100MB
            supportedFormats={['mp4', 'avi', 'mov', 'wmv']}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowVideoUploadDialog(false)}>
            취소
          </Button>
        </DialogActions>
      </Dialog>

      {/* AI 생성 진행 다이얼로그 */}
      <Dialog
        open={showAIGenerationDialog}
        onClose={() => {}}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>AI 비디오 생성</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {aiGenerationMessage}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={aiGenerationProgress} 
              sx={{ mb: 1 }}
            />
            <Typography variant="caption" sx={{ color: 'var(--color-text-secondary)' }}>
              {aiGenerationProgress}% 완료
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setIsGeneratingAI(false)
              setShowAIGenerationDialog(false)
            }}
            disabled={isGeneratingAI}
          >
            취소
          </Button>
        </DialogActions>
      </Dialog>

      {/* 스낵바 */}
      <Snackbar
        open={!!snackbarMessage}
        autoHideDuration={6000}
        onClose={() => setSnackbarMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbarMessage('')} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default CutTimelineViewer 