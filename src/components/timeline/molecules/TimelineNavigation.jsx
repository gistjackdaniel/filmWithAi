import React from 'react'
import { Box, IconButton, Typography, Tooltip } from '@mui/material'
import { 
  ChevronLeft, 
  ChevronRight, 
  FirstPage, 
  LastPage,
  KeyboardArrowLeft,
  KeyboardArrowRight
} from '@mui/icons-material'

/**
 * 타임라인 네비게이션 컴포넌트
 * 스크롤 컨트롤 및 네비게이션 기능을 제공
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
  ...props
}) => {
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

      {/* 중앙: 씬 표시기 및 점프 버튼 */}
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