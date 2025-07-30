/**
 * SceneForge 디자인 시스템 - 간격 시스템
 * 일관된 레이아웃을 위한 간격 기준
 */

export const spacing = {
  // Base spacing unit (4px)
  base: 4,
  
  // Spacing scale (4px 단위)
  xs: 4,    // 4px
  sm: 8,    // 8px
  md: 16,   // 16px
  lg: 24,   // 24px
  xl: 32,   // 32px
  xxl: 48,  // 48px
  
  // Component specific spacing
  cardPadding: 16,      // 카드 내부 패딩
  modalPadding: 24,     // 모달 내부 패딩
  buttonPadding: '12px 20px', // 버튼 패딩
  inputPadding: '12px 16px',  // 입력 필드 패딩
  
  // Timeline specific spacing
  timelineGap: 16,      // 타임라인 카드 간격
  sceneCardGap: 12,     // 씬 카드 내부 요소 간격
  trackPadding: 20,     // 타임라인 트랙 패딩
};

/**
 * CSS 변수로 내보내기
 */
export const cssSpacingVariables = `
  :root {
    --spacing-xs: ${spacing.xs}px;
    --spacing-sm: ${spacing.sm}px;
    --spacing-md: ${spacing.md}px;
    --spacing-lg: ${spacing.lg}px;
    --spacing-xl: ${spacing.xl}px;
    --spacing-xxl: ${spacing.xxl}px;
    
    --spacing-card-padding: ${spacing.cardPadding}px;
    --spacing-modal-padding: ${spacing.modalPadding}px;
    --spacing-button-padding: ${spacing.buttonPadding};
    --spacing-input-padding: ${spacing.inputPadding};
    
    --spacing-timeline-gap: ${spacing.timelineGap}px;
    --spacing-scene-card-gap: ${spacing.sceneCardGap}px;
    --spacing-track-padding: ${spacing.trackPadding}px;
  }
`;

export default spacing; 