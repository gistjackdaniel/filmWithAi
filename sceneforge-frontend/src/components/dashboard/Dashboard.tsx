import React, { useState, useEffect } from 'react';
import type { User } from '../../types/auth';
import type { Project } from '../../types/project';
import { useAuthStore } from '../../stores/authStore';
import { useProjectStore } from '../../stores/projectStore';
import ProjectCard from '../project/ProjectCard';
import CreateProjectModal from '../project/CreateProjectModal';
import EditProjectModal from '../project/EditProjectModal';
import LoadingSpinner from '../common/LoadingSpinner';
import './Dashboard.css';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const { 
    projects, 
    isLoading, 
    error, 
    showFavorites,
    fetchProjects, 
    fetchFavoriteProjects,
    deleteProject, 
    setShowFavorites 
  } = useProjectStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreateProject = () => {
    setShowCreateModal(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject(projectId);
    } catch (error) {
      console.error('프로젝트 삭제 실패:', error);
    }
  };

  const handleToggleFavorites = () => {
    if (showFavorites) {
      fetchProjects();
    } else {
      fetchFavoriteProjects();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return <LoadingSpinner message="프로젝트를 불러오는 중..." />;
  }

  return (
    <div className="dashboard">
      {/* 헤더 */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>SceneForge</h1>
          <p className="welcome-message">
            안녕하세요, <strong>{user.name}</strong>님!
          </p>
        </div>
        <div className="header-right">
          <div className="user-info">
            <img 
              src={user.picture || '/default-avatar.png'} 
              alt={user.name}
              className="user-avatar"
            />
            <span className="user-name">{user.name}</span>
          </div>
          <button className="logout-btn" onClick={onLogout}>
            로그아웃
          </button>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="dashboard-content">
        {/* 상단 액션 바 */}
        <div className="action-bar">
          <div className="action-left">
            <button 
              className="create-project-btn"
              onClick={handleCreateProject}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
              새 프로젝트
            </button>
          </div>
          
          <div className="action-right">
            <div className="filter-controls">
              <button 
                className={`favorites-btn ${showFavorites ? 'active' : ''}`}
                onClick={handleToggleFavorites}
                title="즐겨찾기 프로젝트만 보기"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                {showFavorites ? '전체 보기' : '즐겨찾기'}
              </button>
            </div>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* 프로젝트 그리드 */}
        <div className="projects-section">
          <div className="projects-header">
            <h2>{showFavorites ? '즐겨찾기 프로젝트' : '프로젝트 목록'}</h2>
            <span className="project-count">
              총 {projects.length}개의 프로젝트
            </span>
          </div>

          {projects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
              </div>
              <h3>
                {showFavorites ? '즐겨찾기된 프로젝트가 없습니다' : '프로젝트가 없습니다'}
              </h3>
              <p>
                {showFavorites 
                  ? '즐겨찾기할 프로젝트를 선택해보세요.' 
                  : '새로운 프로젝트를 생성하여 영화 제작을 시작해보세요.'
                }
              </p>
              {!showFavorites && (
                <button 
                  className="create-first-project-btn"
                  onClick={handleCreateProject}
                >
                  첫 프로젝트 생성하기
                </button>
              )}
            </div>
          ) : (
            <div className="projects-grid">
              {projects.filter(project => project && project._id).map((project) => (
                <ProjectCard
                  key={project._id}
                  project={project}
                  onEdit={handleEditProject}
                  onDelete={handleDeleteProject}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 프로젝트 생성 모달 */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {/* 프로젝트 수정 모달 */}
      <EditProjectModal
        isOpen={!!editingProject}
        onClose={() => setEditingProject(null)}
        project={editingProject}
      />
    </div>
  );
};

export default Dashboard; 