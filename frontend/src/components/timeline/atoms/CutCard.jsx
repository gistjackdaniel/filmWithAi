import React from 'react'
import { 
  Box, 
  Typography, 
  Chip,
  IconButton,
  Tooltip,
  Paper
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
  Settings,
  AutoAwesome
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
 * V2로 드래그 앤 드롭 기능 지원
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
  width = null, // 외부에서 전달된 너비 (우선 사용)
  onDragStart, // V2로 드래그 시작 시 호출
  onDragEnd // V2로 드래그 종료 시 호출
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

  // 드래그 앤 드롭 설정 (V1 내부 정렬용)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: cut.id,
    disabled: true // V2 드래그를 위해 V1 정렬 비활성화
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  }

  /**
   * V2로 드래그 시작 핸들러
   */
  const handleDragStart = (event) => {
    console.log('🎬 V1 컷 드래그 시작:', cut.title || cut.id)
    
    // V2로 드래그할 수 있도록 데이터 설정
    event.dataTransfer.setData('application/json', JSON.stringify({
      type: 'cut-from-v1',
      cut: cut,
      source: 'timeline-v1'
    }))
    
    // 드래그 이미지 설정
    if (event.target) {
      event.dataTransfer.setDragImage(event.target, 0, 0)
    }
    
    if (onDragStart) {
      onDragStart(event, cut)
    }
  }

  /**
   * V2로 드래그 종료 핸들러
   */
  const handleDragEnd = (event) => {
    // V2로 드래그되었는지 확인
    const data = event.dataTransfer.getData('application/json')
    if (data) {
      try {
        const dragData = JSON.parse(data)
        if (dragData.type === 'cut-from-v1' && dragData.source === 'timeline-v1') {
          
          if (onDragEnd) {
            onDragEnd(event)
          }
        }
      } catch (error) {
        console.error('드래그 데이터 파싱 오류:', error)
      }
    }
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

  // 호버 시 표시할 요약 정보 생성
  const getSummaryInfo = () => {
    const shotSize = cut.shootingPlan?.shotSize || cut.shotSize || 'MS'
    const angleDirection = cut.shootingPlan?.angleDirection || cut.angleDirection || 'Eye-level'
    const cameraMovement = cut.shootingPlan?.cameraMovement || cut.cameraMovement || 'Static'
    const lensSpecs = cut.shootingPlan?.lensSpecs || cut.lensSpecs || ''
    const lighting = cut.shootingConditions?.lighting || cut.lighting || ''
    const weather = cut.shootingConditions?.weather || cut.weather || ''
    const timeOfDay = cut.shootingConditions?.timeOfDay || cut.timeOfDay || ''
    
    return {
      shotSize,
      angleDirection,
      cameraMovement,
      lensSpecs,
      lighting,
      weather,
      timeOfDay
    }
  }

  const summaryInfo = getSummaryInfo()

  // 카드 너비 계산 - 외부에서 전달된 너비 우선 사용
  const cutDuration = typeof cut?.estimatedDuration === 'number' ? cut.estimatedDuration : (cut?.duration || 5)
  let cardWidth = width || 200 // 외부에서 전달된 너비가 있으면 사용, 없으면 기본값
  
  // 외부에서 너비가 전달되지 않은 경우에만 내부 계산 수행
  if (width === null) {
    const minWidth = 60 // 최소 너비
    
    // 시간 기반 너비 계산 - TimeRuler와 동기화 (여백 없음)
    if (cutDuration > 0 && timeScale > 0) {
      // TimeRuler와 동일한 계산 공식 사용 (연속 배치)
      const pixelsPerSecond = 1 / timeScale // timeScale이 작을수록 더 많은 픽셀 필요
      const timeBasedWidth = cutDuration * pixelsPerSecond
      
      // 최소 너비와 최대 너비 제한 (여백 없이 연속 배치)
      const maxWidth = Math.max(400, cutDuration * 20) // 최대 1초당 20px
      cardWidth = Math.max(minWidth, Math.min(timeBasedWidth, maxWidth))
      
    } else if (cutDuration > 0) {
      // timeScale이 0이지만 duration이 있는 경우 기본 계산
      const basePixelsPerSecond = 10
      const timeBasedWidth = cutDuration * basePixelsPerSecond
      cardWidth = Math.max(minWidth, Math.min(timeBasedWidth, 150))
      
    }
  } else {
    // 외부에서 전달된 너비 사용 시 로그
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
    <Tooltip
      title={
        <Paper sx={{ p: 2, maxWidth: 300 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
            컷 {cut.shotNumber} - {cut.title}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {cut.description}
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, fontSize: '0.8rem' }}>
            <Box>
              <Typography variant="caption" color="text.secondary">샷 사이즈:</Typography>
              <Typography variant="body2">{summaryInfo.shotSize}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">앵글:</Typography>
              <Typography variant="body2">{summaryInfo.angleDirection}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">카메라 움직임:</Typography>
              <Typography variant="body2">{summaryInfo.cameraMovement}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">렌즈:</Typography>
              <Typography variant="body2">{summaryInfo.lensSpecs || 'N/A'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">조명:</Typography>
              <Typography variant="body2">{summaryInfo.lighting || 'N/A'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">날씨:</Typography>
              <Typography variant="body2">{summaryInfo.weather || 'N/A'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">시간대:</Typography>
              <Typography variant="body2">{summaryInfo.timeOfDay || 'N/A'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">지속시간:</Typography>
              <Typography variant="body2">{durationText}</Typography>
            </Box>
          </Box>
        </Paper>
      }
      placement="top"
      arrow
      enterDelay={500}
      leaveDelay={0}
    >
      <Box
        ref={setNodeRef}
        style={style}
        {...attributes}
        draggable={true} // V2로 드래그하기 위해 항상 활성화
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
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
          height: 80,
          backgroundColor: 'var(--color-card-bg)',
          borderRadius: '4px',
          border: `2px solid ${selected ? 'var(--color-accent)' : typeInfo.borderColor}`,
          p: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          position: 'relative',
          overflow: 'hidden',
          marginRight: 0, // 연속 배치를 위해 여백 제거
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
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
        alignItems: 'center',
        mb: 0.5
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
          <Box sx={{ 
            color: 'var(--color-accent)',
            display: 'flex',
            alignItems: 'center'
          }}>
            {typeInfo.icon}
          </Box>
          <Typography
            variant="caption"
            sx={{
              font: 'var(--font-caption)',
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
            height: 16,
            fontSize: '0.6rem',
            backgroundColor: typeInfo.bgColor,
            color: 'var(--color-text-primary)',
            '& .MuiChip-icon': {
              fontSize: '0.7rem'
            }
          }}
        />
      </Box>

      {/* 컷 이미지 */}
      {cut.imageUrl && cut.imageUrl.trim() ? (
        <Box sx={{ 
          width: '100%', 
          height: 40, 
          borderRadius: 0.5,
          overflow: 'hidden',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          position: 'relative',
          mb: 0.5,
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
              console.warn('컷 이미지 로딩 실패:', cut.imageUrl)
              
              // 이미지 로딩 실패 시 기본 표시
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
                    font-size: 10px;
                    text-align: center;
                    padding: 4px;
                  ">
                    <div>
                      <div style="font-size: 16px; margin-bottom: 2px;">🎬</div>
                      <div>컷 ${cut.shotNumber}</div>
                    </div>
                  </div>
                `
            }}
          />
        </Box>
      ) : (
        // 이미지가 없을 때 기본 표시
        <Box sx={{ 
          width: '100%', 
          height: 40, 
          borderRadius: 0.5,
          border: '1px solid rgba(212, 175, 55, 0.3)',
          mb: 0.5,
          backgroundColor: 'rgba(160, 163, 177, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            color: var(--color-text-secondary);
            font-size: 10px;
            text-align: center;
            padding: 4px;
          ">
            <div>
              <div style="font-size: 16px; margin-bottom: 2px;">🎬</div>
              <div>컷 {cut.shotNumber}</div>
            </div>
          </div>
        </Box>
      )}

      {/* 컷 제목 */}
      <Typography
        variant="caption"
        sx={{
          font: 'var(--font-caption)',
          color: 'var(--color-text-primary)',
          fontWeight: 500,
          lineHeight: 1.2,
          mb: 0.5,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 1,
          WebkitBoxOrient: 'vertical'
        }}
      >
        {cut.title || `컷 ${cut.shotNumber}`}
      </Typography>

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
            <AccessTime sx={{ fontSize: 12, color: 'var(--color-text-secondary)' }} />
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
              <Edit sx={{ fontSize: 12 }} />
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
              <Info sx={{ fontSize: 12 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* 드래그 핸들러 */}
      {isDraggable && (
        <Box sx={{
          position: 'absolute',
          top: 4,
          left: 4,
          opacity: 0.5,
          '&:hover': {
            opacity: 1
          }
        }}>
          <DragIndicator sx={{ fontSize: 12, color: 'var(--color-text-secondary)' }} />
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
          borderRadius: '4px',
          pointerEvents: 'none'
        }} />
      )}
    </Box>
    </Tooltip>
  )
})

export default CutCard 