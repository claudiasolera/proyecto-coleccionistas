import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import Stripe from 'stripe';

@Injectable()
export class PagosService {
  private stripe: Stripe;

  constructor(
    private supabase: SupabaseService,
    private config: ConfigService,
  ) {
    this.stripe = new Stripe(this.config.getOrThrow('STRIPE_SECRET_KEY'));
  }

  async createCheckoutSession(dto: {
    name: string; price: number; product_id: string;
    user_id: string; shipping_method: string;
  }) {
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: dto.name },
          unit_amount: Math.round(dto.price * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `http://localhost:3000/perfil?success=true`,
      cancel_url: `http://localhost:3000/checkout?id=${dto.product_id}`,
      metadata: {
        product_id: dto.product_id,
        user_id: dto.user_id,
        shipping_method: dto.shipping_method,
      },
    });
    return { url: session.url };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    const webhookSecret = this.config.getOrThrow('STRIPE_WEBHOOK_SECRET');
    const event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const { product_id, user_id, shipping_method } = session.metadata;

      await this.supabase.db
        .from('products')
        .update({ status: 'sold', sold_at: new Date() })
        .eq('id', product_id);

      await this.supabase.db.from('orders').insert([{
        user_id, product_id, shipping_method,
        total_amount: session.amount_total / 100,
        status: 'paid',
      }]);
    }

    return { received: true };
  }
}
