import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Cart, CartSchema } from '../cart/schemas/cart.schema';
import { PaymentsModule } from '../payments/payments.module';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { CheckoutExpiryJob } from './checkout-expiry.job';
import { CheckoutService } from './checkout.service';
import { CheckoutsController } from './checkouts.controller';
import { OrdersController } from './orders.controller';
import { PaymentReconcileService } from './payment-reconcile.service';
import { PaymentResultService } from './payment-result.service';
import { PayosWebhookController } from './payos-webhook.controller';
import { Checkout, CheckoutSchema } from './schemas/checkout.schema';
import { Order, OrderSchema } from './schemas/order.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Checkout.name, schema: CheckoutSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Product.name, schema: ProductSchema },
      { name: User.name, schema: UserSchema },
      { name: Cart.name, schema: CartSchema },
    ]),
    AuthModule,
    PaymentsModule,
  ],
  controllers: [OrdersController, CheckoutsController, PayosWebhookController],
  providers: [
    CheckoutService,
    PaymentResultService,
    PaymentReconcileService,
    CheckoutExpiryJob,
    RolesGuard,
  ],
  exports: [CheckoutService, PaymentResultService],
})
export class OrderModule {}
