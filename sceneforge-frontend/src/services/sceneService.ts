import api from './api';
import { API_ENDPOINTS } from '../constants';

// Request DTOs
export interface CreateSceneDraftRequest {
  maxScenes: number;
}

// Sub-schemas
export interface Dialogue {
  character: string;
  text: string;
}

export interface LightSetup {
  type: string;
  equipment: string;
  intensity: string;
}

export interface GripModifier {
  flags: string[];
  diffusion: string[];
  reflectors: string[];
  colorGels: string[];
}

export interface LightOverall {
  colorTemperature: string;
  mood: string;
}

export interface LightingSetup {
  keyLight: LightSetup;
  fillLight: LightSetup;
  backLight: LightSetup;
  backgroundLight: LightSetup;
  specialEffects: LightSetup;
  softLight: LightSetup;
  gripModifier: GripModifier;
  overall: LightOverall;
}

export interface Lighting {
  description: string;
  setup: LightingSetup;
}

export interface RealLocation {
  name: string;
  address: string;
  group_name: string;
}

export interface CrewMember {
  role: string;
  profileId?: string;
}

export interface CrewRole {
  director: CrewMember[];
  assistantDirector: CrewMember[];
  scriptSupervisor: CrewMember[];
  continuity: CrewMember[];
}

export interface Production {
  producer: CrewMember[];
  lineProducer: CrewMember[];
  productionManager: CrewMember[];
  productionAssistant: CrewMember[];
}

export interface Cinematography {
  cinematographer: CrewMember[];
  cameraOperator: CrewMember[];
  firstAssistant: CrewMember[];
  secondAssistant: CrewMember[];
  dollyGrip: CrewMember[];
}

export interface LightingCrew {
  gaffer: CrewMember[];
  bestBoy: CrewMember[];
  electrician: CrewMember[];
  generatorOperator: CrewMember[];
}

export interface Sound {
  soundMixer: CrewMember[];
  boomOperator: CrewMember[];
  soundAssistant: CrewMember[];
  utility: CrewMember[];
}

export interface Art {
  productionDesigner: CrewMember[];
  artDirector: CrewMember[];
  setDecorator: CrewMember[];
  propMaster: CrewMember[];
  makeupArtist: CrewMember[];
  costumeDesigner: CrewMember[];
  hairStylist: CrewMember[];
}

export interface Crew {
  direction: CrewRole;
  production: Production;
  cinematography: Cinematography;
  lighting: LightingCrew;
  sound: Sound;
  art: Art;
}

export interface DirectionEquipment {
  monitors: string[];
  communication: string[];
  scriptBoards: string[];
}

export interface ProductionEquipment {
  scheduling: string[];
  safety: string[];
  transportation: string[];
}

export interface CinematographyEquipment {
  cameras: string[];
  lenses: string[];
  supports: string[];
  filters: string[];
  accessories: string[];
}

export interface LightingEquipment {
  keyLights: string[];
  fillLights: string[];
  backLights: string[];
  backgroundLights: string[];
  specialEffectsLights: string[];
  softLights: string[];
  gripModifiers: GripModifier;
  power: string[];
}

export interface SoundEquipment {
  microphones: string[];
  recorders: string[];
  wireless: string[];
  monitoring: string[];
}

export interface ArtProps {
  characterProps: string[];
  setProps: string[];
}

export interface ArtEquipment {
  setConstruction: string[];
  props: ArtProps;
  setDressing: string[];
  costumes: string[];
  specialEffects: string[];
}

export interface Equipment {
  direction: DirectionEquipment;
  production: ProductionEquipment;
  cinematography: CinematographyEquipment;
  lighting: LightingEquipment;
  sound: SoundEquipment;
  art: ArtEquipment;
}

export interface CastMember {
  role: string;
  name: string;
  profileId?: string;
}

export interface ExtraMember {
  role: string;
  number: number;
}

// Scene Draft (AI generated, not saved to DB)
export interface SceneDraft {
  title: string;
  description: string;
  dialogues: Dialogue[];
  weather: string;
  lighting: Lighting;
  visualDescription: string;
  sceneDateTime: string;
  vfxRequired: boolean;
  sfxRequired: boolean;
  estimatedDuration: string;
  scenePlace: string;
  location: RealLocation;
  timeOfDay: string;
  crew: Crew;
  equipment: Equipment;
  cast: CastMember[];
  extra: ExtraMember[];
  specialRequirements: string[];
  order: number;
}

// Scene (saved to DB)
export interface Scene extends SceneDraft {
  _id: string;
  projectId: string;
  isDeleted: boolean;
}

// Request for creating a scene from draft
export interface CreateSceneRequest extends SceneDraft {}

export interface UpdateSceneRequest extends Partial<SceneDraft> {}

export const sceneService = {
  // 씬 초안 생성 (AI)
  async createDraft(projectId: string, data: CreateSceneDraftRequest): Promise<SceneDraft[]> {
    const response = await api.post<SceneDraft[]>(`${API_ENDPOINTS.PROJECTS.GET(projectId)}/scene/draft`, data);
    return response.data;
  },

  // 씬 생성
  async create(projectId: string, data: CreateSceneRequest): Promise<Scene> {
    const response = await api.post<Scene>(`${API_ENDPOINTS.PROJECTS.GET(projectId)}/scene`, data);
    return response.data;
  },

  // 씬 업데이트
  async update(projectId: string, sceneId: string, data: UpdateSceneRequest): Promise<Scene> {
    const response = await api.patch<Scene>(`${API_ENDPOINTS.PROJECTS.GET(projectId)}/scene/${sceneId}`, data);
    return response.data;
  },

  // 프로젝트의 씬 목록 조회
  async getScenes(projectId: string): Promise<Scene[]> {
    const response = await api.get<Scene[]>(`${API_ENDPOINTS.PROJECTS.GET(projectId)}/scene`);
    return response.data;
  },

  // 씬 상세 조회
  async getScene(projectId: string, sceneId: string): Promise<Scene> {
    const response = await api.get<Scene>(`${API_ENDPOINTS.PROJECTS.GET(projectId)}/scene/${sceneId}`);
    return response.data;
  },

  // 씬 삭제
  async deleteScene(projectId: string, sceneId: string): Promise<void> {
    await api.delete(`${API_ENDPOINTS.PROJECTS.GET(projectId)}/scene/${sceneId}`);
  },
}; 