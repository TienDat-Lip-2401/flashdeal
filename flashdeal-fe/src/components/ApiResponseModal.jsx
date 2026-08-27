import React from 'react';
import { X, Copy, Check, Terminal } from 'lucide-react';

export default function ApiResponseModal({ isOpen, onClose, responseData }) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(responseData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isSuccess = responseData?.code === 200 || responseData?.code === 1000;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-slate-200 text-sm sm:text-base font-mono">
              Raw API Response Payload
            </h3>
            {responseData && (
              <span
                className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                  isSuccess
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                Code: {responseData.code || 500}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Đã sao chép' : 'Sao chép JSON'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* JSON Body */}
        <div className="p-5 overflow-y-auto flex-1 bg-slate-950/60 font-mono text-xs text-emerald-400 leading-relaxed">
          {responseData ? (
            <pre className="whitespace-pre-wrap break-all">
              {JSON.stringify(responseData, null, 2)}
            </pre>
          ) : (
            <div className="text-slate-500 italic text-center py-10">
              Chưa có response nào được ghi nhận. Hãy gửi 1 request bất kỳ để kiểm tra.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
