import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Chip, IconButton, Tooltip, Typography, Button } from '@mui/material';
import { Movie, Videocam, ZoomIn, ZoomOut, AutoAwesome } from '@mui/icons-material';
import TimelineRuler from './TimelineRuler.tsx';
import Playhead from './elements/Playhead.tsx';
import Track from './elements/Track.tsx';
import Clip from './elements/Clip.tsx';
import GridLines from './elements/GridLines.tsx';
import { pixelsPerSecondFromZoom, getDurationSeconds, timeToPixels, accumulateUntil, type TimelineCutLike, formatTimeFromSeconds, clamp } from '../../../shared/utils/timeline';
import { useTimelineStore } from '../../stores/timelineStore';
import { useSceneStore } from '../../../scene/stores/sceneStore';
import { useCutStore } from '../../../cut/stores/cutStore';
import { cutService, type Cut } from '../../../cut/services/cutService';
import { timelineClipService } from '../../services/timelineClipService';
import { Snackbar, Alert } from '@mui/material';

const VIDEO_TRACKS = ['V3', 'V2', 'V1'];
const AUDIO_TRACKS = ['A1', 'A2', 'A3'];

const TimelineEditor: React.FC<{ projectId: string }> = ({ projectId }) => {
  const { scenes } = useSceneStore();
  const { cuts } = useCutStore();
  const { currentTime, zoom, setCurrentTime } = useTimelineStore();
  const [activeTrack, setActiveTrack] = useState<string>('V1');
  const [selectedClipIds, setSelectedClipIds] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const pps = useMemo(() => pixelsPerSecondFromZoom(zoom), [zoom]);

  // 편집 기능과 동기화된 상태
  const [showV1, setShowV1] = useState(true);
  const [showV2, setShowV2] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [v2Videos, setV2Videos] = useState<any[]>([]);
  const [sceneCutsMap, setSceneCutsMap] = useState<Record<string, Cut[]>>({});
  const [loadingCuts, setLoadingCuts] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 씬의 컷을 평면화
  const flatCuts: (TimelineCutLike & { sceneNumber?: number; sceneTitle?: string })[] = useMemo(() => {
    const orderedScenes = [...scenes].sort((a: any, b: any) => (a?.order ?? 0) - (b?.order ?? 0));
    const result: (TimelineCutLike & { sceneNumber?: number; sceneTitle?: string })[] = [];
    orderedScenes.forEach((scene: any) => {
      const list: Cut[] = sceneCutsMap[scene._id] ? [...sceneCutsMap[scene._id]] : [] as Cut[];
      const orderedCuts = list.sort((a: any, b: any) => (a?.order ?? 0) - (b?.order ?? 0));
      orderedCuts.forEach((cut: any) => {
        result.push({
          id: cut._id,
          shotNumber: cut.shotNumber ?? cut.order,
          title: cut.title,
          description: cut.description,
          duration: (cut as any).duration,
          estimatedDuration: (cut as any).estimatedDuration,
          imageUrl: cut.imageUrl,
          sceneId: scene._id,  // sceneId 추가
          sceneNumber: scene.scene,
          sceneTitle: scene.title,
        });
      });
    });
    return result;
  }, [scenes, sceneCutsMap]);

  // 컷 API 보강 로드
  useEffect(() => {
    const loadAll = async () => {
      if (!projectId || !scenes || scenes.length === 0) return;
      setLoadingCuts(true);
      try {
        const entries = await Promise.all(
          scenes.map(async (s) => {
            try {
              const list = (await cutService.findBySceneId(projectId, s._id)) as Cut[];
              return [s._id, list as Cut[]] as [string, Cut[]];
            } catch {
              return [s._id, [] as Cut[]] as [string, Cut[]];
            }
          })
        );
        const map: Record<string, Cut[]> = {};
        (entries as Array<[string, Cut[]]>).forEach(([sid, list]) => { map[sid] = list as Cut[]; });
        setSceneCutsMap(map);
      } finally {
        setLoadingCuts(false);
      }
    };
    loadAll();
  }, [projectId, scenes]);

  // 총 길이
  const totalSeconds = useMemo(() => {
    const v1 = showV1 ? flatCuts.reduce((acc, c: any) => acc + getDurationSeconds({ duration: c.duration, estimatedDuration: c.estimatedDuration }), 0) : 0;
    const v2 = showV2 ? v2Videos.reduce((acc, v) => acc + (v.duration || 0), 0) : 0;
    return Math.max(v1, v2, 60);
  }, [flatCuts, v2Videos, showV1, showV2]);

  // 재생 루프
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      useTimelineStore.getState().setCurrentTime(Math.min(totalSeconds, +(useTimelineStore.getState().currentTime + 0.1).toFixed(2)));
    }, 100);
    return () => clearInterval(id);
  }, [isPlaying, totalSeconds]);

  // 카드 너비 계산
  const v1Widths = useMemo(() => flatCuts.map((c: any) => timeToPixels(getDurationSeconds({ duration: c.duration, estimatedDuration: c.estimatedDuration }), pps)), [flatCuts, pps]);
  const v2Widths = useMemo(() => v2Videos.map((v) => timeToPixels(v.duration || 0, pps)), [v2Videos, pps]);

  // 드롭: V2 (AI 생성)
  const handleCutDropToV2 = useCallback(async (data: any) => {
    if (data?.type !== 'cut-from-v1' || !data?.cut) return;
    
    console.log('🎬 V2 드롭 처리 시작:', {
      cut: data.cut,
      sceneId: data.cut.sceneId,
      sourceCutId: data.cut.id
    });
    
    const duration = getDurationSeconds({ duration: data.cut.duration, estimatedDuration: data.cut.estimatedDuration }) || 5;
    setGenerating(true);
    try {
      const created = await timelineClipService.generateFromCut(projectId, {
        sceneId: data.cut.sceneId,
        sourceCutId: data.cut.id,
        prompt: undefined,
        resolution: '720p',
        duration: '8s',
        generate_audio: true,
        track: 'V2',
      });
    setV2Videos((prev) => [...prev, {
      id: created?._id || `ai_${Date.now()}`,
      title: data.cut.title || `컷 ${data.cut.shotNumber}`,
      description: data.cut.description,
        duration: duration || 8,
      type: 'ai_generated',
        videoUrl: created?.videoUrl,
      createdAt: new Date().toISOString(),
      sourceCut: data.cut,
    }]);
    } catch (e: any) {
      setError(e?.response?.data?.message || '비디오 생성에 실패했습니다.');
    } finally {
      setGenerating(false);
    }
  }, [projectId]);

  const v2DropHandlers = {
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.type && file.type.startsWith('video/')) {
          const objectUrl = URL.createObjectURL(file);
          const videoEl = document.createElement('video');
          videoEl.src = objectUrl;
          videoEl.preload = 'metadata';
          videoEl.onloadedmetadata = async () => {
            const d = Number.isFinite(videoEl.duration) ? Math.round(videoEl.duration) : 5;
            const created = await timelineClipService.create(projectId, {
              title: file.name.replace(/\.[^/.]+$/, ''),
              duration: d,
              videoUrl: objectUrl,
              type: 'uploaded',
              track: 'V2',
            });
            setV2Videos((prev) => [...prev, {
              id: created?._id || `up_${Date.now()}`,
              title: file.name.replace(/\.[^/.]+$/, ''),
              duration: d,
              videoUrl: objectUrl,
              type: 'uploaded',
              createdAt: new Date().toISOString(),
              fileSize: file.size,
            }]);
          };
        }
      }
      const text = e.dataTransfer.getData('application/json');
      if (text) { 
        try { 
          const data = JSON.parse(text);
          console.log('🎬 V2 드롭 데이터:', data);
          handleCutDropToV2(data); 
        } catch (error) {
          console.error('드롭 데이터 파싱 오류:', error);
        } 
      }
    }
  } as const;

  // V1 컷 드래그 시작 데이터
  const onCutDragStart = (cut: any) => (e: React.DragEvent) => {
    console.log('🎬 V1 컷 드래그 시작:', cut.title || cut.id);
    // 컷의 전체 메타데이터를 포함하여 전달
    const cutData = {
      id: cut.id,
      title: cut.title,
      description: cut.description,
      shotNumber: cut.shotNumber,
      sceneId: cut.sceneId,  // sceneId 추가
      sceneNumber: cut.sceneNumber,
      sceneTitle: cut.sceneTitle,
      duration: cut.duration,
      estimatedDuration: cut.estimatedDuration,
      imageUrl: cut.imageUrl,
      // 추가 메타데이터 필드들
      dialogue: cut.dialogue,
      narration: cut.narration,
      subjectMovement: cut.subjectMovement,
      soundEffects: cut.soundEffects,
      directorNotes: cut.directorNotes,
      cameraSetup: cut.cameraSetup,
      specialRequirements: cut.specialRequirements
    };
    e.dataTransfer.setData('application/json', JSON.stringify({ 
      type: 'cut-from-v1', 
      source: 'editor-v1', 
      cut: cutData 
    }));
  };

  // Keyboard shortcuts: space(play/pause), +/- (zoom), ←/→ (seek 1s)
  useEffect(() => {
    const isTypingTarget = (el: EventTarget | null) => {
      if (!el || !(el as HTMLElement).tagName) return false;
      const t = (el as HTMLElement).tagName.toLowerCase();
      const editable = (el as HTMLElement).getAttribute?.('contenteditable');
      return t === 'input' || t === 'textarea' || t === 'select' || editable === 'true';
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
        return;
      }
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        useTimelineStore.getState().setZoom(Math.min(32, +(zoom + 0.1).toFixed(2)));
        return;
      }
      if (e.key === '-') {
        e.preventDefault();
        useTimelineStore.getState().setZoom(Math.max(0.25, +(zoom - 0.1).toFixed(2)));
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        useTimelineStore.getState().setCurrentTime(Math.min(totalSeconds, currentTime + (e.shiftKey ? 5 : 1)));
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        useTimelineStore.getState().setCurrentTime(Math.max(0, currentTime - (e.shiftKey ? 5 : 1)));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [zoom, currentTime, totalSeconds]);

  // 스토어 동기화
  useEffect(() => { useTimelineStore.getState().setShowV1(showV1); }, [showV1]);
  useEffect(() => { useTimelineStore.getState().setShowV2(showV2); }, [showV2]);
  useEffect(() => { useTimelineStore.getState().setCurrentTime(currentTime); }, [currentTime]);
  useEffect(() => { useTimelineStore.getState().setZoom(zoom); }, [zoom]);
  useEffect(() => { useTimelineStore.getState().setFlatCuts(flatCuts as any); }, [flatCuts]);
  useEffect(() => { useTimelineStore.getState().setV2Videos(v2Videos as any); }, [v2Videos]);

  return (
    <Box sx={{ border: '1px solid #2b2f38', bgcolor: '#111318', color: '#e7e9ee', borderRadius: 1, overflow: 'hidden' }}>
      {/* Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1, py: 0.5, bgcolor: '#0c0e12', borderBottom: '1px solid #2b2f38' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip icon={<Movie />} label="V1 (컷)" size="small" variant={showV1 ? 'filled' : 'outlined'} onClick={() => setShowV1(v => !v)} />
          <Chip icon={<Videocam />} label="V2 (비디오)" size="small" variant={showV2 ? 'filled' : 'outlined'} onClick={() => setShowV2(v => !v)} />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="축소"><span><IconButton onClick={() => useTimelineStore.getState().setZoom(Math.max(0.25, +(zoom - 0.1).toFixed(2)))}><ZoomOut /></IconButton></span></Tooltip>
          <Tooltip title="확대"><span><IconButton onClick={() => useTimelineStore.getState().setZoom(Math.min(32, +(zoom + 0.1).toFixed(2)))}><ZoomIn /></IconButton></span></Tooltip>
          <Tooltip title={isPlaying ? '일시정지' : '재생'}><Button variant="contained" size="small" onClick={() => setIsPlaying(p => !p)}>{isPlaying ? '일시정지' : '재생'}</Button></Tooltip>
          <Typography variant="body2" sx={{ ml: 1 }}>{formatTimeFromSeconds(currentTime)}</Typography>
        </Box>
      </Box>
      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setError(null)} severity="error" variant="filled" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      {/* Ruler with occupied spans (V2 clips and V1 cuts) */}
      <TimelineRuler
        totalSeconds={totalSeconds}
        pixelsPerSecond={pps}
        currentTime={currentTime}
        onSeek={setCurrentTime}
        leftGutterPx={80}
        occupiedSpans={(() => {
          const spans: Array<{ start: number; end: number; color?: string }> = [];
          // V2 clips spans
          let accV2 = 0; v2Videos.forEach((v) => { const d = v.duration || 0; const s = accV2; const e = accV2 + d; spans.push({ start: s, end: e, color: '#ffd54d' }); accV2 = e; });
          // V1 cuts spans
          let accV1 = 0; flatCuts.forEach((c: any) => { const d = getDurationSeconds({ duration: c.duration, estimatedDuration: c.estimatedDuration }); const s = accV1; const e = accV1 + d; spans.push({ start: s, end: e, color: '#ffe27a' }); accV1 = e; });
          return spans;
        })()}
      />

      {/* Tracks */}
      <Box ref={containerRef} sx={{ display: 'grid', gridTemplateColumns: '80px 1fr', height: 360 }}>
        {/* Track headers */}
        <Box>
          {VIDEO_TRACKS.map((name) => (
            <Track
              key={name}
              name={name}
              type="video"
              active={activeTrack === name}
              onSelect={() => setActiveTrack(name)}
              visible={name === 'V1' ? showV1 : name === 'V2' ? showV2 : true}
              onToggleVisible={() => {
                if (name === 'V1') setShowV1((v) => !v);
                else if (name === 'V2') setShowV2((v) => !v);
              }}
            />
          ))}
          {AUDIO_TRACKS.map((name) => (
            <Track
              key={name}
              name={name}
              type="audio"
              active={activeTrack === name}
              onSelect={() => setActiveTrack(name)}
              visible={true}
              audioActive={name === 'A1' ? useTimelineStore.getState().showA1 ?? true : name === 'A2' ? useTimelineStore.getState().showA2 ?? true : useTimelineStore.getState().showA3 ?? true}
              onToggleAudio={() => {
                const st = useTimelineStore.getState();
                if (name === 'A1' && st.setShowA1) st.setShowA1(!(st.showA1 ?? true));
                if (name === 'A2' && st.setShowA2) st.setShowA2(!(st.showA2 ?? true));
                if (name === 'A3' && st.setShowA3) st.setShowA3(!(st.showA3 ?? true));
              }}
            />
          ))}
        </Box>
        {/* Track lanes (가로 스크롤 담당) */}
        <Box sx={{ position: 'relative', overflowX: 'auto', overflowY: 'hidden', bgcolor: activeTrack.startsWith('V') ? '#0b0f1a' : '#0b0e14' }} onClick={() => setSelectedClipIds([])}>
          <Box sx={{ position: 'relative', width: `${totalSeconds * pps}px`, height: '100%' }}>
            <GridLines totalSeconds={totalSeconds} pixelsPerSecond={pps} height={360} />
            { /* lane index helper */ }
            { /* V3 lane (placeholder for now) */ }
            <Box sx={{ position: 'absolute', left: 0, right: 0, top: `${8 + 56 * 0}px`, height: 56 }} />

            {/* V2 lane (videos) */}
            {showV2 && (
              <Box {...v2DropHandlers} sx={{ position: 'absolute', left: 0, right: 0, top: `${8 + 56 * 1}px`, height: 56 }}>
                {v2Videos.length === 0 ? (
                  <Box sx={{ position: 'absolute', left: 8, top: 8, border: '2px dashed #3a4253', borderRadius: 2, px: 2, py: 1, display: 'inline-flex', alignItems: 'center', gap: 1, color: '#aab2c0' }}>
                    <AutoAwesome fontSize="small" /> {generating ? '생성 중...' : 'V1에서 드래그하거나 비디오 파일을 드롭'}
                  </Box>
                ) : null}
                {(() => {
                  let acc = 0; return (
                    <>
                      {v2Videos.map((v, i) => {
                        const start = acc; const dur = v.duration || 0; acc += dur;
                        return <Clip key={v.id} id={v.id} title={v.title} kind="video" start={start} duration={dur} top={8} height={60} pps={pps} track="V2"
                          selected={selectedClipIds.includes(v.id)}
                          onSelect={(id, multi) => {
                            setActiveTrack('V2');
                            setSelectedClipIds((prev) => {
                              if (multi) {
                                return prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
                              }
                              return [id];
                            });
                          }}
                          onChange={(id, next) => {
                          setV2Videos((prev) => prev.map((item, idx) => idx === i ? { ...item, ...next } : item));
                        }} />;
                      })}
                    </>
                  );
                })()}
              </Box>
            )}

            {/* V1 lane (cuts) */}
            {showV1 && flatCuts.length > 0 && (() => {
              let acc = 0;
              return (
                <>
                  {flatCuts.map((c, i) => {
                    const start = acc; const dur = getDurationSeconds({ duration: (c as any).duration, estimatedDuration: (c as any).estimatedDuration }); acc += dur;
                    return (
                      <Clip 
                        key={c.id}
                        id={`cut-${c.id}`} 
                        title={c.title || `컷 ${c.shotNumber}`} 
                        kind="image" 
                        start={start} 
                        duration={dur} 
                        top={8 + 56 * 2} 
                        height={44} 
                        pps={pps} 
                        track="V1"
                        draggable={true}
                        onDragStart={onCutDragStart(c)}
                        selected={selectedClipIds.includes(`cut-${c.id}`)}
                        onSelect={(id, multi) => {
                          setActiveTrack('V1');
                          setSelectedClipIds((prev) => {
                            if (multi) {
                              return prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
                            }
                              return [id];
                          });
                        }}
                      />
                    );
                  })}
                </>
              );
            })()}

            {/* Audio lanes A1, A2, A3 */}
            <Clip id="aud-a1" title="A1 오디오" kind="audio" start={0} duration={Math.max(5, totalSeconds)} top={8 + 56 * 3} height={44} pps={pps} track="A1" />
            <Clip id="aud-a2" title="A2 오디오" kind="audio" start={0} duration={Math.max(5, totalSeconds)} top={8 + 56 * 4} height={44} pps={pps} track="A2" />
            <Clip id="aud-a3" title="A3 오디오" kind="audio" start={0} duration={Math.max(5, totalSeconds)} top={8 + 56 * 5} height={44} pps={pps} track="A3" />

            {/* Playhead */}
            <Playhead currentTime={currentTime} pixelsPerSecond={pps} height={360} />
          </Box>
          {/* 좌/우 확대/축소 드래그형 원형 핸들 (뷰포트 양끝에 고정) */}
          <Box onMouseDown={(e) => {
               e.stopPropagation();
               const startX = e.clientX;
               const baseZoom = zoom;
               const viewportPx = (containerRef.current?.clientWidth || 1);
               const onMove = (ev: MouseEvent) => {
                 const dx = ev.clientX - startX; // 좌우 이동
                 // 왼쪽 핸들: 오른쪽으로 당기면 확대, 왼쪽으로 당기면 축소
                 const factor = 1 + dx / Math.max(50, viewportPx);
                 const next = clamp(baseZoom * factor, 0.25, 32);
                 useTimelineStore.getState().setZoom(+next.toFixed(2));
               };
               const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
               window.addEventListener('mousemove', onMove);
               window.addEventListener('mouseup', onUp);
             }}
             sx={{ position: 'absolute', left: 8, bottom: 8, width: 12, height: 12, borderRadius: '50%', border: '1px solid #2b2f38', background: '#e6d067', boxShadow: '0 0 0 1px #b6a64f inset', cursor: 'ew-resize' }} />
          <Box onMouseDown={(e) => {
               e.stopPropagation();
               const startX = e.clientX;
               const baseZoom = zoom;
               const viewportPx = (containerRef.current?.clientWidth || 1);
               const onMove = (ev: MouseEvent) => {
                 const dx = ev.clientX - startX;
                 // 오른쪽 핸들: 오른쪽으로 당기면 축소, 왼쪽으로 당기면 확대
                 const factor = 1 - dx / Math.max(50, viewportPx);
                 const next = clamp(baseZoom * factor, 0.25, 32);
                 useTimelineStore.getState().setZoom(+next.toFixed(2));
               };
               const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
               window.addEventListener('mousemove', onMove);
               window.addEventListener('mouseup', onUp);
             }}
             sx={{ position: 'absolute', right: 8, bottom: 8, width: 12, height: 12, borderRadius: '50%', border: '1px solid #2b2f38', background: '#e6d067', boxShadow: '0 0 0 1px #b6a64f inset', cursor: 'ew-resize' }} />
        </Box>
      </Box>

      {/* Footer controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1, bgcolor: '#0c0e12', borderTop: '1px solid #2b2f38' }}>
        <Typography variant="body2">Zoom: {zoom.toFixed(2)}x</Typography>
      </Box>
    </Box>
  );
};

export default TimelineEditor;


