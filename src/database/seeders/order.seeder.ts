import { fakerID_ID as faker } from '@faker-js/faker';
import Order, { OrderStatus } from '../../modules/orders/order.model.js';
import { User } from '../../modules/users/user.model.js';
import Product from '../../modules/products/product.model.js';
import { ROLES } from '../../common/constants/roles.js';

export default {
  name: 'order',

  async run() {
    await Order.deleteMany({});
    console.log('[order] Cleared orders collection');

    const users = await User.find({ role: ROLES.USER }).select('_id');
    const products = await Product.find().select('_id regularPrice salePrice');

    if (users.length === 0 || products.length === 0) {
      console.warn('[order] No users/products — run user & product seeders first');
      return;
    }

    const statuses = Object.values(OrderStatus);
    const docs = [];

    for (const user of users) {
      const count = faker.number.int({ min: 0, max: 5 });
      for (let i = 0; i < count; i++) {
        const product = faker.helpers.arrayElement(products);
        const quantity = faker.number.int({ min: 1, max: 4 });
        const price = product.salePrice ?? product.regularPrice;
        docs.push({
          userId: user._id,
          productId: product._id,
          quantity,
          price,
          total: price * quantity,
          status: faker.helpers.arrayElement(statuses),
        });
      }
    }

    await Order.insertMany(docs);
    console.log(`[order] Seeded ${docs.length} orders for ${users.length} users`);
  },
};
