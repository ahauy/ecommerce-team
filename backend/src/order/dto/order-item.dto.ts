import { Types } from 'mongoose';

export class CreateOrderDto {
  recipient: {
    fullName: string;
    phone: string;
    email: string;
    address: string;
  };
  items: [
    {
      productId: Types.ObjectId;
      quantity: number;
    },
  ];
}
