import React from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  Person,
  Movie,
  AccessTime,
  Tag
} from '@mui/icons-material';
import type { Project } from '../../types/project';

interface ProjectInfoCardProps {
  project: Project;
  isEditing?: boolean;
  onInputChange?: (field: keyof Project, value: any) => void;
  onSave?: () => void;
  onCancel?: () => void;
  onEdit?: () => void;
}

const ProjectInfoCard: React.FC<ProjectInfoCardProps> = ({ 
  project, 
  isEditing = false, 
  onInputChange,
  onSave,
  onCancel,
  onEdit
}) => {
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h2">
            프로젝트 정보
          </Typography>
          {!isEditing && onEdit && (
            <Tooltip title="편집">
              <IconButton onClick={onEdit} color="primary">
                <Edit />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Grid container spacing={3}>
          {/* 제목 */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              제목
            </Typography>
            {isEditing ? (
              <TextField
                fullWidth
                value={project.title}
                onChange={(e) => {
                  console.log('Title changed:', e.target.value);
                  onInputChange?.('title', e.target.value);
                }}
                variant="outlined"
                size="small"
              />
            ) : (
              <Typography variant="body1">{project.title}</Typography>
            )}
          </Grid>

          {/* 장르 */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              장르
            </Typography>
            {isEditing ? (
              <TextField
                fullWidth
                value={project.genre.join(', ')}
                onChange={(e) => onInputChange?.('genre', e.target.value.split(',').map(g => g.trim()))}
                variant="outlined"
                size="small"
                placeholder="액션, 드라마, 코미디"
                helperText="쉼표로 구분하여 입력하세요"
              />
            ) : (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {project.genre.map((genre, index) => (
                  <Chip key={index} label={genre} size="small" color="primary" variant="outlined" />
                ))}
              </Box>
            )}
          </Grid>

          {/* 태그 */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              태그
            </Typography>
            {isEditing ? (
              <TextField
                fullWidth
                value={project.tags.join(', ')}
                onChange={(e) => onInputChange?.('tags', e.target.value.split(',').map(t => t.trim()))}
                variant="outlined"
                size="small"
                placeholder="태그1, 태그2, 태그3"
                helperText="쉼표로 구분하여 입력하세요"
              />
            ) : (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {project.tags.map((tag, index) => (
                  <Chip key={index} label={tag} size="small" color="secondary" variant="outlined" />
                ))}
              </Box>
            )}
          </Grid>

          {/* 예상 시간 */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              예상 시간
            </Typography>
            {isEditing ? (
              <TextField
                fullWidth
                value={project.estimatedDuration}
                onChange={(e) => onInputChange?.('estimatedDuration', e.target.value)}
                variant="outlined"
                size="small"
                placeholder="120분"
                helperText="예상 상영 시간을 입력하세요"
              />
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTime fontSize="small" color="action" />
                <Typography variant="body1">{project.estimatedDuration}</Typography>
              </Box>
            )}
          </Grid>

          {/* 시놉시스 */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              시놉시스
            </Typography>
            {isEditing ? (
              <TextField
                fullWidth
                multiline
                rows={4}
                value={project.synopsis || ''}
                onChange={(e) => onInputChange?.('synopsis', e.target.value)}
                variant="outlined"
                placeholder="프로젝트의 시놉시스를 입력하세요..."
              />
            ) : (
              <Typography variant="body1" color="text.secondary">
                {project.synopsis || '시놉시스가 없습니다.'}
              </Typography>
            )}
          </Grid>

          {/* 통계 정보 */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Person color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h6">{project.participants.length}</Typography>
                  <Typography variant="caption" color="text.secondary">참여자</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Movie color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h6">{project.scenes.length}</Typography>
                  <Typography variant="caption" color="text.secondary">장면</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Tag color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h6">{project.tags.length}</Typography>
                  <Typography variant="caption" color="text.secondary">태그</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                  <AccessTime color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h6">{project.genre.length}</Typography>
                  <Typography variant="caption" color="text.secondary">장르</Typography>
                </Box>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        
        {/* 편집 모드일 때 저장/취소 버튼 */}
        {isEditing && (
          <Box sx={{ display: 'flex', gap: 2, mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={() => {
                onSave?.();
              }}
              color="primary"
            >
              저장
            </Button>
            <Button
              variant="outlined"
              startIcon={<Cancel />}
              onClick={onCancel}
              color="secondary"
            >
              취소
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectInfoCard; 