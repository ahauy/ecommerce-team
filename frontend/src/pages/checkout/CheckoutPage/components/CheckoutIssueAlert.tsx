import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import BaseUrl from '@/consts/baseUrl';
import { describeIssue, type CheckoutIssue } from '@/helpers/checkout';

interface CheckoutIssueAlertProps {
  issues: CheckoutIssue[];
}

/** Khung cảnh báo đỏ đầu trang khi có SP không đủ hàng (Thanh toán #2). */
const CheckoutIssueAlert: React.FC<CheckoutIssueAlertProps> = ({ issues }) => (
  <div
    role="alert"
    data-testid="checkout-issue-alert"
    className="flex flex-col gap-4 rounded-2xl border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
  >
    <div className="flex min-w-0 items-start gap-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 space-y-2">
        <h2 className="text-base font-semibold text-red-700">Một số sản phẩm không đủ hàng</h2>
        <p className="text-xs leading-relaxed text-zinc-700">
          Rất tiếc, số lượng sản phẩm trong kho vừa thay đổi. Vui lòng cập nhật số lượng trong giỏ hàng để tiếp tục
          thanh toán:
        </p>
        <ul className="list-disc space-y-1 pl-4 text-xs text-zinc-800 marker:text-red-500">
          {issues.map((issue) => (
            <li key={issue.productId} data-testid="checkout-issue-line">
              <strong>
                {issue.name} ({issue.shopName}):
              </strong>{' '}
              {describeIssue(issue)}
            </li>
          ))}
        </ul>
      </div>
    </div>
    <Link
      to={BaseUrl.Cart}
      className="inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-red-400 bg-white px-5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
    >
      Xem lại giỏ hàng
    </Link>
  </div>
);

export default CheckoutIssueAlert;
