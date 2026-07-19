import React from 'react';
import { Sidebar } from '../components/dashboard/Sidebar';
import { Header } from '../components/dashboard/Header';
import { StatCard } from '../components/dashboard/StatCard';
import { SignalHealthChart } from '../components/dashboard/SignalHealthChart';
import { SystemLogStream } from '../components/dashboard/SystemLogStream';
import { OperationalStabilityPanel } from '../components/dashboard/OperationalStabilityPanel';

// ==========================================================================
// Centralized Mock Data Configuration Object (Replace with API values later)
// ==========================================================================
const DASHBOARD_MOCK_DATA = {
  nodeName: "NODE_01",
  nodeStatus: "OPERATIONAL",
  uptime: "99.982%",
  billing: "$1,240.00",
  stability: "99.4%",
  stabilityDescription: "System reflex accuracy is maintaining standard thresholds. Agent node synthesis is processing at optimal capacity. No anomalous variance detected in the last 24-hour cycle.",
  failuresToday: {
    value: "12",
    delta: "2%",
    isUp: true // renders red up arrow
  },
  avgDetection: {
    value: "14s",
    delta: "1.5s",
    isUp: false // renders purple down arrow
  },
  signalHealth: {
    frequency: 440,
    amplitude: 0.82
  },
  initialLogs: [
    { time: "14:22:01", text: "AUTH_SERVICE_FAILURE [CRITICAL]", type: "critical" as const },
    { time: "14:22:05", text: "SYNC_PIPELINE_INIT [PROCESSING...]", type: "processing" as const },
    { time: "14:22:12", text: "DEPLOYMENT_TIMEOUT [RETRYING]", type: "retry" as const },
  ],
  streamingLogs: [
    { text: "KERNEL_SYN_RECV [ACK]", type: "info" as const },
    { text: "DB_CLUSTER_HEALTH_CHECK [OK]", type: "ok" as const },
    { text: "MEMORY_USAGE_PEAK [82%]", type: "retry" as const },
    { text: "DNS_QUERY_RESOLVED: CDN_EDGE_04", type: "info" as const },
    { text: "NODE_01_HEARTBEAT [RECEIVED]", type: "ok" as const },
    { text: "SECURITY_SCAN_COMPLETE [NO_THREATS]", type: "ok" as const },
  ]
};

export function DashboardPage() {
  const data = DASHBOARD_MOCK_DATA;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#050507] text-[#e5e2e1] font-sans">
      {/* Top Navbar */}
      <Header uptime={data.uptime} billing={data.billing} />

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar nodeName={data.nodeName} nodeStatus={data.nodeStatus} />

        {/* Dashboard Bento Content Grid */}
        <main 
          className="flex-1 p-6 grid grid-cols-12 grid-rows-6 gap-6 bg-[#050507] relative overflow-y-auto md:overflow-hidden select-none"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(139, 92, 246, 0.02) 1px, transparent 1px),
                              linear-gradient(to bottom, rgba(139, 92, 246, 0.02) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        >
          {/* Subtle retro scanline terminal effect */}
          <div className="scanline"></div>

          {/* Left Panel: Operational Stability */}
          <OperationalStabilityPanel 
            stability={data.stability} 
            description={data.stabilityDescription} 
          />

          {/* Top Right Panel 1: Failures today */}
          <StatCard 
            title="TOTAL_FAILURES_TODAY" 
            value={data.failuresToday.value} 
            delta={data.failuresToday.delta} 
            isUp={data.failuresToday.isUp} 
          />

          {/* Top Right Panel 2: Average detection */}
          <StatCard 
            title="AVG_DETECTION" 
            value={data.avgDetection.value} 
            delta={data.avgDetection.delta} 
            isUp={data.avgDetection.isUp} 
          />

          {/* Middle Right Panel: Oscilloscope Wave */}
          <SignalHealthChart 
            frequency={data.signalHealth.frequency} 
            amplitude={data.signalHealth.amplitude} 
          />

          {/* Bottom Right Panel: Terminal Activity Log Stream */}
          <SystemLogStream 
            initialLogs={data.initialLogs} 
            streamingLogs={data.streamingLogs} 
          />
        </main>
      </div>
    </div>
  );
}
export default DashboardPage;
