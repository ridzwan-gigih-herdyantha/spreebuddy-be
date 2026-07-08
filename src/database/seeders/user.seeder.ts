import { fakerID_ID as faker } from '@faker-js/faker';
import { User } from '../../modules/users/user.model.js';
import { ROLES } from '../../common/constants/roles.js';

const DEFAULT_PASSWORD = 'password';

export default {
  name: 'user',

  async run() {
    await User.deleteMany({});
    console.log('[user] Cleared users collection');

    const admin = Array.from({ length: 2 }, (_, i) => {
      const n = i + 1;
      return {
        name: `Admin ${n}`,
        username: `admin${n}`,
        email: `admin${n}@spreebuddy.test`,
        password: DEFAULT_PASSWORD,
        phone: `+62811111111${n.toString().padStart(2, '0')}`,
        role: ROLES.ADMIN,
      };
    });

    const users = Array.from({ length: 20 }, () => {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const fullName = `${firstName} ${lastName}`;

      const username = faker.internet
        .username({ firstName, lastName })
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '');

      const city = faker.location.city();
      const province = faker.location.state();
      const zip = faker.location.zipCode('#####');

      const street = faker.location.streetAddress();
      const district = faker.location.secondaryAddress();
      const phone =
        '08' +
        faker.string.numeric({
          length: 10,
          allowLeadingZeros: true,
        });

      return {
        name: fullName,
        username: `${username}${faker.number.int({ min: 10, max: 999 })}`,
        email: faker.internet.email({
          firstName,
          lastName,
          provider: 'gmail.com',
        }),
        password: DEFAULT_PASSWORD,
        phone: phone,

        address: {
          street,
          district,
          city,
          state: province,
          zip,
          fullAddress: `${street}, ${district}, ${city}, ${province}, ${zip}`,
        },

        role: ROLES.USER,
      };
    });

    // create() agar pre-save hook tetap berjalan
    await User.create([...admin, ...users]);

    const total = await User.countDocuments();
    const adminCount = await User.countDocuments({
      role: ROLES.ADMIN,
    });

    console.log(
      `[user] Seeded ${total} users (${adminCount} admin, ${
        total - adminCount
      } users). Password: "${DEFAULT_PASSWORD}"`
    );
  },
};