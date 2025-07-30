import React from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';

/**
 * 반응형 타임라인 컨테이너 컴포넌트
 * 다양한 화면 크기에 최적화된 타임라인 레이아웃
 */
const ResponsiveTimelineContainer = ({ 
  children, 
  height = 'auto',
  showScrollbar = true,
  snapToCards = true,
  ...props 
}) => {
  const theme = useTheme();
  
  // 반응형 브레이크포인트
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // < 600px
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md')); // 600px - 900px
  const isDesktop = useMediaQuery(theme.breakpoints.up('md')); // >= 900px

  // 화면 크기별 스타일 설정
  const getResponsiveStyles = () => {
    if (isMobile) {
      return {
        // 모바일: 세로 스크롤, 카드 크기 축소
        flexDirection: 'column',
        gap: 'var(--spacing-timeline-gap-mobile)',
        padding: 'var(--spacing-track-padding-mobile)',
        overflowX: 'hidden',
        overflowY: 'auto',
        scrollSnapType: 'y mandatory',
        '& > *': {
          scrollSnapAlign: 'start',
          width: '100%',
          maxWidth: '100%',
        },
      };
    } else if (isTablet) {
      return {
        // 태블릿: 수평 스크롤, 중간 크기
        flexDirection: 'row',
        gap: 'var(--spacing-timeline-gap-tablet)',
        padding: 'var(--spacing-track-padding-tablet)',
        overflowX: 'auto',
        overflowY: 'hidden',
        scrollSnapType: snapToCards ? 'x mandatory' : 'none',
        '& > *': {
          scrollSnapAlign: 'start',
          flexShrink: 0,
          minWidth: '280px',
          maxWidth: '320px',
        },
      };
    } else {
      // 데스크톱: 수평 스크롤, 최대 크기
      return {
        flexDirection: 'row',
        gap: 'var(--spacing-timeline-gap)',
        padding: 'var(--spacing-track-padding)',
        overflowX: 'auto',
        overflowY: 'hidden',
        scrollSnapType: snapToCards ? 'x mandatory' : 'none',
        '& > *': {
          scrollSnapAlign: 'start',
          flexShrink: 0,
          minWidth: '300px',
          maxWidth: '350px',
        },
      };
    }
  };

  // 스크롤바 스타일 (화면 크기별)
  const getScrollbarStyles = () => {
    if (isMobile) {
      return {
        '&::-webkit-scrollbar': {
          width: showScrollbar ? '6px' : '0px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'var(--color-timeline-track)',
          borderRadius: '3px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'var(--color-accent)',
          borderRadius: '3px',
          '&:hover': {
            backgroundColor: 'var(--color-primary)',
          },
        },
        scrollbarWidth: showScrollbar ? 'thin' : 'none',
        scrollbarColor: showScrollbar ? 'var(--color-accent) var(--color-timeline-track)' : 'transparent transparent',
      };
    } else {
      return {
        '&::-webkit-scrollbar': {
          height: showScrollbar ? '8px' : '0px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'var(--color-timeline-track)',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'var(--color-accent)',
          borderRadius: '4px',
          '&:hover': {
            backgroundColor: 'var(--color-primary)',
          },
        },
        scrollbarWidth: showScrollbar ? 'thin' : 'none',
        scrollbarColor: showScrollbar ? 'var(--color-accent) var(--color-timeline-track)' : 'transparent transparent',
      };
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: height,
        backgroundColor: 'var(--color-bg)',
        display: 'flex',
        scrollBehavior: 'smooth',
        // 성능 최적화
        willChange: 'scroll-position',
        // 반응형 스타일
        ...getResponsiveStyles(),
        // 스크롤바 스타일
        ...getScrollbarStyles(),
        // 포커스 스타일 (접근성)
        '&:focus': {
          outline: '2px solid var(--color-accent)',
          outlineOffset: '2px',
        },
        // 스크롤 중 시각적 피드백
        '&.scrolling': {
          cursor: isMobile ? 'grabbing' : 'grabbing',
        },
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

export default ResponsiveTimelineContainer; 