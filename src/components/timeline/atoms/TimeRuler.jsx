import React, { useMemo, useState, useCallback } from 'react'
import { Box, Typography } from '@mui/material'
import { 
  formatTimeFromSeconds,
  calculateTimeScale,
  timeToPixels,
  pixelsToTime,
  calculateTickInterval
} from '../../../utils/timelineUtils'

/**
 * 시간 눈금 컴포넌트
 * 타임라인 상단에 시간 표시를 제공하며, 줌 레벨에 따라 눈금 간격이 조정됨
 * V1/V2 트랙의 duration에 맞게 동기화됨
 * 화면 가로에 꽉 차게 설정되며, 확대/축소에 관계없이 초 단위와 눈금이 동기화됨
 */
const TimeRuler = ({
  totalDuration = 0,
  currentTime = 0,
  zoomLevel = 1,
  baseScale = 1,
  timeScale = null, // 외부에서 전달된 시간 스케일
  width = '100%',
  height = 40,
  showCurrentTime = true,
  showGrid = true,
  onTimeClick,
  sx = {}
}) => {
  const [hoverTime, setHoverTime] = useState(null)
  const [hoverPosition, setHoverPosition] = useState(0)

  // 시간 스케일 계산 - 외부에서 전달된 값 우선 사용
  const calculatedTimeScale = useMemo(() => {
    if (timeScale !== null) return timeScale
    return calculateTimeScale(zoomLevel, baseScale)
  }, [timeScale, zoomLevel, baseScale])

  // 타임라인 너비 계산 - 카드들과 동일한 방식 사용
  // 동적 시간 스케일 계산 - 외부에서 전달된 값 우선 사용
  const dynamicTimeScale = useMemo(() => {
    // 외부에서 전달된 timeScale이 있으면 우선 사용
    if (timeScale !== null) {
      console.log(`🎬 TimeRuler 외부 timeScale 사용: ${timeScale}`)
      return timeScale
    }
    
    // 그렇지 않으면 내부 계산
    const basePixelsPerSecond = 10 // 기본 1초당 10px
    const zoomedPixelsPerSecond = basePixelsPerSecond * zoomLevel
    const calculatedTimeScale = 1 / zoomedPixelsPerSecond // 픽셀당 시간 (초)
    
    console.log(`🎬 TimeRuler 내부 계산: zoomLevel=${zoomLevel}, pixelsPerSecond=${zoomedPixelsPerSecond}, timeScale=${calculatedTimeScale}`)
    return calculatedTimeScale
  }, [timeScale, zoomLevel])

  const timelineWidth = useMemo(() => {
    if (totalDuration <= 0) return 0
    // 카드들과 동일한 pixelsPerSecond 계산 사용
    const pixelsPerSecond = 1 / dynamicTimeScale
    const totalWidth = totalDuration * pixelsPerSecond
    const minWidth = Math.max(1000, totalWidth) // 최소 1000px 보장
    
    console.log(`🎬 TimeRuler timelineWidth: totalDuration=${totalDuration}s, dynamicTimeScale=${dynamicTimeScale}, pixelsPerSecond=${pixelsPerSecond}, totalWidth=${totalWidth}px, finalWidth=${minWidth}px`)
    return minWidth
  }, [totalDuration, dynamicTimeScale])

  // 줌 레벨에 따른 동적 눈금 간격 계산 - 초 단위 동기화
  const tickInterval = useMemo(() => {
    // 줌 레벨에 따라 눈금 간격 조정하되, 항상 초 단위와 동기화
    if (zoomLevel <= 1) return 60 // 1분 간격
    if (zoomLevel <= 2) return 30 // 30초 간격
    if (zoomLevel <= 4) return 10 // 10초 간격
    if (zoomLevel <= 8) return 5  // 5초 간격
    if (zoomLevel <= 16) return 2 // 2초 간격
    return 1 // 1초 간격
  }, [zoomLevel])

  // 줌 레벨에 따른 눈금 표시 간격 조정
  const displayTickInterval = useMemo(() => {
    // 줌 레벨이 높을수록 더 촘촘한 눈금 표시
    const baseInterval = tickInterval
    const zoomFactor = Math.max(1, zoomLevel / 4) // 줌 레벨에 따른 표시 간격 조정
    
    // 최소 1초, 최대 60초 간격으로 제한
    return Math.max(1, Math.min(60, Math.floor(baseInterval / zoomFactor)))
  }, [tickInterval, zoomLevel])

  // 눈금 표시 여부 결정
  const shouldDisplayTick = useCallback((time) => {
    // 줌 레벨에 따른 표시 조건
    if (zoomLevel <= 1) {
      return time % 60 === 0 // 1분 간격만 표시
    } else if (zoomLevel <= 2) {
      return time % 30 === 0 // 30초 간격 표시
    } else if (zoomLevel <= 4) {
      return time % 10 === 0 // 10초 간격 표시
    } else if (zoomLevel <= 8) {
      return time % 5 === 0 // 5초 간격 표시
    } else if (zoomLevel <= 16) {
      return time % 2 === 0 // 2초 간격 표시
    } else {
      return true // 모든 초 표시
    }
  }, [zoomLevel])

  // 눈금 위치 계산 - 동적 시간 스케일에 맞게 조정
  const ticks = useMemo(() => {
    if (totalDuration <= 0) return []
    
    const ticks = []
    const pixelsPerSecond = 1 / dynamicTimeScale
    
    // 줌 레벨에 따라 눈금 간격 조정
    let tickStep = 1
    if (zoomLevel <= 1) tickStep = 60 // 1분 간격
    else if (zoomLevel <= 2) tickStep = 30 // 30초 간격
    else if (zoomLevel <= 4) tickStep = 10 // 10초 간격
    else if (zoomLevel <= 8) tickStep = 5  // 5초 간격
    else if (zoomLevel <= 16) tickStep = 2 // 2초 간격
    else tickStep = 1 // 1초 간격
    
    // 0초부터 시작하여 동적 간격으로 눈금 생성
    for (let time = 0; time <= totalDuration; time += tickStep) {
      const position = time * pixelsPerSecond
      
      // 줌 레벨에 따른 주요 눈금 판별 - 초 단위 동기화
      const isMajor = time % 60 === 0 || // 1분 간격
                     (zoomLevel > 4 && time % 30 === 0) || // 30초 간격
                     (zoomLevel > 8 && time % 10 === 0) || // 10초 간격
                     (zoomLevel > 16 && time % 5 === 0)    // 5초 간격
      
      // 표시할 눈금만 필터링
      if (shouldDisplayTick(time)) {
        ticks.push({
          time,
          position,
          isMajor,
          displayTime: true
        })
      }
    }
    
    console.log(`🎬 TimeRuler 눈금 생성: totalDuration=${totalDuration}s, zoomLevel=${zoomLevel}, tickStep=${tickStep}, pixelsPerSecond=${pixelsPerSecond}, ticks=${ticks.length}개`)
    
    return ticks
  }, [totalDuration, dynamicTimeScale, zoomLevel, shouldDisplayTick])

  // 현재 시간 위치 계산 - 동적 시간 스케일에 맞게 조정
  const currentTimePosition = useMemo(() => {
    if (currentTime <= 0) {
      console.log('TimeRuler currentTimePosition: currentTime이 0 이하입니다')
      return 0
    }
    
    const pixelsPerSecond = 1 / dynamicTimeScale
    const position = currentTime * pixelsPerSecond
    
    console.log(`TimeRuler currentTimePosition: currentTime=${currentTime}s, dynamicTimeScale=${dynamicTimeScale}, pixelsPerSecond=${pixelsPerSecond}, position=${position}px`)
    
    return Math.max(0, position)
  }, [currentTime, dynamicTimeScale])

  // 시간 클릭 핸들러
  const handleTimeClick = (time) => {
    if (onTimeClick) {
      onTimeClick(time)
    }
  }

  // 마우스 클릭으로 시간 설정
  const handleRulerClick = (event) => {
    if (!onTimeClick) return
    
    const rect = event.currentTarget.getBoundingClientRect()
    const scrollContainer = event.currentTarget.closest('[data-scroll-container]')
    const scrollLeft = scrollContainer ? scrollContainer.scrollLeft : 0
    const clickX = event.clientX - rect.left + scrollLeft
    const pixelsPerSecond = 1 / dynamicTimeScale
    const clickedTime = clickX / pixelsPerSecond
    
    console.log('🎬 TimeRuler 클릭:', {
      clickX,
      scrollLeft,
      pixelsPerSecond,
      clickedTime
    })
    
    onTimeClick(Math.max(0, clickedTime))
  }

  // 마우스 호버 핸들러
  const handleMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const scrollContainer = event.currentTarget.closest('[data-scroll-container]')
    const scrollLeft = scrollContainer ? scrollContainer.scrollLeft : 0
    const mouseX = event.clientX - rect.left + scrollLeft
    const pixelsPerSecond = 1 / dynamicTimeScale
    const hoveredTime = mouseX / pixelsPerSecond
    
    setHoverPosition(mouseX)
    setHoverTime(Math.max(0, hoveredTime))
  }

  const handleMouseLeave = () => {
    setHoverTime(null)
    setHoverPosition(0)
  }

  return (
    <Box
      sx={{
        width: timelineWidth,
        height,
        position: 'relative',
        backgroundColor: 'var(--color-card-bg)',
        borderBottom: '1px solid var(--color-scene-card-border)',
        overflow: 'hidden',
        ...sx
      }}
      onClick={handleRulerClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* 눈금과 라벨 */}
      {ticks.map((tick, index) => (
        <Box
          key={index}
          sx={{
            position: 'absolute',
            left: tick.position,
            top: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: onTimeClick ? 'pointer' : 'default',
            '&:hover': onTimeClick ? {
              backgroundColor: 'rgba(212, 175, 55, 0.1)'
            } : {}
          }}
          onClick={() => handleTimeClick(tick.time)}
        >
          {/* 눈금 선 */}
          <Box
            sx={{
              width: tick.isMajor ? '2px' : '1px',
              height: tick.isMajor ? '12px' : '8px',
              backgroundColor: tick.isMajor ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              opacity: 0.6
            }}
          />
          
          {/* 시간 라벨 - 줌 레벨에 따른 동적 표시 */}
          {tick.displayTime && (
            <Typography
              variant="caption"
              sx={{
                font: 'var(--font-caption)',
                color: 'var(--color-text-secondary)',
                fontSize: zoomLevel > 8 ? '8px' : '10px',
                lineHeight: 1,
                mt: 0.5,
                userSelect: 'none'
              }}
            >
              {formatTimeFromSeconds(tick.time)}
            </Typography>
          )}
        </Box>
      ))}

      {/* 호버 시간 표시 */}
      {hoverTime !== null && (
        <Box
          sx={{
            position: 'absolute',
            left: hoverPosition,
            top: 0,
            bottom: 0,
            width: '2px',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            zIndex: 15,
            pointerEvents: 'none'
          }}
        />
      )}

      {/* 호버 시간 라벨 */}
      {hoverTime !== null && (
        <Box
          sx={{
            position: 'absolute',
            left: hoverPosition + 8,
            top: 4,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            fontSize: '10px',
            zIndex: 25,
            pointerEvents: 'none'
          }}
        >
          {formatTimeFromSeconds(hoverTime)}
        </Box>
      )}

      {/* 현재 시간 playhead */}
      <Box
        sx={{
          position: 'absolute',
          left: `${currentTimePosition}px`,
          top: 0,
          bottom: 0,
          width: '4px',
          backgroundColor: '#FFD700',
          zIndex: 30,
          boxShadow: '0 0 16px rgba(255, 215, 0, 0.8)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -8,
            left: -5,
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '12px solid #FFD700'
          }
        }}
      />

      {/* 그리드 라인 - 동적 시간 스케일에 맞게 조정 */}
      {showGrid && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `repeating-linear-gradient(
              90deg,
              transparent,
              transparent ${1 / dynamicTimeScale}px,
              rgba(160, 163, 177, 0.1) ${1 / dynamicTimeScale}px,
              rgba(160, 163, 177, 0.1) ${1 / dynamicTimeScale + 1}px
            )`,
            pointerEvents: 'none'
          }}
        />
      )}
    </Box>
  )
}

export default TimeRuler 