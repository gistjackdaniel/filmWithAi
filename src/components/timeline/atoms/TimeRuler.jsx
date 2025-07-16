import React, { useMemo } from 'react'
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
  scrollPosition = 0, // 스크롤 위치 추가
  sx = {}
}) => {
  // 시간 스케일 계산 - 외부에서 전달된 값 우선 사용
  const calculatedTimeScale = useMemo(() => {
    if (timeScale !== null) return timeScale
    return calculateTimeScale(zoomLevel, baseScale)
  }, [timeScale, zoomLevel, baseScale])

  // 줌 레벨에 따른 동적 눈금 간격 계산
  const tickInterval = useMemo(() => {
    return calculateTickInterval(zoomLevel)
  }, [zoomLevel])

  // 눈금 위치 계산
  const ticks = useMemo(() => {
    if (totalDuration <= 0) return []
    
    const ticks = []
    
    // 0초부터 시작하여 동적 간격으로 눈금 생성
    for (let time = 0; time <= totalDuration; time += tickInterval) {
      const position = timeToPixels(time, calculatedTimeScale)
      // 줌 레벨에 따른 주요 눈금 판별 로직 개선
      const isMajor = zoomLevel <= 1 ? time % 60 === 0 : // 낮은 줌에서는 1분 간격
                     zoomLevel <= 4 ? time % 30 === 0 : // 중간 줌에서는 30초 간격
                     zoomLevel <= 16 ? time % 10 === 0 : // 높은 줌에서는 10초 간격
                     time % 5 === 0 // 매우 높은 줌에서는 5초 간격
      
      ticks.push({
        time,
        position,
        isMajor
      })
    }
    
    return ticks
  }, [totalDuration, tickInterval, calculatedTimeScale, zoomLevel])

  // 현재 시간 위치 계산
  const currentTimePosition = useMemo(() => {
    return timeToPixels(currentTime, calculatedTimeScale)
  }, [currentTime, calculatedTimeScale])

  // 시간 클릭 핸들러
  const handleTimeClick = (time) => {
    if (onTimeClick) {
      onTimeClick(time)
    }
  }

  return (
    <Box
      sx={{
        width,
        height,
        position: 'relative',
        backgroundColor: 'var(--color-card-bg)',
        borderBottom: '1px solid var(--color-scene-card-border)',
        overflow: 'hidden',
        ...sx
      }}
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
              opacity: 0.6,
              transform: tick.isMajor ? 'translateX(-20px)' : 'none' // 굵은 눈금을 20픽셀 왼쪽으로 이동
            }}
          />
          
          {/* 시간 라벨 - 줌 레벨에 따라 표시 조건 조정 */}
          {tick.isMajor && (
            <Typography
              variant="caption"
              sx={{
                font: 'var(--font-caption)',
                color: 'var(--color-text-secondary)',
                fontSize: '10px',
                lineHeight: 1,
                mt: 0.5,
                userSelect: 'none',
                transform: 'translateX(-20px)' // 시간 라벨을 20픽셀 왼쪽으로 이동
              }}
            >
              {formatTimeFromSeconds(tick.time)}
            </Typography>
          )}
        </Box>
      ))}

      {/* 현재 시간 표시 */}
      {showCurrentTime && currentTime > 0 && (
        <Box
          sx={{
            position: 'absolute',
            left: currentTimePosition,
            top: 0,
            bottom: 0,
            width: '2px',
            backgroundColor: 'var(--color-accent)',
            zIndex: 10,
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-4px',
              width: '10px',
              height: '10px',
              backgroundColor: 'var(--color-accent)',
              borderRadius: '50%',
              transform: 'translateY(-50%)'
            }
          }}
        />
      )}

      {/* 그리드 라인 (선택적) - 동적 간격 적용 */}
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
              transparent ${tickInterval * calculatedTimeScale}px,
              rgba(160, 163, 177, 0.1) ${tickInterval * calculatedTimeScale}px,
              rgba(160, 163, 177, 0.1) ${tickInterval * calculatedTimeScale + 1}px
            )`,
            pointerEvents: 'none'
          }}
        />
      )}

      {/* 총 길이 표시 */}
      {totalDuration > 0 && (
        <Typography
          variant="caption"
          sx={{
            position: 'absolute',
            right: 8,
            top: 4,
            font: 'var(--font-caption)',
            color: 'var(--color-text-secondary)',
            fontSize: '10px',
            userSelect: 'none'
          }}
        >
          총 {formatTimeFromSeconds(totalDuration)}
        </Typography>
      )}
    </Box>
  )
}

export default TimeRuler 