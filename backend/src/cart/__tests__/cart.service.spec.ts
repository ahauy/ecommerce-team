import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Error as MongooseError, Types } from 'mongoose';
import { Product } from '../../products/schemas/product.schema';
import { User } from '../../users/schemas/user.schema';
import { CartService } from '../cart.service';
import { Cart, CartItem, MAX_CART_ITEMS } from '../schemas/cart.schema';

const BUYER = new Types.ObjectId().toString();
const SELLER_A = new Types.ObjectId();
const SELLER_B = new Types.ObjectId();

const chain = <T>(value: T) => {
  const q: Record<string, jest.Mock> = {};
  ['select', 'lean'].forEach((m) => {
    q[m] = jest.fn().mockReturnValue(q);
  });
  q.exec = jest.fn().mockResolvedValue(value);
  return q;
};

const makeProduct = (overrides: Record<string, unknown> = {}) => ({
  _id: new Types.ObjectId(),
  sellerId: SELLER_A,
  name: 'Áo thun',
  slug: 'ao-thun-abc123',
  images: ['https://res.cloudinary.com/demo/a.jpg', 'b.jpg'],
  price: 100000,
  stock: 10,
  isActive: true,
  isBlocked: false,
  ...overrides,
});
type TestProduct = ReturnType<typeof makeProduct>;

const item = (p: TestProduct, quantity: number): CartItem => ({
  productId: p._id,
  quantity,
});

const makeCart = (items: CartItem[] = []) => ({
  items,
  save: jest.fn().mockResolvedValue(undefined),
});

