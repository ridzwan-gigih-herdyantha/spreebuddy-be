import mongoose, { Schema, Model, HydratedDocument, Types } from 'mongoose';

export enum PaymentStatus {
  CREATED = 'created',
  PAID = 'paid',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

// Denormalised mirror of the payment on each order line, written only by the
// payment service (same discipline as the stock ledger in order.lifecycle).
export enum OrderPaymentStatus {
  UNPAID = 'unpaid',
  AWAITING = 'awaiting',
  PAID = 'paid',
  FAILED = 'failed',
}

export interface ShippingAddress {
  street: string;
  district: string;
  city: string;
  state: string;
  zip: string;
  fullAddress: string;
}

export interface IPayment {
  userId: Types.ObjectId;
  orderIds: Types.ObjectId[];
  provider: string;
  // Provider's checkout session id. Unique so a retry can never fork a payment.
  providerRef: string;
  paymentIntentId?: string;
  checkoutUrl?: string;
  // Every amount is an integer in the currency's minor unit. IDR is
  // zero-decimal, so for this store the minor unit is the rupiah itself.
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
  status: PaymentStatus;
  shippingAddress: ShippingAddress;
  failureReason?: string;
  paidAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentDocument = HydratedDocument<IPayment>;
type PaymentModel = Model<IPayment>;

const addressSchema = new Schema<ShippingAddress>(
  {
    street: { type: String, required: true },
    district: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip: { type: String, required: true },
    fullAddress: { type: String, required: true },
  },
  { _id: false },
);

const paymentSchema = new Schema<IPayment, PaymentModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderIds: [{ type: Schema.Types.ObjectId, ref: 'Order', required: true }],
    provider: { type: String, required: true, default: 'stripe' },
    providerRef: { type: String, required: true, unique: true },
    paymentIntentId: { type: String },
    checkoutUrl: { type: String },
    subtotal: { type: Number, required: true, min: 0 },
    shipping: { type: Number, required: true, min: 0, default: 0 },
    tax: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'idr' },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.CREATED,
      index: true,
    },
    shippingAddress: { type: addressSchema, required: true },
    failureReason: { type: String },
    paidAt: { type: Date },
    expiresAt: { type: Date },
  },
  { timestamps: true },
);

const Payment = mongoose.model<IPayment, PaymentModel>('Payment', paymentSchema);
export default Payment;
