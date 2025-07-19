import React, { useState, useCallback, useRef } from 'react'
import { Box, Typography, Chip, IconButton, Tooltip, LinearProgress } from '@mui/material'
import { 
  Image,
  Movie,
  Videocam,
  Error,
  Refresh,
  ZoomIn,
  ZoomOut,
  Fullscreen,
  Settings,
  GridView,
  ViewList
} from '@mui/icons-material'
import { useDndContext, useSortable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import CutImage from '../atoms/CutImage'
import { useTimelineStore } from '../../../stores/timelineStore'
import { useTheme } from '@mui/material/styles'

/**
 * V2 타임라인 컴포넌트
 * 이미지 형태의 컷들로 구성된 스토리보드 형태의 시각화
 */
const TimelineV2 = ({ 
  projectId, 
  onSceneSelect, 
  onSceneEdit,
  isEditing = false 
}) => {
  const theme = useTheme()
  const containerRef = useRef(null)
  const [selectedSceneId, setSelectedSceneId] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'
  const [zoomLevel, setZoomLevel] = useState(1)
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
   * 뷰 모드 토글
   */
  const handleViewModeToggle = useCallback(() => {
    setViewMode(prev => prev === 'grid' ? 'list' : 'grid')
  }, [])

  /**
   * 줌 인/아웃
   */
  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 0.2, 3))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.5))
  }, [])

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
   * 이미지 로딩 상태 업데이트
   */
  const handleImageLoading = useCallback((sceneId, isLoading) => {
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
            V2 타임라인 - 스토리보드
          </Typography>
          <Chip 
            label={`${projectScenes.length}개 컷`}
            size="small"
            color="primary"
          />
        </Box>

        {/* 컨트롤 버튼들 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title={viewMode === 'grid' ? '리스트 보기' : '그리드 보기'}>
            <IconButton onClick={handleViewModeToggle} size="small">
              {viewMode === 'grid' ? <ViewList /> : <GridView />}
            </IconButton>
          </Tooltip>

          <Tooltip title="줌 아웃">
            <IconButton onClick={handleZoomOut} size="small" disabled={zoomLevel <= 0.5}>
              <ZoomOut />
            </IconButton>
          </Tooltip>

          <Typography variant="body2" sx={{ minWidth: 40, textAlign: 'center' }}>
            {Math.round(zoomLevel * 100)}%
          </Typography>

          <Tooltip title="줌 인">
            <IconButton onClick={handleZoomIn} size="small" disabled={zoomLevel >= 3}>
              <ZoomIn />
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
            스토리보드 로딩 중...
          </Typography>
        </Box>
      )}

      {/* 에러 상태 */}
      {error && (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Error color="error" sx={{ fontSize: 48, mb: 1 }} />
          <Typography variant="body1" color="error" sx={{ mb: 1 }}>
            스토리보드 로딩 중 오류가 발생했습니다
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
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top left',
            transition: 'transform 0.2s ease'
          }}
        >
          {projectScenes.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Image sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                스토리보드가 없습니다
              </Typography>
              <Typography variant="body2" color="text.secondary">
                AI 콘티 생성 후 스토리보드를 확인하세요
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                display: viewMode === 'grid' ? 'grid' : 'flex',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                flexDirection: 'column',
                gap: 2
              }}
            >
              {projectScenes.map((scene, index) => (
                <TimelineV2Scene
                  key={scene.id}
                  scene={scene}
                  index={index}
                  isSelected={selectedSceneId === scene.id}
                  isEditing={isEditing}
                  viewMode={viewMode}
                  onSelect={handleSceneSelect}
                  onEdit={handleSceneEdit}
                  onLoadingChange={handleImageLoading}
                />
              ))}
            </Box>
          )}
        </Box>
      )}
    </Box>
  )
}

/**
 * V2 타임라인의 개별 씬 컴포넌트
 */
const TimelineV2Scene = ({ 
  scene, 
  index, 
  isSelected, 
  isEditing,
  viewMode,
  onSelect, 
  onEdit, 
  onLoadingChange
}) => {
  const theme = useTheme()
  const [isImageLoading, setIsImageLoading] = useState(false)
  const [imageError, setImageError] = useState(null)

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
   * 이미지 로딩 상태 변경
   */
  const handleImageLoadingChange = useCallback((loading) => {
    setIsImageLoading(loading)
    onLoadingChange(scene.id, loading)
  }, [scene.id, onLoadingChange])

  /**
   * 이미지 에러 처리
   */
  const handleImageError = useCallback((error) => {
    setImageError(error)
    console.error('Image error:', error)
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
        backgroundColor: theme.palette.background.paper,
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
            컷 {scene.scene || index + 1}
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

      {/* 컷 이미지 */}
      <Box sx={{ position: 'relative', minHeight: viewMode === 'grid' ? 200 : 150 }}>
        {isImageLoading && (
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

        {imageError ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: viewMode === 'grid' ? 200 : 150,
              backgroundColor: theme.palette.grey[100]
            }}
          >
            <Error color="error" sx={{ fontSize: 32, mb: 1 }} />
            <Typography variant="body2" color="error">
              이미지 로딩 실패
            </Typography>
          </Box>
        ) : (
          <CutImage
            src={scene.imageUrl}
            alt={scene.title || `컷 ${scene.scene || index + 1}`}
            onLoadingChange={handleImageLoadingChange}
            onError={handleImageError}
            style={{ 
              width: '100%', 
              height: 'auto',
              objectFit: 'cover'
            }}
          />
        )}
      </Box>

      {/* 씬 정보 */}
      <Box sx={{ p: 1.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
          {scene.title || `컷 ${scene.scene || index + 1}`}
        </Typography>
        
        {scene.description && (
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: viewMode === 'grid' ? 2 : 1,
              WebkitBoxOrient: 'vertical'
            }}
          >
            {scene.description}
          </Typography>
        )}

        {/* 추가 메타데이터 */}
        {viewMode === 'list' && (
          <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            
            {scene.lighting && (
              <Chip label={scene.lighting} size="small" variant="outlined" />
            )}
            {scene.weather && (
              <Chip label={scene.weather} size="small" variant="outlined" />
            )}
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default TimelineV2 