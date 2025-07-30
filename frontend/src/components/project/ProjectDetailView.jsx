import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Grid,
  Tabs,
  Tab,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Divider,
  Card,
  CardContent,
  CardActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import {
  Edit,
  Delete,
  Share,
  Visibility,
  VisibilityOff,
  AutoAwesome,
  Timeline,
  Settings,
  Save,
  Refresh
} from '@mui/icons-material'
import { 
  updateProject, 
  deleteProject as deleteProjectApi,
  shareStory 
} from '../../services/projectApi'
import { useProjectStore } from '../../stores/projectStore'
import StoryGenerationPanel from './StoryGenerationPanel'
import StoryQualityEnhancer from './StoryQualityEnhancer'
import StoryHistoryPanel from './StoryHistoryPanel'
import LoadingSpinner from './LoadingSpinner'
import SynopsisInputForm from './SynopsisInputForm'
import StoryResult from './StoryResult'
import { ProjectStatus } from '../../types/project'
import toast from 'react-hot-toast'

/**
 * 프로젝트 상세 뷰 컴포넌트
 * 프로젝트 정보 표시, 스토리 생성, 편집 기능을 통합
 */
const ProjectDetailView = ({ 
  project,
  onProjectUpdate,
  onProjectDelete,
  onStoryGenerated,
  onNavigateToTimeline
}) => {
  // 프로젝트 스토어
  const { updateProject: updateProjectStore, isUpdating, updateError } = useProjectStore()
  
  // 로컬 상태
  const [activeTab, setActiveTab] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [editedProject, setEditedProject] = useState(project)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [shareLink, setShareLink] = useState('')

  // 프로젝트 데이터 동기화
  useEffect(() => {
    setEditedProject(project)
  }, [project])

  // 탭 변경 핸들러
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
  }

  // 편집 모드 토글
  const handleEditToggle = async () => {
    if (isEditing) {
      // 편집 완료 - 백엔드 API 호출
      try {
        const result = await updateProject(project._id, editedProject)
        
        if (result.success) {
          // 스토어 업데이트
          await updateProjectStore(project._id, result.data)
          onProjectUpdate?.(result.data)
          setIsEditing(false)
          toast.success('프로젝트가 업데이트되었습니다.')
        } else {
          toast.error(result.error || '프로젝트 업데이트에 실패했습니다.')
        }
      } catch (error) {
        console.error('프로젝트 업데이트 실패:', error)
        toast.error('프로젝트 업데이트 중 오류가 발생했습니다.')
      }
    } else {
      setIsEditing(true)
    }
  }

  // 편집 취소
  const handleEditCancel = () => {
    setEditedProject(project)
    setIsEditing(false)
  }

  // 입력 필드 변경 핸들러
  const handleInputChange = (field, value) => {
    setEditedProject(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // 프로젝트 삭제 확인
  const handleDeleteConfirm = async () => {
    try {
      const result = await deleteProjectApi(project._id)
      
      if (result.success) {
        onProjectDelete?.(project._id)
        setShowDeleteDialog(false)
        toast.success('프로젝트가 삭제되었습니다.')
      } else {
        toast.error(result.error || '프로젝트 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('프로젝트 삭제 실패:', error)
      toast.error('프로젝트 삭제 중 오류가 발생했습니다.')
    }
  }

  // 스토리 생성 완료 핸들러
  const handleStoryGenerated = (story) => {
    const updatedProject = {
      ...project,
      story: story,
      status: ProjectStatus.STORY_READY
    }
    onProjectUpdate?.(updatedProject)
    onStoryGenerated?.(story)
  }

  // 타임라인으로 이동
  const handleNavigateToTimeline = () => {
    onNavigateToTimeline?.(project._id)
  }

  // 프로젝트 공유
  const handleShareProject = async () => {
    try {
      const result = await shareStory(project._id, {
        shareType: 'public',
        recipients: []
      })
      
      if (result.success) {
        setShareLink(result.data.shareLink || `${window.location.origin}/project/${project._id}`)
        setShowShareDialog(true)
      } else {
        toast.error(result.error || '프로젝트 공유에 실패했습니다.')
      }
    } catch (error) {
      console.error('프로젝트 공유 실패:', error)
      toast.error('프로젝트 공유 중 오류가 발생했습니다.')
    }
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* 프로젝트 헤더 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
              {project.title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Chip 
                label={project.genre?.[0] || '일반'} 
                color="primary" 
                variant="outlined"
                size="small"
              />
              <Chip 
                label={project.estimatedDuration} 
                color="secondary" 
                variant="outlined"
                size="small"
              />
              <Chip 
                label={project.isPublic ? '공개' : '비공개'} 
                color={project.isPublic ? 'success' : 'default'} 
                variant="outlined"
                size="small"
              />
              <Chip 
                label={ProjectStatus[project.status] || project.status} 
                color="info" 
                variant="outlined"
                size="small"
              />
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={handleEditToggle} disabled={isUpdating}>
              <Edit />
            </IconButton>
            <IconButton onClick={handleShareProject}>
              <Share />
            </IconButton>
            <IconButton onClick={() => setShowDeleteDialog(true)} color="error">
              <Delete />
            </IconButton>
          </Box>
        </Box>

        {/* 프로젝트 메타데이터 */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              생성일: {new Date(project.createdAt).toLocaleDateString()}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              수정일: {new Date(project.updatedAt).toLocaleDateString()}
            </Typography>
          </Grid>
        </Grid>

        {/* 태그 */}
        {project.tags && project.tags.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              태그:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {project.tags.map((tag, index) => (
                <Chip key={index} label={tag} size="small" variant="outlined" />
              ))}
            </Box>
          </Box>
        )}

        {/* 업데이트 에러 메시지 */}
        {updateError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {updateError}
          </Alert>
        )}
      </Paper>

      {/* 탭 네비게이션 */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="시놉시스" />
          <Tab label="스토리" />
          <Tab label="스토리 생성" />
          <Tab label="품질 개선" />
          <Tab label="히스토리" />
          <Tab label="결과" />
          <Tab label="설정" />
        </Tabs>
      </Paper>

      {/* 탭 컨텐츠 */}
      {activeTab === 0 && (
        <SynopsisInputForm
          projectId={project._id}
          initialSynopsis={project.synopsis || ''}
          onSubmit={(synopsis) => {
            setEditedProject({ ...editedProject, synopsis })
            handleEditToggle()
          }}
          onSynopsisChange={(synopsis) => {
            setEditedProject({ ...editedProject, synopsis })
          }}
          isGenerating={false}
        />
      )}

      {activeTab === 1 && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              스토리
            </Typography>
            {project.story && (
              <Button
                variant="outlined"
                startIcon={<Timeline />}
                onClick={handleNavigateToTimeline}
              >
                타임라인으로 이동
              </Button>
            )}
          </Box>
          
          {isGenerating ? (
            <LoadingSpinner 
              message="AI가 스토리를 생성하고 있습니다..."
              progress={50}
              showProgress={true}
              steps={['분석', '구성', '생성', '완료']}
              currentStep={2}
            />
          ) : project.story ? (
            isEditing ? (
              <TextField
                fullWidth
                multiline
                rows={12}
                value={editedProject.story}
                onChange={(e) => handleInputChange('story', e.target.value)}
                label="스토리"
              />
            ) : (
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {project.story}
              </Typography>
            )
          ) : (
            <Alert severity="info">
              아직 스토리가 생성되지 않았습니다. "스토리 생성" 탭에서 AI를 사용하여 스토리를 생성해보세요.
            </Alert>
          )}
        </Paper>
      )}

      {activeTab === 2 && (
        <StoryGenerationPanel
          projectId={project._id}
          synopsis={project.synopsis}
          onStoryGenerated={handleStoryGenerated}
        />
      )}

      {activeTab === 3 && (
        <StoryQualityEnhancer
          projectId={project._id}
          currentStory={project.story}
          onStoryUpdated={onStoryGenerated}
          isGenerating={false}
        />
      )}

      {activeTab === 4 && (
        <StoryHistoryPanel
          projectId={project._id}
          onSelectHistory={(history) => console.log('Selected history:', history)}
          onReuseHistory={(history) => {
            // 히스토리 재사용 시 프로젝트 업데이트
            const updatedProject = {
              ...project,
              synopsis: history.synopsis,
              story: history.story
            }
            onProjectUpdate?.(updatedProject)
          }}
        />
      )}

      {activeTab === 5 && (
        <StoryResult
          projectId={project._id}
          story={project.story}
          onSave={handleStoryGenerated}
          onRegenerate={() => {
            // 스토리 재생성 로직
            console.log('스토리 재생성')
          }}
          isGenerating={false}
        />
      )}

      {activeTab === 6 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            프로젝트 설정
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="프로젝트 제목"
                value={isEditing ? editedProject.title : project.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                disabled={!isEditing}
                sx={{ mb: 2 }}
              />
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>장르</InputLabel>
                <Select
                  value={isEditing ? (editedProject.genre?.[0] || '일반') : (project.genre?.[0] || '일반')}
                  onChange={(e) => handleInputChange('genre', [e.target.value])}
                  disabled={!isEditing}
                  label="장르"
                >
                  <MenuItem value="일반">일반</MenuItem>
                  <MenuItem value="액션">액션</MenuItem>
                  <MenuItem value="드라마">드라마</MenuItem>
                  <MenuItem value="코미디">코미디</MenuItem>
                  <MenuItem value="로맨스">로맨스</MenuItem>
                  <MenuItem value="스릴러">스릴러</MenuItem>
                  <MenuItem value="호러">호러</MenuItem>
                  <MenuItem value="SF">SF</MenuItem>
                  <MenuItem value="판타지">판타지</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>예상 지속시간</InputLabel>
                <Select
                  value={isEditing ? editedProject.estimatedDuration : project.estimatedDuration}
                  onChange={(e) => handleInputChange('estimatedDuration', e.target.value)}
                  disabled={!isEditing}
                  label="예상 지속시간"
                >
                  <MenuItem value="30분">30분</MenuItem>
                  <MenuItem value="60분">60분</MenuItem>
                  <MenuItem value="90분">90분</MenuItem>
                  <MenuItem value="120분">120분</MenuItem>
                  <MenuItem value="150분">150분</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Button
                  variant={isEditing ? (editedProject.isPublic ? 'contained' : 'outlined') : (project.isPublic ? 'contained' : 'outlined')}
                  onClick={() => handleInputChange('isPublic', !(isEditing ? editedProject.isPublic : project.isPublic))}
                  disabled={!isEditing}
                  startIcon={isEditing ? (editedProject.isPublic ? <Visibility /> : <VisibilityOff />) : (project.isPublic ? <Visibility /> : <VisibilityOff />)}
                >
                  {isEditing ? (editedProject.isPublic ? '공개' : '비공개') : (project.isPublic ? '공개' : '비공개')}
                </Button>
                <Typography variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
                  {isEditing ? (editedProject.isPublic ? '다른 사용자들이 볼 수 있습니다' : '나만 볼 수 있습니다') : (project.isPublic ? '다른 사용자들이 볼 수 있습니다' : '나만 볼 수 있습니다')}
                </Typography>
              </Box>
            </Grid>
          </Grid>
          
          {isEditing && (
            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button onClick={handleEditCancel}>
                취소
              </Button>
              <Button
                variant="contained"
                onClick={handleEditToggle}
                startIcon={<Save />}
                disabled={isUpdating}
              >
                {isUpdating ? '저장 중...' : '저장'}
              </Button>
            </Box>
          )}
        </Paper>
      )}

      {/* 삭제 확인 다이얼로그 */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
      >
        <DialogTitle>프로젝트 삭제</DialogTitle>
        <DialogContent>
          <Typography>
            정말로 "{project.title}" 프로젝트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>
            취소
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            삭제
          </Button>
        </DialogActions>
      </Dialog>

      {/* 공유 다이얼로그 */}
      <Dialog
        open={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>프로젝트 공유</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            이 프로젝트를 다른 사람과 공유하시겠습니까?
          </Typography>
          <TextField
            fullWidth
            label="공유 링크"
            value={shareLink}
            InputProps={{
              readOnly: true
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowShareDialog(false)}>
            닫기
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              navigator.clipboard.writeText(shareLink)
              setShowShareDialog(false)
              toast.success('링크가 클립보드에 복사되었습니다.')
            }}
          >
            링크 복사
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ProjectDetailView 