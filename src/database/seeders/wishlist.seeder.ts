import { fakerID_ID as faker } from '@faker-js/faker';
import Wishlist from '../../modules/wishlists/wishlist.model.js';
import { User } from '../../modules/users/user.model.js';
import Product from '../../modules/products/product.model.js';
import { ROLES } from '../../common/constants/roles.js';

const WISHLIST_COUNT = 50;

const NOTES = [
  'Tunggu gajian dulu',
  'Buat kado ulang tahun adik',
  'Cek ukuran dulu sebelum checkout',
  'Nunggu flash sale tanggal kembar',
  'Bandingkan dulu sama toko sebelah',
  'Stok warna hitam lagi kosong',
  'Mau beli pas free ongkir',
];

export default {
  name: 'wishlist',

  async run() {
    await Wishlist.deleteMany({});
    await Wishlist.syncIndexes();
    console.log('[wishlist] Cleared wishlists collection');

    const users = await User.find({ role: ROLES.USER }).select('_id');
    const products = await Product.find().select('_id');

    if (users.length === 0 || products.length === 0) {
      console.warn('[wishlist] No users/products — run user & product seeders first');
      return;
    }

    const capacity = users.length * products.length;
    const target = Math.min(WISHLIST_COUNT, capacity);

    const docs = [];
    const seen = new Set<string>();

    for (let i = 0; docs.length < target && i < capacity; i++) {
      const user = users[i % users.length];
      const product = products[(i * 7 + Math.floor(i / users.length)) % products.length];
      const key = `${user._id}:${product._id}`;
      if (seen.has(key)) continue;
      seen.add(key);

      docs.push({
        userId: user._id,
        productId: product._id,
        note: i % 3 === 0 ? faker.helpers.arrayElement(NOTES) : null,
      });
    }

    await Wishlist.insertMany(docs);
    console.log(`[wishlist] Seeded ${docs.length} wishlist items across ${users.length} users`);
  },
};
