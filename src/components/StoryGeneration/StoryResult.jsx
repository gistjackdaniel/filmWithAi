import { useState, useEffect, useCallback } from 'react'
import { 
  Box, 
  Typography, 
  Button,
  TextField,
  IconButton,
  Chip,
  Divider,
  Snackbar,
  Alert
} from '@mui/material'
import { 
  Edit,
  ContentCopy,
  Check,
  Save,
  Refresh,
  AutoFixHigh
} from '@mui/icons-material'
import toast from 'react-hot-toast'

/**
 * 스토리 결과 표시 컴포넌트
 * AI가 생성한 스토리를 표시하고 편집 기능을 제공
 * PRD 2.1.2 AI 스토리 생성 기능의 결과 표시 부분
 */
const StoryResult = ({ 
  story, 
  onSave, 
  onRegenerate,
  isGenerating = false,
  onAutoSave = null,
  projectId = null
}) => {
  // 로컬 상태 관리
  const [isEditing, setIsEditing] = useState(false) // 편집 모드 상태
  const [editedStory, setEditedStory] = useState(story) // 편집된 스토리
  const [copied, setCopied] = useState(false) // 복사 상태
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle') // 자동 저장 상태: 'idle', 'saving', 'saved', 'error'
  const [showAutoSaveAlert, setShowAutoSaveAlert] = useState(false) // 자동 저장 알림 표시 여부

  /**
   * 편집 모드 토글 핸들러
   */
  const handleToggleEdit = () => {
    if (isEditing) {
      // 편집 취소
      setEditedStory(story)
    }
    setIsEditing(!isEditing)
  }

  /**
   * 편집된 스토리 저장 핸들러
   */
  const handleSaveEdit = () => {
    if (onSave) {
      onSave(editedStory)
      toast.success('스토리가 저장되었습니다.')
    }
    setIsEditing(false)
  }

  /**
   * 스토리 복사 핸들러
   */
  const handleCopyStory = async () => {
    try {
      await navigator.clipboard.writeText(isEditing ? editedStory : story)
      setCopied(true)
      toast.success('스토리가 클립보드에 복사되었습니다.')
      
      // 2초 후 복사 상태 초기화
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (error) {
      console.error('복사 실패:', error)
      toast.error('복사에 실패했습니다.')
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
   * 스토리 텍스트 변경 핸들러
   */
  const handleStoryChange = (e) => {
    setEditedStory(e.target.value)
  }

  /**
   * 자동 저장 실행
   */
  const handleAutoSave = useCallback(async () => {
    if (!onAutoSave || !projectId || autoSaveStatus === 'saving') {
      return
    }

    setAutoSaveStatus('saving')
    
    try {
      await onAutoSave(projectId, editedStory)
      setAutoSaveStatus('saved')
      setShowAutoSaveAlert(true)
      
      // 3초 후 상태 초기화
      setTimeout(() => {
        setAutoSaveStatus('idle')
        setShowAutoSaveAlert(false)
      }, 3000)
    } catch (error) {
      console.error('자동 저장 실패:', error)
      setAutoSaveStatus('error')
      setShowAutoSaveAlert(true)
      
      // 5초 후 상태 초기화
      setTimeout(() => {
        setAutoSaveStatus('idle')
        setShowAutoSaveAlert(false)
      }, 5000)
    }
  }, [onAutoSave, projectId, editedStory, autoSaveStatus])

  /**
   * 자동 저장 디바운스 효과
   */
  useEffect(() => {
    if (!isEditing || !onAutoSave || !projectId) {
      return
    }

    const timer = setTimeout(() => {
      handleAutoSave()
    }, 2000) // 2초 후 자동 저장

    return () => clearTimeout(timer)
  }, [editedStory, isEditing, handleAutoSave, onAutoSave, projectId])

  /**
   * 스토리 변경 시 편집된 스토리 업데이트
   */
  useEffect(() => {
    setEditedStory(story)
  }, [story])

  // 스토리가 없으면 빈 상태 표시
  if (!story) {
    return null
  }

  return (
    <Box sx={{ mb: 4 }}>
      {/* 섹션 헤더 */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2
      }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
          생성된 스토리
        </Typography>
        
        {/* 액션 버튼들 */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* 편집 버튼 */}
          <IconButton
            onClick={handleToggleEdit}
            disabled={isGenerating}
            sx={{ 
              color: isEditing ? 'var(--color-accent)' : 'text.secondary',
              '&:hover': { color: 'var(--color-accent)' }
            }}
          >
            <Edit />
          </IconButton>
          
          {/* 복사 버튼 */}
          <IconButton
            onClick={handleCopyStory}
            disabled={isGenerating}
            sx={{ 
              color: copied ? 'var(--color-success)' : 'text.secondary',
              '&:hover': { color: 'var(--color-success)' }
            }}
          >
            {copied ? <Check /> : <ContentCopy />}
          </IconButton>
          
          {/* 재생성 버튼 */}
          <IconButton
            onClick={handleRegenerate}
            disabled={isGenerating}
            sx={{ 
              color: 'text.secondary',
              '&:hover': { color: 'var(--color-accent)' }
            }}
          >
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {/* 스토리 내용 */}
      <Box
        sx={{
          p: 3,
          border: '1px solid #444',
          borderRadius: '12px',
          backgroundColor: 'var(--color-card-bg)',
          minHeight: '300px',
          position: 'relative'
        }}
      >
        {isEditing ? (
          // 편집 모드
          <Box>
            <TextField
              multiline
              fullWidth
              value={editedStory}
              onChange={handleStoryChange}
              variant="outlined"
              rows={15}
                              sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'transparent',
                    color: 'var(--color-text-primary)',
                    '& fieldset': {
                      borderColor: 'transparent',
                    },
                    '&:hover fieldset': {
                      borderColor: 'transparent',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'transparent',
                    },
                  },
                  '& .MuiInputBase-input': {
                    font: 'var(--font-body-1)',
                    lineHeight: 1.6,
                  }
                }}
            />
            
            {/* 편집 모드 액션 버튼 */}
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSaveEdit}
                sx={{
                  backgroundColor: 'var(--color-success)',
                  '&:hover': { backgroundColor: '#27AE60' }
                }}
              >
                저장
              </Button>
              <Button
                variant="outlined"
                onClick={handleToggleEdit}
                sx={{ borderColor: '#444', color: 'var(--color-text-primary)' }}
              >
                취소
              </Button>
            </Box>
          </Box>
        ) : (
          // 읽기 모드
          <Typography 
            variant="body1" 
            sx={{ 
              whiteSpace: 'pre-wrap',
              lineHeight: 1.6,
              font: 'var(--font-body-1)'
            }}
          >
            {story}
          </Typography>
        )}
      </Box>

      {/* 스토리 정보 */}
      <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Chip 
          label="AI 생성" 
          size="small" 
          sx={{ 
            backgroundColor: 'var(--color-accent)', 
            color: 'var(--color-bg)',
            fontWeight: 'bold'
          }} 
        />
        <Chip 
          label={`${story.length}자`} 
          size="small" 
          variant="outlined"
          sx={{ borderColor: '#444', color: 'var(--color-text-secondary)' }} 
        />
        <Chip 
          label="편집 가능" 
          size="small" 
          variant="outlined"
          sx={{ borderColor: '#444', color: 'var(--color-text-secondary)' }} 
        />
        {autoSaveStatus === 'saving' && (
          <Chip 
            label="자동 저장 중..." 
            size="small" 
            icon={<AutoFixHigh />}
            sx={{ 
              backgroundColor: 'var(--color-primary)', 
              color: 'var(--color-text-primary)'
            }} 
          />
        )}
        {autoSaveStatus === 'saved' && (
          <Chip 
            label="자동 저장됨" 
            size="small" 
            sx={{ 
              backgroundColor: 'var(--color-success)', 
              color: 'white'
            }} 
          />
        )}
      </Box>

      {/* 사용 팁 */}
      <Box sx={{ mt: 3, p: 2, backgroundColor: 'var(--color-bg)', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          💡 <strong>사용 팁:</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          • 생성된 스토리를 편집하여 더욱 완성도 높은 내용으로 만들어보세요
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • 만족스럽지 않다면 재생성 버튼을 눌러 새로운 스토리를 생성할 수 있습니다
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • 완성된 스토리는 저장 버튼을 눌러 프로젝트에 저장하세요
        </Typography>
      </Box>

      {/* 자동 저장 알림 */}
      <Snackbar
        open={showAutoSaveAlert}
        autoHideDuration={3000}
        onClose={() => setShowAutoSaveAlert(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setShowAutoSaveAlert(false)}
          severity={autoSaveStatus === 'saved' ? 'success' : 'error'}
          sx={{ width: '100%' }}
        >
          {autoSaveStatus === 'saved' 
            ? '스토리가 자동으로 저장되었습니다.' 
            : '자동 저장에 실패했습니다. 수동으로 저장해주세요.'
          }
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default StoryResult 