import { makeResource } from '../../common/http/resource.js';
import { formatDateDMY } from '../../common/utils/formatDate.js';
import {ProductDocument } from './product.model.js';

export interface ProductResponse {
  id: string;
  name: string;
  slug: string;
  type: string;
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
  createdAt: string | null;
  updatedAt: string | null;
}

export const ProductResource = makeResource<ProductDocument, ProductResponse>((p) => ({
  id: p.id,
  name: p.name,
  slug: p.slug,
  type: p.type,
  description: p.description,
  regularPrice: p.regularPrice,
  salePrice: p.salePrice,
  weight: p.weight,
  dimensions: p.dimensions,
  stock: p.stock,
  category: p.category,
  createdAt: formatDateDMY(p.createdAt),
  updatedAt: formatDateDMY(p.updatedAt),
}));