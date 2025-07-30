import React from 'react';
import type { Project } from '../../types/project';

interface ProjectInfoCardProps {
  project: Project;
  isEditing?: boolean;
  onInputChange?: (field: keyof Project, value: any) => void;
}

const ProjectInfoCard: React.FC<ProjectInfoCardProps> = ({ project, isEditing = false, onInputChange }) => {
  return (
    <div className="info-card">
      <h2>프로젝트 정보</h2>
      <div className="info-grid">
        <div className="info-item">
          <label>제목</label>
          {isEditing ? (
            <input
              type="text"
              value={project.title}
              onChange={(e) => onInputChange?.('title', e.target.value)}
              className="edit-input"
            />
          ) : (
            <span>{project.title}</span>
          )}
        </div>
        <div className="info-item">
          <label>장르</label>
          {isEditing ? (
            <input
              type="text"
              value={project.genre.join(', ')}
              onChange={(e) => onInputChange?.('genre', e.target.value.split(',').map(g => g.trim()))}
              className="edit-input"
              placeholder="장르를 쉼표로 구분하여 입력하세요"
            />
          ) : (
            <span>{project.genre.join(', ')}</span>
          )}
        </div>
        <div className="info-item">
          <label>태그</label>
          {isEditing ? (
            <input
              type="text"
              value={project.tags.join(', ')}
              onChange={(e) => onInputChange?.('tags', e.target.value.split(',').map(t => t.trim()))}
              className="edit-input"
              placeholder="태그를 쉼표로 구분하여 입력하세요"
            />
          ) : (
            <span>{project.tags.join(', ')}</span>
          )}
        </div>
        <div className="info-item">
          <label>예상 시간</label>
          {isEditing ? (
            <input
              type="text"
              value={project.estimatedDuration}
              onChange={(e) => onInputChange?.('estimatedDuration', e.target.value)}
              className="edit-input"
              placeholder="예상 시간을 입력하세요 (예: 120분)"
            />
          ) : (
            <span>{project.estimatedDuration}</span>
          )}
        </div>
        <div className="info-item">
          <label>참여자</label>
          <span>{project.participants.length}명</span>
        </div>
        <div className="info-item">
          <label>장면 수</label>
          <span>{project.scenes.length}개</span>
        </div>
      </div>
    </div>
  );
};

export default ProjectInfoCard; 