import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  Add,
  Edit,
  Visibility,
  Movie,
  Drafts,
  CheckCircle,
  Schedule
} from '@mui/icons-material';
import type { Scene, SceneDraft } from '../../scene/services/sceneService';

interface SceneListSectionProps {
  scenes: Scene[];
  draftScenes: SceneDraft[];
  isGeneratingScenes: boolean;
  onOpenSceneModal: () => void;
  projectId: string;
  onSceneClick?: (scene: Scene | SceneDraft) => void;
}

const SceneListSection: React.FC<SceneListSectionProps> = ({
  scenes,
  draftScenes,
  isGeneratingScenes,
  onOpenSceneModal,
  projectId,
  onSceneClick
}) => {
  const navigate = useNavigate();

  const handleSceneClick = (scene: Scene | SceneDraft) => {
    if (onSceneClick) {
      onSceneClick(scene);
    } else {
      // 기본 동작: 직접 네비게이션
      const isDraft = draftScenes.some(draft => draft.order === scene.order);
      if (isDraft) {
        navigate(`/project/${projectId}/scene-draft/${scene.order}`, {
          state: {
            draftScene: scene,
            draftOrder: scene.order
          }
        });
      } else {
        const sceneId = '_id' in scene ? scene._id : scene.order;
        navigate(`/project/${projectId}/scene/${sceneId}`);
      }
    }
  };

  const allScenes = [...scenes, ...draftScenes].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <Box sx={{ p: 3 }}>
      {/* 헤더 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          씬 리스트 ({scenes.length}개 저장됨, {draftScenes.length}개 초안)
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={onOpenSceneModal}
          disabled={isGeneratingScenes}
        >
          {isGeneratingScenes ? '씬 생성 중...' : 'AI 씬 생성'}
        </Button>
      </Box>

      {/* 로딩 상태 */}
      {isGeneratingScenes && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary" align="center">
            AI가 씬을 생성하고 있습니다...
          </Typography>
        </Box>
      )}

      {/* 씬 목록 */}
      {allScenes.length > 0 ? (
        <Grid container spacing={2}>
          {allScenes.map((scene) => {
            // draft 씬인지 확인 (draftScenes 배열에 있는지 체크)
            const isDraft = draftScenes.some(draft => draft.order === scene.order);
            const sceneKey = isDraft ? `draft_${scene.order}` : `scene_${('_id' in scene ? scene._id : scene.order)}`;

            return (
              <Grid item xs={12} md={6} lg={4} key={sceneKey} {...({} as any)}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: 3,
                      transform: 'translateY(-2px)',
                      transition: 'all 0.2s ease-in-out'
                    }
                  }}
                  onClick={() => handleSceneClick(scene)}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" component="h3">
                        씬 {scene.order}
                      </Typography>
                      <Chip 
                        label={isDraft ? '초안' : '저장됨'} 
                        size="small" 
                        color={isDraft ? 'warning' : 'success'}
                        icon={isDraft ? <Drafts /> : <CheckCircle />}
                      />
                    </Box>
                    
                    <Typography variant="h6" gutterBottom>
                      {scene.title}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {scene.description?.substring(0, 100)}...
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                      <Chip 
                        label={scene.timeOfDay} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                      <Chip 
                        label={scene.estimatedDuration} 
                        size="small" 
                        color="secondary" 
                        variant="outlined"
                      />
                      {scene.location?.name && (
                        <Chip 
                          label={scene.location.name} 
                          size="small" 
                          color="info" 
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </CardContent>
                  
                  <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="씬 상세보기">
                        <IconButton size="small">
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="씬 편집">
                        <IconButton size="small">
                          <Edit />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    
                    {isDraft && (
                      <Chip 
                        label="저장 필요" 
                        size="small" 
                        color="warning" 
                        variant="outlined"
                      />
                    )}
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        /* 씬이 없는 경우 */
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Movie sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            아직 씬이 없습니다
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            AI를 사용하여 프로젝트의 시놉시스와 스토리를 기반으로 씬을 생성해보세요.
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={onOpenSceneModal}
            disabled={isGeneratingScenes}
            size="large"
          >
            AI 씬 생성하기
          </Button>
        </Box>
      )}

      {/* 정보 알림 */}
      {draftScenes.length > 0 && (
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            {draftScenes.length}개의 초안 씬이 있습니다. 씬을 클릭하여 편집하고 저장하세요.
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default SceneListSection; 