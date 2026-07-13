import { QueryFilter } from 'mongoose';
import { ApiError } from '../../common/errors/ApiError.js';
import { escapeRegExp } from '../../common/utils/escapeRegex.js';
import Category, { ICategory } from './category.model.js';
import { CreateCategoryBody, UpdateCategoryBody } from './category.schema.js';

export async function listCategories({ skip, limit, search }: { skip: number; limit: number; search?: string }) {
    const filter: QueryFilter<ICategory> = {};

    if (search) {
        const regex = new RegExp(escapeRegExp(search), 'i');
        filter.$or = [{ name: regex }, { description: regex }];
    }

    const [categories, total] = await Promise.all([
        Category.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
        Category.countDocuments(filter),
    ]);
    return { categories, total };
}

export async function getCategoryById(id: string) {
    const category = await Category.findById(id);
    if (!category) throw ApiError.notFound('Category not found');
    return category;
}

export async function createCategory(input: CreateCategoryBody) {
    const existing = await Category.findOne({ name: input.name });
    if (existing) throw ApiError.conflict('Category with this name already exists');
    return Category.create(input);
}

export async function updateCategory(id: string, update: UpdateCategoryBody) {
    const category = await Category.findById(id);
    if (!category) throw ApiError.notFound('Category not found');

    if (update.name && update.name !== category.name) {
        const clash = await Category.findOne({ name: update.name });
        if (clash) throw ApiError.conflict('Category with this name already exists');
    }

    Object.assign(category, update);
    await category.save();
    return category;
}

export async function deleteCategory(id: string) {
    const category = await Category.findByIdAndDelete(id);
    if (!category) throw ApiError.notFound('Category not found');
    return category;
}

// Ensures the given category name exists; used when creating/updating products.
export async function assertCategoryExists(name: string) {
    const exists = await Category.exists({ name });
    if (!exists) {
        throw ApiError.validation('Validation failed', [
            { field: 'category', message: `Category "${name}" does not exist` },
        ]);
    }
}
