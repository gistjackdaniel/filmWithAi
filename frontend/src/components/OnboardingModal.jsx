import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  IconButton
} from '@mui/material';
import {
  Movie as MovieIcon,
  Timeline as TimelineIcon,
  AutoAwesome as AIIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const OnboardingModal = ({ open, onClose, onComplete }) => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      label: 'SceneForge에 오신 것을 환영합니다!',
      description: 'AI 기반 영화 제작 타임라인 툴로 당신의 영화를 더 쉽게 만들어보세요.',
      icon: <MovieIcon sx={{ fontSize: 40, color: 'var(--color-accent)' }} />
    },
    {
      label: 'AI 스토리 생성',
      description: '시놉시스만 입력하면 AI가 자동으로 완전한 스토리를 생성해드립니다.',
      icon: <AIIcon sx={{ fontSize: 40, color: 'var(--color-accent)' }} />
    },
    {
      label: 'AI 콘티 생성',
      description: '생성된 스토리를 바탕으로 AI가 씬별 콘티를 자동으로 만들어줍니다.',
      icon: <AIIcon sx={{ fontSize: 40, color: 'var(--color-accent)' }} />
    },
    {
      label: '타임라인 시각화',
      description: '실사 촬영용과 AI 생성 비디오를 구분하여 직관적인 타임라인으로 확인하세요.',
      icon: <TimelineIcon sx={{ fontSize: 40, color: 'var(--color-accent)' }} />
    }
  ];

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      onComplete();
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="onboarding-dialog-title"
      aria-describedby="onboarding-dialog-description"
      keepMounted={false}
      disableRestoreFocus
      PaperProps={{
        sx: {
          background: 'rgba(47, 47, 55, 0.95)', // 반투명한 배경
          backdropFilter: 'blur(20px)', // 강한 블러 효과
          border: '1px solid rgba(212, 175, 55, 0.2)', // 반투명한 골드 테두리
          color: 'var(--color-text-primary)',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)', // 부드러운 그림자
        }
      }}
    >
      <DialogTitle 
        id="onboarding-dialog-title"
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 1
        }}
      >
        <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
          SceneForge 시작하기
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{ color: 'var(--color-text-secondary)' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent 
        id="onboarding-dialog-description"
        sx={{ pt: 2 }}
      >
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel
                StepIconComponent={() => (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {step.icon}
                  </Box>
                )}
                sx={{
                  '& .MuiStepLabel-label': {
                    color: 'var(--color-text-primary)',
                    fontWeight: 500
                  }
                }}
              >
                {step.label}
              </StepLabel>
              <StepContent>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: 'var(--color-text-secondary)',
                    mt: 1,
                    mb: 2
                  }}
                >
                  {step.description}
                </Typography>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button
          onClick={handleSkip}
          sx={{ 
            color: 'var(--color-text-secondary)',
            '&:hover': {
              color: 'var(--color-text-primary)'
            }
          }}
        >
          건너뛰기
        </Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            sx={{ 
              color: 'var(--color-text-secondary)',
              '&:hover': {
                color: 'var(--color-text-primary)'
              }
            }}
          >
            이전
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            sx={{
              backgroundColor: 'var(--color-accent)',
              color: '#000',
              '&:hover': {
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-text-primary)'
              }
            }}
          >
            {activeStep === steps.length - 1 ? '시작하기' : '다음'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default OnboardingModal; 