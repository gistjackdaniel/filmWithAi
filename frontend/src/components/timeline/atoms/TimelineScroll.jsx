import React, { useRef, useEffect, useCallback, forwardRef, useMemo } from 'react';
import { Box } from '@mui/material';
import { 
  calculateTimeScale,
  timeToPixels,
  calculateMinSceneWidth,
} from '../../../utils/timelineUtils';

/**
 * 타임라인 스크롤 컴포넌트
 * 스크롤 최적화 및 네비게이션 기능을 제공
 * 줌 레벨에 따른 동적 씬 너비 계산 지원
 */
const TimelineScroll = forwardRef(({ 
  children, 
  height = 'auto',
  showScrollbar = true,
  snapToCards = true,
  onScroll,
  scrollPosition = 0,
  onScrollPositionChange,
  // 줌 관련 props 추가
  zoomLevel = 1,
  baseScale = 1,
  timeScale = null,
  ...props 
}, ref) => {
  const scrollRef = useRef(null);
  const isScrolling = useRef(false);
  const scrollTimeout = useRef(null);

  // 시간 스케일 계산
  const calculatedTimeScale = useMemo(() => {
    if (timeScale !== null) return timeScale;
    return calculateTimeScale(zoomLevel, baseScale);
  }, [timeScale, zoomLevel, baseScale]);

  // 줌 레벨에 따른 동적 씬 너비 계산
  const sceneWidth = useMemo(() => {
    return calculateMinSceneWidth(zoomLevel, 280); // 기본 너비 280px
  }, [zoomLevel]);

  // 스크롤 위치 복원
  useEffect(() => {
    if (scrollRef.current && scrollPosition > 0) {
      scrollRef.current.scrollLeft = scrollPosition;
    }
  }, [scrollPosition]);

  // 스크롤 이벤트 핸들러
  const handleScroll = useCallback((event) => {
    if (!isScrolling.current) {
      isScrolling.current = true;
    }

    // 스크롤 위치 변경 알림
    if (onScrollPositionChange) {
      onScrollPositionChange(event.target.scrollLeft);
    }

    // 스크롤 종료 감지
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    scrollTimeout.current = setTimeout(() => {
      isScrolling.current = false;
      onScroll?.(event);
    }, 150); // 150ms 후 스크롤 종료로 판단
  }, [onScroll, onScrollPositionChange]);

  // 특정 위치로 스크롤
  const scrollToPosition = useCallback((position, smooth = true) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: position,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  }, []);

  // 특정 씬으로 스크롤
  const scrollToScene = useCallback((sceneIndex, smooth = true) => {
    if (scrollRef.current) {
      const sceneWidthWithGap = sceneWidth + 16; // gap 포함
      const scrollPosition = sceneIndex * sceneWidthWithGap;
      scrollToPosition(scrollPosition, smooth);
    }
  }, [scrollToPosition, sceneWidth]);

  // 좌우 스크롤 버튼 핸들러
  const handleScrollLeft = useCallback(() => {
    if (scrollRef.current) {
      const currentScroll = scrollRef.current.scrollLeft;
      const scrollAmount = 300; // 한 번에 스크롤할 양
      scrollToPosition(Math.max(0, currentScroll - scrollAmount));
    }
  }, [scrollToPosition]);

  const handleScrollRight = useCallback(() => {
    if (scrollRef.current) {
      const currentScroll = scrollRef.current.scrollLeft;
      const scrollAmount = 300;
      const maxScroll = scrollRef.current.scrollWidth - scrollRef.current.clientWidth;
      scrollToPosition(Math.min(maxScroll, currentScroll + scrollAmount));
    }
  }, [scrollToPosition]);

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!scrollRef.current) return;

      switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        handleScrollLeft();
        break;
      case 'ArrowRight':
        event.preventDefault();
        handleScrollRight();
        break;
      case 'Home':
        event.preventDefault();
        scrollToPosition(0);
        break;
      case 'End':
        event.preventDefault();
        const maxScroll = scrollRef.current.scrollWidth - scrollRef.current.clientWidth;
        scrollToPosition(maxScroll);
        break;
      }
    };

    // 타임라인 컨테이너에 포커스가 있을 때만 키보드 이벤트 처리
    const container = scrollRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
      return () => container.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleScrollLeft, handleScrollRight, scrollToPosition]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, []);

  return (
    <Box
      ref={ref || scrollRef}
      tabIndex={0} // 키보드 포커스 가능하도록 설정
      sx={{
        width: '100%',
        height: height,
        backgroundColor: 'var(--color-bg)',
        overflowX: 'auto',
        overflowY: 'hidden',
        display: 'flex',
        gap: 'var(--spacing-timeline-gap)',
        padding: 'var(--spacing-track-padding)',
        scrollSnapType: snapToCards ? 'x mandatory' : 'none',
        scrollBehavior: 'smooth',
        // 스크롤 성능 최적화
        willChange: 'scroll-position',
        // 커스텀 스크롤바 - showScrollbar가 false일 때 완전히 숨김
        ...(showScrollbar ? {
          '&::-webkit-scrollbar': {
            height: '8px',
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
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--color-accent) var(--color-timeline-track)',
        } : {
          '&::-webkit-scrollbar': {
            display: 'none',
            width: '0px',
            height: '0px',
          },
          '&::-webkit-scrollbar-track': {
            display: 'none',
          },
          '&::-webkit-scrollbar-thumb': {
            display: 'none',
          },
          scrollbarWidth: 'none',
          scrollbarColor: 'transparent transparent',
        }),
        // 포커스 스타일
        '&:focus': {
          outline: '2px solid var(--color-accent)',
          outlineOffset: '2px',
        },
        // 스크롤 중 시각적 피드백
        '&.scrolling': {
          cursor: 'grabbing',
        },

      }}
      onScroll={handleScroll}
      {...props}
    >
      {children}
    </Box>
  );
});

TimelineScroll.displayName = 'TimelineScroll';

export default TimelineScroll; 