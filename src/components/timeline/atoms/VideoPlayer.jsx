import React, { useState, useRef, useCallback, useEffect } from 'react'
import { 
  Box, 
  IconButton, 
  Slider, 
  Typography, 
  LinearProgress,
  Tooltip,
  Chip
} from '@mui/material'
import {
  PlayArrow,
  Pause,
  VolumeUp,
  VolumeOff,
  Fullscreen,
  FullscreenExit,
  Settings,
  Error,
  Refresh
} from '@mui/icons-material'

/**
 * V2 타임라인용 비디오 플레이어 컴포넌트
 * HTML5 video 태그 기반 비디오 재생
 * 재생 컨트롤 (재생/일시정지, 볼륨, 진행률)
 * 비디오 썸네일 생성
 */
const VideoPlayer = ({
  src,
  poster,
  volume = 0.8,
  onLoadingChange,
  onError,
  controls = true,
  style = {},
  className = '',
  ...props
}) => {
  const videoRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volumeLevel, setVolumeLevel] = useState(volume)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showControls, setShowControls] = useState(true)

  // 비디오 로딩 상태 관리
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isLoading)
    }
  }, [isLoading, onLoadingChange])

  // 볼륨 변경 핸들러
  const handleVolumeChange = useCallback((event, newValue) => {
    const newVolume = newValue / 100
    setVolumeLevel(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
    }
    if (newVolume === 0) {
      setIsMuted(true)
    } else {
      setIsMuted(false)
    }
  }, [])

  // 음소거 토글 핸들러
  const handleMuteToggle = useCallback(() => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volumeLevel
        setIsMuted(false)
      } else {
        videoRef.current.volume = 0
        setIsMuted(true)
      }
    }
  }, [isMuted, volumeLevel])

  // 재생/일시정지 토글 핸들러
  const handlePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
  }, [isPlaying])

  // 전체화면 토글 핸들러
  const handleFullscreenToggle = useCallback(() => {
    if (videoRef.current) {
      if (!isFullscreen) {
        if (videoRef.current.requestFullscreen) {
          videoRef.current.requestFullscreen()
        } else if (videoRef.current.webkitRequestFullscreen) {
          videoRef.current.webkitRequestFullscreen()
        } else if (videoRef.current.msRequestFullscreen) {
          videoRef.current.msRequestFullscreen()
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen()
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen()
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen()
        }
      }
    }
  }, [isFullscreen])

  // 진행률 변경 핸들러
  const handleSeek = useCallback((event, newValue) => {
    if (videoRef.current) {
      const newTime = (newValue / 100) * duration
      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }, [duration])

  // 시간 포맷팅 함수
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  // 비디오 이벤트 핸들러들
  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
      setIsLoading(false)
      setError(null)
    }
  }, [])

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }, [])

  const handlePlay = useCallback(() => {
    setIsPlaying(true)
  }, [])

  const handlePause = useCallback(() => {
    setIsPlaying(false)
  }, [])

  const handleEnded = useCallback(() => {
    setIsPlaying(false)
    setCurrentTime(0)
  }, [])

  const handleError = useCallback((error) => {
    console.error('Video error:', error)
    setError(error)
    setIsLoading(false)
    if (onError) {
      onError(error)
    }
  }, [onError])

  const handleLoadStart = useCallback(() => {
    setIsLoading(true)
    setError(null)
  }, [])

  const handleCanPlay = useCallback(() => {
    setIsLoading(false)
  }, [])

  // 전체화면 변경 감지
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('msfullscreenchange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('msfullscreenchange', handleFullscreenChange)
    }
  }, [])

  // 컨트롤 자동 숨김
  useEffect(() => {
    let timeout
    if (showControls && isPlaying) {
      timeout = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }
    return () => clearTimeout(timeout)
  }, [showControls, isPlaying])

  // 마우스 움직임 감지
  const handleMouseMove = useCallback(() => {
    setShowControls(true)
  }, [])

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: 'var(--color-bg)',
        borderRadius: 1,
        overflow: 'hidden',
        cursor: 'pointer',
        '&:hover .video-controls': {
          opacity: 1
        }
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className={className}
    >
      {/* 비디오 요소 */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          ...style
        }}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onError={handleError}
        onLoadStart={handleLoadStart}
        onCanPlay={handleCanPlay}
        {...props}
      />

      {/* 로딩 상태 */}
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
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 2
          }}
        >
          <LinearProgress sx={{ width: '80%' }} />
        </Box>
      )}

      {/* 에러 상태 */}
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
            backgroundColor: 'rgba(0,0,0,0.8)',
            zIndex: 3
          }}
        >
          <Error color="error" sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="body1" color="error" sx={{ mb: 1 }}>
            비디오 로딩 실패
          </Typography>
          <IconButton onClick={() => window.location.reload()}>
            <Refresh />
          </IconButton>
        </Box>
      )}

      {/* 비디오 컨트롤 */}
      {controls && (
        <Box
          className="video-controls"
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
            padding: 2,
            opacity: showControls ? 1 : 0,
            transition: 'opacity 0.3s ease',
            zIndex: 1
          }}
        >
          {/* 진행률 바 */}
          <Slider
            value={duration > 0 ? (currentTime / duration) * 100 : 0}
            onChange={handleSeek}
            sx={{
              color: 'var(--color-accent)',
              '& .MuiSlider-thumb': {
                width: 12,
                height: 12,
                backgroundColor: 'var(--color-accent)'
              },
              '& .MuiSlider-track': {
                backgroundColor: 'var(--color-accent)'
              }
            }}
          />

          {/* 컨트롤 버튼들 */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* 재생/일시정지 버튼 */}
              <Tooltip title={isPlaying ? '일시정지' : '재생'}>
                <IconButton onClick={handlePlayPause} size="small" sx={{ color: 'white' }}>
                  {isPlaying ? <Pause /> : <PlayArrow />}
                </IconButton>
              </Tooltip>

              {/* 음소거 버튼 */}
              <Tooltip title={isMuted ? '음소거 해제' : '음소거'}>
                <IconButton onClick={handleMuteToggle} size="small" sx={{ color: 'white' }}>
                  {isMuted ? <VolumeOff /> : <VolumeUp />}
                </IconButton>
              </Tooltip>

              {/* 볼륨 슬라이더 */}
              <Box sx={{ width: 100, display: 'flex', alignItems: 'center' }}>
                <Slider
                  value={isMuted ? 0 : volumeLevel * 100}
                  onChange={handleVolumeChange}
                  size="small"
                  sx={{
                    color: 'var(--color-accent)',
                    '& .MuiSlider-thumb': {
                      width: 8,
                      height: 8,
                      backgroundColor: 'var(--color-accent)'
                    }
                  }}
                />
              </Box>

              {/* 시간 표시 */}
              <Typography variant="caption" sx={{ color: 'white', ml: 1 }}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* 설정 버튼 */}
              <Tooltip title="설정">
                <IconButton size="small" sx={{ color: 'white' }}>
                  <Settings />
                </IconButton>
              </Tooltip>

              {/* 전체화면 버튼 */}
              <Tooltip title={isFullscreen ? '전체화면 해제' : '전체화면'}>
                <IconButton onClick={handleFullscreenToggle} size="small" sx={{ color: 'white' }}>
                  {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>
      )}

      {/* 비디오 타입 표시 */}
      <Box
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 1
        }}
      >
        <Chip
          label={src?.includes('ai-generated') ? 'AI 생성' : '실사 촬영'}
          size="small"
          color={src?.includes('ai-generated') ? 'secondary' : 'primary'}
          sx={{
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: 'white',
            '& .MuiChip-label': {
              fontSize: '0.75rem'
            }
          }}
        />
      </Box>
    </Box>
  )
}

export default VideoPlayer 