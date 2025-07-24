/**
 * 텍스트 처리 유틸리티 함수들
 * 마크다운 문법 제거 및 텍스트 정리 기능
 */

/**
 * 마크다운 문법을 제거하고 깔끔한 텍스트로 변환
 * @param {string} text - 원본 텍스트
 * @returns {string} 마크다운이 제거된 텍스트
 */
export const removeMarkdown = (text) => {
  if (!text || typeof text !== 'string') {
    return text
  }

  return text
    // 헤딩 제거 (###, ##, #)
    .replace(/^#{1,6}\s+/gm, '')
    // 볼드 제거 (**text** 또는 __text__)
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    // 이탤릭 제거 (*text* 또는 _text_)
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    // 코드 블록 제거 (```code```)
    .replace(/```[\s\S]*?```/g, '')
    // 인라인 코드 제거 (`code`)
    .replace(/`([^`]+)`/g, '$1')
    // 링크 제거 ([text](url))
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // 이미지 제거 (![alt](url))
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    // 리스트 마커 제거 (-, *, +)
    .replace(/^[\s]*[-*+]\s+/gm, '')
    
    // 인용 제거 (> text)
    .replace(/^>\s+/gm, '')
    // 수평선 제거 (---, ***, ___)
    .replace(/^[-*_]{3,}$/gm, '')
    // // 줄바꿈 정리 (연속된 줄바꿈을 2개로 제한)
    // .replace(/\n{3,}/g, '\n\n')
    // // 앞뒤 공백 제거
    // .trim()
}

/**
 * 스토리 텍스트를 정리 (마크다운 제거 + 추가 정리)
 * @param {string} story - 원본 스토리 텍스트
 * @returns {string} 정리된 스토리 텍스트
 */
export const cleanStoryText = (story) => {
  if (!story || typeof story !== 'string') {
    return story
  }

  return removeMarkdown(story)
    // // 문단 구분을 위한 줄바꿈 정리 (빈 줄을 2개로 통일)
    // .replace(/\n\s*\n\s*\n+/g, '\n\n')
    // // 앞뒤 공백 제거
    // .trim()
}

/**
 * 콘티 설명 텍스트를 정리
 * @param {string} description - 원본 콘티 설명
 * @returns {string} 정리된 콘티 설명
 */
export const cleanConteDescription = (description) => {
  if (!description || typeof description !== 'string') {
    return description
  }

  return removeMarkdown(description)
    // // 불필요한 공백 정리
    // .replace(/\s+/g, ' ')
    // // 앞뒤 공백 제거
    // .trim()
}

/**
 * 대사 텍스트를 정리
 * @param {string} dialogue - 원본 대사 텍스트
 * @returns {string} 정리된 대사 텍스트
 */
export const cleanDialogueText = (dialogue) => {
  if (!dialogue || typeof dialogue !== 'string') {
    return dialogue
  }

  return removeMarkdown(dialogue)
    // 대사 인용 부호 정리
    .replace(/["""]/g, '"')
    .replace(/[''']/g, "'")
    // 불필요한 공백 정리
    .replace(/\s+/g, ' ')
    // 앞뒤 공백 제거
    .trim()
}

/**
 * 시놉시스 텍스트를 정리
 * @param {string} synopsis - 원본 시놉시스 텍스트
 * @returns {string} 정리된 시놉시스 텍스트
 */
export const cleanSynopsisText = (synopsis) => {
  if (!synopsis || typeof synopsis !== 'string') {
    return synopsis
  }

  return removeMarkdown(synopsis)
    // // 불필요한 공백 정리
    // .replace(/\s+/g, ' ')
    // // 앞뒤 공백 제거
    // .trim()
} 