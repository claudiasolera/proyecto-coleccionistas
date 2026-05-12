import {
  Controller, Get, Post, Delete, Param, Body,
  HttpCode, HttpStatus, InternalServerErrorException, BadRequestException,
} from '@nestjs/common';
import { FavoritosService } from './favoritos.service';

@Controller('favoritos')
export class FavoritosController {
  constructor(private readonly favoritosService: FavoritosService) {}

  @Get(':user_id')
  async findByUser(@Param('user_id') userId: string) {
    try {
      return await this.favoritosService.findByUser(userId);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async add(@Body() body: { user_id: string; product_id?: string; category_id?: string }) {
    if (!body.user_id) throw new BadRequestException('User ID is required');
    try {
      return await this.favoritosService.add(body);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    try {
      await this.favoritosService.remove(id);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
