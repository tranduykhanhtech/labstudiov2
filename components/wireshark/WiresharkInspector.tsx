'use client';

import React, { useState } from 'react';
import { PacketPdu, ProtocolType } from '@/types/network';
import {
  ChevronRight,
  ChevronDown,
  Trash2,
  Download,
  Filter,
  Layers,
  FileCode,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface WiresharkInspectorProps {
  packets: PacketPdu[];
  selectedPacket: PacketPdu | null;
  onSelectPacket: (packet: PacketPdu) => void;
  onClearPackets: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const WiresharkInspector: React.FC<WiresharkInspectorProps> = ({
  packets,
  selectedPacket,
  onSelectPacket,
  onClearPackets,
  isOpen,
  onToggleOpen,
}) => {
  const [filterText, setFilterText] = useState<string>('');
  const [activeProtoFilter, setActiveProtoFilter] = useState<string>('ALL');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Accordion state for OSI layers
  const [expandedLayers, setExpandedLayers] = useState<Record<string, boolean>>({
    L1: true,
    L2: true,
    L3: true,
    L4: true,
    L7: true,
  });

  const toggleLayer = (layerKey: string) => {
    setExpandedLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  // Filter logic
  const filteredPackets = packets.filter((p) => {
    if (activeProtoFilter !== 'ALL' && p.protocol !== activeProtoFilter) {
      return false;
    }
    if (filterText) {
      const q = filterText.toLowerCase();
      const matchSummary = p.summary.toLowerCase().includes(q);
      const matchProto = p.protocol.toLowerCase().includes(q);
      const matchSrc = p.layer3?.sourceIp.toLowerCase().includes(q) || p.layer2.sourceMac.toLowerCase().includes(q);
      const matchDst = p.layer3?.destIp.toLowerCase().includes(q) || p.layer2.destMac.toLowerCase().includes(q);
      return matchSummary || matchProto || matchSrc || matchDst;
    }
    return true;
  });

  const protoBadgeColors: Record<ProtocolType, string> = {
    ARP: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    ICMP: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    DNS: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    DHCP: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    TCP: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    UDP: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    HTTP: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    HTTPS: 'bg-blue-600/20 text-blue-200 border-blue-500/30',
    STP: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    OSPF: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    RIP: 'bg-amber-600/20 text-amber-300 border-amber-600/30',
    BGP: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    CDP: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    LLDP: 'bg-sky-400/20 text-sky-200 border-sky-400/30',
    SSH: 'bg-teal-600/20 text-teal-300 border-teal-600/30',
    TELNET: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    NTP: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    SNMP: 'bg-lime-500/20 text-lime-300 border-lime-500/30',
    SYSLOG: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    FTP: 'bg-red-500/20 text-red-300 border-red-500/30',
    ATTACK: 'bg-red-600/30 text-red-200 border-red-500/50 font-bold',
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(packets, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `netlab-capture-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggleOpen}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 hover:text-white hover:border-blue-500 shadow-xl backdrop-blur-md transition-all font-mono text-xs font-semibold"
      >
        <Layers className="w-4 h-4 text-blue-400" />
        <span>Wireshark-lite PDU Inspector</span>
        <span className="px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px]">
          {packets.length}
        </span>
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800 backdrop-blur-md flex flex-col shadow-2xl transition-all duration-300 ${
        isExpanded ? 'h-[75vh]' : 'h-[340px]'
      }`}
    >
      {/* Header & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-white">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            Wireshark-lite OSI Inspector
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px] font-mono">
            {['ALL', 'ATTACK', 'ICMP', 'TCP', 'UDP', 'HTTP', 'DNS', 'DHCP', 'OSPF', 'ARP', 'STP'].map((p) => (
              <button
                key={p}
                onClick={() => setActiveProtoFilter(p)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  activeProtoFilter === p
                    ? p === 'ATTACK'
                      ? 'bg-red-600 text-white font-bold'
                      : 'bg-blue-600 text-white font-bold'
                    : p === 'ATTACK'
                    ? 'text-red-400 hover:text-red-300 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input & Action Tools */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Apply display filter (e.g. 192.168.1.1)..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="pl-8 pr-3 py-1 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500 w-56 font-mono"
            />
          </div>

          <button
            onClick={handleExportJson}
            title="Xuất file JSON Packet Capture"
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={onClearPackets}
            title="Xóa danh sách gói tin"
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-rose-400 hover:bg-slate-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Thu nhỏ' : 'Phóng to'}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onToggleOpen}
            className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-mono"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Main Split Panels */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Packet Table */}
        <div className="w-1/2 border-r border-slate-800 overflow-y-auto">
          <table className="w-full text-left font-mono text-[11px] border-collapse">
            <thead className="sticky top-0 bg-slate-900/90 text-slate-400 border-b border-slate-800 select-none">
              <tr>
                <th className="py-1 px-2 w-10 text-center">No.</th>
                <th className="py-1 px-2 w-16">Time</th>
                <th className="py-1 px-2 w-28">Source</th>
                <th className="py-1 px-2 w-28">Destination</th>
                <th className="py-1 px-2 w-16">Protocol</th>
                <th className="py-1 px-2">Info</th>
              </tr>
            </thead>
            <tbody>
              {filteredPackets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">
                    Chưa có gói tin nào được ghi nhận. Hãy gửi PDU Ping hoặc chạy mô phỏng!
                  </td>
                </tr>
              ) : (
                filteredPackets.map((pkt, idx) => {
                  const isSelected = selectedPacket?.id === pkt.id;
                  const timeSec = ((pkt.timestamp % 100000) / 1000).toFixed(3);
                  const src = pkt.layer3?.sourceIp || pkt.layer2.sourceMac;
                  const dst = pkt.layer3?.destIp || pkt.layer2.destMac;

                  return (
                    <tr
                      key={`${pkt.id}-${idx}`}
                      onClick={() => onSelectPacket(pkt)}
                      className={`cursor-pointer transition-colors border-b border-slate-900/40 ${
                        isSelected
                          ? 'bg-blue-600/30 text-white'
                          : idx % 2 === 0
                          ? 'bg-slate-950/40 hover:bg-slate-900/60'
                          : 'bg-slate-950/80 hover:bg-slate-900/60'
                      }`}
                    >
                      <td className="py-1 px-2 text-center text-slate-500">{idx + 1}</td>
                      <td className="py-1 px-2 text-slate-400">{timeSec}</td>
                      <td className="py-1 px-2 text-slate-200 truncate max-w-[110px]">{src}</td>
                      <td className="py-1 px-2 text-slate-200 truncate max-w-[110px]">{dst}</td>
                      <td className="py-1 px-2">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${
                            protoBadgeColors[pkt.protocol] || 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {pkt.protocol}
                        </span>
                      </td>
                      <td className="py-1 px-2 text-slate-300 truncate max-w-[220px]" title={pkt.summary}>
                        {pkt.summary}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Right: OSI 7-Layer Breakdown & Raw Hex Dump */}
        <div className="w-1/2 flex flex-col overflow-y-auto bg-slate-950 p-3 space-y-3 font-mono text-xs">
          {selectedPacket ? (
            <>
              {/* Layer 1: Physical */}
              <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/40">
                <button
                  onClick={() => toggleLayer('L1')}
                  className="w-full flex items-center justify-between p-2 bg-slate-900 text-left hover:bg-slate-800/80 transition-colors"
                >
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    {expandedLayers['L1'] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    Frame / Layer 1 (Physical): {selectedPacket.layer1.media} ({selectedPacket.layer1.bandwidth})
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    Port: {selectedPacket.layer1.inPort}
                  </span>
                </button>
                {expandedLayers['L1'] && (
                  <div className="p-2 space-y-1 text-slate-300 text-[11px] bg-slate-950/60 border-t border-slate-800">
                    <div>• Inbound Port: {selectedPacket.layer1.inPort}</div>
                    <div>• Outbound Port: {selectedPacket.layer1.outPort}</div>
                    <div>• Link Status: Up (100 Mbps Full-Duplex)</div>
                  </div>
                )}
              </div>

              {/* Layer 2: Data Link */}
              <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/40">
                <button
                  onClick={() => toggleLayer('L2')}
                  className="w-full flex items-center justify-between p-2 bg-slate-900 text-left hover:bg-slate-800/80 transition-colors"
                >
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                    {expandedLayers['L2'] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    Ethernet II (Layer 2 - Data Link)
                  </span>
                  <span className="text-[10px] text-slate-400">{selectedPacket.layer2.etherType}</span>
                </button>
                {expandedLayers['L2'] && (
                  <div className="p-2 space-y-1 text-slate-300 text-[11px] bg-slate-950/60 border-t border-slate-800">
                    <div>• Source MAC: <span className="text-emerald-300">{selectedPacket.layer2.sourceMac}</span></div>
                    <div>• Destination MAC: <span className="text-emerald-300">{selectedPacket.layer2.destMac}</span></div>
                    <div>• EtherType: {selectedPacket.layer2.etherType}</div>
                    {selectedPacket.layer2.vlanId && (
                      <div>• 802.1Q Virtual LAN: VLAN {selectedPacket.layer2.vlanId}</div>
                    )}
                  </div>
                )}
              </div>

              {/* Layer 3: Network */}
              {selectedPacket.layer3 && (
                <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/40">
                  <button
                    onClick={() => toggleLayer('L3')}
                    className="w-full flex items-center justify-between p-2 bg-slate-900 text-left hover:bg-slate-800/80 transition-colors"
                  >
                    <span className="font-bold text-cyan-400 flex items-center gap-1.5">
                      {expandedLayers['L3'] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      Internet Protocol Version 4 (Layer 3 - Network)
                    </span>
                    <span className="text-[10px] text-slate-400">TTL: {selectedPacket.layer3.ttl}</span>
                  </button>
                  {expandedLayers['L3'] && (
                    <div className="p-2 space-y-1 text-slate-300 text-[11px] bg-slate-950/60 border-t border-slate-800">
                      <div>• Source IP: <span className="text-cyan-300">{selectedPacket.layer3.sourceIp}</span></div>
                      <div>• Destination IP: <span className="text-cyan-300">{selectedPacket.layer3.destIp}</span></div>
                      <div>• Protocol: {selectedPacket.layer3.protocol} ({selectedPacket.protocol})</div>
                      <div>• Time To Live (TTL): {selectedPacket.layer3.ttl}</div>
                      <div>• Flags: {selectedPacket.layer3.flags}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Layer 4: Transport */}
              {selectedPacket.layer4 && (
                <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/40">
                  <button
                    onClick={() => toggleLayer('L4')}
                    className="w-full flex items-center justify-between p-2 bg-slate-900 text-left hover:bg-slate-800/80 transition-colors"
                  >
                    <span className="font-bold text-purple-400 flex items-center gap-1.5">
                      {expandedLayers['L4'] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      {selectedPacket.layer4.protocolName} (Layer 4 - Transport)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {selectedPacket.layer4.sourcePort} → {selectedPacket.layer4.destPort}
                    </span>
                  </button>
                  {expandedLayers['L4'] && (
                    <div className="p-2 space-y-1 text-slate-300 text-[11px] bg-slate-950/60 border-t border-slate-800">
                      <div>• Source Port: {selectedPacket.layer4.sourcePort}</div>
                      <div>• Destination Port: {selectedPacket.layer4.destPort}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Layer 7: Application */}
              {selectedPacket.layer7 && (
                <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/40">
                  <button
                    onClick={() => toggleLayer('L7')}
                    className="w-full flex items-center justify-between p-2 bg-slate-900 text-left hover:bg-slate-800/80 transition-colors"
                  >
                    <span className="font-bold text-amber-400 flex items-center gap-1.5">
                      {expandedLayers['L7'] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      Application Layer 7: {selectedPacket.layer7.application}
                    </span>
                  </button>
                  {expandedLayers['L7'] && (
                    <div className="p-2 space-y-1 text-slate-300 text-[11px] bg-slate-950/60 border-t border-slate-800">
                      {Object.entries(selectedPacket.layer7.details).map(([k, v]) => (
                        <div key={k}>
                          • <span className="capitalize">{k}</span>: <span className="text-amber-200">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Wireshark Raw Hex & ASCII Dump View */}
              <div className="border border-slate-800 rounded-lg p-2.5 bg-slate-950">
                <div className="flex items-center gap-2 text-slate-400 font-bold text-[11px] mb-1.5">
                  <FileCode className="w-3.5 h-3.5 text-blue-400" />
                  Wireshark Hex & ASCII Packet Octets Dump
                </div>
                <pre className="text-[10.5px] leading-tight text-slate-400 font-mono overflow-x-auto p-2 bg-slate-900/80 rounded border border-slate-800/80">
                  {selectedPacket.rawHex}
                </pre>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 py-12">
              <Layers className="w-8 h-8 mb-2 opacity-50" />
              <p>Chọn một dòng gói tin ở bảng bên trái để bóc tách 7 lớp OSI PDU</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
