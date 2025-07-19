import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Box, IconButton, Slider, Typography, Tooltip } from '@mui/material'
import { 
  PlayArrow, 
  Pause, 
  VolumeUp, 
  VolumeOff,
  Fullscreen,
  FullscreenExit,
  Settings
} from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'

/**
 * 비디오 플레이어 컴포넌트
 * HTML5 video 태그 기반 비디오 재생 및 컨트롤
 */
const VideoPlayer = ({
  src,
  poster,
  volume = 0.8,
  onLoadingChange,
  onError,
  onTimeUpdate,
  onDurationChange,
  onPlay,
  onPause,
  onEnded,
  controls = true,
  autoPlay = false,
  loop = false,
  muted = false,
  style = {},
  className = ''
}) => {
  const theme = useTheme()
  const videoRef = useRef(null)
  const containerRef = useRef(null)
  
  // 상태 관리
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isMuted, setIsMuted] = useState(muted)
  const [currentVolume, setCurrentVolume] = useState(volume)
  const [showControls, setShowControls] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [error, setError] = useState(null)

  /**
   * 재생/일시정지 토글
   */
  const handlePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
  }, [isPlaying])

  /**
   * 볼륨 토글
   */
  const handleVolumeToggle = useCallback(() => {
    if (videoRef.current) {
      const newMuted = !isMuted
      videoRef.current.muted = newMuted
      setIsMuted(newMuted)
    }
  }, [isMuted])

  /**
   * 볼륨 슬라이더 변경
   */
  const handleVolumeChange = useCallback((event, newValue) => {
    if (videoRef.current) {
      videoRef.current.volume = newValue / 100
      setCurrentVolume(newValue / 100)
      if (newValue === 0) {
        setIsMuted(true)
        videoRef.current.muted = true
      } else if (isMuted) {
        setIsMuted(false)
        videoRef.current.muted = false
      }
    }
  }, [isMuted])

  /**
   * 진행률 슬라이더 변경
   */
  const handleProgressChange = useCallback((event, newValue) => {
    if (videoRef.current && duration > 0) {
      const newTime = (newValue / 100) * duration
      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }, [duration])

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
   * 시간 포맷팅
   */
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  /**
   * 진행률 계산
   */
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  // 비디오 이벤트 핸들러들
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadStart = () => {
      setIsLoading(true)
      setError(null)
      onLoadingChange?.(true)
    }

    const handleCanPlay = () => {
      setIsLoading(false)
      onLoadingChange?.(false)
    }

    const handlePlay = () => {
      setIsPlaying(true)
      onPlay?.()
    }

    const handlePause = () => {
      setIsPlaying(false)
      onPause?.()
    }

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      onTimeUpdate?.(video.currentTime)
    }

    const handleDurationChange = () => {
      setDuration(video.duration)
      onDurationChange?.(video.duration)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      onEnded?.()
    }

    const handleError = (e) => {
      setError(e)
      setIsLoading(false)
      onLoadingChange?.(false)
      onError?.(e)
    }

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    // 이벤트 리스너 등록
    video.addEventListener('loadstart', handleLoadStart)
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('durationchange', handleDurationChange)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('error', handleError)
    document.addEventListener('fullscreenchange', handleFullscreenChange)

    // 초기 설정
    video.volume = currentVolume
    video.muted = isMuted
    if (autoPlay) {
      video.play()
    }

    return () => {
      video.removeEventListener('loadstart', handleLoadStart)
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('durationchange', handleDurationChange)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('error', handleError)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [currentVolume, isMuted, autoPlay, onLoadingChange, onPlay, onPause, onTimeUpdate, onDurationChange, onEnded, onError])

  // 컨트롤 표시/숨김
  useEffect(() => {
    let timeoutId
    if (showControls) {
      timeoutId = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }
    return () => clearTimeout(timeoutId)
  }, [showControls])

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: 'black',
        borderRadius: 1,
        overflow: 'hidden',
        '&:hover': {
          '& .video-controls': {
            opacity: 1
          }
        }
      }}
      className={className}
      style={style}
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* 비디오 요소 */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        loop={loop}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain'
        }}
      />

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
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 2
          }}
        >
          <Typography variant="body2" color="white">
            비디오 로딩 중...
          </Typography>
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
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.8)',
            zIndex: 2
          }}
        >
          <Typography variant="body2" color="error">
            비디오 로딩 실패
          </Typography>
        </Box>
      )}

      {/* 컨트롤 오버레이 */}
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
            value={progress}
            onChange={handleProgressChange}
            sx={{
              color: theme.palette.primary.main,
              height: 4,
              '& .MuiSlider-thumb': {
                width: 12,
                height: 12,
                transition: '0.3s cubic-bezier(.47,1.64,.41,.8)',
                '&:before': {
                  boxShadow: '0 2px 12px 0 rgba(0,0,0,0.4)',
                },
                '&:hover, &.Mui-focusVisible': {
                  boxShadow: `0px 0px 0px 8px ${theme.palette.primary.main}20`,
                },
                '&.Mui-active': {
                  width: 16,
                  height: 16,
                },
              },
              '& .MuiSlider-rail': {
                opacity: 0.28,
              },
            }}
          />

          {/* 컨트롤 버튼들 */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* 재생/일시정지 */}
              <Tooltip title={isPlaying ? '일시정지' : '재생'}>
                <IconButton onClick={handlePlayPause} size="small" sx={{ color: 'white' }}>
                  {isPlaying ? <Pause /> : <PlayArrow />}
                </IconButton>
              </Tooltip>

              {/* 볼륨 */}
              <Tooltip title={isMuted ? '음소거 해제' : '음소거'}>
                <IconButton onClick={handleVolumeToggle} size="small" sx={{ color: 'white' }}>
                  {isMuted ? <VolumeOff /> : <VolumeUp />}
                </IconButton>
              </Tooltip>

              {/* 볼륨 슬라이더 */}
              <Box sx={{ width: 80, display: 'flex', alignItems: 'center' }}>
                <Slider
                  value={isMuted ? 0 : currentVolume * 100}
                  onChange={handleVolumeChange}
                  sx={{
                    color: 'white',
                    height: 4,
                    '& .MuiSlider-thumb': {
                      width: 8,
                      height: 8,
                    },
                  }}
                />
              </Box>

              {/* 시간 표시 */}
              <Typography variant="caption" sx={{ color: 'white', minWidth: 80 }}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* 설정 */}
              <Tooltip title="설정">
                <IconButton size="small" sx={{ color: 'white' }}>
                  <Settings />
                </IconButton>
              </Tooltip>

              {/* 전체화면 */}
              <Tooltip title={isFullscreen ? '전체화면 종료' : '전체화면'}>
                <IconButton onClick={handleFullscreenToggle} size="small" sx={{ color: 'white' }}>
                  {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  )
}

export default VideoPlayer 