import React from 'react';
import type { Project } from '../../shared/types/project';

interface SynopsisCardProps {
  synopsis: string | undefined;
  isEditing?: boolean;
  onInputChange?: (field: keyof Project, value: any) => void;
}

const SynopsisCard: React.FC<SynopsisCardProps> = ({ synopsis, isEditing = false, onInputChange }) => {
  return (
    <div className="synopsis-card">
      <h2>시놉시스</h2>
      {isEditing ? (
        <textarea
          value={synopsis || ''}
          onChange={(e) => onInputChange?.('synopsis', e.target.value)}
          className="edit-textarea"
          placeholder="시놉시스를 입력하세요"
          rows={4}
        />
      ) : (
        <p>{synopsis || '시놉시스가 없습니다.'}</p>
      )}
    </div>
  );
};

export default SynopsisCard; 