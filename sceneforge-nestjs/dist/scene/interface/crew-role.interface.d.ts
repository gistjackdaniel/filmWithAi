import { CrewMember } from './crew-memeber.interface';
export interface CrewRole {
    director?: CrewMember[];
    assistantDirector?: CrewMember[];
    scriptSupervisor?: CrewMember[];
    continuity?: CrewMember[];
}
