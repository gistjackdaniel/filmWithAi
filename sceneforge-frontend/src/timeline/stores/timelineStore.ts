import { create } from 'zustand';

export type TimelineCut = {
  id: string;
  shotNumber?: number;
  title?: string;
  description?: string;
  duration?: number | string;
  estimatedDuration?: number | string;
  imageUrl?: string;
  sceneNumber?: number;
  sceneTitle?: string;
};

export type V2VideoItem = {
  id: string;
  title: string;
  description?: string;
  videoUrl?: string;
  duration: number;
  type: 'uploaded' | 'ai_generated';
  createdAt: string;
  sourceCut?: TimelineCut;
  fileSize?: number;
};

export type VideoItem = V2VideoItem; // 공통 비디오 아이템 형식

export type AudioItem = {
  id: string;
  title?: string;
  audioUrl: string;
  duration: number;
  createdAt?: string;
};

interface TimelineState {
  currentTime: number;
  zoom: number;
  showV1: boolean;
  showV2: boolean;
  showV3?: boolean;
  showA1?: boolean;
  showA2?: boolean;
  showA3?: boolean;
  flatCuts: TimelineCut[];
  v2Videos: VideoItem[];
  v3Videos: VideoItem[];
  a1Audios: AudioItem[];
  a2Audios: AudioItem[];
  a3Audios: AudioItem[];
  setCurrentTime: (t: number) => void;
  setZoom: (z: number) => void;
  setShowV1: (v: boolean) => void;
  setShowV2: (v: boolean) => void;
  setShowV3?: (v: boolean) => void;
  setShowA1?: (v: boolean) => void;
  setShowA2?: (v: boolean) => void;
  setShowA3?: (v: boolean) => void;
  setFlatCuts: (cuts: TimelineCut[]) => void;
  setV2Videos: (videos: VideoItem[]) => void;
  setV3Videos: (videos: VideoItem[]) => void;
  setA1Audios: (audios: AudioItem[]) => void;
  setA2Audios: (audios: AudioItem[]) => void;
  setA3Audios: (audios: AudioItem[]) => void;
}

export const useTimelineStore = create<TimelineState>((set) => ({
  currentTime: 0,
  zoom: 1,
  showV1: true,
  showV2: true,
  showV3: true,
  showA1: true,
  showA2: true,
  showA3: true,
  flatCuts: [],
  v2Videos: [],
  v3Videos: [],
  a1Audios: [],
  a2Audios: [],
  a3Audios: [],
  setCurrentTime: (t) => set({ currentTime: Math.max(0, t) }),
  setZoom: (z) => set({ zoom: Math.max(0.25, Math.min(32, z)) }),
  setShowV1: (v) => set({ showV1: v }),
  setShowV2: (v) => set({ showV2: v }),
  setShowV3: (v) => set({ showV3: v }),
  setShowA1: (v) => set({ showA1: v }),
  setShowA2: (v) => set({ showA2: v }),
  setShowA3: (v) => set({ showA3: v }),
  setFlatCuts: (cuts) => set({ flatCuts: Array.isArray(cuts) ? cuts : [] }),
  setV2Videos: (videos) => set({ v2Videos: Array.isArray(videos) ? videos : [] }),
  setV3Videos: (videos) => set({ v3Videos: Array.isArray(videos) ? videos : [] }),
  setA1Audios: (audios) => set({ a1Audios: Array.isArray(audios) ? audios : [] }),
  setA2Audios: (audios) => set({ a2Audios: Array.isArray(audios) ? audios : [] }),
  setA3Audios: (audios) => set({ a3Audios: Array.isArray(audios) ? audios : [] }),
}));

export default useTimelineStore;


