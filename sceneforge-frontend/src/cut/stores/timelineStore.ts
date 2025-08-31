import { create } from 'zustand';

export type TimelineCut = {
  id: string;
  shotNumber?: number;
  title?: string;
  description?: string;
  duration?: number;
  estimatedDuration?: number;
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

interface TimelineState {
  // 공통 재생/시간/줌
  currentTime: number;
  isPlaying: boolean;
  zoom: number;

  // 트랙 토글
  showV1: boolean;
  showV2: boolean;

  // 데이터
  flatCuts: TimelineCut[];
  v2Videos: V2VideoItem[];

  // 액션
  setCurrentTime: (t: number) => void;
  setPlaying: (p: boolean) => void;
  setZoom: (z: number) => void;
  toggleV1: () => void;
  toggleV2: () => void;
  setFlatCuts: (cuts: TimelineCut[]) => void;
  addV2Video: (video: V2VideoItem) => void;
  removeV2Video: (id: string) => void;
  setV2Videos: (videos: V2VideoItem[]) => void;
}

export const useTimelineStore = create<TimelineState>((set) => ({
  currentTime: 0,
  isPlaying: false,
  zoom: 1,
  showV1: true,
  showV2: true,
  flatCuts: [],
  v2Videos: [],

  setCurrentTime: (t) => set({ currentTime: Math.max(0, t) }),
  setPlaying: (p) => set({ isPlaying: p }),
  setZoom: (z) => set({ zoom: Math.max(0.25, Math.min(32, z)) }),
  toggleV1: () => set((s) => ({ showV1: !s.showV1 })),
  toggleV2: () => set((s) => ({ showV2: !s.showV2 })),
  setFlatCuts: (cuts) => set({ flatCuts: Array.isArray(cuts) ? cuts : [] }),
  addV2Video: (video) => set((s) => ({ v2Videos: [...s.v2Videos, video] })),
  removeV2Video: (id) => set((s) => ({ v2Videos: s.v2Videos.filter((v) => v.id !== id) })),
  setV2Videos: (videos) => set({ v2Videos: Array.isArray(videos) ? videos : [] }),
}));

export default useTimelineStore;


