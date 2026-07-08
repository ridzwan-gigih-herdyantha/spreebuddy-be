import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../modules/users/user.model.js';
import { ROLES } from '../common/constants/roles.js';

const DEFAULT_PASSWORD = 'password';

async function seedUsers() {
  const admins = Array.from({ length: 2 }, (_, i) => {
    const n = i + 1;
    return {
      name: `Admin ${n}`,
      username: `admin${n}`,
      email: `admin${n}@spreebuddy.test`,
      password: DEFAULT_PASSWORD,
      phone: `+628123456789${n}`,
      role: ROLES.ADMIN,
    };
  });

  const users = Array.from({ length: 10 }, (_, i) => {
    const n = i + 1;
    const zip = `${10000 + n}`;
    return {
      name: `User ${n}`,
      username: `user${n}`,
      email: `user${n}@spreebuddy.test`,
      password: DEFAULT_PASSWORD,
      phone: `+628120000${String(n).padStart(3, '0')}`,
      address: {
        street: `Street ${n}`,
        district: `District ${n}`,
        city: `City ${n}`,
        state: `State ${n}`,
        zip: zip,
        fullAddress: `Street ${n}, District ${n}, City ${n}, State ${n} ${zip}`,
      },
      role: ROLES.USER,
    };
  });

  // Use create() (not insertMany) so the pre-save hook hashes each password.
  await User.create([...admins, ...users]);
}

async function run() {
  await connectDB();

  // Idempotent: wipe users so re-running the seeder gives a clean state.
  await User.deleteMany({});
  console.log('[seed] Cleared users collection');

  await seedUsers();

  const total = await User.countDocuments();
  const adminCount = await User.countDocuments({ role: ROLES.ADMIN });
  console.log(
    `[seed] Inserted ${total} users (${adminCount} admins, ${total - adminCount} regular). ` +
      `Password for all: "${DEFAULT_PASSWORD}"`,
  );

  await disconnectDB();
  process.exit(0);
}

run().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
