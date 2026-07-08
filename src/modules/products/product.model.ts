import mongoose, { Schema, Model, HydratedDocument } from 'mongoose';

export enum ProductType {
    DIGITAL = 'digital',
    PHYSICAL = 'physical'
}

export interface IProduct {
    name: string;
    type: ProductType;
    description: string;
    regularPrice: number;
    salePrice?: number;
    weight: number;
    dimensions?: {
        length: number;
        width: number;
        height: number;
    };
    stock: number;
    category: string;
    createdAt: Date;
    updatedAt: Date;
}

export type ProductDocument = HydratedDocument<IProduct>;
type ProductModel = Model<IProduct>;

const productSchema = new Schema<IProduct, ProductModel>({
    name: { 
        type: String, 
        required: true 
    },
    type: { 
        type: String, 
        enum: Object.values(ProductType), 
        required: true 
    },
    description: { 
        type: String, 
        required: true 
    },
    regularPrice: { 
        type: Number, 
        required: true, 
        min: 0 
    },
    salePrice: {
        type: Number,
        required: false,
        min: 0
    },
    weight: {
        type: Number,
        required: true,
        min: 0
    },
    dimensions: {
        type: Object,
        required: false,
        length: { 
            type: Number, 
            required: true, 
            min: 0 
        },
        width: { 
            type: Number, 
            required: true, 
            min: 0 
        },
        height: { 
            type: Number, 
            required: true, 
            min: 0 
        }
    },
    stock: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: String,
        required: true
    },
}, { timestamps: true });

const Product = mongoose.model<IProduct, ProductModel>('Product', productSchema);
export default Product;