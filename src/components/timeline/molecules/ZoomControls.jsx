import React, { useState } from 'react'
import { 
  Box, 
  IconButton, 
  Typography, 
  Tooltip, 
  Slider, 
  Menu, 
  MenuItem,
  Button
} from '@mui/material'
import { 
  ZoomIn, 
  ZoomOut, 
  Fullscreen,
  FullscreenExit,
  FitScreen
} from '@mui/icons-material'

/**
 * 줌 컨트롤 컴포넌트
 * 타임라인의 줌 레벨을 조정하고 전체 보기 기능을 제공
 */
const ZoomControls = ({
  zoomLevel = 1,
  minZoom = 0.5,
  maxZoom = 8,
  onZoomChange,
  onFitToScreen,
  showSlider = true,
  showButtons = true,
  showFitButton = true,
  showMenu = true,
  sx = {}
}) => {
  // 줌 메뉴 상태
  const [zoomMenuAnchor, setZoomMenuAnchor] = useState(null)

  // 줌 변경 핸들러
  const handleZoomChange = (newZoomLevel) => {
    if (onZoomChange) {
      onZoomChange(Math.max(minZoom, Math.min(maxZoom, newZoomLevel)))
    }
  }

  // 줌 인/아웃 핸들러
  const handleZoomIn = () => {
    const newZoom = Math.min(maxZoom, zoomLevel * 2)
    handleZoomChange(newZoom)
  }

  const handleZoomOut = () => {
    const newZoom = Math.max(minZoom, zoomLevel / 2)
    handleZoomChange(newZoom)
  }

  // 줌 슬라이더 핸들러
  const handleSliderChange = (event, newValue) => {
    handleZoomChange(newValue)
  }

  // 전체 보기 핸들러
  const handleFitToScreen = () => {
    if (onFitToScreen) {
      onFitToScreen()
    }
  }

  // 줌 레벨 옵션
  const zoomOptions = [
    { label: '0.5x', value: 0.5 },
    { label: '1x', value: 1 },
    { label: '2x', value: 2 },
    { label: '4x', value: 4 },
    { label: '8x', value: 8 }
  ]

  // 줌 레벨을 슬라이더 값으로 변환 (로그 스케일)
  const zoomToSliderValue = (zoom) => {
    return Math.log2(zoom / minZoom) / Math.log2(maxZoom / minZoom) * 100
  }

  // 슬라이더 값을 줌 레벨로 변환
  const sliderValueToZoom = (sliderValue) => {
    const ratio = sliderValue / 100
    return minZoom * Math.pow(maxZoom / minZoom, ratio)
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 1,
        backgroundColor: 'var(--color-card-bg)',
        borderRadius: '8px',
        border: '1px solid var(--color-scene-card-border)',
        ...sx
      }}
    >
      {/* 줌 아웃 버튼 */}
      {showButtons && (
        <Tooltip title="줌 아웃">
          <IconButton
            size="small"
            onClick={handleZoomOut}
            disabled={zoomLevel <= minZoom}
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
      )}

      {/* 줌 슬라이더 */}
      {showSlider && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
          <Slider
            value={zoomToSliderValue(zoomLevel)}
            onChange={handleSliderChange}
            min={0}
            max={100}
            step={1}
            size="small"
            sx={{
              color: 'var(--color-accent)',
              '& .MuiSlider-thumb': {
                backgroundColor: 'var(--color-accent)',
              },
              '& .MuiSlider-track': {
                backgroundColor: 'var(--color-accent)',
              },
              '& .MuiSlider-rail': {
                backgroundColor: 'var(--color-scene-card-border)',
              }
            }}
          />
          
          <Typography
            variant="caption"
            sx={{
              font: 'var(--font-caption)',
              color: 'var(--color-text-secondary)',
              minWidth: '35px',
              textAlign: 'center'
            }}
          >
            {zoomLevel.toFixed(1)}x
          </Typography>
        </Box>
      )}

      {/* 줌 인 버튼 */}
      {showButtons && (
        <Tooltip title="줌 인">
          <IconButton
            size="small"
            onClick={handleZoomIn}
            disabled={zoomLevel >= maxZoom}
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
      )}

      {/* 줌 레벨 메뉴 */}
      {showMenu && (
        <>
          <Tooltip title="줌 레벨 선택">
            <IconButton
              size="small"
              onClick={(e) => setZoomMenuAnchor(e.currentTarget)}
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
            anchorEl={zoomMenuAnchor}
            open={Boolean(zoomMenuAnchor)}
            onClose={() => setZoomMenuAnchor(null)}
          >
            {zoomOptions.map((option) => (
              <MenuItem
                key={option.value}
                onClick={() => {
                  handleZoomChange(option.value)
                  setZoomMenuAnchor(null)
                }}
                selected={Math.abs(zoomLevel - option.value) < 0.1}
                sx={{
                  font: 'var(--font-caption)',
                  color: Math.abs(zoomLevel - option.value) < 0.1
                    ? 'var(--color-accent)' 
                    : 'var(--color-text-secondary)'
                }}
              >
                {option.label}
              </MenuItem>
            ))}
          </Menu>
        </>
      )}

      {/* 전체 보기 버튼 */}
      {showFitButton && (
        <Tooltip title="전체 보기">
          <IconButton
            size="small"
            onClick={handleFitToScreen}
            sx={{
              color: 'var(--color-text-secondary)',
              '&:hover': {
                color: 'var(--color-accent)',
                backgroundColor: 'var(--color-hover)',
              }
            }}
          >
            <FitScreen fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {/* 줌 레벨 표시 (슬라이더가 없을 때) */}
      {!showSlider && (
        <Typography
          variant="body2"
          sx={{
            font: 'var(--font-body-2)',
            color: 'var(--color-accent)',
            fontWeight: 500,
            minWidth: '40px',
            textAlign: 'center'
          }}
        >
          {zoomLevel.toFixed(1)}x
        </Typography>
      )}
    </Box>
  )
}

export default ZoomControls 