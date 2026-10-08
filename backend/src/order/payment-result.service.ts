import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { ClientSession, Connection, Model, Types } from 'mongoose';
import { Cart, CartDocument } from '../cart/schemas/cart.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import {
  Checkout,
  CheckoutDocument,
  CheckoutStatus,
} from './schemas/checkout.schema';
import {
  CancelledBy,
  Order,
  OrderDocument,
  OrderItem,
  OrderStatus,
  PaymentStatus,
} from './schemas/order.schema';

export type PaidOutcome = 'paid' | 'not_pending';

export type TerminalFailureStatus =
  CheckoutStatus.FAILED | CheckoutStatus.EXPIRED;

@Injectable()
export class PaymentResultService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(Checkout.name)
    private readonly checkoutModel: Model<CheckoutDocument>,
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Cart.name)
    private readonly cartModel: Model<CartDocument>,
  ) {}

  async markPaid(
    checkoutId: Types.ObjectId,
    reference: string | null,
  ): Promise<PaidOutcome> {
    let outcome: PaidOutcome = 'not_pending';

    await this.inTransaction(async (session) => {
      outcome = 'not_pending';
      const checkout = await this.checkoutModel
        .findOneAndUpdate(
          { _id: checkoutId, status: CheckoutStatus.PENDING },
          {
            $set: {
              status: CheckoutStatus.PAID,
              paidAt: new Date(),
              payosReference: reference,
            },
          },
          { session, returnDocument: 'after' },
        )
        .exec();
      if (!checkout) return;

      const orders = await this.orderModel
        .find({ checkoutId, status: OrderStatus.PENDING })
        .select('items')
        .session(session)
        .lean<{ items: OrderItem[] }[]>()
        .exec();

      await this.orderModel
        .updateMany(
          { checkoutId, status: OrderStatus.PENDING },
          {
            $set: {
              status: OrderStatus.CONFIRMED,
              paymentStatus: PaymentStatus.PAID,
            },
          },
          { session },
        )
        .exec();

      const productIds = orders.flatMap((o) => o.items.map((i) => i.productId));
      if (productIds.length > 0) {
        await this.cartModel
          .updateOne(
            { userId: checkout.userId },
            { $pull: { items: { productId: { $in: productIds } } } },
            { session },
          )
          .exec();
      }

      outcome = 'paid';
    });

    return outcome;
  }

  async cancelCheckout(
    checkoutId: Types.ObjectId,
    status: TerminalFailureStatus,
    reason: string,
  ): Promise<boolean> {
    let cancelled = false;

    await this.inTransaction(async (session) => {
      cancelled = false;
      const checkout = await this.checkoutModel
        .findOneAndUpdate(
          { _id: checkoutId, status: CheckoutStatus.PENDING },
          { $set: { status } },
          { session, returnDocument: 'after' },
        )
        .exec();
      if (!checkout) return;

      const pendingOrders = await this.orderModel
        .find({ checkoutId, status: OrderStatus.PENDING })
        .select('_id')
        .session(session)
        .lean<{ _id: Types.ObjectId }[]>()
        .exec();

      for (const { _id } of pendingOrders) {
        await this.restockAndCancel(_id, reason, session);
      }

      cancelled = true;
    });

    return cancelled;
  }

  private async restockAndCancel(
    orderId: Types.ObjectId,
    reason: string,
    session: ClientSession,
  ): Promise<void> {
    const order = await this.orderModel
      .findOneAndUpdate(
        { _id: orderId, status: OrderStatus.PENDING },
        {
          $set: {
            status: OrderStatus.CANCELLED,
            cancelledBy: CancelledBy.SYSTEM,
            cancelReason: reason,
          },
        },
        { session, returnDocument: 'after' },
      )
      .lean<{ items: OrderItem[] }>()
      .exec();
    if (!order) return;

    for (const item of order.items) {
      await this.productModel
        .updateOne(
          { _id: item.productId },
          { $inc: { stock: item.quantity } },
          { session },
        )
        .exec();
    }
  }

  private async inTransaction(
    work: (session: ClientSession) => Promise<void>,
  ): Promise<void> {
    const session = await this.connection.startSession();
    try {
      await session.withTransaction(() => work(session));
    } finally {
      await session.endSession();
    }
  }
}
