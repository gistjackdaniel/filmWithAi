/**
 * SceneForge 디자인 시스템 - 색상 팔레트
 * 영화 제작 도구에 특화된 다크 테마 기반 색상 시스템
 */

export const colors = {
  // Primary Colors
  primary: '#2E3A59',      // Deep Slate Blue - 영화관 조명 같은 어두운 블루
  accent: '#D4AF37',       // Cinematic Gold - 고급스럽고 주목도 높은 골드
  
  // Background Colors
  background: '#1B1B1E',   // Charcoal Black - 영상과 콘티가 돋보이는 무채색 톤
  cardBackground: '#2F2F37', // Slate Gray - 카드, 패널, 타임라인용 중간톤 회색
  
  // Text Colors
  textPrimary: '#F5F5F5',  // Ivory White - 부드럽고 따뜻한 흰색
  textSecondary: '#A0A3B1', // Cool Gray - 부제목, 설명 텍스트용
  
  // Status Colors
  success: '#2ECC71',      // Emerald Green - 긍정적 메시지, 완료 상태
  danger: '#E74C3C',       // Cinematic Red - 삭제, 경고 등 눈에 띄는 알림
  
  // Timeline Specific Colors
  timelineTrack: '#3A3A42', // 타임라인 트랙 배경
  sceneCardBorder: '#4A4A52', // 씬 카드 테두리
  modalOverlay: 'rgba(27, 27, 30, 0.8)', // 모달 오버레이
} as const;

/**
 * CSS 변수로 내보내기 (다크 테마 기본)
 */
export const cssVariables = `
  :root {
    --color-primary: ${colors.primary};
    --color-accent: ${colors.accent};
    --color-bg: ${colors.background};
    --color-card-bg: ${colors.cardBackground};
    --color-text-primary: ${colors.textPrimary};
    --color-text-secondary: ${colors.textSecondary};
    --color-success: ${colors.success};
    --color-danger: ${colors.danger};
    --color-timeline-track: ${colors.timelineTrack};
    --color-scene-card-border: ${colors.sceneCardBorder};
    --color-modal-overlay: ${colors.modalOverlay};
  }
`;

export type ColorKey = keyof typeof colors;
export default colors; 