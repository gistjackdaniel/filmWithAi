export interface SchedulerScene {
    scene: number;
    title: string;
    description: string;
    location: {
        name: string;
        address: string;
        group_name: string;
    };
    timeSlot: string;
    timeRange: {
        start: string;
        end: string;
    };
    timeOfDay: string;
    cast: {
        role: string;
        name: string;
    }[];
    estimatedDuration: number;
    costumes: string[];
    props: {
        characterProps: string[];
        setProps: string[];
    };
}
