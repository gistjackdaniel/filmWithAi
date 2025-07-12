import { useState, useEffect, useCallback } from 'react'
import { 
  Box, 
  Typography, 
  Button,
  Alert,
  Snackbar
} from '@mui/material'
import toast from 'react-hot-toast'
import { 
  WifiOff,
  Refresh,
  SignalWifiStatusbarConnectedNoInternet4
} from '@mui/icons-material'

/**
 * 네트워크 오류 처리 컴포넌트
 * 네트워크 연결 상태를 모니터링하고 오류 시 사용자에게 피드백 제공
 * PRD 2.1.2 AI 스토리 생성 기능의 네트워크 오류 처리
 */
const NetworkErrorHandler = ({ children, onRetry }) => {
  // 로컬 상태 관리
  const [isOnline, setIsOnline] = useState(navigator.onLine) // 온라인 상태
  const [showOfflineAlert, setShowOfflineAlert] = useState(false) // 오프라인 알림 표시 여부
  const [lastError, setLastError] = useState(null) // 마지막 에러
  const [retryCount, setRetryCount] = useState(0) // 재시도 횟수
  const [isCheckingConnection, setIsCheckingConnection] = useState(false) // 연결 확인 중 상태

  /**
   * 온라인 상태 변경 핸들러
   */
  const handleOnlineStatusChange = useCallback(() => {
    const online = navigator.onLine
    console.log('🌐 네트워크 상태 변경 감지:', online ? '온라인' : '오프라인')
    console.log('🔧 이벤트 타입:', event?.type || 'unknown')
    setIsOnline(online)
    
    if (!online) {
      console.log('❌ 오프라인 상태로 전환 - 오프라인 UI 표시')
      setShowOfflineAlert(true)
    } else {
      console.log('✅ 온라인 상태로 복구 - 정상 UI 표시')
      setShowOfflineAlert(false)
      
      // 온라인 복구 시 항상 Toast 메시지 표시
      console.log('✅ Toast 메시지 표시: 네트워크 연결이 복구되었습니다.')
      toast.success('네트워크 연결이 복구되었습니다.')
      
      // 온라인 복구 시 자동 재시도 (lastError가 있는 경우에만)
      if (lastError && onRetry) {
        console.log('🔄 자동 온라인 복구 감지 - 재시도 실행')
        setTimeout(() => {
          onRetry()
          setLastError(null)
        }, 1000)
      }
    }
  }, [lastError, onRetry])

  /**
   * 네트워크 상태 모니터링 설정
   */
  useEffect(() => {
    // 초기 상태 로그
    console.log('🔧 NetworkErrorHandler 마운트 - 초기 온라인 상태:', navigator.onLine)
    
    // 온라인/오프라인 이벤트 리스너 등록
    window.addEventListener('online', handleOnlineStatusChange)
    window.addEventListener('offline', handleOnlineStatusChange)

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      console.log('🔧 NetworkErrorHandler 언마운트 - 이벤트 리스너 제거')
      window.removeEventListener('online', handleOnlineStatusChange)
      window.removeEventListener('offline', handleOnlineStatusChange)
    }
  }, [handleOnlineStatusChange])

  /**
   * 연결 확인 핸들러
   */
  const handleCheckConnection = async () => {
    setIsCheckingConnection(true)
    setRetryCount(prev => prev + 1)
    
    try {
      // 네트워크 상태 재확인
      const currentOnlineStatus = navigator.onLine
      setIsOnline(currentOnlineStatus)
      
      if (currentOnlineStatus) {
        // 온라인 상태로 복구된 경우
        console.log('🌐 네트워크 연결 복구됨')
        setShowOfflineAlert(false)
        setLastError(null)
        setRetryCount(0)
        
        // 자동 재시도
        if (onRetry) {
          setTimeout(() => {
            console.log('🔄 자동 재시도 실행')
            onRetry()
          }, 1000)
        }
        
        console.log('✅ Toast 메시지 표시: 네트워크 연결이 복구되었습니다.')
        toast.success('네트워크 연결이 복구되었습니다.')
      } else {
        // 여전히 오프라인인 경우
        console.log('❌ 여전히 오프라인 상태')
        toast.error('네트워크 연결을 확인해주세요.')
      }
    } catch (error) {
      console.error('연결 확인 실패:', error)
      toast.error('연결 확인에 실패했습니다.')
    } finally {
      setIsCheckingConnection(false)
    }
  }

  /**
   * 네트워크 에러 설정
   * @param {Error} error - 네트워크 에러
   */
  const setNetworkError = (error) => {
    setLastError(error)
  }

  /**
   * 오프라인 알림 닫기
   */
  const handleCloseOfflineAlert = () => {
    setShowOfflineAlert(false)
  }

  // 디버깅을 위한 상태 로그
  console.log('🔍 NetworkErrorHandler 렌더링 - isOnline:', isOnline, 'showOfflineAlert:', showOfflineAlert)
  
  // 오프라인 상태일 때 오프라인 UI 표시
  if (!isOnline) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '300px',
          p: 4,
          backgroundColor: 'var(--color-card-bg)',
          borderRadius: 2,
          border: '1px solid #444'
        }}
      >
        {/* 오프라인 아이콘 */}
        <WifiOff 
          sx={{ 
            fontSize: 64, 
            color: 'var(--color-danger)', 
            mb: 2 
          }} 
        />

        {/* 오프라인 제목 */}
        <Typography 
          variant="h5" 
          color="text.primary"
          sx={{ mb: 2, textAlign: 'center' }}
        >
          인터넷 연결이 끊어졌습니다
        </Typography>

        {/* 오프라인 설명 */}
        <Typography 
          variant="body1" 
          color="text.secondary"
          sx={{ mb: 3, textAlign: 'center', maxWidth: 500 }}
        >
          네트워크 연결을 확인하고 다시 시도해주세요.
          연결이 복구되면 자동으로 재시도됩니다.
        </Typography>

        {/* 연결 확인 버튼 */}
        <Button
          variant="contained"
          startIcon={isCheckingConnection ? <Refresh sx={{ animation: 'spin 1s linear infinite' }} /> : <Refresh />}
          onClick={handleCheckConnection}
          disabled={isCheckingConnection || retryCount >= 5} // 5회 이상 재시도 시 비활성화
          sx={{
            backgroundColor: 'var(--color-primary)',
            '&:hover': {
              backgroundColor: 'var(--color-accent)',
            },
            '&:disabled': {
              backgroundColor: '#444',
              color: '#666',
            },
            '@keyframes spin': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' }
            }
          }}
        >
          {isCheckingConnection ? '연결 확인 중...' : '연결 확인'}
        </Button>

        {/* 네트워크 상태 정보 표시 */}
        <Box sx={{ mt: 2, p: 2, backgroundColor: 'var(--color-bg)', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            🔧 <strong>디버깅 정보:</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            • navigator.onLine: {String(navigator.onLine)}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            • 컴포넌트 isOnline: {String(isOnline)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • 테스트: F12 → Network 탭 → Offline 체크박스
          </Typography>
        </Box>

        {/* 연결 상태 안내 */}
        <Box sx={{ mt: 4, p: 3, backgroundColor: 'var(--color-bg)', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            🔍 <strong>연결 상태 확인:</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            • Wi-Fi 또는 모바일 데이터 연결을 확인해주세요
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            • 네트워크 설정을 확인해주세요
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            • 다른 웹사이트가 정상적으로 로드되는지 확인해주세요
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • 연결이 복구되면 자동으로 재시도됩니다
          </Typography>
          {retryCount > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              • 재시도 횟수: {retryCount}/5
            </Typography>
          )}
        </Box>
      </Box>
    )
  }

  return (
    <>
      {/* 자식 컴포넌트 렌더링 */}
      {children}

      {/* 디버깅용 테스트 버튼들 (개발 모드에서만 표시) */}
      {import.meta.env.DEV && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            backgroundColor: 'var(--color-card-bg)',
            padding: 2,
            borderRadius: 2,
            border: '1px solid var(--color-accent)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
          }}
        >
          <Typography variant="caption" color="var(--color-accent)" sx={{ mb: 1 }}>
            🔧 네트워크 테스트 (개발용)
          </Typography>
          
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              console.log('🔧 수동 오프라인 시뮬레이션')
              // 실제 네트워크 상태를 변경하는 대신 컴포넌트 상태만 변경
              setIsOnline(false)
              setShowOfflineAlert(true)
              console.log('❌ 오프라인 상태로 강제 전환')
            }}
            sx={{ 
              borderColor: 'var(--color-danger)', 
              color: 'var(--color-danger)',
              fontSize: '12px',
              padding: '4px 8px'
            }}
          >
            오프라인 시뮬레이션
          </Button>

          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              console.log('🔧 수동 온라인 시뮬레이션')
              // 실제 네트워크 상태를 변경하는 대신 컴포넌트 상태만 변경
              setIsOnline(true)
              setShowOfflineAlert(false)
              console.log('✅ 온라인 상태로 강제 복구')
              toast.success('네트워크 연결이 복구되었습니다.')
            }}
            sx={{ 
              borderColor: 'var(--color-success)', 
              color: 'var(--color-success)',
              fontSize: '12px',
              padding: '4px 8px'
            }}
          >
            온라인 시뮬레이션
          </Button>

          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              console.log('🔧 현재 상태 확인')
              console.log('navigator.onLine:', navigator.onLine)
              console.log('컴포넌트 isOnline:', isOnline)
              console.log('showOfflineAlert:', showOfflineAlert)
            }}
            sx={{ 
              borderColor: 'var(--color-accent)', 
              color: 'var(--color-accent)',
              fontSize: '12px',
              padding: '4px 8px'
            }}
          >
            상태 확인
          </Button>
        </Box>
      )}

      {/* 오프라인 알림 스낵바 */}
      <Snackbar
        open={showOfflineAlert}
        autoHideDuration={6000}
        onClose={handleCloseOfflineAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseOfflineAlert}
          severity="warning"
          icon={<SignalWifiStatusbarConnectedNoInternet4 />}
          sx={{
            backgroundColor: 'var(--color-danger)',
            color: 'white',
            '& .MuiAlert-icon': {
              color: 'white'
            }
          }}
        >
          <Typography variant="body2">
            인터넷 연결이 불안정합니다. 연결을 확인해주세요.
          </Typography>
        </Alert>
      </Snackbar>
    </>
  )
}

export default NetworkErrorHandler 