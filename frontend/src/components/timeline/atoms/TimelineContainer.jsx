import React from 'react'
import { Box } from '@mui/material'

/**
 * 타임라인 컨테이너 컴포넌트
 * 수평 스크롤을 지원하는 타임라인 레이아웃
 */
const TimelineContainer = ({ 
  children, 
  height = 'auto',
  showScrollbar = true,
  snapToCards = true,
  ...props 
}) => {
  return (
    <Box
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
        // Firefox 스크롤바 스타일링
        scrollbarWidth: showScrollbar ? 'thin' : 'none',
        scrollbarColor: showScrollbar ? 'var(--color-accent) var(--color-timeline-track)' : 'transparent transparent',
      }}
      {...props}
    >
      {children}
    </Box>
  )
}

export default TimelineContainer 