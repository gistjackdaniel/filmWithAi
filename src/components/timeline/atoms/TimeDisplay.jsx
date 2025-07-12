import React, { useMemo } from 'react'
import { Box, Typography, Chip } from '@mui/material'
import { 
  formatTimeFromSeconds,
  formatTimeHumanReadable,
  calculateTotalDuration,
  calculateSceneStartTime,
  calculateSceneEndTime,
  calculateSceneDuration
} from '../../../utils/timelineUtils'

/**
 * 시간 정보 표시 컴포넌트
 * 전체 동영상 길이, 현재 선택된 씬의 시간 정보, 시간 통계 등을 표시
 */
const TimeDisplay = ({
  scenes = [],
  selectedScene = null,
  currentTime = 0,
  totalDuration = 0,
  showStatistics = true,
  showSelectedSceneInfo = true,
  showProgress = true,
  sx = {}
}) => {
  // 전체 지속 시간 계산
  const calculatedTotalDuration = useMemo(() => {
    if (totalDuration > 0) return totalDuration
    return calculateTotalDuration(scenes)
  }, [scenes, totalDuration])

  // 선택된 씬의 시간 정보
  const selectedSceneTimeInfo = useMemo(() => {
    if (!selectedScene || !scenes.length) return null
    
    const sceneIndex = scenes.findIndex(scene => scene.id === selectedScene.id)
    if (sceneIndex === -1) return null
    
    const startTime = calculateSceneStartTime(scenes, sceneIndex)
    const endTime = calculateSceneEndTime(scenes, sceneIndex)
    const duration = calculateSceneDuration(selectedScene)
    
    return {
      startTime,
      endTime,
      duration,
      sceneNumber: selectedScene.scene || sceneIndex + 1
    }
  }, [selectedScene, scenes])

  // 시간 통계 계산
  const timeStatistics = useMemo(() => {
    if (!scenes.length) return null
    
    let totalLiveActionTime = 0
    let totalGeneratedTime = 0
    let liveActionCount = 0
    let generatedCount = 0
    
    scenes.forEach(scene => {
      const duration = calculateSceneDuration(scene)
      if (scene.type === 'live_action') {
        totalLiveActionTime += duration
        liveActionCount++
      } else {
        totalGeneratedTime += duration
        generatedCount++
      }
    })
    
    return {
      totalLiveActionTime,
      totalGeneratedTime,
      liveActionCount,
      generatedCount,
      totalScenes: scenes.length
    }
  }, [scenes])

  // 진행률 계산
  const progressPercentage = useMemo(() => {
    if (calculatedTotalDuration <= 0) return 0
    return Math.min(100, (currentTime / calculatedTotalDuration) * 100)
  }, [currentTime, calculatedTotalDuration])

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        p: 2,
        backgroundColor: 'var(--color-card-bg)',
        borderRadius: '8px',
        border: '1px solid var(--color-scene-card-border)',
        ...sx
      }}
    >
      {/* 전체 시간 정보 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography
          variant="h6"
          sx={{
            font: 'var(--font-heading-2)',
            color: 'var(--color-text-primary)'
          }}
        >
          전체 길이
        </Typography>
        <Typography
          variant="body1"
          sx={{
            font: 'var(--font-body-1)',
            color: 'var(--color-accent)',
            fontWeight: 500
          }}
        >
          {formatTimeFromSeconds(calculatedTotalDuration)}
        </Typography>
      </Box>

      {/* 현재 시간 및 진행률 */}
      {showProgress && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography
              variant="body2"
              sx={{
                font: 'var(--font-body-2)',
                color: 'var(--color-text-secondary)'
              }}
            >
              현재 시간
            </Typography>
            <Typography
              variant="body2"
              sx={{
                font: 'var(--font-body-2)',
                color: 'var(--color-text-primary)'
              }}
            >
              {formatTimeFromSeconds(currentTime)}
            </Typography>
          </Box>
          
          {/* 진행률 바 */}
          <Box
            sx={{
              width: '100%',
              height: '4px',
              backgroundColor: 'var(--color-scene-card-border)',
              borderRadius: '2px',
              overflow: 'hidden'
            }}
          >
            <Box
              sx={{
                width: `${progressPercentage}%`,
                height: '100%',
                backgroundColor: 'var(--color-accent)',
                transition: 'width 0.3s ease'
              }}
            />
          </Box>
          
          <Typography
            variant="caption"
            sx={{
              font: 'var(--font-caption)',
              color: 'var(--color-text-secondary)',
              textAlign: 'center'
            }}
          >
            {progressPercentage.toFixed(1)}% 완료
          </Typography>
        </Box>
      )}

      {/* 선택된 씬 정보 */}
      {showSelectedSceneInfo && selectedSceneTimeInfo && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography
            variant="body2"
            sx={{
              font: 'var(--font-body-2)',
              color: 'var(--color-text-primary)',
              fontWeight: 500
            }}
          >
            선택된 씬 #{selectedSceneTimeInfo.sceneNumber}
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography
              variant="caption"
              sx={{
                font: 'var(--font-caption)',
                color: 'var(--color-text-secondary)'
              }}
            >
              시작 시간
            </Typography>
            <Typography
              variant="caption"
              sx={{
                font: 'var(--font-caption)',
                color: 'var(--color-text-primary)'
              }}
            >
              {formatTimeFromSeconds(selectedSceneTimeInfo.startTime)}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography
              variant="caption"
              sx={{
                font: 'var(--font-caption)',
                color: 'var(--color-text-secondary)'
              }}
            >
              종료 시간
            </Typography>
            <Typography
              variant="caption"
              sx={{
                font: 'var(--font-caption)',
                color: 'var(--color-text-primary)'
              }}
            >
              {formatTimeFromSeconds(selectedSceneTimeInfo.endTime)}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography
              variant="caption"
              sx={{
                font: 'var(--font-caption)',
                color: 'var(--color-text-secondary)'
              }}
            >
              지속 시간
            </Typography>
            <Typography
              variant="caption"
              sx={{
                font: 'var(--font-caption)',
                color: 'var(--color-accent)'
              }}
            >
              {formatTimeFromSeconds(selectedSceneTimeInfo.duration)}
            </Typography>
          </Box>
        </Box>
      )}

      {/* 시간 통계 */}
      {showStatistics && timeStatistics && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography
            variant="body2"
            sx={{
              font: 'var(--font-body-2)',
              color: 'var(--color-text-primary)',
              fontWeight: 500
            }}
          >
            시간 통계
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={`실사 촬영: ${formatTimeFromSeconds(timeStatistics.totalLiveActionTime)}`}
              size="small"
              sx={{
                backgroundColor: 'rgba(46, 204, 113, 0.2)',
                color: 'var(--color-success)',
                font: 'var(--font-caption)'
              }}
            />
            <Chip
              label={`AI 생성: ${formatTimeFromSeconds(timeStatistics.totalGeneratedTime)}`}
              size="small"
              sx={{
                backgroundColor: 'rgba(212, 175, 55, 0.2)',
                color: 'var(--color-accent)',
                font: 'var(--font-caption)'
              }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography
              variant="caption"
              sx={{
                font: 'var(--font-caption)',
                color: 'var(--color-text-secondary)'
              }}
            >
              실사 촬영 씬
            </Typography>
            <Typography
              variant="caption"
              sx={{
                font: 'var(--font-caption)',
                color: 'var(--color-success)'
              }}
            >
              {timeStatistics.liveActionCount}개
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography
              variant="caption"
              sx={{
                font: 'var(--font-caption)',
                color: 'var(--color-text-secondary)'
              }}
            >
              AI 생성 씬
            </Typography>
            <Typography
              variant="caption"
              sx={{
                font: 'var(--font-caption)',
                color: 'var(--color-accent)'
              }}
            >
              {timeStatistics.generatedCount}개
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  )
}

export default TimeDisplay 