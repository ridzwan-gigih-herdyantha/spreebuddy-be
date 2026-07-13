import Product from '../../modules/products/product.model.js';
import { fakerID_ID as faker } from '@faker-js/faker';
import { ProductType } from '../../modules/products/product.model.js';
import { CATEGORY_NAMES } from './category.seeder.js';

export default {
  name: 'product',

  async run() {
    await Product.deleteMany({});
    console.log('[product] Cleared products collection');

    const products = Array.from({ length: 60 }, () => {
      const regularPrice = faker.number.float({
        min: 10,
        max: 1000,
        fractionDigits: 2,
      });

      const hasSale = faker.datatype.boolean();

      return {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        type: faker.helpers.arrayElement(Object.values(ProductType)),
        regularPrice,

        salePrice: hasSale
          ? faker.number.float({
              min: 1,
              max: regularPrice,
              fractionDigits: 2,
            })
          : undefined,

        weight: faker.number.int({
          min: 1,
          max: 100,
        }),

        dimensions: {
          length: faker.number.int({
            min: 1,
            max: 100,
          }),
          width: faker.number.int({
            min: 1,
            max: 100,
          }),
          height: faker.number.int({
            min: 1,
            max: 100,
          }),
        },

        stock: faker.number.int({
          min: 1,
          max: 100,
        }),

        category: faker.helpers.arrayElement(CATEGORY_NAMES),
      };
    });

    await Product.create(products);

    console.log(`[product] Seeded ${products.length} products`);
  },
};