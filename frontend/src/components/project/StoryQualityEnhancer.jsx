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
import { Paper } from '@mui/material'
import { useStoryStore } from '../../stores/storyStore'
import { useProjectStore } from '../../stores/projectStore'
import { 
  generateStory, 
  checkStoryGenerationStatus 
} from '../../services/projectApi'
import toast from 'react-hot-toast'

/**
 * 스토리 품질 개선 컴포넌트
 * 스토리 재생성, 길이 조절, 스타일 선택 기능 제공
 */
const StoryQualityEnhancer = ({ 
  projectId,
  currentStory = '',
  onStoryUpdated,
  isGenerating = false
}) => {
  // 스토어
  const storyStore = useStoryStore()
  const projectStore = useProjectStore()
  
  const {
    qualityEnhancement,
    updateQualityEnhancement,
    setIsGenerating,
    setGenerationError
  } = storyStore

  // 로컬 상태
  const [showStyleDialog, setShowStyleDialog] = useState(false)
  const [enhancementProgress, setEnhancementProgress] = useState(0)

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
      keywords: ['따뜻함', '감성적', '공감', '마음']
    }
  }

  // 스토리 재생성
  const handleRegenerate = async () => {
    if (!projectId) {
      toast.error('프로젝트 ID가 필요합니다.')
      return
    }

    try {
      setIsGenerating(true)
      setGenerationError('')
      setEnhancementProgress(0)

      const result = await generateStory(projectId, {
        regenerate: true,
        settings: {
          ...qualityEnhancement,
          style: qualityEnhancement.selectedStyle
        }
      })

      if (!result.success) {
        setIsGenerating(false)
        setGenerationError(result.error || '스토리 재생성에 실패했습니다.')
        toast.error(result.error || '스토리 재생성에 실패했습니다.')
      } else {
        toast.success('스토리 재생성이 시작되었습니다.')
      }
    } catch (error) {
      console.error('스토리 재생성 실패:', error)
      setIsGenerating(false)
      setGenerationError('스토리 재생성 중 오류가 발생했습니다.')
      toast.error('스토리 재생성 중 오류가 발생했습니다.')
    }
  }

  // 스토리 개선
  const handleEnhance = async () => {
    if (!projectId) {
      toast.error('프로젝트 ID가 필요합니다.')
      return
    }

    try {
      setIsGenerating(true)
      setGenerationError('')
      setEnhancementProgress(0)

      const result = await generateStory(projectId, {
        enhance: true,
        settings: {
          ...qualityEnhancement,
          lengthMultiplier: qualityEnhancement.lengthMultiplier,
          style: qualityEnhancement.selectedStyle,
          customPrompt: qualityEnhancement.customPrompt
        }
      })

      if (!result.success) {
        setIsGenerating(false)
        setGenerationError(result.error || '스토리 개선에 실패했습니다.')
        toast.error(result.error || '스토리 개선에 실패했습니다.')
      } else {
        toast.success('스토리 개선이 시작되었습니다.')
      }
    } catch (error) {
      console.error('스토리 개선 실패:', error)
      setIsGenerating(false)
      setGenerationError('스토리 개선 중 오류가 발생했습니다.')
      toast.error('스토리 개선 중 오류가 발생했습니다.')
    }
  }

  // 스타일 선택
  const handleStyleSelect = (styleKey) => {
    updateQualityEnhancement({
      ...qualityEnhancement,
      selectedStyle: styleKey
    })
    toast.success(`${storyStyles[styleKey].name} 스타일이 선택되었습니다.`)
  }

  // 길이 조절
  const handleLengthChange = (value) => {
    updateQualityEnhancement({
      ...qualityEnhancement,
      lengthMultiplier: value
    })
  }

  // 고급 옵션 토글
  const handleAdvancedOptionsToggle = () => {
    updateQualityEnhancement({
      ...qualityEnhancement,
      showAdvancedOptions: !qualityEnhancement.showAdvancedOptions
    })
  }

  // 사용자 정의 프롬프트 변경
  const handleCustomPromptChange = (value) => {
    updateQualityEnhancement({
      ...qualityEnhancement,
      customPrompt: value
    })
  }

  // 예상 길이 계산
  const getEstimatedLength = () => {
    const baseLength = currentStory.length
    return Math.round(baseLength * qualityEnhancement.lengthMultiplier)
  }

  // 길이 설명
  const getLengthDescription = () => {
    const length = getEstimatedLength()
    if (length < 1000) return '짧음'
    if (length < 2000) return '보통'
    if (length < 3000) return '길음'
    return '매우 길음'
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          스토리 품질 개선
        </Typography>

        {/* 개선 진행률 */}
        {isGenerating && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              개선 진행률: {enhancementProgress}%
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={enhancementProgress} 
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        )}

        {/* 스타일 선택 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
            스토리 스타일
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(storyStyles).map(([key, style]) => (
              <Grid item xs={12} sm={6} md={4} key={key}>
                <Card 
                  variant="outlined"
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { borderColor: 'primary.main' },
                    borderColor: qualityEnhancement.selectedStyle === key ? 'primary.main' : 'divider'
                  }}
                  onClick={() => handleStyleSelect(key)}
                >
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      {style.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {style.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {style.keywords.map((keyword, index) => (
                        <Chip key={index} label={keyword} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* 길이 조절 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
            스토리 길이 조절
          </Typography>
          <Box sx={{ px: 2 }}>
            <Slider
              value={qualityEnhancement.lengthMultiplier}
              onChange={(e, value) => handleLengthChange(value)}
              min={0.5}
              max={2.0}
              step={0.1}
              marks={[
                { value: 0.5, label: '50%' },
                { value: 1.0, label: '100%' },
                { value: 2.0, label: '200%' }
              ]}
              valueLabelDisplay="auto"
              sx={{ mb: 2 }}
            />
            <Typography variant="body2" color="text.secondary">
              예상 길이: {getEstimatedLength()}자 ({getLengthDescription()})
            </Typography>
          </Box>
        </Box>

        {/* 고급 옵션 */}
        <Box sx={{ mb: 3 }}>
          <Button
            variant="outlined"
            startIcon={qualityEnhancement.showAdvancedOptions ? <ExpandLess /> : <ExpandMore />}
            onClick={handleAdvancedOptionsToggle}
            sx={{ mb: 2 }}
          >
            고급 옵션
          </Button>
          
          {qualityEnhancement.showAdvancedOptions && (
            <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                사용자 정의 프롬프트
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                value={qualityEnhancement.customPrompt}
                onChange={(e) => handleCustomPromptChange(e.target.value)}
                placeholder="AI에게 추가 지시사항을 입력하세요..."
                helperText="스토리 생성 시 AI에게 전달할 특별한 지시사항을 입력할 수 있습니다."
              />
            </Box>
          )}
        </Box>

        {/* 액션 버튼 */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={handleRegenerate}
            disabled={isGenerating}
            sx={{
              background: 'var(--color-accent)',
              '&:hover': {
                background: 'var(--color-accent-hover)'
              }
            }}
          >
            스토리 재생성
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<AutoFixHigh />}
            onClick={handleEnhance}
            disabled={isGenerating}
          >
            스토리 개선
          </Button>
        </Box>
      </Paper>
    </Box>
  )
}

export default StoryQualityEnhancer 