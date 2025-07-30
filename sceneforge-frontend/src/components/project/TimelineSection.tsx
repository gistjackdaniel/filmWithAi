import React from 'react';

const TimelineSection: React.FC = () => {
  return (
    <div className="timeline-section">
      <div className="section-header">
        <h2>컷 타임라인</h2>
        <div className="timeline-controls">
          <button className="timeline-btn">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            재생
          </button>
          <button className="timeline-btn">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
            일시정지
          </button>
        </div>
      </div>
      <div className="timeline-container">
        <div className="timeline-ruler">
          <div className="time-markers">
            {Array.from({ length: 11 }, (_, i) => (
              <div key={i} className="time-marker">
                <span className="time-label">{i * 10}s</span>
              </div>
            ))}
          </div>
        </div>
        <div className="timeline-tracks">
          <div className="track track-v1">
            <div className="track-label">V1 (스토리보드)</div>
            <div className="track-content">
              <div className="empty-timeline">
                <p>컷이 없습니다. 씬을 추가하고 컷을 생성해보세요.</p>
              </div>
            </div>
          </div>
          <div className="track track-v2">
            <div className="track-label">V2 (비디오)</div>
            <div className="track-content">
              <div className="empty-timeline">
                <p>비디오가 없습니다. 촬영하거나 AI로 생성해보세요.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineSection; 