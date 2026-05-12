import {
  Controller, Post, Body, RawBodyRequest, Req,
  HttpCode, HttpStatus, InternalServerErrorException, BadRequestException,
  Headers,
} from '@nestjs/common';
import { Request } from 'express';
import { PagosService } from './pagos.service';

@Controller('pagos')
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  @Post('create-checkout-session')
  async createCheckoutSession(@Body() body: any) {
    try {
      return await this.pagosService.createCheckoutSession(body);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') sig: string,
  ) {
    try {
      return await this.pagosService.handleWebhook(req.rawBody, sig);
    } catch (error) {
      throw new BadRequestException(`Webhook Error: ${error.message}`);
    }
  }
}
