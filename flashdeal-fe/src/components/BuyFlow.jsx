import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckoutDialog } from './CheckoutDialog';
import { useAuth } from '../store/auth';

/*
  Shared "buy at flash sale price" flow: guests go to sign in and come back to the same page;
  signed-in customers get the checkout dialog.
*/
export function useBuyFlow() {
  const status = useAuth((s) => s.status);
  const navigate = useNavigate();
  const location = useLocation();
  const [target, setTarget] = useState(null);

  const start = (campaign, line, product) => {
    if (status !== 'authenticated') {
      navigate('/dang-nhap', { state: { from: location.pathname + location.search, reason: 'buy' } });
      return;
    }
    setTarget({ campaign, line, product });
  };

  const dialog = (
    <CheckoutDialog
      open={Boolean(target)}
      onClose={() => setTarget(null)}
      campaign={target?.campaign}
      line={target?.line}
      product={target?.product}
    />
  );

  return { start, dialog };
}
