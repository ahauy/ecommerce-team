import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { UserRole } from '../users/schemas/user.schema';
import { AdminUsersService } from './admin-users.service';
import { PaginatedAdminUsersDto } from './dto/admin-user.dto';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';

interface AuthRequest {
  user: { id: string };
}

const userId = () => new ParseObjectIdPipe('Mã người dùng không hợp lệ');

@ApiTags('Admin - Users')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Not logged in' })
@ApiResponse({ status: 403, description: 'Admin only' })
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  @ApiOperation({ summary: 'List users (filter role, isActive, search)' })
  @ApiResponse({ status: 200, description: 'Paginated users' })
  list(@Query() query: AdminUsersQueryDto): Promise<PaginatedAdminUsersDto> {
    return this.adminUsersService.list(query);
  }

  @Patch(':id/ban')
  @ApiOperation({ summary: 'Ban user (cascade block products)' })
  @ApiParam({ name: 'id', example: '66a1b2c3d4e5f67890123456' })
  @ApiResponse({ status: 200, description: 'User banned' })
  @ApiResponse({ status: 400, description: 'Cannot ban yourself / bad id' })
  @ApiResponse({ status: 404, description: 'User not found' })
  ban(
    @Request() req: AuthRequest,
    @Param('id', userId()) id: string,
  ): Promise<{ message: string }> {
    return this.adminUsersService.ban(req.user.id, id);
  }

  @Patch(':id/unban')
  @ApiOperation({ summary: 'Unban user (reopen products blocked by ban)' })
  @ApiParam({ name: 'id', example: '66a1b2c3d4e5f67890123456' })
  @ApiResponse({ status: 200, description: 'User unbanned' })
  @ApiResponse({ status: 404, description: 'User not found' })
  unban(@Param('id', userId()) id: string): Promise<{ message: string }> {
    return this.adminUsersService.unban(id);
  }
}
