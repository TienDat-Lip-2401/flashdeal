import React from 'react';
import { X, Code2, Copy, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

export default function ApiResponseModal({ isOpen, onClose, lastResponse, showToast }) {
  if (!isOpen) return null;

  const handleCopy = () => {
    if (!lastResponse) return;
    navigator.clipboard.writeText(JSON.stringify(lastResponse, null, 2));
    showToast('Đã copy toàn bộ mã JSON Response vào Clipboard!', 'success');
  };

  const isSuccess = lastResponse && (lastResponse.code === 1000 || !lastResponse.code);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-fade-in">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header Bar */}
        <div className="bg-[#0B192C] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              API Gateway Response Inspector (:8080)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              title="Copy JSON"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Trạng thái:</span>
            <span className={`font-bold px-2 py-0.5 rounded font-mono ${
              isSuccess ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-red-100 text-red-800 border border-red-300'
            }`}>
              {lastResponse ? `Code [${lastResponse.code || 200}]` : 'Chưa có Request'}
            </span>
          </div>

          <div className="text-slate-500 text-[11px] font-mono">
            {new Date().toLocaleTimeString('vi-VN')}
          </div>
        </div>

        {/* JSON Code Viewer */}
        <div className="p-4 flex-1 overflow-y-auto bg-slate-950 font-mono text-xs text-slate-200 leading-relaxed">
          {lastResponse ? (
            <pre className="whitespace-pre-wrap break-all">
              {JSON.stringify(lastResponse, null, 2)}
            </pre>
          ) : (
            <div className="text-center py-12 text-slate-600">
              Chưa có phản hồi nào được ghi nhận. Hãy thực hiện một thao tác trên Web để xem dữ liệu.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Chuẩn hóa JSON ApiResponse Envelope</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
