import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { Box, Typography, CircularProgress, Button, ToggleButton, ToggleButtonGroup, Switch, FormControlLabel } from '@mui/material'
import { Schedule, PlayArrow, Movie, Videocam, Visibility, VisibilityOff } from '@mui/icons-material'
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
import TimeRuler from '../atoms/TimeRuler'
import { SceneType } from '../../../types/conte'
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
    onCutsReorder, // 컷 순서 변경 핸들러
    onGenerateConte,
    onGenerateCuts, // 컷 생성 핸들러 추가
    onCutSelect, // 컷 선택 핸들러 (Playhead 이동 시)
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

  // 디버깅 로그
  console.log('🔍 CutTimelineViewer received props:', props)
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
    console.log('🔍 CutTimelineViewer allCuts 계산 시작')
    console.log('  - scenes 타입:', typeof scenes)
    console.log('  - scenes가 배열인가:', Array.isArray(scenes))
    console.log('  - scenes 길이:', scenes?.length || 0)
    
    if (!scenes || !Array.isArray(scenes)) {
      console.log('❌ CutTimelineViewer 유효하지 않은 scenes 데이터')
      return []
    }
    
    const cuts = []
    let globalCutIndex = 0
    
    scenes.forEach((scene, sceneIndex) => {
      console.log(`🔍 CutTimelineViewer 씬 ${sceneIndex + 1} 처리:`, {
        id: scene.id,
        title: scene.title,
        scene: scene.scene,
        cuts: scene.cuts,
        cutsType: typeof scene.cuts,
        cutsIsArray: Array.isArray(scene.cuts),
        cutsLength: scene.cuts?.length || 0
      })
      
      if (scene.cuts && Array.isArray(scene.cuts)) {
        console.log(`✅ CutTimelineViewer 씬 ${sceneIndex + 1}에 컷 ${scene.cuts.length}개 발견`)
        
        scene.cuts.forEach((cut, cutIndex) => {
          console.log(`🔍 CutTimelineViewer 컷 ${cutIndex + 1} 상세 정보:`, {
            id: cut.id,
            cutId: cut.cutId,
            shotNumber: cut.shotNumber,
            title: cut.title,
            description: cut.description,
            cutType: cut.cutType,
            estimatedDuration: cut.estimatedDuration,
            imageUrl: cut.imageUrl
          })
          
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
      } else {
        console.log(`⚠️ CutTimelineViewer 씬 ${sceneIndex + 1}에 컷 데이터 없음`)
      }
      // 컷이 없는 씬은 타임라인에 표시하지 않음
    })
    
    console.log('🔍 CutTimelineViewer allCuts 최종 결과:', {
      totalCuts: cuts.length,
      cuts: cuts.map(cut => ({
        id: cut.id,
        cutId: cut.cutId,
        shotNumber: cut.shotNumber,
        title: cut.title,
        sceneNumber: cut.sceneNumber
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
  const [currentTime, setCurrentTime] = useState(5) // 기본값을 5초로 설정

  // currentTime 디버깅
  useEffect(() => {
    console.log('🎬 CutTimelineViewer currentTime 변경:', currentTime)
  }, [currentTime])

  // 테스트용 currentTime 변경 함수
  const handleTestTimeChange = useCallback((newTime) => {
    console.log('🎬 테스트 시간 변경:', currentTime, '→', newTime)
    setCurrentTime(newTime)
  }, [currentTime])

  // 시간 기반 계산 로직
  const calculatedTimeScale = useMemo(() => {
    const scale = calculateTimeScale(currentZoomLevel, baseScale)
    console.log(`CutTimelineViewer calculatedTimeScale: zoomLevel=${currentZoomLevel}, baseScale=${baseScale}, result=${scale}`)
    return Math.max(scale, 0.1)
  }, [currentZoomLevel, baseScale])

  const calculatedTotalDuration = useMemo(() => {
    return allCuts.reduce((total, cut) => total + (cut.estimatedDuration || 5), 0)
  }, [allCuts])

  // 키보드 단축키로 playhead 조정
  const handleKeyDown = useCallback((event) => {
    const step = event.shiftKey ? 10 : 1 // Shift 키와 함께 누르면 10초씩, 아니면 1초씩
    
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault()
        setCurrentTime(prev => Math.max(0, prev - step))
        break
      case 'ArrowRight':
        event.preventDefault()
        setCurrentTime(prev => Math.min(calculatedTotalDuration, prev + step))
        break
      case 'Home':
        event.preventDefault()
        setCurrentTime(0)
        break
      case 'End':
        event.preventDefault()
        setCurrentTime(calculatedTotalDuration)
        break
      case ' ':
        event.preventDefault()
        // 스페이스바로 재생/일시정지 토글 (향후 구현)
        console.log('🎬 재생/일시정지 토글')
        break
    }
  }, [calculatedTotalDuration])

  // playhead 중심 확대/축소를 위한 시간 스케일 계산
  const dynamicTimeScale = useMemo(() => {
    // 줌 레벨에 따른 동적 시간 스케일 계산
    const basePixelsPerSecond = 10 // 기본 1초당 10px
    const zoomedPixelsPerSecond = basePixelsPerSecond * currentZoomLevel
    const timeScale = 1 / zoomedPixelsPerSecond // 픽셀당 시간 (초)
    
    console.log(`🎬 CutTimelineViewer dynamicTimeScale: zoomLevel=${currentZoomLevel}, pixelsPerSecond=${zoomedPixelsPerSecond}, timeScale=${timeScale}`)
    return timeScale
  }, [currentZoomLevel])

  // 타임라인 너비 계산 - TimeRuler와 동일한 방식 사용
  const timelineWidth = useMemo(() => {
    if (calculatedTotalDuration <= 0) return 0
    // TimeRuler와 동일한 pixelsPerSecond 계산 사용
    const pixelsPerSecond = 1 / dynamicTimeScale
    const totalWidth = calculatedTotalDuration * pixelsPerSecond
    const minWidth = Math.max(1000, totalWidth) // 최소 1000px 보장
    
    console.log(`🎬 CutTimelineViewer timelineWidth: totalDuration=${calculatedTotalDuration}s, dynamicTimeScale=${dynamicTimeScale}, pixelsPerSecond=${pixelsPerSecond}, totalWidth=${totalWidth}px, finalWidth=${minWidth}px`)
    return minWidth
  }, [calculatedTotalDuration, dynamicTimeScale])

  // 카드 너비 계산을 위한 pixelsPerSecond 값
  const pixelsPerSecond = useMemo(() => {
    const pps = 1 / dynamicTimeScale
    console.log(`🎬 CutTimelineViewer pixelsPerSecond: ${pps} (1/${dynamicTimeScale})`)
    return pps
  }, [dynamicTimeScale])

  // 각 카드의 너비 계산 - 모든 줌 레벨에서 순수 시간 기반 계산
  const cardWidths = useMemo(() => {
    return allCuts.map(cut => {
      const cutDuration = cut.estimatedDuration || cut.duration || 5
      // TimeRuler와 완전히 동일한 pixelsPerSecond 계산 사용
      const pixelsPerSecond = 1 / dynamicTimeScale
      const timeBasedWidth = cutDuration * pixelsPerSecond
      
      // 모든 줌 레벨에서 순수 시간 기반 계산 (제한 제거)
      console.log(`🎬 CutTimelineViewer 카드 너비 계산: 컷 ${cut.shotNumber}, duration=${cutDuration}s, pixelsPerSecond=${pixelsPerSecond}, width=${timeBasedWidth}px`)
      
      return {
        cutId: cut.id,
        width: timeBasedWidth
      }
    })
  }, [allCuts, dynamicTimeScale])

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
  }, [showV2Track])

  // 컷 클릭 핸들러
  const handleCutClick = useCallback((cut) => {
    console.log('🎬 컷 클릭:', cut)
    if (onCutClick) {
      onCutClick(cut)
    }
  }, [onCutClick])

  // 컷 편집 핸들러
  const handleCutEdit = useCallback((cut) => {
    console.log('✏️ 컷 편집:', cut)
    if (onCutEdit) {
      onCutEdit(cut)
    }
  }, [onCutEdit])

  // 컷 정보 핸들러
  const handleCutInfo = useCallback((cut) => {
    console.log('ℹ️ 컷 정보:', cut)
    if (onCutInfo) {
      onCutInfo(cut)
    }
  }, [onCutInfo])

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

  // 스크롤 핸들러
  const handleScroll = useCallback((scrollLeft) => {
    setScrollPosition(scrollLeft)
  }, [])

  // 시간 클릭 핸들러 - playhead 이동
  const handleTimeClick = useCallback((time) => {
    console.log('🎬 시간 클릭:', time)
    setCurrentTime(time)
    
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
      
      console.log('🎬 playhead 중심 스크롤:', {
        time,
        targetPosition,
        scrollPosition
      })
    }
  }, [dynamicTimeScale])

  // 줌 레벨 변경 핸들러 - playhead 중심 확대/축소
  const handleZoomChange = useCallback((newZoomLevel) => {
    console.log('🎬 줌 레벨 변경:', currentZoomLevel, '→', newZoomLevel)
    
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
        
        console.log('🎬 playhead 중심 스크롤:', {
          currentTime,
          newPlayheadPosition,
          targetScrollPosition
        })
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
        console.log('🎬 Playhead 위치에 따른 컷 선택:', currentCut.id, '시간:', currentTime)
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
        
        <Box sx={{ display: 'flex', gap: 1 }}>
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
            ←→: 이동 | Home/End: 처음/끝 | Shift+←→: 10초씩
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
                  gap: 0, // 여백 제거
                  minHeight: 80
                }}>
                  {allCuts.map((cut, index) => {
                    const cardWidth = cardWidths.find(cw => cw.cutId === cut.id)?.width || 200
                    return (
                      <Box key={`v2-${cut.id || cut.cutId || index}`} sx={{ 
                        position: 'relative',
                        display: 'inline-block' // 연속 배치를 위해 인라인 블록으로 설정
                      }}>
                        <VideoCard
                          video={{
                            id: cut.id,
                            cutId: cut.cutId,
                            shotNumber: cut.shotNumber,
                            title: cut.title,
                            description: cut.description,
                            videoUrl: cut.videoUrl || cut.imageUrl, // 임시로 이미지 URL을 비디오 URL로 사용
                            posterUrl: cut.imageUrl,
                            duration: cut.estimatedDuration || cut.duration,
                            type: cut.type || 'real',
                            metadata: {
                              cameraAngle: cut.shootingPlan?.angleDirection,
                              lensSpecs: cut.shootingPlan?.lensSpecs,
                              shotSize: cut.shootingPlan?.shotSize
                            }
                          }}
                          onClick={() => handleCutClick(cut)}
                          onEdit={() => handleCutEdit(cut)}
                          onDelete={() => handleCutInfo(cut)}
                          selected={selectedCutId === cut.id}
                          loading={loading}
                          isDraggable={true}
                          onMouseEnter={() => setHoveredCutId(cut.id)}
                          onMouseLeave={() => setHoveredCutId(null)}
                          timeScale={dynamicTimeScale}
                          zoomLevel={currentZoomLevel}
                          showTimeInfo={showTimeInfo}
                          width={cardWidth} // 계산된 너비 전달
                          currentTime={currentTime}
                          allCuts={allCuts}
                          showV1Track={showV1Track}
                          showV2Track={showV2Track}
                        />
                      </Box>
                    )
                  })}
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
          {allCuts.length}개 컷 • {formatTimeHumanReadable(calculatedTotalDuration)}
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
    </Box>
  )
}

export default CutTimelineViewer 