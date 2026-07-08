import { Request, Response } from 'express';
import { sendSuccess } from '../../common/http/response.js';
import { parsePagination, paginationMeta } from '../../common/http/pagination.js';

import * as productService from './product.service.js';
import { ProductResource } from './product.resource.js';

export async function listProducts(req: Request, res: Response) {
    const { page, limit, skip } = parsePagination(req.query);
      const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;
    const { products, total } = await productService.listProducts({ skip, limit, search: search || undefined });

    return sendSuccess(
        res,
        ProductResource.collection(products),
        'Products retrieved',
        200,
        paginationMeta(total, page, limit),
    );
}