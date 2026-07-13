import { makeResource } from '../../common/http/resource.js';
import { formatDateDMY } from '../../common/utils/formatDate.js';
import { CategoryDocument } from './category.model.js';

export interface CategoryResponse {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export const CategoryResource = makeResource<CategoryDocument, CategoryResponse>((c) => ({
  id: c.id,
  name: c.name,
  description: c.description ?? null,
  createdAt: formatDateDMY(c.createdAt),
  updatedAt: formatDateDMY(c.updatedAt),
}));
