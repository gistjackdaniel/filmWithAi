import React, { useState, useEffect } from 'react';
import type { Project } from '../../types/project';
import { projectService } from '../../services/projectService';
import './StoryEditModal.css';

interface StoryEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onSave: (story: string) => Promise<void>;
}

const StoryEditModal: React.FC<StoryEditModalProps> = ({
  isOpen,
  onClose,
  project,
  onSave
}) => {
  const [storyText, setStoryText] = useState('');
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (project) {
      setStoryText(project.story || '');
    }
  }, [project]);

  const handleSave = async () => {
    if (!project) return;
    
    setIsSaving(true);
    try {
      await onSave(storyText);
      // 저장 성공 시에만 모달 닫기
      onClose();
    } catch (error) {
      console.error('스토리 저장 실패:', error);
      alert('스토리 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (isGeneratingStory || isSaving) return; // 생성 중이거나 저장 중이면 취소 불가
    setStoryText(project?.story || '');
    onClose();
  };

  const handleGenerateStory = async () => {
    if (!project || !project.synopsis) return;
    
    setIsGeneratingStory(true);
    try {
      // AI 스토리 생성 API 호출
      const response = await projectService.generateStory(project._id);
      setStoryText(response.story || '');
    } catch (error) {
      console.error('스토리 생성 실패:', error);
      alert('스토리 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsGeneratingStory(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>스토리 편집</h2>
          <button className="close-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="story-actions">
            <button 
              onClick={handleGenerateStory} 
              className="generate-btn" 
              disabled={isGeneratingStory || isSaving || !project?.synopsis}
            >
              {isGeneratingStory ? '생성 중...' : 'AI 스토리 생성'}
            </button>
            {!project?.synopsis && (
              <span className="warning-text">시놉시스가 없어서 AI 생성이 불가능합니다.</span>
            )}
          </div>

          <div className="story-input-container">
            <label htmlFor="story-textarea">스토리 내용</label>
            <textarea
              id="story-textarea"
              value={storyText}
              onChange={(e) => setStoryText(e.target.value)}
              placeholder="스토리를 입력하거나 AI 생성 버튼을 클릭하세요..."
              className="story-textarea"
              rows={15}
              disabled={isGeneratingStory || isSaving}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button 
            onClick={handleCancel} 
            className="cancel-btn"
            disabled={isGeneratingStory || isSaving}
          >
            취소
          </button>
          <button 
            onClick={handleSave} 
            className="save-btn"
            disabled={isSaving || isGeneratingStory}
          >
            {isSaving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoryEditModal; 