import React, { useState, useEffect } from 'react';
import type { Project, UpdateProjectRequest } from '../../shared/types/project';
import { useProjectStore } from '../stores/projectStore';


interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
}

const EditProjectModal: React.FC<EditProjectModalProps> = ({ isOpen, onClose, project }) => {
  const { updateProject, isLoading, error } = useProjectStore();
  const [formData, setFormData] = useState<UpdateProjectRequest>({
    title: '',
    synopsis: '',
    story: '',
    tags: [],
    isPublic: false,
    genre: [],
    estimatedDuration: '90분',
  });
  const [tagInput, setTagInput] = useState('');
  const [genreInput, setGenreInput] = useState('');

  // 프로젝트 데이터로 폼 초기화
  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title,
        synopsis: project.synopsis || '',
        story: project.story || '',
        tags: project.tags || [],
        isPublic: project.isPublic,
        genre: project.genre || [],
        estimatedDuration: project.estimatedDuration || '90분',
      });
      setTagInput('');
      setGenreInput('');
    }
  }, [project]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || [],
    }));
  };

  const handleAddGenre = () => {
    if (genreInput.trim() && !formData.genre?.includes(genreInput.trim())) {
      setFormData(prev => ({
        ...prev,
        genre: [...(prev.genre || []), genreInput.trim()],
      }));
      setGenreInput('');
    }
  };

  const handleRemoveGenre = (genreToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      genre: prev.genre?.filter(genre => genre !== genreToRemove) || [],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!project?._id) {
      alert('프로젝트 정보를 찾을 수 없습니다.');
      return;
    }

    if (!formData.title || !formData.synopsis?.trim() || formData.genre?.length === 0) {
      alert('제목, 시놉시스, 장르는 필수 항목입니다.');
      return;
    }

    try {
      await updateProject(project._id, formData);
      onClose();
    } catch (error) {
      console.error('프로젝트 수정 실패:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, type: 'tag' | 'genre') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (type === 'tag') {
        handleAddTag();
      } else {
        handleAddGenre();
      }
    }
  };

  if (!isOpen || !project) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>프로젝트 수정</h2>
          <button className="close-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="project-form">
          <div className="form-group">
            <label htmlFor="title">프로젝트 제목 *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="프로젝트 제목을 입력하세요"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="synopsis">시놉시스 *</label>
            <textarea
              id="synopsis"
              name="synopsis"
              value={formData.synopsis}
              onChange={handleInputChange}
              placeholder="프로젝트의 간단한 시놉시스를 입력하세요"
              rows={3}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="story">스토리</label>
            <textarea
              id="story"
              name="story"
              value={formData.story}
              onChange={handleInputChange}
              placeholder="상세한 스토리 내용을 입력하세요 (선택사항)"
              rows={6}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="estimatedDuration">예상 시간</label>
              <input
                type="text"
                id="estimatedDuration"
                name="estimatedDuration"
                value={formData.estimatedDuration}
                onChange={handleInputChange}
                placeholder="90분"
              />
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleInputChange}
                />
                공개 프로젝트
              </label>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="genreInput">장르 *</label>
            <div className="tag-input-container">
              <input
                type="text"
                id="genreInput"
                value={genreInput}
                onChange={(e) => setGenreInput(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, 'genre')}
                placeholder="장르를 입력하고 Enter를 누르세요"
              />
              <button
                type="button"
                className="add-tag-btn"
                onClick={handleAddGenre}
                disabled={!genreInput.trim()}
              >
                추가
              </button>
            </div>
            {formData.genre && formData.genre.length > 0 && (
              <div className="tags-container">
                {formData.genre.map((genre, index) => (
                  <span key={`genre_${index}_${genre}`} className="tag">
                    {genre}
                    <button
                      type="button"
                      onClick={() => handleRemoveGenre(genre)}
                      className="remove-tag-btn"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="tagInput">태그</label>
            <div className="tag-input-container">
              <input
                type="text"
                id="tagInput"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, 'tag')}
                placeholder="태그를 입력하고 Enter를 누르세요"
              />
              <button
                type="button"
                className="add-tag-btn"
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
              >
                추가
              </button>
            </div>
            {formData.tags && formData.tags.length > 0 && (
              <div className="tags-container">
                {formData.tags.map((tag, index) => (
                  <span key={`tag_${index}_${tag}`} className="tag">
                    {tag}
                    <button
                      type="button"
                      className="remove-tag-btn"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={isLoading}
            >
              취소
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={isLoading}
            >
              {isLoading ? '수정 중...' : '프로젝트 수정'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProjectModal; 