import { create } from 'zustand'
import { useAuthStore } from './authStore'

/**
 * 스토리 생성 상태 관리 스토어
 * AI 스토리 생성 기능의 모든 상태를 중앙에서 관리
 * PRD 2.1.2 AI 스토리 생성 기능의 상태 관리
 */
const useStoryGenerationStore = create((set, get) => ({
  // ===== 상태 정의 =====
  
  // 시놉시스 관련 상태
  synopsis: '', // 입력된 시놉시스
  synopsisError: '', // 시놉시스 입력 에러
  
  // 스토리 생성 관련 상태
  generatedStory: '', // 생성된 스토리
  isGenerating: false, // AI 생성 중 상태
  generationError: '', // 스토리 생성 에러
  
  // 히스토리 관련 상태
  storyHistory: [], // 스토리 생성 히스토리
  currentHistoryIndex: -1, // 현재 히스토리 인덱스
  
  // 설정 관련 상태
  storySettings: {
    maxLength: 2000, // 최대 스토리 길이
    genre: '일반', // 영화 장르
    style: '드라마', // 스토리 스타일
  },

  // 템플릿 선택 관련 상태
  templateSelection: {
    selectedGenre: '', // 선택된 장르
    selectedLength: 'medium', // 선택된 길이
    selectedTone: '', // 선택된 톤
    activeTab: 0, // 활성 탭 (0: 장르, 1: 길이, 2: 톤, 3: 사용자)
  },

  // 품질 개선 관련 상태
  qualityEnhancement: {
    lengthMultiplier: 1, // 길이 배율 (0.5 ~ 2.0)
    selectedStyle: '', // 선택된 스타일
    customPrompt: '', // 사용자 정의 프롬프트
    showAdvancedOptions: false, // 고급 옵션 표시 여부
    enhancementProgress: 0, // 개선 진행률
  },

  // 콘티 생성 관련 상태
  conteGeneration: {
    isGenerating: false, // 콘티 생성 중 상태
    generatedConte: [], // 생성된 콘티 리스트
    generationError: '', // 콘티 생성 에러
    conteSettings: {
      maxScenes: 2,
      genre: '일반',
      focus: '균형'
    }
  },

  // ===== 액션 정의 =====

  /**
   * 사용자별 데이터 로드
   * @param {string} userId - 사용자 ID
   */
  loadUserData: (userId) => {
    if (!userId) return
    
    try {
      const savedData = localStorage.getItem(`story-data-${userId}`)
      if (savedData) {
        const data = JSON.parse(savedData)
        set(data)
        console.log('User story data loaded for:', userId)
      }
    } catch (error) {
      console.warn('Failed to load user story data:', error)
    }
  },

  /**
   * 사용자별 데이터 저장
   * @param {string} userId - 사용자 ID
   */
  saveUserData: (userId) => {
    if (!userId) return
    
    try {
      const currentState = get()
      const dataToSave = {
        synopsis: currentState.synopsis,
        generatedStory: currentState.generatedStory,
        storyHistory: currentState.storyHistory,
        storySettings: currentState.storySettings,
        templateSelection: currentState.templateSelection,
        qualityEnhancement: currentState.qualityEnhancement,
        conteGeneration: currentState.conteGeneration
      }
      
      localStorage.setItem(`story-data-${userId}`, JSON.stringify(dataToSave))
      console.log('User story data saved for:', userId)
    } catch (error) {
      console.warn('Failed to save user story data:', error)
    }
  },

  /**
   * 모든 데이터 초기화
   */
  clearAllData: () => {
    set({
      synopsis: '',
      synopsisError: '',
      generatedStory: '',
      isGenerating: false,
      generationError: '',
      storyHistory: [],
      currentHistoryIndex: -1,
      storySettings: {
        maxLength: 2000,
        genre: '일반',
        style: '드라마',
      },
      templateSelection: {
        selectedGenre: '',
        selectedLength: 'medium',
        selectedTone: '',
        activeTab: 0,
      },
      qualityEnhancement: {
        lengthMultiplier: 1,
        selectedStyle: '',
        customPrompt: '',
        showAdvancedOptions: false,
        enhancementProgress: 0,
      },
      conteGeneration: {
        isGenerating: false,
        generatedConte: [],
        generationError: '',
        conteSettings: {
          maxScenes: 2,
          genre: '일반',
          focus: '균형'
        }
      }
    })
    console.log('All story data cleared')
  },

  /**
   * 시놉시스 설정
   * @param {string} synopsis - 시놉시스 텍스트
   */
  setSynopsis: (synopsis) => {
    set({ 
      synopsis,
      synopsisError: '' // 에러 초기화
    })
    
    // 사용자별 데이터 저장
    const { user } = useAuthStore.getState()
    if (user && user.id) {
      get().saveUserData(user.id)
    }
  },

  /**
   * 시놉시스 에러 설정
   * @param {string} error - 에러 메시지
   */
  setSynopsisError: (error) => {
    set({ synopsisError: error })
  },

  /**
   * 스토리 생성 시작
   */
  startGeneration: () => {
    set({ 
      isGenerating: true,
      generationError: '' // 이전 에러 초기화
    })
  },

  /**
   * 스토리 생성 완료
   * @param {string} story - 생성된 스토리
   */
  completeGeneration: (story) => {
    const { synopsis, storySettings } = get()
    
    // 히스토리에 추가
    const historyEntry = {
      id: Date.now(),
      synopsis,
      story,
      settings: { ...storySettings },
      timestamp: new Date().toISOString(),
    }
    
    set((state) => ({
      generatedStory: story,
      isGenerating: false,
      storyHistory: [historyEntry, ...state.storyHistory],
      currentHistoryIndex: 0,
    }))
    
    // 사용자별 데이터 저장
    const { user } = useAuthStore.getState()
    if (user && user.id) {
      get().saveUserData(user.id)
    }
  },

  /**
   * 스토리 생성 실패
   * @param {string} error - 에러 메시지
   */
  failGeneration: (error) => {
    set({ 
      isGenerating: false,
      generationError: error
    })
  },

  /**
   * 생성된 스토리 업데이트 (편집 후)
   * @param {string} story - 수정된 스토리
   */
  updateGeneratedStory: (story) => {
    set({ generatedStory: story })
  },

  /**
   * 스토리 설정 업데이트
   * @param {Object} settings - 새로운 설정
   */
  updateStorySettings: (settings) => {
    set((state) => ({
      storySettings: { ...state.storySettings, ...settings }
    }))
  },

  /**
   * 템플릿 선택 상태 업데이트
   * @param {Object} templateSelection - 템플릿 선택 상태
   */
  updateTemplateSelection: (templateSelection) => {
    set((state) => ({
      templateSelection: { ...state.templateSelection, ...templateSelection }
    }))
  },

  /**
   * 품질 개선 상태 업데이트
   * @param {Object} qualityEnhancement - 품질 개선 상태
   */
  updateQualityEnhancement: (qualityEnhancement) => {
    set((state) => ({
      qualityEnhancement: { ...state.qualityEnhancement, ...qualityEnhancement }
    }))
  },

  /**
   * 콘티 생성 시작
   */
  startConteGeneration: () => {
    set((state) => ({
      conteGeneration: {
        ...state.conteGeneration,
        isGenerating: true,
        generationError: ''
      }
    }))
  },

  /**
   * 콘티 생성 완료
   * @param {Array} conteList - 생성된 콘티 리스트
   */
  completeConteGeneration: (conteList) => {
    set((state) => ({
      conteGeneration: {
        ...state.conteGeneration,
        isGenerating: false,
        generatedConte: conteList,
        generationError: ''
      }
    }))
    
    // 사용자별 데이터 저장
    const { user } = useAuthStore.getState()
    if (user && user.id) {
      get().saveUserData(user.id)
    }
  },

  /**
   * 콘티 생성 실패
   * @param {string} error - 에러 메시지
   */
  failConteGeneration: (error) => {
    set((state) => ({
      conteGeneration: {
        ...state.conteGeneration,
        isGenerating: false,
        generationError: error
      }
    }))
  },

  /**
   * 콘티 설정 업데이트
   * @param {Object} settings - 새로운 콘티 설정
   */
  updateConteSettings: (settings) => {
    set((state) => ({
      conteGeneration: {
        ...state.conteGeneration,
        conteSettings: { ...state.conteGeneration.conteSettings, ...settings }
      }
    }))
  },

  /**
   * 히스토리에서 스토리 로드
   * @param {number} index - 히스토리 인덱스
   */
  loadFromHistory: (index) => {
    const { storyHistory } = get()
    if (index >= 0 && index < storyHistory.length) {
      const entry = storyHistory[index]
      set({
        synopsis: entry.synopsis,
        generatedStory: entry.story,
        storySettings: entry.settings,
        currentHistoryIndex: index,
      })
    }
  },

  /**
   * 히스토리 항목 삭제
   * @param {number} index - 삭제할 히스토리 인덱스
   */
  removeFromHistory: (index) => {
    set((state) => {
      const newHistory = state.storyHistory.filter((_, i) => i !== index)
      return {
        storyHistory: newHistory,
        currentHistoryIndex: -1,
      }
    })
  },

  /**
   * 히스토리 전체 삭제
   */
  clearHistory: () => {
    set({ 
      storyHistory: [],
      currentHistoryIndex: -1,
    })
  },

  /**
   * 모든 상태 초기화
   */
  reset: () => {
    set({
      synopsis: '',
      synopsisError: '',
      generatedStory: '',
      isGenerating: false,
      generationError: '',
      currentHistoryIndex: -1,
      templateSelection: {
        selectedGenre: '',
        selectedLength: 'medium',
        selectedTone: '',
        activeTab: 0,
      },
      qualityEnhancement: {
        lengthMultiplier: 1,
        selectedStyle: '',
        customPrompt: '',
        showAdvancedOptions: false,
        enhancementProgress: 0,
      },
    })
  },

  // ===== 계산된 상태 (getter) =====

  /**
   * 시놉시스 유효성 검사
   * @returns {boolean} 유효한지 여부
   */
  isSynopsisValid: () => {
    const { synopsis } = get()
    return synopsis.trim().length >= 10 && synopsis.trim().length <= 1000
  },

  /**
   * 스토리 생성 가능 여부
   * @returns {boolean} 생성 가능한지 여부
   */
  canGenerateStory: () => {
    const { synopsis, isGenerating } = get()
    return synopsis.trim().length >= 10 && !isGenerating
  },

  /**
   * 히스토리 존재 여부
   * @returns {boolean} 히스토리가 있는지 여부
   */
  hasHistory: () => {
    const { storyHistory } = get()
    return storyHistory.length > 0
  },

  /**
   * 현재 에러 상태
   * @returns {string} 현재 에러 메시지
   */
  getCurrentError: () => {
    const { generationError, synopsisError } = get()
    return generationError || synopsisError || ''
  },

  /**
   * 템플릿 선택 완료 여부
   * @returns {boolean} 템플릿이 선택되었는지 여부
   */
  hasTemplateSelection: () => {
    const { templateSelection } = get()
    return templateSelection.selectedGenre || templateSelection.selectedLength !== 'medium' || templateSelection.selectedTone
  },

  /**
   * 품질 개선 설정 완료 여부
   * @returns {boolean} 품질 개선 설정이 있는지 여부
   */
  hasQualityEnhancement: () => {
    const { qualityEnhancement } = get()
    return qualityEnhancement.lengthMultiplier !== 1 || qualityEnhancement.selectedStyle || qualityEnhancement.customPrompt
  }
}))

export default useStoryGenerationStore 