import { CrewRole } from './crew-role.interface';
import { Production } from './production.interface';
import { Cinematography } from './cinematography.interface';
import { LightingCrew } from './lighting-crew.interface';
import { Sound } from './sound.interface';
import { Art } from './art.interface';

export interface Crew {
  direction?: CrewRole;
  production?: Production;
  cinematography?: Cinematography;
  lighting?: LightingCrew;
  sound?: Sound;
  art?: Art;
} 