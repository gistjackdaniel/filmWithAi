import React from 'react'
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton,
  Box
} from '@mui/material'
import { 
  Movie,
  ArrowBack
} from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'

/**
 * 공통 헤더 컴포넌트
 * 모든 페이지에서 사용되는 헤더로, SceneForge 로고를 클릭하면 대쉬보드로 이동
 * 현재 페이지가 대쉬보드가 아닐 때만 표시됨
 */
const CommonHeader = ({ 
  title, 
  onBack, 
  showBackButton = false,
  children 
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  
  // 현재 페이지가 대쉬보드인지 확인
  const isDashboard = location.pathname === '/'
  
  /**
   * SceneForge 로고 클릭 핸들러
   * 대쉬보드에서는 새로고침, 다른 페이지에서는 대쉬보드로 이동
   */
  const handleLogoClick = () => {
    if (isDashboard) {
      // 대쉬보드에서는 새로고침
      window.location.reload()
    } else {
      // 다른 페이지에서는 대쉬보드로 이동
      navigate('/')
    }
  }
  

  
  /**
   * 뒤로가기 버튼 클릭 핸들러
   */
  const handleBackClick = () => {
    if (onBack) {
      onBack()
    } else {
      navigate(-1)
    }
  }

  return (
    <AppBar 
      position="static" 
      sx={{ 
        backgroundColor: 'var(--color-bg-secondary)',
        borderBottom: '1px solid var(--color-border)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(10px)',
        background: 'rgba(47, 47, 55, 0.95)'
      }}
    >
      <Toolbar sx={{ minHeight: '64px' }}>
        {/* 뒤로가기 버튼 (옵션) */}
        {showBackButton && (
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleBackClick}
            sx={{ mr: 2 }}
            aria-label="뒤로가기"
          >
            <ArrowBack />
          </IconButton>
        )}
        
        {/* SceneForge 로고 (클릭 가능) */}
        <Box
          onClick={handleLogoClick}
          sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            mr: 3,
            '&:hover': {
              opacity: 0.8,
              transform: 'scale(1.05)',
              transition: 'all 0.2s ease'
            }
          }}
        >
          <Movie 
            sx={{ 
              fontSize: 28, 
              color: 'var(--color-accent)', 
              mr: 1 
            }} 
          />
          <Typography 
            variant="h6" 
            component="div"
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(45deg, #D4AF37, #E6C866)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              userSelect: 'none'
            }}
          >
            SceneForge
          </Typography>
        </Box>
        
        {/* 페이지 제목 (대쉬보드가 아닐 때만 표시) */}
        {title && !isDashboard && (
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1,
              color: 'var(--color-text-primary)',
              fontWeight: 500
            }}
          >
            {title}
          </Typography>
        )}
        
        {/* 대쉬보드에서는 빈 공간으로 flexGrow 적용 */}
        {isDashboard && (
          <Box sx={{ flexGrow: 1 }} />
        )}
        
        {/* 추가 컨텐츠 (children) */}
        {children && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {children}
          </Box>
        )}
      </Toolbar>
    </AppBar>
  )
}

export default CommonHeader 