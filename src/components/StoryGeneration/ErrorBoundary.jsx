import React from 'react'
import { 
  Box, 
  Typography, 
  Button,
  Alert,
  AlertTitle
} from '@mui/material'
import { 
  Refresh,
  Report,
  Home
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'

/**
 * 스토리 생성 에러 바운더리 컴포넌트
 * AI 스토리 생성 과정에서 발생하는 에러를 처리하고 사용자에게 친화적인 피드백 제공
 * PRD 2.1.2 AI 스토리 생성 기능의 에러 처리
 */
class StoryGenerationErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    }
  }

  /**
   * 에러가 발생했을 때 호출되는 생명주기 메서드
   * @param {Error} error - 발생한 에러
   * @param {Object} errorInfo - 에러 정보
   */
  static getDerivedStateFromError(error) {
    // 에러 상태를 업데이트하여 다음 렌더링에서 폴백 UI를 표시
    return { hasError: true }
  }

  /**
   * 에러 발생 시 호출되는 메서드
   * @param {Error} error - 발생한 에러
   * @param {Object} errorInfo - 에러 정보
   */
  componentDidCatch(error, errorInfo) {
    // 에러 로깅 (실제 환경에서는 에러 추적 서비스로 전송)
    console.error('StoryGeneration Error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })
  }

  /**
   * 에러 상태 초기화
   */
  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    })
  }

  /**
   * 홈으로 이동
   */
  handleGoHome = () => {
    this.props.navigate('/')
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            p: 4,
            backgroundColor: 'var(--color-card-bg)',
            borderRadius: 2,
            border: '1px solid #444'
          }}
        >
          {/* 에러 아이콘 */}
          <Report 
            sx={{ 
              fontSize: 64, 
              color: 'var(--color-danger)', 
              mb: 2 
            }} 
          />

          {/* 에러 제목 */}
          <Typography 
            variant="h5" 
            color="text.primary"
            sx={{ mb: 2, textAlign: 'center' }}
          >
            스토리 생성 중 오류가 발생했습니다
          </Typography>

          {/* 에러 설명 */}
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ mb: 3, textAlign: 'center', maxWidth: 500 }}
          >
            AI 스토리 생성 과정에서 예상치 못한 오류가 발생했습니다.
            잠시 후 다시 시도해주시거나, 다른 시놉시스로 시도해보세요.
          </Typography>

          {/* 에러 상세 정보 (개발 모드에서만 표시) */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <Alert 
              severity="error" 
              sx={{ mb: 3, maxWidth: 600 }}
            >
              <AlertTitle>에러 상세 정보</AlertTitle>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                {this.state.error.toString()}
              </Typography>
            </Alert>
          )}

          {/* 액션 버튼들 */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {/* 재시도 버튼 */}
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={this.handleRetry}
              sx={{
                backgroundColor: 'var(--color-primary)',
                '&:hover': {
                  backgroundColor: 'var(--color-accent)',
                }
              }}
            >
              다시 시도
            </Button>

            {/* 홈으로 이동 버튼 */}
            <Button
              variant="outlined"
              startIcon={<Home />}
              onClick={this.handleGoHome}
              sx={{
                borderColor: '#444',
                color: 'var(--color-text-primary)',
                '&:hover': {
                  borderColor: 'var(--color-accent)',
                  backgroundColor: 'rgba(212, 175, 55, 0.1)',
                }
              }}
            >
              홈으로 이동
            </Button>
          </Box>

          {/* 도움말 */}
          <Box sx={{ mt: 4, p: 3, backgroundColor: 'var(--color-bg)', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              💡 <strong>문제 해결 방법:</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              • 인터넷 연결을 확인해주세요
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              • 시놉시스를 더 간단하게 작성해보세요
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              • 잠시 후 다시 시도해보세요
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • 문제가 지속되면 관리자에게 문의해주세요
            </Typography>
          </Box>
        </Box>
      )
    }

    // 에러가 없으면 자식 컴포넌트를 정상적으로 렌더링
    return this.props.children
  }
}

/**
 * 네비게이션 훅을 사용하기 위한 래퍼 컴포넌트
 */
const StoryGenerationErrorBoundaryWrapper = (props) => {
  const navigate = useNavigate()
  return <StoryGenerationErrorBoundary {...props} navigate={navigate} />
}

export default StoryGenerationErrorBoundaryWrapper 