import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CategoryDocument } from './schemas/category.schema';
import { PublicCategoryResponseDto } from './dto/category-response.dto';

@ApiTags('Categories (Storefront)')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({
    summary: 'Retrieve active categories for public storefront',
  })
  @ApiResponse({
    status: 200,
    description: 'List of active categories retrieved successfully',
  })
  async findActive(): Promise<PublicCategoryResponseDto[]> {
    return this.categoriesService.findActive();
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Retrieve single category by slug (Public storefront)',
  })
  @ApiParam({
    name: 'slug',
    description: 'The unique URL slug of the category',
    example: 'thiet-bi-dien-tu',
  })
  @ApiResponse({
    status: 200,
    description: 'Category retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  async findBySlug(@Param('slug') slug: string): Promise<CategoryDocument> {
    return this.categoriesService.findBySlug(slug);
  }
}
