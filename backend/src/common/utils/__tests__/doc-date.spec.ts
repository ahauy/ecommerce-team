import { Types } from 'mongoose';
import { docDate } from '../doc-date';

describe('docDate', () => {
  const id = new Types.ObjectId('6ac5b0448b6dc4e266f17412');

  it('có ngày thì dùng ngày đó', () => {
    expect(docDate(new Date('2026-10-01T00:00:00.000Z'), id)).toBe(
      '2026-10-01T00:00:00.000Z',
    );
  });

  it('thiếu ngày (undefined / null) thì lấy thời điểm tạo trong ObjectId', () => {
    const expected = id.getTimestamp().toISOString();

    expect(docDate(undefined, id)).toBe(expected);
    expect(docDate(null, id)).toBe(expected);
  });
});
