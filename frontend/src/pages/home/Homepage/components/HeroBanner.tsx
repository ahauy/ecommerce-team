import React from 'react';

/** Banner giới thiệu đầu trang chủ (nền pistachio theo giao diện mẫu). */
const HeroBanner: React.FC = () => (
  <section
    aria-label="Giới thiệu"
    className="rounded-2xl border border-[#e4e4e7] bg-pistachio px-6 py-8 sm:px-10 sm:py-10"
  >
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e4e4e7] bg-white/80 px-3 py-1 text-[11px] font-medium text-zinc-700">
      <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" aria-hidden="true" />
      Tuyển chọn độc quyền
    </span>
    <h1 className="mt-4 max-w-2xl text-3xl font-light leading-tight tracking-tight text-black sm:text-5xl">
      Mua sắm từ hàng nghìn gian hàng
    </h1>
    <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-600">
      Khám phá các thương hiệu tuyển chọn, phong cách độc bản và sản phẩm chất lượng cao trên toàn quốc.
    </p>
  </section>
);

export default HeroBanner;
