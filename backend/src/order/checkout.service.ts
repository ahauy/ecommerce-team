import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { PayosService } from '../payments/payos.service';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import {
  CheckoutRecipientDto,
  CreateCheckoutDto,
} from './dto/create-checkout.dto';
import {
  CheckoutResultDto,
  CreateCheckoutResponseDto,
  StockShortageDto,
} from './dto/checkout-response.dto';
import {
  generateCheckoutCode,
  generateOrderCode,
  generatePayosOrderCode,
  payosDescription,
} from './order-code.util';
import {
  Checkout,
  CheckoutDocument,
  CheckoutStatus,
  Recipient,
} from './schemas/checkout.schema';
import { Order, OrderDocument, OrderStatus } from './schemas/order.schema';
import { PaymentResultService } from './payment-result.service';
import {
  PaymentReconcileService,
  ReconcileCheckout,
} from './payment-reconcile.service';

export const DEFAULT_CHECKOUT_EXPIRE_MINUTES = 30;
export const CREATE_RETRIES = 3;
export const DEFAULT_SHOP_NAME = 'Gian hàng';
export const SHORTAGE_MESSAGE = 'Một số sản phẩm không đủ tồn kho';
export const PAYMENT_LINK_FAILED_REASON = 'Không tạo được liên kết thanh toán';

interface CheckoutProduct {
  _id: Types.ObjectId;
  sellerId: Types.ObjectId;
  name: string;
  images: string[];
  price: number;
  stock: number;
  isActive: boolean;
  isBlocked: boolean;
}

interface ReservedCheckout {
  _id: Types.ObjectId;
  checkoutCode: string;
  payosOrderCode: number;
  totalAmount: number;
  expiresAt: Date;
  orders: {
    _id: Types.ObjectId;
    orderCode: string;
    sellerId: Types.ObjectId;
    sellerShopName: string;
    totalAmount: number;
  }[];
}

const PRODUCT_FIELDS = 'sellerId name images price stock isActive isBlocked';

const isSellable = (p: CheckoutProduct) => p.isActive && !p.isBlocked;

const isDuplicateKey = (err: unknown): boolean =>
  (err as { code?: number })?.code === 11000;

