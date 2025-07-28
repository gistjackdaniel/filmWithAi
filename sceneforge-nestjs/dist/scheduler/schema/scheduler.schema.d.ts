import { Document, Types } from 'mongoose';
export type SchedulerDocument = Scheduler & Document;
export declare class SchedulerTimeRange {
    start: string;
    end: string;
}
export declare class SchedulerScene {
    scene: number;
    title: string;
    description: string;
    location: {
        name: string;
        address: string;
        group_name: string;
    };
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
export declare class Scheduler {
    _id: Types.ObjectId;
    projectId: Types.ObjectId;
    day: number;
    date: string;
    location_groups: string[];
    timeRange: SchedulerTimeRange;
    scenes: SchedulerScene[];
    estimatedDuration: number;
    breakdown: any;
    isDeleted: boolean;
}
export declare const SchedulerSchema: import("mongoose").Schema<Scheduler, import("mongoose").Model<Scheduler, any, any, any, Document<unknown, any, Scheduler, any> & Scheduler & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Scheduler, Document<unknown, {}, import("mongoose").FlatRecord<Scheduler>, {}> & import("mongoose").FlatRecord<Scheduler> & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
