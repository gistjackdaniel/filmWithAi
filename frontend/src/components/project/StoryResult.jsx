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
  Alert,
  Paper,
  Card,
  CardContent,
  CardActions,
  Grid,
  LinearProgress
} from '@mui/material'
import { 
  Edit,
  ContentCopy,
  Check,
  Save,
  Refresh,
  AutoFixHigh,
  Download,
  Share,
  Bookmark,
  BookmarkBorder
} from '@mui/icons-material'
import { useStoryStore } from '../../stores/storyStore'
import { useProjectStore } from '../../stores/projectStore'
import { 
  updateStory,
  shareStory,
  saveStoryVersion
} from '../../services/projectApi'
import toast from 'react-hot-toast'

/**
 * 스토리 결과 표시 컴포넌트
 * AI가 생성한 스토리를 표시하고 편집 기능을 제공
 * 고급 편집 기능: 자동 저장, 복사, 재생성, 버전 관리
 */
const StoryResult = ({ 
  projectId,
  story, 
  onSave, 
  onRegenerate,
  isGenerating = false,
  onAutoSave = null,
  isFavorite = false,
  onToggleFavorite
}) => {
  // 스토어
  const storyStore = useStoryStore()
  const projectStore = useProjectStore()
  
  const {
    setIsGenerating,
    setGenerationError,
    addToHistory
  } = storyStore

  // 로컬 상태
  const [isEditing, setIsEditing] = useState(false)
  const [editedStory, setEditedStory] = useState(story)
  const [copied, setCopied] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle') // 'idle', 'saving', 'saved', 'error'
  const [showAutoSaveAlert, setShowAutoSaveAlert] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const [wordCount, setWordCount] = useState(0)
  const [characterCount, setCharacterCount] = useState(0)

  // 스토리 변경 시 편집 상태 업데이트
  useEffect(() => {
    setEditedStory(story)
    updateCounts(story)
  }, [story])

  // 단어 수와 문자 수 계산
  const updateCounts = (text) => {
    const words = text.trim().split(/\s+/).filter(word => word.length > 0)
    setWordCount(words.length)
    setCharacterCount(text.length)
  }

  // 편집 모드 토글 핸들러
  const handleToggleEdit = () => {
    if (isEditing) {
      // 편집 취소
      setEditedStory(story)
    }
    setIsEditing(!isEditing)
  }

  // 편집된 스토리 저장 핸들러
  const handleSaveEdit = async () => {
    if (!projectId) {
      toast.error('프로젝트 ID가 필요합니다.')
      return
    }

    setIsSaving(true)
    try {
      const result = await updateStory(projectId, editedStory)
      
      if (result.success) {
        // 스토어 업데이트
        if (onSave) {
          onSave(editedStory)
        }
        
        // 히스토리에 추가
        addToHistory({
          id: Date.now().toString(),
          synopsis: '', // 프로젝트에서 가져올 수 있음
          story: editedStory,
          createdAt: new Date().toISOString(),
          isFavorite: false
        })
        
        setIsEditing(false)
        setLastSaved(new Date())
        toast.success('스토리가 저장되었습니다.')
      } else {
        toast.error(result.error || '스토리 저장에 실패했습니다.')
      }
    } catch (error) {
      console.error('스토리 저장 실패:', error)
      toast.error('스토리 저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  // 스토리 복사 핸들러
  const handleCopyStory = async () => {
    try {
      const textToCopy = isEditing ? editedStory : story
      await navigator.clipboard.writeText(textToCopy)
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

  // 스토리 재생성 핸들러
  const handleRegenerate = () => {
    if (onRegenerate) {
      onRegenerate()
      toast.success('스토리 재생성을 시작합니다.')
    }
  }

  // 스토리 텍스트 변경 핸들러
  const handleStoryChange = (e) => {
    const newText = e.target.value
    setEditedStory(newText)
    updateCounts(newText)
    
    // 자동 저장 시작
    startAutoSave()
  }

  // 자동 저장 시작
  const startAutoSave = useCallback(() => {
    setAutoSaveStatus('saving')
    
    // 이전 타이머 클리어
    if (window.storyAutoSaveTimer) {
      clearTimeout(window.storyAutoSaveTimer)
    }
    
    // 새로운 타이머 설정
    window.storyAutoSaveTimer = setTimeout(() => {
      handleAutoSave()
    }, 3000) // 3초 후 자동 저장
  }, [])

  // 자동 저장 실행
  const handleAutoSave = async () => {
    if (!projectId || !editedStory.trim()) {
      setAutoSaveStatus('idle')
      return
    }

    try {
      const result = await updateStory(projectId, editedStory)
      
      if (result.success) {
        setAutoSaveStatus('saved')
        setLastSaved(new Date())
        setShowAutoSaveAlert(true)
        
        // 3초 후 알림 숨기기
        setTimeout(() => {
          setShowAutoSaveAlert(false)
          setAutoSaveStatus('idle')
        }, 3000)
      } else {
        setAutoSaveStatus('error')
      }
    } catch (error) {
      console.error('자동 저장 실패:', error)
      setAutoSaveStatus('error')
    }
  }

  // 스토리 공유 핸들러
  const handleShareStory = async () => {
    if (!projectId) {
      toast.error('프로젝트 ID가 필요합니다.')
      return
    }

    try {
      const result = await shareStory(projectId)
      
      if (result.success) {
        toast.success('스토리가 공유되었습니다.')
      } else {
        toast.error(result.error || '스토리 공유에 실패했습니다.')
      }
    } catch (error) {
      console.error('스토리 공유 실패:', error)
      toast.error('스토리 공유 중 오류가 발생했습니다.')
    }
  }

  // 스토리 다운로드 핸들러
  const handleDownloadStory = () => {
    const textToDownload = isEditing ? editedStory : story
    const blob = new Blob([textToDownload], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `story_${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('스토리가 다운로드되었습니다.')
  }

  // 즐겨찾기 토글
  const handleToggleFavorite = () => {
    if (onToggleFavorite) {
      onToggleFavorite()
    }
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        {/* 헤더 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            생성된 스토리
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              onClick={handleToggleFavorite}
              color={isFavorite ? 'primary' : 'default'}
            >
              {isFavorite ? <Bookmark /> : <BookmarkBorder />}
            </IconButton>
            
            <IconButton
              onClick={handleCopyStory}
              color={copied ? 'success' : 'default'}
            >
              {copied ? <Check /> : <ContentCopy />}
            </IconButton>
            
            <IconButton onClick={handleShareStory}>
              <Share />
            </IconButton>
            
            <IconButton onClick={handleDownloadStory}>
              <Download />
            </IconButton>
          </Box>
        </Box>

        {/* 통계 정보 */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h6" color="primary">
                    {wordCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    단어 수
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h6" color="primary">
                    {characterCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    문자 수
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h6" color="primary">
                    {Math.ceil(characterCount / 200)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    예상 분량
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h6" color="primary">
                    {lastSaved ? '✓' : '✗'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    저장 상태
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* 자동 저장 상태 */}
        {autoSaveStatus === 'saving' && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress variant="indeterminate" sx={{ height: 2 }} />
            <Typography variant="caption" color="text.secondary">
              자동 저장 중...
            </Typography>
          </Box>
        )}

        {/* 스토리 내용 */}
        <Box sx={{ mb: 3 }}>
          {isEditing ? (
            <TextField
              fullWidth
              multiline
              rows={15}
              value={editedStory}
              onChange={handleStoryChange}
              placeholder="스토리를 편집하세요..."
              disabled={isGenerating}
              sx={{ fontFamily: 'monospace' }}
            />
          ) : (
            <Box
              sx={{
                p: 3,
                border: '1px solid #ddd',
                borderRadius: 1,
                backgroundColor: '#fafafa',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.6,
                minHeight: 400
              }}
            >
              {story || '생성된 스토리가 없습니다.'}
            </Box>
          )}
        </Box>

        {/* 액션 버튼 */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant={isEditing ? 'contained' : 'outlined'}
            startIcon={isEditing ? <Save /> : <Edit />}
            onClick={isEditing ? handleSaveEdit : handleToggleEdit}
            disabled={isGenerating || isSaving}
          >
            {isEditing ? (isSaving ? '저장 중...' : '저장') : '편집'}
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRegenerate}
            disabled={isGenerating}
          >
            재생성
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<AutoFixHigh />}
            onClick={handleRegenerate}
            disabled={isGenerating}
          >
            개선
          </Button>
        </Box>

        {/* 마지막 저장 시간 */}
        {lastSaved && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            마지막 저장: {lastSaved.toLocaleString()}
          </Typography>
        )}
      </Paper>

      {/* 자동 저장 알림 */}
      <Snackbar
        open={showAutoSaveAlert}
        autoHideDuration={3000}
        onClose={() => setShowAutoSaveAlert(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setShowAutoSaveAlert(false)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          스토리가 자동 저장되었습니다.
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default StoryResult 