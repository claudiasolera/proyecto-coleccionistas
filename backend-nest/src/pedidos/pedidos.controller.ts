import {
  Controller, Get, Post, Put, Param, Body,
  HttpCode, HttpStatus, InternalServerErrorException,
} from '@nestjs/common';
import { PedidosService } from './pedidos.service';

@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: any) {
    try {
      return await this.pedidosService.create(body);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Get('user/:user_id')
  async findByUser(@Param('user_id') userId: string) {
    try {
      return await this.pedidosService.findByUser(userId);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Get('admin/all')
  async findAll() {
    try {
      return await this.pedidosService.findAll();
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Get('admin/new-count')
  async getNewCount() {
    try {
      return await this.pedidosService.getNewCount();
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Put('admin/:id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: string; tracking_number?: string }) {
    try {
      return await this.pedidosService.updateStatus(id, body.status, body.tracking_number);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
