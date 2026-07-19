import React from 'react';
import { Terminal, Shield, Cpu, PlaySquare, Settings, FileText, HelpCircle } from 'lucide-react';

interface SidebarProps {
  nodeName: string;
  nodeStatus: string;
}

export function Sidebar({ nodeName, nodeStatus }: SidebarProps) {
  return (
    <aside className="hidden md:flex flex-col h-full border-r border-[#222226] bg-[#0c0c0e] w-64 shrink-0 font-sans select-none">
      {/* Node Info Header */}
      <div className="p-6 border-b border-[#222226]">
        <h2 className="text-lg font-semibold text-white font-headline-sm">{nodeName}</h2>
        <p className="text-[10px] uppercase font-bold tracking-wider text-[#d0bcff] mt-1 font-label-caps flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-[#d0bcff]"></span>
          STATUS: {nodeStatus}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        <div className="px-6 py-2">
          <span className="text-[10px] font-bold tracking-wider text-neutral-500 font-label-caps">
            CORE OPERATIONS
          </span>
        </div>
        <ul className="space-y-0.5">
          <li>
            <a
              className="flex items-center gap-3 px-6 py-3 text-[#d0bcff] border-l-2 border-[#8b5cf6] bg-[#1a1824]/30 font-label-caps text-xs font-bold transition-all"
              href="#"
            >
              <Cpu className="w-4 h-4" />
              DASHBOARD
            </a>
          </li>
          <li>
            <a
              className="flex items-center gap-3 px-6 py-3 text-neutral-400 hover:text-white hover:bg-neutral-900/50 font-label-caps text-xs font-semibold transition-all"
              href="#"
            >
              <FileText className="w-4 h-4" />
              REPOSITORIES
            </a>
          </li>
          <li>
            <a
              className="flex items-center gap-3 px-6 py-3 text-neutral-400 hover:text-white hover:bg-neutral-900/50 font-label-caps text-xs font-semibold transition-all"
              href="#"
            >
              <PlaySquare className="w-4 h-4" />
              PIPELINES
            </a>
          </li>
          <li>
            <a
              className="flex items-center gap-3 px-6 py-3 text-neutral-400 hover:text-white hover:bg-neutral-900/50 font-label-caps text-xs font-semibold transition-all"
              href="#"
            >
              <Cpu className="w-4 h-4" />
              INFRASTRUCTURE
            </a>
          </li>
          <li>
            <a
              className="flex items-center gap-3 px-6 py-3 text-neutral-400 hover:text-white hover:bg-neutral-900/50 font-label-caps text-xs font-semibold transition-all"
              href="#"
            >
              <Shield className="w-4 h-4" />
              SECURITY
            </a>
          </li>
        </ul>
      </nav>

      {/* Sidebar Footer Buttons */}
      <div className="p-6 mt-auto space-y-4">
        <button
          className="w-full py-2.5 border border-white text-white font-label-caps text-xs font-bold hover:bg-white hover:text-black transition-colors rounded-sm cursor-pointer"
        >
          DEPLOY NEW
        </button>
        <div className="flex justify-between text-neutral-400 font-label-caps text-[11px] font-bold">
          <a className="flex items-center gap-1.5 hover:text-white transition-colors" href="#">
            <FileText className="w-3.5 h-3.5" />
            Docs
          </a>
          <a className="flex items-center gap-1.5 hover:text-white transition-colors" href="#">
            <HelpCircle className="w-3.5 h-3.5" />
            Support
          </a>
        </div>
      </div>
    </aside>
  );
}
