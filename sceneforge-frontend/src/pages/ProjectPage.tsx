import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import type { Project } from '../types/project';
import { useProjectStore } from '../stores/projectStore';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StoryEditModal from '../components/project/StoryEditModal';
import { sceneService, type Scene, type SceneDraft } from '../services/sceneService';
import SceneGenerationModal from '../components/scene/SceneGenerationModal';
import { ROUTES } from '../constants/routes';
import {
  ProjectInfoCard,
  SynopsisCard,
  StoryCard,
  SceneListSection,
  TimelineSection
} from '../components/project';
import './ProjectPage.css';

const ProjectPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchProject, currentProject, isLoading, error, updateProject } = useProjectStore();
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [draftScenes, setDraftScenes] = useState<SceneDraft[]>([]);
  const [isGeneratingScenes, setIsGeneratingScenes] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showSceneModal, setShowSceneModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Project | null>(null);
  
  // refs for dynamic height calculation
  // const leftColumnRef = useRef<HTMLDivElement>(null);
  // const storyCardRef = useRef<HTMLDivElement>(null);

  // 동적 높이 할당 함수
  // const adjustStoryCardHeight = useCallback(() => {
  //   if (leftColumnRef.current && storyCardRef.current) {
  //     const leftColumnHeight = leftColumnRef.current.offsetHeight;
  //     storyCardRef.current.style.height = `${leftColumnHeight}px`;
  //   }
  // }, []);

  // 리사이즈 이벤트 리스너
  // useEffect(() => {
  //   const handleResize = () => {
  //     adjustStoryCardHeight();
  //   };

  //   window.addEventListener('resize', handleResize);
  //   return () => window.removeEventListener('resize', handleResize);
  // }, [adjustStoryCardHeight]);

  // 컴포넌트 마운트 후 높이 조정
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     adjustStoryCardHeight();
  //   }, 100);
  //   return () => clearTimeout(timer);
  // }, [adjustStoryCardHeight, scenes, draftScenes]);

  useEffect(() => {
    if (projectId) {
      fetchProject(projectId);
      loadScenes();
    }
  }, [projectId, fetchProject]);

  const loadScenes = useCallback(async () => {
    if (!projectId) return;
    
    try {
      // 실제 DB에서 저장된 씬들 로드
      const savedScenes = await sceneService.getScenes(projectId);
      setScenes(savedScenes);
      
      // localStorage에서 해당 프로젝트의 draft 씬들 로드
      const draftKey = `scene_drafts_${projectId}`;
      const draftData = localStorage.getItem(draftKey);
      if (draftData) {
        try {
          const draftScenes = JSON.parse(draftData);
          setDraftScenes(draftScenes);
        } catch (error) {
          console.error('Draft scenes 파싱 실패:', error);
          setDraftScenes([]);
        }
      } else {
        setDraftScenes([]);
      }
    } catch (error) {
      console.error('씬 로드 실패:', error);
    }
  }, [projectId]);

  // refresh state가 있으면 최신 정보 불러오기
  useEffect(() => {
    if (location.state?.refresh && projectId) {
      // 1. 프로젝트 정보 새로고침
      fetchProject(projectId);
      
      // 2. 씬과 draft 로드
      loadScenes();
      
      // state 초기화
      navigate(location.pathname, { replace: true });
    }
  }, [location.state?.refresh, projectId, fetchProject, loadScenes, navigate, location.pathname]);

  // 씬 저장 이벤트 리스너
  useEffect(() => {
    const handleDraftUpdated = (event: CustomEvent) => {
      if (event.detail.projectId === projectId) {
        const { draftOrder, updatedScene } = event.detail;
        if (updatedScene === null) {
          // draft 제거
          setDraftScenes(prev => {
            const newDrafts = prev.filter(draft => draft.order !== draftOrder);
            // localStorage 업데이트
            const draftKey = `scene_drafts_${projectId}`;
            localStorage.setItem(draftKey, JSON.stringify(newDrafts));
            return newDrafts;
          });
        } else {
          // draft 업데이트
          setDraftScenes(prev => {
            const newDrafts = prev.map(draft => 
              draft.order === draftOrder ? updatedScene : draft
            );
            // localStorage 업데이트
            const draftKey = `scene_drafts_${projectId}`;
            localStorage.setItem(draftKey, JSON.stringify(newDrafts));
            return newDrafts;
          });
        }
      }
    };

    window.addEventListener('draftUpdated', handleDraftUpdated as EventListener);
    
    return () => {
      window.removeEventListener('draftUpdated', handleDraftUpdated as EventListener);
    };
  }, [projectId]);

  const handleBackToDashboard = () => {
    navigate(ROUTES.DASHBOARD);
  };

  const handleOpenStoryModal = () => {
    setShowStoryModal(true);
  };

  const handleCloseStoryModal = () => {
    setShowStoryModal(false);
    // 모달이 닫힐 때 프로젝트 정보 다시 불러오기
    if (projectId) {
      fetchProject(projectId);
    }
  };

  const handleSaveStory = async (story: string) => {
    if (!currentProject) return;
    
    await updateProject(currentProject._id, {
      story
    });
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditData(currentProject);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData(null);
  };

  const handleSave = async () => {
    if (!editData || !currentProject) return;
    
    try {
      await updateProject(currentProject._id, {
        title: editData.title,
        synopsis: editData.synopsis,
        genre: editData.genre,
        tags: editData.tags,
        estimatedDuration: editData.estimatedDuration
      });
      
      setIsEditing(false);
      setEditData(null);
      
      // 프로젝트 정보 새로고침
      if (projectId) {
        fetchProject(projectId);
      }
      
      alert('프로젝트가 성공적으로 업데이트되었습니다.');
    } catch (error) {
      console.error('프로젝트 업데이트 실패:', error);
      alert('프로젝트 업데이트에 실패했습니다.');
    }
  };

  const handleInputChange = (field: keyof Project, value: any) => {
    if (!editData) return;
    
    setEditData({
      ...editData,
      [field]: value
    });
  };

  const handleGenerateScenes = async (options: { maxScenes: number }) => {
    if (!currentProject || !projectId) return;
    
    setIsGeneratingScenes(true);
    try {
      // 1. 기존 저장된 씬들이 있다면 모두 삭제
      if (scenes.length > 0) {
        for (const scene of scenes) {
          if ('_id' in scene) {
            await sceneService.deleteScene(projectId, scene._id);
          }
        }
        setScenes([]);
      }
      
      // 2. 기존 draft 씬들도 모두 삭제
      clearDraftScenes();
      
      // 3. 새로운 draft 씬들 생성
      const generatedScenes = await sceneService.createDraft(projectId, options);
      
      // 4. localStorage에 draft 저장
      const draftKey = `scene_drafts_${projectId}`;
      localStorage.setItem(draftKey, JSON.stringify(generatedScenes));
      
      setDraftScenes(generatedScenes);
    } catch (error) {
      console.error('씬 생성 실패:', error);
      alert('씬 생성에 실패했습니다. 다시 시도해주세요.');
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
    // localStorage에서 해당 프로젝트의 draft 제거
    if (projectId) {
      const draftKey = `scene_drafts_${projectId}`;
      localStorage.removeItem(draftKey);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="프로젝트를 불러오는 중..." />;
  }

  if (error) {
    return (
      <div className="project-page">
        <div className="error-container">
          <h2>오류가 발생했습니다</h2>
          <p>{error}</p>
          <button onClick={handleBackToDashboard} className="back-btn">
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (!currentProject) {
    console.log('🔍 ProjectPage: currentProject is null, isLoading =', isLoading, 'error =', error);
    return (
      <div className="project-page">
        <div className="not-found-container">
          <h2>프로젝트를 찾을 수 없습니다</h2>
          <p>요청하신 프로젝트가 존재하지 않거나 접근 권한이 없습니다.</p>
          <button onClick={handleBackToDashboard} className="back-btn">
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="project-page">
      {/* 헤더 */}
      <div className="project-header">
        <button onClick={handleBackToDashboard} className="back-btn">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
          대시보드로 돌아가기
        </button>
        <h1>{isEditing ? '프로젝트 편집' : currentProject.title}</h1>
        <div className="header-actions">
          {isEditing ? (
            <>
              <button onClick={handleCancel} className="header-btn cancel-btn">
                취소
              </button>
              <button onClick={handleSave} className="header-btn save-btn">
                저장
              </button>
            </>
          ) : (
            <button onClick={handleEdit} className="header-btn edit-btn">
              편집
            </button>
          )}
        </div>
      </div>

      <div className="project-content">
        {/* 메인 컨텐츠 영역 */}
        <div className="main-content">
          {/* 왼쪽 컬럼 */}
          <div className="left-column">
            <ProjectInfoCard 
              project={isEditing && editData ? editData : currentProject} 
              isEditing={isEditing}
              onInputChange={handleInputChange}
            />
            <SynopsisCard 
              synopsis={isEditing && editData ? editData.synopsis : currentProject.synopsis} 
              isEditing={isEditing}
              onInputChange={handleInputChange}
            />
            <SceneListSection
              scenes={scenes}
              draftScenes={draftScenes}
              isGeneratingScenes={isGeneratingScenes}
              onOpenSceneModal={openSceneModal}
              projectId={projectId!}
            />
          </div>

          {/* 오른쪽 컬럼 */}
          <div className="right-column">
            <StoryCard 
              story={currentProject.story} 
              onOpenStoryModal={handleOpenStoryModal}
            />
          </div>
        </div>

        {/* 하단: 컷 타임라인 (전체 너비) */}
        <TimelineSection />
      </div>

      {/* 스토리 편집 모달 */}
      <StoryEditModal
        isOpen={showStoryModal}
        onClose={handleCloseStoryModal}
        project={currentProject}
        onSave={handleSaveStory}
      />

      {/* 씬 생성 모달 */}
      <SceneGenerationModal
        isOpen={showSceneModal}
        onClose={closeSceneModal}
        onGenerate={handleGenerateScenes}
        isGenerating={isGeneratingScenes}
      />
    </div>
  );
};

export default ProjectPage; 