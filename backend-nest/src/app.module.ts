import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { UsersModule } from './users/users.module';
import { MessagesModule } from './messages/messages.module';
import { FavoritosModule } from './favoritos/favoritos.module';
import { PedidosModule } from './pedidos/pedidos.module';
import { PagosModule } from './pagos/pagos.module';
import { AdminModule } from './admin/admin.module';
import { ShippingModule } from './shipping/shipping.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    ProductsModule,
    CategoriesModule,
    UsersModule,
    MessagesModule,
    FavoritosModule,
    PedidosModule,
    PagosModule,
    AdminModule,
    ShippingModule,
  ],
})
export class AppModule {}
