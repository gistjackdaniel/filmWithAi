import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Divider,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert
} from '@mui/material';
import {
  Google as GoogleIcon,
  Email as EmailIcon,
  GitHub as GitHubIcon,
  Facebook as FacebookIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

/**
 * 인증 옵션 컴포넌트
 * 다양한 로그인 방법을 제공하는 모달 형태의 컴포넌트
 */
const AuthOptions = ({ open, onClose, onSuccess }) => {
  const [authMethod, setAuthMethod] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const { login } = useAuthStore();

  // Google OAuth 로그인 설정
  const googleLogin = useGoogleLogin({
    // 리디렉션 URI 명시적 설정
    redirect_uri: import.meta.env.VITE_REDIRECT_URI || 'http://localhost:3002',
    onSuccess: async (response) => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('Google OAuth Response:', response);
        console.log('Using access_token:', response.access_token);
        
        const result = await login(response.access_token);
        
        if (result.success) {
          toast.success('Google 로그인 성공!');
          onSuccess && onSuccess();
        } else {
          setError(new Error(result.error || 'Google 로그인에 실패했습니다.'));
        }
      } catch (error) {
        console.error('Google login error:', error);
        setError(error);
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => {
      console.error('Google OAuth Error:', error);
      setError(new Error('Google 로그인에 실패했습니다.'));
      setIsLoading(false);
    }
  });

  // 이메일/비밀번호 로그인 (향후 구현 예정)
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError(new Error('이메일 로그인은 아직 개발 중입니다. Google 로그인을 사용해주세요.'));
  };

  // GitHub 로그인 (향후 구현 예정)
  const handleGitHubLogin = () => {
    setError(new Error('GitHub 로그인은 아직 개발 중입니다. Google 로그인을 사용해주세요.'));
  };

  // Facebook 로그인 (향후 구현 예정)
  const handleFacebookLogin = () => {
    setError(new Error('Facebook 로그인은 아직 개발 중입니다. Google 로그인을 사용해주세요.'));
  };

  const handleClose = () => {
    setAuthMethod(null);
    setEmail('');
    setPassword('');
    setError(null);
    onClose();
  };

  const authMethods = [
    {
      id: 'google',
      name: 'Google',
      icon: <GoogleIcon />,
      color: '#4285F4',
      handler: () => googleLogin(),
      available: true
    },
    {
      id: 'email',
      name: '이메일',
      icon: <EmailIcon />,
      color: '#D4AF37',
      handler: () => setAuthMethod('email'),
      available: false // 개발 중
    },
    {
      id: 'github',
      name: 'GitHub',
      icon: <GitHubIcon />,
      color: '#333',
      handler: handleGitHubLogin,
      available: false // 개발 중
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: <FacebookIcon />,
      color: '#1877F2',
      handler: handleFacebookLogin,
      available: false // 개발 중
    }
  ];

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="auth-options-dialog-title"
      aria-describedby="auth-options-dialog-description"
      keepMounted={false}
      disableRestoreFocus
      PaperProps={{
        sx: {
          backgroundColor: 'var(--color-card-bg)',
          color: 'var(--color-text-primary)',
          borderRadius: 3
        }
      }}
    >
      <DialogTitle 
        id="auth-options-dialog-title"
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 1
        }}
      >
        <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
          로그인 방법 선택
        </Typography>
        <Button
          onClick={handleClose}
          sx={{ color: 'var(--color-text-secondary)' }}
        >
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent 
        id="auth-options-dialog-description"
        sx={{ pt: 2 }}
      >
        {/* 에러 메시지 */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error.message}
          </Alert>
        )}

        {/* 이메일 로그인 폼 */}
        {authMethod === 'email' ? (
          <Box component="form" onSubmit={handleEmailLogin}>
            <Typography variant="h6" gutterBottom>
              이메일로 로그인
            </Typography>
            
            <TextField
              fullWidth
              label="이메일"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2 }}
              disabled
            />
            
            <TextField
              fullWidth
              label="비밀번호"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 2 }}
              disabled
            />
            
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled
              sx={{ mb: 2 }}
            >
              로그인 (개발 중)
            </Button>
            
            <Button
              variant="text"
              onClick={() => setAuthMethod(null)}
              fullWidth
            >
              다른 방법으로 로그인
            </Button>
          </Box>
        ) : (
          /* 인증 방법 선택 */
          <Box>
            <Typography variant="body1" sx={{ mb: 3, color: 'var(--color-text-secondary)' }}>
              SceneForge에 로그인하여 영화 프로젝트를 시작하세요.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {authMethods.map((method) => (
                <Button
                  key={method.id}
                  variant="outlined"
                  size="large"
                  startIcon={method.icon}
                  onClick={method.handler}
                  disabled={isLoading || !method.available}
                  sx={{
                    justifyContent: 'flex-start',
                    py: 2,
                    px: 3,
                    borderColor: method.available ? method.color : 'var(--color-text-secondary)',
                    color: method.available ? method.color : 'var(--color-text-secondary)',
                    '&:hover': method.available ? {
                      borderColor: method.color,
                      backgroundColor: `${method.color}10`
                    } : {},
                    '&:disabled': {
                      borderColor: 'var(--color-text-secondary)',
                      color: 'var(--color-text-secondary)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {method.name}로 로그인
                    </Typography>
                    {!method.available && (
                      <Typography variant="caption" sx={{ color: 'var(--color-text-secondary)' }}>
                        개발 중
                      </Typography>
                    )}
                  </Box>
                </Button>
              ))}
            </Box>

            {/* 개발 중인 기능 안내 */}
            <Box sx={{ mt: 3, p: 2, backgroundColor: 'var(--color-bg)', borderRadius: 2 }}>
              <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)' }}>
                💡 현재는 Google 로그인만 지원됩니다.
                <br />
                다른 로그인 방법은 개발 중이며, 곧 추가될 예정입니다.
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={handleClose} sx={{ color: 'var(--color-text-secondary)' }}>
          취소
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AuthOptions; 