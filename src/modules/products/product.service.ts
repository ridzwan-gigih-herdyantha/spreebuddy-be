import { QueryFilter } from 'mongoose';
import { ApiError } from '../../common/errors/ApiError.js';
import Product, { IProduct } from './product.model.js';
import { escapeRegExp } from '../../common/utils/escapeRegex.js';

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