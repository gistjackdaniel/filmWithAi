import React, { useMemo } from 'react'
import { Box, Typography } from '@mui/material'
import { 
  formatTimeFromSeconds,
  calculateTimeScale,
  timeToPixels,
  pixelsToTime
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
  width = '100%',
  height = 40,
  showCurrentTime = true,
  showGrid = true,
  onTimeClick,
  sx = {}
}) => {
  // 시간 스케일 계산
  const timeScale = useMemo(() => {
    return calculateTimeScale(zoomLevel, baseScale)
  }, [zoomLevel, baseScale])

    // 눈금 간격 계산 - 10초 간격으로 고정
    const tickInterval = useMemo(() => {
      return 10 // 10초 간격으로 고정
    }, [])
  

  // 눈금 위치 계산
  const ticks = useMemo(() => {
    if (totalDuration <= 0) return []
    
    const ticks = []
    
    // 0초부터 시작하여 10초 간격으로 눈금 생성
    for (let time = 0; time <= totalDuration; time += tickInterval) {
      const position = timeToPixels(time, timeScale)
      ticks.push({
        time,
        position,
        isMajor: Math.abs(time % 60) < 0.0001 // 1분 단위 굵은 눈금
      })
    }
    
    return ticks
  }, [totalDuration, tickInterval, timeScale])

  // 현재 시간 위치 계산
  const currentTimePosition = useMemo(() => {
    return timeToPixels(currentTime, timeScale)
  }, [currentTime, timeScale])

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
              opacity: 0.6
            }}
          />
          
          {/* 시간 라벨 */}
          {tick.isMajor && (
            <Typography
              variant="caption"
              sx={{
                font: 'var(--font-caption)',
                color: 'var(--color-text-secondary)',
                fontSize: '10px',
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

      {/* 그리드 라인 (선택적) */}
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
              transparent ${tickInterval * timeScale}px,
              rgba(160, 163, 177, 0.1) ${tickInterval * timeScale}px,
              rgba(160, 163, 177, 0.1) ${tickInterval * timeScale + 1}px
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