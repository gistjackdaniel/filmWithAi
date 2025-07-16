import { useState, useEffect } from 'react'
import { 
  Box, 
  Typography, 
  Modal,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  Avatar
} from '@mui/material'
import { 
  Close,
  Edit,
  Refresh,
  Save,
  Image,
  Movie,
  ExpandMore,
  Error,
  PlayArrow,
  CameraAlt,
  LocationOn,
  Schedule,
  Videocam,
  Lightbulb,
  WbSunny,
  Person,
  Settings,
  AccessTime,
  Category,
  Palette,
  PhotoCamera,
  Info
} from '@mui/icons-material'
import { generateSceneImage, regenerateConteWithRetry } from '../../services/storyGenerationApi'
import toast from 'react-hot-toast'
import { CaptionCardType } from '../../types/timeline'

/**
 * 콘티 편집 모달 컴포넌트
 * 개별 씬의 정보를 편집하고 이미지를 재생성할 수 있는 기능
 * SceneDetailModal의 모든 기능을 통합하여 상세 정보 표시와 편집 기능 제공
 * PRD 2.1.3 AI 콘티 생성 기능의 편집 부분
 */
const ConteEditModal = ({ 
  open, 
  onClose, 
  conte, 
  onSave,
  onRegenerateImage,
  onRegenerateConte,
  onEdit,
  onRegenerate
}) => {
  // 디버깅 로그
  console.log('🔍 ConteEditModal props:', { open, conte, onClose, onSave })
  
  // 로컬 상태 관리
  const [editedConte, setEditedConte] = useState(conte)
  const [isRegeneratingImage, setIsRegeneratingImage] = useState(false)
  const [isRegeneratingConte, setIsRegeneratingConte] = useState(false)
  const [activeTab, setActiveTab] = useState(0) // 0: 기본 정보, 1: 촬영 정보, 2: 장면 설정
  
  // 이미지 로딩 실패 상태 관리
  const [imageLoadError, setImageLoadError] = useState(false)

  // 씬 타입에 따른 아이콘과 색상
  const getSceneTypeInfo = (type) => {
    switch (type) {
      case CaptionCardType.GENERATED_VIDEO:
      case 'generated_video':
        return {
          icon: <PlayArrow />,
          label: 'AI 생성 비디오',
          color: 'success',
          bgColor: 'rgba(46, 204, 113, 0.1)'
        }
      case CaptionCardType.LIVE_ACTION:
      case 'live_action':
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

  const typeInfo = editedConte?.type ? getSceneTypeInfo(editedConte.type) : null

  // 편집된 콘티가 변경될 때마다 상태 업데이트
  useEffect(() => {
    console.log('🔄 editedConte 업데이트:', conte)
    setEditedConte(conte)
  }, [conte])

  /**
   * 필드 값 변경 핸들러
   * @param {string} field - 변경할 필드명
   * @param {any} value - 새로운 값
   */
  const handleFieldChange = (field, value) => {
    setEditedConte(prev => ({
      ...prev,
      [field]: value
    }))
  }

  /**
   * 키워드 필드 변경 핸들러
   * @param {string} keywordField - 키워드 필드명
   * @param {any} value - 새로운 값
   */
  const handleKeywordChange = (keywordField, value) => {
    setEditedConte(prev => ({
      ...prev,
      keywords: {
        ...prev.keywords,
        [keywordField]: value
      }
    }))
  }

  /**
   * 가중치 필드 변경 핸들러
   * @param {string} weightField - 가중치 필드명
   * @param {number} value - 새로운 값
   */
  const handleWeightChange = (weightField, value) => {
    setEditedConte(prev => ({
      ...prev,
      weights: {
        ...prev.weights,
        [weightField]: value
      }
    }))
  }

  /**
   * 이미지 로딩 실패 핸들러
   * @param {Event} event - 이미지 로딩 에러 이벤트
   */
  const handleImageLoadError = (event) => {
    console.error('이미지 로딩 실패:', editedConte?.imageUrl)
    setImageLoadError(true)
    // 이미지 요소 숨기기
    if (event.target) {
      event.target.style.display = 'none'
    }
  }

  /**
   * 이미지 재시도 핸들러
   */
  const handleImageRetry = async () => {
    try {
      console.log('🔄 이미지 재시도 시작:', editedConte.scene)
      
      // 이미지 생성 API 호출
      const imagePrompt = `${editedConte.title}: ${editedConte.description}. ${editedConte.visualDescription || ''} ${editedConte.genre || '영화'} 스타일, 시네마틱한 구도, 고품질 이미지`
      
      const imageResponse = await generateSceneImage({
        sceneDescription: imagePrompt,
        style: 'cinematic',
        genre: editedConte.genre || '일반',
        size: '1024x1024'
      })
      
      // 편집 중인 콘티 업데이트
      setEditedConte(prev => ({
        ...prev,
        imageUrl: imageResponse.imageUrl,
        imagePrompt: imagePrompt,
        imageGeneratedAt: imageResponse.generatedAt,
        imageModel: imageResponse.model,
        isFreeTier: imageResponse.isFreeTier
      }))
      
      // 에러 상태 제거
      setImageLoadError(false)
      
      toast.success('이미지가 재생성되었습니다!')
      
    } catch (error) {
      console.error('❌ 이미지 재시도 실패:', error)
      toast.error('이미지 재생성에 실패했습니다.')
    }
  }

  /**
   * 이미지 재생성 핸들러
   */
  const handleRegenerateImage = async () => {
    if (!editedConte) return

    setIsRegeneratingImage(true)
    
    try {
      // 이미지 생성 프롬프트 구성
      const imagePrompt = `${editedConte.title}: ${editedConte.description}. ${editedConte.visualDescription || ''} ${editedConte.genre || '영화'} 스타일, 시네마틱한 구도, 고품질 이미지`
      
      console.log('🎨 이미지 재생성 시작:', imagePrompt)
      
      // 이미지 생성 API 호출
      const imageResponse = await generateSceneImage({
        sceneDescription: imagePrompt,
        style: 'cinematic',
        genre: editedConte.genre || '일반',
        size: '1024x1024'
      })
      
      // 생성된 이미지 URL을 콘티에 추가
      const updatedConte = {
        ...editedConte,
        imageUrl: imageResponse.imageUrl,
        imagePrompt: imagePrompt,
        imageGeneratedAt: imageResponse.generatedAt
      }
      
      setEditedConte(updatedConte)
      
      // 부모 컴포넌트에 이미지 재생성 완료 알림
      if (onRegenerateImage) {
        onRegenerateImage(updatedConte)
      }
      
      console.log('✅ 이미지 재생성 완료:', imageResponse.imageUrl)
      toast.success('이미지가 재생성되었습니다!')
      
    } catch (error) {
      console.error('❌ 이미지 재생성 실패:', error)
      toast.error('이미지 재생성에 실패했습니다.')
    } finally {
      setIsRegeneratingImage(false)
    }
  }

  /**
   * 콘티 재생성 핸들러
   */
  const handleRegenerateConte = async () => {
    if (!editedConte) return

    setIsRegeneratingConte(true)
    
    try {
      console.log('🎬 콘티 재생성 시작:', editedConte.title)
      
      // 실제 API가 없으므로 임시로 시뮬레이션
      // const updatedConte = await regenerateConteWithRetry(editedConte)
      
      // 임시로 기존 콘티를 업데이트 (실제로는 API 호출)
      const updatedConte = {
        ...editedConte,
        lastModified: new Date().toISOString(),
        modifiedBy: '사용자',
        description: `${editedConte.description} (재생성됨)`,
        dialogue: editedConte.dialogue ? `${editedConte.dialogue} (재생성됨)` : '새로운 대사가 생성되었습니다.',
        cameraAngle: editedConte.cameraAngle ? `${editedConte.cameraAngle} (재생성됨)` : '새로운 카메라 앵글',
        cameraWork: editedConte.cameraWork ? `${editedConte.cameraWork} (재생성됨)` : '새로운 카메라 워크',
        visualDescription: editedConte.visualDescription ? `${editedConte.visualDescription} (재생성됨)` : '새로운 시각적 설명'
      }
      
      // 편집된 콘티 업데이트
      setEditedConte(updatedConte)
      
      // 부모 컴포넌트에 콘티 재생성 완료 알림
      if (onRegenerateConte) {
        await onRegenerateConte(updatedConte)
      }
      
      console.log('✅ 콘티 재생성 완료:', updatedConte.title)
      toast.success('콘티가 재생성되었습니다!')
      
    } catch (error) {
      console.error('❌ 콘티 재생성 실패:', error)
      toast.error('콘티 재생성에 실패했습니다.')
    } finally {
      setIsRegeneratingConte(false)
    }
  }

  /**
   * 저장 핸들러
   */
  const handleSave = async () => {
    console.log('💾 저장 버튼 클릭됨')
    console.log('editedConte:', editedConte)
    
    try {
    if (onSave) {
      console.log('✅ onSave 함수 호출')
        await onSave(editedConte)
      console.log('✅ onSave 함수 호출 완료')
        toast.success('콘티가 성공적으로 저장되었습니다!')
    } else {
      console.error('❌ onSave 함수가 없습니다!')
        toast.error('저장 기능을 사용할 수 없습니다.')
        return
      }
    } catch (error) {
      console.error('❌ 콘티 저장 실패:', error)
      toast.error('콘티 저장에 실패했습니다.')
      return
    }
    
    onClose()
  }

  /**
   * 모달 닫기 핸들러
   */
  const handleClose = () => {
    // 변경사항이 있으면 확인
    if (JSON.stringify(editedConte) !== JSON.stringify(conte)) {
      if (window.confirm('저장하지 않은 변경사항이 있습니다. 정말로 닫으시겠습니까?')) {
        onClose()
      }
    } else {
      onClose()
    }
  }

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

  // 키워드 정보 렌더링
  const renderKeywordsSection = (keywords) => {
    if (!keywords || typeof keywords !== 'object') return null

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
          키워드 정보
        </Typography>
        <Grid container spacing={2}>
          {keywords.userInfo && (
            <Grid item xs={12} sm={6}>
              <Paper sx={{ p: 2, backgroundColor: 'var(--color-card-bg)', borderRadius: '8px' }}>
                <Typography variant="subtitle2" sx={{ color: 'var(--color-accent)', mb: 1 }}>
                  사용자 정보
                </Typography>
                <Typography variant="body2">{keywords.userInfo}</Typography>
              </Paper>
            </Grid>
          )}
          
          {keywords.location && (
            <Grid item xs={12} sm={6}>
              <Paper sx={{ p: 2, backgroundColor: 'var(--color-card-bg)', borderRadius: '8px' }}>
                <Typography variant="subtitle2" sx={{ color: 'var(--color-accent)', mb: 1 }}>
                  장소
                </Typography>
                <Typography variant="body2">{keywords.location}</Typography>
              </Paper>
            </Grid>
          )}
          
          {keywords.date && (
            <Grid item xs={12} sm={6}>
              <Paper sx={{ p: 2, backgroundColor: 'var(--color-card-bg)', borderRadius: '8px' }}>
                <Typography variant="subtitle2" sx={{ color: 'var(--color-accent)', mb: 1 }}>
                  날짜
                </Typography>
                <Typography variant="body2">{keywords.date}</Typography>
              </Paper>
            </Grid>
          )}
          
          {keywords.equipment && (
            <Grid item xs={12} sm={6}>
              <Paper sx={{ p: 2, backgroundColor: 'var(--color-card-bg)', borderRadius: '8px' }}>
                <Typography variant="subtitle2" sx={{ color: 'var(--color-accent)', mb: 1 }}>
                  장비
                </Typography>
                <Typography variant="body2">{keywords.equipment}</Typography>
              </Paper>
            </Grid>
          )}
          
          {keywords.cast && keywords.cast.length > 0 && (
            <Grid item xs={12} sm={6}>
              <Paper sx={{ p: 2, backgroundColor: 'var(--color-card-bg)', borderRadius: '8px' }}>
                <Typography variant="subtitle2" sx={{ color: 'var(--color-accent)', mb: 1 }}>
                  출연진
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {keywords.cast.map((member, index) => (
                    <Chip key={index} label={member} size="small" />
                  ))}
                </Box>
              </Paper>
            </Grid>
          )}
          
          {keywords.props && keywords.props.length > 0 && (
            <Grid item xs={12} sm={6}>
              <Paper sx={{ p: 2, backgroundColor: 'var(--color-card-bg)', borderRadius: '8px' }}>
                <Typography variant="subtitle2" sx={{ color: 'var(--color-accent)', mb: 1 }}>
                  소품
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {keywords.props.map((prop, index) => (
                    <Chip key={index} label={prop} size="small" />
                  ))}
                </Box>
              </Paper>
            </Grid>
          )}
          
          {keywords.lighting && (
            <Grid item xs={12} sm={6}>
              <Paper sx={{ p: 2, backgroundColor: 'var(--color-card-bg)', borderRadius: '8px' }}>
                <Typography variant="subtitle2" sx={{ color: 'var(--color-accent)', mb: 1 }}>
                  조명
                </Typography>
                <Typography variant="body2">{keywords.lighting}</Typography>
              </Paper>
            </Grid>
          )}
          
          {keywords.weather && (
            <Grid item xs={12} sm={6}>
              <Paper sx={{ p: 2, backgroundColor: 'var(--color-card-bg)', borderRadius: '8px' }}>
                <Typography variant="subtitle2" sx={{ color: 'var(--color-accent)', mb: 1 }}>
                  날씨
                </Typography>
                <Typography variant="body2">{keywords.weather}</Typography>
              </Paper>
            </Grid>
          )}
          
          {keywords.timeOfDay && (
            <Grid item xs={12} sm={6}>
              <Paper sx={{ p: 2, backgroundColor: 'var(--color-card-bg)', borderRadius: '8px' }}>
                <Typography variant="subtitle2" sx={{ color: 'var(--color-accent)', mb: 1 }}>
                  시간대
                </Typography>
                <Typography variant="body2">{keywords.timeOfDay}</Typography>
              </Paper>
            </Grid>
          )}
          
          {keywords.specialRequirements && keywords.specialRequirements.length > 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2, backgroundColor: 'var(--color-card-bg)', borderRadius: '8px' }}>
                <Typography variant="subtitle2" sx={{ color: 'var(--color-accent)', mb: 1 }}>
                  특별 요구사항
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {keywords.specialRequirements.map((req, index) => (
                    <Chip key={index} label={req} size="small" />
                  ))}
                </Box>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>
    )
  }

  // 가중치 정보 렌더링
  const renderWeightsSection = (weights) => {
    if (!weights || typeof weights !== 'object') return null

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
          우선순위 가중치
        </Typography>
        <Grid container spacing={2}>
          {weights.locationPriority && (
            <Grid item xs={12} sm={6}>
              <Paper sx={{ p: 2, backgroundColor: 'var(--color-card-bg)', borderRadius: '8px' }}>
                <Typography variant="subtitle2" sx={{ color: 'var(--color-accent)', mb: 1 }}>
                  장소 우선순위
                </Typography>
                <Typography variant="body2">{weights.locationPriority}/5</Typography>
              </Paper>
            </Grid>
          )}
          
          {weights.equipmentPriority && (
            <Grid item xs={12} sm={6}>
              <Paper sx={{ p: 2, backgroundColor: 'var(--color-card-bg)', borderRadius: '8px' }}>
                <Typography variant="subtitle2" sx={{ color: 'var(--color-accent)', mb: 1 }}>
                  장비 우선순위
                </Typography>
                <Typography variant="body2">{weights.equipmentPriority}/5</Typography>
              </Paper>
            </Grid>
          )}
          
          {weights.castPriority && (
            <Grid item xs={12} sm={6}>
              <Paper sx={{ p: 2, backgroundColor: 'var(--color-card-bg)', borderRadius: '8px' }}>
                <Typography variant="subtitle2" sx={{ color: 'var(--color-accent)', mb: 1 }}>
                  출연진 우선순위
                </Typography>
                <Typography variant="body2">{weights.castPriority}/5</Typography>
              </Paper>
            </Grid>
          )}
          
          {weights.timePriority && (
            <Grid item xs={12} sm={6}>
              <Paper sx={{ p: 2, backgroundColor: 'var(--color-card-bg)', borderRadius: '8px' }}>
                <Typography variant="subtitle2" sx={{ color: 'var(--color-accent)', mb: 1 }}>
                  시간 우선순위
                </Typography>
                <Typography variant="body2">{weights.timePriority}/5</Typography>
              </Paper>
            </Grid>
          )}
          
          {weights.complexity && (
            <Grid item xs={12} sm={6}>
              <Paper sx={{ p: 2, backgroundColor: 'var(--color-card-bg)', borderRadius: '8px' }}>
                <Typography variant="subtitle2" sx={{ color: 'var(--color-accent)', mb: 1 }}>
                  복잡도
                </Typography>
                <Typography variant="body2">{weights.complexity}/5</Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>
    )
  }

  // 이미지 정보 렌더링
  const renderImageSection = (scene) => {
    if (!scene || (!scene.imageUrl && !scene.imagePrompt)) return null

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
          이미지 정보
        </Typography>
        
        {scene.imageUrl && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ color: 'var(--color-accent)', mb: 1 }}>
              생성된 이미지
            </Typography>
            <Box
              component="img"
              src={scene.imageUrl}
              alt={`씬 ${scene.scene} 이미지`}
              sx={{
                width: '100%',
                maxWidth: 400,
                height: 'auto',
                borderRadius: '8px',
                border: '1px solid var(--color-scene-card-border)'
              }}
            />
          </Box>
        )}
        
        {scene.imagePrompt && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ color: 'var(--color-accent)', mb: 1 }}>
              이미지 생성 프롬프트
            </Typography>
            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
              {scene.imagePrompt}
            </Typography>
          </Box>
        )}
        
        {scene.imageModel && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ color: 'var(--color-accent)', mb: 1 }}>
              이미지 생성 모델
            </Typography>
            <Typography variant="body2">{scene.imageModel}</Typography>
          </Box>
        )}
        
        {scene.imageGeneratedAt && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ color: 'var(--color-accent)', mb: 1 }}>
              이미지 생성 시간
            </Typography>
            <Typography variant="body2">
              {new Date(scene.imageGeneratedAt).toLocaleString('ko-KR')}
            </Typography>
          </Box>
        )}
        
        {scene.isFreeTier !== undefined && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ color: 'var(--color-accent)', mb: 1 }}>
              무료 티어 여부
            </Typography>
            <Typography variant="body2">
              {scene.isFreeTier ? '무료 티어' : '유료 티어'}
            </Typography>
          </Box>
        )}
      </Box>
    )
  }

  if (!conte || !editedConte) return null

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="conte-edit-modal"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2
      }}
    >
      <Box sx={{
        width: '95%',
        maxWidth: 1000,
        maxHeight: '95vh',
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: 24,
        overflow: 'auto'
      }}>
        {/* 모달 헤더 */}
        <Box sx={{
          p: 3,
          borderBottom: '1px solid #ddd',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h5" component="h2">
              씬 {conte?.scene || 'N/A'}: {conte?.title || '제목 없음'}
          </Typography>
            {typeInfo && (
              <Chip
                icon={typeInfo.icon}
                label={typeInfo.label}
                color={typeInfo.color}
                sx={{
                  backgroundColor: typeInfo.bgColor,
                  color: 'var(--color-text-primary)'
                }}
              />
            )}
          </Box>
          <IconButton onClick={handleClose}>
            <Close />
          </IconButton>
        </Box>

        {/* 모달 내용 */}
        <Box sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {/* 씬 이미지 */}
            {editedConte?.imageUrl && (
              <Grid item xs={12}>
                <Box sx={{ 
                  width: '100%', 
                  height: 300, 
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: '1px solid #ddd',
                  mb: 2,
                  position: 'relative'
                }}>
                  <img 
                    src={editedConte.imageUrl} 
                    alt={`씬 ${editedConte?.scene} 이미지`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={handleImageLoadError}
                  />
                  
                  {/* 이미지 재생성 버튼 */}
                  <Box sx={{
                    position: 'absolute',
                    top: 10,
                    right: 10
                  }}>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={isRegeneratingImage ? <CircularProgress size={16} /> : <Image />}
                      onClick={handleRegenerateImage}
                      disabled={isRegeneratingImage}
                      sx={{
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.8)'
                        }
                      }}
                    >
                      {isRegeneratingImage ? '생성 중...' : '이미지 재생성'}
                    </Button>
                  </Box>

                  {/* 이미지 재시도 버튼 (로딩 실패 시) */}
                  {imageLoadError && (
                    <Box sx={{
                      position: 'absolute',
                      top: 10,
                      left: 10,
                      zIndex: 1
                    }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Error />}
                        onClick={handleImageRetry}
                        sx={{
                          backgroundColor: 'rgba(255, 255, 255, 0.8)',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 1)'
                          }
                        }}
                      >
                        이미지 재시도
                      </Button>
                    </Box>
                  )}
                </Box>
              </Grid>
            )}

            {/* 기본 정보 */}
            <Grid item xs={12}>
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">기본 정보</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="제목"
                        value={editedConte?.title || ''}
                        onChange={(e) => handleFieldChange('title', e.target.value)}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="설명"
                        value={editedConte?.description || ''}
                        onChange={(e) => handleFieldChange('description', e.target.value)}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <FormControl fullWidth>
                        <InputLabel>타입</InputLabel>
                        <Select
                          value={editedConte?.type || 'live_action'}
                          onChange={(e) => handleFieldChange('type', e.target.value)}
                          label="타입"
                        >
                          <MenuItem value="live_action">실사 촬영용</MenuItem>
                          <MenuItem value="generated_video">AI 생성 비디오</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="예상 시간"
                        value={editedConte?.estimatedDuration || ''}
                        onChange={(e) => handleFieldChange('estimatedDuration', e.target.value)}
                        variant="outlined"
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* 촬영 정보 */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">촬영 정보</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="카메라 앵글"
                        value={editedConte?.cameraAngle || ''}
                        onChange={(e) => handleFieldChange('cameraAngle', e.target.value)}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="카메라 워크"
                        value={editedConte?.cameraWork || ''}
                        onChange={(e) => handleFieldChange('cameraWork', e.target.value)}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="렌즈 스펙"
                        value={editedConte?.lensSpecs || ''}
                        onChange={(e) => handleFieldChange('lensSpecs', e.target.value)}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="시각 효과"
                        value={editedConte?.visualEffects || ''}
                        onChange={(e) => handleFieldChange('visualEffects', e.target.value)}
                        variant="outlined"
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* 장면 설정 */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">장면 설정</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="인물 배치"
                        value={editedConte?.characterLayout || ''}
                        onChange={(e) => handleFieldChange('characterLayout', e.target.value)}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="소품"
                        value={editedConte?.props || ''}
                        onChange={(e) => handleFieldChange('props', e.target.value)}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="조명"
                        value={editedConte?.lighting || ''}
                        onChange={(e) => handleFieldChange('lighting', e.target.value)}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="날씨"
                        value={editedConte?.weather || ''}
                        onChange={(e) => handleFieldChange('weather', e.target.value)}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="시각적 설명"
                        value={editedConte?.visualDescription || ''}
                        onChange={(e) => handleFieldChange('visualDescription', e.target.value)}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="전환"
                        value={editedConte?.transition || ''}
                        onChange={(e) => handleFieldChange('transition', e.target.value)}
                        variant="outlined"
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* 대사 */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">대사</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="대사"
                    value={editedConte?.dialogue || ''}
                    onChange={(e) => handleFieldChange('dialogue', e.target.value)}
                    variant="outlined"
                  />
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* 키워드 정보 */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">키워드 정보</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="사용자 정보"
                        value={editedConte?.keywords?.userInfo || ''}
                        onChange={(e) => handleKeywordChange('userInfo', e.target.value)}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="장소"
                        value={editedConte?.keywords?.location || ''}
                        onChange={(e) => handleKeywordChange('location', e.target.value)}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="장비"
                        value={editedConte?.keywords?.equipment || ''}
                        onChange={(e) => handleKeywordChange('equipment', e.target.value)}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="조명"
                        value={editedConte?.keywords?.lighting || ''}
                        onChange={(e) => handleKeywordChange('lighting', e.target.value)}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="날씨"
                        value={editedConte?.keywords?.weather || ''}
                        onChange={(e) => handleKeywordChange('weather', e.target.value)}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="시간대"
                        value={editedConte?.keywords?.timeOfDay || ''}
                        onChange={(e) => handleKeywordChange('timeOfDay', e.target.value)}
                        variant="outlined"
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* 상세 정보 표시 섹션 */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">상세 정보 보기</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {/* 기본 정보 */}
                    {renderComponentSection(
                      '씬 설명',
                      editedConte?.description
                    )}

                    {/* 대사 */}
                    {renderComponentSection(
                      '대사',
                      editedConte?.dialogue,
                      <Person />
                    )}

                    {/* 시각적 요소들 */}
                    <Divider sx={{ my: 2, borderColor: 'var(--color-scene-card-border)' }} />
                    
                    {renderComponentSection(
                      '카메라 앵글',
                      editedConte?.cameraAngle,
                      <Videocam />
                    )}

                    {renderComponentSection(
                      '카메라 워크',
                      editedConte?.cameraWork,
                      <Videocam />
                    )}

                    {renderComponentSection(
                      '인물 배치',
                      editedConte?.characterLayout,
                      <Person />
                    )}

                    {renderComponentSection(
                      '소품',
                      editedConte?.props
                    )}

                    {/* 환경 요소들 */}
                    <Divider sx={{ my: 2, borderColor: 'var(--color-scene-card-border)' }} />

                    {renderComponentSection(
                      '날씨',
                      editedConte?.weather,
                      <WbSunny />
                    )}

                    {renderComponentSection(
                      '조명',
                      editedConte?.lighting,
                      <Lightbulb />
                    )}

                    {renderComponentSection(
                      '시각적 설명',
                      editedConte?.visualDescription
                    )}

                    {/* 촬영 정보들 */}
                    <Divider sx={{ my: 2, borderColor: 'var(--color-scene-card-border)' }} />

                    {renderComponentSection(
                      '전환',
                      editedConte?.transition
                    )}

                    {renderComponentSection(
                      '렌즈 사양',
                      editedConte?.lensSpecs
                    )}

                    {renderComponentSection(
                      '시각효과',
                      editedConte?.visualEffects
                    )}

                    {/* 예상 지속 시간 */}
                    {editedConte?.estimatedDuration && (
                      <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <AccessTime sx={{ mr: 1, color: 'var(--color-accent)' }} />
                          <Typography
                            variant="h6"
                            sx={{
                              font: 'var(--font-heading-2)',
                              color: 'var(--color-text-primary)'
                            }}
                          >
                            예상 지속 시간
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
                          {editedConte.estimatedDuration}
                        </Typography>
                      </Box>
                    )}

                    {/* 키워드 정보 */}
                    {renderKeywordsSection(editedConte?.keywords)}

                    {/* 가중치 정보 */}
                    {renderWeightsSection(editedConte?.weights)}

                    {/* 이미지 정보 */}
                    {renderImageSection(editedConte)}

                    {/* 상태 정보 */}
                    {editedConte?.status && (
                      <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Info sx={{ mr: 1, color: 'var(--color-accent)' }} />
                          <Typography
                            variant="h6"
                            sx={{
                              font: 'var(--font-heading-2)',
                              color: 'var(--color-text-primary)'
                            }}
                          >
                            상태 정보
                          </Typography>
                        </Box>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Paper sx={{ p: 2, backgroundColor: 'var(--color-card-bg)', borderRadius: '8px' }}>
                              <Typography variant="subtitle2" sx={{ color: 'var(--color-accent)', mb: 1 }}>
                                상태
                              </Typography>
                              <Typography variant="body2">{editedConte.status}</Typography>
                            </Paper>
                          </Grid>
                          {editedConte.order !== undefined && (
                            <Grid item xs={12} sm={6}>
                              <Paper sx={{ p: 2, backgroundColor: 'var(--color-card-bg)', borderRadius: '8px' }}>
                                <Typography variant="subtitle2" sx={{ color: 'var(--color-accent)', mb: 1 }}>
                                  순서
                                </Typography>
                                <Typography variant="body2">{editedConte.order}</Typography>
                              </Paper>
                            </Grid>
                          )}
                          {editedConte.canEdit !== undefined && (
                            <Grid item xs={12} sm={6}>
                              <Paper sx={{ p: 2, backgroundColor: 'var(--color-card-bg)', borderRadius: '8px' }}>
                                <Typography variant="subtitle2" sx={{ color: 'var(--color-accent)', mb: 1 }}>
                                  편집 가능
                                </Typography>
                                <Typography variant="body2">
                                  {editedConte.canEdit ? '편집 가능' : '편집 불가'}
                                </Typography>
                              </Paper>
                            </Grid>
                          )}
                          {editedConte.lastModified && (
                            <Grid item xs={12} sm={6}>
                              <Paper sx={{ p: 2, backgroundColor: 'var(--color-card-bg)', borderRadius: '8px' }}>
                                <Typography variant="subtitle2" sx={{ color: 'var(--color-accent)', mb: 1 }}>
                                  마지막 수정
                                </Typography>
                                <Typography variant="body2">
                                  {new Date(editedConte.lastModified).toLocaleString('ko-KR')}
                                </Typography>
                              </Paper>
                            </Grid>
                          )}
                          {editedConte.modifiedBy && (
                            <Grid item xs={12} sm={6}>
                              <Paper sx={{ p: 2, backgroundColor: 'var(--color-card-bg)', borderRadius: '8px' }}>
                                <Typography variant="subtitle2" sx={{ color: 'var(--color-accent)', mb: 1 }}>
                                  수정자
                                </Typography>
                                <Typography variant="body2">{editedConte.modifiedBy}</Typography>
                              </Paper>
                            </Grid>
                          )}
                        </Grid>
                      </Box>
                    )}

                    {/* 지속 시간 */}
                    {editedConte?.duration && (
                      <Box sx={{ mt: 2, textAlign: 'right' }}>
                        <Typography
                          variant="caption"
                          sx={{
                            font: 'var(--font-caption)',
                            color: 'var(--color-text-secondary)'
                          }}
                        >
                          지속 시간: {Math.floor(editedConte.duration / 60)}:{(editedConte.duration % 60).toString().padStart(2, '0')}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Grid>
          </Grid>
        </Box>

        {/* 액션 버튼 */}
        <Box sx={{
          p: 3,
          borderTop: '1px solid #ddd',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleRegenerateConte}
              disabled={isRegeneratingConte}
            >
              {isRegeneratingConte ? '재생성 중...' : '콘티 재생성'}
            </Button>
            {editedConte?.type && editedConte.type === CaptionCardType.GENERATED_VIDEO && onRegenerate && (
              <Button
                onClick={() => onRegenerate(editedConte)}
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
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={handleClose}
              sx={{
                color: 'var(--color-text-secondary)',
                '&:hover': { color: 'var(--color-text-primary)' }
              }}
            >
              닫기
            </Button>
            {onEdit && (
              <Button
                onClick={() => onEdit(editedConte)}
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
            )}
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSave}
            >
              저장
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  )
}

export default ConteEditModal 