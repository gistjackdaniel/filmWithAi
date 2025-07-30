import { Box, Typography, CircularProgress, Paper } from '@mui/material'
import { AutoStories } from '@mui/icons-material'

/**
 * AI 스토리 생성 로딩 스피너 컴포넌트
 * AI가 스토리를 생성하는 동안 사용자에게 시각적 피드백을 제공
 * Design System의 색상과 애니메이션을 적용
 */
const LoadingSpinner = ({ 
  message = 'AI 생성 중...',
  progress = 0,
  showProgress = false,
  steps = ['분석', '구성', '생성', '완료'],
  currentStep = 0
}) => {
  return (
    <Paper
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 6,
        px: 4,
        backgroundColor: 'var(--color-card-bg)',
        borderRadius: 2,
        border: '1px solid #444',
        minHeight: 300
      }}
    >
      {/* 스피너 애니메이션 */}
      <Box sx={{ position: 'relative', mb: 3 }}>
        <CircularProgress
          size={80}
          thickness={4}
          variant={showProgress ? "determinate" : "indeterminate"}
          value={showProgress ? progress : undefined}
          sx={{
            color: 'var(--color-accent)',
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
          lineHeight: 1.6,
          mb: 3
        }}
      >
        AI가 시놉시스를 분석하고 상세한 스토리를 생성하고 있습니다.
        <br />
        잠시만 기다려주세요...
      </Typography>

      {/* 진행 단계 표시 */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        {steps.map((step, index) => (
          <Box
            key={step}
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: index <= currentStep ? 'var(--color-accent)' : '#444',
              transition: 'background-color 0.3s ease'
            }}
          />
        ))}
      </Box>

      {/* 진행률 표시 */}
      {showProgress && (
        <Box sx={{ width: '100%', maxWidth: 300 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            진행률: {progress}%
          </Typography>
          <Box
            sx={{
              width: '100%',
              height: 4,
              backgroundColor: '#444',
              borderRadius: 2,
              overflow: 'hidden'
            }}
          >
            <Box
              sx={{
                width: `${progress}%`,
                height: '100%',
                backgroundColor: 'var(--color-accent)',
                transition: 'width 0.3s ease'
              }}
            />
          </Box>
        </Box>
      )}

      {/* 현재 단계 표시 */}
      {steps[currentStep] && (
        <Typography 
          variant="body2" 
          color="var(--color-accent)"
          sx={{ 
            mt: 2,
            fontWeight: 600
          }}
        >
          현재 단계: {steps[currentStep]}
        </Typography>
      )}

      {/* CSS 애니메이션 */}
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
    </Paper>
  )
}

export default LoadingSpinner 