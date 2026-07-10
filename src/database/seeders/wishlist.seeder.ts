import { fakerID_ID as faker } from '@faker-js/faker';
import Wishlist from '../../modules/wishlists/wishlist.model.js';
import { User } from '../../modules/users/user.model.js';
import Product from '../../modules/products/product.model.js';
import { ROLES } from '../../common/constants/roles.js';

export default {
  name: 'wishlist',

  async run() {
    await Wishlist.deleteMany({});
    console.log('[wishlist] Cleared wishlists collection');

    const users = await User.find({ role: ROLES.USER }).select('_id');
    const products = await Product.find().select('_id');

    if (users.length === 0 || products.length === 0) {
      console.warn('[wishlist] No users/products — run user & product seeders first');
      return;
    }

    const docs = [];
    for (const user of users) {
      // distinct products per user (unique index on userId+productId)
      const picked = faker.helpers.arrayElements(products, { min: 0, max: 8 });
      for (const product of picked) {
        docs.push({
          userId: user._id,
          productId: product._id,
          note: faker.datatype.boolean() ? faker.lorem.sentence() : null,
        });
      }
    }

    await Wishlist.insertMany(docs);
    console.log(`[wishlist] Seeded ${docs.length} wishlist items for ${users.length} users`);
  },
};
