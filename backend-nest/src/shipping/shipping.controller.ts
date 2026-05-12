import {
  Controller, Get, Post, Put, Delete, Param, Body,
  HttpCode, HttpStatus, InternalServerErrorException,
} from '@nestjs/common';
import { ShippingService } from './shipping.service';

@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Get()
  async findAll() {
    try {
      return await this.shippingService.findAll();
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: { name: string; description?: string; price: number }) {
    try {
      return await this.shippingService.create(body);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    try {
      return await this.shippingService.update(id, body);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return await this.shippingService.remove(id);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
