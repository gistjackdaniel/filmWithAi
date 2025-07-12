import { useState } from 'react'
import { 
  Box, 
  Typography, 
  Button,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  LinearProgress
} from '@mui/material'
import { 
  Refresh,
  Tune,
  AutoFixHigh,
  ContentCopy,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material'
import useStoryGenerationStore from '../../stores/storyGenerationStore'
import toast from 'react-hot-toast'

/**
 * 스토리 품질 개선 컴포넌트
 * 스토리 재생성, 길이 조절, 스타일 선택 기능 제공
 * PRD 2.1.2 AI 스토리 생성 기능의 품질 개선 시스템
 */
const StoryQualityEnhancer = ({ 
  currentStory = '',
  onRegenerate,
  onEnhance,
  isGenerating = false,
  qualityEnhancement = {},
  onQualityEnhancementChange
}) => {
  // Zustand 스토어에서 상태 가져오기 (props가 없으면 스토어 사용)
  const store = useStoryGenerationStore()
  const {
    qualityEnhancement: storeQualityEnhancement,
    updateQualityEnhancement
  } = store

  // props 또는 스토어에서 상태 가져오기
  const finalQualityEnhancement = qualityEnhancement.lengthMultiplier ? qualityEnhancement : storeQualityEnhancement
  const finalUpdateQualityEnhancement = onQualityEnhancementChange || updateQualityEnhancement

  // 로컬 상태 관리 (스토어에 없는 UI 전용 상태)
  const [showStyleDialog, setShowStyleDialog] = useState(false) // 스타일 선택 다이얼로그

  // 스토리 스타일 옵션
  const storyStyles = {
    dramatic: {
      name: '드라마틱',
      description: '강렬하고 극적인 스토리',
      keywords: ['강렬', '극적', '임팩트', '감정적']
    },
    descriptive: {
      name: '서술적',
      description: '상세하고 묘사가 풍부한 스토리',
      keywords: ['상세', '묘사', '풍부', '시각적']
    },
    concise: {
      name: '간결',
      description: '핵심만 담은 간결한 스토리',
      keywords: ['간결', '핵심', '명확', '직관적']
    },
    poetic: {
      name: '시적',
      description: '아름답고 시적인 스토리',
      keywords: ['아름다움', '시적', '감성적', '우아']
    },
    humorous: {
      name: '유머러스',
      description: '재미있고 유머러스한 스토리',
      keywords: ['재미', '유머', '가벼운', '웃음']
    },
    mysterious: {
      name: '미스터리',
      description: '신비롭고 미스터리한 스토리',
      keywords: ['신비', '미스터리', '긴장감', '호기심']
    },
    action: {
      name: '액션',
      description: '역동적이고 액션이 있는 스토리',
      keywords: ['역동적', '액션', '긴장감', '스피드']
    },
    emotional: {
      name: '감성적',
      description: '따뜻하고 감성적인 스토리',
      keywords: ['따뜻', '감성적', '공감', '마음']
    }
  }

  /**
   * 스토리 재생성 핸들러
   */
  const handleRegenerate = () => {
    if (onRegenerate) {
      onRegenerate()
      toast.success('스토리 재생성을 시작합니다.')
    }
  }

  /**
   * 스토리 개선 핸들러
   */
  const handleEnhance = async () => {
    if (!currentStory.trim()) {
      toast.error('개선할 스토리가 없습니다.')
      return
    }

    if (onEnhance) {
      // 개선 옵션 구성
      const enhancementOptions = {
        lengthMultiplier: finalQualityEnhancement.lengthMultiplier,
        style: finalQualityEnhancement.selectedStyle,
        customPrompt: finalQualityEnhancement.customPrompt.trim()
      }

      // 진행률 시뮬레이션
      finalUpdateQualityEnhancement({ enhancementProgress: 0 })
      const progressInterval = setInterval(() => {
        finalUpdateQualityEnhancement(prev => {
          const currentProgress = prev.enhancementProgress
          if (currentProgress >= 90) {
            clearInterval(progressInterval)
            return { ...prev, enhancementProgress: 90 }
          }
          return { ...prev, enhancementProgress: currentProgress + 10 }
        })
      }, 200)

      try {
        await onEnhance(enhancementOptions)
        finalUpdateQualityEnhancement({ enhancementProgress: 100 })
        toast.success('스토리가 개선되었습니다.')
        
        // 1초 후 진행률 초기화
        setTimeout(() => {
          finalUpdateQualityEnhancement({ enhancementProgress: 0 })
        }, 1000)
      } catch (error) {
        finalUpdateQualityEnhancement({ enhancementProgress: 0 })
        toast.error('스토리 개선에 실패했습니다.')
      }
    }
  }

  /**
   * 스타일 선택 핸들러
   * @param {string} styleKey - 선택된 스타일 키
   */
  const handleStyleSelect = (styleKey) => {
    finalUpdateQualityEnhancement({
      selectedStyle: styleKey
    })
    setShowStyleDialog(false)
    // toast 제거 - 부모 컴포넌트에서 처리
  }

  /**
   * 길이 배율 변경 핸들러
   * @param {number} value - 새로운 길이 배율
   */
  const handleLengthChange = (value) => {
    finalUpdateQualityEnhancement({
      lengthMultiplier: value
    })
  }

  /**
   * 고급 옵션 토글 핸들러
   */
  const handleAdvancedOptionsToggle = () => {
    finalUpdateQualityEnhancement({
      showAdvancedOptions: !finalQualityEnhancement.showAdvancedOptions
    })
  }

  /**
   * 사용자 정의 프롬프트 변경 핸들러
   * @param {string} value - 새로운 프롬프트
   */
  const handleCustomPromptChange = (value) => {
    finalUpdateQualityEnhancement({
      customPrompt: value
    })
  }

  /**
   * 길이 배율을 실제 글자 수로 변환
   * @returns {number} 예상 글자 수
   */
  const getEstimatedLength = () => {
    const baseLength = currentStory ? currentStory.length : 0
    console.log('StoryQualityEnhancer - currentStory:', currentStory)
    console.log('StoryQualityEnhancer - baseLength:', baseLength)
    return Math.round(baseLength * finalQualityEnhancement.lengthMultiplier)
  }

  /**
   * 길이 배율을 설명으로 변환
   * @returns {string} 길이 설명
   */
  const getLengthDescription = () => {
    const multiplier = finalQualityEnhancement.lengthMultiplier
    if (multiplier < 0.7) return '매우 짧게'
    if (multiplier < 0.9) return '짧게'
    if (multiplier < 1.1) return '현재 길이'
    if (multiplier < 1.3) return '길게'
    if (multiplier < 1.5) return '매우 길게'
    return '극도로 길게'
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* 헤더 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          🎨 스토리 품질 개선
        </Typography>
        <Typography variant="body2" color="text.secondary">
          생성된 스토리의 품질을 개선하고 다양한 스타일로 변환할 수 있습니다.
        </Typography>
      </Box>

      {/* 기본 개선 옵션 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* 재생성 버튼 */}
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ border: '1px solid #444' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Refresh sx={{ mr: 1, verticalAlign: 'middle' }} />
                스토리 재생성
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                완전히 새로운 스토리를 생성합니다.
              </Typography>
              <Button
                variant="contained"
                fullWidth
                onClick={handleRegenerate}
                disabled={isGenerating}
                sx={{
                  backgroundColor: 'var(--color-primary)',
                  '&:hover': { backgroundColor: 'var(--color-accent)' }
                }}
              >
                재생성
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* 스타일 선택 */}
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ border: '1px solid #444' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Tune sx={{ mr: 1, verticalAlign: 'middle' }} />
                스타일 선택
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                스토리의 톤과 스타일을 변경합니다.
              </Typography>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => setShowStyleDialog(true)}
                disabled={isGenerating}
                sx={{ borderColor: '#444', color: 'var(--color-text-primary)' }}
              >
                {finalQualityEnhancement.selectedStyle ? storyStyles[finalQualityEnhancement.selectedStyle].name : '스타일 선택'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* 길이 조절 */}
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ border: '1px solid #444' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <AutoFixHigh sx={{ mr: 1, verticalAlign: 'middle' }} />
                길이 조절
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                스토리의 길이를 조절합니다.
              </Typography>
              <Box sx={{ px: 2 }}>
                <Slider
                  value={finalQualityEnhancement.lengthMultiplier}
                  onChange={(e, value) => handleLengthChange(value)}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  marks={[
                    { value: 0.5, label: '50%' },
                    { value: 1.0, label: '100%' },
                    { value: 2.0, label: '200%' }
                  ]}
                  sx={{
                    '& .MuiSlider-track': {
                      backgroundColor: 'var(--color-accent)',
                    },
                    '& .MuiSlider-thumb': {
                      backgroundColor: 'var(--color-accent)',
                    }
                  }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                  {getLengthDescription()} ({getEstimatedLength()}자 예상)
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 고급 옵션 토글 */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="text"
          onClick={handleAdvancedOptionsToggle}
          endIcon={finalQualityEnhancement.showAdvancedOptions ? <ExpandLess /> : <ExpandMore />}
          sx={{ color: 'var(--color-text-secondary)' }}
        >
          고급 옵션 {finalQualityEnhancement.showAdvancedOptions ? '숨기기' : '보이기'}
        </Button>
      </Box>

      {/* 고급 옵션 */}
      {finalQualityEnhancement.showAdvancedOptions && (
        <Card sx={{ mb: 3, border: '1px solid #444' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              고급 개선 옵션
            </Typography>
            
            {/* 사용자 정의 프롬프트 */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                사용자 정의 프롬프트
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="스토리 개선을 위한 추가 지시사항을 입력하세요..."
                value={finalQualityEnhancement.customPrompt}
                onChange={(e) => handleCustomPromptChange(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'transparent',
                    color: 'var(--color-text-primary)',
                    '& fieldset': {
                      borderColor: '#444',
                    },
                    '&:hover fieldset': {
                      borderColor: '#666',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'var(--color-accent)',
                    },
                  }
                }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                예: "더 감정적이게", "더 자세한 묘사 추가", "대화를 더 자연스럽게"
              </Typography>
            </Box>

            {/* 현재 설정 요약 */}
            <Box sx={{ p: 2, backgroundColor: 'var(--color-bg)', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                현재 설정
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  label={`길이: ${Math.round(finalQualityEnhancement.lengthMultiplier * 100)}%`} 
                  size="small" 
                  variant="outlined"
                />
                {finalQualityEnhancement.selectedStyle && (
                  <Chip 
                    label={`스타일: ${storyStyles[finalQualityEnhancement.selectedStyle].name}`} 
                    size="small" 
                    variant="outlined"
                  />
                )}
                {finalQualityEnhancement.customPrompt && (
                  <Chip 
                    label="사용자 프롬프트" 
                    size="small" 
                    variant="outlined"
                    color="primary"
                  />
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* 개선 진행률 */}
      {finalQualityEnhancement.enhancementProgress > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            스토리 개선 중... {finalQualityEnhancement.enhancementProgress}%
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={finalQualityEnhancement.enhancementProgress}
            sx={{
              '& .MuiLinearProgress-bar': {
                backgroundColor: 'var(--color-accent)',
              }
            }}
          />
        </Box>
      )}

      {/* 개선 실행 버튼 */}
      <Box sx={{ textAlign: 'center' }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleEnhance}
          disabled={isGenerating || !currentStory.trim()}
          sx={{
            backgroundColor: 'var(--color-accent)',
            color: 'var(--color-bg)',
            px: 4,
            py: 1.5,
            '&:hover': {
              backgroundColor: '#B8941F',
            },
            '&:disabled': {
              backgroundColor: '#444',
              color: '#666',
            }
          }}
        >
          스토리 개선하기
        </Button>
      </Box>

      {/* 스타일 선택 다이얼로그 */}
      <Dialog
        open={showStyleDialog}
        onClose={() => setShowStyleDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          스토리 스타일 선택
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {Object.entries(storyStyles).map(([key, style]) => (
              <Grid item xs={12} sm={6} md={4} key={key}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    border: finalQualityEnhancement.selectedStyle === key ? '2px solid var(--color-accent)' : '1px solid #444',
                    '&:hover': {
                      borderColor: 'var(--color-accent)',
                      backgroundColor: 'rgba(212, 175, 55, 0.1)'
                    }
                  }}
                  onClick={() => handleStyleSelect(key)}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {style.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {style.description}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {style.keywords.map((keyword, index) => (
                        <Chip 
                          key={index}
                          label={keyword} 
                          size="small" 
                          sx={{ fontSize: '0.7rem' }}
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowStyleDialog(false)}>
            취소
          </Button>
        </DialogActions>
      </Dialog>

      {/* 사용 팁 */}
      <Box sx={{ mt: 4, p: 3, backgroundColor: 'var(--color-card-bg)', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          💡 스토리 개선 팁
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          • <strong>재생성:</strong> 완전히 새로운 스토리를 원할 때 사용
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          • <strong>스타일 변경:</strong> 스토리의 톤과 분위기를 바꿀 때 사용
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          • <strong>길이 조절:</strong> 스토리가 너무 길거나 짧을 때 사용
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • <strong>사용자 프롬프트:</strong> 구체적인 개선 요청이 있을 때 사용
        </Typography>
      </Box>
    </Box>
  )
}

export default StoryQualityEnhancer 