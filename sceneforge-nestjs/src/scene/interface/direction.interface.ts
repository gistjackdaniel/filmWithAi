import { CrewMember } from './crew-memeber.interface';

export interface Direction {
  director?: CrewMember[];
  assistantDirector?: CrewMember[];
  scriptSupervisor?: CrewMember[];
  continuity?: CrewMember[];
} 