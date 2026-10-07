import React from 'react';
import { Link } from 'react-router-dom';
import { userService } from '@/services/user.service';
import ProfileForm from '@/pages/profile/ProfilePage/components/ProfileForm';
import BaseUrl from '@/consts/baseUrl';
import { Store, Calendar, MapPin, Phone, Mail, ExternalLink, Settings, ShieldCheck } from 'lucide-react';

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

const SellerProfilePage: React.FC = () => {
  const { data: profile, isPending, isError } = userService.useGetProfile();

  if (isPending) {
    return (
      <div className="flex min-h-[400px] w-full items-center justify-center p-8">
        <div className="flex items-center gap-3 text-zinc-600">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
          <span className="text-sm font-medium">Đang tải hồ sơ người bán...</span>
        </div>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="flex min-h-[400px] w-full items-center justify-center p-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700 max-w-md">
          <p className="font-semibold text-sm">Không thể tải thông tin hồ sơ người bán.</p>
          <p className="text-xs mt-1 text-red-600">Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="seller-profile-page"
      className="w-full space-y-6"
      style={{ fontFeatureSettings: '"ss03"' }}
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#e4e4e7]">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-black">
            Hồ Sơ Kênh Người Bán
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Quản lý thông tin chủ gian hàng và thông tin pháp lý phục vụ vận chuyển & lấy hàng.
          </p>
        </div>

        {profile.shop && (
          <Link
            to={BaseUrl.ShopSetup}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#e4e4e7] bg-white text-xs font-semibold text-zinc-800 hover:text-black hover:bg-zinc-50 transition-colors shadow-xs"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Cài đặt gian hàng</span>
          </Link>
        )}
      </div>

      {/* Grid Layout: 2 Columns Full Width */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Shop & Owner Overview */}
        <div className="space-y-6 lg:col-span-1">
          {/* Shop Card */}
          <div className="bg-white rounded-2xl p-6 border border-[#e4e4e7] shadow-[0_4px_12px_rgba(0,0,0,0.02)] space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-[#e4e4e7]">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-black" />
                <h2 className="font-semibold text-sm text-black">Thông tin Gian Hàng</h2>
              </div>
              <span className="inline-flex items-center gap-1 font-semibold text-[11px] text-black bg-[#c1fbd4] px-2.5 py-0.5 rounded-full">
                <ShieldCheck className="w-3 h-3" />
                Đang hoạt động
              </span>
            </div>

            {profile.shop ? (
              <div className="space-y-4">
                <div>
                  <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider block">
                    Tên gian hàng
                  </span>
                  <span className="text-base font-semibold text-black">
                    {profile.shop.shopName}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider block">
                    Đường dẫn hiển thị (Slug)
                  </span>
                  <span className="font-mono text-xs text-zinc-700 bg-zinc-100 px-2 py-1 rounded inline-block mt-0.5">
                    {profile.shop.shopSlug}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider block">
                    Địa chỉ lấy hàng
                  </span>
                  <p className="text-xs text-zinc-700 mt-0.5 leading-relaxed">
                    {profile.shop.pickupAddress}
                  </p>
                </div>

                {profile.shop.joinedAt && (
                  <div className="flex items-center gap-1.5 pt-2 border-t border-[#e4e4e7] text-xs text-zinc-500">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Mở bán từ: </span>
                    <span className="font-medium text-black">
                      {formatDate(profile.shop.joinedAt)}
                    </span>
                  </div>
                )}

                <div className="pt-2">
                  <Link
                    to={`/shops/${profile.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700 hover:text-black hover:underline"
                  >
                    <span>Xem gian hàng công khai</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-zinc-500">
                  Bạn chưa thiết lập thông tin gian hàng.
                </p>
                <Link
                  to={BaseUrl.ShopSetup}
                  className="inline-flex items-center justify-center w-full h-10 rounded-full bg-black text-white text-xs font-semibold hover:bg-zinc-800 transition-colors"
                >
                  Thiết lập gian hàng ngay
                </Link>
              </div>
            )}
          </div>

          {/* Quick Owner Summary Card */}
          <div className="bg-white rounded-2xl p-6 border border-[#e4e4e7] shadow-[0_4px_12px_rgba(0,0,0,0.02)] space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Chủ sở hữu gian hàng
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2.5 text-zinc-600">
                <Mail className="w-4 h-4 text-zinc-400 shrink-0" />
                <span className="text-zinc-800 font-medium truncate">{profile.email}</span>
              </div>
              <div className="flex items-center gap-2.5 text-zinc-600">
                <Phone className="w-4 h-4 text-zinc-400 shrink-0" />
                <span className="text-zinc-800 font-medium">
                  {profile.shop?.phone || 'Chưa cập nhật số điện thoại'}
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-zinc-600">
                <MapPin className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                <span className="text-zinc-800 font-medium">
                  {profile.shop?.pickupAddress || 'Chưa cập nhật địa chỉ gian hàng'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Update Profile Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 sm:p-8 border border-[#e4e4e7] shadow-[0_4px_12px_rgba(0,0,0,0.02)] space-y-6">
          <div className="pb-4 border-b border-[#e4e4e7]">
            <h2 className="text-lg font-semibold text-black">
              Cập Nhật Thông Tin Cá Nhân Người Bán
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              Thông tin số điện thoại và địa chỉ dùng để liên hệ đối soát và xử lý đơn bán hàng.
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
  );
};

export default SellerProfilePage;
