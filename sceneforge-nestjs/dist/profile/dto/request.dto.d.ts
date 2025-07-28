export declare class CreateProfileRequestDto {
    googleId: string;
    email: string;
    name: string;
    picture: string;
    lastLoginAt: Date;
}
export declare class UpdateProfileRequestDto {
    googleId?: string;
    email?: string;
    name?: string;
    picture?: string;
    lastLoginAt?: Date;
}
export declare class FindProfileRequestDto {
    profileId?: string;
    googleId?: string;
    email?: string;
    name?: string;
    page?: number;
    limit?: number;
}
export declare class DeleteProfileRequestDto {
    profileId: string;
}
