import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { 
  Box, 
  IconButton, 
  Slider, 
  Typography, 
  LinearProgress,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  VolumeUp,
  VolumeOff,
  Fullscreen,
  FullscreenExit,
  Error,
  Refresh,
} from '@mui/icons-material';

/**
 * V2 타임라인용 비디오 플레이어 컴포넌트
 * HTML5 video 태그 기반 비디오 재생
 * 재생 컨트롤 (재생/일시정지, 볼륨, 진행률)
 * 비디오 썸네일 생성
 */
const VideoPlayer = ({
  src,
  isPlaying = false, // 외부에서 제어하는 재생 상태
  currentTime = 0, // 비디오 시작 시간
  onTimeUpdate, // 타임라인에서 비디오 시간 업데이트 시 호출될 콜백
  onPlayStateChange, // 재생 상태 변경 시 호출될 콜백
  onLoadingChange, // 로딩 상태 변경 시 호출될 콜백
  onError, // 에러 발생 시 호출될 콜백
  volume = 1,
  muted = false,
  controls = true,
  autoPlay = false,
  loop = false,
  preload = 'metadata',
  poster,
  className,
  style,
  ...props
}) => {
  const videoRef = useRef(null);
  const [currentTimeState, setCurrentTimeState] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volumeLevel, setVolumeLevel] = useState(volume);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showControls, setShowControls] = useState(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false); // 비디오 재생 상태 추적
  const playTimeoutRef = useRef(null);
  const pauseTimeoutRef = useRef(null);
  const lastIsPlayingRef = useRef(isPlaying); // 이전 재생 상태 저장

  // 외부 재생 상태에 따라 비디오 재생/정지 - 최적화된 버전
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    // 디바운싱 - 이전 상태와 동일하면 무시
    if (isPlaying === lastIsPlayingRef.current) {
      return;
    }
    
    // 이전 타임아웃 정리
    if (playTimeoutRef.current) {
      clearTimeout(playTimeoutRef.current);
      playTimeoutRef.current = null;
    }
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }
    
    // 현재 비디오 상태 확인
    const isCurrentlyPlaying = !video.paused && !video.ended;
    
    // 상태가 실제로 변경될 때만 실행
    if (isPlaying && !isCurrentlyPlaying) {
      // 재생 시작 시에만 시간 설정
      if (currentTime > 0 && video.readyState >= 1) {
        video.currentTime = currentTime;
      }
      
      // 재생 시도 - 더 긴 지연으로 안정성 확보
      playTimeoutRef.current = setTimeout(() => {
        if (video && video.paused && !video.ended) {
          video.play().catch(error => {
            if (error.name !== 'AbortError') {
              console.error('🎬 비디오 재생 실패:', error);
            }
          });
        }
      }, 150); // 150ms 지연으로 증가
    } else if (!isPlaying && isCurrentlyPlaying) {
      // 정지 시도 - 즉시 정지
      video.pause();
    }
    
    // 현재 상태 저장
    lastIsPlayingRef.current = isPlaying;
    
    return () => {
      if (playTimeoutRef.current) {
        clearTimeout(playTimeoutRef.current);
      }
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }
    };
  }, [isPlaying, currentTime]); // currentTime 의존성 추가

  // 비디오 시작 시간 설정 - 재생 중에도 시간 업데이트 허용
  useEffect(() => {
    if (videoRef.current && currentTime > 0) {
      // 비디오가 로드된 후에만 시간 설정
      if (videoRef.current.readyState >= 1) {
        // 재생 중이 아닐 때만 비디오 시간 강제 설정
        if (videoRef.current.paused && !isVideoPlaying) {
          // 현재 비디오 시간과 비교하여 큰 차이가 있을 때만 설정
          const currentVideoTime = videoRef.current.currentTime;
          const timeDifference = Math.abs(currentVideoTime - currentTime);
          
          if (timeDifference > 0.5) { // 0.5초 이상 차이가 있을 때만 설정
            videoRef.current.currentTime = currentTime;
          }
        }
        // 재생 중일 때는 비디오 시간을 강제로 설정하지 않음 (자연스러운 재생 유지)
      }
    }
  }, [currentTime, isVideoPlaying]);

  // 비디오 재생 상태 변경 감지 - 외부 제어만 사용하므로 비활성화
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // 비디오 재생 상태 추적
    const handlePlay = () => {
      setIsVideoPlaying(true);
    };

    const handlePause = () => {
      setIsVideoPlaying(false);
    };

    const handleEnded = () => {
      setIsVideoPlaying(false);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  // 비디오 로딩 상태 관리
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isLoading);
    }
  }, [isLoading, onLoadingChange]);

  // 볼륨 변경 핸들러
  const handleVolumeChange = useCallback((event, newValue) => {
    const newVolume = newValue / 100;
    setVolumeLevel(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    if (newVolume === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  }, []);

  // 음소거 토글 핸들러
  const handleMuteToggle = useCallback(() => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volumeLevel;
        setIsMuted(false);
      } else {
        videoRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  }, [isMuted, volumeLevel]);

  // 전체화면 토글 핸들러
  const handleFullscreenToggle = useCallback(() => {
    if (videoRef.current) {
      if (!isFullscreen) {
        if (videoRef.current.requestFullscreen) {
          videoRef.current.requestFullscreen();
        } else if (videoRef.current.webkitRequestFullscreen) {
          videoRef.current.webkitRequestFullscreen();
        } else if (videoRef.current.msRequestFullscreen) {
          videoRef.current.msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      }
    }
  }, [isFullscreen]);

  // 비디오 메타데이터 로드 후 시작 시간 설정
  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      console.log('🎬 VideoPlayer 메타데이터 로드 완료:', {
        src: src,
        duration: videoRef.current.duration,
        videoWidth: videoRef.current.videoWidth,
        videoHeight: videoRef.current.videoHeight,
        isPlaying: isPlaying,
        startTime: currentTime,
      });
      setDuration(videoRef.current.duration);
      setIsLoading(false);
      setError(null);
      
      // 메타데이터 로드 후 시작 시간 설정
      if (currentTime > 0) {
        videoRef.current.currentTime = currentTime;
      }
    }
  }, [src, isPlaying, currentTime]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      // 재생 중일 때만 시간 업데이트 (정지 상태에서는 불필요한 업데이트 방지)
      if (!videoRef.current.paused) {
        const videoTime = videoRef.current.currentTime;
        // 비디오 시간이 실제로 변경되었을 때만 업데이트
        if (Math.abs(videoTime - currentTimeState) > 0.1) {
          setCurrentTimeState(videoTime);
          // 타임라인 시간 동기화를 위해 onTimeUpdate 콜백 호출
          if (onTimeUpdate) {
            // 비디오의 현재 시간을 타임라인에 전달
            onTimeUpdate(videoTime);
          }
        }
      }
    }
  }, [currentTimeState, onTimeUpdate]);

  const handleEnded = useCallback(() => {
    console.log('🎬 VideoPlayer 비디오 종료');
    setIsVideoPlaying(false);
    // 비디오 종료 시 타임라인 진행을 위해 onTimeUpdate 호출
    if (onTimeUpdate && videoRef.current) {
      // 비디오의 전체 길이를 전달하여 타임라인이 다음 컷으로 진행되도록 함
      onTimeUpdate(videoRef.current.duration);
    }
  }, [onTimeUpdate]);

  const handleError = useCallback((error) => {
    console.error('🎬 VideoPlayer 오류:', {
      src: src,
      error: error,
      videoElement: videoRef.current,
      isPlaying: isPlaying,
    });
    setError(error);
    setIsLoading(false);
    // 외부 제어만 사용하므로 재생 상태 변경 비활성화
    // if (isPlaying && onPlayStateChange) {
    //   onPlayStateChange(false)
    // }
    if (onError) {
      onError(error);
    }
  }, [onError, src, isPlaying]);

  const handleLoadStart = useCallback(() => {
    console.log('🎬 VideoPlayer 로딩 시작:', { src, isPlaying });
    setIsLoading(true);
    setError(null);
  }, [src, isPlaying]);

  const handleCanPlay = useCallback(() => {
    // 로그 제거 - 불필요한 중복 로그
    setIsLoading(false);
  }, []);

  // 메모이제이션된 비디오 스타일
  const videoStyle = useMemo(() => ({
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    ...style,
  }), [style]);

  // 메모이제이션된 비디오 props
  const videoProps = useMemo(() => ({
    src,
    poster,
    onLoadedMetadata: handleLoadedMetadata,
    onTimeUpdate: handleTimeUpdate,
    onEnded: handleEnded,
    onError: handleError,
    onLoadStart: handleLoadStart,
    onCanPlay: handleCanPlay,
    ...props,
  }), [src, poster, handleLoadedMetadata, handleTimeUpdate, handleEnded, handleError, handleLoadStart, handleCanPlay, props]);

  // 전체화면 변경 감지
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // 컨트롤 자동 숨김
  useEffect(() => {
    let timeout;
    if (showControls && isPlaying) {
      timeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    return () => clearTimeout(timeout);
  }, [showControls, isPlaying]);

  // 마우스 움직임 감지
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
  }, []);

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
          opacity: 1,
        },
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className={className}
    >
      {/* 비디오 요소 */}
      <video
        ref={videoRef}
        style={videoStyle}
        {...videoProps}
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
            zIndex: 2,
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
            zIndex: 3,
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
            zIndex: 1,
          }}
        >
          {/* 컨트롤 버튼들 */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                      backgroundColor: 'var(--color-accent)',
                    },
                  }}
                />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
          zIndex: 1,
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
              fontSize: '0.75rem',
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default VideoPlayer; 