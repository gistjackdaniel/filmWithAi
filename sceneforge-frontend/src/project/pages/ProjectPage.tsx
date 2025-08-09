import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Chip,
  Grid,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  LinearProgress,
  Alert,
  Snackbar,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import {
  ArrowBack,
  Save,
  PlayArrow,
  Edit,
  Delete,
  Add,
  List,
  Book,
  Schedule,
  Movie,
  Videocam,
  CloudUpload,
  Refresh,
  Settings,
  Info,
  CheckCircle,
  Error,
  Warning,
  Print,
  Visibility,
  Timeline,
  ViewList,
  Create,
  Star,
  StarBorder
} from '@mui/icons-material';
import { useAuthStore } from '../../auth/stores/authStore';
import { useProjectStore } from '../stores/projectStore';
import { useSceneStore } from '../../scene/stores/sceneStore';
import { useCutStore } from '../../cut/stores/cutStore';
import { ROUTES } from '../../shared/constants/routes';

import { sceneService, type Scene, type SceneDraft } from '../../scene/services/sceneService';

import toast from 'react-hot-toast';
import type { Project } from '../../shared/types/project';
import ProjectInfoCard from '../components/ProjectInfoCard';
import SceneListSection from '../components/SceneListSection';
import StoryEditModal from '../components/StoryEditModal';
import SceneGenerationModal from '../../scene/components/SceneGenerationModal';


interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`project-tabpanel-${index}`}
      aria-labelledby={`project-tab-${index}`}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `project-tab-${index}`,
    'aria-controls': `project-tabpanel-${index}`,
  };
}

/**
 * 프로젝트 상세 페이지 컴포넌트
 * 특정 프로젝트의 상세 정보를 표시하고 편집 기능을 제공
 * URL 파라미터로 프로젝트 ID를 받아 해당 프로젝트 정보를 로드
 */
const ProjectPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  
  // 스토어에서 상태와 액션 가져오기
  const { 
    currentProject, 
    loading: projectLoading, 
    error: projectError, 
    fetchProject, 
    updateProject 
  } = useProjectStore();
  
  const {
    scenes,
    loading: scenesLoading,
    error: scenesError,
    fetchScenes,
    createScene,
    updateScene,
    deleteScene
  } = useSceneStore();
  
  const {
    cuts,
    loading: cutsLoading,
    error: cutsError,
    fetchCutsByScene,
    createCut,
    updateCut,
    deleteCut
  } = useCutStore();

  // 로컬 상태 관리
  const [activeTab, setActiveTab] = useState(0);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showSceneModal, setShowSceneModal] = useState(false);
  const [showSceneDetailModal, setShowSceneDetailModal] = useState(false);
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Project | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [draftScenes, setDraftScenes] = useState<SceneDraft[]>([]);
  const [isGeneratingScenes, setIsGeneratingScenes] = useState(false);

  // 프로젝트 ID가 변경될 때마다 데이터 로드
  useEffect(() => {
    if (projectId) {
      fetchProject(projectId);
      fetchScenes(projectId);
      // 컷은 씬별로 로드되므로 여기서는 로드하지 않음
      
      // localStorage에서 draft 씬 로드
      const draftKey = `scene_drafts_${projectId}`;
      const draftData = localStorage.getItem(draftKey);
      if (draftData) {
        try {
          const draftScenes = JSON.parse(draftData);
          setDraftScenes(draftScenes);
        } catch (error) {
          console.error('localStorage에서 draft 씬 로드 실패:', error);
          setDraftScenes([]);
        }
      }
    }
  }, [projectId, fetchProject, fetchScenes]);

  // 새로 생성된 프로젝트인지 확인하고 스토리 모달 열기
  useEffect(() => {
    if (currentProject && location.state?.isNewProject) {
      setShowStoryModal(true);
    }
  }, [currentProject, location.state]);

  // 에러 처리
  useEffect(() => {
    if (projectError) {
      toast.error(projectError);
    }
    if (scenesError) {
      toast.error(scenesError);
    }
    if (cutsError) {
      toast.error(cutsError);
    }
  }, [projectError, scenesError, cutsError]);

  // 씬 저장 이벤트 리스너
  useEffect(() => {
    const handleSceneSaved = (event: CustomEvent) => {
      if (event.detail.projectId === projectId) {
        const { savedScene, draftOrder } = event.detail;
        
        // 씬 목록을 다시 불러오기
        fetchScenes(projectId!);
        
        // 해당 draft 씬을 목록에서 제거
        setDraftScenes(prev => prev.filter(draft => draft.order !== draftOrder));
        
        toast.success('씬이 성공적으로 저장되었습니다.');
      }
    };

    // draft 씬 업데이트 이벤트 리스너
    const handleDraftUpdated = (event: CustomEvent) => {
      if (event.detail.projectId === projectId) {
        const { draftOrder, updatedScene } = event.detail;
        
        // localStorage 업데이트
        const draftKey = `scene_drafts_${projectId}`;
        const draftData = localStorage.getItem(draftKey);
        if (draftData) {
          try {
            const draftScenes = JSON.parse(draftData);
            const updatedDrafts = draftScenes.map((draft: any) => 
              draft.order === draftOrder ? updatedScene : draft
            );
            localStorage.setItem(draftKey, JSON.stringify(updatedDrafts));
            
            // 상태 업데이트
            setDraftScenes(updatedDrafts);
          } catch (error) {
            console.error('localStorage 업데이트 실패:', error);
          }
        }
      }
    };

    window.addEventListener('sceneSaved', handleSceneSaved as EventListener);
    window.addEventListener('draftUpdated', handleDraftUpdated as EventListener);
    
    return () => {
      window.removeEventListener('sceneSaved', handleSceneSaved as EventListener);
      window.removeEventListener('draftUpdated', handleDraftUpdated as EventListener);
    };
  }, [projectId, fetchScenes]);

  // 탭 변경 핸들러
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // 뒤로가기 핸들러
  const handleBackToDashboard = () => {
    navigate(ROUTES.DASHBOARD);
  };

  // 스토리 모달 핸들러
  const handleOpenStoryModal = () => {
    setShowStoryModal(true);
  };

  const handleCloseStoryModal = () => {
    setShowStoryModal(false);
  };

  const handleSaveStory = async (story: string) => {
    if (!projectId || !currentProject) return;
    
    try {
      await updateProject(projectId, { story });
      // 프로젝트 정보를 다시 불러와서 UI 업데이트
      await fetchProject(projectId);
      toast.success('스토리가 저장되었습니다.');
      setShowStoryModal(false);
    } catch (error) {
      toast.error('스토리 저장에 실패했습니다.');
    }
  };

  // 프로젝트 편집 핸들러
  const handleEdit = () => {
    setEditData(currentProject);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditData(null);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!projectId || !editData) return;
    
    
    try {
      await updateProject(projectId, editData);
      // 프로젝트 정보를 다시 불러와서 UI 업데이트
      await fetchProject(projectId);
      toast.success('프로젝트가 저장되었습니다.');
      setIsEditing(false);
      setEditData(null);
    } catch (error) {
      toast.error('프로젝트 저장에 실패했습니다.');
    }
  };

  const handleInputChange = (field: keyof Project, value: any) => {
    if (!editData) return;
    setEditData({ ...editData, [field]: value });
  };

  // 씬 생성 핸들러
  const handleGenerateScenes = async (options: { maxScenes: number }) => {
    if (!projectId) return;
    
    setIsGeneratingScenes(true);
    try {
      // Draft 씬 생성
      const draftScenes = await sceneService.createDraft(projectId, options);
      setDraftScenes(draftScenes);
      
      // localStorage에 draft 씬 저장
      const draftKey = `scene_drafts_${projectId}`;
      localStorage.setItem(draftKey, JSON.stringify(draftScenes));
      
      toast.success(`${draftScenes.length}개의 씬 초안이 생성되었습니다. 저장 버튼을 눌러 DB에 저장하세요.`);
    } catch (error) {
      console.error('씬 생성 실패:', error);
      toast.error('씬 생성에 실패했습니다.');
    } finally {
      setIsGeneratingScenes(false);
    }
  };

  const openSceneModal = () => {
    setShowSceneModal(true);
  };

  const closeSceneModal = () => {
    setShowSceneModal(false);
  };

  const clearDraftScenes = () => {
    setDraftScenes([]);
  };

  // 씬 상세 보기 핸들러
  const handleViewScene = (scene: Scene) => {
    setSelectedScene(scene);
    setShowSceneDetailModal(true);
  };

  // 씬 클릭 핸들러 - SceneDetailPage나 SceneDraftDetailPage로 이동
  const handleSceneClick = (scene: Scene | SceneDraft) => {
    if (!projectId) return;
    
    // draft 씬인지 확인 (draftScenes 배열에 있는지 체크)
    const isDraft = draftScenes.some(draft => draft.order === scene.order);
    
    if (isDraft) {
      // draft 씬 클릭 시 SceneDraftDetailPage로 이동
      navigate(`/project/${projectId}/scene-draft/${scene.order}`, {
        state: {
          draftScene: scene,
          draftOrder: scene.order
        }
      });
    } else {
      // 저장된 씬 클릭 시 SceneDetailPage로 이동
      const sceneId = '_id' in scene ? scene._id : scene.order;
      navigate(`/project/${projectId}/scene/${sceneId}`);
    }
  };

  // 씬 편집 핸들러
  const handleEditScene = (scene: Scene) => {
    // 씬 편집 로직
    console.log('씬 편집:', scene);
  };

  // Draft 씬 저장 핸들러
  const handleSaveDraft = async (draftScene: SceneDraft) => {
    if (!projectId) return;
    
    try {
      // Draft를 실제 씬으로 저장
      const savedScene = await sceneService.create(projectId, draftScene);
      
      // 씬 목록 새로고침
      await fetchScenes(projectId);
      
      // localStorage에서 해당 draft 제거
      const draftKey = `scene_drafts_${projectId}`;
      const draftData = localStorage.getItem(draftKey);
      if (draftData) {
        try {
          const draftScenes = JSON.parse(draftData);
          const updatedDrafts = draftScenes.filter((draft: any) => draft.order !== draftScene.order);
          localStorage.setItem(draftKey, JSON.stringify(updatedDrafts));
          
          // 상태 업데이트
          setDraftScenes(updatedDrafts);
        } catch (error) {
          console.error('localStorage 업데이트 실패:', error);
        }
      }
      
      toast.success('씬이 성공적으로 저장되었습니다.');
    } catch (error) {
      console.error('씬 저장 실패:', error);
      toast.error('씬 저장에 실패했습니다.');
    }
  };

  // 컷 생성 핸들러
  const handleGenerateCutsForScene = async (scene: Scene) => {
    if (!projectId) return;
    
    try {
      // 컷 생성 로직
      toast.success('컷이 생성되었습니다.');
    } catch (error) {
      toast.error('컷 생성에 실패했습니다.');
    }
  };

  // 프로젝트 상태 라벨 가져오기
  const getProjectStatusLabel = (status?: string): string => {
    switch (status) {
      case 'production_ready': return '촬영 준비 완료';
      case 'scene_ready': return '씬 준비 완료';
      case 'story_ready': return '스토리 준비 완료';
      default: return '초안';
    }
  };

  // 프로젝트 상태 색상 가져오기
  const getProjectStatusColor = (status?: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status) {
      case 'production_ready': return 'success';
      case 'scene_ready': return 'info';
      case 'story_ready': return 'warning';
      default: return 'default';
    }
  };

  // 로딩 중일 때 로딩 화면 표시
  if (projectLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>로딩 중...</Typography>
      </Box>
    );
  }

  // 프로젝트가 없을 때 에러 화면 표시
  if (!currentProject) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>프로젝트를 찾을 수 없습니다.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* 헤더 */}
      <Box sx={{ 
        p: 3, 
        bgcolor: 'background.paper', 
        borderBottom: 1, 
        borderColor: 'divider',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={handleBackToDashboard}
            variant="outlined"
          >
            대시보드로
          </Button>
          <Typography variant="h4">
            {currentProject.title || '프로젝트'}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* 저장 버튼 */}
          <Button
            startIcon={<Save />}
            onClick={handleSave}
            disabled={!isEditing}
            title={!isEditing ? '편집 모드에서만 저장 가능합니다' : '프로젝트 저장'}
            variant="outlined"
          >
            저장
          </Button>

          {/* 스토리 생성 버튼 */}
          <Button
            startIcon={<Create />}
            onClick={handleOpenStoryModal}
            variant="outlined"
          >
            스토리 생성
          </Button>

          {/* 씬 생성 버튼 */}
          <Button
            startIcon={<Add />}
            onClick={openSceneModal}
            variant="contained"
          >
            씬 생성
          </Button>
        </Box>
      </Box>

      {/* 메인 컨텐츠 */}
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {/* 프로젝트 정보 헤더 */}
        <Box sx={{ mb: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
          <Typography variant="h4" gutterBottom>
            {currentProject.title}
          </Typography>

          {/* 프로젝트 상태 정보 */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
            <Chip
              label={getProjectStatusLabel(currentProject.status)}
              color={getProjectStatusColor(currentProject.status)}
              size="small"
            />
            <Typography variant="body2" color="text.secondary">
              생성일: {new Date(currentProject.createdAt).toLocaleDateString()}
            </Typography>
            {scenes.length > 0 && (
              <Typography variant="body2" color="text.secondary">
                씬: {scenes.length}개
              </Typography>
            )}
            {cuts.length > 0 && (
              <Typography variant="body2" color="text.secondary">
                컷: {cuts.length}개
              </Typography>
            )}
          </Box>

          {/* 시놉시스 섹션 */}
          {currentProject.synopsis && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                시놉시스
              </Typography>
              <Typography variant="body1" paragraph>
                {currentProject.synopsis}
              </Typography>
            </Box>
          )}

          {/* 스토리 섹션 */}
          {currentProject.story && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                스토리
              </Typography>
              <Typography variant="body1" paragraph>
                {currentProject.story}
              </Typography>
            </Box>
          )}
        </Box>

        {/* 탭 네비게이션 */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="프로젝트 탭">
            <Tab label="프로젝트 정보" {...a11yProps(0)} />
            <Tab label="씬 관리" {...a11yProps(1)} />
            <Tab label="컷 타임라인" {...a11yProps(2)} />
            <Tab label="스케줄링" {...a11yProps(3)} />
            <Tab label="브레이크다운" {...a11yProps(4)} />
          </Tabs>
        </Box>

        {/* 프로젝트 정보 탭 */}
        <TabPanel value={activeTab} index={0}>
            <ProjectInfoCard 
              project={editData || currentProject}
              isEditing={isEditing}
              onInputChange={handleInputChange}
              onSave={handleSave}
              onCancel={handleCancel}
              onEdit={handleEdit}
            />
        </TabPanel>

        {/* 씬 관리 탭 */}
        <TabPanel value={activeTab} index={1}>
                         <SceneListSection
               scenes={scenes}
               draftScenes={draftScenes}
               isGeneratingScenes={isGeneratingScenes}
               onOpenSceneModal={openSceneModal}
               projectId={projectId!}
               onSceneClick={handleSceneClick}
               onSaveDraft={handleSaveDraft}
             />
        </TabPanel>

        {/* 컷 타임라인 탭 */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              컷 타임라인
            </Typography>
            {cuts.length > 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  컷 타임라인 컴포넌트는 준비 중입니다.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  컷이 없습니다
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  씬에서 컷을 생성해보세요.
                </Typography>
              </Box>
            )}
          </Box>
        </TabPanel>

        {/* 스케줄링 탭 */}
        <TabPanel value={activeTab} index={3}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              스케줄링
            </Typography>
            <Typography variant="body2" color="text.secondary">
              스케줄링 기능은 준비 중입니다.
            </Typography>
          </Box>
        </TabPanel>

        {/* 브레이크다운 탭 */}
        <TabPanel value={activeTab} index={4}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              브레이크다운
            </Typography>
            <Typography variant="body2" color="text.secondary">
              브레이크다운 기능은 준비 중입니다.
            </Typography>
          </Box>
        </TabPanel>
      </Container>

      {/* 스토리 편집 모달 */}
      <StoryEditModal
        open={showStoryModal}
        onClose={handleCloseStoryModal}
        onSave={handleSaveStory}
        story={currentProject.story || ''}
        projectId={projectId}
      />

      {/* 씬 생성 모달 */}
      <SceneGenerationModal
        isOpen={showSceneModal}
        onClose={closeSceneModal}
        onGenerate={handleGenerateScenes}
        isGenerating={isGeneratingScenes}
      />
    </Box>
  );
};

export default ProjectPage; 