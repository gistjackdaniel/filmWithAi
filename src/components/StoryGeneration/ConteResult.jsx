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
  LinearProgress
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
  Star
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
  imageGenerationProgress = 0
}) => {
  // 로컬 상태 관리
  const [expandedScene, setExpandedScene] = useState(0) // 확장된 씬 인덱스
  const [groupBy, setGroupBy] = useState('none') // 그룹화 기준

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
    if (onEdit) {
      onEdit(conteList[sceneIndex], sceneIndex)
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
   * 키워드 노드 표시 컴포넌트
   * @param {Object} keywords - 키워드 노드 정보
   * @returns {JSX.Element} 키워드 노드 표시
   */
  const renderKeywords = (keywords) => (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" color="var(--color-accent)" gutterBottom>
        🔗 키워드 노드
      </Typography>
      <Grid container spacing={1}>
        <Grid item xs={6} md={3}>
          <Chip 
            icon={<Person />} 
            label={keywords.userInfo} 
            size="small" 
            variant="outlined"
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
            icon={<Schedule />} 
            label={keywords.date} 
            size="small" 
            variant="outlined"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <Chip 
            icon={<Build />} 
            label={keywords.equipment} 
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
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }}>
                      "{card.dialogue || '대사 없음'}"
                    </Typography>
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
                      {renderKeywords(card.keywords)}
                    </Grid>
                  )}

                  {/* 그래프 가중치 정보 */}
                  {card.weights && (
                    <Grid item xs={12}>
                      {renderWeights(card.weights)}
                    </Grid>
                  )}
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
              {conteList.reduce((total, card) => {
                const duration = card.estimatedDuration ? 
                  parseInt(card.estimatedDuration.match(/\d+/)?.[0] || 0) : 5
                return total + duration
              }, 0)}분
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </Box>
  )
}

export default ConteResult 