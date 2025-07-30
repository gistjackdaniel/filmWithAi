import { useState, useEffect } from 'react'
import { 
  Box, 
  Typography, 
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Tooltip,
  Alert,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions
} from '@mui/material'
import { 
  Search,
  Favorite,
  FavoriteBorder,
  Delete,
  Refresh,
  ContentCopy,
  History,
  Star,
  RestoreFromTrash
} from '@mui/icons-material'
import { useStoryStore } from '../../stores/storyStore'
import { useProjectStore } from '../../stores/projectStore'
import { 
  getStoryGenerationHistory,
  createStoryVersion,
  restoreStoryVersion
} from '../../services/projectApi'
import toast from 'react-hot-toast'

/**
 * 스토리 히스토리 패넌트
 * 이전 생성 결과를 표시하고 재사용할 수 있는 기능 제공
 */
const StoryHistoryPanel = ({ 
  projectId,
  onSelectHistory, 
  onReuseHistory 
}) => {
  // 스토어
  const storyStore = useStoryStore()
  const projectStore = useProjectStore()
  
  const {
    storyHistory,
    currentHistoryId,
    addToHistory,
    removeFromHistoryById,
    toggleFavorite,
    clearHistory
  } = storyStore

  // 로컬 상태
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all') // 'all', 'favorites'
  const [selectedHistory, setSelectedHistory] = useState(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  // 히스토리 로드
  useEffect(() => {
    if (projectId) {
      loadHistory()
    }
  }, [projectId])

  // 히스토리 로드
  const loadHistory = async () => {
    if (!projectId) return

    setIsLoading(true)
    try {
      const result = await getStoryGenerationHistory(projectId)
      if (result.success) {
        // 스토어에 히스토리 추가
        result.data.forEach(item => {
          addToHistory(item)
        })
      }
    } catch (error) {
      console.error('히스토리 로드 실패:', error)
      toast.error('히스토리를 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 필터링된 히스토리 목록
  const filteredHistory = () => {
    let filtered = storyHistory

    // 즐겨찾기 필터
    if (filterType === 'favorites') {
      filtered = filtered.filter(item => item.isFavorite)
    }

    // 검색 필터
    if (searchQuery.trim()) {
      filtered = filtered.filter(item => 
        item.synopsis.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.story.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }

  // 히스토리 아이템 클릭
  const handleHistoryClick = (historyItem) => {
    setSelectedHistory(historyItem)
    setShowDetailDialog(true)
  }

  // 히스토리 재사용
  const handleReuseHistory = (historyItem) => {
    if (onReuseHistory) {
      onReuseHistory({
        synopsis: historyItem.synopsis,
        settings: historyItem.settings,
        story: historyItem.story
      })
      toast.success('히스토리가 적용되었습니다.')
    }
  }

  // 히스토리 복사
  const handleCopyHistory = async (historyItem) => {
    try {
      await navigator.clipboard.writeText(historyItem.story)
      toast.success('스토리가 클립보드에 복사되었습니다.')
    } catch (error) {
      toast.error('복사에 실패했습니다.')
    }
  }

  // 즐겨찾기 토글
  const handleToggleFavorite = (historyId) => {
    toggleFavorite(historyId)
    toast.success('즐겨찾기가 업데이트되었습니다.')
  }

  // 히스토리 삭제
  const handleDeleteHistory = (historyId) => {
    removeFromHistoryById(historyId)
    toast.success('히스토리가 삭제되었습니다.')
    setConfirmDelete(null)
  }

  // 모든 히스토리 삭제
  const handleClearAllHistory = () => {
    clearHistory()
    toast.success('모든 히스토리가 삭제되었습니다.')
  }

  // 날짜 포맷
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          스토리 히스토리
        </Typography>

        {/* 검색 및 필터 */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="히스토리 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <Search />
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant={filterType === 'all' ? 'contained' : 'outlined'}
                onClick={() => setFilterType('all')}
                fullWidth
              >
                전체
              </Button>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant={filterType === 'favorites' ? 'contained' : 'outlined'}
                onClick={() => setFilterType('favorites')}
                startIcon={<Star />}
                fullWidth
              >
                즐겨찾기
              </Button>
            </Grid>
          </Grid>
        </Box>

        {/* 히스토리 목록 */}
        {isLoading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography>히스토리를 불러오는 중...</Typography>
          </Box>
        ) : filteredHistory().length === 0 ? (
          <Alert severity="info">
            {searchQuery || filterType === 'favorites' 
              ? '검색 결과가 없습니다.' 
              : '아직 생성된 스토리 히스토리가 없습니다.'
            }
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {filteredHistory().map((item) => (
              <Grid item xs={12} md={6} key={item.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      {item.synopsis.substring(0, 50)}...
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {item.story.substring(0, 100)}...
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                      <Chip 
                        label={item.settings?.genre || '일반'} 
                        size="small" 
                        variant="outlined" 
                      />
                      <Chip 
                        label={`${item.story.length}자`} 
                        size="small" 
                        variant="outlined" 
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(item.createdAt)}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <IconButton 
                      size="small" 
                      onClick={() => handleHistoryClick(item)}
                    >
                      <History />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleReuseHistory(item)}
                    >
                      <Refresh />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleCopyHistory(item)}
                    >
                      <ContentCopy />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleToggleFavorite(item.id)}
                      color={item.isFavorite ? 'primary' : 'default'}
                    >
                      {item.isFavorite ? <Favorite /> : <FavoriteBorder />}
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => setConfirmDelete(item.id)}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* 전체 삭제 버튼 */}
        {filteredHistory().length > 0 && (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button
              variant="outlined"
              color="error"
              onClick={handleClearAllHistory}
              startIcon={<Delete />}
            >
              모든 히스토리 삭제
            </Button>
          </Box>
        )}
      </Paper>

      {/* 상세 정보 다이얼로그 */}
      <Dialog
        open={showDetailDialog}
        onClose={() => setShowDetailDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          스토리 히스토리 상세
        </DialogTitle>
        <DialogContent>
          {selectedHistory && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                시놉시스
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, whiteSpace: 'pre-wrap' }}>
                {selectedHistory.synopsis}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" sx={{ mb: 2 }}>
                생성된 스토리
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {selectedHistory.story}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetailDialog(false)}>
            닫기
          </Button>
          {selectedHistory && (
            <>
              <Button
                onClick={() => {
                  handleReuseHistory(selectedHistory)
                  setShowDetailDialog(false)
                }}
                variant="contained"
              >
                재사용
              </Button>
              <Button
                onClick={() => {
                  handleCopyHistory(selectedHistory)
                }}
                variant="outlined"
              >
                복사
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
      >
        <DialogTitle>히스토리 삭제</DialogTitle>
        <DialogContent>
          <Typography>
            이 히스토리를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>
            취소
          </Button>
          <Button 
            onClick={() => handleDeleteHistory(confirmDelete)} 
            color="error" 
            variant="contained"
          >
            삭제
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default StoryHistoryPanel 