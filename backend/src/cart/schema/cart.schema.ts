/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({
    timestamps: true,
    collection: 'carts',
})

export class Cart extends Document {
    @Prop({
        type: Types.ObjectId,
        required: true,
        trim: true,
        ref: "User",
    })
    userId: Types.ObjectId;
    @Prop({
        type: [{
            productId: {
                type: Types.ObjectId,
                required: true,
                ref: "Product",
            },
            quantity: {
                type: Number,
                required: true,
                min: 1,
            },
            price: {
                type: Number,
                required: true,
                min: 0,
            },
            isOutOfStock: {
                type: Boolean,
                required: true,
                default: false,
            },
        }],
        required: true,
    })
    items: {
        productId: Types.ObjectId;
        quantity: number;
        price: number;
        isOutOfStock: boolean;
    }[];
}

export const CartSchema = SchemaFactory.createForClass(Cart);
