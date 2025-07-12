import { Box, Typography, CircularProgress } from '@mui/material'
import { AutoStories } from '@mui/icons-material'

/**
 * AI 스토리 생성 로딩 스피너 컴포넌트
 * AI가 스토리를 생성하는 동안 사용자에게 시각적 피드백을 제공
 * Design System의 색상과 애니메이션을 적용
 */
const LoadingSpinner = ({ message = 'AI 생성 중...' }) => {
  return (
          <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 6,
          px: 4,
          backgroundColor: 'var(--color-card-bg)',
          borderRadius: 2,
          border: '1px solid #444'
        }}
      >
      {/* 스피너 애니메이션 */}
      <Box sx={{ position: 'relative', mb: 3 }}>
        <CircularProgress
          size={80}
          thickness={4}
          sx={{
            color: 'var(--color-accent)', // Design System Accent 색상
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            }
          }}
        />
        
        {/* 중앙 아이콘 */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <AutoStories 
            sx={{ 
              fontSize: 32, 
              color: 'var(--color-accent)',
              animation: 'pulse 2s ease-in-out infinite'
            }} 
          />
        </Box>
      </Box>

      {/* 로딩 메시지 */}
              <Typography 
          variant="h6" 
          color="text.primary"
          sx={{ 
            mb: 2,
            textAlign: 'center',
            font: 'var(--font-heading-2)'
          }}
        >
        {message}
      </Typography>

      {/* 부가 설명 */}
      <Typography 
        variant="body2" 
        color="text.secondary"
        sx={{ 
          textAlign: 'center',
          maxWidth: 400,
          lineHeight: 1.6
        }}
      >
        AI가 시놉시스를 분석하고 상세한 스토리를 생성하고 있습니다.
        <br />
        잠시만 기다려주세요...
      </Typography>

      {/* 진행 단계 표시 (향후 구현) */}
      <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
        {['분석', '구성', '생성', '완료'].map((step, index) => (
                      <Box
              key={step}
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: index === 0 ? 'var(--color-accent)' : '#444',
                transition: 'background-color 0.3s ease'
              }}
            />
        ))}
      </Box>

      {/* CSS 애니메이션 정의 */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
              transform: scale(1);
            }
            50% {
              opacity: 0.7;
              transform: scale(1.1);
            }
          }
        `}
      </style>
    </Box>
  )
}

export default LoadingSpinner 