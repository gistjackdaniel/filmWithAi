import { 
  Box, 
  Typography, 
  Modal,
  Card,
  CardContent,
  Grid,
  Button,
  IconButton
} from '@mui/material'
import { 
  Close,
  Create,
  Movie,
  AutoFixHigh,
  ArrowForward
} from '@mui/icons-material'

/**
 * 프로젝트 선택 모달 컴포넌트
 * 새 프로젝트 생성 시 AI 스토리 생성과 콘티 생성 중 선택할 수 있는 모달
 */
const ProjectSelectionModal = ({ 
  open, 
  onClose, 
  onSelectStoryGeneration, 
  onSelectConteGeneration 
}) => {
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
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </Box>

        {/* 모달 내용 */}
        <Box sx={{ p: 4 }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
            어떤 방식으로 프로젝트를 시작하시겠습니까?
          </Typography>
          
          <Grid container spacing={3}>
            {/* AI 스토리 생성 옵션 */}
            <Grid item xs={12} md={6}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  height: '100%',
                  border: '2px solid transparent',
                  '&:hover': { 
                    transform: 'translateY(-4px)', 
                    transition: '0.3s',
                    borderColor: 'primary.main',
                    boxShadow: '0 8px 25px rgba(33, 150, 243, 0.3)'
                  }
                }}
                onClick={onSelectStoryGeneration}
              >
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <Box sx={{ 
                    width: 80, 
                    height: 80, 
                    borderRadius: '50%', 
                    bgcolor: 'primary.main', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 3
                  }}>
                    <AutoFixHigh sx={{ fontSize: 40, color: 'white' }} />
                  </Box>
                  
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                    AI 스토리 생성
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    시놉시스를 입력하면 AI가 자동으로 상세한 스토리를 생성합니다.
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      ✨ 시놉시스 기반 스토리 생성
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      🎭 다양한 장르와 스타일 지원
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      📝 품질 개선 및 편집 기능
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      🎬 콘티 생성으로 이어지는 워크플로우
                    </Typography>
                  </Box>
                  
                  <Button
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForward />}
                    sx={{ 
                      mt: 3,
                      px: 4,
                      py: 1.5,
                      borderRadius: 2,
                      background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #1976D2 30%, #1E88E5 90%)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 20px rgba(33, 150, 243, 0.4)'
                      }
                    }}
                  >
                    스토리 생성 시작
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* 콘티 생성 옵션 */}
            <Grid item xs={12} md={6}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  height: '100%',
                  border: '2px solid transparent',
                  '&:hover': { 
                    transform: 'translateY(-4px)', 
                    transition: '0.3s',
                    borderColor: 'success.main',
                    boxShadow: '0 8px 25px rgba(76, 175, 80, 0.3)'
                  }
                }}
                onClick={onSelectConteGeneration}
              >
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <Box sx={{ 
                    width: 80, 
                    height: 80, 
                    borderRadius: '50%', 
                    bgcolor: 'success.main', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 3
                  }}>
                    <Movie sx={{ fontSize: 40, color: 'white' }} />
                  </Box>
                  
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                    콘티 생성
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    직접 스토리를 작성하고 AI가 콘티를 자동으로 생성합니다.
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      ✍️ 직접 스토리 작성
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      🎬 AI 콘티 자동 생성
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      🖼️ 씬별 이미지 생성
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      ⏱️ 타임라인 시각화
                    </Typography>
                  </Box>
                  
                  <Button
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForward />}
                    sx={{ 
                      mt: 3,
                      px: 4,
                      py: 1.5,
                      borderRadius: 2,
                      background: 'linear-gradient(45deg, #4CAF50 30%, #66BB6A 90%)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #388E3C 30%, #43A047 90%)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)'
                      }
                    }}
                  >
                    콘티 생성 시작
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Modal>
  )
}

export default ProjectSelectionModal 