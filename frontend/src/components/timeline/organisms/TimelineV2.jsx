import React, { useState, useCallback, useRef } from 'react'
import { 
  Box, 
  Typography, 
  Chip, 
  IconButton, 
  Tooltip, 
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Snackbar
} from '@mui/material'
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
  ViewList,
  Add,
  VideoLibrary,
  AutoAwesome,
  Delete
} from '@mui/icons-material'
import { useDndContext } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import CutImage from '../atoms/CutImage'
import VideoUploader from '../atoms/VideoUploader'
import useTimelineStore from '../../../stores/timelineStore'
import { useTheme } from '@mui/material/styles'
import { generateVideoWithVeo2, checkVeo2ApiAvailability, getVeo2ModelInfo } from '../../../services/veo2Api'

/**
 * V2 타임라인 컴포넌트
 * AI 생성 영상과 실제 비디오 파일을 표시하는 타임라인
 * V1에서 드래그된 컷으로 AI 영상을 생성
 */
const TimelineV2 = ({ 
  projectId, 
  onSceneSelect, 
  onSceneEdit,
  isEditing = false,
  onCutDropFromV1 // V1에서 드래그된 컷을 받는 콜백
}) => {
  const theme = useTheme()
  const containerRef = useRef(null)
  const [selectedSceneId, setSelectedSceneId] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'
  const [zoomLevel, setZoomLevel] = useState(1)
  const [loadingStates, setLoadingStates] = useState({})
  
  // 동영상 업로드 및 AI 생성 관련 상태
  const [showVideoUploadDialog, setShowVideoUploadDialog] = useState(false)
  const [showAIGenerationDialog, setShowAIGenerationDialog] = useState(false)
  const [aiGenerationProgress, setAiGenerationProgress] = useState(0)
  const [aiGenerationMessage, setAiGenerationMessage] = useState('')
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState('success')
  
  // V2에 표시할 비디오 목록 (AI 생성 + 업로드된 비디오)
  const [v2Videos, setV2Videos] = useState([])

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
   * AI 영상 생성 핸들러
   */
  const handleAIGeneration = useCallback(async (cut) => {
    try {
      console.log('🎬 AI 영상 생성 시작:', cut)
      
      // Veo3 API 사용 가능 여부 확인
      const isAvailable = await checkVeo2ApiAvailability()
              if (!isAvailable) {
          throw new Error('Veo2 API가 설정되지 않았습니다. Google Cloud 프로젝트 ID를 확인해주세요.')
      }

      setIsGeneratingAI(true)
      setAiGenerationProgress(0)
      setAiGenerationMessage('AI 영상 생성 준비 중...')

      // 진행률 업데이트 콜백
      const onProgress = (progressData) => {
        if (progressData.progress !== undefined) {
          setAiGenerationProgress(progressData.progress)
        }
        if (progressData.message) {
          setAiGenerationMessage(progressData.message)
        }
        console.log(`🎬 AI 생성 진행률: ${progressData.progress || 0}% - ${progressData.message}`)
      }

      // Veo2 API로 영상 생성
      const result = await generateVideoWithVeo2(cut, onProgress)

      console.log('AI 영상 생성 완료:', result)
      
      // 생성된 영상을 V2 비디오 목록에 추가
      const newVideo = {
        id: result.id,
        title: cut.title,
        description: cut.description,
        videoUrl: result.videoUrl,
        type: 'ai_generated',
        sourceCut: cut,
        createdAt: new Date().toISOString(),
        duration: result.duration || 5,
        prompt: result.prompt
      }
      
      setV2Videos(prev => [...prev, newVideo])
      
      setSnackbarMessage('AI 영상이 성공적으로 생성되었습니다!')
      setSnackbarSeverity('success')
      setShowAIGenerationDialog(false)
      
      // 상위 컴포넌트에 알림
      if (onCutDropFromV1) {
        onCutDropFromV1(newVideo)
      }

    } catch (error) {
      console.error('AI 영상 생성 실패:', error)
      setSnackbarMessage(`AI 영상 생성 실패: ${error.message}`)
      setSnackbarSeverity('error')
    } finally {
      setIsGeneratingAI(false)
      setAiGenerationProgress(0)
      setAiGenerationMessage('')
    }
  }, [onCutDropFromV1])

  /**
   * V1에서 드래그된 컷 처리
   */
  const handleCutDropFromV1 = useCallback((cut) => {
    console.log('🎬 V1에서 드래그된 컷:', cut)
    
    // AI 영상 생성 다이얼로그 표시
    setShowAIGenerationDialog(true)
    
    // AI 영상 생성 시작
    handleAIGeneration(cut)
  }, [handleAIGeneration])

  /**
   * 비디오 업로드 핸들러
   */
  const handleVideoUpload = useCallback(async (file, onProgress) => {
    try {
      console.log('🎬 비디오 업로드 시작:', file)
      console.log('🎬 현재 v2Videos 상태:', v2Videos)
      
      // 파일 유효성 검사
      const maxFileSize = 100 * 1024 * 1024 // 100MB
      const acceptedFormats = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv']
      
      if (file.size > maxFileSize) {
        throw new Error(`파일 크기가 너무 큽니다. 최대 100MB까지 업로드 가능합니다.`)
      }
      
      if (!acceptedFormats.includes(file.type)) {
        throw new Error('지원하지 않는 동영상 형식입니다. MP4, AVI, MOV, WMV 형식을 지원합니다.')
      }
      
      // 진행률 업데이트
      if (onProgress) {
        onProgress(10)
      }
      
      // 파일을 URL로 변환
      const videoUrl = URL.createObjectURL(file)
      
      if (onProgress) {
        onProgress(50)
      }
      
      // 비디오 메타데이터 추출 (duration 등)
      const video = document.createElement('video')
      video.src = videoUrl
      
      const duration = await new Promise((resolve) => {
        video.addEventListener('loadedmetadata', () => {
          resolve(video.duration || 5)
        })
        video.addEventListener('error', () => {
          resolve(5) // 기본값
        })
      })
      
      if (onProgress) {
        onProgress(100)
      }
      
      // 업로드된 비디오를 V2 목록에 추가
      const newVideo = {
        id: Date.now().toString(),
        title: file.name.replace(/\.[^/.]+$/, '') || '업로드된 비디오', // 확장자 제거
        description: `업로드된 비디오 파일`,
        videoUrl: videoUrl,
        type: 'uploaded',
        createdAt: new Date().toISOString(),
        duration: Math.round(duration),
        fileSize: file.size,
        fileType: file.type
      }
      
      setV2Videos(prev => {
        const updatedVideos = [...prev, newVideo]
        console.log('🎬 v2Videos 업데이트:', updatedVideos)
        return updatedVideos
      })
      
      setSnackbarMessage('비디오가 성공적으로 업로드되었습니다!')
      setSnackbarSeverity('success')
      
      // 업로드 완료 후 다이얼로그 닫기
      setShowVideoUploadDialog(false)
      
      console.log('🎬 비디오 업로드 완료:', newVideo)
      
    } catch (error) {
      console.error('🎬 비디오 업로드 오류:', error)
      setSnackbarMessage(error.message)
      setSnackbarSeverity('error')
    }
  }, [])

  /**
   * 비디오 삭제 핸들러
   */
  const handleVideoDelete = useCallback((videoId) => {
    setV2Videos(prev => prev.filter(video => video.id !== videoId))
    setSnackbarMessage('비디오가 삭제되었습니다.')
    setSnackbarSeverity('info')
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
      const oldIndex = v2Videos.findIndex(video => video.id === active.id)
      const newIndex = v2Videos.findIndex(video => video.id === over?.id)
      
      if (oldIndex !== -1 && newIndex !== -1) {
        setV2Videos(prev => {
          const newVideos = [...prev]
          const [movedVideo] = newVideos.splice(oldIndex, 1)
          newVideos.splice(newIndex, 0, movedVideo)
          return newVideos
        })
      }
    }
  }, [v2Videos])

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
            V2 - 비디오 타임라인
          </Typography>
          <Chip 
            icon={<AutoAwesome />} 
            label="Veo3 AI" 
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* 뷰 모드 토글 */}
          <Tooltip title="그리드 뷰">
            <IconButton
              size="small"
              onClick={() => setViewMode('grid')}
              color={viewMode === 'grid' ? 'primary' : 'default'}
            >
              <GridView />
            </IconButton>
          </Tooltip>

          <Tooltip title="리스트 뷰">
            <IconButton
              size="small"
              onClick={() => setViewMode('list')}
              color={viewMode === 'list' ? 'primary' : 'default'}
            >
              <ViewList />
            </IconButton>
          </Tooltip>

          {/* 줌 컨트롤 */}
          <Tooltip title="축소">
            <IconButton
              size="small"
              onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.1))}
            >
              <ZoomOut />
            </IconButton>
          </Tooltip>

          <Tooltip title="확대">
            <IconButton
              size="small"
              onClick={() => setZoomLevel(prev => Math.min(2, prev + 0.1))}
            >
              <ZoomIn />
            </IconButton>
          </Tooltip>

          {/* 비디오 업로드 버튼 */}
          <Tooltip title="비디오 업로드">
            <IconButton
              size="small"
              onClick={() => setShowVideoUploadDialog(true)}
              color="primary"
            >
              <Add />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* 타임라인 컨텐츠 */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                {v2Videos.length === 0 ? (
          // 빈 상태 - 드롭 영역으로 사용
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: '400px',
              textAlign: 'center',
              color: 'var(--color-text-secondary)',
              border: '3px dashed var(--color-accent)',
              borderRadius: 3,
              transition: 'all 0.3s ease',
              backgroundColor: 'rgba(212, 175, 55, 0.02)',
              '&:hover': {
                borderColor: 'var(--color-primary)',
                backgroundColor: 'rgba(52, 152, 219, 0.05)',
                transform: 'scale(1.02)'
              }
            }}
            onDragOver={(event) => {
              event.preventDefault()
              event.currentTarget.style.borderColor = 'var(--color-primary)'
              event.currentTarget.style.backgroundColor = 'rgba(52, 152, 219, 0.1)'
              event.currentTarget.style.transform = 'scale(1.05)'
            }}
            onDragLeave={(event) => {
              event.preventDefault()
              event.currentTarget.style.borderColor = 'var(--color-accent)'
              event.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.02)'
              event.currentTarget.style.transform = 'scale(1)'
            }}
            onDrop={(event) => {
              event.preventDefault()
              event.currentTarget.style.borderColor = 'var(--color-accent)'
              event.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.02)'
              event.currentTarget.style.transform = 'scale(1)'
              
              const data = event.dataTransfer.getData('application/json')
              if (data) {
                try {
                  const dragData = JSON.parse(data)
                  if (dragData.type === 'cut-from-v1' && dragData.source === 'timeline-v1') {
                    console.log('🎬 V1에서 V2로 컷 드롭됨:', dragData.cut)
                    handleCutDropFromV1(dragData.cut)
                  }
                } catch (error) {
                  console.error('드롭 데이터 파싱 오류:', error)
                }
              }
            }}
          >
            <VideoLibrary sx={{ 
              fontSize: 80, 
              mb: 3, 
              opacity: 0.6,
              color: 'var(--color-accent)'
            }} />
            
            <Typography 
              variant="h5" 
              sx={{ 
                mb: 2,
                color: 'var(--color-text-primary)',
                fontWeight: 'bold'
              }}
            >
              V2 타임라인 준비 완료
            </Typography>
            
            <Typography 
              variant="body1" 
          sx={{
                mb: 1,
                color: 'var(--color-text-secondary)',
                maxWidth: '400px'
              }}
            >
              V1 타임라인에서 컷을 드래그하여 AI 영상을 생성하거나
              </Typography>
            
            <Typography 
              variant="body1" 
              sx={{ 
                mb: 4,
                color: 'var(--color-text-secondary)',
                maxWidth: '400px'
              }}
            >
              비디오 파일을 업로드해주세요
              </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setShowVideoUploadDialog(true)}
                sx={{
                  backgroundColor: 'var(--color-accent)',
                  color: 'var(--color-text-primary)',
                  '&:hover': {
                    backgroundColor: 'var(--color-primary)'
                  }
                }}
              >
                비디오 업로드
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<AutoAwesome />}
                sx={{
                  borderColor: 'var(--color-accent)',
                  color: 'var(--color-accent)',
                  '&:hover': {
                    borderColor: 'var(--color-primary)',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)'
                  }
                }}
              >
                AI 영상 생성
              </Button>
            </Box>
            
            <Typography 
              variant="caption" 
              sx={{
                mt: 3,
                color: 'var(--color-text-secondary)',
                opacity: 0.7
              }}
            >
              💡 팁: V1 타임라인에서 컷을 이 영역으로 드래그하면 AI가 자동으로 영상을 생성합니다
            </Typography>
          </Box>
        ) : (
          // 비디오 목록 표시 - 드롭 영역도 포함
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(300px, 1fr))' : '1fr',
              gap: 2,
              minHeight: '200px',
              position: 'relative'
            }}
            onDragOver={(event) => {
              event.preventDefault()
              event.currentTarget.style.backgroundColor = 'rgba(52, 152, 219, 0.05)'
            }}
            onDragLeave={(event) => {
              event.preventDefault()
              event.currentTarget.style.backgroundColor = 'transparent'
            }}
            onDrop={(event) => {
              event.preventDefault()
              event.currentTarget.style.backgroundColor = 'transparent'
              
              const data = event.dataTransfer.getData('application/json')
              if (data) {
                try {
                  const dragData = JSON.parse(data)
                  if (dragData.type === 'cut-from-v1' && dragData.source === 'timeline-v1') {
                    console.log('🎬 V1에서 V2로 컷 드롭됨 (비디오 목록 영역):', dragData.cut)
                    handleCutDropFromV1(dragData.cut)
                  }
                } catch (error) {
                  console.error('드롭 데이터 파싱 오류:', error)
                }
              }
            }}
          >
            {v2Videos.map((video, index) => (
              <TimelineV2Video
                key={video.id}
                video={video}
                  index={index}
                  viewMode={viewMode}
                zoomLevel={zoomLevel}
                onDelete={handleVideoDelete}
                />
              ))}
            </Box>
          )}
        </Box>

      {/* 비디오 업로드 다이얼로그 */}
      <Dialog
        open={showVideoUploadDialog}
        onClose={() => setShowVideoUploadDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>비디오 업로드</DialogTitle>
        <DialogContent>
          <VideoUploader
            onVideoUpload={handleVideoUpload}
            onVideoRemove={() => {}}
          />
        </DialogContent>
      </Dialog>

      {/* AI 생성 다이얼로그 */}
      <Dialog
        open={showAIGenerationDialog}
        onClose={() => !isGeneratingAI && setShowAIGenerationDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          AI 영상 생성 중...
          {isGeneratingAI && (
            <LinearProgress 
              variant="determinate" 
              value={aiGenerationProgress} 
              sx={{ mt: 1 }}
            />
          )}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {aiGenerationMessage}
          </Typography>
          {isGeneratingAI && (
            <Alert severity="info" sx={{ mb: 2 }}>
              AI 영상 생성에는 몇 분 정도 소요될 수 있습니다.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowAIGenerationDialog(false)}
            disabled={isGeneratingAI}
          >
            취소
          </Button>
        </DialogActions>
      </Dialog>

      {/* 스낵바 */}
      <Snackbar
        open={!!snackbarMessage}
        autoHideDuration={6000}
        onClose={() => setSnackbarMessage('')}
      >
        <Alert
          onClose={() => setSnackbarMessage('')}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}

/**
 * V2 비디오 컴포넌트
 */
const TimelineV2Video = ({ 
  video, 
  index, 
  viewMode,
  zoomLevel,
  onDelete 
}) => {
  const theme = useTheme()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: video.id
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  // 파일 크기 포맷팅
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Box
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        overflow: 'hidden',
        cursor: 'grab',
        backgroundColor: 'var(--color-card-bg)',
        '&:hover': {
          boxShadow: theme.shadows[4],
          transform: 'translateY(-2px)',
          transition: 'all 0.2s ease'
        }
      }}
    >
      {/* 비디오 썸네일 */}
      <Box sx={{ position: 'relative' }}>
        <video
          src={video.videoUrl}
          style={{
            width: '100%',
            height: viewMode === 'grid' ? '200px' : '120px',
            objectFit: 'cover'
          }}
          controls
          preload="metadata"
        />
        
        {/* 비디오 타입 배지 */}
            <Chip
          label={video.type === 'ai_generated' ? 'AI 생성' : '업로드'}
              size="small"
          color={video.type === 'ai_generated' ? 'primary' : 'default'}
            sx={{
              position: 'absolute',
            top: 8,
            left: 8,
            backgroundColor: video.type === 'ai_generated' ? 'var(--color-accent)' : 'var(--color-primary)',
            color: 'white',
            fontWeight: 'bold'
          }}
        />
        
        {/* 삭제 버튼 */}
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(video.id)
          }}
            sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            '&:hover': {
              backgroundColor: 'var(--color-danger)'
            }
          }}
        >
          <Delete />
        </IconButton>
      </Box>

      {/* 비디오 정보 */}
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'var(--color-text-primary)' }}>
          {video.title}
        </Typography>
        {video.description && (
          <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)', mb: 1 }}>
            {video.description}
          </Typography>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" sx={{ color: 'var(--color-text-secondary)' }}>
            {video.duration}초
          </Typography>
          {video.fileSize && (
            <Typography variant="caption" sx={{ color: 'var(--color-text-secondary)' }}>
              {formatFileSize(video.fileSize)}
            </Typography>
            )}
          </Box>
        <Typography variant="caption" sx={{ color: 'var(--color-text-secondary)', display: 'block', mt: 0.5 }}>
          {new Date(video.createdAt).toLocaleString()}
        </Typography>
      </Box>
    </Box>
  )
}

export default TimelineV2 