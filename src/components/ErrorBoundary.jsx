import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Container
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

/**
 * 에러 바운더리 컴포넌트
 * React 컴포넌트 트리에서 발생하는 JavaScript 에러를 캐치하고 처리
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // 에러가 발생하면 상태를 업데이트하여 다음 렌더링에서 폴백 UI를 표시
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // 에러 정보를 로깅
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

/**
 * 에러 발생 시 표시할 폴백 UI 컴포넌트
 */
const ErrorFallback = ({ error }) => {
  const navigate = useNavigate();

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          textAlign: 'center',
          backgroundColor: 'var(--color-card-bg)',
          color: 'var(--color-text-primary)'
        }}
      >
        <ErrorIcon 
          sx={{ 
            fontSize: 64, 
            color: 'var(--color-danger)', 
            mb: 2 
          }} 
        />
        
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          오류가 발생했습니다
        </Typography>
        
        <Typography 
          variant="body1" 
          sx={{ 
            mb: 3, 
            color: 'var(--color-text-secondary)',
            lineHeight: 1.6
          }}
        >
          예상치 못한 오류가 발생했습니다. 
          페이지를 새로고침하거나 홈으로 돌아가서 다시 시도해주세요.
        </Typography>

        {process.env.NODE_ENV === 'development' && error && (
          <Box 
            sx={{ 
              mt: 3, 
              p: 2, 
              backgroundColor: 'var(--color-bg)',
              borderRadius: 1,
              textAlign: 'left'
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ color: 'var(--color-danger)' }}>
              개발자 정보:
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                fontFamily: 'monospace',
                color: 'var(--color-text-secondary)',
                wordBreak: 'break-word'
              }}
            >
              {error.toString()}
            </Typography>
          </Box>
        )}

        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            sx={{
              backgroundColor: 'var(--color-accent)',
              color: '#000',
              '&:hover': {
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-text-primary)'
              }
            }}
          >
            새로고침
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<HomeIcon />}
            onClick={handleGoHome}
            sx={{
              borderColor: 'var(--color-primary)',
              color: 'var(--color-text-primary)',
              '&:hover': {
                borderColor: 'var(--color-accent)',
                backgroundColor: 'var(--color-accent)',
                color: '#000'
              }
            }}
          >
            홈으로
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default ErrorBoundary; 