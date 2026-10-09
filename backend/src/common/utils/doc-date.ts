import { Types } from 'mongoose';

export const docDate = (
  value: Date | null | undefined,
  id: Types.ObjectId,
): string => (value ?? id.getTimestamp()).toISOString();
