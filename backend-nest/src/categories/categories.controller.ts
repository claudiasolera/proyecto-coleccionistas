import {
  Controller, Get, Post, Put, Delete,
  Param, Body, BadRequestException, InternalServerErrorException,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async findAll() {
    try {
      return await this.categoriesService.findAll();
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Post()
  async create(@Body() body: { name: string; description?: string }) {
    try {
      return await this.categoriesService.create(body.name, body.description);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: { name: string; description?: string }) {
    try {
      return await this.categoriesService.update(id, body.name, body.description);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return await this.categoriesService.remove(id);
    } catch (error) {
      if (error.message?.includes('No se puede borrar')) {
        throw new BadRequestException(error.message);
      }
      throw new InternalServerErrorException(error.message);
    }
  }
}