describe('CartService', () => {
  let service: CartService;
  const cartModel = {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    updateOne: jest.fn(),
  };
  const productModel = { find: jest.fn(), findById: jest.fn() };
  const userModel = { find: jest.fn() };

  const givenProducts = (...products: TestProduct[]) => {
    productModel.find.mockReturnValue(chain(products));
    productModel.findById.mockImplementation((id: string) =>
      chain(products.find((p) => p._id.toString() === id.toString()) ?? null),
    );
  };
  const givenCart = (cart: ReturnType<typeof makeCart>) => {
    cartModel.findOneAndUpdate.mockReturnValue(chain(cart));
    cartModel.findOne.mockReturnValue(chain(cart));
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    cartModel.updateOne.mockReturnValue(chain({}));
    userModel.find.mockReturnValue(
      chain([
        { _id: SELLER_A, shop: { shopName: 'Shop A' } },
        { _id: SELLER_B, shop: { shopName: 'Shop B' } },
      ]),
    );

    const module = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: getModelToken(Cart.name), useValue: cartModel },
        { provide: getModelToken(Product.name), useValue: productModel },
        { provide: getModelToken(User.name), useValue: userModel },
      ],
    }).compile();
    service = module.get(CartService);
  });

  describe('getCart', () => {
    it('chưa có giỏ: trả giỏ rỗng', async () => {
      cartModel.findOne.mockReturnValue(chain(null));

      await expect(service.getCart(BUYER)).resolves.toEqual({
        groups: [],
        totalAmount: 0,
      });
    });

    it('nhóm theo người bán, gắn trạng thái, chỉ cộng tiền item available', async () => {
      const ok = makeProduct({ price: 100000, stock: 10 });
      const over = makeProduct({ price: 50000, stock: 2 });
      const soldOut = makeProduct({ sellerId: SELLER_B, stock: 0 });
      const blocked = makeProduct({ sellerId: SELLER_B, isBlocked: true });
      givenProducts(ok, over, soldOut, blocked);
      givenCart(
        makeCart([
          item(ok, 2),
          item(over, 5),
          item(soldOut, 1),
          item(blocked, 1),
        ]),
      );

      const cart = await service.getCart(BUYER);

      expect(cart.groups).toHaveLength(2);
      const [a, b] = cart.groups;
      expect(a.seller).toEqual({ id: SELLER_A.toString(), shopName: 'Shop A' });
      expect(a.items.map((i) => i.status)).toEqual([
        'available',
        'exceeds_stock',
      ]);
      expect(a.items[0]).toMatchObject({
        quantity: 2,
        lineTotal: 200000,
        product: {
          price: 100000,
          stock: 10,
          imageUrl: 'https://res.cloudinary.com/demo/a.jpg',
        },
      });
      expect(a.subtotal).toBe(200000);
      expect(b.items.map((i) => i.status)).toEqual([
        'out_of_stock',
        'unavailable',
      ]);
      expect(b.subtotal).toBe(0);
      expect(cart.totalAmount).toBe(200000);
    });

    it('SP không còn tồn tại: bỏ khỏi kết quả và xoá khỏi giỏ', async () => {
      const ok = makeProduct();
      const ghost = makeProduct();
      givenProducts(ok);
      givenCart(makeCart([item(ok, 1), item(ghost, 1)]));

      const cart = await service.getCart(BUYER);

      expect(cart.groups[0].items).toHaveLength(1);
      expect(cartModel.updateOne).toHaveBeenCalledWith(
        { userId: new Types.ObjectId(BUYER) },
        { $pull: { items: { productId: { $in: [ghost._id] } } } },
      );
    });
  });

  describe('addItem', () => {
    it('SP của chính mình: 400', async () => {
      const own = makeProduct({ sellerId: new Types.ObjectId(BUYER) });
      givenProducts(own);

      await expect(
        service.addItem(BUYER, { productId: own._id.toString(), quantity: 1 }),
      ).rejects.toThrow(
        new BadRequestException('Bạn không thể mua sản phẩm của chính mình'),
      );
    });

    it.each([
      ['bị ẩn', { isActive: false }],
      ['bị block', { isBlocked: true }],
    ])('SP %s: 400', async (_label, overrides) => {
      const p = makeProduct(overrides);
      givenProducts(p);

      await expect(
        service.addItem(BUYER, { productId: p._id.toString(), quantity: 1 }),
      ).rejects.toThrow(
        new BadRequestException('Sản phẩm không tồn tại hoặc đã ngừng bán'),
      );
    });

    it('SP hết hàng: 400', async () => {
      const p = makeProduct({ stock: 0 });
      givenProducts(p);
      givenCart(makeCart());

      await expect(
        service.addItem(BUYER, { productId: p._id.toString(), quantity: 1 }),
      ).rejects.toThrow(new BadRequestException('Sản phẩm đã hết hàng'));
    });

    it('thêm mới: đưa lên đầu giỏ', async () => {
      const old = makeProduct();
      const fresh = makeProduct();
      givenProducts(old, fresh);
      const cart = makeCart([item(old, 1)]);
      givenCart(cart);

      await service.addItem(BUYER, {
        productId: fresh._id.toString(),
        quantity: 3,
      });

      expect(cart.items[0]).toEqual({ productId: fresh._id, quantity: 3 });
      expect(cart.save).toHaveBeenCalled();
    });

    it('đã có trong giỏ: cộng dồn', async () => {
      const p = makeProduct({ stock: 10 });
      givenProducts(p);
      const cart = makeCart([item(p, 4)]);
      givenCart(cart);

      await service.addItem(BUYER, {
        productId: p._id.toString(),
        quantity: 3,
      });

      expect(cart.items[0].quantity).toBe(7);
    });

    it('cộng dồn vượt tồn kho: 400 kèm số còn lại', async () => {
      const p = makeProduct({ stock: 5 });
      givenProducts(p);
      const cart = makeCart([item(p, 4)]);
      givenCart(cart);

      await expect(
        service.addItem(BUYER, { productId: p._id.toString(), quantity: 2 }),
      ).rejects.toThrow(
        new BadRequestException('Số lượng vượt quá tồn kho (còn 5 sản phẩm)'),
      );
      expect(cart.save).not.toHaveBeenCalled();
    });

    it(`giỏ đã đủ ${MAX_CART_ITEMS} SP: 400`, async () => {
      const p = makeProduct();
      givenProducts(p);
      givenCart(
        makeCart(
          Array.from({ length: MAX_CART_ITEMS }, () => item(makeProduct(), 1)),
        ),
      );

      await expect(
        service.addItem(BUYER, { productId: p._id.toString(), quantity: 1 }),
      ).rejects.toThrow(
        new BadRequestException(`Giỏ hàng tối đa ${MAX_CART_ITEMS} sản phẩm`),
      );
    });

    it('lần đầu tạo giỏ bị trùng (11000): đọc lại giỏ vừa tạo', async () => {
      const p = makeProduct();
      givenProducts(p);
      const cart = makeCart();
      cartModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockRejectedValue({ code: 11000 }),
      });
      cartModel.findOne.mockReturnValue(chain(cart));

      await service.addItem(BUYER, {
        productId: p._id.toString(),
        quantity: 1,
      });

      expect(cart.items).toHaveLength(1);
    });

    it('xung đột phiên bản khi lưu: 409', async () => {
      const p = makeProduct();
      givenProducts(p);
      const cart = makeCart();
      cart.save.mockRejectedValue(
        new MongooseError.VersionError({ _doc: { _id: 'x' } } as never, 1, [
          'items',
        ]),
      );
      givenCart(cart);

      await expect(
        service.addItem(BUYER, { productId: p._id.toString(), quantity: 1 }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateItem', () => {
    it('SP không có trong giỏ: 404', async () => {
      const p = makeProduct();
      givenProducts(p);
      givenCart(makeCart());

      await expect(
        service.updateItem(BUYER, p._id.toString(), { quantity: 1 }),
      ).rejects.toThrow(
        new NotFoundException('Sản phẩm không có trong giỏ hàng'),
      );
    });

    it('vượt tồn kho: 400, giữ nguyên số lượng cũ', async () => {
      const p = makeProduct({ stock: 3 });
      givenProducts(p);
      const cart = makeCart([item(p, 1)]);
      givenCart(cart);

      await expect(
        service.updateItem(BUYER, p._id.toString(), { quantity: 4 }),
      ).rejects.toThrow(BadRequestException);
      expect(cart.items[0].quantity).toBe(1);
    });

    it('sửa lại số lượng hợp lệ cho item exceeds_stock', async () => {
      const p = makeProduct({ stock: 2 });
      givenProducts(p);
      const cart = makeCart([item(p, 5)]);
      givenCart(cart);

      const result = await service.updateItem(BUYER, p._id.toString(), {
        quantity: 2,
      });

      expect(result.groups[0].items[0]).toMatchObject({
        quantity: 2,
        status: 'available',
      });
    });
  });

  describe('removeItem / clear', () => {
    it('removeItem dùng $pull và trả giỏ còn lại', async () => {
      const keep = makeProduct();
      const drop = makeProduct();
      givenProducts(keep);
      cartModel.findOneAndUpdate.mockReturnValue(
        chain(makeCart([item(keep, 1)])),
      );

      const result = await service.removeItem(BUYER, drop._id.toString());

      expect(cartModel.findOneAndUpdate).toHaveBeenCalledWith(
        { userId: new Types.ObjectId(BUYER) },
        { $pull: { items: { productId: drop._id } } },
        { returnDocument: 'after' },
      );
      expect(result.groups[0].items).toHaveLength(1);
    });

    it('clear: xoá hết item', async () => {
      await expect(service.clear(BUYER)).resolves.toEqual({
        groups: [],
        totalAmount: 0,
      });
      expect(cartModel.updateOne).toHaveBeenCalledWith(
        { userId: new Types.ObjectId(BUYER) },
        { $set: { items: [] } },
      );
    });
  });

  describe('merge', () => {
    it('gộp trùng, lọc SP không hợp lệ, cap theo tồn kho, không giảm số lượng đã có', async () => {
      const fresh = makeProduct({ stock: 10 });
      const capped = makeProduct({ stock: 4 });
      const existing = makeProduct({ stock: 3 });
      const own = makeProduct({ sellerId: new Types.ObjectId(BUYER) });
      const hidden = makeProduct({ isActive: false });
      const soldOut = makeProduct({ stock: 0 });
      const ghost = makeProduct();
      givenProducts(fresh, capped, existing, own, hidden, soldOut);
      const cart = makeCart([item(existing, 5)]);
      givenCart(cart);

      const line = (p: TestProduct, quantity: number) => ({
        productId: p._id.toString(),
        quantity,
      });
      await service.merge(BUYER, {
        items: [
          line(fresh, 1),
          line(fresh, 2),
          line(capped, 9),
          line(existing, 2),
          line(own, 1),
          line(hidden, 1),
          line(soldOut, 1),
          line(ghost, 1),
        ],
      });

      expect(cart.items).toEqual([
        { productId: existing._id, quantity: 5 },
        { productId: fresh._id, quantity: 3 },
        { productId: capped._id, quantity: 4 },
      ]);
      expect(cart.save).toHaveBeenCalled();
    });

    it('danh sách rỗng: chỉ trả giỏ hiện tại', async () => {
      cartModel.findOne.mockReturnValue(chain(null));

      await expect(service.merge(BUYER, { items: [] })).resolves.toEqual({
        groups: [],
        totalAmount: 0,
      });
      expect(cartModel.findOneAndUpdate).not.toHaveBeenCalled();
    });
  });
});
