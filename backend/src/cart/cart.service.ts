import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Error as MongooseError, Model, Types } from 'mongoose';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import {
  Cart,
  CartDocument,
  CartItem,
  MAX_CART_ITEMS,
} from './schemas/cart.schema';
import {
  AddCartItemDto,
  MergeCartDto,
  UpdateCartItemDto,
} from './dto/cart-item.dto';
import {
  CartGroupDto,
  CartItemStatus,
  CartResponseDto,
} from './dto/cart-response.dto';

interface CartProduct {
  _id: Types.ObjectId;
  sellerId: Types.ObjectId;
  name: string;
  slug: string;
  images: string[];
  price: number;
  stock: number;
  isActive: boolean;
  isBlocked: boolean;
}

const PRODUCT_FIELDS =
  'sellerId name slug images price stock isActive isBlocked';

const oid = (id: string | Types.ObjectId) => new Types.ObjectId(id);

const isSellable = (p: CartProduct) => p.isActive && !p.isBlocked;

const itemStatus = (p: CartProduct, quantity: number): CartItemStatus => {
  if (!isSellable(p)) return 'unavailable';
  if (p.stock === 0) return 'out_of_stock';
  if (quantity > p.stock) return 'exceeds_stock';
  return 'available';
};

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name)
    private readonly cartModel: Model<CartDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async getCart(userId: string): Promise<CartResponseDto> {
    const cart = await this.cartModel
      .findOne({ userId: oid(userId) })
      .lean<{ items: CartItem[] }>()
      .exec();
    return this.buildResponse(userId, cart?.items ?? []);
  }

  async addItem(userId: string, dto: AddCartItemDto): Promise<CartResponseDto> {
    const product = await this.findSellable(dto.productId, userId);
    const cart = await this.findOrCreate(userId);
    const existing = this.findItem(cart, product._id);
    const quantity = (existing?.quantity ?? 0) + dto.quantity;

    this.assertWithinStock(product, quantity);

    if (existing) {
      existing.quantity = quantity;
    } else {
      if (cart.items.length >= MAX_CART_ITEMS) {
        throw new BadRequestException(
          `Giỏ hàng tối đa ${MAX_CART_ITEMS} sản phẩm`,
        );
      }
      cart.items.unshift({ productId: product._id, quantity });
    }

    await this.save(cart);
    return this.buildResponse(userId, cart.items);
  }

  async updateItem(
    userId: string,
    productId: string,
    dto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    const cart = await this.cartModel.findOne({ userId: oid(userId) }).exec();
    const item = cart && this.findItem(cart, oid(productId));
    if (!cart || !item) {
      throw new NotFoundException('Sản phẩm không có trong giỏ hàng');
    }

    const product = await this.findSellable(productId, userId);
    this.assertWithinStock(product, dto.quantity);

    item.quantity = dto.quantity;
    await this.save(cart);
    return this.buildResponse(userId, cart.items);
  }

  async removeItem(
    userId: string,
    productId: string,
  ): Promise<CartResponseDto> {
    const cart = await this.cartModel
      .findOneAndUpdate(
        { userId: oid(userId) },
        { $pull: { items: { productId: oid(productId) } } },
        { returnDocument: 'after' },
      )
      .lean<{ items: CartItem[] }>()
      .exec();
    return this.buildResponse(userId, cart?.items ?? []);
  }

  async clear(userId: string): Promise<CartResponseDto> {
    await this.cartModel
      .updateOne({ userId: oid(userId) }, { $set: { items: [] } })
      .exec();
    return { groups: [], totalAmount: 0 };
  }

  async merge(userId: string, dto: MergeCartDto): Promise<CartResponseDto> {
    const incoming = new Map<string, number>();
    for (const { productId, quantity } of dto.items) {
      incoming.set(productId, (incoming.get(productId) ?? 0) + quantity);
    }
    if (incoming.size === 0) return this.getCart(userId);

    const products = await this.loadProducts([...incoming.keys()]);
    const cart = await this.findOrCreate(userId);

    for (const [productId, added] of incoming) {
      const product = products.get(productId);
      if (
        !product ||
        !isSellable(product) ||
        product.stock === 0 ||
        product.sellerId.toString() === userId
      ) {
        continue;
      }

      const existing = this.findItem(cart, product._id);
      if (existing) {
        existing.quantity = Math.max(
          existing.quantity,
          Math.min(existing.quantity + added, product.stock),
        );
      } else if (cart.items.length < MAX_CART_ITEMS) {
        cart.items.push({
          productId: product._id,
          quantity: Math.min(added, product.stock),
        });
      }
    }

    await this.save(cart);
    return this.buildResponse(userId, cart.items);
  }

  private async buildResponse(
    userId: string,
    items: CartItem[],
  ): Promise<CartResponseDto> {
    if (items.length === 0) return { groups: [], totalAmount: 0 };

    const products = await this.loadProducts(items.map((i) => i.productId));

    const missing = items
      .map((i) => i.productId)
      .filter((id) => !products.has(id.toString()));
    if (missing.length > 0) {
      await this.cartModel
        .updateOne(
          { userId: oid(userId) },
          { $pull: { items: { productId: { $in: missing } } } },
        )
        .exec();
    }

    const shopNames = await this.loadShopNames([...products.values()]);
    const groups = new Map<string, CartGroupDto>();

    for (const { productId, quantity } of items) {
      const product = products.get(productId.toString());
      if (!product) continue;

      const sellerId = product.sellerId.toString();
      let group = groups.get(sellerId);
      if (!group) {
        group = {
          seller: { id: sellerId, shopName: shopNames.get(sellerId) ?? null },
          items: [],
          subtotal: 0,
        };
        groups.set(sellerId, group);
      }

      const status = itemStatus(product, quantity);
      const lineTotal = product.price * quantity;
      group.items.push({
        product: {
          id: product._id.toString(),
          name: product.name,
          slug: product.slug,
          imageUrl: product.images[0] ?? null,
          price: product.price,
          stock: product.stock,
        },
        quantity,
        status,
        lineTotal,
      });
      if (status === 'available') group.subtotal += lineTotal;
    }

    const list = [...groups.values()];
    return {
      groups: list,
      totalAmount: list.reduce((sum, g) => sum + g.subtotal, 0),
    };
  }

  private async loadProducts(
    ids: (string | Types.ObjectId)[],
  ): Promise<Map<string, CartProduct>> {
    const products = await this.productModel
      .find({ _id: { $in: ids.map(oid) } })
      .select(PRODUCT_FIELDS)
      .lean<CartProduct[]>()
      .exec();
    return new Map(products.map((p) => [p._id.toString(), p]));
  }

  private async loadShopNames(
    products: CartProduct[],
  ): Promise<Map<string, string | null>> {
    const sellerIds = [...new Set(products.map((p) => p.sellerId.toString()))];
    const sellers = await this.userModel
      .find({ _id: { $in: sellerIds.map(oid) } })
      .select('shop.shopName')
      .lean<
        { _id: Types.ObjectId; shop?: { shopName?: string | null } | null }[]
      >()
      .exec();
    return new Map(
      sellers.map((s) => [s._id.toString(), s.shop?.shopName ?? null]),
    );
  }

  private async findSellable(
    productId: string,
    userId: string,
  ): Promise<CartProduct> {
    const product = await this.productModel
      .findById(productId)
      .select(PRODUCT_FIELDS)
      .lean<CartProduct>()
      .exec();

    if (!product || !isSellable(product)) {
      throw new BadRequestException('Sản phẩm không tồn tại hoặc đã ngừng bán');
    }
    if (product.sellerId.toString() === userId) {
      throw new BadRequestException(
        'Bạn không thể mua sản phẩm của chính mình',
      );
    }
    return product;
  }

  private assertWithinStock(product: CartProduct, quantity: number): void {
    if (product.stock === 0) {
      throw new BadRequestException('Sản phẩm đã hết hàng');
    }
    if (quantity > product.stock) {
      throw new BadRequestException(
        `Số lượng vượt quá tồn kho (còn ${product.stock} sản phẩm)`,
      );
    }
  }

  private findItem(
    cart: CartDocument,
    productId: Types.ObjectId,
  ): CartItem | undefined {
    return cart.items.find((i) => i.productId.equals(productId));
  }

  private async findOrCreate(userId: string): Promise<CartDocument> {
    const filter = { userId: oid(userId) };
    try {
      const cart = await this.cartModel
        .findOneAndUpdate(
          filter,
          { $setOnInsert: filter },
          { upsert: true, returnDocument: 'after' },
        )
        .exec();
      if (cart) return cart;
    } catch (err: unknown) {
      if ((err as { code?: number })?.code !== 11000) throw err;
    }

    const cart = await this.cartModel.findOne(filter).exec();
    if (!cart) {
      throw new ConflictException('Không thể tạo giỏ hàng, vui lòng thử lại');
    }
    return cart;
  }

  private async save(cart: CartDocument): Promise<void> {
    try {
      await cart.save();
    } catch (err: unknown) {
      if (err instanceof MongooseError.VersionError) {
        throw new ConflictException(
          'Giỏ hàng vừa được cập nhật ở nơi khác, vui lòng thử lại',
        );
      }
      throw err;
    }
  }
}
