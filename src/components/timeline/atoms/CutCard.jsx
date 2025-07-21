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
  AccessTime,
  Refresh,
  Videocam,
  Person,
  Settings
} from '@mui/icons-material'
import toast from 'react-hot-toast'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SceneType } from '../../../types/conte'
import { 
  formatTimeFromSeconds, 
  formatTimeShort, 
  formatTimeHumanReadable,
  calculateMinSceneWidth,
  processImageUrl
} from '../../../utils/timelineUtils'

/**
 * 컷 카드 컴포넌트 - 타임라인에서 개별 컷을 표시
 * 컷의 상세 정보를 카드 형태로 표시하고 드래그 가능
 * 시간 기반 타임라인을 지원하여 컷의 지속 시간에 따라 너비가 동적으로 조정됨
 */
const CutCard = React.memo(({ 
  cut, 
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
  showTimeInfo = true, // 시간 정보 표시 여부
  width = null // 외부에서 전달된 너비 (우선 사용)
}) => {
  // cut 객체가 유효하지 않으면 빈 카드 반환
  if (!cut || !cut.id) {
    console.warn('CutCard: Invalid cut object', cut)
    return (
      <Box
        sx={{
          width: width || 200,
          height: 150,
          backgroundColor: 'var(--color-card-bg)',
          borderRadius: '8px',
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
          유효하지 않은 컷
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
    id: cut.id,
    disabled: !isDraggable
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 1000 : 'auto',
    rotate: isDragging ? '2deg' : '0deg',
    boxShadow: isDragging ? '0 8px 32px rgba(212, 175, 55, 0.3)' : 'none',
  }

  // 컷 타입에 따른 아이콘과 색상 결정
  const getCutTypeInfo = (cutType) => {
    switch (cutType) {
      case 'master':
        return {
          icon: <Videocam />,
          label: '마스터',
          color: 'primary',
          bgColor: 'rgba(52, 152, 219, 0.1)',
          borderColor: 'rgba(52, 152, 219, 0.3)'
        }
      case 'close_up':
        return {
          icon: <Person />,
          label: '클로즈업',
          color: 'secondary',
          bgColor: 'rgba(155, 89, 182, 0.1)',
          borderColor: 'rgba(155, 89, 182, 0.3)'
        }
      case 'medium_shot':
        return {
          icon: <CameraAlt />,
          label: '미디엄',
          color: 'success',
          bgColor: 'rgba(46, 204, 113, 0.1)',
          borderColor: 'rgba(46, 204, 113, 0.3)'
        }
      case 'wide_shot':
        return {
          icon: <Settings />,
          label: '와이드',
          color: 'warning',
          bgColor: 'rgba(212, 175, 55, 0.1)',
          borderColor: 'rgba(212, 175, 55, 0.3)'
        }
      default:
        return {
          icon: <Settings />,
          label: '기본',
          color: 'default',
          bgColor: 'rgba(160, 163, 177, 0.1)',
          borderColor: 'rgba(160, 163, 177, 0.3)'
        }
    }
  }

  const typeInfo = getCutTypeInfo(cut.cutType || 'medium_shot')

  // 카드 너비 계산 - 외부에서 전달된 너비 우선 사용
  const cutDuration = cut?.estimatedDuration || 5
  let cardWidth = width || 200 // 외부에서 전달된 너비가 있으면 사용, 없으면 기본값
  
  // 외부에서 너비가 전달되지 않은 경우에만 내부 계산 수행
  if (width === null) {
    const baseWidth = 100 // 기본 너비를 100px로 축소
    const minWidth = Math.max(calculateMinSceneWidth(zoomLevel, 30), 60) // 최소 너비를 60px로 축소
    
    // 시간 기반 너비 계산 개선
    if (timeScale > 0 && cutDuration > 0) {
      // 시간을 픽셀로 변환 (1초당 픽셀 수)
      const pixelsPerSecond = 1 / timeScale // timeScale이 작을수록 더 많은 픽셀 필요
      const timeBasedWidth = cutDuration * pixelsPerSecond
      
      // 최소 너비와 최대 너비 제한 - 줌 레벨에 따라 동적 조정
      const maxWidth = Math.max(400, (1 / timeScale) * 100) // 줌 레벨에 따라 최대 너비 조정
      cardWidth = Math.max(minWidth, Math.min(timeBasedWidth, maxWidth))
      
      // 디버깅 로그
      console.log(`CutCard 내부 계산 컷 ${cut.shotNumber}: duration=${cutDuration}s, timeScale=${timeScale}, pixelsPerSecond=${pixelsPerSecond}, timeBasedWidth=${timeBasedWidth}px, finalWidth=${cardWidth}px`)
    } else if (cutDuration > 0) {
      // timeScale이 0이지만 duration이 있는 경우 기본 계산
      const estimatedWidth = Math.max(cutDuration * 3, minWidth) // 1초당 3픽셀로 조정
      cardWidth = Math.min(estimatedWidth, 150) // 최대 150픽셀로 축소
      
      // 디버깅 로그
      console.log(`CutCard 내부 계산 컷 ${cut.shotNumber}: duration=${cutDuration}s, fallback width=${cardWidth}px`)
    }
  } else {
    // 외부에서 전달된 너비 사용 시 로그
    console.log(`CutCard 외부 너비 사용 컷 ${cut.shotNumber}: width=${width}px`)
  }

  // 시간 정보 포맷팅
  const durationText = formatTimeShort(cutDuration)
  const durationFullText = formatTimeFromSeconds(cutDuration)
  const durationHumanText = formatTimeHumanReadable(cutDuration)

  // 로딩 상태일 때 스켈레톤 표시
  if (loading) {
    return (
      <Box
        sx={{
          width: cardWidth,
          height: 150,
          backgroundColor: 'var(--color-card-bg)',
          borderRadius: '8px',
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
        <Box sx={{ height: 16, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1 }} />
        <Box sx={{ height: 12, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1, width: '60%' }} />
        <Box sx={{ height: 12, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1, width: '80%' }} />
        <Box sx={{ height: 12, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1, width: '40%' }} />
      </Box>
    )
  }

  return (
    <Box
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(event) => {
        if (onClick) {
          // Shift 키가 눌린 상태에서 클릭하면 씬 편집 모드로 처리
          if (event.shiftKey) {
            console.log('🎬 Shift + 클릭: 씬 편집 모드')
            // 씬 정보로 변환하여 전달
            const sceneData = {
              ...cut,
              scene: cut.sceneNumber || cut.sceneId,
              title: cut.sceneTitle || cut.title,
              description: cut.description || '',
              type: 'live_action',
              estimatedDuration: cut.estimatedDuration || cut.duration || 5,
              imageUrl: cut.imageUrl || null,
              isCut: false, // 씬 편집 모드 표시
              originalCut: cut // 원본 컷 정보 보존
            }
            onClick(sceneData)
          } else {
            console.log('🎬 일반 클릭: 컷 편집 모드')
            // 컷 편집 모드로 처리
            const cutData = {
              ...cut,
              isCut: true // 컷 편집 모드 표시
            }
            onClick(cutData)
          }
        }
      }}
      onMouseEnter={() => onMouseEnter && onMouseEnter()}
      onMouseLeave={() => onMouseLeave && onMouseLeave()}
      sx={{
        width: cardWidth,
        height: 150,
        backgroundColor: 'var(--color-card-bg)',
        borderRadius: '8px',
        border: `2px solid ${selected ? 'var(--color-accent)' : typeInfo.borderColor}`,
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          borderColor: 'var(--color-accent)'
        },
        ...(isMultiSelected && {
          backgroundColor: 'rgba(212, 175, 55, 0.1)',
          borderColor: 'var(--color-accent)'
        })
      }}
    >
      {/* 컷 헤더 */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        mb: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
          <Box sx={{ 
            color: 'var(--color-accent)',
            display: 'flex',
            alignItems: 'center'
          }}>
            {typeInfo.icon}
          </Box>
          <Typography
            variant="subtitle2"
            sx={{
              font: 'var(--font-body-2)',
              color: 'var(--color-text-primary)',
              fontWeight: 600,
              lineHeight: 1.2
            }}
          >
            컷 {cut.shotNumber}
          </Typography>
        </Box>
        
        {/* 컷 타입 칩 */}
        <Chip
          icon={typeInfo.icon}
          label={typeInfo.label}
          size="small"
          color={typeInfo.color}
          sx={{
            height: 20,
            fontSize: '0.7rem',
            backgroundColor: typeInfo.bgColor,
            color: 'var(--color-text-primary)',
            '& .MuiChip-icon': {
              fontSize: '0.8rem'
            }
          }}
        />
      </Box>

      {/* 컷 이미지 */}
      {cut.imageUrl && (
        <Box sx={{ 
          width: '100%', 
          height: 60, 
          borderRadius: 1,
          overflow: 'hidden',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          position: 'relative',
          mb: 1,
          backgroundColor: 'rgba(212, 175, 55, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <img 
            src={cut.imageUrl.startsWith('/') ? `http://localhost:5001${cut.imageUrl}` : cut.imageUrl} 
            alt={`컷 ${cut.shotNumber} 이미지`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            onError={(e) => {
              console.error('❌ 컷 이미지 로딩 실패:', {
                cutId: cut.id,
                shotNumber: cut.shotNumber,
                imageUrl: cut.imageUrl
              })
              
              // 이미지 로딩 실패 시 대체 이미지 표시
              // 여러 fallback 옵션 시도
              if (e.target.src.includes('dev_placeholder.png')) {
                // 이미 placeholder를 시도했는데도 실패하면 빈 이미지로 처리
                e.target.style.display = 'none'
                e.target.parentElement.style.backgroundColor = 'rgba(160, 163, 177, 0.3)'
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
                      <div>컷 ${cut.shotNumber}</div>
                      <div style="font-size: 10px; opacity: 0.7;">이미지 없음</div>
                    </div>
                  </div>
                `
              } else {
                // 첫 번째 시도 실패 시 placeholder 이미지로 재시도
                e.target.src = 'http://localhost:5001/uploads/images/dev_placeholder.png'
                e.target.onerror = null // 무한 루프 방지
              }
            }}
          />
        </Box>
      )}

      {/* 컷 제목 */}
      <Typography
        variant="body2"
        sx={{
          font: 'var(--font-body-2)',
          color: 'var(--color-text-primary)',
          fontWeight: 500,
          lineHeight: 1.3,
          mb: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical'
        }}
      >
        {cut.title || `컷 ${cut.shotNumber}`}
      </Typography>

      {/* 컷 설명 */}
      {cut.description && (
        <Typography
          variant="caption"
          sx={{
            font: 'var(--font-caption)',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            mb: 1
          }}
        >
          {cut.description}
        </Typography>
      )}

      {/* 조명 세팅 정보 */}
      {cut.lightingSetup && (
        <Box sx={{ mt: 1, mb: 1 }}>
          <Typography
            variant="caption"
            sx={{
              font: 'var(--font-caption)',
              color: 'var(--color-text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5
            }}
          >
            💡 {cut.lightingSetup.mainLight || '조명'}
          </Typography>
        </Box>
      )}

      {/* 컷 정보 행 */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mt: 'auto'
      }}>
        {/* 시간 정보 */}
        {showTimeInfo && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AccessTime sx={{ fontSize: 14, color: 'var(--color-text-secondary)' }} />
            <Typography
              variant="caption"
              sx={{
                font: 'var(--font-caption)',
                color: 'var(--color-text-secondary)'
              }}
            >
              {durationText}
            </Typography>
          </Box>
        )}

        {/* 씬 정보 */}
        {cut.sceneTitle && (
          <Typography
            variant="caption"
            sx={{
              font: 'var(--font-caption)',
              color: 'var(--color-text-secondary)',
              textAlign: 'right',
              maxWidth: '60%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            씬 {cut.sceneNumber}
          </Typography>
        )}
      </Box>

      {/* 액션 버튼들 (호버 시 표시) */}
      <Box sx={{
        position: 'absolute',
        top: 8,
        right: 8,
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
              onClick={(e) => {
                e.stopPropagation()
                onEdit(cut)
              }}
              sx={{
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.8)'
                }
              }}
            >
              <Edit sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        )}
        
        {onInfo && (
          <Tooltip title="정보">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation()
                onInfo(cut)
              }}
              sx={{
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.8)'
                }
              }}
            >
              <Info sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* 드래그 핸들러 */}
      {isDraggable && (
        <Box sx={{
          position: 'absolute',
          top: 8,
          left: 8,
          opacity: 0.5,
          '&:hover': {
            opacity: 1
          }
        }}>
          <DragIndicator sx={{ fontSize: 16, color: 'var(--color-text-secondary)' }} />
        </Box>
      )}

      {/* 선택 표시 */}
      {selected && (
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          border: '2px solid var(--color-accent)',
          borderRadius: '8px',
          pointerEvents: 'none'
        }} />
      )}
    </Box>
  )
})

export default CutCard 