import React from 'react';
import {
  Alert,
  AlertTitle,
  Button,
  Box,
  Typography,
  Collapse
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Help as HelpIcon,
  Close as CloseIcon
} from '@mui/icons-material';

/**
 * 사용자 친화적인 에러 메시지 컴포넌트
 * 다양한 에러 타입에 대해 적절한 메시지와 해결 방법을 제공
 */
const ErrorMessage = ({ 
  error, 
  onRetry, 
  onClose, 
  show = true,
  variant = 'error' // 'error', 'warning', 'info'
}) => {
  // 에러 타입별 메시지 매핑
  const getErrorMessage = (error) => {
    if (!error) return '알 수 없는 오류가 발생했습니다.';

    // 네트워크 에러
    if (error.message?.includes('Network Error') || error.code === 'NETWORK_ERROR') {
      return {
        title: '네트워크 연결 오류',
        message: '인터넷 연결을 확인하고 다시 시도해주세요.',
        solution: 'Wi-Fi 또는 모바일 데이터 연결을 확인해주세요.'
      };
    }

    // 인증 에러
    if (error.status === 401 || error.message?.includes('Unauthorized')) {
      return {
        title: '인증 오류',
        message: '로그인이 필요하거나 세션이 만료되었습니다.',
        solution: '다시 로그인해주세요.'
      };
    }

    // 서버 에러
    if (error.status >= 500) {
      return {
        title: '서버 오류',
        message: '서버에 일시적인 문제가 발생했습니다.',
        solution: '잠시 후 다시 시도해주세요.'
      };
    }

    // API 한도 초과
    if (error.status === 429 || error.message?.includes('rate limit')) {
      return {
        title: '요청 한도 초과',
        message: '너무 많은 요청을 보냈습니다.',
        solution: '잠시 후 다시 시도해주세요.'
      };
    }

    // 기본 에러
    return {
      title: '오류가 발생했습니다',
      message: error.message || '예상치 못한 오류가 발생했습니다.',
      solution: '페이지를 새로고침하거나 잠시 후 다시 시도해주세요.'
    };
  };

  const errorInfo = getErrorMessage(error);

  return (
    <Collapse in={show}>
      <Alert
        severity={variant}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            {onRetry && (
              <Button
                size="small"
                startIcon={<RefreshIcon />}
                onClick={onRetry}
                sx={{
                  color: 'inherit',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                재시도
              </Button>
            )}
            {onClose && (
              <Button
                size="small"
                startIcon={<CloseIcon />}
                onClick={onClose}
                sx={{
                  color: 'inherit',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                닫기
              </Button>
            )}
          </Box>
        }
        sx={{
          mb: 2,
          backgroundColor: variant === 'error' ? 'var(--color-danger)' : 
                         variant === 'warning' ? 'var(--color-accent)' : 
                         'var(--color-primary)',
          color: variant === 'error' ? '#fff' : '#000',
          '& .MuiAlert-icon': {
            color: 'inherit'
          }
        }}
      >
        <AlertTitle sx={{ fontWeight: 600 }}>
          {errorInfo.title}
        </AlertTitle>
        
        <Typography variant="body2" sx={{ mb: 1 }}>
          {errorInfo.message}
        </Typography>
        
        {errorInfo.solution && (
          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <HelpIcon sx={{ fontSize: 16 }} />
            <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
              해결 방법: {errorInfo.solution}
            </Typography>
          </Box>
        )}

        {/* 개발 모드에서만 상세 에러 정보 표시 */}
        {process.env.NODE_ENV === 'development' && error && (
          <Box sx={{ mt: 2, p: 1, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 1 }}>
            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
              {error.toString()}
            </Typography>
          </Box>
        )}
      </Alert>
    </Collapse>
  );
};

export default ErrorMessage; 