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
  Divider
} from '@mui/material'
import { 
  Close,
  Edit,
  Refresh,
  Save,
  Image,
  Movie,
  ExpandMore,
  Error
} from '@mui/icons-material'
import { generateSceneImage, regenerateConteWithRetry } from '../../services/storyGenerationApi'
import toast from 'react-hot-toast'

/**
 * 콘티 편집 모달 컴포넌트
 * 개별 씬의 정보를 편집하고 이미지를 재생성할 수 있는 기능
 * PRD 2.1.3 AI 콘티 생성 기능의 편집 부분
 */
const ConteEditModal = ({ 
  open, 
  onClose, 
  conte, 
  onSave,
  onRegenerateImage,
  onRegenerateConte
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
  const handleSave = () => {
    console.log('💾 저장 버튼 클릭됨')
    console.log('onSave 함수:', onSave)
    console.log('editedConte:', editedConte)
    
    if (onSave) {
      console.log('✅ onSave 함수 호출')
      onSave(editedConte)
      console.log('✅ onSave 함수 호출 완료')
    } else {
      console.error('❌ onSave 함수가 없습니다!')
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

  if (!conte) return null

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
          <Typography variant="h5" component="h2">
            씬 {conte?.scene} 편집: {conte?.title}
          </Typography>
          <IconButton onClick={handleClose}>
            <Close />
          </IconButton>
        </Box>

        {/* 모달 내용 */}
        <Box sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {/* 씬 이미지 */}
            {editedConte && editedConte.imageUrl && (
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
                  </Grid>
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
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={handleClose}
            >
              취소
            </Button>
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