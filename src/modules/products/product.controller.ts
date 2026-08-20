import { Request, Response } from 'express';
import { sendSuccess, sendCreated } from '../../common/http/response.js';
import { parsePagination, paginationMeta } from '../../common/http/pagination.js';

import * as productService from './product.service.js';
import { ProductResource } from './product.resource.js';
import { CreateProductBody, UpdateProductBody } from './product.schema.js';

export async function listProducts(req: Request, res: Response) {
    const { page, limit, skip } = parsePagination(req.query);
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : undefined;
    const { products, total } = await productService.listProducts({
        skip,
        limit,
        search: search || undefined,
        category: category || undefined,
    });

    return sendSuccess(
        res,
        ProductResource.collection(products),
        'Products retrieved',
        200,
        paginationMeta(total, page, limit),
    );
}

// Public product detail by slug.
export async function getProduct(req: Request, res: Response) {
    const slug = String(req.params.slug);
    const product = await productService.getProductBySlug(slug);
    return sendSuccess(res, ProductResource.item(product), 'Product retrieved');
}

export async function createProductHandler(req: Request, res: Response) {
    const product = await productService.createProduct(req.body as CreateProductBody);
    return sendCreated(res, ProductResource.item(product), 'Product created');
}

export async function updateProductHandler(req: Request, res: Response) {
    const id = String(req.params.id);
    const product = await productService.updateProduct(id, req.body as UpdateProductBody);
    return sendSuccess(res, ProductResource.item(product), 'Product updated');
}

export async function deleteProductHandler(req: Request, res: Response) {
    const id = String(req.params.id);
    await productService.deleteProduct(id);
    return sendSuccess(res, null, 'Product deleted');
}