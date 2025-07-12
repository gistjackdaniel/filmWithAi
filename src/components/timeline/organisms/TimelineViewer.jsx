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
import { CaptionCardType } from '../../../types/timeline'

/**
 * 타임라인 뷰어 컴포넌트
 * 캡션카드들을 타임라인 형태로 표시하고 드래그 앤 드롭으로 순서 변경 가능
 */
const TimelineViewer = ({ 
  scenes = [], 
  loading = false,
  selectedSceneId = null,
  onSceneClick,
  onSceneEdit,
  onSceneInfo,
  onScenesReorder, // 새로운 prop: 순서 변경 콜백
  emptyMessage = "콘티가 없습니다. AI를 사용하여 콘티를 생성해보세요."
}) => {
  // 디버깅 로그 추가
  console.log('TimelineViewer received scenes:', scenes, 'type:', typeof scenes, 'isArray:', Array.isArray(scenes))
  
  // scenes가 유효한 배열인지 확인하고 안전하게 처리
  const safeScenes = useMemo(() => {
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

  // 드래그 앤 드롭 센서 설정 - 메모이제이션으로 성능 최적화
  const sensors = useMemo(() => useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px로 임계값 조정 (더 민감하게)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  ), [])

  // 씬 클릭 핸들러
  const handleSceneClick = useCallback((scene) => {
    onSceneClick?.(scene)
  }, [onSceneClick])

  // 다중 선택 핸들러
  const handleSceneMultiSelect = useCallback((scene, event) => {
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
      onSceneClick?.(scene)
    }
  }, [onSceneClick])

  // 다중 선택 해제 핸들러
  const handleClearMultiSelect = useCallback(() => {
    setSelectedScenes(new Set())
    setIsMultiSelectMode(false)
  }, [])

  // 씬 편집 핸들러
  const handleSceneEdit = useCallback((scene) => {
    onSceneEdit?.(scene)
  }, [onSceneEdit])

  // 씬 정보 핸들러
  const handleSceneInfo = useCallback((scene) => {
    onSceneInfo?.(scene)
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
        onScenesReorder?.(newScenes)
      }
    }
  }, [stableSafeScenesRef, onScenesReorder])

  // 스크롤 위치 변경 핸들러
  const handleScrollPositionChange = useCallback((position) => {
    setScrollPosition(position)
    
    // 현재 씬 인덱스 계산
    const sceneWidth = 280 // 씬 카드 너비 (gap 포함)
    const newSceneIndex = Math.round(position / sceneWidth)
    const maxIndex = (stableSafeScenesLength || 0) > 0 ? (stableSafeScenesLength || 0) - 1 : 0
    setCurrentSceneIndex(Math.max(0, Math.min(newSceneIndex, maxIndex)))
  }, [stableSafeScenesLength || 0])

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

  // 네비게이션 핸들러들
  const handleScrollLeft = useCallback(() => {
    if (scrollRef.current) {
      const currentScroll = scrollRef.current.scrollLeft
      const scrollAmount = 300
      scrollRef.current.scrollTo({
        left: Math.max(0, currentScroll - scrollAmount),
        behavior: 'smooth'
      })
    }
  }, [])

  const handleScrollRight = useCallback(() => {
    if (scrollRef.current) {
      const currentScroll = scrollRef.current.scrollLeft
      const scrollAmount = 300
      const maxScroll = scrollRef.current.scrollWidth - scrollRef.current.clientWidth
      scrollRef.current.scrollTo({
        left: Math.min(maxScroll, currentScroll + scrollAmount),
        behavior: 'smooth'
      })
    }
  }, [])

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
      const maxScroll = scrollRef.current.scrollWidth - scrollRef.current.clientWidth
      scrollRef.current.scrollTo({
        left: maxScroll,
        behavior: 'smooth'
      })
    }
  }, [])

  const handleScrollToScene = useCallback((sceneIndex) => {
    if (scrollRef.current) {
      const sceneWidth = 280
      const scrollPosition = sceneIndex * sceneWidth
      scrollRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      })
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
          totalScenes={filteredScenes.length}
          canScrollLeft={canScrollLeft}
          canScrollRight={canScrollRight}
          onScrollLeft={handleScrollLeft}
          onScrollRight={handleScrollRight}
          onScrollToStart={handleScrollToStart}
          onScrollToEnd={handleScrollToEnd}
          onScrollToScene={handleScrollToScene}
        />
        
        <TimelineFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          sceneTypes={Object.values(CaptionCardType)}
        />
      </Box>

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
            items={filteredScenes.map(scene => scene.id)}
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
              {filteredScenes.map((scene, index) => (
                <SceneCard
                  key={scene.id}
                  scene={scene}
                  onClick={(event) => handleSceneMultiSelect(scene, event)}
                  onEdit={() => handleSceneEdit(scene)}
                  onInfo={() => handleSceneInfo(scene)}
                  selected={selectedSceneId === scene.id || selectedScenes.has(scene.id)}
                  isMultiSelected={selectedScenes.has(scene.id)}
                  onMouseEnter={() => setHoveredSceneId(scene.id)}
                  onMouseLeave={() => setHoveredSceneId(null)}
                  isDraggable={true} // 드래그 가능 표시
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
        <Typography
          variant="body2"
          sx={{
            font: 'var(--font-body-2)',
            color: 'var(--color-text-secondary)'
          }}
        >
          총 {filteredScenes.length}개 씬
          {filters.search || filters.type || filters.sceneNumber ? ' (필터링됨)' : ''}
        </Typography>
        
        <Typography
          variant="caption"
          sx={{
            font: 'var(--font-caption)',
            color: 'var(--color-text-secondary)'
          }}
        >
          드래그하여 순서 변경 가능
        </Typography>
      </Box>
    </Box>
  )
}

export default TimelineViewer 