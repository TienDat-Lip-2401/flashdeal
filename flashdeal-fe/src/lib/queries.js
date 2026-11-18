import { useMemo } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import api from './api';
import { parseDate } from './format';

/* ---------- raw calls ---------- */
export const shopApi = {
  categories: () => api.get('/categories').then((r) => r.data ?? []),
  products: (params) =>
    api.get('/products', { params }).then((r) => ({ items: r.data ?? [], meta: r.meta ?? { total: 0, page_of_number: 0 } })),
  productBySlug: (slug) => api.get(`/products/slug/${slug}`).then((r) => r.data),
  productSummary: (id) => api.get(`/products/${id}/detail-summary`).then((r) => r.data),
  suggestions: (q) => api.get('/products/search/suggestions', { params: { q, limit: 8 } }).then((r) => r.data ?? []),
  trending: () => api.get('/products/search/trending', { params: { limit: 8 } }).then((r) => r.data ?? []),
  campaigns: () => api.get('/flash-sales/campaigns').then((r) => r.data ?? []),
  myOrders: () => api.get('/flash-sales/orders/my-orders').then((r) => r.data ?? []),
  order: (code) => api.get(`/flash-sales/orders/${code}`).then((r) => r.data),
  payment: (code) => api.get(`/payments/order/${code}`),
};

/* ---------- hooks ---------- */
export const useCategories = () =>
  useQuery({ queryKey: ['categories'], queryFn: shopApi.categories, staleTime: 10 * 60e3 });

export const useProducts = (params, options = {}) =>
  useQuery({
    queryKey: ['products', params],
    queryFn: () => shopApi.products(params),
    placeholderData: keepPreviousData,
    ...options,
  });

/* Every product, used to join flash sale lines (which only carry productId) with photo and slug. */
export const useProductIndex = () => {
  const query = useQuery({
    queryKey: ['products', 'index'],
    queryFn: () => shopApi.products({ size: 500, page: 0 }),
    staleTime: 5 * 60e3,
  });
  const byId = useMemo(() => new Map((query.data?.items ?? []).map((p) => [p.id, p])), [query.data]);
  return { ...query, byId };
};

export const useCampaigns = () =>
  useQuery({ queryKey: ['campaigns'], queryFn: shopApi.campaigns, staleTime: 30e3, refetchInterval: 60e3 });

/* Campaigns enriched with live state computed from the clock rather than the stored status. */
export const campaignState = (c, now = Date.now()) => {
  const start = parseDate(c.startTime)?.getTime() ?? 0;
  const end = parseDate(c.endTime)?.getTime() ?? 0;
  if (now < start) return 'upcoming';
  if (now >= end) return 'ended';
  return 'live';
};

export const useFlashSale = () => {
  const campaigns = useCampaigns();
  const index = useProductIndex();
  const data = useMemo(() => {
    const list = (campaigns.data ?? []).map((c) => ({
      ...c,
      state: campaignState(c),
      products: (c.products ?? []).map((line) => ({ ...line, product: index.byId.get(line.productId) })),
    }));
    const live = list.filter((c) => c.state === 'live').sort((a, b) => parseDate(a.endTime) - parseDate(b.endTime));
    const upcoming = list
      .filter((c) => c.state === 'upcoming')
      .sort((a, b) => parseDate(a.startTime) - parseDate(b.startTime));
    /* productId -> the best offer currently live or next upcoming */
    const offers = new Map();
    for (const c of [...upcoming, ...live]) {
      for (const line of c.products) offers.set(line.productId, { campaign: c, line });
    }
    return { list, live, upcoming, offers };
  }, [campaigns.data, index.byId]);
  return { ...data, isLoading: campaigns.isLoading || index.isLoading, isError: campaigns.isError };
};

export const useMyOrders = (enabled = true) =>
  useQuery({ queryKey: ['orders', 'mine'], queryFn: shopApi.myOrders, enabled });

export const useOrder = (code) =>
  useQuery({
    queryKey: ['orders', code],
    queryFn: () => shopApi.order(code),
    enabled: Boolean(code),
    // the order is written asynchronously after it is accepted, so the first reads may 404
    retry: (count, err) => err?.code === 3006 && count < 6,
    retryDelay: 1200,
  });
