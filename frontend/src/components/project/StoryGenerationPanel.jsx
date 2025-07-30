import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Grid,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  LinearProgress
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  Star,
  StarBorder,
  ContentCopy,
  Settings,
  AutoAwesome,
  Refresh,
  Save,
  PlayArrow,
  Stop
} from '@mui/icons-material'

import { 
  genreTemplates, 
  lengthPresets, 
  customTemplates,
  getRecommendedTemplates 
} from '../../data/storyTemplates'
import { 
  generateStory, 
  checkStoryGenerationStatus, 
  cancelStoryGeneration,
  updateStory
} from '../../services/projectApi'
import { useStoryStore } from '../../stores/storyStore'
import { useProjectStore } from '../../stores/projectStore'
import toast from 'react-hot-toast'

/**
 * 스토리 생성 패널 컴포넌트
 * 템플릿 선택, 스토리 생성, 결과 표시를 통합한 패널
 */
const StoryGenerationPanel = ({ 
  projectId,
  synopsis = '',
  onStoryGenerated,
  onStoryUpdated
}) => {
  // 스토어
  const storyStore = useStoryStore()
  const projectStore = useProjectStore()
  
  const {
    templateSelection,
    updateTemplateSelection,
    generationStatus,
    generatedStory,
    isGenerating,
    generationError,
    storySettings
  } = storyStore

  // 로컬 상태
  const [activeTab, setActiveTab] = useState(0)
  const [showCustomDialog, setShowCustomDialog] = useState(false)
  const [customTemplatesList, setCustomTemplatesList] = useState([])
  const [recommendedTemplates, setRecommendedTemplates] = useState([])
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    prompt: '',
    settings: {
      maxLength: 600,
      focus: ''
    }
  })
  const [generationProgress, setGenerationProgress] = useState(0)
  const [statusCheckInterval, setStatusCheckInterval] = useState(null)

  // 컴포넌트 마운트 시 사용자 템플릿 로드
  useEffect(() => {
    const templates = customTemplates.get()
    setCustomTemplatesList(templates)
  }, [])

  // 시놉시스 변경 시 추천 템플릿 업데이트
  useEffect(() => {
    if (synopsis.trim()) {
      const recommendations = getRecommendedTemplates(synopsis)
      setRecommendedTemplates(recommendations)
    } else {
      setRecommendedTemplates([])
    }
  }, [synopsis])

  // 생성 상태 모니터링
  useEffect(() => {
    if (isGenerating && projectId) {
      const interval = setInterval(async () => {
        try {
          const status = await checkStoryGenerationStatus(projectId)
          if (status.success) {
            setGenerationProgress(status.data.progress || 0)
            
            if (status.data.status === 'completed') {
              clearInterval(interval)
              setStatusCheckInterval(null)
              storyStore.setGeneratedStory(status.data.story)
              storyStore.setIsGenerating(false)
              onStoryGenerated?.(status.data.story)
              toast.success('스토리 생성이 완료되었습니다.')
            } else if (status.data.status === 'failed') {
              clearInterval(interval)
              setStatusCheckInterval(null)
              storyStore.setIsGenerating(false)
              storyStore.setGenerationError(status.data.error || '스토리 생성에 실패했습니다.')
              toast.error('스토리 생성에 실패했습니다.')
            }
          }
        } catch (error) {
          console.error('스토리 생성 상태 확인 실패:', error)
        }
      }, 2000)
      
      setStatusCheckInterval(interval)
    }

    return () => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval)
      }
    }
  }, [isGenerating, projectId])

  // 템플릿 선택 핸들러
  const handleTemplateSelect = (template) => {
    updateTemplateSelection({
      selectedGenre: template.genre,
      selectedLength: template.length,
      selectedTemplate: template.id,
      settings: {
        ...template.settings,
        maxLength: template.length || 600
      }
    })
    
    toast.success(`${template.name} 템플릿이 선택되었습니다.`)
  }

  // 길이 프리셋 선택 핸들러
  const handleLengthSelect = (lengthKey) => {
    const lengthPreset = lengthPresets[lengthKey]
    updateTemplateSelection({
      ...templateSelection,
      selectedLength: lengthKey,
      settings: {
        ...templateSelection.settings,
        maxLength: lengthPreset.maxLength
      }
    })
    
    toast.success(`${lengthPreset.name} 길이가 설정되었습니다.`)
  }

  // 탭 변경 핸들러
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
  }

  // 사용자 템플릿 추가
  const handleAddCustomTemplate = () => {
    if (!newTemplate.name.trim() || !newTemplate.prompt.trim()) {
      toast.error('템플릿 이름과 프롬프트를 입력해주세요.')
      return
    }

    const template = {
      id: `custom_${Date.now()}`,
      name: newTemplate.name,
      description: newTemplate.description,
      prompt: newTemplate.prompt,
      settings: newTemplate.settings,
      isCustom: true
    }

    customTemplates.add(template)
    setCustomTemplatesList(customTemplates.get())
    setNewTemplate({
      name: '',
      description: '',
      prompt: '',
      settings: {
        maxLength: 600,
        focus: ''
      }
    })
    setShowCustomDialog(false)
    
    toast.success('사용자 템플릿이 추가되었습니다.')
  }

  // 사용자 템플릿 삭제
  const handleDeleteCustomTemplate = (templateId) => {
    customTemplates.remove(templateId)
    setCustomTemplatesList(customTemplates.get())
    toast.success('템플릿이 삭제되었습니다.')
  }

  // 템플릿 복사
  const handleCopyTemplate = async (template) => {
    try {
      await navigator.clipboard.writeText(template.prompt)
      toast.success('템플릿이 클립보드에 복사되었습니다.')
    } catch (error) {
      toast.error('클립보드 복사에 실패했습니다.')
    }
  }

  // 스토리 생성 시작
  const handleStartGeneration = async () => {
    if (!templateSelection.selectedTemplate) {
      toast.error('템플릿을 선택해주세요.')
      return
    }

    if (!synopsis.trim()) {
      toast.error('시놉시스를 입력해주세요.')
      return
    }

    if (!projectId) {
      toast.error('프로젝트 ID가 필요합니다.')
      return
    }

    try {
      storyStore.setIsGenerating(true)
      storyStore.setGenerationError('')
      setGenerationProgress(0)

      const result = await generateStory(projectId, {
        synopsis: synopsis.trim(),
        template: templateSelection.selectedTemplate,
        settings: {
          ...templateSelection.settings,
          ...storySettings
        }
      })

      if (!result.success) {
        storyStore.setIsGenerating(false)
        storyStore.setGenerationError(result.error || '스토리 생성에 실패했습니다.')
        toast.error(result.error || '스토리 생성에 실패했습니다.')
      } else {
        toast.success('스토리 생성이 시작되었습니다.')
      }
    } catch (error) {
      console.error('스토리 생성 실패:', error)
      storyStore.setIsGenerating(false)
      storyStore.setGenerationError('스토리 생성 중 오류가 발생했습니다.')
      toast.error('스토리 생성 중 오류가 발생했습니다.')
    }
  }

  // 스토리 생성 중지
  const handleStopGeneration = async () => {
    if (!projectId) return

    try {
      await cancelStoryGeneration(projectId)
      storyStore.setIsGenerating(false)
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval)
        setStatusCheckInterval(null)
      }
      toast.success('스토리 생성이 중지되었습니다.')
    } catch (error) {
      console.error('스토리 생성 중지 실패:', error)
      toast.error('스토리 생성 중지에 실패했습니다.')
    }
  }

  // 스토리 저장
  const handleSaveStory = async () => {
    if (!generatedStory) {
      toast.error('저장할 스토리가 없습니다.')
      return
    }

    if (!projectId) {
      toast.error('프로젝트 ID가 필요합니다.')
      return
    }

    try {
      const result = await updateStory(projectId, generatedStory)
      
      if (result.success) {
        // 프로젝트 스토어 업데이트
        await projectStore.updateProject(projectId, { story: generatedStory })
        onStoryUpdated?.(generatedStory)
        toast.success('스토리가 저장되었습니다.')
      } else {
        toast.error(result.error || '스토리 저장에 실패했습니다.')
      }
    } catch (error) {
      console.error('스토리 저장 실패:', error)
      toast.error('스토리 저장 중 오류가 발생했습니다.')
    }
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* 템플릿 선택 섹션 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          스토리 템플릿 선택
        </Typography>

        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="장르별 템플릿" />
          <Tab label="길이 프리셋" />
          <Tab label="추천 템플릿" />
          <Tab label="사용자 템플릿" />
        </Tabs>

        {/* 장르별 템플릿 */}
        {activeTab === 0 && (
          <Grid container spacing={2}>
            {Object.entries(genreTemplates).map(([genre, templates]) => (
              <Grid item xs={12} sm={6} md={4} key={genre}>
                <Card 
                  variant="outlined"
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { borderColor: 'primary.main' }
                  }}
                  onClick={() => handleTemplateSelect(templates[0])}
                >
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      {genre}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {templates.length}개의 템플릿
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* 길이 프리셋 */}
        {activeTab === 1 && (
          <Grid container spacing={2}>
            {Object.entries(lengthPresets).map(([key, preset]) => (
              <Grid item xs={12} sm={6} md={4} key={key}>
                <Card 
                  variant="outlined"
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { borderColor: 'primary.main' }
                  }}
                  onClick={() => handleLengthSelect(key)}
                >
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      {preset.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {preset.maxLength}자
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* 추천 템플릿 */}
        {activeTab === 2 && (
          <Grid container spacing={2}>
            {recommendedTemplates.map((template) => (
              <Grid item xs={12} sm={6} md={4} key={template.id}>
                <Card 
                  variant="outlined"
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { borderColor: 'primary.main' }
                  }}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      {template.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {template.description}
                    </Typography>
                    <Chip 
                      label={template.genre} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* 사용자 템플릿 */}
        {activeTab === 3 && (
          <Box>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => setShowCustomDialog(true)}
              sx={{ mb: 2 }}
            >
              새 템플릿 추가
            </Button>
            
            <Grid container spacing={2}>
              {customTemplatesList.map((template) => (
                <Grid item xs={12} sm={6} md={4} key={template.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        {template.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {template.description}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <IconButton 
                        size="small" 
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <PlayArrow />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleCopyTemplate(template)}
                      >
                        <ContentCopy />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleDeleteCustomTemplate(template.id)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Paper>

      {/* 스토리 생성 컨트롤 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          스토리 생성
        </Typography>

        {/* 생성 진행률 표시 */}
        {isGenerating && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              생성 진행률: {generationProgress}%
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={generationProgress} 
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        )}

        {/* 에러 메시지 */}
        {generationError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {generationError}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            variant="contained"
            startIcon={isGenerating ? <CircularProgress size={20} /> : <AutoAwesome />}
            onClick={handleStartGeneration}
            disabled={isGenerating || !templateSelection.selectedTemplate}
            sx={{
              background: 'var(--color-accent)',
              '&:hover': {
                background: 'var(--color-accent-hover)'
              }
            }}
          >
            {isGenerating ? '생성 중...' : '스토리 생성'}
          </Button>

          {isGenerating && (
            <Button
              variant="outlined"
              startIcon={<Stop />}
              onClick={handleStopGeneration}
              color="error"
            >
              중지
            </Button>
          )}

          {generatedStory && (
            <Button
              variant="outlined"
              startIcon={<Save />}
              onClick={handleSaveStory}
            >
              저장
            </Button>
          )}
        </Box>

        {templateSelection.selectedTemplate && (
          <Alert severity="info" sx={{ mt: 2 }}>
            선택된 템플릿: {templateSelection.selectedTemplate}
            {templateSelection.selectedLength && ` (${templateSelection.selectedLength})`}
          </Alert>
        )}
      </Paper>

      {/* 생성된 스토리 표시 */}
      {generatedStory && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            생성된 스토리
          </Typography>
          
          <TextField
            fullWidth
            multiline
            rows={12}
            value={generatedStory}
            InputProps={{
              readOnly: true
            }}
            sx={{ mb: 2 }}
          />
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ContentCopy />}
              onClick={() => navigator.clipboard.writeText(generatedStory)}
            >
              복사
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveStory}
              startIcon={<Save />}
            >
              저장
            </Button>
          </Box>
        </Paper>
      )}

      {/* 사용자 템플릿 추가 다이얼로그 */}
      <Dialog
        open={showCustomDialog}
        onClose={() => setShowCustomDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>새 템플릿 추가</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="템플릿 이름"
            value={newTemplate.name}
            onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="설명"
            value={newTemplate.description}
            onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={6}
            label="프롬프트"
            value={newTemplate.prompt}
            onChange={(e) => setNewTemplate(prev => ({ ...prev, prompt: e.target.value }))}
            helperText="스토리 생성을 위한 AI 프롬프트를 작성해주세요"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCustomDialog(false)}>
            취소
          </Button>
          <Button onClick={handleAddCustomTemplate} variant="contained">
            추가
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default StoryGenerationPanel 