import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Box, IconButton, Tooltip, LinearProgress } from '@mui/material'
import { 
  ZoomIn, 
  ZoomOut, 
  RotateRight,
  Fullscreen,
  FullscreenExit,
  Error,
  Refresh
} from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'

/**
 * 컷 이미지 컴포넌트
 * 이미지 로딩, 에러 처리, 줌 및 패닝 기능 제공
 */
const CutImage = ({
  src,
  alt,
  onLoadingChange,
  onError,
  style = {},
  className = '',
  showControls = true,
  maxZoom = 3,
  minZoom = 0.5
}) => {
  const theme = useTheme()
  const imageRef = useRef(null)
  const containerRef = useRef(null)
  
  // 상태 관리
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [rotation, setRotation] = useState(0)

  /**
   * 이미지 로딩 시작
   */
  const handleLoadStart = useCallback(() => {
    setIsLoading(true)
    setError(null)
    onLoadingChange?.(true)
  }, [onLoadingChange])

  /**
   * 이미지 로딩 완료
   */
  const handleLoad = useCallback(() => {
    setIsLoading(false)
    onLoadingChange?.(false)
  }, [onLoadingChange])

  /**
   * 이미지 에러 처리
   */
  const handleError = useCallback((e) => {
    setError(e)
    setIsLoading(false)
    onLoadingChange?.(false)
    onError?.(e)
  }, [onLoadingChange, onError])

  /**
   * 줌 인
   */
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.2, maxZoom))
  }, [maxZoom])

  /**
   * 줌 아웃
   */
  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.2, minZoom))
  }, [minZoom])

  /**
   * 줌 리셋
   */
  const handleZoomReset = useCallback(() => {
    setZoom(1)
    setPosition({ x: 0, y: 0 })
    setRotation(0)
  }, [])

  /**
   * 회전
   */
  const handleRotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360)
  }, [])

  /**
   * 전체화면 토글
   */
  const handleFullscreenToggle = useCallback(() => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        containerRef.current.requestFullscreen()
      }
    }
  }, [])

  /**
   * 마우스 휠 줌
   */
  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoom(prev => Math.max(minZoom, Math.min(maxZoom, prev + delta)))
  }, [minZoom, maxZoom])

  /**
   * 마우스 드래그 시작
   */
  const handleMouseDown = useCallback((e) => {
    if (zoom > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }, [zoom, position])

  /**
   * 마우스 드래그 중
   */
  const handleMouseMove = useCallback((e) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }, [isDragging, zoom, dragStart])

  /**
   * 마우스 드래그 종료
   */
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  /**
   * 더블클릭 줌 리셋
   */
  const handleDoubleClick = useCallback(() => {
    handleZoomReset()
  }, [handleZoomReset])

  // 전체화면 변경 감지
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  // 마우스 이벤트 리스너
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        cursor: isDragging ? 'grabbing' : zoom > 1 ? 'grab' : 'default',
        userSelect: 'none'
      }}
      className={className}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {/* 이미지 컨테이너 */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}
      >
        {/* 로딩 오버레이 */}
        {isLoading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.1)',
              zIndex: 2
            }}
          >
            <LinearProgress sx={{ width: '80%' }} />
          </Box>
        )}

        {/* 에러 오버레이 */}
        {error && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.1)',
              zIndex: 2
            }}
          >
            <Error color="error" sx={{ fontSize: 32, mb: 1 }} />
            <IconButton onClick={() => window.location.reload()}>
              <Refresh />
            </IconButton>
          </Box>
        )}

        {/* 이미지 */}
        {!error && (
          <img
            ref={imageRef}
            src={src}
            alt={alt}
            style={{
              ...style,
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
              transition: isDragging ? 'none' : 'transform 0.2s ease',
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain'
            }}
            onLoadStart={handleLoadStart}
            onLoad={handleLoad}
            onError={handleError}
          />
        )}
      </Box>

      {/* 컨트롤 오버레이 */}
      {showControls && !isLoading && !error && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            zIndex: 3
          }}
        >
          {/* 줌 컨트롤 */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Tooltip title="줌 인">
              <IconButton 
                onClick={handleZoomIn} 
                size="small"
                disabled={zoom >= maxZoom}
                sx={{ 
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.8)'
                  }
                }}
              >
                <ZoomIn />
              </IconButton>
            </Tooltip>

            <Tooltip title="줌 아웃">
              <IconButton 
                onClick={handleZoomOut} 
                size="small"
                disabled={zoom <= minZoom}
                sx={{ 
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.8)'
                  }
                }}
              >
                <ZoomOut />
              </IconButton>
            </Tooltip>
          </Box>

          {/* 기타 컨트롤 */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Tooltip title="회전">
              <IconButton 
                onClick={handleRotate} 
                size="small"
                sx={{ 
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.8)'
                  }
                }}
              >
                <RotateRight />
              </IconButton>
            </Tooltip>

            <Tooltip title={isFullscreen ? '전체화면 종료' : '전체화면'}>
              <IconButton 
                onClick={handleFullscreenToggle} 
                size="small"
                sx={{ 
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.8)'
                  }
                }}
              >
                {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      )}

      {/* 줌 레벨 표시 */}
      {showControls && zoom !== 1 && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: 'white',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            fontSize: '0.75rem',
            zIndex: 3
          }}
        >
          {Math.round(zoom * 100)}%
        </Box>
      )}
    </Box>
  )
}

export default CutImage 