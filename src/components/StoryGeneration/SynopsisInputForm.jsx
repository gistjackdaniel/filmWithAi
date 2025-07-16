import { useState, useEffect } from 'react'
import { 
  Box, 
  Typography, 
  Button,
  TextField,
  Chip,
  Alert
} from '@mui/material'
import { AutoStories, Info, Save } from '@mui/icons-material'
import useStoryGenerationStore from '../../stores/storyGenerationStore'

/**
 * 시놉시스 입력 폼 컴포넌트
 * 사용자가 영화 시놉시스를 입력하고 AI 스토리 생성을 요청하는 폼
 * 무료 버전 사용량 정보도 함께 표시
 * PRD 2.1.2 AI 스토리 생성 기능의 핵심 입력 컴포넌트
 */
const SynopsisInputForm = ({ onSubmit, onSave, isGenerating = false }) => {
  // Zustand 스토어에서 상태 가져오기
  const { synopsis, setSynopsis } = useStoryGenerationStore()
  
  // 로컬 상태 관리 (에러 메시지만)
  const [error, setError] = useState('') // 에러 메시지

  // 상수 정의
  const MAX_LENGTH = 1000 // 최대 입력 길이
  const MIN_LENGTH = 10 // 최소 입력 길이

  /**
   * 시놉시스 입력 핸들러
   * @param {Event} e - 입력 이벤트
   */
  const handleSynopsisChange = (e) => {
    const value = e.target.value
    
    // 최대 길이 제한
    if (value.length <= MAX_LENGTH) {
      setSynopsis(value) // 스토어에 저장
      setError('') // 에러 메시지 초기화
    }
  }

  /**
   * 폼 제출 핸들러 (AI 스토리 생성)
   * @param {Event} e - 제출 이벤트
   */
  const handleSubmit = (e) => {
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
    
    // 부모 컴포넌트에 제출
    onSubmit(synopsis.trim())
  }

  /**
   * 시놉시스 저장 핸들러
   */
  const handleSaveSynopsis = () => {
    // 입력 유효성 검사
    if (!synopsis.trim()) {
      setError('시놉시스를 입력해주세요.')
      return
    }
    
    if (synopsis.trim().length < MIN_LENGTH) {
      setError(`시놉시스는 최소 ${MIN_LENGTH}자 이상 입력해주세요.`)
      return
    }
    
    // 부모 컴포넌트에 저장 요청
    if (onSave) {
      onSave(synopsis.trim())
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

  return (
    <Box sx={{ mb: 4 }}>
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

        {/* 시놉시스 입력 필드 */}
        <TextField
          fullWidth
          multiline
          rows={6}
          variant="outlined"
          placeholder="예시: 2030년, 인공지능이 인간을 대체한 미래. 한 AI 연구원이 자신이 AI라는 사실을 깨닫고 인간성을 찾기 위해 모험을 떠나는 이야기..."
          value={synopsis}
          onChange={handleSynopsisChange}
          error={!!error}
          helperText={error}
          disabled={isGenerating}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'var(--color-card-bg)',
              '& fieldset': {
                borderColor: 'var(--color-accent)',
              },
              '&:hover fieldset': {
                borderColor: 'var(--color-accent)',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'var(--color-accent)',
              },
            },
            '& .MuiInputBase-input': {
              color: 'var(--color-text-primary)',
            },
            '& .MuiInputBase-input::placeholder': {
              color: 'var(--color-text-secondary)',
              opacity: 0.7,
            },
          }}
        />

        {/* 문자 수 카운터 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <Typography 
            variant="caption" 
            color={getCharacterCountColor()}
          >
            {synopsis.length} / {MAX_LENGTH} 자
          </Typography>
          
          {/* OpenAI 표시 */}
          <Chip 
            label="GPT-4o" 
            size="small" 
            color="primary"
            icon={<Info />}
          />
        </Box>

        {/* 버튼 그룹 */}
        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          {/* 저장 버튼 */}
          <Button
            type="button"
            variant="outlined"
            size="large"
            startIcon={<Save />}
            disabled={isGenerating || synopsis.trim().length < MIN_LENGTH}
            onClick={handleSaveSynopsis}
            sx={{
              flex: 1,
              borderColor: 'var(--color-accent)',
              color: 'var(--color-accent)',
              '&:hover': {
                borderColor: 'var(--color-accent)',
                backgroundColor: 'rgba(212, 175, 55, 0.1)',
              },
              '&:disabled': {
                borderColor: '#444',
                color: '#666',
              },
            }}
          >
            시놉시스 저장
          </Button>

          {/* AI 스토리 생성 버튼 */}
          <Button
            type="submit"
            variant="contained"
            size="large"
            startIcon={<AutoStories />}
            disabled={isGenerating || synopsis.trim().length < MIN_LENGTH}
            sx={{
              flex: 2,
              backgroundColor: 'var(--color-primary)',
              '&:hover': {
                backgroundColor: 'var(--color-accent)',
              },
              '&:disabled': {
                backgroundColor: '#444',
                color: '#666',
              },
            }}
          >
            {isGenerating ? 'AI 스토리 생성 중...' : 'AI 스토리 생성하기'}
          </Button>
        </Box>
      </Box>
    </Box>
  )
}

export default SynopsisInputForm 