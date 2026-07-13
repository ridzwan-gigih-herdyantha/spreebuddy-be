import mongoose, { Schema, Model, HydratedDocument } from 'mongoose';

export interface ICategory {
    name: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

export type CategoryDocument = HydratedDocument<ICategory>;
type CategoryModel = Model<ICategory>;

const categorySchema = new Schema<ICategory, CategoryModel>({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    description: {
        type: String,
        required: false,
        trim: true,
    },
}, { timestamps: true });

const Category = mongoose.model<ICategory, CategoryModel>('Category', categorySchema);
export default Category;
