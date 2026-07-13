import { Request, Response } from 'express';
import { sendSuccess, sendCreated } from '../../common/http/response.js';
import { parsePagination, paginationMeta } from '../../common/http/pagination.js';

import * as categoryService from './category.service.js';
import { CategoryResource } from './category.resource.js';
import { CreateCategoryBody, UpdateCategoryBody } from './category.schema.js';

export async function listCategories(req: Request, res: Response) {
    const { page, limit, skip } = parsePagination(req.query);
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;
    const { categories, total } = await categoryService.listCategories({ skip, limit, search: search || undefined });

    return sendSuccess(
        res,
        CategoryResource.collection(categories),
        'Categories retrieved',
        200,
        paginationMeta(total, page, limit),
    );
}

export async function getCategory(req: Request, res: Response) {
    const id = String(req.params.id);
    const category = await categoryService.getCategoryById(id);
    return sendSuccess(res, CategoryResource.item(category), 'Category retrieved');
}

export async function createCategoryHandler(req: Request, res: Response) {
    const category = await categoryService.createCategory(req.body as CreateCategoryBody);
    return sendCreated(res, CategoryResource.item(category), 'Category created');
}

export async function updateCategoryHandler(req: Request, res: Response) {
    const id = String(req.params.id);
    const category = await categoryService.updateCategory(id, req.body as UpdateCategoryBody);
    return sendSuccess(res, CategoryResource.item(category), 'Category updated');
}

export async function deleteCategoryHandler(req: Request, res: Response) {
    const id = String(req.params.id);
    await categoryService.deleteCategory(id);
    return sendSuccess(res, null, 'Category deleted');
}
