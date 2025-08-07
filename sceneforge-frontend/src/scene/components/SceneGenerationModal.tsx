import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import { Close, Add, AutoAwesome } from '@mui/icons-material';

interface SceneGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (options: { maxScenes: number }) => void;
  isGenerating: boolean;
}

const SceneGenerationModal: React.FC<SceneGenerationModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  isGenerating
}) => {
  const [maxScenes, setMaxScenes] = useState<number>(5);
  const [error, setError] = useState<string>('');

  const handleGenerate = () => {
    if (maxScenes >= 1 && maxScenes <= 20) {
      setError('');
      onGenerate({ maxScenes });
      onClose();
    } else {
      setError('1-20 사이의 숫자를 입력해주세요.');
    }
  };

  const handleClose = () => {
    if (!isGenerating) {
      setError('');
      onClose();
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '300px',
          bgcolor: 'background.paper'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesome color="primary" />
          <Typography variant="h6">AI 씬 생성</Typography>
        </Box>
        <Button
          onClick={handleClose}
          disabled={isGenerating}
          sx={{ minWidth: 'auto' }}
        >
          <Close />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            AI가 프로젝트의 시놉시스와 스토리를 기반으로 씬을 생성합니다.
          </Typography>
          
          <TextField
            fullWidth
            type="number"
            label="생성할 씬 개수"
            value={maxScenes}
            onChange={(e) => {
              const value = Number(e.target.value);
              setMaxScenes(value);
              setError('');
            }}
            inputProps={{
              min: 1,
              max: 20,
              step: 1
            }}
            disabled={isGenerating}
            helperText="1-20 사이의 숫자를 입력하세요"
            error={!!error}
          />
          
          {error && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {error}
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
        <Button 
          onClick={handleClose}
          disabled={isGenerating}
          variant="outlined"
        >
          취소
        </Button>
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || maxScenes < 1 || maxScenes > 20}
          variant="contained"
          startIcon={isGenerating ? <CircularProgress size={16} /> : <Add />}
        >
          {isGenerating ? '생성 중...' : '씬 생성하기'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SceneGenerationModal; 