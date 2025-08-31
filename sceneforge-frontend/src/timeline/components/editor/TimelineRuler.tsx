import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';

type Props = {
  totalSeconds: number;
  pixelsPerSecond: number;
  currentTime: number;
  onSeek: (t: number) => void;
  leftGutterPx?: number; // 트랙 헤더 너비만큼 오프셋
  occupiedSpans?: Array<{ start: number; end: number; color?: string }>; // 타임라인에 미디어가 있는 구간 표시
};

const TimelineRuler: React.FC<Props> = ({ totalSeconds, pixelsPerSecond, currentTime, onSeek, leftGutterPx = 80, occupiedSpans = [] }) => {
  const width = totalSeconds * pixelsPerSecond;
  const ticks = useMemo(() => {
    // 줌(pps)에 따라 눈금 밀도를 더 촘촘하게: 서브초 단위까지 지원
    // 초당 픽셀 수가 높을수록 더 작은 간격(stepSec)으로 눈금을 생성
    let stepSec = 10; // 기본 10초
    if (pixelsPerSecond >= 200) stepSec = 0.1;
    else if (pixelsPerSecond >= 160) stepSec = 0.2;
    else if (pixelsPerSecond >= 120) stepSec = 0.25;
    else if (pixelsPerSecond >= 80) stepSec = 0.5;
    else if (pixelsPerSecond >= 40) stepSec = 1;
    else if (pixelsPerSecond >= 20) stepSec = 2;
    else if (pixelsPerSecond >= 10) stepSec = 5;
    else stepSec = 10;

    const arr: number[] = [];
    const count = Math.ceil(totalSeconds / stepSec);
    for (let i = 0; i <= count; i += 1) {
      const t = +(i * stepSec).toFixed(6); // 부동소수 오차 방지
      arr.push(Math.min(t, totalSeconds));
    }
    return arr;
  }, [totalSeconds, pixelsPerSecond]);

  const format = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const mm = String(m).padStart(2, '0');
    const ss = String(s).padStart(2, '0');
    return `${mm}:${ss}`;
  };

  return (
    <Box sx={{ position: 'relative', height: 36, bgcolor: '#0b0e14', borderBottom: '1px solid #262c3a', overflow: 'hidden' }}>
      <Box sx={{ position: 'relative', width: `${leftGutterPx + width}px`, height: '100%' }} onClick={(e) => {
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        const x = e.clientX - rect.left;
        const adjusted = x - leftGutterPx;
        onSeek(Math.max(0, Math.min(totalSeconds, adjusted / pixelsPerSecond)));
      }}>
        {/* 좌측 트랙 헤더 영역 시각적 구분 */}
        <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${leftGutterPx}px`, bgcolor: '#0c0f15' }} />
        {/* 초 단위 눈금: 심플한 그레이, 5초/10초는 높이만 강화 */}
        {ticks.map((s) => (
          <Box
            key={s}
            sx={{
              position: 'absolute',
              left: `${leftGutterPx + s * pixelsPerSecond}px`,
              bottom: 0,
              width: 0,
              height: (Math.abs(s % 10) < 1e-6) ? '100%'
                : (Math.abs(s % 5) < 1e-6) ? '75%'
                : (Math.abs(s % 1) < 1e-6) ? '55%'
                : '35%',
              borderLeft: `1px solid ${Math.abs(s % 10) < 1e-6 ? 'rgba(207,211,220,0.55)'
                : Math.abs(s % 5) < 1e-6 ? 'rgba(207,211,220,0.32)'
                : Math.abs(s % 1) < 1e-6 ? 'rgba(207,211,220,0.22)'
                : 'rgba(207,211,220,0.14)'}`,
            }}
          />
        ))}
        {ticks.filter((s) => s % 10 === 0).map((s) => (
          <Typography key={`label-${s}`} variant="caption" sx={{ position: 'absolute', left: `${leftGutterPx + s * pixelsPerSecond + 6}px`, top: 4, color: '#e9edf5', fontSize: 11, fontWeight: 600 }}>{format(s)}</Typography>
        ))}
        {/* 미디어가 배치된 구간: 얇은 노란 라인 */}
        {occupiedSpans.map((span, idx) => {
          const startX = leftGutterPx + Math.max(0, span.start) * pixelsPerSecond;
          const endX = leftGutterPx + Math.max(0, Math.min(totalSeconds, span.end)) * pixelsPerSecond;
          const w = Math.max(1, endX - startX);
          return (
            <Box key={`occ-${idx}`} sx={{ position: 'absolute', left: `${startX}px`, top: 0, width: `${w}px`, height: 2, bgcolor: span.color || '#ffd54d' }} />
          );
        })}
        {/* Playhead marker */}
        <Box sx={{ position: 'absolute', left: `${leftGutterPx + currentTime * pixelsPerSecond}px`, top: 0, width: 2, height: '100%', bgcolor: '#3ea6ff', boxShadow: '0 0 0 1px rgba(62,166,255,0.35)' }} />
      </Box>
    </Box>
  );
};

export default TimelineRuler;


