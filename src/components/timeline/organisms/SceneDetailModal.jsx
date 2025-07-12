import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  Divider,
  Grid,
  Paper
} from '@mui/material'
import {
  Close,
  Edit,
  PlayArrow,
  CameraAlt,
  LocationOn,
  Schedule,
  Videocam,
  Lightbulb,
  WbSunny,
  Person,
  Settings
} from '@mui/icons-material'
import { CaptionCardType } from '../../../types/timeline'

/**
 * 씬 상세 정보 모달 컴포넌트
 * 캡션카드의 모든 구성요소를 상세히 표시
 */
const SceneDetailModal = ({
  open = false,
  scene = null,
  onClose,
  onEdit,
  onRegenerate
}) => {
  if (!scene) return null

  // 씬 타입에 따른 아이콘과 색상
  const getSceneTypeInfo = (type) => {
    switch (type) {
      case CaptionCardType.GENERATED_VIDEO:
        return {
          icon: <PlayArrow />,
          label: 'AI 생성 비디오',
          color: 'success',
          bgColor: 'rgba(46, 204, 113, 0.1)'
        }
      case CaptionCardType.LIVE_ACTION:
        return {
          icon: <CameraAlt />,
          label: '실사 촬영',
          color: 'warning',
          bgColor: 'rgba(212, 175, 55, 0.1)'
        }
      default:
        return {
          icon: <Settings />,
          label: '미분류',
          color: 'default',
          bgColor: 'rgba(160, 163, 177, 0.1)'
        }
    }
  }

  const typeInfo = getSceneTypeInfo(scene.type)

  // 구성요소 섹션 렌더링
  const renderComponentSection = (title, content, icon = null) => {
    if (!content) return null

    return (
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          {icon && (
            <Box sx={{ mr: 1, color: 'var(--color-accent)' }}>
              {icon}
            </Box>
          )}
          <Typography
            variant="h6"
            sx={{
              font: 'var(--font-heading-2)',
              color: 'var(--color-text-primary)'
            }}
          >
            {title}
          </Typography>
        </Box>
        <Typography
          variant="body1"
          sx={{
            font: 'var(--font-body-1)',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.6
          }}
        >
          {content}
        </Typography>
      </Box>
    )
  }

  // 노드 정보 렌더링
  const renderNodeInfo = (nodes = []) => {
    if (!nodes || nodes.length === 0) return null

    const nodeGroups = nodes.reduce((groups, node) => {
      if (!groups[node.type]) {
        groups[node.type] = []
      }
      groups[node.type].push(node)
      return groups
    }, {})

    return (
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h6"
          sx={{
            font: 'var(--font-heading-2)',
            color: 'var(--color-text-primary)',
            mb: 2
          }}
        >
          노드 정보
        </Typography>
        <Grid container spacing={2}>
          {Object.entries(nodeGroups).map(([type, typeNodes]) => (
            <Grid item xs={12} sm={6} key={type}>
              <Paper
                sx={{
                  p: 2,
                  backgroundColor: 'var(--color-card-bg)',
                  borderRadius: '8px'
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    font: 'var(--font-button)',
                    color: 'var(--color-accent)',
                    mb: 1
                  }}
                >
                  {type}
                </Typography>
                {typeNodes.map((node, index) => (
                  <Chip
                    key={node.id || index}
                    label={node.value}
                    size="small"
                    sx={{
                      mr: 0.5,
                      mb: 0.5,
                      backgroundColor: 'rgba(212, 175, 55, 0.1)',
                      color: 'var(--color-text-primary)'
                    }}
                  />
                ))}
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    )
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="scene-detail-dialog-title"
      aria-describedby="scene-detail-dialog-description"
      keepMounted={false}
      disableRestoreFocus
      PaperProps={{
        sx: {
          backgroundColor: 'var(--color-bg)',
          borderRadius: '16px',
          minHeight: '600px',
          maxHeight: '90vh'
        }
      }}
    >
      {/* 모달 헤더 */}
      <DialogTitle
        id="scene-detail-dialog-title"
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography
            variant="h5"
            sx={{
              font: 'var(--font-heading-1)',
              color: 'var(--color-text-primary)'
            }}
          >
            씬 {scene.components?.sceneNumber || scene.scene}
          </Typography>
          <Chip
            icon={typeInfo.icon}
            label={typeInfo.label}
            color={typeInfo.color}
            sx={{
              backgroundColor: typeInfo.bgColor,
              color: 'var(--color-text-primary)'
            }}
          />
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            color: 'var(--color-text-secondary)',
            '&:hover': { color: 'var(--color-accent)' }
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      {/* 모달 콘텐츠 */}
      <DialogContent 
        id="scene-detail-dialog-description"
        sx={{ px: 3, py: 2 }}
      >
        <Box sx={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {/* 기본 정보 */}
          {renderComponentSection(
            '씬 설명',
            scene.components?.description || scene.description
          )}

          {/* 대사 */}
          {renderComponentSection(
            '대사',
            scene.components?.dialogue,
            <Person />
          )}

          {/* 시각적 요소들 */}
          <Divider sx={{ my: 2, borderColor: 'var(--color-scene-card-border)' }} />
          
          {renderComponentSection(
            '카메라 앵글 및 구도',
            scene.components?.cameraAngle,
            <Videocam />
          )}

          {renderComponentSection(
            '카메라 워크',
            scene.components?.cameraWork,
            <Videocam />
          )}

          {renderComponentSection(
            '인물 배치',
            scene.components?.characterLayout,
            <Person />
          )}

          {renderComponentSection(
            '소품 배치',
            scene.components?.propsLayout
          )}

          {/* 환경 요소들 */}
          <Divider sx={{ my: 2, borderColor: 'var(--color-scene-card-border)' }} />

          {renderComponentSection(
            '날씨 및 지형',
            scene.components?.weather,
            <WbSunny />
          )}

          {renderComponentSection(
            '조명',
            scene.components?.lighting,
            <Lightbulb />
          )}

          {renderComponentSection(
            '대표 이미지',
            scene.components?.representativeImage
          )}

          {/* 촬영 정보들 */}
          <Divider sx={{ my: 2, borderColor: 'var(--color-scene-card-border)' }} />

          {renderComponentSection(
            '전환점',
            scene.components?.transitionPoint
          )}

          {renderComponentSection(
            '렌즈 길이',
            scene.components?.lensLength
          )}

          {renderComponentSection(
            '카메라 사양',
            scene.components?.cameraSpecs
          )}

          {renderComponentSection(
            '촬영 방식',
            scene.components?.shootingMethod
          )}

          {/* 후처리 정보 */}
          <Divider sx={{ my: 2, borderColor: 'var(--color-scene-card-border)' }} />

          {renderComponentSection(
            '그래픽 툴',
            scene.components?.graphicsTools
          )}

          {renderComponentSection(
            '시각효과',
            scene.components?.visualEffects
          )}

          {/* 노드 정보 */}
          {renderNodeInfo(scene.nodes)}

          {/* 지속 시간 */}
          {scene.duration && (
            <Box sx={{ mt: 2, textAlign: 'right' }}>
              <Typography
                variant="caption"
                sx={{
                  font: 'var(--font-caption)',
                  color: 'var(--color-text-secondary)'
                }}
              >
                지속 시간: {Math.floor(scene.duration / 60)}:{(scene.duration % 60).toString().padStart(2, '0')}
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      {/* 모달 액션 */}
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={onClose}
          sx={{
            color: 'var(--color-text-secondary)',
            '&:hover': { color: 'var(--color-text-primary)' }
          }}
        >
          닫기
        </Button>
        {scene.type === CaptionCardType.GENERATED_VIDEO && onRegenerate && (
          <Button
            onClick={() => onRegenerate(scene)}
            variant="outlined"
            startIcon={<PlayArrow />}
            sx={{
              borderColor: 'var(--color-accent)',
              color: 'var(--color-accent)',
              '&:hover': {
                borderColor: 'var(--color-primary)',
                backgroundColor: 'rgba(212, 175, 55, 0.1)'
              }
            }}
          >
            재생성
          </Button>
        )}
        <Button
          onClick={() => onEdit?.(scene)}
          variant="contained"
          startIcon={<Edit />}
          sx={{
            backgroundColor: 'var(--color-accent)',
            color: 'var(--color-text-primary)',
            '&:hover': {
              backgroundColor: 'var(--color-primary)'
            }
          }}
        >
          편집
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default SceneDetailModal 