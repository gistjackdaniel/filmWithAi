import { useState, useEffect } from 'react'
import { 
  Box, 
  Typography, 
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Chip,
  Alert,
  CircularProgress,
  LinearProgress,
  Divider
} from '@mui/material'
import { 
  Movie,
  Settings,
  PlayArrow,
  Info
} from '@mui/icons-material'
import { generateConteWithRetry, generateSceneImage } from '../../services/storyGenerationApi'
import ConteResult from './ConteResult'
import ConteEditModal from './ConteEditModal'
import useStoryGenerationStore from '../../stores/storyGenerationStore'
import toast from 'react-hot-toast'
import useProjectStore from '../../stores/projectStore'

/**
 * AI 캡션 카드 생성 컴포넌트
 * 스토리를 바탕으로 상세한 캡션 카드를 생성하는 기능
 * 키워드 노드와 그래프 관계성을 포함한 전문적인 캡션 카드 생성
 * PRD 2.1.3 AI 콘티 생성 기능의 핵심 컴포넌트
 */
const ConteGenerator = ({ 
  story = '', 
  projectId = null,
  onConteGenerated,
  onGenerationStart,
  onGenerationComplete,
  onImageGenerationUpdate,
  isDirectMode = false
}) => {
  // Zustand 스토어에서 상태 가져오기
  const {
    conteGeneration,
    startConteGeneration,
    completeConteGeneration,
    failConteGeneration,
    updateConteSettings,
    resetConteGeneration
  } = useStoryGenerationStore()

  const { isGenerating, generatedConte, generationError, conteSettings } = conteGeneration

  // 새 프로젝트 감지 및 초기화
  useEffect(() => {
    // 스토리가 없고 기존 콘티가 있는 경우 새 프로젝트로 간주
    if (!story && generatedConte && generatedConte.length > 0) {
      console.log('🆕 ConteGenerator - 새 프로젝트 감지, 콘티 상태 초기화')
      resetConteGeneration()
    }
  }, [story, generatedConte, resetConteGeneration])

  // 로컬 상태 관리
  const [showResult, setShowResult] = useState(false) // 결과 표시 여부
  const [generatingImages, setGeneratingImages] = useState(false) // 이미지 생성 중 상태
  const [imageGenerationProgress, setImageGenerationProgress] = useState(0) // 이미지 생성 진행률
  const [editModalOpen, setEditModalOpen] = useState(false) // 편집 모달 열림 상태
  const [editingConte, setEditingConte] = useState(null) // 편집 중인 콘티
  const [editingIndex, setEditingIndex] = useState(-1) // 편집 중인 콘티 인덱스

  // 편집 모달 상태 디버깅
  useEffect(() => {
    console.log('🔍 편집 모달 상태 변경:', {
      editModalOpen,
      editingConte: editingConte?.title,
      editingIndex
    })
  }, [editModalOpen, editingConte, editingIndex])

  // 콘티 생성 설정 옵션
  const genreOptions = [
    { value: '일반', label: '일반' },
    { value: '드라마', label: '드라마' },
    { value: '액션', label: '액션' },
    { value: '코미디', label: '코미디' },
    { value: '로맨스', label: '로맨스' },
    { value: '스릴러', label: '스릴러' },
    { value: 'SF', label: 'SF' },
    { value: '판타지', label: '판타지' }
  ]

  const focusOptions = [
    { value: '균형', label: '균형 (모든 요소 포함)' },
    { value: '시각적', label: '시각적 (카메라, 조명 중심)' },
    { value: '연기적', label: '연기적 (인물, 대사 중심)' },
    { value: '기술적', label: '기술적 (촬영, 특수효과 중심)' }
  ]

  /**
   * 씬 이미지 생성 함수
   * @param {Array} conteList - 콘티 리스트
   * @returns {Promise<Array>} 이미지가 추가된 콘티 리스트
   */
  const generateSceneImages = async (conteList) => {
    setGeneratingImages(true)
    setImageGenerationProgress(0)
    
    // 이미지 생성 시작 토스트 메시지
    toast.success('캡션카드에 이미지가 생성 중이니 잠시만 기다려 주세요', {
      duration: 4000,
      icon: '🎨'
    })
    
    // 부모 컴포넌트에 이미지 생성 시작 알림
    if (onImageGenerationUpdate) {
      onImageGenerationUpdate(true, 0)
    }
    
    const updatedConteList = [...conteList]
    
    try {
      for (let i = 0; i < updatedConteList.length; i++) {
        const conte = updatedConteList[i]
        
        // 이미지 생성 프롬프트 구성
        const imagePrompt = `${conte.title}: ${conte.description}. ${conte.visualDescription || ''} ${conte.genre || '영화'} 스타일, 시네마틱한 구도, 고품질 이미지`
        
        console.log(`🎨 씬 ${conte.scene} 이미지 생성 시작:`, imagePrompt)
        
        // 이미지 생성 API 호출
        const imageResponse = await generateSceneImage({
          sceneDescription: imagePrompt,
          style: 'cinematic',
          genre: conte.genre || '일반',
          size: '1024x1024'
        })
        
        // 생성된 이미지 URL을 콘티에 추가
        updatedConteList[i] = {
          ...conte,
          imageUrl: imageResponse.imageUrl,
          imagePrompt: imagePrompt,
          imageGeneratedAt: imageResponse.generatedAt,
          imageModel: imageResponse.model,
          isFreeTier: imageResponse.isFreeTier
        }
        
        console.log(`✅ 씬 ${conte.scene} 이미지 생성 완료:`, imageResponse.imageUrl)
        
        // 진행률 업데이트
        const progress = ((i + 1) / updatedConteList.length) * 100
        setImageGenerationProgress(progress)
        
        // 부모 컴포넌트에 진행률 업데이트 알림
        if (onImageGenerationUpdate) {
          onImageGenerationUpdate(true, progress)
        }
        
        // 잠시 대기 (API 제한 방지)
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      // 이미지 생성 완료 토스트 메시지
      toast.success('이미지 생성이 완료되었습니다.', {
        duration: 3000,
        icon: '✅'
      })
      
      return updatedConteList
      
    } catch (error) {
      console.error('❌ 이미지 생성 전체 실패:', error)
      toast.error('이미지 생성에 실패했습니다.')
      throw error
    } finally {
      setGeneratingImages(false)
      setImageGenerationProgress(0)
      
      // 부모 컴포넌트에 이미지 생성 완료 알림
      if (onImageGenerationUpdate) {
        onImageGenerationUpdate(false, 0)
      }
    }
  }

  /**
   * 캡션 카드 생성 핸들러
   */
  const handleGenerateConte = async () => {
    // 스토리 유효성 검사
    if (!story || !story.trim()) {
      console.error('❌ 스토리가 없습니다.')
      toast.error('캡션 카드를 생성할 스토리가 없습니다.')
      return
    }

    console.log('📝 스토리 길이:', story.length, '자')
    if (story.length < 50) {
      console.error('❌ 스토리가 너무 짧습니다.')
      toast.error('스토리를 더 자세히 작성해주세요. (최소 50자)')
      return
    }

    let processedConteList = null
    let conteWithImages = null

    try {
      startConteGeneration()
      if (onGenerationStart) {
        onGenerationStart()
      }

      console.log('🎬 캡션 카드 생성 시작:', { 
        storyLength: story.length, 
        settings: conteSettings 
      })

      // AI 캡션 카드 생성 API 호출
      const response = await generateConteWithRetry({
        story: story,
        maxScenes: conteSettings.maxScenes,
        genre: conteSettings.genre
      })

      console.log('✅ 캡션 카드 생성 완료:', { 
        response: response,
        tokenCount: response.tokenCount 
      })

      // 응답 데이터 처리
      let conteList = []
      
      console.log('🔍 응답 데이터 분석:', {
        responseType: typeof response,
        hasConteList: response.conteList ? 'yes' : 'no',
        responseKeys: typeof response === 'object' ? Object.keys(response) : 'N/A'
      })
      
      // API 응답에서 콘티 리스트 추출
      if (response && response.conteList && Array.isArray(response.conteList)) {
        conteList = response.conteList
        console.log('✅ API 응답 처리 완료:', conteList.length, '개 씬')
      } else if (response && Array.isArray(response)) {
        // 응답이 직접 배열인 경우
        conteList = response
        console.log('✅ API 응답 배열 처리 완료:', conteList.length, '개 씬')
      } else {
        console.log('❌ API 응답 형식이 올바르지 않음:', response)
        throw new Error('콘티 데이터 형식이 올바르지 않습니다.')
      }

      // API 응답 데이터를 그대로 사용 (서버에서 올바른 형식으로 제공됨)
      processedConteList = conteList.map((card, index) => ({
        ...card,
        // 임시 ID는 제거하고 실제 DB 저장 후 받은 ID를 사용
        scene: card.scene || index + 1,
        title: card.title || `씬 ${card.scene || index + 1}`,
        canEdit: card.canEdit !== false,
        lastModified: card.lastModified || new Date().toISOString(),
        modifiedBy: card.modifiedBy || 'AI'
      }))

      console.log('✅ 처리된 캡션 카드 리스트:', processedConteList)

      // 콘티 생성 완료 - 즉시 부모 컴포넌트에 전달하여 프로젝트 상태 업데이트
      console.log('🎬 콘티 생성 완료 - 즉시 부모 컴포넌트에 전달:', {
        processedConteListLength: processedConteList?.length,
        hasOnConteGenerated: !!onConteGenerated
      })
      
      // 콘티 생성 완료 시 즉시 부모 컴포넌트에 알림 (프로젝트 상태 업데이트용)
      if (onConteGenerated) {
        console.log('📞 콘티 생성 완료 - onConteGenerated 콜백 즉시 호출 (프로젝트 상태 업데이트)...')
        onConteGenerated(processedConteList, false) // isImageUpdate = false (프로젝트 상태 업데이트)
        console.log('✅ 콘티 생성 완료 - onConteGenerated 콜백 호출 완료')
      } else {
        console.log('⚠️ 콘티 생성 완료 - onConteGenerated 콜백이 없음')
      }
      
      // UI 업데이트
      setShowResult(true)
      completeConteGeneration(processedConteList)

      // 씬 이미지 생성 시작 (백그라운드에서 진행)
      console.log('🎨 씬 이미지 생성 시작 (백그라운드)...')
      
      // 이미지 생성 시작 시 부모 컴포넌트에 알림
      if (onImageGenerationUpdate) {
        onImageGenerationUpdate(true, 0)
      }
      
      // 이미지 생성을 백그라운드에서 비동기로 실행
      generateSceneImages(processedConteList)
        .then(async (conteWithImages) => {
          console.log('✅ 백그라운드 이미지 생성 완료:', conteWithImages.length, '개')
          
          // 이미지가 추가된 콘티 리스트를 로컬 상태에 업데이트
          completeConteGeneration(conteWithImages)
          
          // 이미지 생성 완료 - 모든 콘티의 이미지 생성 상태 확인
          const contesWithImages = conteWithImages.filter(conte => conte.imageUrl)
          const totalContes = conteWithImages.length
          const contesWithImagesCount = contesWithImages.length
          
          console.log('💾 이미지 생성 완료 상태 확인:', {
            totalContes,
            contesWithImagesCount,
            allImagesGenerated: contesWithImagesCount === totalContes
          })
          
          // 모든 콘티의 이미지가 생성된 경우에만 DB 저장 요청
          if (contesWithImagesCount === totalContes) {
            console.log('✅ 모든 콘티의 이미지 생성 완료 - DB 저장 요청')
            if (onConteGenerated) {
              console.log('📞 백그라운드 이미지 생성 완료 - onConteGenerated 콜백 호출 (DB 저장)...')
              onConteGenerated(conteWithImages, true) // isImageUpdate = true (DB 저장)
              console.log('✅ 백그라운드 이미지 생성 완료 - onConteGenerated 콜백 호출 완료')
            }
          } else {
            console.log('⚠️ 일부 콘티의 이미지 생성 실패:', {
              successCount: contesWithImagesCount,
              totalCount: totalContes,
              failedCount: totalContes - contesWithImagesCount
            })
            // 일부 실패 시 토스트 메시지 없이 조용히 처리
          }
          
          console.log('✅ 모든 씬 이미지 생성 완료')
          toast.success('모든 씬 이미지가 생성되었습니다!')
        })
        .catch(imageError => {
          console.error('❌ 백그라운드 이미지 생성 실패:', imageError)
          toast.error('일부 이미지 생성에 실패했습니다. 콘티는 정상적으로 생성되었습니다.')
        })
        .finally(() => {
          // 이미지 생성 완료 시 부모 컴포넌트에 알림
          if (onImageGenerationUpdate) {
            onImageGenerationUpdate(false, 0)
          }
          console.log('✅ 백그라운드 이미지 생성 프로세스 완료')
        })

    } catch (error) {
      console.error('❌ 캡션 카드 생성 실패:', error)
      const errorMessage = error.message || '캡션 카드 생성에 실패했습니다.'
      failConteGeneration(errorMessage)
      
      // 에러 발생 시에도 부모 컴포넌트에 알림
      console.log('🎬 콘티 생성 실패 - 콜백 호출 준비:', {
        hasOnGenerationComplete: !!onGenerationComplete,
        hasOnConteGenerated: !!onConteGenerated
      })
      
      if (onGenerationComplete) {
        console.log('📞 onGenerationComplete 콜백 호출 중...')
        onGenerationComplete()
        console.log('✅ onGenerationComplete 콜백 호출 완료')
      }
      
      if (onConteGenerated) {
        console.log('📞 콘티 생성 실패 - onConteGenerated 콜백 호출 중... (null 전달)')
        onConteGenerated(null) // null 전달로 실패 상태 명시
        console.log('✅ 콘티 생성 실패 - onConteGenerated 콜백 호출 완료')
      }
      
      toast.error(errorMessage)
    }
  }

  /**
   * 타임라인 보기 핸들러
   */
  const handleViewTimeline = () => {
    // 콘티 데이터를 로컬 스토리지에 저장하고 프로젝트 페이지로 이동
    if (generatedConte && generatedConte.length > 0) {
      localStorage.setItem('currentConteData', JSON.stringify(generatedConte))
      // 프로젝트 페이지로 이동 (navigate 함수가 필요하므로 window.location 사용)
      window.location.href = '/project/temp-project-id'
    } else {
      toast.error('타임라인을 보려면 먼저 콘티를 생성해주세요.')
    }
  }

  /**
   * 전체 캡션 카드 재생성 핸들러
   */
  const handleRegenerateAllConte = () => {
    setShowResult(false)
    handleGenerateConte()
  }

  /**
   * 캡션 카드 편집 핸들러
   * @param {Object} card - 편집할 캡션 카드 데이터
   * @param {number} cardIndex - 카드 인덱스
   */
  const handleEditConte = (card, cardIndex) => {
    console.log('✏️ 편집 시작:', { card, cardIndex })
    setEditingConte(card)
    setEditingIndex(cardIndex)
    setEditModalOpen(true)
    console.log('✅ 편집 모달 상태 설정 완료')
  }

  /**
   * 편집 모달 닫기 핸들러
   */
  const handleEditModalClose = () => {
    console.log('🔒 편집 모달 닫기')
    setEditModalOpen(false)
    setEditingConte(null)
    setEditingIndex(-1)
  }

  /**
   * 편집된 콘티 저장 핸들러
   * @param {Object} editedConte - 편집된 콘티 데이터
   */
  const handleSaveConte = (editedConte) => {
    console.log('💾 handleSaveConte 호출됨')
    console.log('editingIndex:', editingIndex)
    console.log('generatedConte.length:', generatedConte.length)
    console.log('editedConte:', editedConte)
    
    if (editingIndex >= 0 && editingIndex < generatedConte.length) {
      console.log('✅ 유효한 편집 인덱스')
      const updatedConteList = [...generatedConte]
      updatedConteList[editingIndex] = editedConte
      
      console.log('📝 업데이트된 콘티 리스트:', updatedConteList)
      
      // 스토어 업데이트
      completeConteGeneration(updatedConteList)
      
      toast.success('캡션 카드가 저장되었습니다.')
    } else {
      console.error('❌ 유효하지 않은 편집 인덱스:', editingIndex)
      toast.error('저장에 실패했습니다. 편집 인덱스가 유효하지 않습니다.')
    }
    handleEditModalClose()
  }

  /**
   * 콘티 재생성 핸들러
   * @param {Object} conte - 재생성할 콘티
   */
  const handleRegenerateConte = (conte) => {
    // TODO: 개별 콘티 재생성 로직 구현
    console.log('개별 콘티 재생성:', conte)
    toast.info('개별 콘티 재생성 기능은 준비 중입니다.')
  }

  /**
   * 이미지 재생성 핸들러
   * @param {Object} conte - 이미지를 재생성할 콘티
   */
  const handleRegenerateImage = async (conte) => {
    try {
      // 이미지 생성 프롬프트 구성
      const imagePrompt = `${conte.title}: ${conte.description}. ${conte.visualDescription || ''} ${conte.genre || '영화'} 스타일, 시네마틱한 구도, 고품질 이미지`
      
      console.log('🎨 이미지 재생성 시작:', imagePrompt)
      
      // 이미지 생성 API 호출
      const imageResponse = await generateSceneImage({
        sceneDescription: imagePrompt,
        style: 'cinematic',
        genre: conte.genre || '일반',
        size: '1024x1024'
      })
      
      // 생성된 이미지 URL을 콘티에 추가
      const updatedConte = {
        ...conte,
        imageUrl: imageResponse.imageUrl,
        imagePrompt: imagePrompt,
        imageGeneratedAt: imageResponse.generatedAt,
        imageModel: imageResponse.model,
        isFreeTier: imageResponse.isFreeTier
      }
      
      // 스토어 업데이트
      if (editingIndex >= 0 && editingIndex < generatedConte.length) {
        const updatedConteList = [...generatedConte]
        updatedConteList[editingIndex] = updatedConte
        completeConteGeneration(updatedConteList)
      }
      
      toast.success('이미지가 재생성되었습니다.')
      
    } catch (error) {
      console.error('❌ 이미지 재생성 실패:', error)
      toast.error('이미지 재생성에 실패했습니다.')
    }
  }

  /**
   * 설정 변경 핸들러
   * @param {string} key - 설정 키
   * @param {any} value - 설정 값
   */
  const handleSettingChange = (key, value) => {
    updateConteSettings({ [key]: value })
  }



  // 생성된 캡션 카드가 있으면 결과 표시
  if (showResult && generatedConte.length > 0) {
    return (
      <>
        <ConteResult 
          conteList={generatedConte}
          onEdit={handleEditConte}
          onRegenerate={handleRegenerateAllConte}
          isGenerating={isGenerating}
          generatingImages={generatingImages}
          imageGenerationProgress={imageGenerationProgress}
          onViewTimeline={handleViewTimeline}
        />
        
        {/* 편집 모달 */}
        <ConteEditModal
          open={editModalOpen}
          onClose={handleEditModalClose}
          conte={editingConte}
          onSave={handleSaveConte}
          onRegenerateImage={handleRegenerateImage}
          onRegenerateConte={handleRegenerateConte}
        />
      </>
    )
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* 헤더 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          🎬 AI 캡션 카드 생성
        </Typography>
        <Typography variant="body2" color="text.secondary">
          스토리를 바탕으로 상세한 캡션 카드를 생성합니다. 키워드 노드와 그래프 관계성이 포함됩니다.
        </Typography>
      </Box>

      {/* 생성 중일 때 로딩 표시 */}
      {isGenerating && (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          py: 6 
        }}>
          <CircularProgress size={80} sx={{ mb: 3 }} />
          <Typography variant="h5" gutterBottom>
            {generatingImages ? '이미지 생성 중...' : '콘티 생성 중...'}
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {generatingImages 
              ? `씬별 이미지를 생성하고 있습니다. (${Math.round(imageGenerationProgress)}%)`
              : '작성하신 스토리를 바탕으로 씬별 콘티를 생성하고 있습니다.'
            }
          </Typography>
          <Typography variant="body2" color="text.secondary">
            잠시만 기다려주세요...
          </Typography>
          {generatingImages && (
            <Box sx={{ width: '100%', maxWidth: 400, mt: 2 }}>
              <LinearProgress 
                variant="determinate" 
                value={imageGenerationProgress}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: 'var(--color-accent)',
                  }
                }}
              />
            </Box>
          )}
        </Box>
      )}

      {/* 생성 중이 아닐 때만 안내와 설정 UI 표시 */}
      {!isGenerating && (
        <>
          {/* 캡션 카드 생성 안내 */}
          <Alert 
            severity="info" 
            icon={<Info />}
            sx={{ mb: 3, backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-accent)' }}
          >
            <Typography variant="body2">
              <strong>포함되는 캡션 카드 요소:</strong><br/>
              • 인물들이 처한 상황에 대한 대략적인 설명 • 해당 장면을 대표하는 대사<br/>
              • 카메라/그림 앵글과 구도를 설명하는 배치도 • 카메라 워크 및 그림의 장면 전환을 설명하는 화살표들<br/>
              • 인물 배치도와 인물의 동선을 설명하는 화살표 • 소품 배치<br/>
              • 날씨와 지형 • 조명 • 각 장면과 시퀀스를 직관적으로 이해시킬 대표적인 그림 설명<br/>
              • 장면, 시퀀스의 전환점 • 렌즈 길이, 요구되는 카메라의 특성 등 촬영 방식<br/>
              • 사용할 그래픽 툴, 넣어야하는 시각효과
            </Typography>
          </Alert>

          {/* 캡션 카드 생성 설정 */}
          <Card sx={{ mb: 3, border: '1px solid #444' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Settings sx={{ mr: 1, verticalAlign: 'middle' }} />
                캡션 카드 생성 설정
              </Typography>
              
              <Grid container spacing={3}>
                {/* 최대 씬 수 설정 */}
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    최대 씬 수: {conteSettings.maxScenes}개
                  </Typography>
                  <Slider
                    value={conteSettings.maxScenes}
                    onChange={(e, value) => handleSettingChange('maxScenes', value)}
                    min={2}
                    max={20}
                    step={1}
                    marks={[
                      { value: 2, label: '2' },
                      { value: 5, label: '5' },
                      { value: 10, label: '10' },
                      { value: 15, label: '15' },
                      { value: 20, label: '20' }
                    ]}
                    sx={{
                      '& .MuiSlider-track': {
                        backgroundColor: 'var(--color-accent)',
                      },
                      '& .MuiSlider-thumb': {
                        backgroundColor: 'var(--color-accent)',
                      }
                    }}
                  />
                </Grid>

                {/* 장르 설정 */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>영화 장르</InputLabel>
                    <Select
                      value={conteSettings.genre}
                      onChange={(e) => handleSettingChange('genre', e.target.value)}
                      label="영화 장르"
                    >
                      {genreOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* 초점 설정 */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>캡션 카드 초점</InputLabel>
                    <Select
                      value={conteSettings.focus}
                      onChange={(e) => handleSettingChange('focus', e.target.value)}
                      label="캡션 카드 초점"
                    >
                      {focusOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* 현재 설정 요약 */}
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip 
                      label={`${conteSettings.maxScenes}개 씬`} 
                      size="small" 
                      variant="outlined"
                    />
                    <Chip 
                      label={conteSettings.genre} 
                      size="small" 
                      variant="outlined"
                    />
                    <Chip 
                      label={conteSettings.focus} 
                      size="small" 
                      variant="outlined"
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </>
      )}

      {/* 생성 중이 아닐 때만 생성 버튼 표시 */}
      {!isGenerating && (
        <Box sx={{ textAlign: 'center' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={isGenerating ? <CircularProgress size={20} /> : <Movie />}
            onClick={handleGenerateConte}
            disabled={isGenerating || generatingImages || !story.trim()}
            sx={{
              backgroundColor: 'var(--color-primary)',
              '&:hover': {
                backgroundColor: 'var(--color-accent)',
              },
              '&:disabled': {
                backgroundColor: '#444',
                color: '#666',
              },
              px: 4,
              py: 1.5
            }}
          >
            {isGenerating ? 'AI 캡션 카드 생성 중...' : 
             generatingImages ? '씬 이미지 생성 중...' : 'AI 캡션 카드 생성하기'}
          </Button>
        </Box>
      )}
        
      {/* 이미지 생성 진행률 표시 */}
      {generatingImages && (
        <Box sx={{ mt: 3, p: 3, bgcolor: 'rgba(0, 0, 0, 0.04)', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            🎨 씬 이미지 생성 중...
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            각 씬에 대한 시각적 표현을 생성하고 있습니다.
          </Typography>
          
          {/* 진행률 바 */}
          <Box sx={{ width: '100%', mb: 2 }}>
            <Box sx={{ 
              width: '100%', 
              height: 8, 
              bgcolor: 'rgba(0, 0, 0, 0.1)', 
              borderRadius: 4,
              overflow: 'hidden'
            }}>
              <Box sx={{
                width: `${imageGenerationProgress}%`,
                height: '100%',
                bgcolor: 'var(--color-accent)',
                transition: 'width 0.3s ease'
              }} />
            </Box>
          </Box>
          
          <Typography variant="body2" color="text.secondary">
            진행률: {Math.round(imageGenerationProgress)}%
          </Typography>
        </Box>
      )}

      {/* 에러 메시지 */}
      {generationError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {generationError}
        </Alert>
      )}

      {/* 생성 안내 */}
      {!story.trim() && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          캡션 카드를 생성하려면 먼저 스토리를 생성해주세요.
        </Alert>
      )}
    </Box>
  )
}

export default ConteGenerator 