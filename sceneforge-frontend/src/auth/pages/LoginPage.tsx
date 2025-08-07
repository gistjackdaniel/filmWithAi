import React from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import LoginForm from '../components/LoginForm';

const LoginPage: React.FC = () => {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            maxWidth: 400,
            textAlign: 'center',
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom>
            SceneForge
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            영화 제작을 위한 AI 기반 프로젝트 관리 플랫폼
          </Typography>
          
          <LoginForm />
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage; 