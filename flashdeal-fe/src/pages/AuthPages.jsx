import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Seo } from '../lib/seo';
import { errorMessage } from '../lib/errors';
import { useAuth } from '../store/auth';
import { toast } from '../store/toast';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Field({ id, label, error, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-sm text-muted">{hint}</p>}
      {error && (
        <p id={`${id}-err`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

function PasswordInput({ id, value, onChange, error, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        className="field-input pr-12"
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${id}-err` : undefined}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute inset-y-0 right-1 my-auto flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-ink"
        aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="wrap flex justify-center py-10 sm:py-16">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold">{title}</h1>
        {subtitle && <p className="mt-2 text-[16px] text-ink-2">{subtitle}</p>}
        <div className="mt-8">{children}</div>
        {footer && <p className="mt-6 text-center text-[15px] text-ink-2">{footer}</p>}
      </div>
    </div>
  );
}

export function LoginPage() {
  const { login, status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  if (status === 'authenticated') return <Navigate to={from} replace />;

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!EMAIL_RE.test(form.email.trim())) errs.email = 'Nhập email bạn dùng để đăng ký, ví dụ ten@gmail.com.';
    if (!form.password) errs.password = 'Nhập mật khẩu.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    setServerError('');
    try {
      const user = await login(form.email.trim(), form.password);
      toast.success(`Chào ${user?.fullName || 'bạn'}, bạn đã đăng nhập.`);
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Đăng nhập"
      subtitle={location.state?.reason === 'buy' ? 'Đăng nhập để đặt suất flash sale. Sau khi đăng nhập bạn quay lại đúng sản phẩm vừa xem.' : 'Đăng nhập để đặt suất flash sale và theo dõi đơn hàng.'}
      footer={
        <>
          Chưa có tài khoản?{' '}
          <Link to="/dang-ky" state={location.state} className="link font-medium">
            Tạo tài khoản
          </Link>
        </>
      }
    >
      <Seo title="Đăng nhập" path="/dang-nhap" noindex />
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field id="email" label="Email" error={errors.email}>
          <input
            id="email"
            type="email"
            className="field-input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            autoComplete="email"
            aria-invalid={errors.email ? 'true' : undefined}
            aria-describedby={errors.email ? 'email-err' : undefined}
          />
        </Field>
        <Field id="password" label="Mật khẩu" error={errors.password}>
          <PasswordInput id="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={errors.password} autoComplete="current-password" />
        </Field>
        {serverError && (
          <p role="alert" className="rounded-xl bg-sale-soft px-4 py-3 text-[15px] text-sale">
            {serverError}
          </p>
        )}
        <button type="submit" className="btn btn-dark w-full" disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />} Đăng nhập
        </button>
      </form>
    </AuthShell>
  );
}

export function RegisterPage() {
  const { register, status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', address: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  if (status === 'authenticated') return <Navigate to={from} replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const input = (k, props = {}) => (
    <input
      id={k}
      className="field-input"
      value={form[k]}
      onChange={set(k)}
      aria-invalid={errors[k] ? 'true' : undefined}
      aria-describedby={errors[k] ? `${k}-err` : undefined}
      {...props}
    />
  );

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'Nhập họ tên của bạn.';
    if (!EMAIL_RE.test(form.email.trim())) errs.email = 'Nhập email đúng định dạng, ví dụ ten@gmail.com.';
    if (form.phone && !/^(0|\+84)(3|5|7|8|9)\d{8}$/.test(form.phone.replace(/\s/g, ''))) errs.phone = 'Nhập số điện thoại 10 số.';
    if (form.password.length < 6) errs.password = 'Mật khẩu cần ít nhất 6 ký tự.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    setServerError('');
    try {
      await register({ ...form, email: form.email.trim(), phone: form.phone.replace(/\s/g, '') || undefined });
      toast.success('Tài khoản đã được tạo và bạn đã đăng nhập.');
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Tạo tài khoản"
      subtitle="Số điện thoại và địa chỉ được điền sẵn khi bạn đặt suất flash sale."
      footer={
        <>
          Đã có tài khoản?{' '}
          <Link to="/dang-nhap" state={location.state} className="link font-medium">
            Đăng nhập
          </Link>
        </>
      }
    >
      <Seo title="Tạo tài khoản" path="/dang-ky" noindex />
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field id="fullName" label="Họ tên" error={errors.fullName}>
          {input('fullName', { autoComplete: 'name' })}
        </Field>
        <Field id="email" label="Email" error={errors.email}>
          {input('email', { type: 'email', autoComplete: 'email' })}
        </Field>
        <Field id="phone" label="Số điện thoại (không bắt buộc)" error={errors.phone}>
          {input('phone', { type: 'tel', inputMode: 'tel', autoComplete: 'tel' })}
        </Field>
        <Field id="address" label="Địa chỉ nhận hàng (không bắt buộc)" error={errors.address}>
          {input('address', { autoComplete: 'street-address' })}
        </Field>
        <Field id="password" label="Mật khẩu" error={errors.password} hint="Ít nhất 6 ký tự.">
          <PasswordInput id="password" value={form.password} onChange={set('password')} error={errors.password} autoComplete="new-password" />
        </Field>
        {serverError && (
          <p role="alert" className="rounded-xl bg-sale-soft px-4 py-3 text-[15px] text-sale">
            {serverError}
          </p>
        )}
        <button type="submit" className="btn btn-dark w-full" disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />} Tạo tài khoản
        </button>
      </form>
    </AuthShell>
  );
}
