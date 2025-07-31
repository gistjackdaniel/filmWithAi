import { create } from 'zustand';
import { sceneService, type Scene, type SceneDraft } from '../services/sceneService';

interface SceneState {
  scenes: Scene[];
  loading: boolean;
  error: string | null;
  fetchScenes: (projectId: string) => Promise<void>;
  createScene: (projectId: string, sceneData: SceneDraft) => Promise<void>;
  updateScene: (projectId: string, sceneId: string, sceneData: Partial<SceneDraft>) => Promise<void>;
  deleteScene: (projectId: string, sceneId: string) => Promise<void>;
}

export const useSceneStore = create<SceneState>((set, get) => ({
  scenes: [],
  loading: false,
  error: null,

  fetchScenes: async (projectId: string) => {
    set({ loading: true, error: null });
    try {
      const scenes = await sceneService.getScenes(projectId);
      set({ scenes, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '씬을 불러오는데 실패했습니다.', 
        loading: false 
      });
    }
  },

  createScene: async (projectId: string, sceneData: SceneDraft) => {
    set({ loading: true, error: null });
    try {
      const newScene = await sceneService.create(projectId, sceneData);
      set(state => ({
        scenes: [...state.scenes, newScene],
        loading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '씬 생성에 실패했습니다.', 
        loading: false 
      });
    }
  },

  updateScene: async (projectId: string, sceneId: string, sceneData: Partial<SceneDraft>) => {
    set({ loading: true, error: null });
    try {
      const updatedScene = await sceneService.update(projectId, sceneId, sceneData);
      set(state => ({
        scenes: state.scenes.map(scene => 
          scene._id === sceneId ? updatedScene : scene
        ),
        loading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '씬 수정에 실패했습니다.', 
        loading: false 
      });
    }
  },

  deleteScene: async (projectId: string, sceneId: string) => {
    set({ loading: true, error: null });
    try {
      await sceneService.deleteScene(projectId, sceneId);
      set(state => ({
        scenes: state.scenes.filter(scene => scene._id !== sceneId),
        loading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '씬 삭제에 실패했습니다.', 
        loading: false 
      });
    }
  },
})); 