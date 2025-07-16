import { useState } from 'react'
import { 
  Box, 
  Typography, 
  Modal,
  Button,
  IconButton,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider,
  CircularProgress
} from '@mui/material'
import { 
  Close,
  Edit,
  Refresh,
  Error,
  ExpandMore
} from '@mui/icons-material'

/**
 * 콘티 상세 정보 모달 컴포넌트
 * 콘티 리스트와 스케줄표에서 공통으로 사용하는 상세 정보 모달
 * PRD 2.1.3 AI 콘티 생성 기능의 상세 정보 표시 컴포넌트
 */
const ConteDetailModal = ({ 
  open, 
  onClose, 
  conte, 
  onEdit,
  onImageRetry,
  imageLoadErrors = {},
  onImageLoadError,
  isGeneratingImages = false,
  imageGenerationProgress = 0
}) => {
  if (!conte) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="conte-detail-modal"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2
      }}
    >
      <Box sx={{
        width: '90%',
        maxWidth: 800,
        maxHeight: '90vh',
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
            씬 {conte.scene}: {conte.title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {onEdit && (
              <Button
                variant="outlined"
                startIcon={<Edit />}
                onClick={() => {
                  onEdit(conte)
                  onClose()
                }}
              >
                편집
              </Button>
            )}
            <IconButton onClick={onClose}>
              <Close />
            </IconButton>
          </Box>
        </Box>

        {/* 모달 내용 */}
        <Box sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {/* 씬 이미지 */}
            {(conte.imageUrl || isGeneratingImages) && (
              <Grid item xs={12}>
                <Box sx={{ 
                  width: '100%', 
                  height: 300, 
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: '1px solid #ddd',
                  mb: 2,
                  position: 'relative',
                  backgroundColor: 'var(--color-card-bg)'
                }}>
                  {conte.imageUrl ? (
                    <img 
                      src={conte.imageUrl} 
                      alt={`씬 ${conte.scene} 이미지`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => onImageLoadError && onImageLoadError(conte.id, e)}
                    />
                  ) : isGeneratingImages ? (
                    <Box sx={{ 
                      width: '100%', 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center', 
                      justifyContent: 'center',
                      backgroundColor: 'rgba(0, 0, 0, 0.1)'
                    }}>
                      <CircularProgress 
                        size={60} 
                        sx={{ color: 'var(--color-accent)', mb: 2 }} 
                      />
                      <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mb: 1 }}>
                        이미지 생성 중...
                      </Typography>
                      {imageGenerationProgress > 0 && (
                        <Typography variant="body2" color="text.secondary">
                          {Math.round(imageGenerationProgress)}% 완료
                        </Typography>
                      )}
                    </Box>
                  ) : null}
                  {imageLoadErrors[conte.id] && (
                    <Box sx={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: 0, 
                      width: '100%', 
                      height: '100%', 
                      backgroundColor: 'rgba(0, 0, 0, 0.7)', 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      zIndex: 1 
                    }}>
                      <Error sx={{ color: 'white', mb: 1, fontSize: 48 }} />
                      <Typography variant="h6" color="white" sx={{ mb: 1, textAlign: 'center' }}>
                        이미지 로딩 실패
                      </Typography>
                      {onImageRetry && (
                        <Button
                          variant="contained"
                          startIcon={<Refresh />}
                          onClick={() => onImageRetry(conte)}
                          sx={{ 
                            backgroundColor: 'var(--color-primary)',
                            '&:hover': {
                              backgroundColor: 'var(--color-accent)',
                            }
                          }}
                        >
                          재시도
                        </Button>
                      )}
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
                      <Typography variant="subtitle2" color="text.secondary">설명</Typography>
                      <Typography variant="body1" paragraph>
                        {conte.description}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">타입</Typography>
                      <Chip 
                        label={conte.type === 'generated_video' ? 'AI 생성 비디오' : '실사 촬영용'} 
                        color={conte.type === 'generated_video' ? 'secondary' : 'primary'}
                        sx={{ mt: 1 }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">예상 시간</Typography>
                      <Typography variant="body1">
                        {conte.estimatedDuration || '5분'}
                      </Typography>
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
                      <Typography variant="subtitle2" color="text.secondary">카메라 앵글</Typography>
                      <Typography variant="body1" paragraph>
                        {conte.cameraAngle || '설정 없음'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">카메라 워크</Typography>
                      <Typography variant="body1" paragraph>
                        {conte.cameraWork || '설정 없음'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">렌즈 스펙</Typography>
                      <Typography variant="body1" paragraph>
                        {conte.lensSpecs || '설정 없음'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">시각 효과</Typography>
                      <Typography variant="body1" paragraph>
                        {conte.visualEffects || '설정 없음'}
                      </Typography>
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
                      <Typography variant="subtitle2" color="text.secondary">인물 배치</Typography>
                      <Typography variant="body1" paragraph>
                        {conte.characterLayout || '설정 없음'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">소품</Typography>
                      <Typography variant="body1" paragraph>
                        {conte.props || '설정 없음'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">조명</Typography>
                      <Typography variant="body1" paragraph>
                        {conte.lighting || '설정 없음'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">날씨</Typography>
                      <Typography variant="body1" paragraph>
                        {conte.weather || '설정 없음'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">시각적 설명</Typography>
                      <Typography variant="body1" paragraph>
                        {conte.visualDescription || '설정 없음'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">전환</Typography>
                      <Typography variant="body1" paragraph>
                        {conte.transition || '설정 없음'}
                      </Typography>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* 대사 */}
            {conte.dialogue && (
              <Grid item xs={12}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6">대사</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body1" sx={{ 
                      fontStyle: 'italic',
                      p: 2,
                      bgcolor: 'rgba(0, 0, 0, 0.04)',
                      borderRadius: 1,
                      border: '1px solid #ddd'
                    }}>
                      {conte.dialogue}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              </Grid>
            )}

            {/* 키워드 정보 */}
            {conte.keywords && (
              <Grid item xs={12}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6">키워드 정보</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">사용자 정보</Typography>
                        <Typography variant="body1" paragraph>
                          {conte.keywords.userInfo || '기본 사용자'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">장소</Typography>
                        <Typography variant="body1" paragraph>
                          {conte.keywords.location || '기본 장소'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">장비</Typography>
                        <Typography variant="body1" paragraph>
                          {conte.keywords.equipment || '기본 장비'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">조명</Typography>
                        <Typography variant="body1" paragraph>
                          {conte.keywords.lighting || '기본 조명'}
                        </Typography>
                      </Grid>
                      {conte.keywords.cast && Array.isArray(conte.keywords.cast) && conte.keywords.cast.length > 0 && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" color="text.secondary">배우</Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                            {conte.keywords.cast.map((actor, index) => (
                              <Chip key={index} label={actor} size="small" variant="outlined" />
                            ))}
                          </Box>
                        </Grid>
                      )}
                      {conte.keywords.props && Array.isArray(conte.keywords.props) && conte.keywords.props.length > 0 && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" color="text.secondary">소품</Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                            {conte.keywords.props.map((prop, index) => (
                              <Chip key={index} label={prop} size="small" variant="outlined" />
                            ))}
                          </Box>
                        </Grid>
                      )}
                      {conte.keywords.crew && Array.isArray(conte.keywords.crew) && conte.keywords.crew.length > 0 && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" color="text.secondary">필요 인력</Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                            {conte.keywords.crew.map((crew, index) => (
                              <Chip key={index} label={crew} size="small" variant="outlined" color="primary" />
                            ))}
                          </Box>
                        </Grid>
                      )}
                      {conte.keywords.equipment && Array.isArray(conte.keywords.equipment) && conte.keywords.equipment.length > 0 && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" color="text.secondary">필요 장비</Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                            {conte.keywords.equipment.map((equipment, index) => (
                              <Chip key={index} label={equipment} size="small" variant="outlined" color="secondary" />
                            ))}
                          </Box>
                        </Grid>
                      )}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>
            )}
          </Grid>
        </Box>
      </Box>
    </Modal>
  )
}

export default ConteDetailModal 