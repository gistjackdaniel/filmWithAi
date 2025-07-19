import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Box, Typography, Chip, IconButton, Tooltip, LinearProgress } from '@mui/material'
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
  Refresh
} from '@mui/icons-material'
import { useDndContext, useSortable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import VideoPlayer from '../atoms/VideoPlayer'
import SceneCard from '../atoms/SceneCard'
import { useTimelineStore } from '../../../stores/timelineStore'
import { useTheme } from '@mui/material/styles'

/**
 * V1 타임라인 컴포넌트
 * 실사 촬영 영상과 AI 생성 비디오를 표시하는 타임라인
 * 프리미어 프로 스타일의 UI 적용
 */
const TimelineV1 = ({ 
  projectId, 
  onSceneSelect, 
  onSceneEdit,
  isEditing = false 
}) => {
  const theme = useTheme()
  const containerRef = useRef(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.8)
  const [isMuted, setIsMuted] = useState(false)
  const [selectedSceneId, setSelectedSceneId] = useState(null)
  const [loadingStates, setLoadingStates] = useState({})

  // 타임라인 스토어에서 데이터 가져오기
  const { 
    scenes, 
    currentProjectId, 
    updateScenesOrder,
    updateScene,
    loading,
    error 
  } = useTimelineStore()

  // 현재 프로젝트의 씬들만 필터링
  const projectScenes = scenes.filter(scene => 
    scene.projectId === projectId || scene.projectId === currentProjectId
  )

  /**
   * 재생/일시정지 토글
   */
  const handlePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying)
  }, [isPlaying])

  /**
   * 볼륨 토글
   */
  const handleVolumeToggle = useCallback(() => {
    setIsMuted(!isMuted)
  }, [isMuted])

  /**
   * 전체화면 토글
   */
  const handleFullscreen = useCallback(() => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        containerRef.current.requestFullscreen()
      }
    }
  }, [])

  /**
   * 씬 선택 핸들러
   */
  const handleSceneSelect = useCallback((sceneId) => {
    setSelectedSceneId(sceneId)
    if (onSceneSelect) {
      onSceneSelect(sceneId)
    }
  }, [onSceneSelect])

  /**
   * 씬 편집 핸들러
   */
  const handleSceneEdit = useCallback((sceneId) => {
    if (onSceneEdit) {
      onSceneEdit(sceneId)
    }
  }, [onSceneEdit])

  /**
   * 비디오 로딩 상태 업데이트
   */
  const handleVideoLoading = useCallback((sceneId, isLoading) => {
    setLoadingStates(prev => ({
      ...prev,
      [sceneId]: isLoading
    }))
  }, [])

  /**
   * 드래그 앤 드롭 핸들러
   */
  const handleDragEnd = useCallback((event) => {
    const { active, over } = event
    
    if (active.id !== over?.id) {
      const oldIndex = projectScenes.findIndex(scene => scene.id === active.id)
      const newIndex = projectScenes.findIndex(scene => scene.id === over?.id)
      
      if (oldIndex !== -1 && newIndex !== -1) {
        updateScenesOrder(projectId, oldIndex, newIndex)
      }
    }
  }, [projectScenes, projectId, updateScenesOrder])

  // DnD 컨텍스트 설정
  const { sensors, setNodeRef } = useDndContext({
    onDragEnd: handleDragEnd,
    sensors: [
      // 센서 설정
    ]
  })

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        height: '100%',
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* 타임라인 헤더 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.grey[100]
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            V1 타임라인 - 촬영 소스
          </Typography>
          <Chip 
            label={`${projectScenes.length}개 씬`}
            size="small"
            color="primary"
          />
        </Box>

        {/* 컨트롤 버튼들 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title={isPlaying ? '일시정지' : '재생'}>
            <IconButton onClick={handlePlayPause} size="small">
              {isPlaying ? <Pause /> : <PlayArrow />}
            </IconButton>
          </Tooltip>

          <Tooltip title={isMuted ? '음소거 해제' : '음소거'}>
            <IconButton onClick={handleVolumeToggle} size="small">
              {isMuted ? <VolumeOff /> : <VolumeUp />}
            </IconButton>
          </Tooltip>

          <Tooltip title="전체화면">
            <IconButton onClick={handleFullscreen} size="small">
              <Fullscreen />
            </IconButton>
          </Tooltip>

          <Tooltip title="설정">
            <IconButton size="small">
              <Settings />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* 로딩 상태 */}
      {loading && (
        <Box sx={{ p: 2 }}>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
            타임라인 로딩 중...
          </Typography>
        </Box>
      )}

      {/* 에러 상태 */}
      {error && (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Error color="error" sx={{ fontSize: 48, mb: 1 }} />
          <Typography variant="body1" color="error" sx={{ mb: 1 }}>
            타임라인 로딩 중 오류가 발생했습니다
          </Typography>
          <IconButton onClick={() => window.location.reload()}>
            <Refresh />
          </IconButton>
        </Box>
      )}

      {/* 타임라인 컨텐츠 */}
      {!loading && !error && (
        <Box
          ref={setNodeRef}
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}
        >
          {projectScenes.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Movie sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                촬영 소스가 없습니다
              </Typography>
              <Typography variant="body2" color="text.secondary">
                AI 콘티 생성 후 촬영 소스를 추가하세요
              </Typography>
            </Box>
          ) : (
            projectScenes.map((scene, index) => (
              <TimelineV1Scene
                key={scene.id}
                scene={scene}
                index={index}
                isSelected={selectedSceneId === scene.id}
                isEditing={isEditing}
                onSelect={handleSceneSelect}
                onEdit={handleSceneEdit}
                onLoadingChange={handleVideoLoading}
                volume={isMuted ? 0 : volume}
              />
            ))
          )}
        </Box>
      )}
    </Box>
  )
}

