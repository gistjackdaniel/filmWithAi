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
  Alert
} from '@mui/material'
import { 
  Search,
  Favorite,
  FavoriteBorder,
  Delete,
  Refresh,
  ContentCopy,
  History,
  Star
} from '@mui/icons-material'
import useStoryHistoryStore from '../../stores/storyHistoryStore'
import toast from 'react-hot-toast'

/**
 * 스토리 생성 히스토리 목록 컴포넌트
 * 이전 생성 결과를 표시하고 재사용할 수 있는 기능 제공
 * PRD 2.1.2 AI 스토리 생성 기능의 히스토리 관리
 */
const HistoryList = ({ onSelectHistory, onReuseHistory }) => {
  // 로컬 상태 관리
  const [searchQuery, setSearchQuery] = useState('') // 검색 쿼리
  const [filterType, setFilterType] = useState('all') // 필터 타입: 'all', 'favorites'
  const [selectedHistory, setSelectedHistory] = useState(null) // 선택된 히스토리
  const [showDetailDialog, setShowDetailDialog] = useState(false) // 상세 정보 다이얼로그 표시 여부
  const [confirmDelete, setConfirmDelete] = useState(null) // 삭제 확인 다이얼로그

  // Zustand 스토어에서 히스토리 데이터 가져오기
  const {
    history,
    getFavorites,
    searchHistory,
    removeFromHistory,
    toggleFavorite,
    clearHistory,
    getHistoryStats
  } = useStoryHistoryStore()

  // 필터링된 히스토리 목록
  const filteredHistory = () => {
    let filtered = history

    // 즐겨찾기 필터
    if (filterType === 'favorites') {
      filtered = getFavorites()
    }

    // 검색 필터
    if (searchQuery.trim()) {
      filtered = searchHistory(searchQuery)
    }

    return filtered
  }

  /**
   * 히스토리 아이템 클릭 핸들러
   * @param {Object} historyItem - 히스토리 아이템
   */
  const handleHistoryClick = (historyItem) => {
    setSelectedHistory(historyItem)
    setShowDetailDialog(true)
  }

  /**
   * 히스토리 재사용 핸들러
   * @param {Object} historyItem - 재사용할 히스토리 아이템
   */
  const handleReuseHistory = (historyItem) => {
    if (onReuseHistory) {
      onReuseHistory({
        synopsis: historyItem.synopsis,
        settings: historyItem.settings,
        story: historyItem.story // 스토리 내용도 함께 전달
      })
      // toast 제거 - 부모 컴포넌트에서 처리
    }
  }

  /**
   * 히스토리 복사 핸들러
   * @param {Object} historyItem - 복사할 히스토리 아이템
   */
  const handleCopyHistory = async (historyItem) => {
    try {
      const textToCopy = `시놉시스: ${historyItem.synopsis}\n\n스토리: ${historyItem.story}`
      await navigator.clipboard.writeText(textToCopy)
      toast.success('히스토리가 클립보드에 복사되었습니다.')
    } catch (error) {
      console.error('복사 실패:', error)
      toast.error('복사에 실패했습니다.')
    }
  }

  /**
   * 즐겨찾기 토글 핸들러
   * @param {string} historyId - 토글할 히스토리 ID
   */
  const handleToggleFavorite = (historyId) => {
    toggleFavorite(historyId)
    toast.success('즐겨찾기가 업데이트되었습니다.')
  }

  /**
   * 히스토리 삭제 핸들러
   * @param {string} historyId - 삭제할 히스토리 ID
   */
  const handleDeleteHistory = (historyId) => {
    removeFromHistory(historyId)
    toast.success('히스토리가 삭제되었습니다.')
    setConfirmDelete(null)
  }

  /**
   * 전체 히스토리 삭제 핸들러
   */
  const handleClearAllHistory = () => {
    clearHistory()
    toast.success('모든 히스토리가 삭제되었습니다.')
  }

  /**
   * 날짜 포맷팅
   * @param {string} dateString - 날짜 문자열
   * @returns {string} 포맷된 날짜
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      return '어제'
    } else if (diffDays < 7) {
      return `${diffDays}일 전`
    } else {
      return date.toLocaleDateString('ko-KR')
    }
  }

  // 히스토리 통계
  const stats = getHistoryStats()

  return (
    <Box sx={{ width: '100%' }}>
      {/* 헤더 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          📚 스토리 생성 히스토리
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          이전에 생성한 스토리들을 확인하고 재사용할 수 있습니다.
        </Typography>

        {/* 통계 정보 */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <Chip 
            label={`총 ${stats.totalCount}개`} 
            size="small" 
            variant="outlined"
            sx={{ borderColor: '#444', color: 'var(--color-text-secondary)' }}
          />
          <Chip 
            label={`즐겨찾기 ${stats.favoriteCount}개`} 
            size="small" 
            icon={<Star />}
            sx={{ 
              backgroundColor: 'var(--color-accent)', 
              color: 'var(--color-bg)'
            }}
          />
          <Chip 
            label={`평균 ${Math.round(stats.averageGenerationTime)}초`} 
            size="small" 
            variant="outlined"
            sx={{ borderColor: '#444', color: 'var(--color-text-secondary)' }}
          />
        </Box>
      </Box>

      {/* 검색 및 필터 */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="시놉시스나 스토리로 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          sx={{ flexGrow: 1, minWidth: 200 }}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
          }}
        />
        <Button
          variant={filterType === 'all' ? 'contained' : 'outlined'}
          onClick={() => setFilterType('all')}
          size="small"
          sx={{
            backgroundColor: filterType === 'all' ? 'var(--color-primary)' : 'transparent',
            '&:hover': {
              backgroundColor: filterType === 'all' ? 'var(--color-accent)' : 'rgba(212, 175, 55, 0.1)',
            }
          }}
        >
          전체
        </Button>
        <Button
          variant={filterType === 'favorites' ? 'contained' : 'outlined'}
          onClick={() => setFilterType('favorites')}
          size="small"
          startIcon={<Favorite />}
          sx={{
            backgroundColor: filterType === 'favorites' ? 'var(--color-primary)' : 'transparent',
            '&:hover': {
              backgroundColor: filterType === 'favorites' ? 'var(--color-accent)' : 'rgba(212, 175, 55, 0.1)',
            }
          }}
        >
          즐겨찾기
        </Button>
      </Box>

      {/* 히스토리 목록 */}
      {filteredHistory().length === 0 ? (
        <Box sx={{ 
          textAlign: 'center', 
          py: 4,
          backgroundColor: 'var(--color-card-bg)',
          borderRadius: 2,
          border: '1px solid #444'
        }}>
          <History sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
            {searchQuery ? '검색 결과가 없습니다.' : '아직 생성된 스토리가 없습니다.'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            스토리를 생성하면 여기에 히스토리가 저장됩니다.
          </Typography>
        </Box>
      ) : (
        <List sx={{ 
          backgroundColor: 'var(--color-card-bg)',
          borderRadius: 2,
          border: '1px solid #444',
          maxHeight: 400,
          overflow: 'auto'
        }}>
          {filteredHistory().map((item, index) => (
            <Box key={item.id}>
              <ListItem 
                button 
                onClick={() => handleHistoryClick(item)}
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(212, 175, 55, 0.1)',
                  }
                }}
              >
                <ListItemText
                  primary={
                    <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" component="span" sx={{ fontWeight: 500 }}>
                        {item.synopsis.length > 50 
                          ? `${item.synopsis.substring(0, 50)}...` 
                          : item.synopsis
                        }
                      </Typography>
                      {item.isFavorite && (
                        <Star sx={{ fontSize: 16, color: 'var(--color-accent)' }} />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box component="span">
                      <Typography variant="body2" color="text.secondary" component="span">
                        {formatDate(item.createdAt)} • {item.generationTime}초 • {item.story.length}자
                      </Typography>
                      {item.settings?.genre && (
                        <Box component="span" sx={{ display: 'inline-block', mt: 0.5 }}>
                          <Chip 
                            label={item.settings.genre} 
                            size="small" 
                            sx={{ fontSize: '0.7rem' }}
                          />
                        </Box>
                      )}
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="재사용">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleReuseHistory(item)
                        }}
                        sx={{ color: 'text.secondary' }}
                      >
                        <Refresh />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="복사">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCopyHistory(item)
                        }}
                        sx={{ color: 'text.secondary' }}
                      >
                        <ContentCopy />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={item.isFavorite ? '즐겨찾기 해제' : '즐겨찾기'}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleFavorite(item.id)
                        }}
                        sx={{ 
                          color: item.isFavorite ? 'var(--color-accent)' : 'text.secondary'
                        }}
                      >
                        {item.isFavorite ? <Favorite /> : <FavoriteBorder />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="삭제">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation()
                          setConfirmDelete(item)
                        }}
                        sx={{ color: 'var(--color-danger)' }}
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
              {index < filteredHistory().length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      )}

      {/* 전체 삭제 버튼 */}
      {history.length > 0 && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={handleClearAllHistory}
            sx={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
          >
            전체 히스토리 삭제
          </Button>
        </Box>
      )}

      {/* 상세 정보 다이얼로그 */}
      <Dialog
        open={showDetailDialog}
        onClose={() => setShowDetailDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          스토리 상세 정보
        </DialogTitle>
        <DialogContent>
          {selectedHistory && (
            <Box>
              <Typography variant="h6" gutterBottom>
                시놉시스
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, p: 2, backgroundColor: 'var(--color-bg)', borderRadius: 1 }}>
                {selectedHistory.synopsis}
              </Typography>
              
              <Typography variant="h6" gutterBottom>
                생성된 스토리
              </Typography>
              <Typography variant="body1" sx={{ 
                p: 2, 
                backgroundColor: 'var(--color-bg)', 
                borderRadius: 1,
                whiteSpace: 'pre-wrap',
                maxHeight: 300,
                overflow: 'auto'
              }}>
                {selectedHistory.story}
              </Typography>
              
              <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip label={`생성 시간: ${formatDate(selectedHistory.createdAt)}`} size="small" />
                <Chip label={`소요 시간: ${selectedHistory.generationTime}초`} size="small" />
                <Chip label={`글자 수: ${selectedHistory.story.length}자`} size="small" />
                {selectedHistory.settings?.genre && (
                  <Chip label={`장르: ${selectedHistory.settings.genre}`} size="small" />
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetailDialog(false)}>
            닫기
          </Button>
          {selectedHistory && (
            <Button
              variant="contained"
              onClick={() => {
                handleReuseHistory(selectedHistory)
                setShowDetailDialog(false)
              }}
              sx={{
                backgroundColor: 'var(--color-primary)',
                '&:hover': { backgroundColor: 'var(--color-accent)' }
              }}
            >
              재사용
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
      >
        <DialogTitle>
          히스토리 삭제
        </DialogTitle>
        <DialogContent>
          <Typography>
            이 히스토리를 삭제하시겠습니까?
          </Typography>
          {confirmDelete && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              "{confirmDelete.synopsis.substring(0, 50)}..."
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>
            취소
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => confirmDelete && handleDeleteHistory(confirmDelete.id)}
          >
            삭제
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default HistoryList 