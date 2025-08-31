import React from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import { Visibility, VisibilityOff, VolumeUp, VolumeOff } from '@mui/icons-material';

type Props = {
  name: string;
  type: 'video' | 'audio';
  active?: boolean;
  onSelect?: () => void;
  visible?: boolean;
  onToggleVisible?: () => void;
  audioActive?: boolean;
  onToggleAudio?: () => void;
};

const Track: React.FC<Props> = ({ name, type, active, onSelect, visible = true, onToggleVisible, audioActive = true, onToggleAudio }) => {
  return (
    <Box onClick={onSelect} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1, height: 56, bgcolor: active ? '#1a2333' : '#12151c', borderBottom: '1px solid #20242d', cursor: 'pointer' }}>
      <Typography variant="body2" sx={{ color: '#cdd3e0', fontWeight: 600 }}>{name}</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
        {type === 'video' && (
          <Tooltip title={visible ? '트랙 숨기기' : '트랙 보이기'}>
            <IconButton size="small" onClick={onToggleVisible} sx={{ color: visible ? '#cdd3e0' : '#667085' }}>
              {visible ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
            </IconButton>
          </Tooltip>
        )}
        {type === 'audio' && (
          <Tooltip title={audioActive ? '오디오 비활성화' : '오디오 활성화'}>
            <IconButton size="small" onClick={onToggleAudio} sx={{ color: audioActive ? '#cdd3e0' : '#667085' }}>
              {audioActive ? <VolumeUp fontSize="small" /> : <VolumeOff fontSize="small" />}
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
};

export default Track;


