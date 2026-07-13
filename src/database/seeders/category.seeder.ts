import Category from '../../modules/categories/category.model.js';

export const CATEGORY_NAMES = [
  'Elektronik',
  'Fashion Pria',
  'Fashion Wanita',
  'Kesehatan & Kecantikan',
  'Rumah Tangga',
  'Makanan & Minuman',
  'Olahraga & Outdoor',
  'Hobi & Koleksi',
  'Otomotif',
  'Buku & Alat Tulis',
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
