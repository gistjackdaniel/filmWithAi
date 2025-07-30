import { useState, useEffect } from 'react'
import { 
  Box, 
  Typography, 
  Button,
  TextField,
  Chip,
  Alert,
  Paper,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import { AutoStories, Info, Warning } from '@mui/icons-material'
import { useStoryStore } from '../../stores/storyStore'
import { useProjectStore } from '../../stores/projectStore'
import { generateStory } from '../../services/projectApi'
import toast from 'react-hot-toast'

/**
 * 시놉시스 입력 폼 컴포넌트
 * 사용자가 영화 시놉시스를 입력하고 AI 스토리 생성을 요청하는 폼
 * 고급 입력 기능: 문자 수 제한, 유효성 검사, 자동 저장
 */
const SynopsisInputForm = ({ 
  projectId,
  onSubmit, 
  isGenerating = false,
  initialSynopsis = '',
  onSynopsisChange
}) => {
  // 스토어
  const storyStore = useStoryStore()
  const projectStore = useProjectStore()
  
  const {
    synopsis,
    setSynopsis,
    setIsGenerating,
    setGenerationError
  } = storyStore

  // 로컬 상태
  const [error, setError] = useState('')
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const [selectedGenre, setSelectedGenre] = useState('일반')
  const [estimatedDuration, setEstimatedDuration] = useState('90분')

  // 상수 정의
  const MAX_LENGTH = 1000
  const MIN_LENGTH = 10
  const AUTO_SAVE_DELAY = 2000 // 2초

  // 장르 옵션
  const genreOptions = [
    '일반', '액션', '드라마', '코미디', '로맨스', '스릴러', 
    '호러', 'SF', '판타지', '다큐멘터리', '애니메이션'
  ]

  // 상영 시간 옵션
  const durationOptions = [
    '단편 (15분 이하)', '중편 (30분)', '장편 (90분)', '대작 (120분 이상)'
  ]

  /**
   * 초기 시놉시스 설정
   */
  useEffect(() => {
    if (initialSynopsis) {
      setSynopsis(initialSynopsis)
    }
  }, [initialSynopsis, setSynopsis])

  /**
   * 시놉시스 입력 핸들러
   * @param {Event} e - 입력 이벤트
   */
  const handleSynopsisChange = (e) => {
    const value = e.target.value
    
    // 최대 길이 제한
    if (value.length <= MAX_LENGTH) {
      setSynopsis(value)
      setError('')
      
      // 자동 저장 시작
      startAutoSave()
      
      // 부모 컴포넌트에 변경 알림
      if (onSynopsisChange) {
        onSynopsisChange(value)
      }
    }
  }

  /**
   * 자동 저장 시작
   */
  const startAutoSave = () => {
    setIsAutoSaving(true)
    
    // 이전 타이머 클리어
    if (window.autoSaveTimer) {
      clearTimeout(window.autoSaveTimer)
    }
    
    // 새로운 타이머 설정
    window.autoSaveTimer = setTimeout(() => {
      handleAutoSave()
    }, AUTO_SAVE_DELAY)
  }

  /**
   * 자동 저장 실행
   */
  const handleAutoSave = async () => {
    if (!synopsis.trim() || synopsis.length < MIN_LENGTH) {
      setIsAutoSaving(false)
      return
    }

    try {
      // 여기서는 로컬 스토리지에 저장하거나 임시 저장
      localStorage.setItem('synopsis_draft', synopsis)
      setLastSaved(new Date())
      toast.success('시놉시스가 자동 저장되었습니다.')
    } catch (error) {
      console.error('자동 저장 실패:', error)
    } finally {
      setIsAutoSaving(false)
    }
  }

  /**
   * 폼 제출 핸들러
   * @param {Event} e - 제출 이벤트
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // 입력 유효성 검사
    if (!synopsis.trim()) {
      setError('시놉시스를 입력해주세요.')
      return
    }
    
    if (synopsis.trim().length < MIN_LENGTH) {
      setError(`시놉시스는 최소 ${MIN_LENGTH}자 이상 입력해주세요.`)
      return
    }

    if (!projectId) {
      setError('프로젝트 ID가 필요합니다.')
      return
    }
    
    // 부모 컴포넌트에 제출
    if (onSubmit) {
      onSubmit(synopsis.trim())
    }
  }

  /**
   * 문자 수에 따른 색상 결정
   * @returns {string} 색상 클래스명
   */
  const getCharacterCountColor = () => {
    const length = synopsis.length
    if (length === 0) return 'text.secondary'
    if (length < MIN_LENGTH) return 'warning.main'
    if (length > MAX_LENGTH * 0.8) return 'error.main'
    return 'success.main'
  }

  /**
   * 입력 상태에 따른 메시지
   * @returns {string} 상태 메시지
   */
  const getInputStatusMessage = () => {
    const length = synopsis.length
    if (length === 0) return '시놉시스를 입력해주세요'
    if (length < MIN_LENGTH) return `${MIN_LENGTH - length}자 더 입력해주세요`
    if (length > MAX_LENGTH * 0.8) return `${MAX_LENGTH - length}자 남았습니다`
    return '적절한 길이입니다'
  }

  /**
   * 추천 시놉시스 가져오기
   */
  const loadRecommendedSynopsis = () => {
    const recommendations = [
      '한 소년이 마법의 세계로 들어가 모험을 떠나는 이야기',
      '사랑하는 사람을 잃은 후 새로운 삶을 찾아가는 여정',
      '미래 세계에서 인공지능과 인간의 공존을 다룬 이야기',
      '작은 마을에서 벌어지는 신비로운 사건들을 해결하는 이야기',
      '꿈을 향해 노력하는 사람들의 희망과 좌절을 그린 이야기'
    ]
    
    const randomSynopsis = recommendations[Math.floor(Math.random() * recommendations.length)]
    setSynopsis(randomSynopsis)
    toast.success('추천 시놉시스가 적용되었습니다.')
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      {/* OpenAI GPT-4o 안내 */}
      <Alert 
        severity="info" 
        icon={<Info />}
        sx={{ mb: 3, backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-accent)' }}
      >
        <Typography variant="body2">
          <strong>OpenAI GPT-4o 사용</strong> - 최신 AI 모델로 고품질 스토리 생성, 최대 3,000자
        </Typography>
      </Alert>

      {/* 시놉시스 입력 폼 */}
      <Box component="form" onSubmit={handleSubmit}>
        {/* 제목 */}
        <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
          🎬 영화 시놉시스 입력
        </Typography>
        
        {/* 설명 */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          영화의 기본 아이디어를 간단히 설명해주세요. AI가 이를 바탕으로 상세한 스토리를 생성합니다.
        </Typography>

        {/* 장르 및 상영시간 선택 */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>장르</InputLabel>
            <Select
              value={selectedGenre}
              label="장르"
              onChange={(e) => setSelectedGenre(e.target.value)}
            >
              {genreOptions.map((genre) => (
                <MenuItem key={genre} value={genre}>
                  {genre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>상영시간</InputLabel>
            <Select
              value={estimatedDuration}
              label="상영시간"
              onChange={(e) => setEstimatedDuration(e.target.value)}
            >
              {durationOptions.map((duration) => (
                <MenuItem key={duration} value={duration}>
                  {duration}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* 시놉시스 입력 필드 */}
        <TextField
          fullWidth
          multiline
          rows={6}
          value={synopsis}
          onChange={handleSynopsisChange}
          placeholder="영화의 기본 아이디어를 간단히 설명해주세요..."
          error={!!error}
          helperText={error || getInputStatusMessage()}
          disabled={isGenerating}
          sx={{ mb: 2 }}
        />

        {/* 문자 수 표시 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography 
            variant="body2" 
            color={getCharacterCountColor()}
          >
            {synopsis.length} / {MAX_LENGTH}자
          </Typography>
          
          {lastSaved && (
            <Typography variant="caption" color="text.secondary">
              마지막 저장: {lastSaved.toLocaleTimeString()}
            </Typography>
          )}
        </Box>

        {/* 자동 저장 진행률 */}
        {isAutoSaving && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress 
              variant="indeterminate" 
              sx={{ height: 2 }}
            />
            <Typography variant="caption" color="text.secondary">
              자동 저장 중...
            </Typography>
          </Box>
        )}

        {/* 추천 시놉시스 버튼 */}
        <Box sx={{ mb: 3 }}>
          <Button
            variant="outlined"
            onClick={loadRecommendedSynopsis}
            disabled={isGenerating}
            sx={{ mr: 2 }}
          >
            추천 시놉시스
          </Button>
          
          <Button
            variant="outlined"
            onClick={() => {
              setSynopsis('')
              setError('')
            }}
            disabled={isGenerating}
          >
            초기화
          </Button>
        </Box>

        {/* 제출 버튼 */}
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={isGenerating || synopsis.length < MIN_LENGTH}
          startIcon={<AutoStories />}
          sx={{
            background: 'var(--color-accent)',
            '&:hover': {
              background: 'var(--color-accent-hover)'
            }
          }}
        >
          {isGenerating ? '생성 중...' : 'AI 스토리 생성'}
        </Button>

        {/* 경고 메시지 */}
        {synopsis.length > 0 && synopsis.length < MIN_LENGTH && (
          <Alert 
            severity="warning" 
            icon={<Warning />}
            sx={{ mt: 2 }}
          >
            <Typography variant="body2">
              시놉시스가 너무 짧습니다. 더 자세한 설명을 추가해주세요.
            </Typography>
          </Alert>
        )}
      </Box>
    </Paper>
  )
}

export default SynopsisInputForm 