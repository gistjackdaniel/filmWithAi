import { useState, useEffect } from 'react'
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
  Alert
} from '@mui/material'
import { 
  Add,
  Edit,
  Delete,
  Star,
  StarBorder,
  ContentCopy,
  Settings
} from '@mui/icons-material'
import { 
  genreTemplates, 
  lengthPresets, 
  tonePresets, 
  customTemplates,
  getRecommendedTemplates 
} from '../../data/storyTemplates'
import useStoryGenerationStore from '../../stores/storyGenerationStore'
import toast from 'react-hot-toast'

/**
 * 스토리 템플릿 선택 컴포넌트
 * 장르별 템플릿, 길이 프리셋, 톤 프리셋, 사용자 정의 템플릿 선택 기능
 * PRD 2.1.2 AI 스토리 생성 기능의 템플릿 시스템
 */
const TemplateSelector = ({ 
  synopsis = '', 
  onTemplateSelect, 
  onSettingsChange,
  currentSettings = {},
  templateSelection = {},
  onTemplateSelectionChange
}) => {
  // Zustand 스토어에서 상태 가져오기 (props가 없으면 스토어 사용)
  const store = useStoryGenerationStore()
  const {
    templateSelection: storeTemplateSelection,
    updateTemplateSelection
  } = store

  // props 또는 스토어에서 상태 가져오기
  const finalTemplateSelection = templateSelection.selectedGenre ? templateSelection : storeTemplateSelection
  const finalUpdateTemplateSelection = onTemplateSelectionChange || updateTemplateSelection

  // 로컬 상태 관리 (스토어에 없는 UI 전용 상태)
  const [showCustomDialog, setShowCustomDialog] = useState(false) // 사용자 템플릿 다이얼로그
  const [customTemplatesList, setCustomTemplatesList] = useState([]) // 사용자 템플릿 목록
  const [newTemplate, setNewTemplate] = useState({ // 새 템플릿 데이터
    name: '',
    description: '',
    prompt: '',
    settings: {
      maxLength: 600,
      tone: '',
      focus: ''
    }
  })

  // 추천 템플릿
  const [recommendedTemplates, setRecommendedTemplates] = useState([])

  /**
   * 컴포넌트 마운트 시 사용자 템플릿 로드
   */
  useEffect(() => {
    const templates = customTemplates.get()
    setCustomTemplatesList(templates)
  }, [])

  /**
   * 시놉시스 변경 시 추천 템플릿 업데이트
   */
  useEffect(() => {
    if (synopsis.trim()) {
      const recommendations = getRecommendedTemplates(synopsis)
      setRecommendedTemplates(recommendations)
    } else {
      setRecommendedTemplates([])
    }
  }, [synopsis])

  /**
   * 템플릿 선택 핸들러
   * @param {Object} template - 선택된 템플릿
   */
  const handleTemplateSelect = (template) => {
    // 스토어 상태 업데이트
    finalUpdateTemplateSelection({
      selectedGenre: template.key || '',
      activeTab: 0
    })
    
    // 설정 업데이트
    const newSettings = {
      ...currentSettings,
      genre: template.key,
      maxLength: template.settings?.maxLength || 600,
      tone: template.settings?.tone || '',
      focus: template.settings?.focus || ''
    }
    
    onSettingsChange(newSettings)
    onTemplateSelect(template)
    
    // toast 제거 - 부모 컴포넌트에서 처리
  }

  /**
   * 길이 프리셋 선택 핸들러
   * @param {string} lengthKey - 선택된 길이 키
   */
  const handleLengthSelect = (lengthKey) => {
    // 스토어 상태 업데이트
    finalUpdateTemplateSelection({
      selectedLength: lengthKey,
      activeTab: 1
    })
    
    const preset = lengthPresets[lengthKey]
    
    const newSettings = {
      ...currentSettings,
      maxLength: preset.maxLength
    }
    
    onSettingsChange(newSettings)
    // toast 제거 - 부모 컴포넌트에서 처리
  }

  /**
   * 톤 프리셋 선택 핸들러
   * @param {string} toneKey - 선택된 톤 키
   */
  const handleToneSelect = (toneKey) => {
    // 스토어 상태 업데이트
    finalUpdateTemplateSelection({
      selectedTone: toneKey,
      activeTab: 2
    })
    
    const preset = tonePresets[toneKey]
    
    const newSettings = {
      ...currentSettings,
      tone: preset.name
    }
    
    onSettingsChange(newSettings)
    // toast 제거 - 부모 컴포넌트에서 처리
  }

  /**
   * 탭 변경 핸들러
   * @param {number} newValue - 새로운 탭 인덱스
   */
  const handleTabChange = (event, newValue) => {
    finalUpdateTemplateSelection({
      activeTab: newValue
    })
  }

  /**
   * 사용자 템플릿 추가 핸들러
   */
  const handleAddCustomTemplate = () => {
    if (!newTemplate.name || !newTemplate.prompt) {
      toast.error('템플릿 이름과 프롬프트를 입력해주세요.')
      return
    }

    const success = customTemplates.add(newTemplate)
    if (success) {
      setCustomTemplatesList(customTemplates.get())
      setNewTemplate({
        name: '',
        description: '',
        prompt: '',
        settings: {
          maxLength: 600,
          tone: '',
          focus: ''
        }
      })
      setShowCustomDialog(false)
      toast.success('사용자 템플릿이 추가되었습니다.')
    } else {
      toast.error('템플릿 추가에 실패했습니다.')
    }
  }

  /**
   * 사용자 템플릿 삭제 핸들러
   * @param {string} templateId - 삭제할 템플릿 ID
   */
  const handleDeleteCustomTemplate = (templateId) => {
    const success = customTemplates.remove(templateId)
    if (success) {
      setCustomTemplatesList(customTemplates.get())
      toast.success('템플릿이 삭제되었습니다.')
    } else {
      toast.error('템플릿 삭제에 실패했습니다.')
    }
  }

  /**
   * 템플릿 복사 핸들러
   * @param {Object} template - 복사할 템플릿
   */
  const handleCopyTemplate = async (template) => {
    try {
      await navigator.clipboard.writeText(template.prompt)
      toast.success('템플릿이 클립보드에 복사되었습니다.')
    } catch (error) {
      toast.error('템플릿 복사에 실패했습니다.')
    }
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* 추천 템플릿 표시 */}
      {recommendedTemplates.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            💡 추천 템플릿
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            시놉시스 내용을 바탕으로 추천하는 템플릿입니다.
          </Typography>
          <Grid container spacing={2}>
            {recommendedTemplates.map((template, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    border: finalTemplateSelection.selectedGenre === template.key ? '2px solid var(--color-accent)' : '1px solid #444',
                    '&:hover': {
                      borderColor: 'var(--color-accent)',
                      backgroundColor: 'rgba(212, 175, 55, 0.1)'
                    }
                  }}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {template.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {template.description}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Chip 
                        label={`${template.settings?.maxLength}자`} 
                        size="small" 
                        sx={{ mr: 1 }}
                      />
                      <Chip 
                        label={template.settings?.tone} 
                        size="small" 
                        variant="outlined"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* 탭 네비게이션 */}
      <Tabs 
        value={finalTemplateSelection.activeTab} 
        onChange={handleTabChange}
        sx={{ mb: 3 }}
      >
        <Tab label="장르 템플릿" />
        <Tab label="길이 설정" />
        <Tab label="톤 설정" />
        <Tab label="사용자 템플릿" />
      </Tabs>

      {/* 장르 템플릿 탭 */}
      {finalTemplateSelection.activeTab === 0 && (
        <Grid container spacing={2}>
          {Object.entries(genreTemplates).map(([key, template]) => (
            <Grid item xs={12} sm={6} md={4} key={key}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  border: finalTemplateSelection.selectedGenre === key ? '2px solid var(--color-accent)' : '1px solid #444',
                  '&:hover': {
                    borderColor: 'var(--color-accent)',
                    backgroundColor: 'rgba(212, 175, 55, 0.1)'
                  }
                }}
                onClick={() => handleTemplateSelect({ ...template, key })}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {template.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {template.description}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Chip 
                      label={`${template.settings?.maxLength}자`} 
                      size="small" 
                      sx={{ mr: 1 }}
                    />
                    <Chip 
                      label={template.settings?.tone} 
                      size="small" 
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
                <CardActions>
                  <Tooltip title="템플릿 복사">
                    <IconButton 
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCopyTemplate(template)
                      }}
                    >
                      <ContentCopy />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* 길이 설정 탭 */}
      {finalTemplateSelection.activeTab === 1 && (
        <Grid container spacing={2}>
          {Object.entries(lengthPresets).map(([key, preset]) => (
            <Grid item xs={12} sm={6} md={3} key={key}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  border: finalTemplateSelection.selectedLength === key ? '2px solid var(--color-accent)' : '1px solid #444',
                  '&:hover': {
                    borderColor: 'var(--color-accent)',
                    backgroundColor: 'rgba(212, 175, 55, 0.1)'
                  }
                }}
                onClick={() => handleLengthSelect(key)}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {preset.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {preset.description}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Chip 
                      label={`${preset.maxLength}자`} 
                      size="small" 
                      sx={{ mr: 1 }}
                    />
                    <Chip 
                      label={preset.estimatedTime} 
                      size="small" 
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* 톤 설정 탭 */}
      {finalTemplateSelection.activeTab === 2 && (
        <Grid container spacing={2}>
          {Object.entries(tonePresets).map(([key, preset]) => (
            <Grid item xs={12} sm={6} md={4} key={key}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  border: finalTemplateSelection.selectedTone === key ? '2px solid var(--color-accent)' : '1px solid #444',
                  '&:hover': {
                    borderColor: 'var(--color-accent)',
                    backgroundColor: 'rgba(212, 175, 55, 0.1)'
                  }
                }}
                onClick={() => handleToneSelect(key)}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {preset.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {preset.description}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    {preset.keywords.map((keyword, index) => (
                      <Chip 
                        key={index}
                        label={keyword} 
                        size="small" 
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* 사용자 템플릿 탭 */}
      {finalTemplateSelection.activeTab === 3 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              사용자 정의 템플릿
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setShowCustomDialog(true)}
              sx={{
                backgroundColor: 'var(--color-primary)',
                '&:hover': { backgroundColor: 'var(--color-accent)' }
              }}
            >
              새 템플릿 추가
            </Button>
          </Box>

          {customTemplatesList.length === 0 ? (
            <Alert severity="info">
              아직 사용자 정의 템플릿이 없습니다. 새 템플릿을 추가해보세요.
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {customTemplatesList.map((template) => (
                <Grid item xs={12} sm={6} md={4} key={template.id}>
                  <Card sx={{ border: '1px solid #444' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {template.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {template.description}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Chip 
                          label={`${template.settings?.maxLength}자`} 
                          size="small" 
                          sx={{ mr: 1 }}
                        />
                        <Chip 
                          label={template.settings?.tone} 
                          size="small" 
                          variant="outlined"
                        />
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Tooltip title="템플릿 사용">
                        <Button
                          size="small"
                          onClick={() => handleTemplateSelect(template)}
                        >
                          사용
                        </Button>
                      </Tooltip>
                      <Tooltip title="템플릿 복사">
                        <IconButton size="small">
                          <ContentCopy />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="템플릿 삭제">
                        <IconButton 
                          size="small"
                          onClick={() => handleDeleteCustomTemplate(template.id)}
                          sx={{ color: 'var(--color-danger)' }}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* 사용자 템플릿 추가 다이얼로그 */}
      <Dialog
        open={showCustomDialog}
        onClose={() => setShowCustomDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          새 템플릿 추가
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="템플릿 이름"
              value={newTemplate.name}
              onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="설명"
              value={newTemplate.description}
              onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
            <TextField
              label="프롬프트"
              value={newTemplate.prompt}
              onChange={(e) => setNewTemplate({ ...newTemplate, prompt: e.target.value })}
              fullWidth
              multiline
              rows={8}
              placeholder="다음 시놉시스를 바탕으로 스토리를 작성해주세요...&#10;&#10;요구사항:&#10;- {maxLength}자로 작성&#10;- {tone} 톤으로 작성&#10;&#10;시놉시스: {synopsis}"
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>최대 길이</InputLabel>
                <Select
                  value={newTemplate.settings.maxLength}
                  onChange={(e) => setNewTemplate({
                    ...newTemplate,
                    settings: { ...newTemplate.settings, maxLength: e.target.value }
                  })}
                >
                  <MenuItem value={300}>300자 (짧은 스토리)</MenuItem>
                  <MenuItem value={600}>600자 (보통 스토리)</MenuItem>
                  <MenuItem value={1000}>1000자 (긴 스토리)</MenuItem>
                  <MenuItem value={1500}>1500자 (서사시)</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>톤</InputLabel>
                <Select
                  value={newTemplate.settings.tone}
                  onChange={(e) => setNewTemplate({
                    ...newTemplate,
                    settings: { ...newTemplate.settings, tone: e.target.value }
                  })}
                >
                  <MenuItem value="격식있는">격식있는</MenuItem>
                  <MenuItem value="친근한">친근한</MenuItem>
                  <MenuItem value="극적인">극적인</MenuItem>
                  <MenuItem value="시적인">시적인</MenuItem>
                  <MenuItem value="유머러스">유머러스</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCustomDialog(false)}>
            취소
          </Button>
          <Button
            variant="contained"
            onClick={handleAddCustomTemplate}
            sx={{
              backgroundColor: 'var(--color-primary)',
              '&:hover': { backgroundColor: 'var(--color-accent)' }
            }}
          >
            추가
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default TemplateSelector 