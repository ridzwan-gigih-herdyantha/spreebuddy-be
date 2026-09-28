import { describe, expect, it } from 'vitest';
import { allowedNextStatuses, canTransition } from '../src/modules/orders/order.lifecycle.js';
import { OrderStatus } from '../src/modules/orders/order.model.js';

const { PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED } = OrderStatus;

describe('which order transitions are legal', () => {
  it('moves an order forward one step at a time', () => {
    expect(canTransition(PENDING, PROCESSING)).toBe(true);
    expect(canTransition(PROCESSING, SHIPPED)).toBe(true);
    expect(canTransition(SHIPPED, DELIVERED)).toBe(true);
  });

  it('refuses to skip a step', () => {
    expect(canTransition(PENDING, SHIPPED)).toBe(false);
    expect(canTransition(PENDING, DELIVERED)).toBe(false);
    expect(canTransition(PROCESSING, DELIVERED)).toBe(false);
  });

  it('refuses to move an order backwards', () => {
    expect(canTransition(SHIPPED, PROCESSING)).toBe(false);
    expect(canTransition(PROCESSING, PENDING)).toBe(false);
  });

  it('allows cancelling only while nothing has shipped', () => {
    expect(canTransition(PENDING, CANCELLED)).toBe(true);
    expect(canTransition(PROCESSING, CANCELLED)).toBe(true);
    expect(canTransition(SHIPPED, CANCELLED)).toBe(false);
    expect(canTransition(DELIVERED, CANCELLED)).toBe(false);
  });

  it('treats delivered and cancelled as final', () => {
    expect(allowedNextStatuses(DELIVERED)).toEqual([]);
    expect(allowedNextStatuses(CANCELLED)).toEqual([]);
  });

  it('never lets a cancelled order come back to life', () => {
    for (const status of Object.values(OrderStatus)) {
      expect(canTransition(CANCELLED, status)).toBe(false);
    }
  });

  it('offers the next steps a dashboard should show', () => {
    expect(allowedNextStatuses(PENDING)).toEqual([PROCESSING, CANCELLED]);
    expect(allowedNextStatuses(PROCESSING)).toEqual([SHIPPED, CANCELLED]);
    expect(allowedNextStatuses(SHIPPED)).toEqual([DELIVERED]);
  });

  it('hands back a copy, so a caller cannot edit the state machine', () => {
    const next = allowedNextStatuses(PENDING);
    next.push(DELIVERED);
    expect(allowedNextStatuses(PENDING)).toEqual([PROCESSING, CANCELLED]);
  });
});
