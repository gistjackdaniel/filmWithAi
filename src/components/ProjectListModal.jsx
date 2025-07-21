import { 
  Box, 
  Typography, 
  Modal,
  Button,
  IconButton,
  Card,
  CardContent,
  Grid,
  Chip
} from '@mui/material'
import { 
  Close,
  LocationOn,
  Schedule
} from '@mui/icons-material'

/**
 * 프로젝트 목록 선택 모달 컴포넌트
 * 여러 프로젝트 중에서 선택할 수 있는 모달
 */
const ProjectListModal = ({ 
  open, 
  onClose, 
  projects = [],
  onSelectProject,
  actionType = 'location' // 'location' 또는 'schedule'
}) => {
  const getActionIcon = () => {
    switch (actionType) {
      case 'location':
        return <LocationOn />
      case 'schedule':
        return <Schedule />
      default:
        return <LocationOn />
    }
  }

  const getActionTitle = () => {
    switch (actionType) {
      case 'location':
        return '위치 관리'
      case 'schedule':
        return '스케줄 보기'
      default:
        return '위치 관리'
    }
  }

  const getActionDescription = () => {
    switch (actionType) {
      case 'location':
        return '가상장소와 실제 촬영 장소를 관리할 프로젝트를 선택하세요.'
      case 'schedule':
        return '촬영 스케줄을 확인할 프로젝트를 선택하세요.'
      default:
        return '프로젝트를 선택하세요.'
    }
  }

  const handleProjectSelect = (project) => {
    onSelectProject(project)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="project-list-modal"
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
        maxHeight: '80vh',
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getActionIcon()}
            <Typography variant="h5" component="h2">
              {getActionTitle()}
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </Box>

        {/* 모달 내용 */}
        <Box sx={{ p: 4, maxHeight: '60vh', overflowY: 'auto' }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
            {getActionDescription()}
          </Typography>
          
          {projects.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                프로젝트가 없습니다
              </Typography>
              <Typography variant="body2" color="text.secondary">
                먼저 프로젝트를 생성해주세요.
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {projects.map((project) => (
                <Grid item xs={12} sm={6} md={4} key={project._id || project.id}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { 
                        transform: 'translateY(-2px)', 
                        transition: '0.2s',
                        boxShadow: 3
                      }
                    }}
                    onClick={() => handleProjectSelect(project)}
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {project.projectTitle || '제목 없음'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {project.synopsis?.substring(0, 80) || '설명 없음'}...
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(project.updatedAt || project.createdAt).toLocaleDateString('ko-KR')}
                        </Typography>
                        <Chip 
                          label={project.status || '진행중'} 
                          size="small" 
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        {/* 모달 푸터 */}
        <Box sx={{
          p: 3,
          borderTop: '1px solid #ddd',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 2
        }}>
          <Button onClick={onClose} variant="outlined">
            취소
          </Button>
        </Box>
      </Box>
    </Modal>
  )
}

export default ProjectListModal 