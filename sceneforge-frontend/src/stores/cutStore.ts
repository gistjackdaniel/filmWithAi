import { create } from 'zustand';
import { cutService, type Cut, type CutDraft } from '../services/cutService';

interface CutState {
  cuts: Cut[];
  loading: boolean;
  error: string | null;
  fetchCutsByScene: (projectId: string, sceneId: string) => Promise<void>;
  createCut: (projectId: string, sceneId: string, cutData: Partial<Cut>) => Promise<void>;
  updateCut: (projectId: string, sceneId: string, cutId: string, cutData: Partial<Cut>) => Promise<void>;
  deleteCut: (projectId: string, sceneId: string, cutId: string) => Promise<void>;
}

export const useCutStore = create<CutState>((set, get) => ({
  cuts: [],
  loading: false,
  error: null,

  fetchCutsByScene: async (projectId: string, sceneId: string) => {
    set({ loading: true, error: null });
    try {
      const cuts = await cutService.findBySceneId(projectId, sceneId);
      set({ cuts, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '컷을 불러오는데 실패했습니다.', 
        loading: false 
      });
    }
  },

  createCut: async (projectId: string, sceneId: string, cutData: Partial<Cut>) => {
    set({ loading: true, error: null });
    try {
      const newCut = await cutService.create(projectId, sceneId, cutData);
      set(state => ({
        cuts: [...state.cuts, newCut],
        loading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '컷 생성에 실패했습니다.', 
        loading: false 
      });
    }
  },

  updateCut: async (projectId: string, sceneId: string, cutId: string, cutData: Partial<Cut>) => {
    set({ loading: true, error: null });
    try {
      const updatedCut = await cutService.update(projectId, sceneId, cutId, cutData);
      set(state => ({
        cuts: state.cuts.map(cut => 
          cut._id === cutId ? updatedCut : cut
        ),
        loading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '컷 수정에 실패했습니다.', 
        loading: false 
      });
    }
  },

  deleteCut: async (projectId: string, sceneId: string, cutId: string) => {
    set({ loading: true, error: null });
    try {
      await cutService.delete(projectId, sceneId, cutId);
      set(state => ({
        cuts: state.cuts.filter(cut => cut._id !== cutId),
        loading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '컷 삭제에 실패했습니다.', 
        loading: false 
      });
    }
  },
})); 