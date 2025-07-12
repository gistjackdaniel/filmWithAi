import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * 스토리 생성 히스토리 관리 스토어
 * 이전 생성 결과 저장, 히스토리 목록 표시, 이전 결과 재사용 기능 제공
 * PRD 2.1.2 AI 스토리 생성 기능의 히스토리 관리
 */

// 히스토리 아이템 데이터 구조
/**
 * @typedef {Object} StoryHistoryItem
 * @property {string} id - 고유 ID
 * @property {string} synopsis - 입력된 시놉시스
 * @property {string} story - 생성된 스토리
 * @property {string} createdAt - 생성 시간
 * @property {Object} settings - 생성 설정 (길이, 장르 등)
 * @property {number} generationTime - 생성 소요 시간 (초)
 * @property {boolean} isFavorite - 즐겨찾기 여부
 */

const useStoryHistoryStore = create(
  persist(
    (set, get) => ({
      // 상태
      history: [], // 스토리 생성 히스토리 배열
      maxHistorySize: 50, // 최대 히스토리 개수
      currentHistoryId: null, // 현재 선택된 히스토리 ID

      /**
       * 새 스토리 생성 결과를 히스토리에 추가
       * @param {Object} storyData - 스토리 데이터
       * @param {string} storyData.synopsis - 시놉시스
       * @param {string} storyData.story - 생성된 스토리
       * @param {Object} storyData.settings - 생성 설정
       * @param {number} storyData.generationTime - 생성 소요 시간
       */
      addToHistory: (storyData) => {
        const { history, maxHistorySize } = get()
        
        const newHistoryItem = {
          id: `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          synopsis: storyData.synopsis,
          story: storyData.story,
          createdAt: new Date().toISOString(),
          settings: storyData.settings || {},
          generationTime: storyData.generationTime || 0,
          isFavorite: false
        }

        // 최신 항목을 맨 앞에 추가
        const updatedHistory = [newHistoryItem, ...history]

        // 최대 개수 제한
        const limitedHistory = updatedHistory.slice(0, maxHistorySize)

        set({
          history: limitedHistory,
          currentHistoryId: newHistoryItem.id
        })

        return newHistoryItem.id
      },

      /**
       * 히스토리에서 특정 항목 제거
       * @param {string} historyId - 제거할 히스토리 ID
       */
      removeFromHistory: (historyId) => {
        const { history } = get()
        const updatedHistory = history.filter(item => item.id !== historyId)
        
        set({ 
          history: updatedHistory,
          currentHistoryId: get().currentHistoryId === historyId ? null : get().currentHistoryId
        })
      },

      /**
       * 히스토리 전체 삭제
       */
      clearHistory: () => {
        set({ 
          history: [],
          currentHistoryId: null
        })
      },

      /**
       * 즐겨찾기 토글
       * @param {string} historyId - 토글할 히스토리 ID
       */
      toggleFavorite: (historyId) => {
        const { history } = get()
        const updatedHistory = history.map(item => 
          item.id === historyId 
            ? { ...item, isFavorite: !item.isFavorite }
            : item
        )
        
        set({ history: updatedHistory })
      },

      /**
       * 현재 선택된 히스토리 설정
       * @param {string} historyId - 선택할 히스토리 ID
       */
      setCurrentHistory: (historyId) => {
        set({ currentHistoryId: historyId })
      },

      /**
       * 현재 선택된 히스토리 아이템 가져오기
       * @returns {StoryHistoryItem|null} 현재 선택된 히스토리 아이템
       */
      getCurrentHistory: () => {
        const { history, currentHistoryId } = get()
        return history.find(item => item.id === currentHistoryId) || null
      },

      /**
       * 즐겨찾기된 히스토리만 가져오기
       * @returns {Array<StoryHistoryItem>} 즐겨찾기된 히스토리 배열
       */
      getFavorites: () => {
        const { history } = get()
        return history.filter(item => item.isFavorite)
      },

      /**
       * 히스토리 검색
       * @param {string} query - 검색 쿼리
       * @returns {Array<StoryHistoryItem>} 검색 결과
       */
      searchHistory: (query) => {
        const { history } = get()
        const lowerQuery = query.toLowerCase()
        
        return history.filter(item => 
          item.synopsis.toLowerCase().includes(lowerQuery) ||
          item.story.toLowerCase().includes(lowerQuery)
        )
      },

      /**
       * 히스토리 아이템 업데이트
       * @param {string} historyId - 업데이트할 히스토리 ID
       * @param {Object} updates - 업데이트할 데이터
       */
      updateHistoryItem: (historyId, updates) => {
        const { history } = get()
        const updatedHistory = history.map(item => 
          item.id === historyId 
            ? { ...item, ...updates }
            : item
        )
        
        set({ history: updatedHistory })
      },

      /**
       * 히스토리 통계 정보 가져오기
       * @returns {Object} 통계 정보
       */
      getHistoryStats: () => {
        const { history } = get()
        
        const totalCount = history.length
        const favoriteCount = history.filter(item => item.isFavorite).length
        const totalGenerationTime = history.reduce((sum, item) => sum + item.generationTime, 0)
        const averageGenerationTime = totalCount > 0 ? totalGenerationTime / totalCount : 0
        
        // 장르별 통계
        const genreStats = history.reduce((stats, item) => {
          const genre = item.settings?.genre || '기타'
          stats[genre] = (stats[genre] || 0) + 1
          return stats
        }, {})

        return {
          totalCount,
          favoriteCount,
          averageGenerationTime,
          genreStats
        }
      },

      /**
       * 히스토리 내보내기 (JSON)
       * @returns {string} JSON 문자열
       */
      exportHistory: () => {
        const { history } = get()
        return JSON.stringify(history, null, 2)
      },

      /**
       * 히스토리 가져오기 (JSON)
       * @param {string} jsonData - JSON 문자열
       */
      importHistory: (jsonData) => {
        try {
          const importedHistory = JSON.parse(jsonData)
          if (Array.isArray(importedHistory)) {
            set({ history: importedHistory })
            return true
          }
          return false
        } catch (error) {
          console.error('히스토리 가져오기 실패:', error)
          return false
        }
      },

      /**
       * 오래된 히스토리 정리 (30일 이상)
       */
      cleanupOldHistory: () => {
        const { history } = get()
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        const filteredHistory = history.filter(item => {
          const itemDate = new Date(item.createdAt)
          return itemDate > thirtyDaysAgo || item.isFavorite
        })
        
        set({ history: filteredHistory })
      }
    }),
    {
      name: 'story-history-storage', // 로컬 스토리지 키
      partialize: (state) => ({ 
        history: state.history,
        maxHistorySize: state.maxHistorySize
      })
    }
  )
)

export default useStoryHistoryStore 