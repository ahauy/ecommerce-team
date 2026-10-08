import { randomInt } from 'crypto';

export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const CODE_SUFFIX_LENGTH = 10;
export const PAYOS_DESCRIPTION_LENGTH = 9;

const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;

const randomSuffix = (length = CODE_SUFFIX_LENGTH): string =>
  Array.from(
    { length },
    () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)],
  ).join('');

const vietnamDate = (now: Date): string =>
  new Date(now.getTime() + VIETNAM_OFFSET_MS)
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, '');

export const generateCheckoutCode = (now = new Date()): string =>
  `CHK-${vietnamDate(now)}-${randomSuffix()}`;

export const generateOrderCode = (now = new Date()): string =>
  `ORD-${vietnamDate(now)}-${randomSuffix()}`;

export const generatePayosOrderCode = (now = new Date()): number =>
  now.getTime() * 1000 + randomInt(1000);

export const payosDescription = (checkoutCode: string): string =>
  checkoutCode.slice(-PAYOS_DESCRIPTION_LENGTH);
