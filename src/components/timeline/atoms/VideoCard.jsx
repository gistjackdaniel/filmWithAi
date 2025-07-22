import React, { useState, useCallback, useRef, useMemo } from 'react'
import { 
  Box, 
  Typography, 
  Chip, 
  IconButton, 
  Tooltip,
  LinearProgress,
  Button
} from '@mui/material'
import {
  PlayArrow,
  Pause,
  VolumeUp,
  VolumeOff,
  Fullscreen,
  Settings,
  Movie,
  Videocam,
  Error,
  Refresh,
  CloudUpload,
  Delete
} from '@mui/icons-material'
import VideoPlayer from './VideoPlayer'

/**
 * V2 타임라인용 비디오 카드 컴포넌트
 * 실사 촬영 영상 + AI 생성 비디오 표시
 * 비디오 파일 업로드 기능
 * 비디오 메타데이터 표시
 * AI 생성 비디오와 실사 촬영 구분 표시
 * 프리미어 프로 스타일 클립 형태
 * playhead 위치의 컷을 표시하는 기능 추가
 */
const VideoCard = ({
  video,
  onClick,
  onEdit,
  onDelete,
  onUpload,
  selected = false,
  loading = false,
  isDraggable = true,
  onMouseEnter,
  onMouseLeave,
  timeScale = 1,
  zoomLevel = 1,
  showTimeInfo = true,
  width = null, // 외부에서 전달된 너비 (우선 사용)
  currentTime = 0, // 현재 playhead 시간
  allCuts = [], // 모든 컷 데이터
  showV1Track = true, // V1 트랙 표시 여부
  showV2Track = true, // V2 트랙 표시 여부
  ...props
}) => {
  const [isVideoLoading, setIsVideoLoading] = useState(false)
  const [videoError, setVideoError] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showUploadArea, setShowUploadArea] = useState(false)
  const fileInputRef = useRef(null)

  // playhead 위치의 컷 찾기
  const currentCut = useMemo(() => {
    if (!allCuts || allCuts.length === 0) return null
    
    let accumulatedTime = 0
    
    for (const cut of allCuts) {
      const cutDuration = cut.estimatedDuration || cut.duration || 5
      if (currentTime >= accumulatedTime && currentTime < accumulatedTime + cutDuration) {
        return cut
      }
      accumulatedTime += cutDuration
    }
    
    // 마지막 컷인 경우
    if (currentTime >= accumulatedTime) {
      return allCuts[allCuts.length - 1]
    }
    
    return null
  }, [currentTime, allCuts])

  // 표시할 미디어 결정 (V2 우선, V1 보조)
  const displayMedia = useMemo(() => {
    if (!currentCut) return null
    
    // V2만 켜져 있으면 V2 표시
    if (showV2Track && !showV1Track) {
      return {
        type: 'video',
        url: currentCut.videoUrl || currentCut.imageUrl,
        poster: currentCut.imageUrl,
        title: currentCut.title,
        shotNumber: currentCut.shotNumber,
        trackType: 'V2'
      }
    }
    
    // V1만 켜져 있으면 V1 표시
    if (showV1Track && !showV2Track) {
      return {
        type: 'image',
        url: currentCut.imageUrl,
        title: currentCut.title,
        shotNumber: currentCut.shotNumber,
        trackType: 'V1'
      }
    }
    
    // V1, V2 둘 다 켜져 있으면 V2 우선, V2가 비어있으면 V1 표시
    if (showV1Track && showV2Track) {
      const hasVideo = currentCut.videoUrl || (currentCut.imageUrl && currentCut.type === 'video')
      
      if (hasVideo) {
        return {
          type: 'video',
          url: currentCut.videoUrl || currentCut.imageUrl,
          poster: currentCut.imageUrl,
          title: currentCut.title,
          shotNumber: currentCut.shotNumber,
          trackType: 'V2'
        }
      } else {
        return {
          type: 'image',
          url: currentCut.imageUrl,
          title: currentCut.title,
          shotNumber: currentCut.shotNumber,
          trackType: 'V1'
        }
      }
    }
    
    return null
  }, [currentCut, showV1Track, showV2Track])

  // 비디오 데이터 구조
  const {
    id,
    cutId,
    shotNumber,
    title,
    description,
    videoUrl,
    posterUrl,
    duration,
    estimatedDuration,
    type = 'real', // 'real' | 'ai-generated'
    metadata = {},
    ...otherProps
  } = video || {}

  // 비디오 로딩 상태 변경
  const handleVideoLoadingChange = useCallback((loading) => {
    setIsVideoLoading(loading)
  }, [])

  // 비디오 에러 처리
  const handleVideoError = useCallback((error) => {
    setVideoError(error)
    console.error('Video error:', error)
  }, [])

  // 비디오 클릭 핸들러
  const handleVideoClick = useCallback(() => {
    if (onClick) {
      onClick(video)
    }
  }, [video, onClick])

  // 편집 버튼 클릭 핸들러
  const handleEditClick = useCallback((e) => {
    e.stopPropagation()
    if (onEdit) {
      onEdit(video)
    }
  }, [video, onEdit])

  // 삭제 버튼 클릭 핸들러
  const handleDeleteClick = useCallback((e) => {
    e.stopPropagation()
    if (onDelete) {
      onDelete(video)
    }
  }, [video, onDelete])

  // 파일 업로드 핸들러
  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0]
    if (file && onUpload) {
      onUpload(file, video)
    }
    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [video, onUpload])

  // 파일 드래그 앤 드롭 핸들러
  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setShowUploadArea(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setShowUploadArea(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setShowUploadArea(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0 && onUpload) {
      onUpload(files[0], video)
    }
  }, [video, onUpload])

  // 파일 업로드 버튼 클릭
  const handleUploadClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [])

  // 비디오 재생/일시정지 토글
  const handlePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying)
  }, [isPlaying])

  // 카드 너비 계산 - estimatedDuration 기반
  const videoDuration = estimatedDuration || duration || 5
  let cardWidth = width || 200 // 외부에서 전달된 너비가 있으면 사용, 없으면 기본값
  
  // 외부에서 너비가 전달되지 않은 경우에만 내부 계산 수행
  if (width === null) {
    const minWidth = 60 // 최소 너비
    
    // 시간 기반 너비 계산 - TimeRuler와 동기화 (여백 없음)
    if (videoDuration > 0 && timeScale > 0) {
      // TimeRuler와 동일한 계산 공식 사용 (연속 배치)
      const pixelsPerSecond = 1 / timeScale // timeScale이 작을수록 더 많은 픽셀 필요
      const timeBasedWidth = videoDuration * pixelsPerSecond
      
      // 최소 너비와 최대 너비 제한 (여백 없이 연속 배치)
      const maxWidth = Math.max(400, videoDuration * 20) // 최대 1초당 20px
      cardWidth = Math.max(minWidth, Math.min(timeBasedWidth, maxWidth))
      
      console.log(`VideoCard 동적 계산 비디오 ${shotNumber}: duration=${videoDuration}s, timeScale=${timeScale}, pixelsPerSecond=${pixelsPerSecond}, timeBasedWidth=${timeBasedWidth}px, finalWidth=${cardWidth}px`)
    } else if (videoDuration > 0) {
      // timeScale이 0이지만 duration이 있는 경우 기본 계산
      const basePixelsPerSecond = 10
      const timeBasedWidth = videoDuration * basePixelsPerSecond
      cardWidth = Math.max(minWidth, Math.min(timeBasedWidth, 150))
      
      console.log(`VideoCard 기본 계산 비디오 ${shotNumber}: duration=${videoDuration}s, fallback width=${cardWidth}px`)
    }
  } else {
    console.log(`VideoCard 외부 너비 사용 비디오 ${shotNumber}: width=${width}px`)
  }

  // 비디오가 없는 경우 업로드 영역 표시
  if (!videoUrl) {
    return (
      <Box
        sx={{
          width: cardWidth,
          height: 80,
          border: '2px dashed var(--color-accent)',
          borderRadius: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--color-card-bg)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: 'var(--color-primary)',
            backgroundColor: 'rgba(212, 175, 55, 0.1)'
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleUploadClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {showUploadArea ? (
          <Box sx={{ textAlign: 'center' }}>
            <CloudUpload sx={{ fontSize: 24, color: 'var(--color-accent)', mb: 0.5 }} />
            <Typography variant="caption" sx={{ color: 'var(--color-text-primary)' }}>
              파일을 여기에 놓으세요
            </Typography>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center' }}>
            <CloudUpload sx={{ fontSize: 24, color: 'var(--color-text-secondary)', mb: 0.5 }} />
            <Typography variant="caption" sx={{ color: 'var(--color-text-secondary)' }}>
              비디오 업로드
            </Typography>
          </Box>
        )}
        
        {/* 숨겨진 파일 입력 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
      </Box>
    )
  }

  return (
    <Box
      sx={{
        width: cardWidth,
        height: 80,
        border: `2px solid ${selected ? 'var(--color-accent)' : 'var(--color-scene-card-border)'}`,
        borderRadius: 1,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        backgroundColor: 'var(--color-card-bg)',
        position: 'relative',
        marginRight: 0, // 연속 배치를 위해 여백 제거
        '&:hover': {
          borderColor: 'var(--color-accent)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          transform: 'translateY(-1px)'
        }
      }}
      onClick={handleVideoClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      {...props}
    >
      {/* 비디오 플레이어 */}
      <Box sx={{ position: 'relative', height: '100%' }}>
        {isVideoLoading && (
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

        {videoError ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              backgroundColor: 'var(--color-bg)'
            }}
          >
            <Error color="error" sx={{ fontSize: 20, mb: 0.5 }} />
            <Typography variant="caption" color="error">
              로딩 실패
            </Typography>
          </Box>
        ) : displayMedia ? (
          // playhead 위치의 컷 표시
          displayMedia.type === 'video' ? (
            <VideoPlayer
              src={displayMedia.url}
              poster={displayMedia.poster}
              controls={false}
              style={{ width: '100%', height: '100%' }}
              onLoadingChange={handleVideoLoadingChange}
              onError={handleVideoError}
            />
          ) : (
            <Box sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(212, 175, 55, 0.1)',
              position: 'relative'
            }}>
              {displayMedia.url ? (
                <img
                  src={displayMedia.url.startsWith('/') ? `http://localhost:5001${displayMedia.url}` : displayMedia.url}
                  alt={`컷 ${displayMedia.shotNumber} 미리보기`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    console.error('❌ 미리보기 이미지 로딩 실패:', displayMedia.url)
                    e.target.style.display = 'none'
                    e.target.parentElement.innerHTML = `
                      <div style="
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 100%;
                        height: 100%;
                        color: var(--color-text-secondary);
                        font-size: 12px;
                        text-align: center;
                        padding: 8px;
                      ">
                        <div>
                          <div style="font-size: 24px; margin-bottom: 4px;">🎬</div>
                          <div>컷 ${displayMedia.shotNumber}</div>
                          <div style="font-size: 10px; margin-top: 2px;">이미지 없음</div>
                        </div>
                      </div>
                    `
                  }}
                />
              ) : (
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-text-secondary)',
                  textAlign: 'center',
                  p: 2
                }}>
                  <Movie sx={{ fontSize: 32, mb: 1 }} />
                  <Typography variant="caption">
                    컷 {displayMedia.shotNumber}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                    이미지 없음
                  </Typography>
                </Box>
              )}
            </Box>
          )
        ) : (
          // 기존 비디오 플레이어
          <VideoPlayer
            src={videoUrl}
            poster={posterUrl}
            controls={false}
            style={{ width: '100%', height: '100%' }}
            onLoadingChange={handleVideoLoadingChange}
            onError={handleVideoError}
          />
        )}

        {/* 재생 버튼 오버레이 */}
        {!isPlaying && !isVideoLoading && !videoError && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1
            }}
          >
            <IconButton
              onClick={handlePlayPause}
              size="small"
              sx={{
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.9)'
                }
              }}
            >
              <PlayArrow sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        )}
      </Box>

      {/* 비디오 정보 오버레이 */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
          p: 0.5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold' }}>
            {displayMedia ? (
              <>
                {displayMedia.trackType} - 컷 {displayMedia.shotNumber}
                {displayMedia.title && ` (${displayMedia.title})`}
              </>
            ) : (
              shotNumber ? `컷 ${shotNumber}` : title || '비디오'
            )}
          </Typography>
          
          <Chip
            label={displayMedia ? displayMedia.trackType : (type === 'ai-generated' ? 'AI' : '실사')}
            size="small"
            color={displayMedia ? (displayMedia.trackType === 'V2' ? 'primary' : 'secondary') : (type === 'ai-generated' ? 'secondary' : 'primary')}
            sx={{
              height: 16,
              fontSize: '0.6rem',
              '& .MuiChip-label': {
                px: 0.5
              }
            }}
          />
        </Box>

        <Typography variant="caption" sx={{ color: 'white' }}>
          {displayMedia ? (
            `${currentTime.toFixed(1)}s`
          ) : (
            `${videoDuration}s`
          )}
        </Typography>
      </Box>

      {/* 액션 버튼들 (호버 시 표시) */}
      <Box sx={{
        position: 'absolute',
        top: 4,
        right: 4,
        display: 'flex',
        gap: 0.5,
        opacity: 0,
        transition: 'opacity 0.2s ease-in-out',
        '&:hover': {
          opacity: 1
        }
      }}>
        {onEdit && (
          <Tooltip title="편집">
            <IconButton
              size="small"
              onClick={handleEditClick}
              sx={{
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.8)'
                }
              }}
            >
              <Settings sx={{ fontSize: 12 }} />
            </IconButton>
          </Tooltip>
        )}
        
        {onDelete && (
          <Tooltip title="삭제">
            <IconButton
              size="small"
              onClick={handleDeleteClick}
              sx={{
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.8)'
                }
              }}
            >
              <Delete sx={{ fontSize: 12 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* 비디오 타입 표시 */}
      <Box
        sx={{
          position: 'absolute',
          top: 4,
          left: 4,
          zIndex: 1
        }}
      >
        <Chip
          label={type === 'ai-generated' ? 'AI 생성' : '실사 촬영'}
          size="small"
          color={type === 'ai-generated' ? 'secondary' : 'primary'}
          sx={{
            height: 16,
            fontSize: '0.6rem',
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: 'white',
            '& .MuiChip-label': {
              px: 0.5
            }
          }}
        />
      </Box>

      {/* 선택 표시 */}
      {selected && (
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          border: '2px solid var(--color-accent)',
          borderRadius: 1,
          pointerEvents: 'none'
        }} />
      )}
    </Box>
  )
}

export default VideoCard 