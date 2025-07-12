import { useState } from 'react'
import { 
  Box, 
  Typography, 
  Button,
  TextField,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import { 
  Image,
  Refresh,
  Download,
  Info
} from '@mui/icons-material'
import { generateSceneImage } from '../../services/storyGenerationApi'
import toast from 'react-hot-toast'

/**
 * 씬 이미지 생성 컴포넌트
 * AI가 씬 설명을 바탕으로 영화 씬 이미지를 생성
 * PRD 2.1.2 AI 스토리 생성 기능의 이미지 생성 부분
 */
const SceneImageGenerator = ({ 
  sceneDescription = '', 
  genre = '일반',
  onImageGenerated = null 
}) => {
  // 로컬 상태 관리
  const [description, setDescription] = useState(sceneDescription)
  const [selectedStyle, setSelectedStyle] = useState('cinematic')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState(null)
  const [error, setError] = useState('')

  // 이미지 스타일 옵션
  const imageStyles = [
    { value: 'cinematic', label: '시네마틱', description: '영화같은 고품질 이미지' },
    { value: 'realistic', label: '사실적', description: '현실적인 촬영 스타일' },
    { value: 'artistic', label: '예술적', description: '예술적이고 창의적인 스타일' },
    { value: 'dramatic', label: '드라마틱', description: '강렬한 조명과 대비' },
    { value: 'minimalist', label: '미니멀', description: '간결하고 깔끔한 스타일' }
  ]

  /**
   * 이미지 생성 핸들러
   */
  const handleGenerateImage = async () => {
    if (!description.trim()) {
      setError('씬 설명을 입력해주세요.')
      return
    }

    setIsGenerating(true)
    setError('')

    try {
      const response = await generateSceneImage({
        sceneDescription: description,
        style: selectedStyle,
        genre: genre
      })

      setGeneratedImage(response)
      
      if (onImageGenerated) {
        onImageGenerated(response)
      }

      toast.success('씬 이미지가 생성되었습니다!')
    } catch (error) {
      console.error('이미지 생성 실패:', error)
      setError(error.message)
      toast.error(error.message)
    } finally {
      setIsGenerating(false)
    }
  }

  /**
   * 이미지 다운로드 핸들러
   */
  const handleDownloadImage = async () => {
    if (!generatedImage?.imageUrl) return

    try {
      const response = await fetch(generatedImage.imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `scene-image-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('이미지가 다운로드되었습니다.')
    } catch (error) {
      console.error('다운로드 실패:', error)
      toast.error('다운로드에 실패했습니다.')
    }
  }

  /**
   * 이미지 재생성 핸들러
   */
  const handleRegenerateImage = () => {
    setGeneratedImage(null)
    handleGenerateImage()
  }

  return (
    <Box sx={{ mb: 4 }}>
      {/* OpenAI DALL·E 3 안내 */}
      <Alert 
        severity="info" 
        icon={<Info />}
        sx={{ mb: 3, backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-accent)' }}
      >
        <Typography variant="body2">
          <strong>OpenAI DALL·E 3 사용</strong> - 고품질 영화 씬 이미지 생성, 분당 5회 제한
        </Typography>
      </Alert>

      {/* 이미지 생성 폼 */}
      <Card sx={{ mb: 3, backgroundColor: 'var(--color-card-bg)' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🎬 씬 이미지 생성
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            씬 설명을 입력하면 AI가 영화 씬에 적합한 이미지를 생성합니다.
          </Typography>

          {/* 씬 설명 입력 */}
          <TextField
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            placeholder="예시: 도시의 밤거리, 네온사인이 반짝이는 배경에서 한 남자가 우산을 쓰고 걸어가는 모습..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isGenerating}
            sx={{ mb: 3 }}
          />

          {/* 이미지 스타일 선택 */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>이미지 스타일</InputLabel>
            <Select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
              disabled={isGenerating}
            >
              {imageStyles.map((style) => (
                <MenuItem key={style.value} value={style.value}>
                  <Box>
                    <Typography variant="body2">{style.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {style.description}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* 생성 버튼 */}
          <Button
            variant="contained"
            startIcon={isGenerating ? <CircularProgress size={20} /> : <Image />}
            onClick={handleGenerateImage}
            disabled={isGenerating || !description.trim()}
            fullWidth
            sx={{
              backgroundColor: 'var(--color-primary)',
              '&:hover': {
                backgroundColor: 'var(--color-accent)',
              },
            }}
          >
            {isGenerating ? '이미지 생성 중...' : 'AI 이미지 생성하기'}
          </Button>

          {/* 에러 메시지 */}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 생성된 이미지 표시 */}
      {generatedImage && (
        <Card sx={{ backgroundColor: 'var(--color-card-bg)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                생성된 씬 이미지
              </Typography>
              
                             <Box sx={{ display: 'flex', gap: 1 }}>
                 <Chip 
                   label="DALL·E 3" 
                   size="small" 
                   color="primary"
                   icon={<Info />}
                 />
                <Chip 
                  label={selectedStyle} 
                  size="small" 
                  color="primary"
                />
              </Box>
            </Box>

            {/* 이미지 */}
            <CardMedia
              component="img"
              image={generatedImage.imageUrl}
              alt="생성된 씬 이미지"
              sx={{
                borderRadius: 2,
                mb: 2,
                maxHeight: 400,
                objectFit: 'contain'
              }}
            />

            {/* 프롬프트 정보 */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              <strong>사용된 프롬프트:</strong> {generatedImage.prompt}
            </Typography>

            {/* 액션 버튼들 */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={handleDownloadImage}
                sx={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}
              >
                다운로드
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleRegenerateImage}
                disabled={isGenerating}
                sx={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
              >
                재생성
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}

export default SceneImageGenerator 