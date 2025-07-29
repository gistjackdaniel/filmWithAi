import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../common/guard/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';

import {
  CreateProfileRequestDto,
  UpdateProfileRequestDto,
  FindProfileRequestDto,
  DeleteProfileRequestDto,
} from './dto/request.dto';

import {
  ProfileResponseDto,
} from './dto/response.dto';

@ApiTags('Profile')
@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: '프로필 조회' })
  @ApiResponse({ status: 200, description: '프로필 조회 성공', type: ProfileResponseDto })
  async findOne(@CurrentUser() user: JwtPayload): Promise<ProfileResponseDto> {
    const profile = await this.profileService.findProfileById(user.profileId);
    return profile;
  }

  @Post('project/:projectId/favorite')
  @ApiBearerAuth()
  @ApiOperation({ summary: '즐겨찾기 추가' })
  @ApiResponse({ status: 200, description: '즐겨찾기 추가 성공', type: ProfileResponseDto })
  async pushFavorite(@CurrentUser() user: JwtPayload, @Param('projectId') projectId: string): Promise<ProfileResponseDto> {
    const profile = await this.profileService.pushFavorite(user.profileId, projectId);
    return profile;
  }

  @Delete('project/:projectId/favorite')
  @ApiBearerAuth()
  @ApiOperation({ summary: '즐겨찾기 삭제' })
  @ApiResponse({ status: 200, description: '즐겨찾기 삭제 성공', type: ProfileResponseDto })
  async pullFavorite(@CurrentUser() user: JwtPayload, @Param('projectId') projectId: string): Promise<ProfileResponseDto> {
    const profile = await this.profileService.pullFavorite(user.profileId, projectId);
    return profile;
  }
} 