import { User } from './user.model.js';

// Fetches a page of users plus the total count (for pagination meta).
export async function listUsers(skip: number, limit: number) {
  const [users, total] = await Promise.all([
    User.find().sort({ createdAt: 1 }).noAdmin().skip(skip).limit(limit),
    User.countDocuments().noAdmin(),
  ]);
  return { users, total };
}
