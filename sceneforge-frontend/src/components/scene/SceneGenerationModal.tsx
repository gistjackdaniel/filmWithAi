import React, { useState } from 'react';
import './SceneGenerationModal.css';

interface SceneGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (options: { maxScenes: number }) => void;
  isGenerating: boolean;
}

const SceneGenerationModal: React.FC<SceneGenerationModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  isGenerating
}) => {
  const [maxScenes, setMaxScenes] = useState<number | ''>(5);

  const handleGenerate = () => {
    if (typeof maxScenes === 'number' && maxScenes >= 1 && maxScenes <= 20) {
      onGenerate({
        maxScenes
      });
      // 생성 버튼을 누르면 즉시 모달 닫기
      onClose();
    } else {
      alert('1-20 사이의 숫자를 입력해주세요.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="scene-generation-modal">
        <div className="modal-header">
          <h2>AI 씬 생성</h2>
          <button className="close-btn" onClick={onClose} disabled={isGenerating}>
            ×
          </button>
        </div>
        
        <div className="modal-content">
          <div className="form-group">
            <label htmlFor="maxScenes">생성할 씬 개수</label>
            <input
              type="number"
              id="maxScenes"
              value={maxScenes}
              onChange={(e) => {
                const value = e.target.value;
                setMaxScenes(value === '' ? '' : Number(value));
              }}
              min={1}
              max={20}
              disabled={isGenerating}
              placeholder="1-20 사이의 숫자를 입력하세요"
            />
          </div>
          
          <div className="info-text">
            <p>AI가 프로젝트의 시놉시스와 스토리를 기반으로 씬을 생성합니다.</p>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="cancel-btn"
            onClick={onClose}
            disabled={isGenerating}
          >
            취소
          </button>
          <button
            className="generate-btn"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <div className="loading-spinner"></div>
                생성 중...
              </>
            ) : (
              '씬 생성하기'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SceneGenerationModal; 