class StockShortageSignal extends Error {}

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(Checkout.name)
    private readonly checkoutModel: Model<CheckoutDocument>,
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly payos: PayosService,
    private readonly paymentResult: PaymentResultService,
    private readonly reconcile: PaymentReconcileService,
    private readonly config: ConfigService,
  ) {}

  async createCheckout(
    userId: string,
    dto: CreateCheckoutDto,
  ): Promise<CreateCheckoutResponseDto> {
    const recipient = await this.resolveRecipient(userId, dto.recipient);
    const lines = this.mergeLines(dto.items);
    const shopNames = await this.precheck(userId, lines);

    const reserved = await this.reserve(userId, recipient, lines, shopNames);
    const paymentUrl = await this.attachPaymentLink(reserved);

    return {
      checkoutId: reserved._id.toString(),
      checkoutCode: reserved.checkoutCode,
      totalAmount: reserved.totalAmount,
      expiresAt: reserved.expiresAt.toISOString(),
      orders: reserved.orders.map((o) => ({
        orderId: o._id.toString(),
        orderCode: o.orderCode,
        seller: { id: o.sellerId.toString(), shopName: o.sellerShopName },
        totalAmount: o.totalAmount,
      })),
      paymentUrl,
    };
  }

  async getCheckoutResult(
    userId: string,
    checkoutCode: string,
  ): Promise<CheckoutResultDto> {
    const filter = { checkoutCode, userId: new Types.ObjectId(userId) };
    let checkout = await this.findForResult(filter);
    if (!checkout) {
      throw new NotFoundException('Không tìm thấy thông tin thanh toán');
    }

    if (checkout.status === CheckoutStatus.PENDING) {
      await this.reconcile.syncCheckout(checkout);
      checkout = (await this.findForResult(filter)) ?? checkout;
    }

    const orders = await this.orderModel
      .find({ checkoutId: checkout._id })
      .sort({ createdAt: 1, _id: 1 })
      .select('orderCode sellerShopName totalAmount status')
      .lean<
        {
          orderCode: string;
          sellerShopName: string;
          totalAmount: number;
          status: OrderStatus;
        }[]
      >()
      .exec();

    return {
      checkoutCode: checkout.checkoutCode,
      status: checkout.status,
      totalAmount: checkout.totalAmount,
      expiresAt: checkout.expiresAt.toISOString(),
      paymentUrl:
        checkout.status === CheckoutStatus.PENDING
          ? checkout.checkoutUrl
          : null,
      orders: orders.map((o) => ({
        orderCode: o.orderCode,
        shopName: o.sellerShopName,
        totalAmount: o.totalAmount,
        status: o.status,
      })),
    };
  }

  private async resolveRecipient(
    userId: string,
    override: CheckoutRecipientDto | undefined,
  ): Promise<Recipient> {
    const user = await this.userModel
      .findById(userId)
      .select('fullName email phone address')
      .lean<{
        fullName: string;
        email: string;
        phone?: string | null;
        address?: string | null;
      }>()
      .exec();
    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản');
    }

    const recipient = {
      fullName: override?.fullName || user.fullName,
      phone: override?.phone || user.phone || '',
      email: override?.email || user.email,
      address: override?.address || user.address || '',
    };

    if (!recipient.phone || !recipient.address) {
      throw new BadRequestException(
        'Vui lòng bổ sung số điện thoại và địa chỉ nhận hàng',
      );
    }
    return recipient;
  }

  private mergeLines(
    items: { productId: string; quantity: number }[],
  ): Map<string, number> {
    const lines = new Map<string, number>();
    for (const { productId, quantity } of items) {
      lines.set(productId, (lines.get(productId) ?? 0) + quantity);
    }
    return lines;
  }

  private async precheck(
    userId: string,
    lines: Map<string, number>,
  ): Promise<Map<string, string>> {
    const products = await this.loadProducts([...lines.keys()]);

    for (const product of products.values()) {
      if (product.sellerId.toString() === userId) {
        throw new BadRequestException(
          'Bạn không thể mua sản phẩm của chính mình',
        );
      }
    }

    const shortages = this.findShortages(lines, products);
    if (shortages.length > 0) {
      throw new BadRequestException({
        message: SHORTAGE_MESSAGE,
        errors: shortages,
      });
    }

    return this.loadShopNames(
      [...products.values()].map((p) => p.sellerId.toString()),
    );
  }

  private async reserve(
    userId: string,
    recipient: Recipient,
    lines: Map<string, number>,
    shopNames: Map<string, string>,
  ): Promise<ReservedCheckout> {
    for (let attempt = 1; ; attempt++) {
      try {
        return await this.reserveOnce(userId, recipient, lines, shopNames);
      } catch (err: unknown) {
        if (err instanceof StockShortageSignal) {
          throw new BadRequestException({
            message: SHORTAGE_MESSAGE,
            errors: this.findShortages(
              lines,
              await this.loadProducts([...lines.keys()]),
            ),
          });
        }
        if (isDuplicateKey(err) && attempt < CREATE_RETRIES) continue;
        throw err;
      }
    }
  }

  private async reserveOnce(
    userId: string,
    recipient: Recipient,
    lines: Map<string, number>,
    shopNames: Map<string, string>,
  ): Promise<ReservedCheckout> {
    const session = await this.connection.startSession();
    let reserved: ReservedCheckout | null = null;

    try {
      await session.withTransaction(async () => {
        const now = new Date();
        const groups = new Map<
          string,
          { product: CheckoutProduct; quantity: number }[]
        >();

        for (const [productId, quantity] of lines) {
          const product = await this.productModel
            .findOneAndUpdate(
              {
                _id: new Types.ObjectId(productId),
                isActive: true,
                isBlocked: false,
                stock: { $gte: quantity },
              },
              { $inc: { stock: -quantity } },
              { session, returnDocument: 'after' },
            )
            .select(PRODUCT_FIELDS)
            .lean<CheckoutProduct>()
            .exec();
          if (!product) throw new StockShortageSignal();

          const sellerId = product.sellerId.toString();
          const group = groups.get(sellerId) ?? [];
          group.push({ product, quantity });
          groups.set(sellerId, group);
        }

        const checkoutId = new Types.ObjectId();
        const orders = [...groups.entries()].map(([sellerId, items]) => ({
          _id: new Types.ObjectId(),
          orderCode: generateOrderCode(now),
          checkoutId,
          userId: new Types.ObjectId(userId),
          sellerId: new Types.ObjectId(sellerId),
          recipient,
          sellerShopName: shopNames.get(sellerId) ?? DEFAULT_SHOP_NAME,
          items: items.map(({ product, quantity }) => ({
            productId: product._id,
            name: product.name,
            imageUrl: product.images[0] ?? null,
            price: product.price,
            quantity,
          })),
          totalAmount: items.reduce(
            (sum, { product, quantity }) => sum + product.price * quantity,
            0,
          ),
        }));

        const totalAmount = orders.reduce((sum, o) => sum + o.totalAmount, 0);
        const expiresAt = new Date(
          now.getTime() + this.expireMinutes() * 60 * 1000,
        );
        const checkoutCode = generateCheckoutCode(now);
        const payosOrderCode = generatePayosOrderCode(now);

        await this.checkoutModel.create(
          [
            {
              _id: checkoutId,
              checkoutCode,
              userId: new Types.ObjectId(userId),
              recipient,
              orderIds: orders.map((o) => o._id),
              totalAmount,
              expiresAt,
              payosOrderCode,
            },
          ],
          { session },
        );
        await this.orderModel.create(orders, { session, ordered: true });

        reserved = {
          _id: checkoutId,
          checkoutCode,
          payosOrderCode,
          totalAmount,
          expiresAt,
          orders,
        };
      });
    } finally {
      await session.endSession();
    }

    if (!reserved) {
      throw new Error('Tạo đơn hàng thất bại');
    }
    return reserved;
  }

  private async attachPaymentLink(reserved: ReservedCheckout): Promise<string> {
    const returnUrl = this.resultUrl(reserved.checkoutCode);

    try {
      const link = await this.payos.createPaymentLink({
        orderCode: reserved.payosOrderCode,
        amount: reserved.totalAmount,
        description: payosDescription(reserved.checkoutCode),
        returnUrl,
        cancelUrl: returnUrl,
        expiredAt: Math.floor(reserved.expiresAt.getTime() / 1000),
      });

      await this.checkoutModel
        .updateOne(
          { _id: reserved._id },
          {
            $set: {
              paymentLinkId: link.paymentLinkId,
              checkoutUrl: link.checkoutUrl,
            },
          },
        )
        .exec();

      return link.checkoutUrl;
    } catch (err: unknown) {
      this.logger.error(
        `Tạo payment link PayOS thất bại cho ${reserved.checkoutCode}: ${String(err)}`,
      );
      await this.paymentResult.cancelCheckout(
        reserved._id,
        CheckoutStatus.FAILED,
        PAYMENT_LINK_FAILED_REASON,
      );
      throw new BadGatewayException(
        'Không tạo được liên kết thanh toán, vui lòng thử lại',
      );
    }
  }

  private findShortages(
    lines: Map<string, number>,
    products: Map<string, CheckoutProduct>,
  ): StockShortageDto[] {
    const shortages: StockShortageDto[] = [];
    for (const [productId, requested] of lines) {
      const product = products.get(productId);
      const available = product && isSellable(product) ? product.stock : 0;
      if (available < requested) {
        shortages.push({
          productId,
          name: product?.name ?? 'Sản phẩm không tồn tại',
          available,
          requested,
        });
      }
    }
    return shortages;
  }

  private async loadProducts(
    ids: string[],
  ): Promise<Map<string, CheckoutProduct>> {
    const products = await this.productModel
      .find({ _id: { $in: ids.map((id) => new Types.ObjectId(id)) } })
      .select(PRODUCT_FIELDS)
      .lean<CheckoutProduct[]>()
      .exec();
    return new Map(products.map((p) => [p._id.toString(), p]));
  }

  private async loadShopNames(
    sellerIds: string[],
  ): Promise<Map<string, string>> {
    const sellers = await this.userModel
      .find({
        _id: {
          $in: [...new Set(sellerIds)].map((id) => new Types.ObjectId(id)),
        },
      })
      .select('shop.shopName')
      .lean<
        { _id: Types.ObjectId; shop?: { shopName?: string | null } | null }[]
      >()
      .exec();
    return new Map(
      sellers.map((s) => [
        s._id.toString(),
        s.shop?.shopName || DEFAULT_SHOP_NAME,
      ]),
    );
  }

  private findForResult(filter: {
    checkoutCode: string;
    userId: Types.ObjectId;
  }) {
    return this.checkoutModel
      .findOne(filter)
      .select(
        'checkoutCode status totalAmount payosOrderCode expiresAt checkoutUrl',
      )
      .lean<
        ReconcileCheckout & { checkoutCode: string; checkoutUrl: string | null }
      >()
      .exec();
  }

  private resultUrl(checkoutCode: string): string {
    const base = this.config
      .get<string>('FRONTEND_URL', 'http://localhost:5173')
      .replace(/\/+$/, '');
    return `${base}/checkout/result?checkoutCode=${encodeURIComponent(checkoutCode)}`;
  }

  private expireMinutes(): number {
    const value = Number(this.config.get('CHECKOUT_EXPIRE_MINUTES'));
    return Number.isFinite(value) && value > 0
      ? value
      : DEFAULT_CHECKOUT_EXPIRE_MINUTES;
  }
}
