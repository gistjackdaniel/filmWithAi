import React, { useMemo } from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import TimelineEditor from './editor/TimelineEditor';
import { useTimelineStore } from '../stores/timelineStore';
import { getDurationSeconds } from '../../shared/utils/timeline';

const PlayerWithTimeline: React.FC<{ projectId: string; flatCuts?: any[]; v2Videos?: any[]; showV1?: boolean; showV2?: boolean; currentTime?: number; }>
 = ({ projectId }) => {
  const { currentTime, flatCuts, v2Videos, v3Videos, a1Audios, a2Audios, a3Audios, showV1, showV2, showV3 } = useTimelineStore();
  const { setShowV1, setShowV2, setShowV3 } = useTimelineStore();

  // 상단 플레이어: V3 > V2 > V1 우선 순으로 비디오/이미지, 오디오는 A3 > A2 > A1
  const display = useMemo(() => {
    if (showV3 && v3Videos.length > 0) {
      let acc = 0;
      for (const v of v3Videos) {
        const d = v.duration || 5;
        if (currentTime >= acc && currentTime < acc + d) return { type: 'video', video: v, relative: currentTime - acc } as const;
        acc += d;
      }
    }
    if (showV2 && v2Videos.length > 0) {
      let acc = 0;
      for (const v of v2Videos) {
        const d = v.duration || 5;
        if (currentTime >= acc && currentTime < acc + d) return { type: 'video', video: v, relative: currentTime - acc } as const;
        acc += d;
      }
    }
    if (showV1 && flatCuts.length > 0) {
      let acc = 0;
      for (const c of flatCuts) {
        const d = getDurationSeconds({ duration: (c as any).duration, estimatedDuration: (c as any).estimatedDuration });
        if (currentTime >= acc && currentTime < acc + d) return { type: 'cut', cut: c, relative: currentTime - acc } as const;
        acc += d;
      }
    }
    return null;
  }, [currentTime, flatCuts, v2Videos, v3Videos, showV1, showV2, showV3]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, bgcolor: '#0b0e14' }}>
      {/* 트랙 가시성(눈) 컨트롤: V3, V2, V1 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1, pt: 1 }}>
        <Tooltip title={`V3 ${showV3 ? '숨기기' : '보이기'}`}>
          <IconButton size="small" onClick={() => setShowV3?.(!showV3)} aria-label="toggle V3 visibility" sx={{ color: showV3 ? '#cdd3e0' : '#667085' }}>
            {showV3 ? <Visibility fontSize="small"/> : <VisibilityOff fontSize="small"/>}
          </IconButton>
        </Tooltip>
        <Tooltip title={`V2 ${showV2 ? '숨기기' : '보이기'}`}>
          <IconButton size="small" onClick={() => setShowV2(!showV2)} aria-label="toggle V2 visibility" sx={{ color: showV2 ? '#cdd3e0' : '#667085' }}>
            {showV2 ? <Visibility fontSize="small"/> : <VisibilityOff fontSize="small"/>}
          </IconButton>
        </Tooltip>
        <Tooltip title={`V1 ${showV1 ? '숨기기' : '보이기'}`}>
          <IconButton size="small" onClick={() => setShowV1(!showV1)} aria-label="toggle V1 visibility" sx={{ color: showV1 ? '#cdd3e0' : '#667085' }}>
            {showV1 ? <Visibility fontSize="small"/> : <VisibilityOff fontSize="small"/>}
          </IconButton>
        </Tooltip>
      </Box>
      {/* 상단 플레이어 */}
      {display?.type === 'video' ? (
        <Box sx={{ width: '100%', height: 320, bgcolor: '#0f1115', borderRadius: 1, color: '#e7e9ee', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #2b2f38' }}>
          <Typography variant="body2">V2 비디오 재생: {display.video.title}</Typography>
        </Box>
      ) : display?.type === 'cut' ? (
        <Box sx={{ width: '100%', height: 320, bgcolor: '#0f1115', borderRadius: 1, color: '#e7e9ee', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid #2b2f38' }}>
          {(display.cut as any).imageUrl ? (
            <img
              src={(display.cut as any).imageUrl.startsWith('/') ? `http://localhost:5001${(display.cut as any).imageUrl}` : (display.cut as any).imageUrl}
              alt={(display.cut as any).title || `컷 ${(display.cut as any).shotNumber}`}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          ) : (
            <Typography variant="body2">이미지 없음 (컷 {(display.cut as any).shotNumber})</Typography>
          )}
        </Box>
      ) : (
        <Box sx={{ width: '100%', height: 320, bgcolor: '#0f1115', borderRadius: 1, color: '#e7e9ee', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #2b2f38' }}>
          <Typography variant="body2">미디어 없음</Typography>
        </Box>
      )}
      <TimelineEditor projectId={projectId} />
    </Box>
  );
};

export default PlayerWithTimeline;


