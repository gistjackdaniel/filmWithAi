import React, { useState } from 'react'
import { 
  Box, 
  IconButton, 
  Typography, 
  Tooltip, 
  Slider, 
  Menu, 
  MenuItem,
  Button,
  TextField,
  InputAdornment
} from '@mui/material'
import { 
  ZoomIn, 
  ZoomOut, 
  Fullscreen,
  FullscreenExit,
  FitScreen,
  KeyboardArrowDown
} from '@mui/icons-material'

/**
 * 줌 컨트롤 컴포넌트
 * 타임라인의 줌 레벨을 조정하고 전체 보기 기능을 제공
 * - 긴 슬라이더 바로 정밀한 줌 조절
 * - 드롭다운으로 빠른 배율 선택
 * - 직접 입력으로 정확한 배율 설정
 */
const ZoomControls = ({
  zoomLevel = 1,
  minZoom = 0.5,
  maxZoom = 100,
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
  // 직접 입력 모드 상태
  const [isDirectInput, setIsDirectInput] = useState(false)
  // 직접 입력 값
  const [directInputValue, setDirectInputValue] = useState(zoomLevel.toString())

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
    const zoomValue = sliderValueToZoom(newValue)
    handleZoomChange(zoomValue)
  }

  // 전체 보기 핸들러
  const handleFitToScreen = () => {
    if (onFitToScreen) {
      onFitToScreen()
    }
  }

  // 직접 입력 핸들러
  const handleDirectInputChange = (event) => {
    const value = event.target.value
    setDirectInputValue(value)
  }

  const handleDirectInputKeyDown = (event) => {
    if (event.key === 'Enter') {
      const numValue = parseFloat(directInputValue)
      if (!isNaN(numValue) && numValue >= minZoom && numValue <= maxZoom) {
        handleZoomChange(numValue)
        setIsDirectInput(false)
      }
    } else if (event.key === 'Escape') {
      setDirectInputValue(zoomLevel.toString())
      setIsDirectInput(false)
    }
  }

  const handleDirectInputBlur = () => {
    const numValue = parseFloat(directInputValue)
    if (!isNaN(numValue) && numValue >= minZoom && numValue <= maxZoom) {
      handleZoomChange(numValue)
    } else {
      setDirectInputValue(zoomLevel.toString())
    }
    setIsDirectInput(false)
  }

  // 줌 레벨 옵션 (더 세밀한 배율 추가)
  const zoomOptions = [
    { label: '0.5x', value: 0.5 },
    { label: '1x', value: 1 },
    { label: '2x', value: 2 },
    { label: '4x', value: 4 },
    { label: '8x', value: 8 },
    { label: '16x', value: 16 },
    { label: '32x', value: 32 },
    { label: '50x', value: 50 },
    { label: '100x', value: 100 }
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

      {/* 줌 슬라이더 - 더 길게 */}
      {showSlider && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 200 }}>
          <Slider
            value={zoomToSliderValue(zoomLevel)}
            onChange={handleSliderChange}
            min={0}
            max={100}
            step={1}
            size="small"
            sx={{
              color: 'var(--color-accent)',
              minWidth: 150,
              '& .MuiSlider-thumb': {
                backgroundColor: 'var(--color-accent)',
                width: 16,
                height: 16,
              },
              '& .MuiSlider-track': {
                backgroundColor: 'var(--color-accent)',
                height: 3,
              },
              '& .MuiSlider-rail': {
                backgroundColor: 'var(--color-scene-card-border)',
                height: 3,
              }
            }}
          />
          
          {/* 줌 레벨 표시 - 클릭 가능한 드롭다운 */}
          {!isDirectInput ? (
            <Tooltip title="클릭하여 직접 입력">
              <Typography
                variant="caption"
                onClick={() => {
                  setIsDirectInput(true)
                  setDirectInputValue(zoomLevel.toString())
                }}
                sx={{
                  font: 'var(--font-caption)',
                  color: 'var(--color-text-secondary)',
                  minWidth: '45px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  border: '1px solid var(--color-scene-card-border)',
                  backgroundColor: 'var(--color-hover)',
                  '&:hover': {
                    backgroundColor: 'var(--color-hover)',
                    color: 'var(--color-accent)',
                    borderColor: 'var(--color-accent)',
                  }
                }}
              >
                {zoomLevel.toFixed(1)}x
              </Typography>
            </Tooltip>
          ) : (
            <TextField
              size="small"
              value={directInputValue}
              onChange={handleDirectInputChange}
              onKeyDown={handleDirectInputKeyDown}
              onBlur={handleDirectInputBlur}
              autoFocus
              variant="outlined"
              InputProps={{
                endAdornment: <InputAdornment position="end">x</InputAdornment>,
                sx: {
                  font: 'var(--font-caption)',
                  fontSize: '0.75rem',
                  height: '24px',
                  '& input': {
                    padding: '2px 4px',
                    textAlign: 'center',
                  }
                }
              }}
              sx={{
                width: '60px',
                '& .MuiOutlinedInput-root': {
                  height: '24px',
                  fontSize: '0.75rem',
                }
              }}
            />
          )}
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

      {/* 줌 레벨 드롭다운 메뉴 */}
      {showMenu && (
        <>
          <Tooltip title="빠른 배율 선택">
            <Button
              size="small"
              variant="outlined"
              onClick={(e) => setZoomMenuAnchor(e.currentTarget)}
              endIcon={<KeyboardArrowDown />}
                          sx={{
              minWidth: 'auto',
              px: 1,
              py: 0.5,
              fontSize: '0.75rem',
              color: 'var(--color-text-secondary)',
              borderColor: 'var(--color-scene-card-border)',
              backgroundColor: 'var(--color-card-bg)',
              '&:hover': {
                color: 'var(--color-accent)',
                borderColor: 'var(--color-accent)',
                backgroundColor: 'var(--color-hover)',
              }
            }}
            >
              배율
            </Button>
          </Tooltip>

          <Menu
            anchorEl={zoomMenuAnchor}
            open={Boolean(zoomMenuAnchor)}
            onClose={() => setZoomMenuAnchor(null)}
            PaperProps={{
              sx: {
                backgroundColor: 'var(--color-card-bg)',
                border: '1px solid var(--color-scene-card-border)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }
            }}
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
                    : 'var(--color-text-secondary)',
                  '&:hover': {
                    backgroundColor: 'var(--color-hover)',
                  },
                  '&.Mui-selected': {
                    backgroundColor: 'var(--color-accent-light)',
                    '&:hover': {
                      backgroundColor: 'var(--color-accent-light)',
                    }
                  }
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
    </Box>
  )
}

export default ZoomControls 