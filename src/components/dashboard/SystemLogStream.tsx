import React, { useEffect, useRef, useState } from 'react';

interface LogEntry {
  time: string;
  text: string;
  type: 'critical' | 'processing' | 'retry' | 'ok' | 'info';
}

interface SystemLogStreamProps {
  initialLogs: LogEntry[];
  streamingLogs: Omit<LogEntry, 'time'>[];
}

export function SystemLogStream({ initialLogs, streamingLogs }: SystemLogStreamProps) {
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const streamIndexRef = useRef(0);

  // Auto-scroll to bottom of logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Log streaming loop
  useEffect(() => {
    if (streamingLogs.length === 0) return;

    let timeoutId: any;

    const addStreamingLog = () => {
      const nextLog = streamingLogs[streamIndexRef.current];
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];

      setLogs((prev) => [
        ...prev,
        {
          time: timeStr,
          text: nextLog.text,
          type: nextLog.type,
        },
      ]);

      streamIndexRef.current = (streamIndexRef.current + 1) % streamingLogs.length;

      // Random timeout to look like realistic log feeds (1.5s - 4.5s)
      const nextInterval = Math.floor(Math.random() * 3000) + 1500;
      timeoutId = setTimeout(addStreamingLog, nextInterval);
    };

    timeoutId = setTimeout(addStreamingLog, 2000);

    return () => clearTimeout(timeoutId);
  }, [streamingLogs]);

  const getTypeColorClass = (type: LogEntry['type']) => {
    switch (type) {
      case 'critical':
        return 'text-rose-500 font-semibold';
      case 'processing':
        return 'text-[#d0bcff]';
      case 'retry':
        return 'text-neutral-500';
      case 'ok':
        return 'text-emerald-400 font-semibold';
      default:
        return 'text-white';
    }
  };

  return (
    <section className="col-span-12 md:col-span-8 row-span-2 terminal-border bg-[#0c0c0e] flex flex-col p-6 overflow-hidden">
      <div className="flex justify-between items-center mb-4 shrink-0 font-sans select-none">
        <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 font-label-caps">
          SYSTEM_LOG_STREAM
        </span>
        <span className="text-[10px] font-mono text-neutral-500">
          v4.0.22_STABLE
        </span>
      </div>
      
      {/* Logs container */}
      <div
        ref={logContainerRef}
        className="flex-1 font-mono text-xs text-white overflow-y-auto custom-scrollbar space-y-1"
        style={{ maxHeight: '120px' }}
      >
        {logs.map((log, index) => (
          <div key={index} className="flex gap-4">
            <span className="text-neutral-500 shrink-0 select-none font-mono">{log.time}</span>
            <span className={`${getTypeColorClass(log.type)} font-mono`}>{log.text}</span>
          </div>
        ))}
      </div>

      {/* Terminal prompt cursor */}
      <div className="mt-2 text-white font-mono text-xs border-t border-[#222226] pt-2 flex items-center select-none">
        <span className="text-[#d0bcff] mr-1">&gt;</span> root@reflex:~$ 
        <span className="terminal-cursor"></span>
      </div>
    </section>
  );
}
