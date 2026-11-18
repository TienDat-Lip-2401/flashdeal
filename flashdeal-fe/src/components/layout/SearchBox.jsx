import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, TrendingUp } from 'lucide-react';
import { shopApi } from '../../lib/queries';

function useDebounced(value, ms) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

/* Search field with suggestions while typing and popular searches when empty (combobox pattern). */
export function SearchBox({ className = '', autoFocus = false, onDone }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [text, setText] = useState(params.get('q') ?? '');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();
  const boxRef = useRef(null);
  const q = useDebounced(text.trim(), 200);

  const suggestions = useQuery({
    queryKey: ['suggest', q],
    queryFn: () => shopApi.suggestions(q),
    enabled: open && q.length >= 2,
    staleTime: 60e3,
  });
  const trending = useQuery({ queryKey: ['trending'], queryFn: shopApi.trending, enabled: open, staleTime: 5 * 60e3 });

  const items =
    q.length >= 2
      ? (suggestions.data ?? []).map((s) => ({ label: s, kind: 'suggest' }))
      : (trending.data ?? []).map((t) => ({ label: t.keyword ?? t.value ?? String(t), kind: 'trend' }));

  useEffect(() => {
    const close = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);

  const go = (value) => {
    const v = value.trim();
    if (!v) return;
    setText(v);
    setOpen(false);
    navigate(`/tim-kiem?q=${encodeURIComponent(v)}`);
    onDone?.();
  };

  const onKeyDown = (e) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) setOpen(true);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(items.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(-1, a - 1));
    } else if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'Enter' && active >= 0 && items[active]) {
      e.preventDefault();
      go(items[active].label);
    }
  };

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          go(text);
        }}
      >
        <label htmlFor={`${listId}-input`} className="sr-only">
          Tìm sản phẩm
        </label>
        <div className="flex h-11 items-center rounded-full bg-surface pl-4 pr-1.5 ring-link/30 focus-within:bg-white focus-within:ring-2">
          <Search className="h-[18px] w-[18px] shrink-0 text-muted" aria-hidden="true" />
          <input
            id={`${listId}-input`}
            type="search"
            value={text}
            autoFocus={autoFocus}
            autoComplete="off"
            onChange={(e) => {
              setText(e.target.value);
              setOpen(true);
              setActive(-1);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="Tìm MacBook, iPhone, AirPods..."
            className="h-full min-w-0 flex-1 bg-transparent px-3 text-[15px] text-ink placeholder:text-muted focus:outline-none [&::-webkit-search-cancel-button]:hidden"
            role="combobox"
            aria-expanded={open && items.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          />
          <button type="submit" className="btn btn-dark btn-sm min-h-8 px-3.5">
            Tìm
          </button>
        </div>
      </form>

      {open && items.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-2xl border border-line bg-white py-2 shadow-xl"
        >
          {q.length < 2 && <li className="px-4 pb-1 pt-1 text-xs font-medium text-muted">Tìm kiếm nhiều</li>}
          {items.map((item, i) => (
            <li
              key={`${item.label}-${i}`}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onPointerDown={(e) => {
                e.preventDefault();
                go(item.label);
              }}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 text-[15px] ${i === active ? 'bg-surface' : ''}`}
            >
              {item.kind === 'trend' ? (
                <TrendingUp className="h-4 w-4 text-muted" aria-hidden="true" />
              ) : (
                <Search className="h-4 w-4 text-muted" aria-hidden="true" />
              )}
              <span className="line-clamp-1">{item.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
