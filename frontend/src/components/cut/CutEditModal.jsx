import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material'
import { Close, ExpandMore, Camera, VideoLibrary, MusicNote, Edit } from '@mui/icons-material'
import { toast } from 'react-hot-toast'
import api from '../../services/api'

const CutEditModal = ({ 
  open, 
  onClose, 
  cut, 
  onSave,
  onRegenerateImage,
  projectId // 프로젝트 ID 추가
}) => {
  const [editedCut, setEditedCut] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)

  // 컷 상세 정보 로드 (NestJS 백엔드 연동)
  const loadCutDetails = async (cutId) => {
    if (!projectId || !cutId) return

    try {
      setIsLoadingDetails(true)
      console.log('🔍 CutEditModal 컷 상세 정보 로드:', { projectId, cutId })
      
      // NestJS 백엔드 API를 사용하여 컷 상세 정보 조회
      const response = await api.get(`/project/${projectId}/cut/${cutId}`)
      
      if (response.data.success) {
        const cutData = response.data.cut
        console.log('✅ CutEditModal 컷 상세 정보 로드 성공:', cutData)
        console.log('🔍 CutEditModal 컷 데이터 상세:', {
          shotSize: cutData.shotSize,
          angleDirection: cutData.angleDirection,
          cameraMovement: cutData.cameraMovement,
          lensSpecs: cutData.lensSpecs,
          composition: cutData.composition,
          lighting: cutData.lighting,
          weather: cutData.weather,
          timeOfDay: cutData.timeOfDay,
          vfxEffects: cutData.vfxEffects,
          soundEffects: cutData.soundEffects,
          dialogue: cutData.dialogue,
          directorNotes: cutData.directorNotes,
          narration: cutData.narration
        })
        setEditedCut(cutData)
      } else {
        console.error('❌ CutEditModal 컷 상세 정보 로드 실패:', response.data.message)
        toast.error(response.data.message || '컷 상세 정보를 불러올 수 없습니다.')
      }
    } catch (error) {
      console.error('❌ CutEditModal 컷 상세 정보 로드 오류:', error)
      toast.error('컷 상세 정보를 불러오는데 실패했습니다.')
    } finally {
      setIsLoadingDetails(false)
    }
  }

  // 컷 타입 정보
  const getCutTypeInfo = (type) => {
    const types = {
      'wide_shot': { label: '와이드 샷', color: 'primary', bgColor: '#e3f2fd', icon: <Camera /> },
      'medium_shot': { label: '미디엄 샷', color: 'secondary', bgColor: '#f3e5f5', icon: <Camera /> },
      'close_up': { label: '클로즈업', color: 'success', bgColor: '#e8f5e8', icon: <Camera /> },
      'extreme_close_up': { label: '익스트림 클로즈업', color: 'warning', bgColor: '#fff3e0', icon: <Camera /> },
      'over_the_shoulder': { label: '오버 더 숄더', color: 'info', bgColor: '#e0f2f1', icon: <Camera /> },
      'point_of_view': { label: 'POV', color: 'error', bgColor: '#ffebee', icon: <Camera /> },
      'aerial': { label: '에어리얼', color: 'primary', bgColor: '#e8eaf6', icon: <Camera /> },
      'tracking': { label: '트래킹', color: 'secondary', bgColor: '#fce4ec', icon: <Camera /> }
    }
    return types[type] || { label: '기타', color: 'default', bgColor: '#f5f5f5', icon: <Camera /> }
  }

  // 필드 변경 핸들러
  const handleFieldChange = (field, value) => {
    setEditedCut(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // 이미지 로드 에러 핸들러
  const handleImageLoadError = (event) => {
    event.target.style.display = 'none'
    const placeholder = event.target.parentNode.querySelector('.image-placeholder')
    if (placeholder) {
      placeholder.style.display = 'flex'
    }
  }

  // 이미지 재시도 핸들러
  const handleImageRetry = async () => {
    if (onRegenerateImage && editedCut) {
      try {
        setIsLoading(true)
        await onRegenerateImage(editedCut)
        toast.success('컷 이미지가 재생성되었습니다.')
      } catch (error) {
        console.error('이미지 재생성 실패:', error)
        toast.error('이미지 재생성에 실패했습니다.')
      } finally {
        setIsLoading(false)
      }
    }
  }

  // 저장 핸들러
  const handleSave = async () => {
    if (!editedCut) return

    try {
      setIsLoading(true)
      await onSave(editedCut)
      toast.success('컷 정보가 저장되었습니다.')
      onClose()
    } catch (error) {
      console.error('컷 저장 실패:', error)
      toast.error('컷 저장에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 모달 닫기 핸들러
  const handleClose = () => {
    setEditedCut(null)
    onClose()
  }

  // 컷 데이터가 변경될 때마다 편집용 상태 업데이트
  useEffect(() => {
    if (cut && cut.id) {
      console.log('🔍 CutEditModal 컷 데이터 변경:', cut)
      console.log('🔍 CutEditModal 컷 데이터 상세:', {
        id: cut.id,
        title: cut.title,
        description: cut.description,
        shotSize: cut.shotSize,
        angleDirection: cut.angleDirection,
        cameraMovement: cut.cameraMovement,
        lensSpecs: cut.lensSpecs,
        lighting: cut.lighting,
        weather: cut.weather,
        timeOfDay: cut.timeOfDay,
        vfxEffects: cut.vfxEffects,
        soundEffects: cut.soundEffects,

        directorNotes: cut.directorNotes,
        shootingPlan: cut.shootingPlan,
        shootingConditions: cut.shootingConditions
      })
      
      // 먼저 전달받은 컷 데이터로 기본 설정
      const baseCutData = {
        ...cut,
        // 기본값 설정
        vfxEffects: cut.vfxEffects || '',
        soundEffects: cut.soundEffects || '',

        composition: cut.composition || '',
        dialogue: cut.dialogue || '',
        directorNotes: cut.directorNotes || '',
        shotSize: cut.shotSize || cut.shootingPlan?.shotSize || '',
        angleDirection: cut.angleDirection || cut.shootingPlan?.angleDirection || '',
        cameraMovement: cut.cameraMovement || cut.shootingPlan?.cameraMovement || '',
        duration: cut.duration || cut.estimatedDuration || 5,
        lighting: cut.lighting || cut.shootingConditions?.lighting || '',
        weather: cut.weather || cut.shootingConditions?.weather || '',
        timeOfDay: cut.timeOfDay || cut.shootingConditions?.timeOfDay || '',
        // 추가 필드들
        lensSpecs: cut.lensSpecs || cut.shootingPlan?.lensSpecs || '',
        cutType: cut.cutType || 'medium_shot',
        narration: cut.narration || '',
        characterMovement: cut.characterMovement || '',
        visualEffects: cut.visualEffects || '',
        characters: cut.characters || [],
        dialogue: cut.dialogue || '',
        imageUrl: cut.imageUrl || null,
        // 중첩된 객체들도 그대로 유지
        shootingPlan: cut.shootingPlan || {},
        shootingConditions: cut.shootingConditions || {}
      }
      
      setEditedCut(baseCutData)
      
      // 전달받은 컷 데이터에 상세 정보가 부족한 경우에만 API 호출
      const hasDetailedInfo = cut.shootingPlan || cut.shootingConditions || cut.vfxEffects || cut.soundEffects || cut.directorNotes
      
      if (!hasDetailedInfo && projectId) {
        console.log('🔍 CutEditModal 상세 정보 부족, API 호출:', { cutId: cut.id, hasDetailedInfo })
        loadCutDetails(cut.id)
      } else {
        console.log('🔍 CutEditModal 전달받은 데이터 사용:', { cutId: cut.id, hasDetailedInfo })
      }
    }
  }, [cut, projectId])

  if (!editedCut) return null

  const cutTypeInfo = getCutTypeInfo(editedCut.cutType)

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '90vh'
        }
      }}
    >
      {/* 모달 헤더 */}
      <Box sx={{
        p: 3,
        borderBottom: '1px solid #ddd',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {isLoadingDetails ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={20} />
              <Typography variant="h5" component="h2">
                컷 정보 로딩 중...
              </Typography>
            </Box>
          ) : (
            <Typography variant="h5" component="h2">
              컷 {editedCut.cutNumber || editedCut.shotNumber || 'N/A'}: {editedCut.title || '제목 없음'}
            </Typography>
          )}
          {cutTypeInfo && !isLoadingDetails && (
            <Chip
              icon={cutTypeInfo.icon}
              label={cutTypeInfo.label}
              color={cutTypeInfo.color}
              sx={{
                backgroundColor: cutTypeInfo.bgColor,
                color: 'var(--color-text-primary)'
              }}
            />
          )}
        </Box>
        <IconButton onClick={handleClose}>
          <Close />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* 컷 기본 정보 */}
          <Grid item xs={12}>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">컷 기본 정보</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="컷 번호"
                      value={editedCut.cutNumber || editedCut.shotNumber || ''}
                      onChange={(e) => handleFieldChange('cutNumber', e.target.value)}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="컷 제목"
                      value={editedCut.title || ''}
                      onChange={(e) => handleFieldChange('title', e.target.value)}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="지속시간 (초)"
                      type="number"
                      value={editedCut.duration || editedCut.estimatedDuration || ''}
                      onChange={(e) => handleFieldChange('duration', e.target.value)}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="컷 설명"
                      value={editedCut.description || ''}
                      onChange={(e) => handleFieldChange('description', e.target.value)}
                      variant="outlined"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* 컷 이미지 */}
          {editedCut.imageUrl && (
            <Grid item xs={12}>
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">컷 이미지</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ position: 'relative', width: '100%', height: 300 }}>
                    <img
                      src={editedCut.imageUrl && editedCut.imageUrl.startsWith('/') ? `http://localhost:5001${editedCut.imageUrl}` : editedCut.imageUrl}
                      alt={`컷 ${editedCut.cutNumber || editedCut.shotNumber}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: 8
                      }}
                      onError={handleImageLoadError}
                    />
                    <Box
                      className="image-placeholder"
                      sx={{
                        display: 'none',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: '#f5f5f5',
                        borderRadius: 8,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        gap: 2
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        이미지를 불러올 수 없습니다
                      </Typography>
                      {onRegenerateImage && (
                        <Button
                          variant="outlined"
                          onClick={handleImageRetry}
                          disabled={isLoading}
                        >
                          이미지 재생성
                        </Button>
                      )}
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Grid>
          )}

          {/* 대사 및 나레이션 */}
          <Grid item xs={12}>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">대사 및 나레이션</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="대사 및 나레이션"
                      placeholder="컷에서 사용되는 대사나 나레이션 (선택사항)"
                      value={editedCut.dialogue || ''}
                      onChange={(e) => handleFieldChange('dialogue', e.target.value)}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="나레이션"
                      placeholder="컷에서 사용되는 나레이션 (선택사항)"
                      value={editedCut.narration || ''}
                      onChange={(e) => handleFieldChange('narration', e.target.value)}
                      variant="outlined"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* 촬영 계획 */}
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">촬영 계획</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>샷 사이즈</InputLabel>
                      <Select
                        value={editedCut.shootingPlan?.shotSize || editedCut.shotSize || ''}
                        onChange={(e) => handleFieldChange('shootingPlan', { ...editedCut.shootingPlan, shotSize: e.target.value })}
                        label="샷 사이즈"
                      >
                        <MenuItem value="EWS">익스트림 와이드 샷</MenuItem>
                        <MenuItem value="WS">와이드 샷</MenuItem>
                        <MenuItem value="MS">미디엄 샷</MenuItem>
                        <MenuItem value="CU">클로즈업</MenuItem>
                        <MenuItem value="ECU">익스트림 클로즈업</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>앵글 방향</InputLabel>
                      <Select
                        value={editedCut.shootingPlan?.angleDirection || editedCut.angleDirection || ''}
                        onChange={(e) => handleFieldChange('shootingPlan', { ...editedCut.shootingPlan, angleDirection: e.target.value })}
                        label="앵글 방향"
                      >
                        <MenuItem value="Eye-level">아이 레벨</MenuItem>
                        <MenuItem value="High">하이 앵글</MenuItem>
                        <MenuItem value="Low">로우 앵글</MenuItem>
                        <MenuItem value="Dutch">더치 앵글</MenuItem>
                        <MenuItem value="Bird_eye">버드스아이</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>카메라 움직임</InputLabel>
                      <Select
                        value={editedCut.shootingPlan?.cameraMovement || editedCut.cameraMovement || ''}
                        onChange={(e) => handleFieldChange('shootingPlan', { ...editedCut.shootingPlan, cameraMovement: e.target.value })}
                        label="카메라 움직임"
                      >
                        <MenuItem value="Static">정적</MenuItem>
                        <MenuItem value="Pan">팬</MenuItem>
                        <MenuItem value="Tilt">틸트</MenuItem>
                        <MenuItem value="Dolly">돌리</MenuItem>
                        <MenuItem value="Zoom">줌</MenuItem>
                        <MenuItem value="Handheld">핸드헬드</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="렌즈 스펙"
                      value={editedCut.shootingPlan?.lensSpecs || editedCut.lensSpecs || ''}
                      onChange={(e) => handleFieldChange('shootingPlan', { ...editedCut.shootingPlan, lensSpecs: e.target.value })}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="조리개"
                      value={editedCut.shootingPlan?.cameraSettings?.aperture || ''}
                      onChange={(e) => handleFieldChange('shootingPlan', { 
                        ...editedCut.shootingPlan, 
                        cameraSettings: { 
                          ...editedCut.shootingPlan?.cameraSettings, 
                          aperture: e.target.value 
                        } 
                      })}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="셔터 스피드"
                      value={editedCut.shootingPlan?.cameraSettings?.shutterSpeed || ''}
                      onChange={(e) => handleFieldChange('shootingPlan', { 
                        ...editedCut.shootingPlan, 
                        cameraSettings: { 
                          ...editedCut.shootingPlan?.cameraSettings, 
                          shutterSpeed: e.target.value 
                        } 
                      })}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="ISO"
                      value={editedCut.shootingPlan?.cameraSettings?.iso || ''}
                      onChange={(e) => handleFieldChange('shootingPlan', { 
                        ...editedCut.shootingPlan, 
                        cameraSettings: { 
                          ...editedCut.shootingPlan?.cameraSettings, 
                          iso: e.target.value 
                        } 
                      })}
                      variant="outlined"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* 조명 세팅 */}
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">조명 세팅</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="메인 라이트"
                      value={editedCut.shootingConditions?.lightingSetup?.mainLight || ''}
                      onChange={(e) => handleFieldChange('shootingConditions', { 
                        ...editedCut.shootingConditions, 
                        lightingSetup: { 
                          ...editedCut.shootingConditions?.lightingSetup, 
                          mainLight: e.target.value 
                        } 
                      })}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="필 라이트"
                      value={editedCut.shootingConditions?.lightingSetup?.fillLight || ''}
                      onChange={(e) => handleFieldChange('shootingConditions', { 
                        ...editedCut.shootingConditions, 
                        lightingSetup: { 
                          ...editedCut.shootingConditions?.lightingSetup, 
                          fillLight: e.target.value 
                        } 
                      })}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="백 라이트"
                      value={editedCut.shootingConditions?.lightingSetup?.backLight || ''}
                      onChange={(e) => handleFieldChange('shootingConditions', { 
                        ...editedCut.shootingConditions, 
                        lightingSetup: { 
                          ...editedCut.shootingConditions?.lightingSetup, 
                          backLight: e.target.value 
                        } 
                      })}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>강도</InputLabel>
                      <Select
                        value={editedCut.shootingConditions?.lightingSetup?.intensity || '보통'}
                        onChange={(e) => handleFieldChange('shootingConditions', { 
                          ...editedCut.shootingConditions, 
                          lightingSetup: { 
                            ...editedCut.shootingConditions?.lightingSetup, 
                            intensity: e.target.value 
                          } 
                        })}
                        label="강도"
                      >
                        <MenuItem value="낮음">낮음</MenuItem>
                        <MenuItem value="보통">보통</MenuItem>
                        <MenuItem value="높음">높음</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="색온도"
                      value={editedCut.shootingConditions?.lightingSetup?.color || ''}
                      onChange={(e) => handleFieldChange('shootingConditions', { 
                        ...editedCut.shootingConditions, 
                        lightingSetup: { 
                          ...editedCut.shootingConditions?.lightingSetup, 
                          color: e.target.value 
                        } 
                      })}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="특수 효과"
                      value={editedCut.shootingConditions?.lightingSetup?.specialEffects || ''}
                      onChange={(e) => handleFieldChange('shootingConditions', { 
                        ...editedCut.shootingConditions, 
                        lightingSetup: { 
                          ...editedCut.shootingConditions?.lightingSetup, 
                          specialEffects: e.target.value 
                        } 
                      })}
                      variant="outlined"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* 등장인물 및 동선 */}
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">등장인물 및 동선</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="등장인물 동선"
                      placeholder="등장인물들의 위치와 움직임"
                      value={editedCut.characterMovement?.blocking || ''}
                      onChange={(e) => handleFieldChange('characterMovement', { 
                        ...editedCut.characterMovement, 
                        blocking: e.target.value 
                      })}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="카메라 X 위치"
                      type="number"
                      value={editedCut.characterMovement?.cameraPosition?.x || 50}
                      onChange={(e) => handleFieldChange('characterMovement', { 
                        ...editedCut.characterMovement, 
                        cameraPosition: { 
                          ...editedCut.characterMovement?.cameraPosition, 
                          x: parseFloat(e.target.value) 
                        } 
                      })}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="카메라 Y 위치"
                      type="number"
                      value={editedCut.characterMovement?.cameraPosition?.y || 50}
                      onChange={(e) => handleFieldChange('characterMovement', { 
                        ...editedCut.characterMovement, 
                        cameraPosition: { 
                          ...editedCut.characterMovement?.cameraPosition, 
                          y: parseFloat(e.target.value) 
                        } 
                      })}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="카메라 Z 위치"
                      type="number"
                      value={editedCut.characterMovement?.cameraPosition?.z || 0}
                      onChange={(e) => handleFieldChange('characterMovement', { 
                        ...editedCut.characterMovement, 
                        cameraPosition: { 
                          ...editedCut.characterMovement?.cameraPosition, 
                          z: parseFloat(e.target.value) 
                        } 
                      })}
                      variant="outlined"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* 필요 인력 */}
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">필요 인력</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="감독"
                      value={editedCut.requiredPersonnel?.director || ''}
                      onChange={(e) => handleFieldChange('requiredPersonnel', { 
                        ...editedCut.requiredPersonnel, 
                        director: e.target.value 
                      })}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="촬영감독"
                      value={editedCut.requiredPersonnel?.cinematographer || ''}
                      onChange={(e) => handleFieldChange('requiredPersonnel', { 
                        ...editedCut.requiredPersonnel, 
                        cinematographer: e.target.value 
                      })}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="카메라맨"
                      value={editedCut.requiredPersonnel?.cameraOperator || ''}
                      onChange={(e) => handleFieldChange('requiredPersonnel', { 
                        ...editedCut.requiredPersonnel, 
                        cameraOperator: e.target.value 
                      })}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="조명감독"
                      value={editedCut.requiredPersonnel?.lightingDirector || ''}
                      onChange={(e) => handleFieldChange('requiredPersonnel', { 
                        ...editedCut.requiredPersonnel, 
                        lightingDirector: e.target.value 
                      })}
                      variant="outlined"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* 필요 장비 */}
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">필요 장비</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="카메라"
                      placeholder="카메라 종류 (쉼표로 구분)"
                      value={editedCut.requiredEquipment?.cameras?.join(', ') || ''}
                      onChange={(e) => handleFieldChange('requiredEquipment', { 
                        ...editedCut.requiredEquipment, 
                        cameras: e.target.value.split(',').map(item => item.trim()).filter(item => item) 
                      })}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="렌즈"
                      placeholder="렌즈 종류 (쉼표로 구분)"
                      value={editedCut.requiredEquipment?.lenses?.join(', ') || ''}
                      onChange={(e) => handleFieldChange('requiredEquipment', { 
                        ...editedCut.requiredEquipment, 
                        lenses: e.target.value.split(',').map(item => item.trim()).filter(item => item) 
                      })}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="조명"
                      placeholder="조명 장비 (쉼표로 구분)"
                      value={editedCut.requiredEquipment?.lighting?.join(', ') || ''}
                      onChange={(e) => handleFieldChange('requiredEquipment', { 
                        ...editedCut.requiredEquipment, 
                        lighting: e.target.value.split(',').map(item => item.trim()).filter(item => item) 
                      })}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="오디오"
                      placeholder="오디오 장비 (쉼표로 구분)"
                      value={editedCut.requiredEquipment?.audio?.join(', ') || ''}
                      onChange={(e) => handleFieldChange('requiredEquipment', { 
                        ...editedCut.requiredEquipment, 
                        audio: e.target.value.split(',').map(item => item.trim()).filter(item => item) 
                      })}
                      variant="outlined"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* VFX/CG 정보 */}
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">VFX/CG 효과</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="VFX/CG 효과"
                      placeholder="예: 슬로우모션, 합성, 디지털 이펙트"
                      value={editedCut.vfxEffects || ''}
                      onChange={(e) => handleFieldChange('vfxEffects', e.target.value)}
                      variant="outlined"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* 사운드 정보 */}
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">사운드 정보</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="사운드 (SFX/BGM)"
                      placeholder="효과음, 음악, 대사 위치"
                      value={editedCut.soundEffects || ''}
                      onChange={(e) => handleFieldChange('soundEffects', e.target.value)}
                      variant="outlined"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* 연출 정보 */}
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">연출 정보</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="구도/인물 위치"
                      placeholder="인물 배치, 시선 방향 등"
                      value={editedCut.composition || ''}
                      onChange={(e) => handleFieldChange('composition', e.target.value)}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="연출 노트"
                      placeholder="감독의 연출 지시사항이나 특별한 요구사항"
                      value={editedCut.directorNotes || ''}
                      onChange={(e) => handleFieldChange('directorNotes', e.target.value)}
                      variant="outlined"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* 환경 설정 */}
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">환경 설정</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="조명"
                      value={editedCut.lighting || ''}
                      onChange={(e) => handleFieldChange('lighting', e.target.value)}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="날씨"
                      value={editedCut.weather || ''}
                      onChange={(e) => handleFieldChange('weather', e.target.value)}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="시간대"
                      value={editedCut.timeOfDay || ''}
                      onChange={(e) => handleFieldChange('timeOfDay', e.target.value)}
                      variant="outlined"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button onClick={handleClose} variant="outlined">
          취소
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={isLoading}
          startIcon={<Edit />}
        >
          {isLoading ? '저장 중...' : '저장'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CutEditModal 