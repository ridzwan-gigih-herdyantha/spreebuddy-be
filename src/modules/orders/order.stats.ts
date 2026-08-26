import Order, { OrderStatus } from './order.model.js';
import Product from '../products/product.model.js';
import { User, NON_ADMIN_FILTER } from '../users/user.model.js';

const DAY = 86_400_000;
const RECENT = 6;

const dayKey = (date: Date) => date.toISOString().slice(0, 10);

const startOfDay = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

export function parseDays(raw: unknown): number | null {
  if (typeof raw !== 'string' || !raw.trim() || raw === 'all') return null;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : null;
}

async function perDay(since: Date | null) {
  const match = since ? { createdAt: { $gte: since } } : {};
  return Order.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        orders: { $sum: 1 },
        revenue: {
          $sum: { $cond: [{ $eq: ['$status', OrderStatus.CANCELLED] }, 0, '$total'] },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);
}

export async function orderStats(days: number | null) {
  const today = startOfDay(new Date());
  const since = days ? new Date(today.getTime() - (days - 1) * DAY) : null;
  const scopedMatch = since ? { createdAt: { $gte: since } } : {};

  const [totals, scoped, statuses, daily, recent, products, customers, oldest] =
    await Promise.all([
      Order.aggregate([
        {
          $group: {
            _id: null,
            orders: { $sum: 1 },
            revenue: {
              $sum: { $cond: [{ $eq: ['$status', OrderStatus.CANCELLED] }, 0, '$total'] },
            },
          },
        },
      ]),
      Order.aggregate([
        { $match: scopedMatch },
        {
          $group: {
            _id: null,
            orders: { $sum: 1 },
            revenue: {
              $sum: { $cond: [{ $eq: ['$status', OrderStatus.CANCELLED] }, 0, '$total'] },
            },
          },
        },
      ]),
      Order.aggregate([
        { $match: scopedMatch },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      perDay(since),
      Order.find(scopedMatch)
        .sort({ createdAt: -1, _id: -1 })
        .limit(RECENT)
        .populate(['productId', 'userId']),
      Product.countDocuments({}),
      User.countDocuments(NON_ADMIN_FILTER),
      Order.findOne({}).sort({ createdAt: 1, _id: 1 }).select('createdAt'),
    ]);

  const spanDays =
    days ??
    (oldest
      ? Math.ceil((today.getTime() - startOfDay(oldest.createdAt).getTime()) / DAY) + 1
      : 1);

  const byDay = new Map(daily.map((r) => [r._id as string, r]));
  const series = Array.from({ length: spanDays }, (_, index) => {
    const at = new Date(today.getTime() - (spanDays - 1 - index) * DAY);
    const row = byDay.get(dayKey(at));
    return {
      date: dayKey(at),
      label: `${at.getUTCDate()}/${at.getUTCMonth() + 1}`,
      orders: (row?.orders as number) ?? 0,
      revenue: (row?.revenue as number) ?? 0,
    };
  });

  const counts = new Map(statuses.map((r) => [r._id as string, r.count as number]));

  return {
    range: { days, spanDays, since: since ? since.toISOString() : null },
    totals: {
      revenue: totals[0]?.revenue ?? 0,
      orders: totals[0]?.orders ?? 0,
      products,
      customers,
    },
    scoped: { orders: scoped[0]?.orders ?? 0, revenue: scoped[0]?.revenue ?? 0 },
    byStatus: Object.values(OrderStatus).map((status) => ({
      status,
      count: counts.get(status) ?? 0,
    })),
    series,
    recent,
  };
}
