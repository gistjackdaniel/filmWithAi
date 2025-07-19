import React, { useState, useCallback, useEffect } from 'react'
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  IconButton, 
  Slider, 
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress,
  Tooltip
} from '@mui/material'
import { 
  Edit,
  Save,
  Cancel,
  PlayArrow,
  Pause,
  SkipNext,
  SkipPrevious,
  Settings,
  Timeline,
  CameraAlt,
  Lightbulb,
  WbSunny,
  Person,
  Category,
  Palette,
  Refresh,
  Delete,
  Add
} from '@mui/icons-material'
import VideoPlayer from '../atoms/VideoPlayer'
import { useTheme } from '@mui/material/styles'

/**
 * 컷 편집 컴포넌트
 * 개별 컷 편집, 컷 정보 수정, 컷 미리보기 기능
 */
const CutEditor = ({
  cut,
  onSave,
  onCancel,
  onDelete,
  videoUrl,
  isOpen = false,
  onClose
}) => {
  const theme = useTheme()
  const [editedCut, setEditedCut] = useState(cut)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [expandedSection, setExpandedSection] = useState('basic')

  // 컷 데이터 초기화
  useEffect(() => {
    if (cut) {
      setEditedCut(cut)
      setCurrentTime(cut.startTime || 0)
    }
  }, [cut])

  /**
   * 컷 정보 업데이트
   */
  const handleCutUpdate = useCallback((field, value) => {
    setEditedCut(prev => ({
      ...prev,
      [field]: value
    }))
  }, [])

  /**
   * 메타데이터 업데이트
   */
  const handleMetadataUpdate = useCallback((field, value) => {
    setEditedCut(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [field]: value
      }
    }))
  }, [])

  /**
   * 시작 시간 설정
   */
  const handleStartTimeChange = useCallback((event, newValue) => {
    const startTime = newValue
    const endTime = Math.max(startTime + 0.5, editedCut.endTime || startTime + 2)
    
    setEditedCut(prev => ({
      ...prev,
      startTime,
      endTime,
      duration: endTime - startTime
    }))
  }, [editedCut.endTime])

  /**
   * 종료 시간 설정
   */
  const handleEndTimeChange = useCallback((event, newValue) => {
    const endTime = newValue
    const startTime = Math.min(endTime - 0.5, editedCut.startTime || 0)
    
    setEditedCut(prev => ({
      ...prev,
      startTime,
      endTime,
      duration: endTime - startTime
    }))
  }, [editedCut.startTime])

  /**
   * 컷 저장
   */
  const handleSave = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // 유효성 검사
      if (editedCut.duration < 0.5) {
        throw new Error('컷 길이는 최소 0.5초여야 합니다.')
      }
      
      if (editedCut.startTime >= editedCut.endTime) {
        throw new Error('시작 시간은 종료 시간보다 작아야 합니다.')
      }
      
      await onSave(editedCut)
      
    } catch (error) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }, [editedCut, onSave])

  /**
   * 컷 삭제
   */
  const handleDelete = useCallback(async () => {
    if (window.confirm('이 컷을 삭제하시겠습니까?')) {
      try {
        setIsLoading(true)
        await onDelete(editedCut.id)
      } catch (error) {
        setError(error.message)
      } finally {
        setIsLoading(false)
      }
    }
  }, [editedCut.id, onDelete])

  /**
   * 시간 포맷팅
   */
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  /**
   * 섹션 확장/축소
   */
  const handleSectionChange = useCallback((section) => (event, isExpanded) => {
    setExpandedSection(isExpanded ? section : false)
  }, [])

  if (!cut) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          편집할 컷을 선택하세요
        </Typography>
      </Box>
    )
  }

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: '90vh',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            컷 편집 - {cut.metadata?.description || `컷 ${cut.id}`}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="저장">
              <IconButton 
                onClick={handleSave} 
                disabled={isLoading}
                color="primary"
              >
                <Save />
              </IconButton>
            </Tooltip>
            <Tooltip title="삭제">
              <IconButton 
                onClick={handleDelete} 
                disabled={isLoading}
                color="error"
              >
                <Delete />
              </IconButton>
            </Tooltip>
            <Tooltip title="닫기">
              <IconButton onClick={onClose}>
                <Cancel />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', gap: 2, p: 0 }}>
        {/* 비디오 미리보기 */}
        <Box sx={{ flex: 1, p: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            비디오 미리보기
          </Typography>
          
          <Box sx={{ position: 'relative', height: 300, mb: 2 }}>
            {videoUrl ? (
              <VideoPlayer
                src={videoUrl}
                onTimeUpdate={setCurrentTime}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme.palette.grey[100],
                  borderRadius: 1
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  비디오를 불러올 수 없습니다
                </Typography>
              </Box>
            )}
          </Box>

          {/* 시간 컨트롤 */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              현재 시간: {formatTime(currentTime)}
            </Typography>
            <Slider
              value={currentTime}
              onChange={(event, newValue) => setCurrentTime(newValue)}
              min={0}
              max={cut.endTime || 60}
              step={0.1}
              sx={{ width: '100%' }}
            />
          </Box>
        </Box>

        {/* 컷 편집 폼 */}
        <Box sx={{ flex: 1, p: 2, borderLeft: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            컷 정보 편집
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* 기본 정보 */}
          <Accordion 
            expanded={expandedSection === 'basic'} 
            onChange={handleSectionChange('basic')}
          >
            <AccordionSummary>
              <Typography variant="subtitle2">기본 정보</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="컷 설명"
                    value={editedCut.metadata?.description || ''}
                    onChange={(e) => handleMetadataUpdate('description', e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="시작 시간 (초)"
                    type="number"
                    value={editedCut.startTime || 0}
                    onChange={(e) => handleCutUpdate('startTime', parseFloat(e.target.value))}
                    fullWidth
                    size="small"
                    inputProps={{ step: 0.1, min: 0 }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="종료 시간 (초)"
                    type="number"
                    value={editedCut.endTime || 0}
                    onChange={(e) => handleCutUpdate('endTime', parseFloat(e.target.value))}
                    fullWidth
                    size="small"
                    inputProps={{ step: 0.1, min: 0 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    지속 시간: {formatTime(editedCut.duration || 0)}
                  </Typography>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* 촬영 정보 */}
          <Accordion 
            expanded={expandedSection === 'camera'} 
            onChange={handleSectionChange('camera')}
          >
            <AccordionSummary>
              <Typography variant="subtitle2">촬영 정보</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>

                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>조명</InputLabel>
                    <Select
                      value={editedCut.metadata?.lighting || ''}
                      onChange={(e) => handleMetadataUpdate('lighting', e.target.value)}
                      label="조명"
                    >
                      <MenuItem value="기본">기본</MenuItem>
                      <MenuItem value="다이나믹">다이나믹</MenuItem>
                      <MenuItem value="드라마틱">드라마틱</MenuItem>
                      <MenuItem value="자연광">자연광</MenuItem>
                      <MenuItem value="인공광">인공광</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>날씨</InputLabel>
                    <Select
                      value={editedCut.metadata?.weather || ''}
                      onChange={(e) => handleMetadataUpdate('weather', e.target.value)}
                      label="날씨"
                    >
                      <MenuItem value="맑음">맑음</MenuItem>
                      <MenuItem value="흐림">흐림</MenuItem>
                      <MenuItem value="비">비</MenuItem>
                      <MenuItem value="눈">눈</MenuItem>
                      <MenuItem value="안개">안개</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="특수효과"
                    value={editedCut.metadata?.specialEffects?.join(', ') || ''}
                    onChange={(e) => handleMetadataUpdate('specialEffects', e.target.value.split(', '))}
                    fullWidth
                    size="small"
                    placeholder="예: 스모크, 파티클, 합성"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* 등장인물 및 소품 */}
          <Accordion 
            expanded={expandedSection === 'characters'} 
            onChange={handleSectionChange('characters')}
          >
            <AccordionSummary>
              <Typography variant="subtitle2">등장인물 및 소품</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="등장인물"
                    value={editedCut.metadata?.characters?.join(', ') || ''}
                    onChange={(e) => handleMetadataUpdate('characters', e.target.value.split(', '))}
                    fullWidth
                    size="small"
                    placeholder="예: 주인공, 조연, 엑스트라"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="소품"
                    value={editedCut.metadata?.props?.join(', ') || ''}
                    onChange={(e) => handleMetadataUpdate('props', e.target.value.split(', '))}
                    fullWidth
                    size="small"
                    placeholder="예: 총, 차량, 가구"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* 분석 정보 */}
          <Accordion 
            expanded={expandedSection === 'analysis'} 
            onChange={handleSectionChange('analysis')}
          >
            <AccordionSummary>
              <Typography variant="subtitle2">분석 정보</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    전환점 신뢰도: {Math.round((editedCut.confidence || 0) * 100)}%
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    시각적 변화: {Math.round((editedCut.visualChange || 0) * 100)}%
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    오디오 변화: {Math.round((editedCut.audioChange || 0) * 100)}%
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    컷 타입: {editedCut.type || 'auto'}
                  </Typography>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onCancel} disabled={isLoading}>
          취소
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={isLoading}
          startIcon={<Save />}
        >
          저장
        </Button>
      </DialogActions>

      {/* 로딩 오버레이 */}
      {isLoading && (
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
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1000
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <LinearProgress sx={{ width: 200, mb: 2 }} />
            <Typography variant="body2" color="white">
              저장 중...
            </Typography>
          </Box>
        </Box>
      )}
    </Dialog>
  )
}

export default CutEditor 