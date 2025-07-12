import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  IconButton,
  Collapse
} from '@mui/material';
import {
  BugReport as DebugIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { useAuthStore } from '../stores/authStore';

/**
 * 개발자 디버깅 패널 컴포넌트
 * 개발 모드에서만 표시되며, 인증 상태와 API 정보를 확인할 수 있음
 */
const DebugPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [apiLogs, setApiLogs] = useState([]);
  const [expanded, setExpanded] = useState('auth');

  const { user, isAuthenticated, token, logout } = useAuthStore();

  // 개발 모드가 아닌 경우 렌더링하지 않음
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  // API 로그 추가 함수
  const addApiLog = (log) => {
    setApiLogs(prev => [log, ...prev.slice(0, 9)]); // 최근 10개만 유지
  };

  // 토큰 정보 파싱
  const parseToken = (token) => {
    if (!token) return null;
    
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Token parsing error:', error);
      return null;
    }
  };

  const tokenInfo = parseToken(token);

  // 로컬 스토리지 정보 가져오기
  const getLocalStorageInfo = () => {
    const items = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        try {
          items[key] = JSON.parse(localStorage.getItem(key));
        } catch {
          items[key] = localStorage.getItem(key);
        }
      }
    }
    return items;
  };

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleClearLogs = () => {
    setApiLogs([]);
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  return (
    <>
      {/* 디버그 패널 토글 버튼 */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1000,
        }}
      >
        <Button
          variant="contained"
          startIcon={<DebugIcon />}
          onClick={() => setIsOpen(!isOpen)}
          sx={{
            backgroundColor: 'var(--color-danger)',
            color: '#fff',
            '&:hover': {
              backgroundColor: 'var(--color-danger)',
              opacity: 0.8
            }
          }}
        >
          Debug
        </Button>
      </Box>

      {/* 디버그 패널 */}
      <Collapse in={isOpen}>
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 20,
            width: 400,
            maxHeight: 600,
            overflow: 'auto',
            backgroundColor: 'var(--color-card-bg)',
            color: 'var(--color-text-primary)',
            zIndex: 1000,
            border: '2px solid var(--color-danger)'
          }}
        >
          {/* 헤더 */}
          <Box sx={{ 
            p: 2, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            borderBottom: '1px solid var(--color-primary)'
          }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              🐛 Debug Panel
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                size="small"
                onClick={() => setIsVisible(!isVisible)}
                sx={{ color: 'var(--color-text-secondary)' }}
              >
                {isVisible ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
              <IconButton
                size="small"
                onClick={() => setIsOpen(false)}
                sx={{ color: 'var(--color-text-secondary)' }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

          {/* 컨텐츠 */}
          <Box sx={{ p: 2 }}>
            {/* 인증 상태 */}
            <Accordion 
              expanded={expanded === 'auth'} 
              onChange={handleAccordionChange('auth')}
              sx={{ backgroundColor: 'transparent' }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  🔐 인증 상태
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="인증 상태" 
                      secondary={isAuthenticated ? '로그인됨' : '로그아웃됨'}
                    />
                    <Chip 
                      label={isAuthenticated ? '로그인됨' : '로그아웃됨'} 
                      color={isAuthenticated ? 'success' : 'error'}
                      size="small"
                    />
                  </ListItem>
                  {user && (
                    <ListItem>
                      <ListItemText 
                        primary="사용자 정보" 
                        secondary={`${user.name} (${user.email})`}
                      />
                    </ListItem>
                  )}
                  {token && (
                    <ListItem>
                      <ListItemText 
                        primary="토큰 존재" 
                        secondary="있음"
                      />
                      <Chip label="있음" color="success" size="small" />
                    </ListItem>
                  )}
                </List>
              </AccordionDetails>
            </Accordion>

            {/* 토큰 정보 */}
            {tokenInfo && (
              <Accordion 
                expanded={expanded === 'token'} 
                onChange={handleAccordionChange('token')}
                sx={{ backgroundColor: 'transparent' }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    🎫 토큰 정보
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Issued At:</strong> {new Date(tokenInfo.iat * 1000).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Expires At:</strong> {new Date(tokenInfo.exp * 1000).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>User ID:</strong> {tokenInfo.sub}
                    </Typography>
                    {tokenInfo.aud && (
                      <Typography variant="body2">
                        <strong>Audience:</strong> {tokenInfo.aud}
                      </Typography>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            )}

            {/* 로컬 스토리지 */}
            <Accordion 
              expanded={expanded === 'storage'} 
              onChange={handleAccordionChange('storage')}
              sx={{ backgroundColor: 'transparent' }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  💾 로컬 스토리지
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                  {Object.entries(getLocalStorageInfo()).map(([key, value]) => (
                    <Box key={key} sx={{ mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {key}:
                      </Typography>
                      <Typography variant="body2" sx={{ ml: 2, wordBreak: 'break-all' }}>
                        {JSON.stringify(value, null, 2)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>

            {/* API 로그 */}
            <Accordion 
              expanded={expanded === 'api'} 
              onChange={handleAccordionChange('api')}
              sx={{ backgroundColor: 'transparent' }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  📡 API 로그
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ mb: 2 }}>
                  <Button
                    size="small"
                    onClick={handleClearLogs}
                    sx={{ mr: 1 }}
                  >
                    로그 지우기
                  </Button>
                  <Typography variant="caption" sx={{ color: 'var(--color-text-secondary)' }}>
                    최근 {apiLogs.length}개 요청
                  </Typography>
                </Box>
                <List dense>
                  {apiLogs.map((log, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={log.url}
                        secondary={`${log.method} - ${log.status} (${log.duration}ms)`}
                      />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>

            {/* 액션 버튼들 */}
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={handleRefresh}
                startIcon={<RefreshIcon />}
              >
                새로고침
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={handleLogout}
                color="error"
              >
                로그아웃
              </Button>
            </Box>
          </Box>
        </Paper>
      </Collapse>
    </>
  );
};

export default DebugPanel; 