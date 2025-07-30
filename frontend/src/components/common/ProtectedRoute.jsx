import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'

/**
 * 보호된 라우트 컴포넌트
 * 인증된 사용자만 접근할 수 있는 페이지를 보호하는 HOC (Higher Order Component)
 * 
 * @param {React.ReactNode} children - 보호할 컴포넌트
 * @returns {React.ReactNode} 인증된 사용자면 children, 아니면 리다이렉트
 */
const ProtectedRoute = ({ children }) => {
  // Zustand 스토어에서 인증 상태 가져오기
  const { isAuthenticated, loading } = useAuthStore()

  // 로딩 중일 때는 아무것도 렌더링하지 않음 (스플래시 화면이 표시됨)
  if (loading) {
    return null
  }

  // 인증되지 않은 사용자는 메인 페이지로 리다이렉트
  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  // 인증된 사용자는 요청한 컴포넌트 렌더링
  return children
}

export default ProtectedRoute 