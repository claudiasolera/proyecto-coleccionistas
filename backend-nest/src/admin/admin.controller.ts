import {
  Controller, Get, Post, Put, Delete, Param, Body,
  UploadedFiles, UseInterceptors, HttpCode, HttpStatus, InternalServerErrorException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FilesInterceptor('images', 10, { storage: memoryStorage() }))
  async createProduct(
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    try {
      const dto = {
        ...body,
        price: parseFloat(body.price),
        year: parseInt(body.year),
      };
      return await this.adminService.createProduct(dto, files);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Get('inventory')
  async getInventory() {
    try {
      return await this.adminService.getInventory();
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Put(':id')
  @UseInterceptors(FilesInterceptor('images', 10, { storage: memoryStorage() }))
  async updateProduct(
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    try {
      return await this.adminService.updateProduct(id, body, files);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Delete(':id')
  async deleteProduct(@Param('id') id: string) {
    try {
      return await this.adminService.deleteProduct(id);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: string; reserved_for?: string }) {
    try {
      return await this.adminService.updateStatus(id, body.status, body.reserved_for);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
