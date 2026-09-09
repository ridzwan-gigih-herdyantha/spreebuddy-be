import mongoose, { Schema, Model, HydratedDocument, Types } from 'mongoose';
import { OrderPaymentStatus } from '../payments/payment.model.js';

export enum OrderStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    SHIPPED = 'shipped',
    DELIVERED = 'delivered',
    CANCELLED = 'cancelled'
}

export interface IOrder {
  userId: Types.ObjectId;
  productId: Types.ObjectId;
  quantity: number;
  price: number; // unit price snapshot at order time
  total: number; // price * quantity
  status: OrderStatus;
  paymentId?: Types.ObjectId;
  paymentStatus: OrderPaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type OrderDocument = HydratedDocument<IOrder>;
type OrderModel = Model<IOrder>;

const orderSchema = new Schema<IOrder, OrderModel>(
  {
    userId: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    productId: { 
        type: Schema.Types.ObjectId, 
        ref: 'Product', 
        required: true 
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    total: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: Object.values(OrderStatus), default: OrderStatus.PENDING },
    paymentId: {
        type: Schema.Types.ObjectId,
        ref: 'Payment',
        index: true
    },
    paymentStatus: {
        type: String,
        enum: Object.values(OrderPaymentStatus),
        default: OrderPaymentStatus.UNPAID
    },
  },
  { timestamps: true },
);

const Order = mongoose.model<IOrder, OrderModel>('Order', orderSchema);
export default Order;