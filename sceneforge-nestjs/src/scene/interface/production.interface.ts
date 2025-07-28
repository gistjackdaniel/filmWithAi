import { CrewMember } from './crew-memeber.interface';

export interface Production {
  producer?: CrewMember[];
  lineProducer?: CrewMember[];
  productionManager?: CrewMember[];
  productionAssistant?: CrewMember[];
} 