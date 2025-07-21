import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { Box, Typography, CircularProgress, Button } from '@mui/material'
import { Schedule, PlayArrow } from '@mui/icons-material'
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
    emptyMessage = "컷이 없습니다. AI를 사용하여 콘티를 생성해보세요.",
    timeScale = 1,
    zoomLevel = 1,
    showTimeInfo = true,
    baseScale = 1,
    onViewSchedule = null
  } = props || {}

  // 디버깅 로그
  console.log('🔍 CutTimelineViewer received props:', props)
  console.log('🔍 CutTimelineViewer received scenes:', scenes)
  
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
  const [currentTime, setCurrentTime] = useState(0)

  // 시간 기반 계산 로직
  const calculatedTimeScale = useMemo(() => {
    const scale = calculateTimeScale(currentZoomLevel, baseScale)
    console.log(`CutTimelineViewer calculatedTimeScale: zoomLevel=${currentZoomLevel}, baseScale=${baseScale}, result=${scale}`)
    return Math.max(scale, 0.1)
  }, [currentZoomLevel, baseScale])

  const calculatedTotalDuration = useMemo(() => {
    return allCuts.reduce((total, cut) => total + (cut.estimatedDuration || 5), 0)
  }, [allCuts])

  const timelineWidth = useMemo(() => {
    if (calculatedTotalDuration <= 0 || calculatedTimeScale <= 0) return 0
    return calculatedTotalDuration / calculatedTimeScale
  }, [calculatedTotalDuration, calculatedTimeScale])

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

  // 줌 레벨 변경 핸들러
  const handleZoomChange = useCallback((newZoomLevel) => {
    setCurrentZoomLevel(newZoomLevel)
  }, [])

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
        p: 2, 
        borderBottom: '1px solid var(--color-scene-card-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="h6" sx={{ color: 'var(--color-text-primary)' }}>
          컷 타임라인 ({allCuts.length}개 컷)
        </Typography>
        
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
        </Box>
      </Box>

      {/* 시간 눈금자 */}
      {showTimeInfo && (
        <TimeRuler
          totalDuration={calculatedTotalDuration}
          timeScale={calculatedTimeScale}
          zoomLevel={currentZoomLevel}
          width={timelineWidth}
        />
      )}

      {/* 컷 타임라인 */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'hidden',
        position: 'relative'
      }}>
        <TimelineScroll
          ref={scrollRef}
          onScroll={handleScroll}
          sx={{
            height: '100%',
            overflowX: 'auto',
            overflowY: 'hidden'
          }}
        >
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={allCuts.map((cut, index) => `cut-${cut.id || cut.cutId || index}`)}
              strategy={horizontalListSortingStrategy}
            >
              <Box sx={{
                display: 'flex',
                gap: 2,
                p: 2,
                minWidth: timelineWidth,
                position: 'relative'
              }}>
                {allCuts.map((cut, index) => (
                  <Box key={`cut-${cut.id || cut.cutId || index}`} sx={{ position: 'relative' }}>
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
                      timeScale={calculatedTimeScale}
                      zoomLevel={currentZoomLevel}
                      showTimeInfo={showTimeInfo}
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
                ))}
              </Box>
            </SortableContext>
          </DndContext>
        </TimelineScroll>
      </Box>

      {/* 타임라인 푸터 */}
      <Box sx={{ 
        p: 2, 
        borderTop: '1px solid var(--color-scene-card-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)' }}>
          총 {allCuts.length}개 컷 • 총 시간: {formatTimeHumanReadable(calculatedTotalDuration)}
        </Typography>
        
        {onViewSchedule && (
          <Button
            variant="outlined"
            startIcon={<Schedule />}
            onClick={onViewSchedule}
            sx={{
              borderColor: 'var(--color-accent)',
              color: 'var(--color-accent)',
              '&:hover': {
                borderColor: 'var(--color-primary)',
                backgroundColor: 'rgba(212, 175, 55, 0.1)'
              }
            }}
          >
            스케줄 보기
          </Button>
        )}
      </Box>
    </Box>
  )
}

export default CutTimelineViewer 