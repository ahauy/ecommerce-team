import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, Types } from 'mongoose';
import { UserRole } from '../users/schemas/user.schema';
import {
  AdminListOrdersQueryDto,
  ListOrdersQueryDto,
} from './dto/order-query.dto';
import { OrderDto, PaginatedOrdersDto } from './dto/order-response.dto';
import {
  ManualTargetStatus,
  UpdateOrderStatusDto,
} from './dto/update-order-status.dto';
import {
  Checkout,
  CheckoutDocument,
  Recipient,
} from './schemas/checkout.schema';
import {
  CancelledBy,
  Order,
  OrderDocument,
  OrderItem,
  OrderStatus,
  PaymentStatus,
} from './schemas/order.schema';
import { PaymentResultService } from './payment-result.service';

export interface OrderActor {
  id: string;
  role: UserRole;
}

interface OrderRecord {
  _id: Types.ObjectId;
  orderCode: string;
  checkoutId: Types.ObjectId;
  userId: Types.ObjectId;
  sellerId: Types.ObjectId;
  recipient: Recipient;
  sellerShopName: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  cancelReason: string | null;
  cancelledBy: CancelledBy | null;
  createdAt: Date;
  updatedAt: Date;
}

export const ORDER_NOT_FOUND = 'Không tìm thấy đơn hàng';
export const ORDER_CHANGED =
  'Trạng thái đơn hàng vừa thay đổi, vui lòng tải lại';

export const STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'Chờ thanh toán',
  [OrderStatus.CONFIRMED]: 'Đã thanh toán',
  [OrderStatus.SHIPPING]: 'Đang giao',
  [OrderStatus.DELIVERED]: 'Đã giao',
  [OrderStatus.CANCELLED]: 'Đã hủy',
  [OrderStatus.REFUNDED]: 'Đã hoàn tiền',
};

export const ALLOWED_FROM: Record<ManualTargetStatus, OrderStatus> = {
  [OrderStatus.SHIPPING]: OrderStatus.CONFIRMED,
  [OrderStatus.DELIVERED]: OrderStatus.SHIPPING,
  [OrderStatus.CANCELLED]: OrderStatus.CONFIRMED,
  [OrderStatus.REFUNDED]: OrderStatus.CANCELLED,
};

