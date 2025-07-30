import React from 'react';

interface StoryCardProps {
  story: string | undefined;
  onOpenStoryModal: () => void;
}

const StoryCard: React.FC<StoryCardProps> = ({ story, onOpenStoryModal }) => {
  return (
    <div className="story-card">
      <div className="story-header">
        <h2>스토리</h2>
        <button onClick={onOpenStoryModal} className="edit-btn">
          수정
        </button>
      </div>
      <div className="story-content">
        {story ? (
          <p className="story-text">{story}</p>
        ) : (
          <p className="empty-story">스토리가 없습니다. 수정 버튼을 클릭하여 스토리를 작성하세요.</p>
        )}
      </div>
    </div>
  );
};

export default StoryCard; 