/**
 * V1 타임라인의 개별 씬 컴포넌트
 */
const TimelineV1Scene = ({ 
  scene, 
  index, 
  isSelected, 
  isEditing,
  onSelect, 
  onEdit, 
  onLoadingChange,
  volume 
}) => {
  const theme = useTheme()
  const [isVideoLoading, setIsVideoLoading] = useState(false)
  const [videoError, setVideoError] = useState(null)

  // 드래그 앤 드롭 설정
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: scene.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  /**
   * 비디오 로딩 상태 변경
   */
  const handleVideoLoadingChange = useCallback((loading) => {
    setIsVideoLoading(loading)
    onLoadingChange(scene.id, loading)
  }, [scene.id, onLoadingChange])

  /**
   * 비디오 에러 처리
   */
  const handleVideoError = useCallback((error) => {
    setVideoError(error)
    console.error('Video error:', error)
  }, [])

  /**
   * 씬 클릭 핸들러
   */
  const handleSceneClick = useCallback(() => {
    onSelect(scene.id)
  }, [scene.id, onSelect])

  /**
   * 편집 버튼 클릭 핸들러
   */
  const handleEditClick = useCallback((e) => {
    e.stopPropagation()
    onEdit(scene.id)
  }, [scene.id, onEdit])

  return (
    <Box
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      sx={{
        border: `2px solid ${isSelected ? theme.palette.primary.main : theme.palette.divider}`,
        borderRadius: 2,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: theme.palette.primary.light,
          boxShadow: theme.shadows[4]
        }
      }}
      onClick={handleSceneClick}
    >
      {/* 씬 헤더 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1.5,
          backgroundColor: theme.palette.grey[50],
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            씬 {scene.scene || index + 1}
          </Typography>
          
          <Chip
            label={scene.type === 'generated_video' ? 'AI 생성' : '실사 촬영'}
            size="small"
            color={scene.type === 'generated_video' ? 'secondary' : 'primary'}
            icon={scene.type === 'generated_video' ? <Movie /> : <Videocam />}
          />

          {scene.estimatedDuration && (
            <Chip
              label={scene.estimatedDuration}
              size="small"
              variant="outlined"
            />
          )}
        </Box>

        {isEditing && (
          <IconButton size="small" onClick={handleEditClick}>
            <Settings />
          </IconButton>
        )}
      </Box>

      {/* 비디오 플레이어 */}
      <Box sx={{ position: 'relative', minHeight: 200 }}>
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
              backgroundColor: 'rgba(0,0,0,0.1)',
              zIndex: 1
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
              height: 200,
              backgroundColor: theme.palette.grey[100]
            }}
          >
            <Error color="error" sx={{ fontSize: 32, mb: 1 }} />
            <Typography variant="body2" color="error">
              비디오 로딩 실패
            </Typography>
          </Box>
        ) : (
          <VideoPlayer
            src={scene.videoUrl || scene.imageUrl}
            poster={scene.imageUrl}
            volume={volume}
            onLoadingChange={handleVideoLoadingChange}
            onError={handleVideoError}
            controls={false}
            style={{ width: '100%', height: 'auto' }}
          />
        )}
      </Box>

      {/* 씬 정보 */}
      <Box sx={{ p: 1.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
          {scene.title || `씬 ${scene.scene || index + 1}`}
        </Typography>
        
        {scene.description && (
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}
          >
            {scene.description}
          </Typography>
        )}
      </Box>
    </Box>
  )
}

export default TimelineV1 