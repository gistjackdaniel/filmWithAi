export declare class SchedulerTimeRangeDto {
    start: string;
    end: string;
}
export declare class SchedulerSceneDto {
    scene: number;
    title: string;
    description: string;
    timeOfDay: string;
    cast: {
        role: string;
        name: string;
    };
    estimatedDuration: number;
    costumes: string[];
    props: {
        characterProps: string[];
        setProps: string[];
    };
}
export declare class CreateSchedulerRequestDto {
    maxDailyHours: number;
    maxWeeklyHours: number;
    restDay: number;
}
export declare class UpdateSchedulerRequestDto {
    day?: number;
    date?: string;
    location?: string;
    timeOfDay?: string;
    timeRange?: SchedulerTimeRangeDto;
    scenes?: SchedulerSceneDto[];
    estimatedDuration?: number;
    breakdown?: any;
}
