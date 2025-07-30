import React, { useState } from 'react';
import './CutGenerationModal.css';

interface CutGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (options: { maxCuts: number }) => void;
  isGenerating: boolean;
}

const CutGenerationModal: React.FC<CutGenerationModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  isGenerating
}) => {
  const [maxCuts, setMaxCuts] = useState<number | ''>(3);

  const handleGenerate = () => {
    if (typeof maxCuts === 'number' && maxCuts >= 1 && maxCuts <= 10) {
      onGenerate({
        maxCuts
      });
      // 생성 버튼을 누르면 즉시 모달 닫기
      onClose();
    } else {
      alert('1-10 사이의 숫자를 입력해주세요.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="cut-generation-modal">
        <div className="modal-header">
          <h2>AI 컷 생성</h2>
          <button className="close-btn" onClick={onClose} disabled={isGenerating}>
            ×
          </button>
        </div>
        
        <div className="modal-content">
          <div className="form-group">
            <label htmlFor="maxCuts">생성할 컷 개수</label>
            <input
              type="number"
              id="maxCuts"
              value={maxCuts}
              onChange={(e) => {
                const value = e.target.value;
                setMaxCuts(value === '' ? '' : Number(value));
              }}
              min={1}
              max={10}
              disabled={isGenerating}
              placeholder="1-10 사이의 숫자를 입력하세요"
            />
          </div>
          
          <div className="info-text">
            <p>AI가 씬의 내용을 기반으로 컷을 생성합니다.</p>
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
              '컷 생성하기'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CutGenerationModal; 