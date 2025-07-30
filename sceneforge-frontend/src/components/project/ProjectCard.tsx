import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Project } from '../../types/project';
import { ROUTES } from '../../constants/routes';
import './ProjectCard.css';

interface ProjectCardProps {
  project: Project;
  onEdit?: (project: Project) => void;
  onDelete?: (projectId: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ 
  project, 
  onEdit, 
  onDelete 
}) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`${ROUTES.PROJECT}/${project._id}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(project);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('정말로 이 프로젝트를 삭제하시겠습니까?')) {
      onDelete?.(project._id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="project-card" onClick={handleCardClick}>
      <div className="project-card-header">
        <div className="project-title">
          <h3>{project.title}</h3>
          <span className="visibility-badge">
            {project.isPublic ? '공개' : '비공개'}
          </span>
        </div>
        <div className="project-actions">
          <div className="action-dropdown">
            <button className="more-btn" title="더보기">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
            </button>
            <div className="dropdown-menu">
              <button onClick={handleEdit}>수정</button>
              <button onClick={handleDelete} className="delete-btn">삭제</button>
            </div>
          </div>
        </div>
      </div>

      <div className="project-content">
        {project.synopsis && (
          <p className="project-synopsis">{project.synopsis}</p>
        )}
        
        <div className="project-meta">
          <div className="meta-item">
            <span className="meta-label">장르:</span>
            <span className="meta-value">{project.genre.join(', ')}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">예상 시간:</span>
            <span className="meta-value">{project.estimatedDuration}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">참여자:</span>
            <span className="meta-value">{project.participants.length}명</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">장면:</span>
            <span className="meta-value">{project.scenes.length}개</span>
          </div>
        </div>

        {project.tags.length > 0 && (
          <div className="project-tags">
            {project.tags.map((tag, index) => (
              <span key={`tag_${index}_${tag}`} className="tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="project-footer">
        <div className="project-info">
          <span className="created-date">
            생성일: {formatDate(project.createdAt)}
          </span>
          <span className="last-viewed">
            최근 조회: {formatDate(project.lastViewedAt)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard; 