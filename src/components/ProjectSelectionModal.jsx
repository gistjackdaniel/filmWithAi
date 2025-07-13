import { 
  Box, 
  Typography, 
  Modal,
  TextField,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material'
import { 
  Close,
  Create,
  ArrowForward
} from '@mui/icons-material'
import { useState } from 'react'

/**
 * 프로젝트 생성 모달 컴포넌트
 * 새 프로젝트 생성 시 제목과 시놉시스를 입력할 수 있는 모달
 */
const ProjectSelectionModal = ({ 
  open, 
  onClose, 
  onConfirm 
}) => {
  // 로컬 상태 관리
  const [projectTitle, setProjectTitle] = useState('')
  const [synopsis, setSynopsis] = useState('')
  const [genre, setGenre] = useState('일반')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!projectTitle.trim()) {
      alert('프로젝트 제목을 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    
    try {
      await onConfirm({
        title: projectTitle.trim(),
        synopsis: synopsis.trim(),
        genre: genre
      })
      
      // 성공 시 폼 초기화
      setProjectTitle('')
      setSynopsis('')
      setGenre('일반')
    } catch (error) {
      console.error('프로젝트 생성 실패:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 모달 닫기 시 폼 초기화
  const handleClose = () => {
    setProjectTitle('')
    setSynopsis('')
    setGenre('일반')
    onClose()
  }
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="project-selection-modal"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2
      }}
    >
      <Box sx={{
        width: '95%',
        maxWidth: 800,
        bgcolor: 'background.paper',
        borderRadius: 3,
        boxShadow: 24,
        overflow: 'hidden'
      }}>
        {/* 모달 헤더 */}
        <Box sx={{
          p: 3,
          borderBottom: '1px solid #ddd',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #1B1B1E 0%, #2E3A59 100%)',
          color: 'white'
        }}>
          <Typography variant="h5" component="h2">
            🎬 새 프로젝트 만들기
          </Typography>
          <IconButton onClick={handleClose} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </Box>

        {/* 모달 내용 */}
        <Box component="form" onSubmit={handleSubmit} sx={{ p: 4 }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
            새 프로젝트의 기본 정보를 입력해주세요.
          </Typography>
          
          {/* 프로젝트 제목 입력 */}
          <TextField
            fullWidth
            label="프로젝트 제목"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            placeholder="예: 로맨스 영화, 액션 영화..."
            required
            sx={{ mb: 3 }}
            disabled={isSubmitting}
          />

          {/* 장르 선택 */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>장르</InputLabel>
            <Select
              value={genre}
              label="장르"
              onChange={(e) => setGenre(e.target.value)}
              disabled={isSubmitting}
            >
              <MenuItem value="일반">일반</MenuItem>
              <MenuItem value="로맨스">로맨스</MenuItem>
              <MenuItem value="액션">액션</MenuItem>
              <MenuItem value="코미디">코미디</MenuItem>
              <MenuItem value="드라마">드라마</MenuItem>
              <MenuItem value="스릴러">스릴러</MenuItem>
              <MenuItem value="SF">SF</MenuItem>
              <MenuItem value="판타지">판타지</MenuItem>
              <MenuItem value="호러">호러</MenuItem>
              <MenuItem value="다큐멘터리">다큐멘터리</MenuItem>
            </Select>
          </FormControl>

          {/* 시놉시스 입력 (선택사항) */}
          <TextField
            fullWidth
            label="시놉시스 (선택사항)"
            value={synopsis}
            onChange={(e) => setSynopsis(e.target.value)}
            placeholder="영화의 기본 줄거리를 간단히 설명해주세요..."
            multiline
            rows={4}
            sx={{ mb: 4 }}
            disabled={isSubmitting}
            helperText="시놉시스는 나중에 수정할 수 있습니다."
          />

          {/* 버튼 영역 */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={<Create />}
              endIcon={<ArrowForward />}
              disabled={isSubmitting || !projectTitle.trim()}
              sx={{
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1976D2 30%, #1E88E5 90%)',
                }
              }}
            >
              {isSubmitting ? '생성 중...' : '프로젝트 생성'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  )
}

export default ProjectSelectionModal 