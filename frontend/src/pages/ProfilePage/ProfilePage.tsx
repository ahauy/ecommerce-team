import React from 'react';
import { Link } from 'react-router-dom';
import { userService } from '@/services/user.service';
import ProfileForm from '@/components/ProfileForm/ProfileForm';
import { Button } from '@/components/ui/button';
import BaseUrl from '@/consts/baseUrl';
import { User, Store, Calendar, MapPin, Phone, Mail, ExternalLink } from 'lucide-react';

const formatDate = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  try {
    if (dateStr.includes('T')) {
      const [datePart] = dateStr.split('T');
      const [y, m, d] = datePart.split('-');
      if (y && m && d) {
        return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
      }
    }
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
};

const ProfilePage: React.FC = () => {
  const { data: profile, isPending, isError } = userService.useGetProfile();

  if (isPending) {
    return (
      <div className="flex min-h-[400px] w-full items-center justify-center p-8 bg-[#fbfbf5]">
        <div className="flex items-center gap-3 text-zinc-600">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
          <span className="text-base font-medium">Đang tải hồ sơ...</span>
        </div>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="flex min-h-[400px] w-full items-center justify-center p-8 bg-[#fbfbf5]">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700 max-w-md">
          <p className="font-medium">Không thể tải thông tin hồ sơ.</p>
          <p className="text-sm mt-1 text-red-700">Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="profile-page"
      className="w-full min-h-screen bg-[#fbfbf5] py-8 md:py-12 px-4 sm:px-6 lg:px-8"
      style={{ fontFeatureSettings: '"ss03"' }}
    >
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Page Header */}
        <header className="space-y-1">
          <h1 className="text-3xl font-medium tracking-tight text-zinc-900">
            Hồ sơ cá nhân
          </h1>
          <p className="text-sm text-zinc-500">
            Quản lý thông tin cá nhân và thông tin gian hàng của bạn.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Summary Card */}
          <div className="space-y-6">
            <div
              data-testid="profile-card"
              className="bg-white rounded-2xl p-6 border border-[#e4e4e7] shadow-card space-y-6"
            >
              <div className="flex items-center gap-4 pb-6 border-b border-[#e4e4e7]">
                <div className="w-14 h-14 rounded-full bg-zinc-100 border border-[#e4e4e7] flex items-center justify-center text-lg font-semibold text-zinc-900 shrink-0">
                  {profile.fullName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs uppercase tracking-wider text-zinc-400 font-medium">Tài khoản</p>
                  <h2 className="text-lg font-semibold text-zinc-900 truncate">
                    {profile.fullName}
                  </h2>
                  <p className="text-xs text-zinc-500 truncate flex items-center gap-1 mt-0.5">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span>{profile.email}</span>
                  </p>
                </div>
              </div>

              {/* Display details */}
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2.5 text-zinc-600">
                  <User className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                  <span className="text-zinc-900 font-medium">{profile.fullName}</span>
                </div>
                <div className="flex items-start gap-2.5 text-zinc-600">
                  <Mail className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                  <span className="text-zinc-700">{profile.email}</span>
                </div>
                <div className="flex items-start gap-2.5 text-zinc-600">
                  <Phone className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                  <span className="text-zinc-700">
                    {profile.phone || 'Chưa cập nhật số điện thoại'}
                  </span>
                </div>
                <div className="flex items-start gap-2.5 text-zinc-600">
                  <MapPin className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                  <span className="text-zinc-700 break-words">
                    {profile.address || 'Chưa cập nhật địa chỉ'}
                  </span>
                </div>
              </div>

              {/* Shop Badge Status */}
              <div className="pt-4 border-t border-[#e4e4e7]">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Trạng thái bán hàng:</span>
                  {profile.shop ? (
                    <span className="inline-flex items-center gap-1 font-medium text-black bg-aloe px-2.5 py-1 rounded-full border border-[#e4e4e7]">
                      <Store className="w-3 h-3" />
                      Đang hoạt động
                    </span>
                  ) : (
                    <span className="text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-full border border-zinc-200">
                      Chưa kích hoạt
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Shop Box / Card */}
            {profile.shop ? (
              <div className="bg-pistachio rounded-2xl p-6 border border-[#e4e4e7] shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Store className="w-5 h-5 text-zinc-900" />
                    <h3 className="font-semibold text-zinc-900 text-base">Gian hàng của bạn</h3>
                  </div>
                  <Link
                    to={`/shops/${profile.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-zinc-800 hover:text-black hover:underline"
                  >
                    <span>Xem gian hàng</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                <div className="space-y-2 text-sm bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-[#e4e4e7]">
                  <div>
                    <span className="text-xs text-zinc-500 block">Tên gian hàng</span>
                    <span className="font-medium text-zinc-900">{profile.shop.shopName}</span>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500 block">Đường dẫn</span>
                    <span className="font-mono text-xs text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded">
                      {profile.shop.shopSlug}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500 block">Địa chỉ lấy hàng</span>
                    <span className="text-zinc-800">{profile.shop.pickupAddress}</span>
                  </div>
                  {profile.shop.joinedAt && (
                    <div className="flex items-center gap-1.5 pt-1 text-xs text-zinc-600">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Tham gia từ ngày: </span>
                      <span className="font-medium text-zinc-800">
                        {formatDate(profile.shop.joinedAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-pistachio rounded-2xl p-6 border border-[#e4e4e7] shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-zinc-900" />
                  <h3 className="font-semibold text-zinc-900 text-base">Gian hàng của bạn</h3>
                </div>
                <p className="text-sm font-medium text-zinc-800">Chưa có gian hàng</p>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Chỉ cần tên gian hàng và địa chỉ lấy hàng, không cần xác minh, lưu xong là bắt đầu bán được ngay.
                </p>
                <div className="pt-2">
                  <Button
                    asChild
                    className="w-full rounded-full bg-black text-white hover:bg-zinc-800 active:scale-[0.99] transition-all h-10 font-medium text-sm shadow-sm"
                  >
                    <Link to={BaseUrl.ShopSetup} role="button">
                      Đăng bán
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Update Profile Form */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 sm:p-8 border border-[#e4e4e7] shadow-card space-y-6">
            <div className="pb-4 border-b border-[#e4e4e7]">
              <h2 className="text-xl font-semibold text-zinc-900">
                Thông tin cá nhân
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Số điện thoại và địa chỉ dùng để điền sẵn khi đặt hàng và thiết lập gian hàng.
              </p>
            </div>

            <ProfileForm
              initialValues={{
                fullName: profile.fullName || '',
                phone: profile.phone || null,
                address: profile.address || null,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
