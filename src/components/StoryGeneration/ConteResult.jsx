import { useState } from 'react'
import { 
  Box, 
  Typography, 
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Skeleton,
  LinearProgress,
  Alert,
  Collapse
} from '@mui/material'
import { 
  ExpandMore,
  Movie,
  Videocam,
  Edit,
  Save,
  Refresh,
  LocationOn,
  Schedule,
  Person,
  Build,
  Lightbulb,
  WbSunny,
  AccessTime,
  Star,
  Info,
  Help,
  Timeline
} from '@mui/icons-material'
import toast from 'react-hot-toast'
import { CAPTION_CARD_TYPES, GRAPH_RELATIONSHIPS, groupCaptionCards } from '../../data/conteCardStructure'

/**
 * 생성된 캡션 카드 결과 표시 컴포넌트
 * 모든 캡션 카드 요소들과 키워드 노드를 상세하게 표시하는 기능
 * PRD 2.1.3 AI 콘티 생성 기능의 결과 표시 컴포넌트
 */
const ConteResult = ({ 
  conteList = [], 
  onEdit,
  onRegenerate,
  isGenerating = false,
  generatingImages = false,
  imageGenerationProgress = 0,
  onViewTimeline = null
}) => {
  // 로컬 상태 관리
  const [expandedScene, setExpandedScene] = useState(0) // 확장된 씬 인덱스
  const [groupBy, setGroupBy] = useState('none') // 그룹화 기준
  const [showTypeReason, setShowTypeReason] = useState({}) // 타입 분류 이유 표시 상태

  /**
   * 씬 확장/축소 핸들러
   * @param {number} sceneIndex - 씬 인덱스
   */
  const handleSceneExpand = (sceneIndex) => {
    setExpandedScene(expandedScene === sceneIndex ? -1 : sceneIndex)
  }

  /**
   * 캡션 카드 편집 핸들러
   * @param {number} sceneIndex - 편집할 씬 인덱스
   */
  const handleEditConte = (sceneIndex) => {
    console.log('🎬 ConteResult 편집 핸들러 호출:', { sceneIndex, onEdit: !!onEdit })
    if (onEdit) {
      console.log('✅ onEdit 함수 호출:', { card: conteList[sceneIndex], sceneIndex })
      onEdit(conteList[sceneIndex], sceneIndex)
    } else {
      console.error('❌ onEdit 함수가 없습니다!')
    }
    toast.success('캡션 카드 편집 모드로 전환되었습니다.')
  }

  /**
   * 캡션 카드 재생성 핸들러
   */
  const handleRegenerateConte = () => {
    if (onRegenerate) {
      onRegenerate()
    }
  }

  /**
   * 캡션 카드 저장 핸들러
   */
  const handleSaveConte = () => {
    // TODO: 캡션 카드 저장 API 연동
    toast.success('캡션 카드가 저장되었습니다.')
  }

  /**
   * 타입 분류 이유 토글 핸들러
   * @param {number} sceneIndex - 씬 인덱스
   */
  const handleToggleTypeReason = (sceneIndex) => {
    setShowTypeReason(prev => ({
      ...prev,
      [sceneIndex]: !prev[sceneIndex]
    }))
  }

  /**
   * 씬 타입에 따른 아이콘 반환
   * @param {string} type - 씬 타입
   * @returns {JSX.Element} 아이콘 컴포넌트
   */
  const getSceneTypeIcon = (type) => {
    switch (type) {
      case CAPTION_CARD_TYPES.GENERATED_VIDEO:
        return <Movie color="primary" />
      case CAPTION_CARD_TYPES.LIVE_ACTION:
        return <Videocam color="secondary" />
      default:
        return <Movie />
    }
  }

  /**
   * 씬 타입에 따른 라벨 반환
   * @param {string} type - 씬 타입
   * @returns {string} 라벨 텍스트
   */
  const getSceneTypeLabel = (type) => {
    switch (type) {
      case CAPTION_CARD_TYPES.GENERATED_VIDEO:
        return 'AI 생성 비디오'
      case CAPTION_CARD_TYPES.LIVE_ACTION:
        return '실사 촬영'
      default:
        return '미분류'
    }
  }

  /**
   * 씬 타입 분류 이유 분석 및 반환
   * @param {Object} card - 캡션 카드 데이터
   * @returns {Object} 분류 이유 정보
   */
  const analyzeTypeReason = (card) => {
    const reasons = {
      generated_video: [],
      live_action: []
    }

    // AI 생성 비디오로 분류되는 이유들
    if (card.visualEffects && (
      card.visualEffects.includes('AI') ||
      card.visualEffects.includes('CG') ||
      card.visualEffects.includes('특수효과')
    )) {
      reasons.generated_video.push('AI 시각효과나 특수효과가 포함된 장면')
    }
    
    if (card.visualDescription && (
      card.visualDescription.includes('환상') || 
      card.visualDescription.includes('초자연') ||
      card.visualDescription.includes('미래') ||
      card.visualDescription.includes('우주') ||
      card.visualDescription.includes('마법') ||
      card.visualDescription.includes('초능력') ||
      card.visualDescription.includes('시간여행')
    )) {
      reasons.generated_video.push('환상적이거나 초자연적인 요소가 포함된 장면')
    }
    
    if (card.description && (
      card.description.includes('특수효과') ||
      card.description.includes('CG') ||
      card.description.includes('애니메이션') ||
      card.description.includes('디지털')
    )) {
      reasons.generated_video.push('특수효과나 CG가 필요한 장면')
    }

    // 단순한 자연 풍경 장면 (AI 생성이 적합)
    if (card.visualDescription && (
      card.visualDescription.includes('하늘') ||
      card.visualDescription.includes('바다') ||
      card.visualDescription.includes('구름') ||
      card.visualDescription.includes('자연 풍경') ||
      card.visualDescription.includes('숲') ||
      card.visualDescription.includes('산')
    )) {
      reasons.generated_video.push('단순한 자연 풍경 장면 (AI 생성이 적합)')
    }

    // 실사 촬영으로 분류되는 이유들
    if (card.characterLayout && (
      card.characterLayout.includes('실제 배우') ||
      card.characterLayout.includes('배우') ||
      card.characterLayout.includes('연기')
    )) {
      reasons.live_action.push('실제 배우의 연기가 중요한 장면')
    }
    
    if (card.props && (
      card.props.includes('실제 소품') ||
      card.props.includes('물리적') ||
      card.props.includes('접촉')
    )) {
      reasons.live_action.push('실제 소품과 물리적 상호작용이 필요한 장면')
    }
    
    if (card.lighting && (
      card.lighting.includes('자연광') ||
      card.lighting.includes('실제 조명') ||
      card.lighting.includes('태양광') ||
      card.lighting.includes('실내 조명')
    )) {
      // 실내 장면 감지 (keywords.location만 사용하여 정확한 장소 정보 활용)
      const isIndoorScene = (
        (card.keywords && card.keywords.location && (
          card.keywords.location.includes('실내') ||
          card.keywords.location.includes('방') ||
          card.keywords.location.includes('건물') ||
          card.keywords.location.includes('집') ||
          card.keywords.location.includes('사무실') ||
          card.keywords.location.includes('카페') ||
          card.keywords.location.includes('레스토랑') ||
          card.keywords.location.includes('학교') ||
          card.keywords.location.includes('병원') ||
          card.keywords.location.includes('상점') ||
          card.keywords.location.includes('극장') ||
          card.keywords.location.includes('지하') ||
          card.keywords.location.includes('엘리베이터') ||
          card.keywords.location.includes('계단')
        ))
      )
      
      // 날씨 무관성 감지 (더 포괄적으로)
      const isWeatherIrrelevant = card.weather && (
        card.weather.includes('영향을 미치지 않음') ||
        card.weather.includes('관계없음') ||
        card.weather.includes('해당없음') ||
        card.weather.includes('실내') ||
        card.weather.includes('내부') ||
        card.weather.includes('조명으로 대체') ||
        card.weather.includes('인공 조명')
      )
      
      // 실내 장면이거나 날씨가 무관한 경우 제외
      if (!isIndoorScene && !isWeatherIrrelevant) {
        reasons.live_action.push('특정 날씨 조건이 필요한 장면')
      }
    }
    
    // 장소 정보는 keywords.location만 사용 (AI가 생성한 정확한 장소 정보)
    if (card.keywords && card.keywords.location && card.keywords.location !== '기본 장소') {
      reasons.live_action.push('특정 실제 장소에서 촬영이 필요한 장면')
    }

    // 감정 표현이나 인간적 상호작용이 중심인 장면
    if (card.description && (
      card.description.includes('감정') ||
      card.description.includes('대화') ||
      card.description.includes('표정') ||
      card.description.includes('눈물') ||
      card.description.includes('웃음')
    )) {
      reasons.live_action.push('실제 감정 표현이나 인간적 상호작용이 중심인 장면')
    }

    // 대사가 많은 장면은 실사 촬영이 적합
    if (card.dialogue && card.dialogue.length > 50) {
      reasons.live_action.push('대사가 많은 장면 (실제 배우의 연기가 필요)')
    }

    // 감정적 대사가 포함된 장면
    if (card.dialogue && (
      card.dialogue.includes('!') || 
      card.dialogue.includes('?') ||
      card.dialogue.includes('...') ||
      card.dialogue.includes('ㅠ') ||
      card.dialogue.includes('ㅜ')
    )) {
      reasons.live_action.push('감정적 대사가 포함된 장면')
    }

    // 기본 분류 이유 (분석 결과가 없는 경우)
    if (reasons.generated_video.length === 0 && reasons.live_action.length === 0) {
      if (card.type === CAPTION_CARD_TYPES.GENERATED_VIDEO) {
        reasons.generated_video.push('AI 생성이 적합한 장면으로 판단됨')
      } else {
        reasons.live_action.push('실사 촬영이 적합한 장면으로 판단됨')
      }
    }

    return reasons
  }

  /**
   * 타입 분류 이유 표시 컴포넌트
   * @param {Object} card - 캡션 카드 데이터
   * @param {number} sceneIndex - 씬 인덱스
   * @returns {JSX.Element} 타입 분류 이유 표시
   */
  const renderTypeReason = (card, sceneIndex) => {
    const reasons = analyzeTypeReason(card)
    const currentType = card.type
    const currentReasons = reasons[currentType] || []

    return (
      <Box sx={{ mt: 2 }}>
        <Alert 
          severity="info" 
          icon={<Info />}
          action={
            <IconButton
              size="small"
              onClick={() => handleToggleTypeReason(sceneIndex)}
            >
              <Help />
            </IconButton>
          }
        >
          <Typography variant="subtitle2" gutterBottom>
            🤖 AI 분류 이유
          </Typography>
          <Typography variant="body2">
            이 씬이 <strong>{getSceneTypeLabel(card.type)}</strong>으로 분류된 이유를 확인하려면 
            <Button 
              size="small" 
              onClick={() => handleToggleTypeReason(sceneIndex)}
              sx={{ ml: 1, minWidth: 'auto' }}
            >
              {showTypeReason[sceneIndex] ? '숨기기' : '자세히 보기'}
            </Button>
          </Typography>
        </Alert>

        <Collapse in={showTypeReason[sceneIndex]}>
          <Box sx={{ mt: 2, p: 2, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="var(--color-accent)" gutterBottom>
              📋 분류 근거
            </Typography>
            
            {currentReasons.length > 0 ? (
              <List dense>
                {currentReasons.map((reason, index) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: '24px' }}>
                      <Typography variant="body2">•</Typography>
                    </ListItemIcon>
                    <ListItemText 
                      primary={reason}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                AI가 장면의 특성을 분석하여 {getSceneTypeLabel(card.type)}로 분류했습니다.
              </Typography>
            )}

            <Divider sx={{ my: 2 }} />
            
            <Typography variant="caption" color="text.secondary">
              💡 <strong>AI 생성 비디오</strong>: 특수효과, 환상적 요소, CG, 단순 자연 풍경이 필요한 장면
            </Typography>
            <br />
            <Typography variant="caption" color="text.secondary">
              🎬 <strong>실사 촬영</strong>: 실제 배우, 소품, 자연광, 특정 장소, 감정 표현이 중요한 장면
            </Typography>
          </Box>
        </Collapse>
      </Box>
    )
  }

  /**
   * 키워드 노드 표시 컴포넌트
   * @param {Object} keywords - 키워드 노드 정보
   * @returns {JSX.Element} 키워드 노드 표시
   */
  const renderKeywords = (keywords, card) => (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" color="var(--color-accent)" gutterBottom>
        🔗 키워드 노드
      </Typography>
      <Grid container spacing={1}>
        <Grid item xs={12} md={6}>
          <Chip 
            icon={<Person />} 
            label={card?.requiredPersonnel || keywords.userInfo} 
            size="small" 
            variant="outlined"
            sx={{ 
              maxWidth: '100%',
              '& .MuiChip-label': {
                whiteSpace: 'normal',
                textAlign: 'left'
              }
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Chip 
            icon={<Build />} 
            label={card?.requiredEquipment || keywords.equipment} 
            size="small" 
            variant="outlined"
            sx={{ 
              maxWidth: '100%',
              '& .MuiChip-label': {
                whiteSpace: 'normal',
                textAlign: 'left'
              }
            }}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <Chip 
            icon={<LocationOn />} 
            label={keywords.location} 
            size="small" 
            variant="outlined"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <Chip 
            icon={<Videocam />} 
            label={card?.camera || '기본 카메라'} 
            size="small" 
            variant="outlined"
          />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="caption" color="text.secondary">
            등장인물: {keywords.cast.join(', ')}
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="caption" color="text.secondary">
            소품: {keywords.props.join(', ')}
          </Typography>
        </Grid>
        <Grid item xs={6} md={3}>
          <Chip 
            icon={<Lightbulb />} 
            label={keywords.lighting} 
            size="small" 
            variant="outlined"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <Chip 
            icon={<WbSunny />} 
            label={keywords.weather} 
            size="small" 
            variant="outlined"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <Chip 
            icon={<AccessTime />} 
            label={keywords.timeOfDay} 
            size="small" 
            variant="outlined"
          />
        </Grid>
        {keywords.specialRequirements.length > 0 && (
          <Grid item xs={12}>
            <Typography variant="caption" color="text.secondary">
              특별 요구사항: {keywords.specialRequirements.join(', ')}
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  )

  /**
   * 가중치 정보 표시 컴포넌트
   * @param {Object} weights - 가중치 정보
   * @returns {JSX.Element} 가중치 표시
   */
  const renderWeights = (weights) => (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" color="var(--color-accent)" gutterBottom>
        ⚖️ 그래프 가중치
      </Typography>
      <Grid container spacing={1}>
        <Grid item xs={6} md={2}>
          <Chip 
            icon={<LocationOn />} 
            label={`장소: ${weights.locationPriority}`} 
            size="small" 
            variant="outlined"
          />
        </Grid>
        <Grid item xs={6} md={2}>
          <Chip 
            icon={<Build />} 
            label={`장비: ${weights.equipmentPriority}`} 
            size="small" 
            variant="outlined"
          />
        </Grid>
        <Grid item xs={6} md={2}>
          <Chip 
            icon={<Person />} 
            label={`배우: ${weights.castPriority}`} 
            size="small" 
            variant="outlined"
          />
        </Grid>
        <Grid item xs={6} md={2}>
          <Chip 
            icon={<AccessTime />} 
            label={`시간: ${weights.timePriority}`} 
            size="small" 
            variant="outlined"
          />
        </Grid>
        <Grid item xs={6} md={2}>
          <Chip 
            icon={<Star />} 
            label={`복잡도: ${weights.complexity}`} 
            size="small" 
            variant="outlined"
          />
        </Grid>
      </Grid>
    </Box>
  )

  /**
   * 시간 문자열을 분으로 변환하는 함수
   * @param {string} duration - 시간 문자열 (예: "3분", "1분 30초")
   * @returns {number} 분 단위 시간
   */
  const parseDurationToMinutes = (duration) => {
    if (!duration) return 0
    
    const minutesMatch = duration.match(/(\d+)분/)
    const secondsMatch = duration.match(/(\d+)초/)
    
    const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0
    const seconds = secondsMatch ? parseInt(secondsMatch[1]) : 0
    
    return minutes + (seconds / 60)
  }

  /**
   * 분을 시간 문자열로 변환하는 함수
   * @param {number} totalMinutes - 총 분
   * @returns {string} 시간 문자열
   */
  const formatDuration = (totalMinutes) => {
    const minutes = Math.floor(totalMinutes)
    const seconds = Math.round((totalMinutes - minutes) * 60)
    
    if (seconds === 0) {
      return `${minutes}분`
    } else {
      return `${minutes}분 ${seconds}초`
    }
  }

  /**
   * 대사 분석 및 시간 계산 함수
   * @param {string} dialogue - 대사 텍스트
   * @returns {Object} 대사 분석 결과
   */
  const analyzeDialogue = (dialogue) => {
    if (!dialogue) return { length: 0, wordCount: 0, estimatedTime: 0, hasEmotion: false }
    
    const length = dialogue.length
    const wordCount = dialogue.split(/\s+/).length
    const hasEmotion = dialogue.includes('!') || 
                      dialogue.includes('?') || 
                      dialogue.includes('...') || 
                      dialogue.includes('ㅠ') || 
                      dialogue.includes('ㅜ')
    
    // 대사 시간 계산 (1분당 약 150자 기준)
    const estimatedTime = Math.ceil(length / 150)
    
    return {
      length,
      wordCount,
      estimatedTime,
      hasEmotion,
      isShort: length < 50,
      isMedium: length >= 50 && length < 100,
      isLong: length >= 100
    }
  }

  if (!conteList || conteList.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          생성된 캡션 카드가 없습니다.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          캡션 카드 생성 탭에서 스토리를 바탕으로 캡션 카드를 생성해주세요.
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* 헤더 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          🎬 생성된 캡션 카드 ({conteList.length}개 씬)
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRegenerateConte}
            disabled={isGenerating}
          >
            재생성
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSaveConte}
            sx={{
              backgroundColor: 'var(--color-primary)',
              '&:hover': {
                backgroundColor: 'var(--color-accent)',
              }
            }}
          >
            저장
          </Button>
          {onViewTimeline && (
            <Button
              variant="contained"
              startIcon={<Timeline />}
              onClick={onViewTimeline}
              sx={{
                backgroundColor: 'var(--color-success)',
                '&:hover': {
                  backgroundColor: 'var(--color-success-dark)',
                }
              }}
            >
              타임라인 보기
            </Button>
          )}
        </Box>
      </Box>

      {/* 캡션 카드 리스트 */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {conteList.map((card, index) => (
          <Card 
            key={card.id || index} 
            sx={{ 
              border: '1px solid #444',
              backgroundColor: 'var(--color-card-bg)'
            }}
          >
            <Accordion 
              expanded={expandedScene === index}
              onChange={() => handleSceneExpand(index)}
              sx={{ backgroundColor: 'transparent' }}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  {/* 씬 번호 */}
                  <Typography variant="h6" sx={{ mr: 2, minWidth: '40px' }}>
                    씬 {card.scene}
                  </Typography>
                  
                  {/* 씬 제목 */}
                  <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    {card.title || `씬 ${card.scene}`}
                  </Typography>
                  
                  {/* 씬 타입 */}
                  <Chip
                    icon={getSceneTypeIcon(card.type)}
                    label={getSceneTypeLabel(card.type)}
                    size="small"
                    variant="outlined"
                    sx={{ mr: 2 }}
                  />
                  
                  {/* 예상 시간 */}
                  {card.estimatedDuration && (
                    <Chip
                      label={card.estimatedDuration}
                      size="small"
                      variant="outlined"
                      sx={{ mr: 2 }}
                    />
                  )}
                  
                  {/* 편집 버튼 */}
                  <Tooltip title="캡션 카드 편집">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditConte(index)
                      }}
                    >
                      <Edit />
                    </IconButton>
                  </Tooltip>
                </Box>
              </AccordionSummary>
              
              <AccordionDetails>
                <Grid container spacing={3}>
                  {/* 인물들이 처한 상황에 대한 대략적인 설명 */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="var(--color-accent)" gutterBottom>
                      📖 인물들이 처한 상황에 대한 대략적인 설명
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {card.description || '설명 없음'}
                    </Typography>
                  </Grid>

                  {/* 해당 장면을 대표하는 대사 */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="var(--color-accent)" gutterBottom>
                      💬 해당 장면을 대표하는 대사
                      {card.dialogue && (
                        <Chip 
                          label={`${card.dialogue.length}자`} 
                          size="small" 
                          variant="outlined" 
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Typography>
                    <Box sx={{ 
                      mb: 2, 
                      p: 2, 
                      backgroundColor: 'rgba(0,0,0,0.05)', 
                      borderRadius: 1,
                      maxHeight: '200px',
                      overflow: 'auto'
                    }}>
                      <Typography variant="body2" sx={{ fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
                        {card.dialogue || '대사 없음'}
                      </Typography>
                    </Box>
                    {card.dialogue && card.dialogue.length > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        {(() => {
                          const analysis = analyzeDialogue(card.dialogue)
                          return `대사 길이: ${analysis.length}자 | 단어 수: ${analysis.wordCount}개 | 예상 발화 시간: ${analysis.estimatedTime}분${analysis.hasEmotion ? ' | 감정적 대사' : ''}`
                        })()}
                      </Typography>
                    )}
                    {(() => {
                      const analysis = analyzeDialogue(card.dialogue)
                      const sceneDuration = parseDurationToMinutes(card.estimatedDuration)
                      
                      if (!card.dialogue || analysis.length < 50) {
                        return (
                          <Alert severity="info" sx={{ mt: 1 }}>
                            <Typography variant="caption">
                              💡 이 장면에는 더 많은 대사가 필요할 수 있습니다. 
                              장면의 시간({card.estimatedDuration})에 맞는 충분한 대사량을 생성해주세요.
                            </Typography>
                          </Alert>
                        )
                      } else if (analysis.estimatedTime < sceneDuration * 0.5) {
                        return (
                          <Alert severity="warning" sx={{ mt: 1 }}>
                            <Typography variant="caption">
                              ⚠️ 대사 시간이 장면 시간의 절반보다 짧습니다. 
                              더 많은 대사를 추가하면 좋겠습니다.
                            </Typography>
                          </Alert>
                        )
                      }
                      return null
                    })()}
                  </Grid>

                  {/* 카메라/그림 앵글과 구도를 설명하는 배치도 */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="var(--color-accent)" gutterBottom>
                      📷 카메라/그림 앵글과 구도를 설명하는 배치도
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {card.cameraAngle || '설정 없음'}
                    </Typography>
                  </Grid>

                  {/* 카메라 워크 및 그림의 장면 전환을 설명하는 화살표들 */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="var(--color-accent)" gutterBottom>
                      🎥 카메라 워크 및 그림의 장면 전환을 설명하는 화살표들
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {card.cameraWork || '설정 없음'}
                    </Typography>
                  </Grid>

                  {/* 인물 배치도와 인물의 동선을 설명하는 화살표 */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="var(--color-accent)" gutterBottom>
                      👥 인물 배치도와 인물의 동선을 설명하는 화살표
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {card.characterLayout || '설정 없음'}
                    </Typography>
                  </Grid>

                  {/* 소품 배치 */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="var(--color-accent)" gutterBottom>
                      🎭 소품 배치
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {card.props || '설정 없음'}
                    </Typography>
                  </Grid>

                  {/* 필요 장비 */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="var(--color-accent)" gutterBottom>
                      🛠️ 필요 장비
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {card.requiredEquipment || '설정 없음'}
                    </Typography>
                  </Grid>

                  {/* 필요 인력 */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="var(--color-accent)" gutterBottom>
                      👥 필요 인력
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {card.requiredPersonnel || '설정 없음'}
                    </Typography>
                  </Grid>

                  {/* 카메라 */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="var(--color-accent)" gutterBottom>
                      📷 카메라
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {card.camera || '설정 없음'}
                    </Typography>
                  </Grid>

                  {/* 날씨와 지형 */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="var(--color-accent)" gutterBottom>
                      🌤️ 날씨와 지형
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {card.weather || '설정 없음'}
                    </Typography>
                  </Grid>

                  {/* 조명 */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="var(--color-accent)" gutterBottom>
                      💡 조명
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {card.lighting || '설정 없음'}
                    </Typography>
                  </Grid>

                  {/* 각 장면과 시퀀스를 직관적으로 이해시킬 대표적인 그림 설명 */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="var(--color-accent)" gutterBottom>
                      🎨 각 장면과 시퀀스를 직관적으로 이해시킬 대표적인 그림 설명
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {card.visualDescription || '설명 없음'}
                    </Typography>
                  </Grid>

                  {/* 장면, 시퀀스의 전환점 */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="var(--color-accent)" gutterBottom>
                      🔄 장면, 시퀀스의 전환점
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {card.transition || '설정 없음'}
                    </Typography>
                  </Grid>

                  {/* 렌즈 길이, 요구되는 카메라의 특성 등 촬영 방식 */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="var(--color-accent)" gutterBottom>
                      📐 렌즈 길이, 요구되는 카메라의 특성 등 촬영 방식
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {card.lensSpecs || '설정 없음'}
                    </Typography>
                  </Grid>

                  {/* 사용할 그래픽 툴, 넣어야하는 시각효과 */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="var(--color-accent)" gutterBottom>
                      🎬 사용할 그래픽 툴, 넣어야하는 시각효과
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {card.visualEffects || '설정 없음'}
                    </Typography>
                  </Grid>

                  {/* 키워드 노드 정보 */}
                  {card.keywords && (
                    <Grid item xs={12}>
                      {renderKeywords(card.keywords, card)}
                    </Grid>
                  )}

                  {/* 그래프 가중치 정보 */}
                  {/* (⚖️ 그래프 가중치 관련 UI 전체 삭제) */}
                  {/* 내부 최적화용 가중치는 UI에 노출하지 않음 (codeStyle) */}

                  {/* 타입 분류 이유 정보 */}
                  {renderTypeReason(card, index)}
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Card>
        ))}
      </Box>

      {/* 요약 정보 */}
      <Box sx={{ mt: 3, p: 2, backgroundColor: 'var(--color-card-bg)', borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom>
          📊 캡션 카드 요약
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              총 씬 수
            </Typography>
            <Typography variant="h6">
              {conteList.length}개
            </Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              AI 생성 비디오
            </Typography>
            <Typography variant="h6">
              {conteList.filter(s => s.type === CAPTION_CARD_TYPES.GENERATED_VIDEO).length}개
            </Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              실사 촬영
            </Typography>
            <Typography variant="h6">
              {conteList.filter(s => s.type === CAPTION_CARD_TYPES.LIVE_ACTION).length}개
            </Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              예상 총 시간
            </Typography>
            <Typography variant="h6">
              {formatDuration(conteList.reduce((total, card) => {
                const duration = card.estimatedDuration ? 
                  parseDurationToMinutes(card.estimatedDuration) : 2
                return total + duration
              }, 0))}
            </Typography>
          </Grid>
        </Grid>

        {/* 분류 기준 설명 */}
        <Box sx={{ mt: 3, p: 2, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 1 }}>
          <Typography variant="subtitle1" color="var(--color-accent)" gutterBottom>
            🤖 AI 분류 기준
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                💡 AI 생성 비디오로 분류되는 경우:
              </Typography>
              <List dense>
                <ListItem sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: '24px' }}>
                    <Typography variant="body2">•</Typography>
                  </ListItemIcon>
                  <ListItemText 
                    primary="특수효과나 CG가 필요한 장면"
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
                <ListItem sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: '24px' }}>
                    <Typography variant="body2">•</Typography>
                  </ListItemIcon>
                  <ListItemText 
                    primary="환상적이거나 초자연적인 요소가 포함된 장면"
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
                <ListItem sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: '24px' }}>
                    <Typography variant="body2">•</Typography>
                  </ListItemIcon>
                  <ListItemText 
                    primary="AI 시각효과나 특수효과가 포함된 장면"
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
                <ListItem sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: '24px' }}>
                    <Typography variant="body2">•</Typography>
                  </ListItemIcon>
                  <ListItemText 
                    primary="단순한 자연 풍경 장면 (하늘, 바다, 구름 등)"
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="secondary" gutterBottom>
                🎬 실사 촬영으로 분류되는 경우:
              </Typography>
              <List dense>
                <ListItem sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: '24px' }}>
                    <Typography variant="body2">•</Typography>
                  </ListItemIcon>
                  <ListItemText 
                    primary="실제 배우의 연기가 중요한 장면"
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
                <ListItem sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: '24px' }}>
                    <Typography variant="body2">•</Typography>
                  </ListItemIcon>
                  <ListItemText 
                    primary="실제 소품과 물리적 상호작용이 필요한 장면"
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
                <ListItem sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: '24px' }}>
                    <Typography variant="body2">•</Typography>
                  </ListItemIcon>
                  <ListItemText 
                    primary="자연광이나 실제 조명 효과가 중요한 장면"
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
                <ListItem sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: '24px' }}>
                    <Typography variant="body2">•</Typography>
                  </ListItemIcon>
                  <ListItemText 
                    primary="특정 실제 장소에서 촬영이 필요한 장면"
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
                                 <ListItem sx={{ py: 0.5 }}>
                   <ListItemIcon sx={{ minWidth: '24px' }}>
                     <Typography variant="body2">•</Typography>
                   </ListItemIcon>
                   <ListItemText 
                     primary="실제 감정 표현이나 인간적 상호작용이 중심인 장면"
                     primaryTypographyProps={{ variant: 'body2' }}
                   />
                 </ListItem>
                 <ListItem sx={{ py: 0.5 }}>
                   <ListItemIcon sx={{ minWidth: '24px' }}>
                     <Typography variant="body2">•</Typography>
                   </ListItemIcon>
                   <ListItemText 
                     primary="대사가 많은 장면 (실제 배우의 연기가 필요)"
                     primaryTypographyProps={{ variant: 'body2' }}
                   />
                 </ListItem>
              </List>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Box>
  )
}

export default ConteResult 