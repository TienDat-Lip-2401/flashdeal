import React from 'react';
import { ShieldCheck, Server, Globe, PhoneCall, ExternalLink, Activity } from 'lucide-react';

export default function TopHeader() {
  return (
    <div className="bg-[#0B192C] text-slate-300 text-xs border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-between">
        {/* Left Utility Links */}
        <div className="hidden md:flex items-center gap-6">
          <span className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            Nền Tảng Thương Mại Điện Tử Chịu Tải Cao (50.000 req/s)
          </span>
          <span className="text-slate-700">|</span>
          <a
            href="http://localhost:8085"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 hover:text-white transition"
            title="Mở Dashboard Giám sát Kafka Cluster"
          >
            <Server className="w-3 h-3 text-emerald-400" />
            Kafka UI (:8085)
            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
          </a>
          <span className="text-slate-700">|</span>
          <a
            href="http://localhost:8080/product-docs/swagger-ui.html"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition"
          >
            API Gateway Docs (:8080)
          </a>
        </div>

        {/* Right Status & Tools */}
        <div className="flex items-center gap-4 ml-auto">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-emerald-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Redis & Kafka Active
          </div>

          <div className="hidden sm:flex items-center gap-1 text-slate-400">
            <PhoneCall className="w-3 h-3 text-blue-400" />
            Hotline: <span className="font-semibold text-slate-200">1900 6868</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-semibold border-l border-slate-800 pl-3">
            <span className="px-1.5 py-0.5 bg-blue-600 text-white rounded text-[10px]">VI</span>
            <span className="px-1.5 py-0.5 text-slate-400 hover:text-white cursor-pointer text-[10px]">EN</span>
          </div>
        </div>
      </div>
    </div>
  );
}
