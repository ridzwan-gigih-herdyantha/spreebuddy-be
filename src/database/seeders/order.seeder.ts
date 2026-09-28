import { fakerID_ID as faker } from '@faker-js/faker';
import Order, { OrderStatus } from '../../modules/orders/order.model.js';
import { OrderPaymentStatus } from '../../modules/payments/payment.model.js';
import { User } from '../../modules/users/user.model.js';
import Product from '../../modules/products/product.model.js';
import { ROLES } from '../../common/constants/roles.js';

const ORDER_COUNT = 50;

const PAYMENT_STATUS_BY_ORDER_STATUS: Record<OrderStatus, OrderPaymentStatus> = {
  [OrderStatus.PENDING]: OrderPaymentStatus.UNPAID,
  [OrderStatus.PROCESSING]: OrderPaymentStatus.PAID,
  [OrderStatus.SHIPPED]: OrderPaymentStatus.PAID,
  [OrderStatus.DELIVERED]: OrderPaymentStatus.PAID,
  [OrderStatus.CANCELLED]: OrderPaymentStatus.FAILED,
};

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

    const docs = Array.from({ length: ORDER_COUNT }, (_, i) => {
      const user = users[i % users.length];
      const product = faker.helpers.arrayElement(products);
      const quantity = faker.number.int({ min: 1, max: 4 });
      const price = product.salePrice ?? product.regularPrice;
      const status = faker.helpers.arrayElement(statuses);

      return {
        userId: user._id,
        productId: product._id,
        quantity,
        price,
        total: price * quantity,
        status,
        paymentStatus: PAYMENT_STATUS_BY_ORDER_STATUS[status],
        createdAt: faker.date.past({ years: 1 }),
      };
    });

    await Order.insertMany(docs);
    console.log(`[order] Seeded ${docs.length} orders across ${users.length} users`);
  },
};
