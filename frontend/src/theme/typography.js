/**
 * SceneForge 디자인 시스템 - 타이포그래피 시스템
 * Inter 폰트 기반의 일관된 텍스트 스타일 시스템
 */

export const typography = {
  // Font Family
  fontFamily: '\'Inter\', sans-serif',
  
  // Font Weights
  weights: {
    regular: 400,
    medium: 500,
    bold: 700,
  },
  
  // Typography Scale
  styles: {
    heading1: {
      fontSize: '24px',
      fontWeight: 700,
      lineHeight: '32px',
      letterSpacing: '-0.02em',
    },
    heading2: {
      fontSize: '20px',
      fontWeight: 500,
      lineHeight: '28px',
      letterSpacing: '-0.01em',
    },
    body1: {
      fontSize: '16px',
      fontWeight: 400,
      lineHeight: '24px',
      letterSpacing: '0em',
    },
    body2: {
      fontSize: '14px',
      fontWeight: 400,
      lineHeight: '20px',
      letterSpacing: '0.01em',
    },
    button: {
      fontSize: '14px',
      fontWeight: 500,
      lineHeight: '20px',
      letterSpacing: '0.01em',
    },
    caption: {
      fontSize: '12px',
      fontWeight: 400,
      lineHeight: '16px',
      letterSpacing: '0.02em',
    },
  },
};

/**
 * CSS 변수로 내보내기
 */
export const cssTypographyVariables = `
  :root {
    --font-family: ${typography.fontFamily};
    --font-weight-regular: ${typography.weights.regular};
    --font-weight-medium: ${typography.weights.medium};
    --font-weight-bold: ${typography.weights.bold};
    
    --font-heading-1: ${typography.weights.bold} ${typography.styles.heading1.fontSize}/${typography.styles.heading1.lineHeight} ${typography.fontFamily};
    --font-heading-2: ${typography.weights.medium} ${typography.styles.heading2.fontSize}/${typography.styles.heading2.lineHeight} ${typography.fontFamily};
    --font-body-1: ${typography.weights.regular} ${typography.styles.body1.fontSize}/${typography.styles.body1.lineHeight} ${typography.fontFamily};
    --font-body-2: ${typography.weights.regular} ${typography.styles.body2.fontSize}/${typography.styles.body2.lineHeight} ${typography.fontFamily};
    --font-button: ${typography.weights.medium} ${typography.styles.button.fontSize}/${typography.styles.button.lineHeight} ${typography.fontFamily};
    --font-caption: ${typography.weights.regular} ${typography.styles.caption.fontSize}/${typography.styles.caption.lineHeight} ${typography.fontFamily};
  }
`;

export default typography; 