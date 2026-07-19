import React from 'react';
import { Terminal, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HeaderProps {
  uptime: string;
  billing: string;
}

export function Header({ uptime, billing }: HeaderProps) {
  return (
    <header className="flex justify-between items-center w-full px-6 h-16 border-b border-[#222226] bg-[#0c0c0e] z-50 font-sans select-none">
      <div className="flex items-center gap-6">
        <Link 
          to="/" 
          className="font-display-tech text-md text-white font-semibold uppercase tracking-tighter hover:text-[#8b5cf6] transition-colors"
        >
          DEVOPS_CORE_v1.0
        </Link>
        <nav className="hidden md:flex gap-6">
          <a className="font-display-tech text-xs text-white border-b-2 border-white py-4 font-semibold tracking-wide cursor-pointer">
            DASHBOARD
          </a>
          <a className="font-display-tech text-xs text-neutral-400 hover:text-white transition-colors py-4 font-semibold tracking-wide cursor-pointer">
            REPOSITORIES
          </a>
          <a className="font-display-tech text-xs text-neutral-400 hover:text-white transition-colors py-4 font-semibold tracking-wide cursor-pointer">
            PIPELINES
          </a>
        </nav>
      </div>

      <div className="flex items-center gap-6 font-display-tech text-xs">
        {/* Pulsing Uptime indicator */}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full pulse-purple shrink-0"></span>
          <span className="text-white font-mono">UPTIME: {uptime}</span>
        </div>
        <span className="text-neutral-400 font-mono hidden sm:inline">BILLING: {billing}</span>
        
        {/* Action icons */}
        <div className="flex items-center gap-2 border-l border-[#222226] pl-4">
          <button className="text-white hover:bg-neutral-800 p-2 transition-colors rounded-sm cursor-pointer">
            <Terminal className="w-4 h-4" />
          </button>
          <button className="text-white hover:bg-neutral-800 p-2 transition-colors rounded-sm cursor-pointer">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
