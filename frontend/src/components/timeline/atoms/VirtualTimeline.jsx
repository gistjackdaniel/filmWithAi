import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Box } from '@mui/material'
import SceneCard from './SceneCard'
import { 
  calculateTimeScale,
  timeToPixels,
  calculateMinSceneWidth
} from '../../../utils/timelineUtils'

/**
 * 가상 스크롤링 타임라인 컴포넌트
 * 대용량 콘티 데이터를 효율적으로 렌더링하기 위한 가상화 구현
 * 줌 레벨에 따른 동적 씬 너비 계산 지원
 */
const VirtualTimeline = ({
  scenes = [],
  itemHeight = 200, // 씬 카드 높이
  gap = 16, // 카드 간 간격
  containerHeight = 400, // 컨테이너 높이
  onSceneClick,
  onSceneEdit,
  onSceneInfo,
  selectedSceneId = null,
  loading = false,
  // 줌 관련 props 추가
  zoomLevel = 1,
  baseScale = 1,
  timeScale = null, // 외부에서 전달된 시간 스케일
  ...props
}) => {
  const containerRef = useRef(null)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [containerWidth, setContainerWidth] = useState(0)

  // 시간 스케일 계산
  const calculatedTimeScale = useMemo(() => {
    if (timeScale !== null) return timeScale
    return calculateTimeScale(zoomLevel, baseScale)
  }, [timeScale, zoomLevel, baseScale])

  // 줌 레벨에 따른 동적 씬 너비 계산
  const itemWidth = useMemo(() => {
    return calculateMinSceneWidth(zoomLevel, 280) // 기본 너비 280px
  }, [zoomLevel])

  // 컨테이너 크기 감지
  useEffect(() => {
    const updateContainerWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth)
      }
    }

    updateContainerWidth()
    window.addEventListener('resize', updateContainerWidth)
    return () => window.removeEventListener('resize', updateContainerWidth)
  }, [])

  // 스크롤 이벤트 핸들러
  const handleScroll = useCallback((event) => {
    setScrollLeft(event.target.scrollLeft)
  }, [])

  // 가상화 계산
  const virtualization = useMemo(() => {
    if (!containerWidth || scenes.length === 0) {
      return {
        startIndex: 0,
        endIndex: 0,
        visibleItems: [],
        totalWidth: 0,
        offsetX: 0,
      }
    }

    const itemTotalWidth = itemWidth + gap
    const visibleCount = Math.ceil(containerWidth / itemTotalWidth) + 2 // 버퍼 추가
    const startIndex = Math.max(0, Math.floor(scrollLeft / itemTotalWidth))
    const endIndex = Math.min(scenes.length - 1, startIndex + visibleCount)

    const visibleItems = scenes.slice(startIndex, endIndex + 1)
    const totalWidth = scenes.length * itemTotalWidth
    const offsetX = startIndex * itemTotalWidth

    return {
      startIndex,
      endIndex,
      visibleItems,
      totalWidth,
      offsetX,
    }
  }, [scenes, containerWidth, scrollLeft, itemWidth, gap])

  // 스크롤 위치 복원
  const scrollToIndex = useCallback((index) => {
    if (containerRef.current) {
      const itemTotalWidth = itemWidth + gap
      const scrollPosition = index * itemTotalWidth
      containerRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'smooth',
      })
    }
  }, [itemWidth, gap])

  // 특정 씬으로 스크롤
  const scrollToScene = useCallback((sceneId) => {
    const sceneIndex = scenes.findIndex(scene => scene.id === sceneId)
    if (sceneIndex !== -1) {
      scrollToIndex(sceneIndex)
    }
  }, [scenes, scrollToIndex])

  // 로딩 상태 표시
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: containerHeight,
          backgroundColor: 'var(--color-bg)',
          borderRadius: 'var(--spacing-border-radius)',
        }}
      >
        <Box sx={{ color: 'var(--color-accent)' }}>
          타임라인을 불러오는 중...
        </Box>
      </Box>
    )
  }

  // 빈 상태 표시
  if (scenes.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: containerHeight,
          backgroundColor: 'var(--color-bg)',
          borderRadius: 'var(--spacing-border-radius)',
          color: 'var(--color-text-secondary)',
        }}
      >
        콘티가 없습니다.
      </Box>
    )
  }

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        height: containerHeight,
        backgroundColor: 'var(--color-bg)',
        overflowX: 'auto',
        overflowY: 'hidden',
        position: 'relative',
        scrollBehavior: 'smooth',
        // 성능 최적화
        willChange: 'scroll-position',
        // 커스텀 스크롤바
        '&::-webkit-scrollbar': {
          height: '8px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'var(--color-timeline-track)',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'var(--color-accent)',
          borderRadius: '4px',
          '&:hover': {
            backgroundColor: 'var(--color-primary)',
          },
        },
        scrollbarWidth: 'thin',
        scrollbarColor: 'var(--color-accent) var(--color-timeline-track)',
      }}
      onScroll={handleScroll}
      {...props}
    >
      {/* 가상화된 컨테이너 */}
      <Box
        sx={{
          width: `${virtualization.totalWidth}px`,
          height: '100%',
          position: 'relative',
        }}
      >
        {/* 가시 영역의 아이템들만 렌더링 */}
        {virtualization.visibleItems.map((scene, index) => {
          const actualIndex = virtualization.startIndex + index
          const left = actualIndex * (itemWidth + gap)

          return (
            <Box
              key={scene.id || actualIndex}
              sx={{
                position: 'absolute',
                left: `${left}px`,
                top: '50%',
                transform: 'translateY(-50%)',
                width: `${itemWidth}px`,
                height: `${itemHeight}px`,
              }}
            >
              <SceneCard
                scene={scene}
                selected={selectedSceneId === scene.id}
                loading={scene.loading}
                onClick={() => onSceneClick?.(scene)}
                onEdit={() => onSceneEdit?.(scene)}
                onInfo={() => onSceneInfo?.(scene)}
              />
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

export default VirtualTimeline 