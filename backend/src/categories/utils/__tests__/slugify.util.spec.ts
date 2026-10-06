import { slugifyVietnamese } from '../slugify.util';

describe('slugifyVietnamese', () => {
  it('should convert simple English text to lowercase kebab-case', () => {
    expect(slugifyVietnamese('Electronics')).toBe('electronics');
    expect(slugifyVietnamese('Home and Kitchen')).toBe('home-and-kitchen');
  });

  it('should correctly strip Vietnamese accents and convert đ/Đ to d', () => {
    expect(slugifyVietnamese('Thời Trang Nam')).toBe('thoi-trang-nam');
    expect(slugifyVietnamese('Điện Thoại & Tablet')).toBe('dien-thoai-tablet');
    expect(slugifyVietnamese('Đồ Gia Dụng')).toBe('do-gia-dung');
    expect(slugifyVietnamese('Thiết Bị Điện Tử')).toBe('thiet-bi-dien-tu');
  });

  it('should cover all Vietnamese tone marks and vowel variants', () => {
    const vowels =
      'á à ả ã ạ ă ắ ằ ẳ ẵ ặ â ấ ầ ẩ ẫ ậ ' +
      'é è ẻ ẽ ẹ ê ế ề ể ễ ệ ' +
      'í ì ỉ ĩ ị ' +
      'ó ò ỏ õ ọ ô ố ồ ổ ỗ ộ ơ ớ ờ ở ỡ ợ ' +
      'ú ù ủ ũ ụ ư ứng ừ ử ữ ự ' +
      'ý ỳ ỷ ỹ ỵ ' +
      'đ Đ';
    const slug = slugifyVietnamese(vowels);
    // There should be no diacritics or uppercase letters or đ/Đ left
    expect(slug).toMatch(/^[a-z0-9-]+$/);
    expect(slug).not.toContain('đ');
    expect(slug).not.toContain('Đ');
  });

  it('should collapse multiple hyphens and whitespace into a single hyphen', () => {
    expect(slugifyVietnamese('  Sách   ---  Văn Phòng Phẩm  ')).toBe(
      'sach-van-phong-pham',
    );
  });

  it('should strip special characters and symbols', () => {
    expect(slugifyVietnamese('Mẹ & Bé @!# 2026')).toBe('me-be-2026');
  });

  it('should handle empty or whitespace-only strings gracefully', () => {
    expect(slugifyVietnamese('')).toBe('');
    expect(slugifyVietnamese('   ')).toBe('');
  });
});
