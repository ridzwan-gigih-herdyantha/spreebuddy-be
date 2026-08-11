import mongoose, { Schema, Model, HydratedDocument, Types } from 'mongoose';


export enum CartItemStatus {
	BOUGHT = 'bought',
	ACTIVE = 'active'
}

export interface ICartItem {
	productId: Types.ObjectId;
	quantity: number;
	status: CartItemStatus;
	total: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface ICart {
  userId: Types.ObjectId;
	items: Types.DocumentArray<ICartItem>;
	total: number;
  createdAt: Date;
  updatedAt: Date;
}

export type CartDocument = HydratedDocument<ICart>;
type CartModel = Model<ICart>;

const cartItemSchema = new Schema<ICartItem>({
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
	status: {
		type: String,
		enum: Object.values(CartItemStatus),
		default: CartItemStatus.ACTIVE
	},
	total: {
		type: Number,
		required: true,
		min: 0
	}
}, { timestamps: true });	

const cartSchema = new Schema<ICart, CartModel>(
	{
		userId: { 
			type: Schema.Types.ObjectId, 
			ref: 'User', 
			required: true 
		},
		items: [cartItemSchema],
		total: {
			type: Number,
			required: true,
			min: 0
		}
	},
	{ timestamps: true },
);

const Cart = mongoose.model<ICart, CartModel>('Cart', cartSchema);
export default Cart;