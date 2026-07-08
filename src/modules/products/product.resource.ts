import { makeResource } from '../../common/http/resource.js';
import {ProductDocument } from './product.model.js';

export interface ProductResponse {
  id: string;
  name: string;
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
  createdAt: Date;
  updatedAt: Date;
}

export const ProductResource = makeResource<ProductDocument, ProductResponse>((p) => ({
  id: p.id,
  name: p.name,
  type: p.type,
  description: p.description,
  regularPrice: p.regularPrice,
  salePrice: p.salePrice,
  weight: p.weight,
  dimensions: p.dimensions,
  stock: p.stock,
  category: p.category,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
}));