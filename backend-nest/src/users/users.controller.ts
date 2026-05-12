import {
  Controller, Get, Post, Put, Body, Param, Query,
  HttpCode, HttpStatus, InternalServerErrorException,
  NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  async register(@Body() body: any) {
    if (!body.password) throw new BadRequestException('La contraseña es obligatoria');
    try {
      return await this.usersService.register(body);
    } catch (error) {
      const msg = error.message || '';
      if (msg.includes('users_email_key') || msg.includes('email')) {
        throw new BadRequestException('Este email ya está registrado.');
      }
      if (msg.includes('users_dni_key') || msg.includes('dni')) {
        throw new BadRequestException('Este DNI ya está registrado.');
      }
      if (msg.includes('users_phone_key') || msg.includes('phone')) {
        throw new BadRequestException('Este teléfono ya está registrado.');
      }
      throw new InternalServerErrorException('Error al registrar. Inténtalo de nuevo.');
    }
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    try {
      return await this.usersService.verifyEmail(token);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: { email: string; password: string }) {
    try {
      return await this.usersService.login(body.email, body.password);
    } catch (error) {
      const msg = error.message || '';
      if (msg === 'Usuario no encontrado') throw new NotFoundException(msg);
      if (msg === 'UNVERIFIED') throw new ForbiddenException('Debes verificar tu email antes de entrar.');
      if (msg === 'Contraseña incorrecta') throw new BadRequestException(msg);
      throw new InternalServerErrorException(msg);
    }
  }

  @Get()
  async findAll(@Query('email') email?: string, @Query('dni') dni?: string) {
    try {
      return await this.usersService.findAll(email, dni);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  // IMPORTANT: public/:id must come before :id to avoid routing conflict
  @Get('public/:id')
  async findPublic(@Param('id') id: string) {
    try {
      return await this.usersService.findPublic(id);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.usersService.findOne(id);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    try {
      return await this.usersService.update(id, body);
    } catch (error) {
      const msg = error.message || '';
      if (msg.includes('users_email_key') || msg.includes('email')) {
        throw new BadRequestException('Este email ya está en uso.');
      }
      if (msg.includes('users_dni_key') || msg.includes('dni')) {
        throw new BadRequestException('Este DNI ya está en uso.');
      }
      throw new InternalServerErrorException(msg);
    }
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    try {
      return await this.usersService.forgotPassword(body.email);
    } catch (error) {
      if (error.message === 'Email no encontrado') throw new NotFoundException(error.message);
      throw new InternalServerErrorException(error.message);
    }
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { token: string; password: string }) {
    try {
      return await this.usersService.resetPassword(body.token, body.password);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
