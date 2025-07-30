import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Scene, SceneDraft } from '../../services/sceneService';

interface SceneListSectionProps {
  scenes: Scene[];
  draftScenes: SceneDraft[];
  isGeneratingScenes: boolean;
  onOpenSceneModal: () => void;
  projectId: string;
}

const SceneListSection: React.FC<SceneListSectionProps> = ({
  scenes,
  draftScenes,
  isGeneratingScenes,
  onOpenSceneModal,
  projectId
}) => {
  const navigate = useNavigate();

  const handleSceneClick = (scene: Scene | SceneDraft) => {
    const isDraft = draftScenes.some(draft => draft.order === scene.order);
    if (isDraft) {
      // draft 씬 클릭 시
      navigate(`/project/${projectId}/scene-draft/${scene.order}`, {
        state: {
          draftScene: scene,
          draftOrder: scene.order
        }
      });
    } else {
      // 저장된 씬 클릭 시
      navigate(`/project/${projectId}/scene/${('_id' in scene ? scene._id : scene.order)}`);
    }
  };

  return (
    <div className="scenes-section">
      <div className="section-header">
        <h2>씬 리스트</h2>
        <button
          className="add-scene-btn"
          onClick={onOpenSceneModal}
          disabled={isGeneratingScenes}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
          {isGeneratingScenes ? '씬 생성 중...' : 'AI 씬 생성'}
        </button>
      </div>
      <div className="scenes-container">
        {isGeneratingScenes ? (
          <div className="scenes-loading">
            <div className="loading-spinner"></div>
            <p>AI가 씬을 생성하고 있습니다...</p>
          </div>
        ) : (
          <>
            {/* 씬 목록 */}
            {(scenes.length > 0 || draftScenes.length > 0) && (
              <div className="scenes-section-group">
                <h3 className="scenes-section-title">{scenes.length}개 저장됨, {draftScenes.length}개 초안</h3>
                <div className="scenes-scroll">
                  {/* 저장된 씬들과 draft 씬들을 합쳐서 정렬 */}
                  {[...scenes, ...draftScenes]
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((scene) => {
                      const isDraft = draftScenes.some(draft => draft.order === scene.order);
                      const sceneKey = isDraft ? `draft_${scene.order}` : `scene_${('_id' in scene ? scene._id : scene.order)}`;

                      return (
                        <div
                          key={sceneKey}
                          className={`scene-card ${isDraft ? 'scene-draft' : 'scene-saved'}`}
                          onClick={() => handleSceneClick(scene)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="scene-number">씬 {scene.order}</div>
                          <div className="scene-content">
                            <h3>{scene.title}</h3>
                            <p>{scene.description}</p>
                            <div className="scene-details">
                              <span className="scene-time">{scene.timeOfDay}</span>
                              <span className="scene-duration">{scene.estimatedDuration}</span>
                              {isDraft && <span className="scene-status">Draft</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* 씬이 없는 경우 */}
            {scenes.length === 0 && draftScenes.length === 0 && (
              <div className="empty-scenes">
                <p>아직 씬이 없습니다.</p>
                <button
                  className="add-first-scene-btn"
                  onClick={onOpenSceneModal}
                  disabled={isGeneratingScenes}
                >
                  AI 씬 생성하기
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SceneListSection; 