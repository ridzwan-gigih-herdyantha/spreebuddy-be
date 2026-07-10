import { connectDB, disconnectDB } from '../../config/db.js';

import userSeeder from './user.seeder.js';
import productSeeder from './product.seeder.js';
import wishlistSeeder from './wishlist.seeder.js';
import orderSeeder from './order.seeder.js';

// Order matters: wishlist & order depend on users and products.
const seeders = [
  userSeeder,
  productSeeder,
  wishlistSeeder,
  orderSeeder,
];

async function run() {
  await connectDB();

  const targets = process.argv.slice(2);

  if (targets.length === 0) {
    console.log('Running all seeders...\n');

    for (const seeder of seeders) {
      console.log(`▶ ${seeder.name}`);
      await seeder.run();
    }
  } else {
    for (const target of targets) {
      const seeder = seeders.find((s) => s.name === target);

      if (!seeder) {
        console.warn(`Seeder "${target}" not found`);
        continue;
      }

      console.log(`▶ ${seeder.name}`);
      await seeder.run();
    }
  }

  await disconnectDB();
}

run()
  .then(() => {
    console.log('\n✅ Seeding completed');
    process.exit(0);
  })
  .catch(async (err) => {
    console.error(err);
    await disconnectDB();
    process.exit(1);
  });