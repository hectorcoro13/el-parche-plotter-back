import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './Products.service';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Roles } from 'src/decorators/roles.decorator';
import { role } from 'src/roles.enum';
import { AuthGuard } from 'src/Auth/Auth.guard';
import { RolesGuard } from 'src/Auth/roles.guard';
import { UpdateProductDto } from './Dto/update-product.dto';
import { CreateProductDto } from './Dto/create-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly ProductsService: ProductsService) {}

  @ApiQuery({
    name: 'force',
    type: String,
    required: false,
    description:
      'Colocar true para forzar el reset incluso si hay órdenes activas',
  })
  @Get('resetSeeder')
  @ApiBearerAuth()
  @Roles(role.Admin)
  @UseGuards(AuthGuard, RolesGuard)
  resetSeeder(@Query('force') force?: string) {
    return this.ProductsService.resetseeder({ force: force === 'true' });
  }

  @HttpCode(200)
  @Get()
  getProducts(@Query('page') page: string, @Query('limit') limit: string) {
    if (limit && page) {
      return this.ProductsService.getProducts(+page, +limit);
    }
    return this.ProductsService.getProducts();
  }

  @HttpCode(200)
  @Get('destacados')
  getFeaturedProducts() {
    return this.ProductsService.getFeaturedProducts();
  }

  @Post()
  @ApiBearerAuth()
  @Roles(role.Admin)
  @UseGuards(AuthGuard, RolesGuard)
  create(@Body() createProductDto: CreateProductDto) {
    return this.ProductsService.create(createProductDto);
  }

  @Put(':id')
  @ApiBearerAuth()
  @Roles(role.Admin)
  @UseGuards(AuthGuard, RolesGuard)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.ProductsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(role.Admin)
  @UseGuards(AuthGuard, RolesGuard)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.ProductsService.remove(id);
  }
}
