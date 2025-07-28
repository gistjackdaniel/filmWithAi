import { GripModifier } from './grip-modifier.interface';

export interface LightingEquipment {
  keyLights?: string[];
  fillLights?: string[];
  backLights?: string[];
  backgroundLights?: string[];
  specialEffectsLights?: string[];
  softLights?: string[];
  gripModifiers?: GripModifier;
  power?: string[];
} 