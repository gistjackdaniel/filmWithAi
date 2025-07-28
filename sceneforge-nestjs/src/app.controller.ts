import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: '애플리케이션 상태 확인' })
  @ApiResponse({ status: 200, description: '애플리케이션 정상 작동' })
  getHello(): string {
    return this.appService.getHello();
  }
}
