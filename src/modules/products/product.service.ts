import { QueryFilter } from 'mongoose';
import { ApiError } from '../../common/errors/ApiError.js';
import Product, { IProduct, ProductDocument } from './product.model.js';
import { escapeRegExp } from '../../common/utils/escapeRegex.js';
import { generateSlug } from '../../common/utils/slug.js';
import { CreateProductBody, UpdateProductBody } from './product.schema.js';
import { assertCategoryExists } from '../categories/category.service.js';

export async function listProducts({ skip, limit, search }: { skip: number; limit: number; search?: string }) {
    const filter: QueryFilter<IProduct> = {};

    if (search) {
        const regex = new RegExp(escapeRegExp(search), 'i');
        filter.$or = [{ name: regex }, 
            { description: regex },
            { category: regex },
            { type: regex }
        ];
    }

    const [products, total] = await Promise.all([
        Product.find(filter).sort({ createdAt: 1 }).skip(skip).limit(limit),
        Product.countDocuments(filter),
    ]);
    return { products, total };
}

export async function getProductByMultiId(ids: string[]): Promise<ProductDocument[]> {
    return Product.find({ _id: { $in: ids } });
}

export async function getProductById(id: string) {
    const product = await Product.findById(id);
    if (!product) throw ApiError.notFound('Product not found');
    return product;
}

export async function getProductBySlug(slug: string) {
    const product = await Product.findOne({ slug });
    if (!product) throw ApiError.notFound('Product not found');
    return product;
}

export async function createProduct(input: CreateProductBody) {
    await assertCategoryExists(input.category);
    return Product.create({ ...input, slug: generateSlug(input.name) });
}

export async function updateProduct(id: string, update: UpdateProductBody) {
    const product = await Product.findById(id);
    if (!product) throw ApiError.notFound('Product not found');

    if (update.category !== undefined) await assertCategoryExists(update.category);

    Object.assign(product, update);
    // Regenerate the slug on edit (new timestamp + random suffix).
    product.slug = generateSlug(product.name);
    await product.save();
    return product;
}

export async function deleteProduct(id: string) {
    const product = await Product.findByIdAndDelete(id);
    if (!product) throw ApiError.notFound('Product not found');
    return product;
}