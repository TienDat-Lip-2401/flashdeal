import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Modal } from './ui/Modal';
import { ProductImage } from './ui/ProductImage';
import api from '../lib/api';
import { errorMessage } from '../lib/errors';
import { discountPercent, formatPrice } from '../lib/format';
import { useAuth } from '../store/auth';
import { toast } from '../store/toast';

const PHONE_RE = /^(0|\+84)(3|5|7|8|9)\d{8}$/;

const newKey = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `fd-${Date.now()}-${Math.random().toString(36).slice(2)}`;

/*
  Reserves one flash sale unit. One Idempotency-Key is made per opened dialog, so a double click
  or a retry after a timeout reaches the server as the same request and never creates two orders.
*/
export function CheckoutDialog({ open, onClose, campaign, line, product }) {
  const user = useAuth((s) => s.user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const keyRef = useRef(newKey());
  const [form, setForm] = useState({ fullName: '', phone: '', address: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (open) {
      keyRef.current = newKey();
      setForm({ fullName: user?.fullName ?? '', phone: user?.phone ?? '', address: user?.address ?? '' });
      setErrors({});
      setServerError('');
    }
  }, [open, user]);

  if (!line) return null;
  const pct = discountPercent(line.originalPrice, line.flashSalePrice);

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Nhập họ tên người nhận hàng.';
    if (!PHONE_RE.test(form.phone.replace(/\s/g, ''))) e.phone = 'Nhập số điện thoại 10 số, ví dụ 09xx xxx xxx.';
    if (form.address.trim().length < 10) e.address = 'Nhập địa chỉ nhận hàng gồm số nhà, đường, phường, quận.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (submitting || !validate()) return;
    setSubmitting(true);
    setServerError('');
    try {
      const res = await api.post(
        '/flash-sales/orders',
        {
          campaignId: campaign.id,
          productId: line.productId,
          shippingAddress: `${form.fullName.trim()} – ${form.address.trim()}`,
          phone: form.phone.replace(/\s/g, ''),
          email: user?.email,
        },
        { headers: { 'Idempotency-Key': keyRef.current } },
      );
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Đã giữ suất cho bạn. Thanh toán trong 15 phút để hoàn tất đơn.');
      onClose();
      navigate(`/tai-khoan/don-hang/${res.data.orderCode}`);
    } catch (err) {
      setServerError(errorMessage(err));
      if (err.code === 3004) queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    } finally {
      setSubmitting(false);
    }
  };

  const field = (name, label, props = {}) => (
    <div>
      <label htmlFor={`co-${name}`} className="field-label">
        {label}
      </label>
      <input
        id={`co-${name}`}
        className="field-input"
        value={form[name]}
        onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
        aria-invalid={errors[name] ? 'true' : undefined}
        aria-describedby={errors[name] ? `co-${name}-err` : undefined}
        {...props}
      />
      {errors[name] && (
        <p id={`co-${name}-err`} className="field-error">
          {errors[name]}
        </p>
      )}
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title="Đặt suất flash sale">
      <div className="mb-5 flex gap-4 rounded-xl bg-surface p-3">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-white p-1.5">
          <ProductImage src={product?.imageUrl} alt={product?.name ?? line.productName} className="h-full w-full object-contain" />
        </div>
        <div className="min-w-0">
          <p className="line-clamp-2 font-semibold">{product?.name ?? line.productName}</p>
          <p className="mt-1">
            <span className="text-lg font-bold text-sale">{formatPrice(line.flashSalePrice)}</span>{' '}
            <span className="text-sm text-muted line-through">{formatPrice(line.originalPrice)}</span>
            {pct > 0 && <span className="badge ml-2 bg-sale-soft text-sale">-{pct}%</span>}
          </p>
          <p className="text-xs text-muted">Mỗi tài khoản mua được 1 suất · {campaign.title}</p>
        </div>
      </div>

      <form onSubmit={submit} noValidate className="space-y-4">
        {field('fullName', 'Họ tên người nhận', { autoComplete: 'name' })}
        {field('phone', 'Số điện thoại', { autoComplete: 'tel', inputMode: 'tel' })}
        {field('address', 'Địa chỉ nhận hàng', { autoComplete: 'street-address' })}

        {serverError && (
          <p role="alert" className="rounded-xl bg-sale-soft px-4 py-3 text-[15px] text-sale">
            {serverError}
          </p>
        )}

        <div className="rounded-xl border border-line px-4 py-3 text-sm text-muted">
          Sau khi đặt, hàng được giữ 15 phút. Bạn thanh toán qua VNPay ở bước tiếp theo; quá 15 phút đơn tự hủy và suất được trả lại.
        </div>

        <button type="submit" className="btn btn-sale w-full" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {submitting ? 'Đang giữ suất…' : `Đặt suất giá ${formatPrice(line.flashSalePrice)}`}
        </button>
      </form>
    </Modal>
  );
}
