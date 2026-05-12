import {
  Controller, Get, Post, Put, Param, Body, HttpCode, HttpStatus, InternalServerErrorException,
} from '@nestjs/common';
import { MessagesService } from './messages.service';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async send(@Body() body: any) {
    try {
      return await this.messagesService.send(body);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Get('admin/conversations')
  async getAdminConversations() {
    try {
      return await this.messagesService.getAdminConversations();
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Get('admin/unread-total')
  async getAdminUnreadTotal() {
    try {
      return await this.messagesService.getAdminUnreadTotal();
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Get('history/:userId')
  async getHistory(@Param('userId') userId: string) {
    try {
      return await this.messagesService.getHistory(userId);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Get('unread/:userId')
  async getUnreadCount(@Param('userId') userId: string) {
    try {
      return await this.messagesService.getUnreadCount(userId);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Put('read/:senderId')
  async markAsRead(@Param('senderId') senderId: string) {
    try {
      return await this.messagesService.markAsRead(senderId);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Put('read-user/:userId')
  async markAsReadByUser(@Param('userId') userId: string) {
    try {
      return await this.messagesService.markAsReadByUser(userId);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
