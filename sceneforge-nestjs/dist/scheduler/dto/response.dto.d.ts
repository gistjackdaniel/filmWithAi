import { Types } from 'mongoose';
export declare class SchedulerTimeRangeResponseDto {
    start: string;
    end: string;
}
export declare class SchedulerSceneResponseDto {
    scene: number;
    title: string;
    description: string;
    timeOfDay: string;
    estimatedDuration: number;
    cast: {
        role: string;
        name: string;
    };
    costumes: string[];
    props: {
        characterProps: string[];
        setProps: string[];
    };
}
export declare class SchedulerResponseDto {
    _id: Types.ObjectId;
    projectId: Types.ObjectId;
    day: number;
    date: string;
    location_groups: string[];
    timeRange: SchedulerTimeRangeResponseDto;
    scenes: SchedulerSceneResponseDto[];
    estimatedDuration: number;
    breakdown: any;
    isDeleted: boolean;
}
