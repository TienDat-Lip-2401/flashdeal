import { useEffect, useState } from 'react';
import { pad2, parseDate, splitDuration } from '../../lib/format';

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/* Renders "2 ngày 04:12:09" style time left until `to`; calls onDone once when it reaches zero. */
export function Countdown({ to, className = '', boxed = false, onDone }) {
  const now = useNow();
  const target = parseDate(to)?.getTime() ?? 0;
  const left = splitDuration(target - now);

  useEffect(() => {
    if (left.total === 0 && onDone) onDone();
  }, [left.total === 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const parts = [pad2(left.hours), pad2(left.minutes), pad2(left.seconds)];
  const label = `${left.days ? `${left.days} ngày ` : ''}${parts.join(':')}`;

  if (!boxed) {
    return (
      <time className={`tabular-nums ${className}`} dateTime={String(to)} aria-label={`Còn ${label}`}>
        {label}
      </time>
    );
  }
  return (
    <time className={`inline-flex items-center gap-1 tabular-nums ${className}`} dateTime={String(to)} aria-label={`Còn ${label}`}>
      {left.days > 0 && <span className="mr-1 font-semibold">{left.days} ngày</span>}
      {parts.map((p, i) => (
        <span key={i} className="flex items-center gap-1">
          <span className="min-w-[2ch] rounded-md bg-ink px-1.5 py-0.5 text-center font-semibold text-white">{p}</span>
          {i < 2 && <span className="font-semibold">:</span>}
        </span>
      ))}
    </time>
  );
}
