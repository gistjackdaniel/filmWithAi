import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * 스토리 생성 관련 상태 관리 스토어
 * 시놉시스 입력, 스토리 생성, 생성 상태 관리
 */
export const useStoryStore = create(
  persist(
    (set, get) => ({
      // 시놉시스 관련 상태
      synopsis: '',
      setSynopsis: (synopsis) => set({ synopsis }),
      
      // 스토리 생성 관련 상태
      isGenerating: false,
      setIsGenerating: (isGenerating) => set({ isGenerating }),
      
      // 생성된 스토리 데이터
      generatedStory: null,
      setGeneratedStory: (story) => set({ generatedStory: story }),
      
      // 에러 상태
      generationError: null,
      setGenerationError: (error) => set({ generationError: error }),
      
      // 스토리 생성 진행률
      generationProgress: 0,
      setGenerationProgress: (progress) => set({ generationProgress: progress }),
      
      // 스토리 생성 히스토리
      storyHistory: [],
      addToHistory: (story) => set((state) => ({
        storyHistory: [...state.storyHistory, story]
      })),
      clearHistory: () => set({ storyHistory: [] }),
      
      // 스토리 생성 설정
      storySettings: {
        genre: '일반',
        duration: '90분',
        tone: '중립적',
        complexity: '보통'
      },
      setStorySettings: (settings) => set((state) => ({
        storySettings: { ...state.storySettings, ...settings }
      })),
      
      // 스토리 생성 결과
      generationResult: null,
      setGenerationResult: (result) => set({ generationResult: result }),
      
      // 스토리 저장 상태
      isSaving: false,
      setIsSaving: (isSaving) => set({ isSaving }),
      
      // 스토리 저장 에러
      saveError: null,
      setSaveError: (error) => set({ saveError: error }),
      
      // 스토리 초기화
      resetStory: () => set({
        synopsis: '',
        isGenerating: false,
        generatedStory: null,
        generationError: null,
        generationProgress: 0,
        generationResult: null,
        isSaving: false,
        saveError: null
      }),
      
      // 스토리 상태 초기화 (히스토리 제외)
      clearStoryState: () => set({
        isGenerating: false,
        generatedStory: null,
        generationError: null,
        generationProgress: 0,
        generationResult: null,
        isSaving: false,
        saveError: null
      }),
      
      // 스토리 생성 시작
      startGeneration: () => set({
        isGenerating: true,
        generationError: null,
        generationProgress: 0
      }),
      
      // 스토리 생성 완료
      completeGeneration: (story) => set({
        isGenerating: false,
        generatedStory: story,
        generationProgress: 100,
        generationResult: story
      }),
      
      // 스토리 생성 실패
      failGeneration: (error) => set({
        isGenerating: false,
        generationError: error,
        generationProgress: 0
      }),
      
      // 진행률 업데이트
      updateProgress: (progress) => set({ generationProgress: progress })
    }),
    {
      name: 'story-store',
      partialize: (state) => ({
        synopsis: state.synopsis,
        storyHistory: state.storyHistory,
        storySettings: state.storySettings
      })
    }
  )
) 