import React, { useState } from 'react'
import { Box, IconButton, Typography, Tooltip, TextField, Menu, MenuItem } from '@mui/material'
import { 
  ChevronLeft, 
  ChevronRight, 
  FirstPage, 
  LastPage,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  ZoomIn,
  ZoomOut,
  Schedule
} from '@mui/icons-material'
import { formatTimeFromSeconds } from '../../../utils/timelineUtils'

/**
 * 타임라인 네비게이션 컴포넌트
 * 스크롤 컨트롤 및 네비게이션 기능을 제공
 * 시간 기반 네비게이션 기능 추가
 */
const TimelineNavigation = ({
  onScrollLeft,
  onScrollRight,
  onScrollToStart,
  onScrollToEnd,
  onScrollToScene,
  currentSceneIndex = 0,
  totalScenes = 0,
  canScrollLeft = false,
  canScrollRight = false,
  showSceneIndicator = true,
  showScrollButtons = true,
  showJumpButtons = true,
  // 시간 기반 네비게이션 props
  currentTime = 0,
  totalDuration = 0,
  zoomLevel = 1,
  onZoomChange,
  onTimeJump,
  showTimeNavigation = true,
  showZoomControls = true,
  ...props
}) => {
  // 시간 점프 메뉴 상태
  const [timeJumpAnchor, setTimeJumpAnchor] = useState(null)
  const [timeJumpValue, setTimeJumpValue] = useState('')
  
  // 줌 메뉴 상태
  const [zoomAnchor, setZoomAnchor] = useState(null)
  // 씬 점프 버튼들 (최대 5개씩 표시)
  const getSceneJumpButtons = () => {
    if (totalScenes <= 1) return []

    const buttons = []
    const maxButtons = 5
    const step = Math.max(1, Math.floor(totalScenes / maxButtons))

    for (let i = 0; i < totalScenes; i += step) {
      if (buttons.length >= maxButtons) break
      buttons.push(i)
    }

    // 마지막 씬이 포함되지 않았다면 추가
    if (buttons[buttons.length - 1] !== totalScenes - 1) {
      buttons[buttons.length - 1] = totalScenes - 1
    }

    return buttons
  }

  const sceneJumpButtons = getSceneJumpButtons()

  // 시간 점프 핸들러
  const handleTimeJump = () => {
    if (timeJumpValue && onTimeJump) {
      const timeInSeconds = parseTimeInput(timeJumpValue)
      if (timeInSeconds >= 0) {
        onTimeJump(timeInSeconds)
        setTimeJumpValue('')
      }
    }
    setTimeJumpAnchor(null)
  }

  // 시간 입력 파싱 (HH:MM:SS 또는 MM:SS 형식)
  const parseTimeInput = (input) => {
    const parts = input.split(':').map(Number)
    if (parts.length === 2) {
      // MM:SS 형식
      return parts[0] * 60 + parts[1]
    } else if (parts.length === 3) {
      // HH:MM:SS 형식
      return parts[0] * 3600 + parts[1] * 60 + parts[2]
    }
    return -1
  }

  // 줌 변경 핸들러
  const handleZoomChange = (newZoomLevel) => {
    if (onZoomChange) {
      onZoomChange(newZoomLevel)
    }
    setZoomAnchor(null)
  }

  // 미리 정의된 시간 점프 옵션
  const timeJumpOptions = [
    { label: '30초', value: 30 },
    { label: '1분', value: 60 },
    { label: '2분', value: 120 },
    { label: '5분', value: 300 },
    { label: '10분', value: 600 }
  ]

  // 줌 레벨 옵션
  const zoomOptions = [
    { label: '0.5x', value: 0.5 },
    { label: '1x', value: 1 },
    { label: '2x', value: 2 },
    { label: '4x', value: 4 },
    { label: '8x', value: 8 }
  ]

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        padding: 'var(--spacing-component-padding)',
        backgroundColor: 'var(--color-card-bg)',
        borderRadius: 'var(--spacing-border-radius)',
        border: '1px solid var(--color-border)',
      }}
      {...props}
    >
      {/* 좌측 네비게이션 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {showJumpButtons && (
          <Tooltip title="처음으로">
            <span>
              <IconButton
                size="small"
                onClick={onScrollToStart}
                disabled={!canScrollLeft}
                sx={{
                  color: 'var(--color-text-secondary)',
                  '&:hover': {
                    color: 'var(--color-accent)',
                    backgroundColor: 'var(--color-hover)',
                  },
                  '&.Mui-disabled': {
                    color: 'var(--color-text-disabled)',
                  }
                }}
              >
                <FirstPage fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        )}

        {showScrollButtons && (
          <Tooltip title="왼쪽으로 스크롤">
            <span>
              <IconButton
                size="small"
                onClick={onScrollLeft}
                disabled={!canScrollLeft}
                sx={{
                  color: 'var(--color-text-secondary)',
                  '&:hover': {
                    color: 'var(--color-accent)',
                    backgroundColor: 'var(--color-hover)',
                  },
                  '&.Mui-disabled': {
                    color: 'var(--color-text-disabled)',
                  }
                }}
              >
                <ChevronLeft fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Box>

      {/* 중앙: 씬 표시기, 시간 정보 및 컨트롤 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {/* 씬 정보 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {showSceneIndicator && totalScenes > 0 && (
            <Typography
              variant="body2"
              sx={{
                font: 'var(--font-body-2)',
                color: 'var(--color-text-secondary)',
                whiteSpace: 'nowrap',
                minWidth: 'fit-content'
              }}
            >
              씬 {currentSceneIndex + 1} / {totalScenes}
            </Typography>
          )}

          {/* 씬 점프 버튼들 */}
          {sceneJumpButtons.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {sceneJumpButtons.map((sceneIndex) => (
                <Tooltip 
                  key={sceneIndex} 
                  title={`씬 ${sceneIndex + 1}로 이동`}
                >
                  <IconButton
                    size="small"
                    onClick={() => onScrollToScene?.(sceneIndex)}
                    sx={{
                      width: 24,
                      height: 24,
                      fontSize: '10px',
                      color: sceneIndex === currentSceneIndex 
                        ? 'var(--color-accent)' 
                        : 'var(--color-text-secondary)',
                      backgroundColor: sceneIndex === currentSceneIndex 
                        ? 'var(--color-accent-bg)' 
                        : 'transparent',
                      '&:hover': {
                        color: 'var(--color-accent)',
                        backgroundColor: 'var(--color-hover)',
                      }
                    }}
                  >
                    {sceneIndex + 1}
                  </IconButton>
                </Tooltip>
              ))}
            </Box>
          )}
        </Box>

        {/* 시간 정보 및 컨트롤 */}
        {showTimeNavigation && totalDuration > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* 현재 시간 표시 */}
            <Typography
              variant="body2"
              sx={{
                font: 'var(--font-body-2)',
                color: 'var(--color-accent)',
                whiteSpace: 'nowrap',
                minWidth: 'fit-content'
              }}
            >
              {formatTimeFromSeconds(currentTime)}
            </Typography>

            {/* 시간 점프 버튼 */}
            <Tooltip title="시간으로 이동">
              <IconButton
                size="small"
                onClick={(e) => setTimeJumpAnchor(e.currentTarget)}
                sx={{
                  color: 'var(--color-text-secondary)',
                  '&:hover': {
                    color: 'var(--color-accent)',
                    backgroundColor: 'var(--color-hover)',
                  }
                }}
              >
                <Schedule fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* 시간 점프 메뉴 */}
            <Menu
              anchorEl={timeJumpAnchor}
              open={Boolean(timeJumpAnchor)}
              onClose={() => setTimeJumpAnchor(null)}
            >
              <Box sx={{ p: 1, minWidth: 200 }}>
                <Typography
                  variant="body2"
                  sx={{
                    font: 'var(--font-body-2)',
                    color: 'var(--color-text-primary)',
                    mb: 1
                  }}
                >
                  시간으로 이동
                </Typography>
                
                <TextField
                  size="small"
                  placeholder="MM:SS 또는 HH:MM:SS"
                  value={timeJumpValue}
                  onChange={(e) => setTimeJumpValue(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleTimeJump()
                    }
                  }}
                  sx={{ mb: 1, width: '100%' }}
                />
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {timeJumpOptions.map((option) => (
                    <MenuItem
                      key={option.value}
                      onClick={() => {
                        if (onTimeJump) onTimeJump(option.value)
                        setTimeJumpAnchor(null)
                      }}
                      sx={{
                        font: 'var(--font-caption)',
                        color: 'var(--color-text-secondary)'
                      }}
                    >
                      {option.label} 앞으로
                    </MenuItem>
                  ))}
                </Box>
              </Box>
            </Menu>
          </Box>
        )}

        {/* 줌 컨트롤 */}
        {showZoomControls && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title="줌 아웃">
              <IconButton
                size="small"
                onClick={() => handleZoomChange(Math.max(0.5, zoomLevel / 2))}
                disabled={zoomLevel <= 0.5}
                sx={{
                  color: 'var(--color-text-secondary)',
                  '&:hover': {
                    color: 'var(--color-accent)',
                    backgroundColor: 'var(--color-hover)',
                  },
                  '&.Mui-disabled': {
                    color: 'var(--color-text-disabled)',
                  }
                }}
              >
                <ZoomOut fontSize="small" />
              </IconButton>
            </Tooltip>

            <Typography
              variant="caption"
              sx={{
                font: 'var(--font-caption)',
                color: 'var(--color-text-secondary)',
                minWidth: '30px',
                textAlign: 'center'
              }}
            >
              {zoomLevel}x
            </Typography>

            <Tooltip title="줌 인">
              <IconButton
                size="small"
                onClick={() => handleZoomChange(Math.min(8, zoomLevel * 2))}
                disabled={zoomLevel >= 8}
                sx={{
                  color: 'var(--color-text-secondary)',
                  '&:hover': {
                    color: 'var(--color-accent)',
                    backgroundColor: 'var(--color-hover)',
                  },
                  '&.Mui-disabled': {
                    color: 'var(--color-text-disabled)',
                  }
                }}
              >
                <ZoomIn fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* 줌 레벨 메뉴 */}
            <Tooltip title="줌 레벨 선택">
              <IconButton
                size="small"
                onClick={(e) => setZoomAnchor(e.currentTarget)}
                sx={{
                  color: 'var(--color-text-secondary)',
                  '&:hover': {
                    color: 'var(--color-accent)',
                    backgroundColor: 'var(--color-hover)',
                  }
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    font: 'var(--font-caption)',
                    color: 'inherit'
                  }}
                >
                  ▼
                </Typography>
              </IconButton>
            </Tooltip>

            <Menu
              anchorEl={zoomAnchor}
              open={Boolean(zoomAnchor)}
              onClose={() => setZoomAnchor(null)}
            >
              {zoomOptions.map((option) => (
                <MenuItem
                  key={option.value}
                  onClick={() => handleZoomChange(option.value)}
                  selected={zoomLevel === option.value}
                  sx={{
                    font: 'var(--font-caption)',
                    color: zoomLevel === option.value 
                      ? 'var(--color-accent)' 
                      : 'var(--color-text-secondary)'
                  }}
                >
                  {option.label}
                </MenuItem>
              ))}
            </Menu>
          </Box>
        )}
      </Box>

      {/* 우측 네비게이션 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {showScrollButtons && (
          <Tooltip title="오른쪽으로 스크롤">
            <span>
              <IconButton
                size="small"
                onClick={onScrollRight}
                disabled={!canScrollRight}
                sx={{
                  color: 'var(--color-text-secondary)',
                  '&:hover': {
                    color: 'var(--color-accent)',
                    backgroundColor: 'var(--color-hover)',
                  },
                  '&.Mui-disabled': {
                    color: 'var(--color-text-disabled)',
                  }
                }}
              >
                <ChevronRight fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        )}

        {showJumpButtons && (
          <Tooltip title="마지막으로">
            <span>
              <IconButton
                size="small"
                onClick={onScrollToEnd}
                disabled={!canScrollRight}
                sx={{
                  color: 'var(--color-text-secondary)',
                  '&:hover': {
                    color: 'var(--color-accent)',
                    backgroundColor: 'var(--color-hover)',
                  },
                  '&.Mui-disabled': {
                    color: 'var(--color-text-disabled)',
                  }
                }}
              >
                <LastPage fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Box>
    </Box>
  )
}

export default TimelineNavigation 