const oid = (id: string) => new Types.ObjectId(id);

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Checkout.name)
    private readonly checkoutModel: Model<CheckoutDocument>,
    private readonly paymentResult: PaymentResultService,
  ) {}

  listForBuyer(
    userId: string,
    query: ListOrdersQueryDto,
  ): Promise<PaginatedOrdersDto> {
    return this.list({ userId: oid(userId) }, query);
  }

  getForBuyer(userId: string, orderId: string): Promise<OrderDto> {
    return this.getOne({ _id: oid(orderId), userId: oid(userId) });
  }

  listForSeller(
    sellerId: string,
    query: ListOrdersQueryDto,
  ): Promise<PaginatedOrdersDto> {
    return this.list({ sellerId: oid(sellerId) }, query);
  }

  getForSeller(sellerId: string, orderId: string): Promise<OrderDto> {
    return this.getOne({ _id: oid(orderId), sellerId: oid(sellerId) });
  }

  listForAdmin(query: AdminListOrdersQueryDto): Promise<PaginatedOrdersDto> {
    const filter: QueryFilter<OrderDocument> = {};
    if (query.sellerId) filter.sellerId = oid(query.sellerId);
    if (query.userId) filter.userId = oid(query.userId);
    return this.list(filter, query);
  }

  getForAdmin(orderId: string): Promise<OrderDto> {
    return this.getOne({ _id: oid(orderId) });
  }

  async updateStatus(
    actor: OrderActor,
    orderId: string,
    dto: UpdateOrderStatusDto,
  ): Promise<OrderDto> {
    const order = await this.orderModel
      .findById(orderId)
      .select('sellerId status paymentStatus')
      .lean<
        Pick<OrderRecord, '_id' | 'sellerId' | 'status' | 'paymentStatus'>
      >()
      .exec();
    if (!order) {
      throw new NotFoundException(ORDER_NOT_FOUND);
    }

    const isAdmin = actor.role === UserRole.ADMIN;
    if (!isAdmin && order.sellerId.toString() !== actor.id) {
      throw new ForbiddenException('Bạn không có quyền cập nhật đơn hàng này');
    }

    const target = dto.status;
    if (target === OrderStatus.REFUNDED && !isAdmin) {
      throw new ForbiddenException('Chỉ quản trị viên được xác nhận hoàn tiền');
    }

    const from = ALLOWED_FROM[target];
    if (order.status !== from) {
      throw new BadRequestException(
        `Không thể chuyển đơn từ "${STATUS_LABELS[order.status]}" sang "${STATUS_LABELS[target]}"`,
      );
    }
    if (
      target === OrderStatus.REFUNDED &&
      order.paymentStatus !== PaymentStatus.PAID
    ) {
      throw new BadRequestException('Chỉ hoàn tiền cho đơn đã thanh toán');
    }

    const changed =
      target === OrderStatus.CANCELLED
        ? await this.cancel(order._id, isAdmin, dto.reason ?? '')
        : await this.transition(order._id, from, target);
    if (!changed) {
      throw new ConflictException(ORDER_CHANGED);
    }

    return this.getOne({ _id: order._id });
  }

  private async cancel(
    orderId: Types.ObjectId,
    isAdmin: boolean,
    reason: string,
  ): Promise<boolean> {
    let cancelled = false;
    await this.paymentResult.inTransaction(async (session) => {
      cancelled = await this.paymentResult.restockAndCancel(
        orderId,
        {
          from: OrderStatus.CONFIRMED,
          cancelledBy: isAdmin ? CancelledBy.ADMIN : CancelledBy.SELLER,
          reason,
        },
        session,
      );
    });
    return cancelled;
  }

  private async transition(
    orderId: Types.ObjectId,
    from: OrderStatus,
    target: ManualTargetStatus,
  ): Promise<boolean> {
    const updated = await this.orderModel
      .findOneAndUpdate(
        { _id: orderId, status: from },
        {
          $set: {
            status: target,
            ...(target === OrderStatus.REFUNDED && {
              paymentStatus: PaymentStatus.REFUNDED,
            }),
          },
        },
        { returnDocument: 'after' },
      )
      .select('_id')
      .lean()
      .exec();
    return updated !== null;
  }

  private async list(
    filter: QueryFilter<OrderDocument>,
    query: ListOrdersQueryDto,
  ): Promise<PaginatedOrdersDto> {
    const { page, limit, status } = query;
    const where = { ...filter, ...(status && { status }) };

    const [orders, total] = await Promise.all([
      this.orderModel
        .find(where)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean<OrderRecord[]>()
        .exec(),
      this.orderModel.countDocuments(where).exec(),
    ]);

    return {
      items: await this.toDtos(orders),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private async getOne(filter: QueryFilter<OrderDocument>): Promise<OrderDto> {
    const order = await this.orderModel
      .findOne(filter)
      .lean<OrderRecord>()
      .exec();
    if (!order) {
      throw new NotFoundException(ORDER_NOT_FOUND);
    }
    const [dto] = await this.toDtos([order]);
    return dto;
  }

  private async toDtos(orders: OrderRecord[]): Promise<OrderDto[]> {
    if (orders.length === 0) return [];

    const checkoutIds = [
      ...new Set(orders.map((o) => o.checkoutId.toString())),
    ].map(oid);
    const checkouts = await this.checkoutModel
      .find({ _id: { $in: checkoutIds } })
      .select('checkoutCode')
      .lean<{ _id: Types.ObjectId; checkoutCode: string }[]>()
      .exec();
    const codes = new Map(
      checkouts.map((c) => [c._id.toString(), c.checkoutCode]),
    );

    return orders.map((o) => ({
      id: o._id.toString(),
      orderCode: o.orderCode,
      checkoutCode: codes.get(o.checkoutId.toString()) ?? null,
      buyerId: o.userId.toString(),
      seller: { id: o.sellerId.toString(), shopName: o.sellerShopName },
      items: o.items.map((i) => ({
        productId: i.productId.toString(),
        name: i.name,
        imageUrl: i.imageUrl ?? null,
        price: i.price,
        quantity: i.quantity,
      })),
      totalAmount: o.totalAmount,
      status: o.status,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod,
      recipient: {
        fullName: o.recipient.fullName,
        phone: o.recipient.phone,
        email: o.recipient.email,
        address: o.recipient.address,
      },
      cancelReason: o.cancelReason ?? null,
      cancelledBy: o.cancelledBy ?? null,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
    }));
  }
}
