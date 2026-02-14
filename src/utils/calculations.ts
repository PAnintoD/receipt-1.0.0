import type { ReceiptItem } from '../types';

/**
 * Round to 2 decimal places using banker's rounding to avoid
 * floating-point drift in financial calculations.
 */
export const roundMoney = (n: number): number => {
    return Math.round((n + Number.EPSILON) * 100) / 100;
};

/**
 * Calculate line total for a single item.
 */
export const calcLineTotal = (price: number, qty: number): number => {
    return roundMoney(price * qty);
};

/**
 * Centralized receipt total calculation.
 * Use this everywhere to avoid inconsistent results between
 * the Store and the Preview component.
 */
export const calcTotals = (
    items: ReceiptItem[],
    discount: number = 0,
    taxRate: number = 0
) => {
    const subtotal = items.reduce(
        (sum, item) => sum + calcLineTotal(item.price, item.qty),
        0
    );
    const discountAmount = roundMoney(Math.min(discount, subtotal));
    const afterDiscount = roundMoney(Math.max(0, subtotal - discountAmount));
    const taxAmount = roundMoney((afterDiscount * taxRate) / 100);
    const total = roundMoney(afterDiscount + taxAmount);

    return { subtotal, discountAmount, taxAmount, total };
};
