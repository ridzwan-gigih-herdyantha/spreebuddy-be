import Category from '../../modules/categories/category.model.js';

export const CATEGORY_NAMES = [
  'Electronics',
  "Men's Fashion",
  "Women's Fashion",
  'Beauty & Personal Care',
  'Home & Kitchen',
  'Grocery & Gourmet Food',
  'Sports & Outdoors',
  'Toys & Games',
  'Automotive',
  'Books',
];

export default {
  name: 'category',

  async run() {
    await Category.deleteMany({});
    console.log('[category] Cleared categories collection');

    const categories = CATEGORY_NAMES.map((name) => ({ name }));
    await Category.create(categories);

    console.log(`[category] Seeded ${categories.length} categories`);
  },
};
