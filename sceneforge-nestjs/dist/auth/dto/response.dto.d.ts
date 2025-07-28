export declare class LoginResponseDto {
    access_token: string;
    refresh_token: string;
    user: {
        _id: string;
        googleId: string;
        email: string;
        name: string;
        picture?: string;
    };
}
export declare class RefreshAccessTokenResponseDto {
    access_token: string;
    expires_in: string;
}
export declare class WithdrawResponseDto {
    message: string;
    deletedUserId: string;
}
