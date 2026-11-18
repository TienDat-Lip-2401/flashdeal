import { useState } from 'react';
import { ImageOff } from 'lucide-react';

export function ProductImage({ src, alt, className = '', loading = 'lazy', ...rest }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-surface text-muted ${className}`} role="img" aria-label={alt}>
        <ImageOff className="h-8 w-8" aria-hidden="true" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
      {...rest}
    />
  );
}
