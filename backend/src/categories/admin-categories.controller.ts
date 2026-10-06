/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles, UserRole } from '../auth/guards/roles.guard';
import { CategoriesService } from './categories.service';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import {
  AdminCategoryResponseDto,
  DeleteCategoryResponseDto,
} from './dto/category-response.dto';
import { CategoryDocument } from './schemas/category.schema';

@ApiTags('Categories (Admin)')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminCategoriesController {
  constructor(private readonly categoriesService: CategoriesService) { }

  @Get('admin/categories')
  @ApiOperation({
    summary: 'Retrieve all categories with product counts (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'All categories retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAll(): Promise<AdminCategoryResponseDto[]> {
    return this.categoriesService.findAllAdmin();
  }

  @Post('categories')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new category (Admin only)' })
  @ApiBody({ type: CreateCategoryDto })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Tên danh mục đã tồn tại' })
  async create(@Body() dto: CreateCategoryDto): Promise<CategoryDocument> {
    return this.categoriesService.create(dto);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update category details (Admin only)' })
  @ApiParam({
    name: 'id',
    description: 'The 24-character hexadecimal MongoDB ObjectId',
    example: '6701a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiBody({ type: UpdateCategoryDto })
  @ApiResponse({
    status: 200,
    description: 'Category updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy danh mục' })
  @ApiResponse({ status: 409, description: 'Tên danh mục đã tồn tại' })
  async update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<CategoryDocument> {
    return this.categoriesService.update(id, dto);
  }

  @Delete('categories/:id')
  @ApiOperation({
    summary: 'Delete category with referential check (Admin only)',
  })
  @ApiParam({
    name: 'id',
    description: 'The 24-character hexadecimal MongoDB ObjectId',
    example: '6701a2b3c4d5e6f7a8b9c0d1',
  })
  @ApiResponse({
    status: 200,
    description: 'Category deleted successfully',
  })
  @ApiResponse({ status: 400, description: 'Referential integrity conflict' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy danh mục' })
  async remove(
    @Param('id', ParseObjectIdPipe) id: string,
  ): Promise<DeleteCategoryResponseDto> {
    return this.categoriesService.remove(id);
  }
}
