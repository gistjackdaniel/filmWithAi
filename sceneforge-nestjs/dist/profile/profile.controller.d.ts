import { ProfileService } from './profile.service';
import { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';
import { CreateProfileRequestDto, UpdateProfileRequestDto } from './dto/request.dto';
import { ProfileResponseDto } from './dto/response.dto';
export declare class ProfileController {
    private readonly profileService;
    constructor(profileService: ProfileService);
    create(user: JwtPayload, createProfileDto: CreateProfileRequestDto): Promise<ProfileResponseDto>;
    findOne(user: JwtPayload): Promise<ProfileResponseDto>;
    update(user: JwtPayload, updateProfileDto: UpdateProfileRequestDto): Promise<ProfileResponseDto>;
    delete(user: JwtPayload): Promise<ProfileResponseDto>;
    pushFavorite(user: JwtPayload, projectId: string): Promise<ProfileResponseDto>;
    pullFavorite(user: JwtPayload, projectId: string): Promise<ProfileResponseDto>;
}
