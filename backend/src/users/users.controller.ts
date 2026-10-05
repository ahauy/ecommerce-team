import {
  Controller,
  Get,
  Patch,
  UseGuards,
  Request,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { GetProfileResponseDto } from './dto/get-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SetupShopDto } from './dto/setup-shop.dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile with shop info' })
  @ApiResponse({ status: 200, type: GetProfileResponseDto })
  @ApiResponse({ status: 403, description: 'Account banned' })
  async getProfile(
    @Request() req: { user: { id: string } },
  ): Promise<GetProfileResponseDto> {
    return this.usersService.getProfile(req.user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, type: GetProfileResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Version conflict' })
  async updateProfile(
    @Request() req: { user: { id: string } },
    @Body() dto: UpdateProfileDto,
  ): Promise<GetProfileResponseDto> {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @Patch('me/shop')
  @ApiOperation({ summary: 'Setup or update shop information' })
  @ApiResponse({ status: 200, type: GetProfileResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({
    status: 409,
    description: 'Version conflict or slug collision',
  })
  async setupShop(
    @Request() req: { user: { id: string } },
    @Body() dto: SetupShopDto,
  ): Promise<GetProfileResponseDto> {
    return this.usersService.setupShop(req.user.id, dto);
  }
}
