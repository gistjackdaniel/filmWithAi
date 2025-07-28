export declare class CreateProjectRequestDto {
    title: string;
    synopsis?: string;
    story?: string;
    tags: string[];
    isPublic?: boolean;
    genre: string[];
    estimatedDuration?: string;
}
export declare class FindProjectDetailRequestDto {
    profileId: string;
    _id: string;
}
export declare class PullFavoriteRequestDto {
    profileId: string;
    projectId: string;
}
export declare class PushFavoriteRequestDto {
    profileId: string;
    projectId: string;
}
export declare class SearchProjectRequestDto {
    profileId: string;
}
declare const UpdateProjectRequestDto_base: import("@nestjs/common").Type<Partial<CreateProjectRequestDto>>;
export declare class UpdateProjectRequestDto extends UpdateProjectRequestDto_base {
}
export declare class DeleteProjectRequestDto {
    profileId: string;
    _id: string;
}
export declare class RestoreProjectRequestDto {
    profileId: string;
    projectId: string;
}
export {};
