import { 
  Box, 
  Typography, 
  Modal,
  TextField,
  Button,
  IconButton,
  Chip,
  Stack,
} from '@mui/material';
import { 
  Close,
  Create,
  ArrowForward,
  Add
} from '@mui/icons-material';
import { useState } from 'react';

interface ProjectCreationData {
  title: string;
  synopsis: string;
  tags: string[];
  genre: string[];
  storyGenerationType: 'ai' | 'direct';
}

interface ProjectCreationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: ProjectCreationData) => Promise<void>;
}

/**
 * 프로젝트 생성 모달 컴포넌트
 * 새 프로젝트 생성 시 제목과 시놉시스를 입력할 수 있는 모달
 */
const ProjectCreationModal = ({ 
  open, 
  onClose, 
  onConfirm 
}: ProjectCreationModalProps) => {
  // 로컬 상태 관리
  const [projectTitle, setProjectTitle] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [genre, setGenre] = useState<string[]>([]);
  const [newGenre, setNewGenre] = useState('');
  const [storyGenerationType, setStoryGenerationType] = useState<'ai' | 'direct'>('ai');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 미리 정의된 장르들
  const predefinedGenres = [
    '드라마', '액션', '코미디', '로맨스', '스릴러', 
    'SF', '판타지', '호러', '다큐멘터리', '애니메이션',
    '가족', '모험', '범죄', '전쟁', '뮤지컬'
  ];

  // 태그 추가 핸들러
  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setNewTag('');
    }
  };

  // 태그 삭제 핸들러
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // 장르 추가 핸들러
  const handleAddGenre = (genreItem: string) => {
    const trimmedGenre = genreItem.trim();
    if (trimmedGenre && !genre.includes(trimmedGenre)) {
      setGenre([...genre, trimmedGenre]);
      setNewGenre('');
    }
  };

  // 장르 삭제 핸들러
  const handleRemoveGenre = (genreToRemove: string) => {
    setGenre(genre.filter(g => g !== genreToRemove));
  };

  // 엔터키로 태그 추가
  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(newTag);
    }
  };

  // 엔터키로 장르 추가
  const handleGenreKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddGenre(newGenre);
    }
  };

  // 제출 핸들러
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!projectTitle.trim()) {
      alert('프로젝트 제목을 입력해주세요.');
      return;
    }

    if (!synopsis.trim()) {
      alert('시놉시스를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const projectData = {
        title: projectTitle.trim(),
        synopsis: synopsis.trim(),
        tags: tags.length > 0 ? tags : [],
        genre: genre.length > 0 ? genre : [],
        storyGenerationType: storyGenerationType
      };
      
      await onConfirm(projectData);
      
      // 성공 시 폼 초기화
      setProjectTitle('');
      setSynopsis('');
      setTags([]);
      setNewTag('');
      setGenre([]);
      setNewGenre('');
    } catch (error) {
      console.error('프로젝트 생성 실패:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 모달 닫기 시 폼 초기화
  const handleClose = () => {
    setProjectTitle('');
    setSynopsis('');
    setTags([]);
    setNewTag('');
    setGenre([]);
    setNewGenre('');
    setStoryGenerationType('ai');
    onClose();
  };

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
        maxHeight: '90vh',
        bgcolor: 'background.paper',
        borderRadius: 3,
        boxShadow: 24,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* 모달 헤더 */}
        <Box sx={{
          p: 3,
          borderBottom: '1px solid #ddd',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #1B1B1E 0%, #2E3A59 100%)',
          color: 'white',
          flexShrink: 0
        }}>
          <Typography variant="h5" component="h2">
            🎬 새 프로젝트 만들기
          </Typography>
          <IconButton onClick={handleClose} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </Box>

        {/* 모달 내용 - 스크롤 가능한 영역 */}
        <Box 
          sx={{ 
            p: 4,
            overflowY: 'auto',
            flex: 1,
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#888',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: '#555',
            },
          }}
        >
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
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              장르 선택
            </Typography>
            
            {/* 미리 정의된 장르들 */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                추천 장르:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {predefinedGenres.map((genreItem) => (
                  <Chip
                    key={genreItem}
                    label={genreItem}
                    onClick={() => handleAddGenre(genreItem)}
                    variant={genre.includes(genreItem) ? "filled" : "outlined"}
                    color={genre.includes(genreItem) ? "primary" : "default"}
                    size="small"
                    sx={{ mb: 1 }}
                  />
                ))}
              </Stack>
            </Box>

            {/* 선택된 장르들 */}
            {genre.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  선택된 장르:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {genre.map((genreItem) => (
                    <Chip
                      key={genreItem}
                      label={genreItem}
                      onDelete={() => handleRemoveGenre(genreItem)}
                      color="primary"
                      size="small"
                      sx={{ mb: 1 }}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            {/* 커스텀 장르 입력 */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                size="small"
                placeholder="직접 장르 입력..."
                value={newGenre}
                onChange={(e) => setNewGenre(e.target.value)}
                onKeyPress={handleGenreKeyPress}
                disabled={isSubmitting}
                sx={{ flex: 1 }}
              />
              <Button
                size="small"
                variant="outlined"
                onClick={() => handleAddGenre(newGenre)}
                disabled={isSubmitting || !newGenre.trim()}
                startIcon={<Add />}
              >
                추가
              </Button>
            </Box>
          </Box>

          {/* 태그 선택 */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              태그 선택 (선택사항)
            </Typography>
            
            {/* 선택된 태그들 */}
            {tags.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  선택된 태그:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      onDelete={() => handleRemoveTag(tag)}
                      color="secondary"
                      size="small"
                      sx={{ mb: 1 }}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            {/* 커스텀 태그 입력 */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                size="small"
                placeholder="직접 태그 입력..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleTagKeyPress}
                disabled={isSubmitting}
                sx={{ flex: 1 }}
              />
              <Button
                size="small"
                variant="outlined"
                onClick={() => handleAddTag(newTag)}
                disabled={isSubmitting || !newTag.trim()}
                startIcon={<Add />}
              >
                추가
              </Button>
            </Box>
          </Box>

          {/* 시놉시스 입력 */}
          <TextField
            fullWidth
            label="시놉시스"
            value={synopsis}
            onChange={(e) => setSynopsis(e.target.value)}
            placeholder="영화의 기본 줄거리를 간단히 설명해주세요..."
            multiline
            rows={4}
            required
            sx={{ mb: 3 }}
            disabled={isSubmitting}
            helperText="시놉시스는 나중에 수정할 수 있습니다."
          />

          {/* 스토리 생성 방식 선택 */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              스토리 생성 방식
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant={storyGenerationType === 'ai' ? 'contained' : 'outlined'}
                onClick={() => setStoryGenerationType('ai')}
                disabled={isSubmitting || !synopsis.trim()}
                sx={{ flex: 1 }}
                startIcon={<Create />}
              >
                AI 스토리 생성
              </Button>
              <Button
                variant={storyGenerationType === 'direct' ? 'contained' : 'outlined'}
                onClick={() => setStoryGenerationType('direct')}
                disabled={isSubmitting || !synopsis.trim()}
                sx={{ flex: 1 }}
                startIcon={<Create />}
              >
                직접 스토리 작성
              </Button>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {storyGenerationType === 'ai' 
                ? '시놉시스를 바탕으로 AI가 스토리를 생성합니다.' 
                : '나만의 스토리를 직접 작성할 수 있습니다.'}
            </Typography>
          </Box>
        </Box>

        {/* 버튼 영역 - 고정 위치 */}
        <Box sx={{ 
          p: 3, 
          borderTop: '1px solid #ddd',
          display: 'flex', 
          gap: 2, 
          justifyContent: 'flex-end',
          flexShrink: 0,
          background: 'background.paper'
        }}>
          <Button
            variant="outlined"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button
            variant="contained"
            startIcon={<Create />}
            endIcon={<ArrowForward />}
            disabled={isSubmitting || !projectTitle.trim() || !synopsis.trim()}
            onClick={handleSubmit}
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
    </Modal>
  );
};

export default ProjectCreationModal; 