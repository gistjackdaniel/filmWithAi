import React from 'react'
import { 
  Box, 
  Typography, 
  Chip,
  IconButton,
  Tooltip
} from '@mui/material'
import { 
  PlayArrow, 
  CameraAlt,
  Edit,
  Info,
  DragIndicator,
  AccessTime
} from '@mui/icons-material'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CaptionCardType } from '../../../types/timeline'
import { 
  formatTimeFromSeconds, 
  formatTimeShort, 
  formatTimeHumanReadable,
  calculateMinSceneWidth 
} from '../../../utils/timelineUtils'

/**
 * 씬 카드 컴포넌트 - 타임라인에서 개별 씬을 표시
 * 캡션카드의 축약된 정보를 카드 형태로 표시하고 드래그 가능
 * 시간 기반 타임라인을 지원하여 씬의 지속 시간에 따라 너비가 동적으로 조정됨
 */
const SceneCard = React.memo(({ 
  scene, 
  onClick, 
  onEdit, 
  onInfo,
  selected = false,
  isMultiSelected = false,
  loading = false,
  isDraggable = false,
  onMouseEnter,
  onMouseLeave,
  timeScale = 1, // 픽셀당 시간 (초)
  zoomLevel = 1, // 줌 레벨
  showTimeInfo = true // 시간 정보 표시 여부
}) => {
  // scene 객체가 유효하지 않으면 빈 카드 반환
  if (!scene || !scene.id) {
    console.warn('SceneCard: Invalid scene object', scene)
    return (
      <Box
        sx={{
          width: 280,
          height: 200,
          backgroundColor: 'var(--color-card-bg)',
          borderRadius: '12px',
          border: '1px solid var(--color-scene-card-border)',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          opacity: 0.3,
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Typography variant="body2" color="text.secondary">
          유효하지 않은 씬
        </Typography>
      </Box>
    )
  }

  // 드래그 앤 드롭 설정
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: scene.id,
    disabled: !isDraggable
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1, // 투명도 개선
    zIndex: isDragging ? 1000 : 'auto',
    rotate: isDragging ? '2deg' : '0deg', // 드래그 중 회전 효과 추가
    boxShadow: isDragging ? '0 8px 32px rgba(212, 175, 55, 0.3)' : 'none', // 드래그 중 그림자 효과
  }

  // 씬 타입에 따른 아이콘과 색상 결정
  const getSceneTypeInfo = (type) => {
    switch (type) {
      case CaptionCardType.GENERATED_VIDEO:
        return {
          icon: <PlayArrow />,
          label: 'AI 비디오',
          color: 'success',
          bgColor: 'rgba(46, 204, 113, 0.1)',
          borderColor: 'rgba(46, 204, 113, 0.3)'
        }
      case CaptionCardType.LIVE_ACTION:
        return {
          icon: <CameraAlt />,
          label: '실사 촬영',
          color: 'warning',
          bgColor: 'rgba(212, 175, 55, 0.1)',
          borderColor: 'rgba(212, 175, 55, 0.3)'
        }
      default:
        return {
          icon: <Info />,
          label: '미분류',
          color: 'default',
          bgColor: 'rgba(160, 163, 177, 0.1)',
          borderColor: 'rgba(160, 163, 177, 0.3)'
        }
    }
  }

  const typeInfo = getSceneTypeInfo(scene.type || 'default')

  // 시간 기반 너비 계산
  const sceneDuration = scene?.duration || 0
  const baseWidth = 280 // 기본 너비
  const minWidth = calculateMinSceneWidth(zoomLevel, 100) // 최소 너비
  const timeBasedWidth = Math.max(
    sceneDuration / timeScale, // 시간 기반 너비
    minWidth // 최소 너비
  )
  const cardWidth = timeScale > 0 ? timeBasedWidth : baseWidth

  // 시간 정보 포맷팅
  const durationText = formatTimeShort(sceneDuration)
  const durationFullText = formatTimeFromSeconds(sceneDuration)
  const durationHumanText = formatTimeHumanReadable(sceneDuration)

  // 로딩 상태일 때 스켈레톤 표시
  if (loading) {
    return (
      <Box
        sx={{
          width: cardWidth,
          height: 200,
          backgroundColor: 'var(--color-card-bg)',
          borderRadius: '12px',
          border: '1px solid var(--color-scene-card-border)',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          opacity: 0.6,
          animation: 'pulse 1.5s ease-in-out infinite',
          '@keyframes pulse': {
            '0%': { opacity: 0.6 },
            '50%': { opacity: 0.3 },
            '100%': { opacity: 0.6 }
          }
        }}
      >
        <Box sx={{ height: 20, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1 }} />
        <Box sx={{ height: 16, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1, width: '60%' }} />
        <Box sx={{ height: 16, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1, width: '80%' }} />
        <Box sx={{ height: 16, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1, width: '40%' }} />
      </Box>
    )
  }

  return (
    <Box
      ref={setNodeRef}
      style={style}
      {...(isDraggable ? { ...attributes, ...listeners } : {})} // 전체 카드에서 드래그 가능
      role="button"
      aria-label={`씬 ${scene.components?.sceneNumber || scene.scene}: ${scene.components?.description || scene.description}`}
      aria-describedby={`scene-${scene.id}-type`}
      sx={{
        width: cardWidth,
        minHeight: 200,
        backgroundColor: 'var(--color-card-bg)',
        borderRadius: '12px',
        border: selected 
          ? '2px solid var(--color-accent)' 
          : isMultiSelected
          ? '2px solid var(--color-success)'
          : `1px solid ${typeInfo.borderColor}`,
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        cursor: isDraggable ? 'grab' : 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', // 성능 최적화된 이징
        position: 'relative',
        willChange: 'transform, opacity', // 하드웨어 가속 힌트
        transform: 'translateZ(0)', // GPU 가속 활성화
        '&:hover': {
          transform: isDraggable ? 'translateY(-2px) scale(1.02) translateZ(0)' : 'translateY(-2px) translateZ(0)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
          borderColor: isMultiSelected ? 'var(--color-success)' : 'var(--color-accent)'
        },
        '&:active': {
          cursor: isDraggable ? 'grabbing' : 'pointer'
        }
      }}
      onClick={onClick}
      onMouseEnter={() => {
        if (onMouseEnter && scene && scene.id) {
          onMouseEnter()
        }
      }}
      onMouseLeave={() => {
        if (onMouseLeave && scene && scene.id) {
          onMouseLeave()
        }
      }}
    >
      {/* 드래그 핸들 - 우측 하단으로 이동 */}
      {isDraggable && (
        <Tooltip title="드래그하여 순서 변경" placement="top">
          <Box
            component="button"
            type="button"
            tabIndex={0}
            aria-label={`씬 ${scene.components?.sceneNumber || scene.scene} 순서 변경`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                // 키보드 드래그 시작 로직 (향후 구현)
                console.log('Keyboard drag start for scene:', scene.id)
              }
            }}
            sx={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              color: 'var(--color-text-secondary)',
              opacity: 0.6,
              cursor: 'grab',
              padding: '6px',
              borderRadius: '6px',
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(4px)',
              border: 'none',
              outline: 'none',
              '&:hover': {
                opacity: 1,
                color: 'var(--color-accent)',
                backgroundColor: 'rgba(212, 175, 55, 0.2)',
                transform: 'scale(1.1)'
              },
              '&:focus': {
                opacity: 1,
                color: 'var(--color-accent)',
                backgroundColor: 'rgba(212, 175, 55, 0.2)',
                outline: '2px solid var(--color-accent)',
                outlineOffset: '2px'
              },
              '&:active': {
                cursor: 'grabbing',
                transform: 'scale(0.95)'
              },
              transition: 'all 0.2s ease',
              zIndex: 10
            }}
          >
            <DragIndicator fontSize="medium" />
          </Box>
        </Tooltip>
      )}

      {/* 씬 번호와 타입 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography 
          variant="h6" 
          sx={{ 
            font: 'var(--font-heading-2)',
            color: 'var(--color-text-primary)'
          }}
        >
          씬 {scene.components?.sceneNumber || scene.scene}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {/* 시간 정보 표시 */}
          {showTimeInfo && sceneDuration > 0 && (
            <Tooltip title={`지속 시간: ${durationFullText} (${durationHumanText})`} placement="top">
              <Chip
                icon={<AccessTime />}
                label={durationText}
                size="small"
                sx={{ 
                  backgroundColor: 'rgba(212, 175, 55, 0.1)',
                  color: 'var(--color-accent)',
                  fontSize: '0.75rem',
                  height: '24px',
                  '& .MuiChip-icon': {
                    color: 'var(--color-accent)',
                    fontSize: '0.875rem'
                  }
                }}
              />
            </Tooltip>
          )}
          <Chip
            icon={typeInfo.icon}
            label={typeInfo.label}
            color={typeInfo.color}
            size="small"
            id={`scene-${scene.id}-type`}
            aria-label={`씬 타입: ${typeInfo.label}`}
            sx={{ 
              backgroundColor: typeInfo.bgColor,
              color: 'var(--color-text-primary)',
              '& .MuiChip-icon': {
                color: 'var(--color-accent)'
              }
            }}
          />
        </Box>
      </Box>

      {/* 씬 설명 */}
      <Typography 
        variant="body2" 
        sx={{ 
          font: 'var(--font-body-2)',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.4,
          flex: 1,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical'
        }}
      >
        {scene.components?.description || scene.description}
      </Typography>

      {/* 대사 미리보기 */}
      {scene.components?.dialogue && (
        <Typography 
          variant="caption" 
          sx={{ 
            font: 'var(--font-caption)',
            color: 'var(--color-accent)',
            fontStyle: 'italic',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          "{scene.components.dialogue}"
        </Typography>
      )}

      {/* 액션 버튼들 */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
        <Tooltip title="상세 정보">
          <IconButton 
            size="small" 
            onClick={(e) => {
              e.stopPropagation()
              onInfo?.(scene)
            }}
            sx={{ 
              color: 'var(--color-text-secondary)',
              '&:hover': { color: 'var(--color-accent)' }
            }}
          >
            <Info fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="편집">
          <IconButton 
            size="small" 
            onClick={(e) => {
              e.stopPropagation()
              onEdit?.(scene)
            }}
            sx={{ 
              color: 'var(--color-text-secondary)',
              '&:hover': { color: 'var(--color-accent)' }
            }}
          >
            <Edit fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  )
})

export default SceneCard 