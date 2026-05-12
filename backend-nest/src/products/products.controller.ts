import { Controller, Get, Param, Query, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { ProductsService, ProductFilters } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(@Query() query: ProductFilters) {
    try {
      return await this.productsService.findAll(query);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.productsService.findOne(id);
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }
}
