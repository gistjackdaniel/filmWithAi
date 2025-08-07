import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import { Close, Save, Create } from '@mui/icons-material';
import type { Project } from '../../shared/types/project';
import { projectService } from '../services/projectService';
import toast from 'react-hot-toast';

interface StoryEditModalProps {
  open: boolean;
  onClose: () => void;
  story: string;
  onSave: (story: string) => Promise<void>;
  projectId?: string;
}

const StoryEditModal: React.FC<StoryEditModalProps> = ({
  open,
  onClose,
  story,
  onSave,
  projectId
}) => {
  const [storyText, setStoryText] = useState('');
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setStoryText(story || '');
  }, [story, open]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(storyText);
      toast.success('스토리가 저장되었습니다.');
      onClose();
    } catch (error) {
      toast.error('스토리 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (isGeneratingStory || isSaving) return;
    setStoryText(story || '');
    onClose();
  };

  const handleGenerateStory = async () => {
    if (!projectId) {
      toast.error('프로젝트 ID가 없습니다.');
      return;
    }
    
    setIsGeneratingStory(true);
    try {
      const response = await projectService.generateStory(projectId);
      setStoryText(response.story || '');
      toast.success('스토리가 생성되었습니다.');
    } catch (error) {
      toast.error('스토리 생성에 실패했습니다.');
    } finally {
      setIsGeneratingStory(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleCancel}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '60vh',
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
        <Typography variant="h6">스토리 편집</Typography>
        <Button
          onClick={handleCancel}
          disabled={isGeneratingStory || isSaving}
          sx={{ minWidth: 'auto' }}
        >
          <Close />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            startIcon={isGeneratingStory ? <CircularProgress size={16} /> : <Create />}
            onClick={handleGenerateStory}
            disabled={isGeneratingStory || isSaving || !projectId}
            sx={{ mb: 2 }}
          >
            {isGeneratingStory ? '생성 중...' : 'AI 스토리 생성'}
          </Button>
          
          {!projectId && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              프로젝트 ID가 없어서 AI 생성이 불가능합니다.
            </Alert>
          )}
        </Box>

        <TextField
          fullWidth
          multiline
          rows={15}
          value={storyText}
          onChange={(e) => setStoryText(e.target.value)}
          placeholder="스토리를 입력하거나 AI 생성 버튼을 클릭하세요..."
          disabled={isGeneratingStory || isSaving}
          sx={{
            '& .MuiInputBase-root': {
              fontFamily: 'monospace',
              fontSize: '14px'
            }
          }}
        />
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
        <Button 
          onClick={handleCancel}
          disabled={isGeneratingStory || isSaving}
          variant="outlined"
        >
          취소
        </Button>
        <Button 
          onClick={handleSave}
          disabled={isSaving || isGeneratingStory}
          variant="contained"
          startIcon={isSaving ? <CircularProgress size={16} /> : <Save />}
        >
          {isSaving ? '저장 중...' : '저장'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StoryEditModal; 