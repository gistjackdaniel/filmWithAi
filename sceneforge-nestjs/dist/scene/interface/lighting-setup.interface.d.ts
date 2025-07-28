import { LightSetup } from './light-setup.interface';
import { GripModifier } from './grip-modifier.interface';
import { LightOverall } from './light-overall.interface';
export interface LightingSetup {
    keyLight?: LightSetup;
    fillLight?: LightSetup;
    backLight?: LightSetup;
    backgroundLight?: LightSetup;
    specialEffects?: LightSetup;
    softLight?: LightSetup;
    gripModifier?: GripModifier;
    overall?: LightOverall;
}
