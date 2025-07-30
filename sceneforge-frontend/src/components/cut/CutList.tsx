import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Cut, CutDraft } from '../../services/cutService';
import { isCutDraft, isCut } from '../../services/cutService';
import './CutList.css';

interface CutListProps {
  cuts: (Cut | CutDraft)[];
  draftCuts: CutDraft[];
  projectId: string;
  sceneId: string;
  onCutClick?: (cut: Cut | CutDraft) => void;
  onGenerateImage?: (cutId: string) => Promise<void>;
  generatingImages?: Set<string>;
  isGeneratingCuts?: boolean;
}

const CutList: React.FC<CutListProps> = ({ cuts, draftCuts, projectId, sceneId, onCutClick, onGenerateImage, generatingImages = new Set(), isGeneratingCuts = false }) => {
  const navigate = useNavigate();

  const handleCutClick = (cut: Cut | CutDraft) => {
    // 이미지 생성 중이면 클릭 비활성화
    if (generatingImages.size > 0) {
      return;
    }

    if (onCutClick) {
      onCutClick(cut);
    } else {
      // draft 여부에 따라 다른 페이지로 이동
      const isDraft = draftCuts.some(draft => draft.order === cut.order);
      
      if (isDraft) {
        // CutDraftDetailPage로 이동
        const cutId = `temp_${cut.order}`;
        navigate(`/project/${projectId}/scene/${sceneId}/cut-draft/${cutId}`, {
          state: {
            draftCut: cut,
            draftOrder: cut.order - 1 // 0-based index
          }
        });
      } else {
        // CutDetailPage로 이동
        const cutId = isCut(cut) ? cut._id : `temp_${cut.order}`;
        navigate(`/project/${projectId}/scene/${sceneId}/cut/${cutId}`);
      }
    }
  };

  const handleGenerateImage = async (cut: Cut | CutDraft, event: React.MouseEvent) => {
    event.stopPropagation(); // 컷 클릭 이벤트 방지
    
    if (!onGenerateImage) return;
    
    const cutId = isCut(cut) ? cut._id : `temp_${cut.order}`;
    await onGenerateImage(cutId);
  };

  if (isGeneratingCuts) {
    return (
      <div className="cuts-container">
        <div className="generating-cuts">
          <p>컷을 생성하고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (cuts.length === 0) {
    return (
      <div className="cuts-container">
        <div className="empty-cuts">
          <p>아직 생성된 컷이 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cuts-container">
      <div className="cuts-scroll">
        {cuts.map((cut, index) => {
          // draftCuts 배열에서 같은 order를 가진 컷이 있는지 확인
          const isDraft = draftCuts.some(draft => draft.order === cut.order);
          const cutKey = isDraft ? `draft_${cut.order}` : `cut_${index}`;

          const cutId = isCut(cut) ? cut._id : `temp_${cut.order}`;
          const isGenerating = generatingImages.has(cutId);

          const isGeneratingAnyImage = generatingImages.size > 0;
          
          return (
            <div
              key={cutKey}
              className={`cut-card ${isDraft ? 'cut-draft' : 'cut-saved'} ${isGeneratingAnyImage ? 'cut-disabled' : ''}`}
              onClick={() => handleCutClick(cut)}
            >
              <div className="cut-number">
                컷 {cut.order}
              </div>
              <div className="cut-content">
                {!isDraft && isCut(cut) && cut.imageUrl && (
                  <div className="cut-image-preview">
                    <img src={`http://localhost:5001${cut.imageUrl}`} alt={`컷 ${cut.order} 이미지`} />
                  </div>
                )}
                <h3>{cut.title}</h3>
                <p>{cut.description}</p>
                <div className="cut-details">
                  <span className="cut-duration">
                    {cut.estimatedDuration || 5}초
                  </span>
                  {cut.cameraSetup?.shotSize && (
                    <span className="cut-shot-size">
                      {cut.cameraSetup.shotSize}
                    </span>
                  )}
                  {isDraft && <span className="cut-status">Draft</span>}
                </div>
                {!isDraft && onGenerateImage && (
                  <button
                    className="cut-generate-image-btn"
                    onClick={(e) => handleGenerateImage(cut, e)}
                    disabled={isGenerating}
                  >
                    {isGenerating ? '생성 중...' : '이미지 생성'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CutList; 