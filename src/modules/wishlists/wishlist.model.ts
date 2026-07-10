import mongoose, { Schema, Model, HydratedDocument, Types } from 'mongoose';

export interface IWishlist {
  userId: Types.ObjectId;
  productId: Types.ObjectId;
  note?: string | null; // optional context (user note / AI-assisted)
  createdAt: Date;
  updatedAt: Date;
}

export type WishlistDocument = HydratedDocument<IWishlist>;
type WishlistModel = Model<IWishlist>;

const wishlistSchema = new Schema<IWishlist, WishlistModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    note: { type: String, required: false, default: null },
  },
  { timestamps: true },
);

// A product can appear once per user's wishlist.
wishlistSchema.index({ userId: 1, productId: 1 }, { unique: true });

const Wishlist = mongoose.model<IWishlist, WishlistModel>('Wishlist', wishlistSchema);
export default Wishlist;
