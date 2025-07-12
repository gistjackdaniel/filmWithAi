import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { Box, Typography, CircularProgress } from '@mui/material'
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
import SceneCard from '../atoms/SceneCard'
import TimeRuler from '../atoms/TimeRuler'
import { CaptionCardType } from '../../../types/timeline'
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
 * 타임라인 뷰어 컴포넌트
 * 캡션카드들을 타임라인 형태로 표시하고 드래그 앤 드롭으로 순서 변경 가능
 * 시간 기반 타임라인을 지원하여 씬의 지속 시간에 따라 레이아웃이 동적으로 조정됨
 */
const TimelineViewer = (props) => {
  // props를 안전하게 구조분해
  const {
    scenes = [],
    loading = false,
    selectedSceneId = null,
    onSceneClick,
    onSceneEdit,
    onSceneInfo,
    onScenesReorder,
    emptyMessage = "콘티가 없습니다. AI를 사용하여 콘티를 생성해보세요.",
    // 시간 기반 타임라인 관련 props
    timeScale = 1, // 픽셀당 시간 (초)
    zoomLevel = 1, // 줌 레벨
    showTimeInfo = true, // 시간 정보 표시 여부
    baseScale = 1 // 기본 스케일 (픽셀당 초)
  } = props || {}

  // 디버깅 로그 추가
  console.log('TimelineViewer received props:', props)
  console.log('TimelineViewer received scenes:', scenes, 'type:', typeof scenes, 'isArray:', Array.isArray(scenes))
  
  // scenes가 유효한 배열인지 확인하고 안전하게 처리
  const safeScenes = useMemo(() => {
    if (!scenes) return []
    const scenesArray = Array.isArray(scenes) ? scenes : []
    console.log('TimelineViewer safeScenes:', scenesArray, 'length:', scenesArray?.length)
    return scenesArray
  }, [scenes])
  
  // 안전한 참조를 위한 메모이제이션된 값들
  const safeScenesRef = useMemo(() => safeScenes, [safeScenes])
  const safeScenesLength = useMemo(() => safeScenes?.length || 0, [safeScenes])
  
  // 안정적인 의존성 배열을 위한 메모이제이션된 값들
  const stableSafeScenesLength = useMemo(() => safeScenesLength, [safeScenesLength])
  const stableSafeScenesRef = useMemo(() => safeScenesRef, [safeScenesRef])
  
  const [hoveredSceneId, setHoveredSceneId] = useState(null)
  const [scrollPosition, setScrollPosition] = useState(0)
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [filters, setFilters] = useState({})
  const [selectedScenes, setSelectedScenes] = useState(new Set()) // 다중 선택 상태
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false) // 다중 선택 모드
  const scrollRef = useRef(null)

  // 시간 기반 타임라인 관련 상태
  const [currentTimeScale, setCurrentTimeScale] = useState(timeScale)
  const [currentZoomLevel, setCurrentZoomLevel] = useState(zoomLevel)
  const [totalDuration, setTotalDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  // 시간 기반 계산 로직
  const calculatedTimeScale = useMemo(() => {
    return calculateTimeScale(currentZoomLevel, baseScale)
  }, [currentZoomLevel, baseScale])

  const calculatedTotalDuration = useMemo(() => {
    return calculateTotalDuration(safeScenes)
  }, [safeScenes])

  const timelineWidth = useMemo(() => {
    if (calculatedTotalDuration <= 0 || calculatedTimeScale <= 0) return 0
    return timeToPixels(calculatedTotalDuration, calculatedTimeScale)
  }, [calculatedTotalDuration, calculatedTimeScale])

  // 시간 기반 스크롤 위치 계산
  const timeBasedScrollPosition = useMemo(() => {
    return pixelsToTime(scrollPosition, calculatedTimeScale)
  }, [scrollPosition, calculatedTimeScale])

  // 드래그 앤 드롭 센서 설정 - 최상위 레벨에서 Hook 호출
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px로 임계값 조정 (더 민감하게)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 씬 클릭 핸들러
  const handleSceneClick = useCallback((scene) => {
    if (onSceneClick) {
      onSceneClick(scene)
    }
  }, [onSceneClick])

  // 다중 선택 핸들러
  const handleSceneMultiSelect = useCallback((scene, event) => {
    if (!scene || !scene.id) {
      console.warn('SceneCard: Invalid scene in multi-select', scene)
      return
    }

    if (event.ctrlKey || event.metaKey) {
      // Ctrl/Cmd + 클릭으로 다중 선택
      setIsMultiSelectMode(true)
      setSelectedScenes(prev => {
        const newSet = new Set(prev)
        if (newSet.has(scene.id)) {
          newSet.delete(scene.id)
        } else {
          newSet.add(scene.id)
        }
        return newSet
      })
    } else {
      // 일반 클릭 시 단일 선택
      setSelectedScenes(new Set([scene.id]))
      if (onSceneClick) {
        onSceneClick(scene)
      }
    }
  }, [onSceneClick])

  // 다중 선택 해제 핸들러
  const handleClearMultiSelect = useCallback(() => {
    setSelectedScenes(new Set())
    setIsMultiSelectMode(false)
  }, [])

  // 씬 편집 핸들러
  const handleSceneEdit = useCallback((scene) => {
    if (onSceneEdit) {
      onSceneEdit(scene)
    }
  }, [onSceneEdit])

  // 씬 정보 핸들러
  const handleSceneInfo = useCallback((scene) => {
    if (onSceneInfo) {
      onSceneInfo(scene)
    }
  }, [onSceneInfo])

  // 드래그 종료 핸들러
  const handleDragEnd = useCallback((event) => {
    const { active, over } = event
    console.log('Drag end event:', { active, over }) // 디버깅 로그 추가

    if (!stableSafeScenesRef || !Array.isArray(stableSafeScenesRef)) {
      console.log('Scenes is not available for drag operation')
      return
    }

    if (active.id !== over?.id) {
      const oldIndex = stableSafeScenesRef.findIndex(scene => scene.id === active.id)
      const newIndex = stableSafeScenesRef.findIndex(scene => scene.id === over?.id)

      console.log('Scene indices:', { oldIndex, newIndex }) // 디버깅 로그 추가

      if (oldIndex !== -1 && newIndex !== -1) {
        const newScenes = arrayMove(stableSafeScenesRef, oldIndex, newIndex)
        console.log('New scenes order:', newScenes.map(s => ({ id: s.id, scene: s.scene }))) // 디버깅 로그 추가
        if (onScenesReorder) {
          onScenesReorder(newScenes)
        }
      }
    }
  }, [stableSafeScenesRef, onScenesReorder])

  // 스크롤 위치 변경 핸들러 (시간 기반)
  const handleScrollPositionChange = useCallback((position) => {
    setScrollPosition(position)
    
    // 시간 기반 현재 시간 계산
    const newCurrentTime = pixelsToTime(position, calculatedTimeScale)
    setCurrentTime(newCurrentTime)
    
    // 시간 기반 현재 씬 인덱스 계산
    let newSceneIndex = 0
    for (let i = 0; i < safeScenes.length; i++) {
      const sceneStart = calculateSceneStartTime(safeScenes, i)
      const sceneEnd = calculateSceneEndTime(safeScenes, i)
      
      if (newCurrentTime >= sceneStart && newCurrentTime <= sceneEnd) {
        newSceneIndex = i
        break
      }
    }
    
    const maxIndex = (stableSafeScenesLength || 0) > 0 ? (stableSafeScenesLength || 0) - 1 : 0
    setCurrentSceneIndex(Math.max(0, Math.min(newSceneIndex, maxIndex)))
  }, [stableSafeScenesLength, safeScenes, calculatedTimeScale])

  // 시간 기반 네비게이션 핸들러들
  const handleScrollToTime = useCallback((targetTime) => {
    if (scrollRef.current) {
      const targetPixels = timeToPixels(targetTime, calculatedTimeScale)
      scrollRef.current.scrollTo({
        left: Math.max(0, targetPixels),
        behavior: 'smooth'
      })
    }
  }, [calculatedTimeScale])

  const handleScrollToScene = useCallback((sceneIndex) => {
    if (scrollRef.current && safeScenes[sceneIndex]) {
      const sceneStart = calculateSceneStartTime(safeScenes, sceneIndex)
      const targetPixels = timeToPixels(sceneStart, calculatedTimeScale)
      scrollRef.current.scrollTo({
        left: Math.max(0, targetPixels),
        behavior: 'smooth'
      })
    }
  }, [safeScenes, calculatedTimeScale])

  const handleZoomChange = useCallback((newZoomLevel) => {
    setCurrentZoomLevel(newZoomLevel)
    const newTimeScale = calculateTimeScale(newZoomLevel, baseScale)
    setCurrentTimeScale(newTimeScale)
  }, [baseScale])

  // 시간 기반 스크롤 네비게이션
  const handleScrollLeft = useCallback(() => {
    if (scrollRef.current) {
      const currentTime = pixelsToTime(scrollRef.current.scrollLeft, calculatedTimeScale)
      const scrollTimeAmount = 30 // 30초씩 이동
      const newTime = Math.max(0, currentTime - scrollTimeAmount)
      const newPixels = timeToPixels(newTime, calculatedTimeScale)
      
      scrollRef.current.scrollTo({
        left: newPixels,
        behavior: 'smooth'
      })
    }
  }, [calculatedTimeScale])

  const handleScrollRight = useCallback(() => {
    if (scrollRef.current) {
      const currentTime = pixelsToTime(scrollRef.current.scrollLeft, calculatedTimeScale)
      const scrollTimeAmount = 30 // 30초씩 이동
      const newTime = Math.min(calculatedTotalDuration, currentTime + scrollTimeAmount)
      const newPixels = timeToPixels(newTime, calculatedTimeScale)
      
      scrollRef.current.scrollTo({
        left: newPixels,
        behavior: 'smooth'
      })
    }
  }, [calculatedTimeScale, calculatedTotalDuration])

  const handleScrollToStart = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: 0,
        behavior: 'smooth'
      })
    }
  }, [])

  const handleScrollToEnd = useCallback(() => {
    if (scrollRef.current) {
      const maxScroll = timelineWidth - scrollRef.current.clientWidth
      scrollRef.current.scrollTo({
        left: Math.max(0, maxScroll),
        behavior: 'smooth'
      })
    }
  }, [timelineWidth])

  // 스크롤 가능 여부 업데이트
  useEffect(() => {
    if (scrollRef.current) {
      const updateScrollButtons = () => {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
        setCanScrollLeft(scrollLeft > 0)
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
      }

      updateScrollButtons()
      window.addEventListener('resize', updateScrollButtons)
      return () => window.removeEventListener('resize', updateScrollButtons)
    }
  }, [])

  // 필터링된 씬들 계산
  const filteredScenes = useMemo(() => {
    if (!stableSafeScenesRef || !Array.isArray(stableSafeScenesRef)) {
      return []
    }
    
    let filtered = [...stableSafeScenesRef]

    // 검색 필터
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(scene => 
        scene.description?.toLowerCase().includes(searchLower) ||
        scene.components?.description?.toLowerCase().includes(searchLower)
      )
    }

    // 타입 필터
    if (filters.type) {
      filtered = filtered.filter(scene => scene.type === filters.type)
    }

    // 씬 번호 필터
    if (filters.sceneNumber) {
      const sceneNumber = parseInt(filters.sceneNumber)
      filtered = filtered.filter(scene => 
        scene.scene === sceneNumber || 
        scene.components?.sceneNumber === sceneNumber
      )
    }

    return filtered
  }, [stableSafeScenesRef, filters])

  // 안전한 필터링된 씬들 참조
  const safeFilteredScenes = useMemo(() => {
    if (!filteredScenes || !Array.isArray(filteredScenes)) {
      console.warn('TimelineViewer: filteredScenes is not an array', filteredScenes)
      return []
    }
    return filteredScenes.filter(scene => scene && scene.id) // 유효한 씬만 필터링
  }, [filteredScenes])

  // 안전한 씬 ID 배열
  const safeSceneIds = useMemo(() => {
    return safeFilteredScenes.map(scene => scene.id).filter(Boolean)
  }, [safeFilteredScenes])

  // 필터 변경 핸들러
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters)
    setCurrentSceneIndex(0) // 필터 변경 시 첫 번째 씬으로 리셋
  }, [])

  // 필터 초기화 핸들러
  const handleClearFilters = useCallback(() => {
    setFilters({})
    setCurrentSceneIndex(0)
  }, [])

  // 로딩 상태 표시
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: 400,
          gap: 2
        }}
      >
        <CircularProgress 
          size={40} 
          sx={{ color: 'var(--color-accent)' }} 
        />
        <Typography 
          variant="body1" 
          sx={{ 
            font: 'var(--font-body-1)',
            color: 'var(--color-text-secondary)'
          }}
        >
          타임라인을 불러오는 중...
        </Typography>
      </Box>
    )
  }

  // 빈 상태 표시
  if (!stableSafeScenesRef || stableSafeScenesRef.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: 400,
          gap: 2,
          p: 4
        }}
      >
        <Typography 
          variant="h6" 
          sx={{ 
            font: 'var(--font-heading-2)',
            color: 'var(--color-text-secondary)',
            textAlign: 'center'
          }}
        >
          {emptyMessage}
        </Typography>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        gap: 2
      }}
    >
      {/* 상단 네비게이션 및 필터 */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <TimelineNavigation
          currentSceneIndex={currentSceneIndex}
          totalScenes={safeFilteredScenes.length}
          canScrollLeft={canScrollLeft}
          canScrollRight={canScrollRight}
          onScrollLeft={handleScrollLeft}
          onScrollRight={handleScrollRight}
          onScrollToStart={handleScrollToStart}
          onScrollToEnd={handleScrollToEnd}
          onScrollToScene={handleScrollToScene}
          // 시간 기반 네비게이션 props
          currentTime={timeBasedScrollPosition}
          totalDuration={calculatedTotalDuration}
          zoomLevel={currentZoomLevel}
          onZoomChange={handleZoomChange}
          onTimeJump={handleScrollToTime}
          showTimeNavigation={showTimeInfo}
          showZoomControls={true}
        />
        
        <TimelineFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          sceneTypes={Object.values(CaptionCardType)}
        />
      </Box>

      {/* 시간 눈금 */}
      {showTimeInfo && calculatedTotalDuration > 0 && (
        <TimeRuler
          totalDuration={calculatedTotalDuration}
          currentTime={timeBasedScrollPosition}
          zoomLevel={currentZoomLevel}
          baseScale={baseScale}
          height={40}
          showCurrentTime={true}
          showGrid={true}
          onTimeClick={handleScrollToTime}
        />
      )}

      {/* 타임라인 스크롤 영역 */}
      <TimelineScroll
        ref={scrollRef}
        onScrollPositionChange={handleScrollPositionChange}
        sx={{
          flex: 1,
          minHeight: 300
        }}
      >
        {/* 드래그 앤 드롭 컨텍스트 */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          onDragStart={(event) => {
            console.log('Drag start:', event.active.id) // 드래그 시작 로그
          }}
          onDragOver={(event) => {
            console.log('Drag over:', event.over?.id) // 드래그 오버 로그
          }}
        >
          <SortableContext
            items={safeSceneIds}
            strategy={horizontalListSortingStrategy}
          >
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                p: 2,
                minWidth: 'fit-content',
                minHeight: 250, // 드롭 영역 확보
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  border: '2px dashed rgba(212, 175, 55, 0.3)',
                  borderRadius: '12px',
                  pointerEvents: 'none',
                  opacity: 0,
                  transition: 'opacity 0.2s ease'
                },
                '&:hover::before': {
                  opacity: 0.5
                }
              }}
            >
              {safeFilteredScenes.map((scene, index) => (
                <SceneCard
                  key={scene.id}
                  scene={scene}
                  onClick={(event) => handleSceneMultiSelect(scene, event)}
                  onEdit={() => handleSceneEdit(scene)}
                  onInfo={() => handleSceneInfo(scene)}
                  selected={selectedSceneId === scene.id || selectedScenes.has(scene.id)}
                  isMultiSelected={selectedScenes.has(scene.id)}
                  onMouseEnter={() => {
                    if (scene && scene.id) {
                      setHoveredSceneId(scene.id)
                    }
                  }}
                  onMouseLeave={() => {
                    if (scene && scene.id) {
                      setHoveredSceneId(null)
                    }
                  }}
                  isDraggable={true} // 드래그 가능 표시
                  // 시간 기반 타임라인 props
                  timeScale={calculatedTimeScale}
                  zoomLevel={currentZoomLevel}
                  showTimeInfo={showTimeInfo}
                />
              ))}
            </Box>
          </SortableContext>
        </DndContext>
      </TimelineScroll>

      {/* 하단 정보 */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          borderTop: '1px solid var(--color-scene-card-border)',
          backgroundColor: 'var(--color-card-bg)',
          borderRadius: '0 0 12px 12px'
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography
            variant="body2"
            sx={{
              font: 'var(--font-body-2)',
              color: 'var(--color-text-secondary)'
            }}
          >
            총 {safeFilteredScenes.length}개 씬
            {filters.search || filters.type || filters.sceneNumber ? ' (필터링됨)' : ''}
          </Typography>
          
          {/* 시간 정보 표시 */}
          {showTimeInfo && calculatedTotalDuration > 0 && (
            <Typography
              variant="caption"
              sx={{
                font: 'var(--font-caption)',
                color: 'var(--color-accent)'
              }}
            >
              총 길이: {formatTimeFromSeconds(calculatedTotalDuration)} ({formatTimeHumanReadable(calculatedTotalDuration)})
            </Typography>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-end' }}>
          <Typography
            variant="caption"
            sx={{
              font: 'var(--font-caption)',
              color: 'var(--color-text-secondary)'
            }}
          >
            드래그하여 순서 변경 가능
          </Typography>
          
          {/* 현재 시간 정보 표시 */}
          {showTimeInfo && calculatedTotalDuration > 0 && (
            <Typography
              variant="caption"
              sx={{
                font: 'var(--font-caption)',
                color: 'var(--color-text-secondary)'
              }}
            >
              현재: {formatTimeFromSeconds(timeBasedScrollPosition)}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  )
}

export default TimelineViewer 