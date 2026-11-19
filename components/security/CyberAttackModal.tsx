'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  Activity,
  Cpu,
  Server,
  Crosshair,
  CheckCircle2,
  XCircle,
  X,
  Lock,
} from 'lucide-react';
import {
  NetworkDevice,
  NetworkLink,
  AttackType,
  AttackCategory,
  CyberAttackDefinition,
  AttackResult,
} from '@/types/network';
import { CYBER_ATTACKS, CyberAttackEngine, ATTACK_MAP } from '@/lib/engine/cyberAttacks';

interface CyberAttackModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: NetworkDevice[];
  links: NetworkLink[];
  onExecuteAttack: (result: AttackResult) => void;
  onToggleDefense: (deviceId: string) => void;
}

export const CyberAttackModal: React.FC<CyberAttackModalProps> = ({
  isOpen,
  onClose,
  devices,
  links,
  onExecuteAttack,
  onToggleDefense,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<AttackCategory | 'all'>('all');
  const [selectedLayer, setSelectedLayer] = useState<string>('all');
  const [selectedAttackId, setSelectedAttackId] = useState<AttackType>('syn-flood');
  const [attackerId, setAttackerId] = useState<string>(devices[0]?.id || '');
  const [targetId, setTargetId] = useState<string>(devices[devices.length - 1]?.id || '');
  const [lastResult, setLastResult] = useState<AttackResult | null>(null);

  if (!isOpen) return null;

  const currentAttack: CyberAttackDefinition =
    ATTACK_MAP.get(selectedAttackId) || CYBER_ATTACKS[0];

  const attackerDevice = devices.find((d) => d.id === attackerId) || devices[0];
  const targetDevice = devices.find((d) => d.id === targetId) || devices[devices.length - 1];

  const filteredAttacks = CYBER_ATTACKS.filter((atk) => {
    if (selectedCategory !== 'all' && atk.category !== selectedCategory) return false;
    if (selectedLayer !== 'all' && atk.layer !== selectedLayer) return false;
    return true;
  });

  const handleLaunch = () => {
    if (!attackerDevice || !targetDevice) {
      alert('Vui lòng chọn Thiết bị Tấn công và Thiết bị Mục tiêu!');
      return;
    }
    const result = CyberAttackEngine.executeAttack(
      selectedAttackId,
      attackerDevice,
      targetDevice,
      devices,
      links
    );
    setLastResult(result);
    onExecuteAttack(result);
  };

  const handleQuickLaunch = (attackId: AttackType) => {
    setSelectedAttackId(attackId);
    if (!attackerDevice || !targetDevice) return;
    const result = CyberAttackEngine.executeAttack(
      attackId,
      attackerDevice,
      targetDevice,
      devices,
      links
    );
    setLastResult(result);
    onExecuteAttack(result);
  };

  const isTargetDefenseOn = !!targetDevice?.securityDefenseActive;
  const targetCpu = Math.min(100, (targetDevice?.cpuUtilization || 15) + (lastResult?.cpuDelta || 0));
  const targetRam = Math.min(100, (targetDevice?.ramUtilization || 20) + (lastResult?.ramDelta || 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden text-slate-100">
        {/* Header - Clean & Professional */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white">
                  Kiểm Thử & Phòng Thủ Tấn Công Mạng
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  17 Kịch bản (L2 - L7)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Thử nghiệm độ chịu tải của thiết bị và hướng dẫn lệnh phòng thủ Cisco IOS / Linux
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Attack Presets Bar */}
        <div className="px-5 py-2 bg-slate-950/60 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="text-slate-400 text-xs font-medium mr-1 shrink-0">Bắn nhanh:</span>
          {[
            { id: 'syn-flood' as AttackType, label: 'SYN Flood' },
            { id: 'arp-spoofing' as AttackType, label: 'ARP Spoofing' },
            { id: 'cam-table-overflow' as AttackType, label: 'CAM Overflow' },
            { id: 'vlan-hopping' as AttackType, label: 'VLAN Hopping' },
            { id: 'stp-root-takeover' as AttackType, label: 'STP Root Hijack' },
            { id: 'bgp-route-hijacking' as AttackType, label: 'BGP Hijacking' },
            { id: 'slowloris' as AttackType, label: 'Slowloris' },
            { id: 'dhcp-starvation' as AttackType, label: 'DHCP Starve' },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleQuickLaunch(preset.id)}
              className={`px-2.5 py-1 rounded text-xs transition-colors shrink-0 ${
                selectedAttackId === preset.id
                  ? 'bg-red-600 text-white font-medium'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden grid grid-cols-12 divide-x divide-slate-800">
          {/* Left Column: Attack Selector (4 cols) */}
          <div className="col-span-4 flex flex-col bg-slate-950/40 p-4 overflow-y-auto">
            {/* Filters */}
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Phân Loại Cuộc Tấn Công
                </label>
                <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`py-1 rounded font-medium ${
                      selectedCategory === 'all'
                        ? 'bg-red-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Tất cả (16)
                  </button>
                  <button
                    onClick={() => setSelectedCategory('popular')}
                    className={`py-1 rounded font-medium ${
                      selectedCategory === 'popular'
                        ? 'bg-red-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Phổ Biến (9)
                  </button>
                  <button
                    onClick={() => setSelectedCategory('advanced')}
                    className={`py-1 rounded font-medium ${
                      selectedCategory === 'advanced'
                        ? 'bg-red-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Chuyên Sâu (7)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Tầng Mô Hình OSI (Layer)
                </label>
                <div className="flex gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
                  {['all', 'L2', 'L3', 'L4', 'L7'].map((l) => (
                    <button
                      key={l}
                      onClick={() => setSelectedLayer(l)}
                      className={`flex-1 py-1 rounded font-mono uppercase font-semibold ${
                        selectedLayer === l
                          ? 'bg-slate-700 text-amber-300'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {l === 'all' ? 'Toàn bộ' : l}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Attack List */}
            <div className="flex-1 space-y-1.5 overflow-y-auto pr-1">
              {filteredAttacks.map((atk) => {
                const isSelected = atk.id === selectedAttackId;
                return (
                  <button
                    key={atk.id}
                    onClick={() => setSelectedAttackId(atk.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-red-950/50 border-red-500/80 shadow-md shadow-red-950/50'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        atk.severity === 'CRITICAL'
                          ? 'bg-red-500 shadow-sm shadow-red-500'
                          : atk.severity === 'HIGH'
                          ? 'bg-amber-500 shadow-sm shadow-amber-500'
                          : 'bg-blue-400'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-semibold text-xs text-white truncate">
                          {atk.name}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                            atk.category === 'popular'
                              ? 'bg-blue-950/60 border-blue-800 text-blue-300'
                              : 'bg-purple-950/60 border-purple-800 text-purple-300'
                          }`}
                        >
                          {atk.layer}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{atk.shortDesc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Center Column: Attack Inspection & Defense Workspace (8 cols) */}
          <div className="col-span-8 flex flex-col p-6 overflow-y-auto space-y-6">
            {/* Top Config: Attacker & Target Selectors */}
            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-red-400 flex items-center gap-1.5 mb-1.5">
                    <Crosshair className="w-4 h-4 text-red-500" /> 1. Thiết Bị Tấn Công (Attacker / Botnet)
                  </label>
                  <select
                    value={attackerId}
                    onChange={(e) => setAttackerId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-lg p-2.5 focus:border-red-500 outline-none"
                  >
                    {devices.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.hostname} ({d.type}) — IP: {d.ports[0]?.ipAddress || 'DHCP/None'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 mb-1.5">
                    <Server className="w-4 h-4 text-emerald-500" /> 2. Thiết Bị Mục Tiêu (Target Victim)
                  </label>
                  <select
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-lg p-2.5 focus:border-emerald-500 outline-none"
                  >
                    {devices.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.hostname} ({d.type}) — IP: {d.ports[0]?.ipAddress || 'DHCP/None'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleDefense(targetId)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-colors ${
                      isTargetDefenseOn
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {isTargetDefenseOn ? (
                      <>
                        <ShieldCheck className="w-4 h-4" /> Phòng thủ: ĐANG BẬT
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-slate-400" /> Phòng thủ: ĐANG TẮT
                      </>
                    )}
                  </button>
                  <span className="text-[11px] text-slate-400">
                    {isTargetDefenseOn
                      ? '✓ Đã kích hoạt bảo mật (Port-Security, BPDU Guard, SYN Cookies)'
                      : 'Thiết bị chưa được cấu hình phòng vệ'}
                  </span>
                </div>

                <button
                  onClick={handleLaunch}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-medium text-xs rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Zap className="w-4 h-4" /> Bắn Thử Tấn Công
                </button>
              </div>
            </div>

            {/* Attack Details & Technical Mechanics */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {currentAttack.name}
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-mono ${
                        currentAttack.severity === 'CRITICAL'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      }`}
                    >
                      Mức độ: {currentAttack.severity}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Giao thức: <span className="font-mono text-cyan-300">{currentAttack.protocol}</span> | Phân loại: {currentAttack.category === 'popular' ? 'Phổ biến' : 'Chuyên sâu & Ít gặp'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
                  <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" /> Cơ Chế Hoạt Động (Mechanism)
                  </span>
                  <p className="text-slate-300 leading-relaxed">{currentAttack.mechanism}</p>
                </div>

                <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
                  <span className="font-semibold text-rose-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" /> Hậu Quả Hệ Thống (System Impact)
                  </span>
                  <p className="text-slate-300 leading-relaxed">{currentAttack.impact}</p>
                </div>
              </div>

              {/* Target Health Metrics Bar */}
              <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-cyan-400" /> Tải Trọng Mục Tiêu ({targetDevice?.hostname})
                  </span>
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                      targetCpu > 80
                        ? 'bg-red-600/30 text-red-400 border border-red-500/50'
                        : 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/50'
                    }`}
                  >
                    {targetCpu > 80 ? '⚠️ OVERLOADED / OFFLINE' : 'NORMAL (ONLINE)'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>CPU Utilization</span>
                      <span className="font-mono text-white font-bold">{targetCpu}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          targetCpu > 80 ? 'bg-red-500' : targetCpu > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${targetCpu}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>RAM Utilization</span>
                      <span className="font-mono text-white font-bold">{targetRam}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          targetRam > 80 ? 'bg-red-500' : targetRam > 50 ? 'bg-amber-500' : 'bg-cyan-500'
                        }`}
                        style={{ width: `${targetRam}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Execution Feedback Alert */}
              {lastResult && (
                <div
                  className={`p-4 rounded-xl border text-xs flex items-start gap-3 animate-in fade-in duration-200 ${
                    lastResult.blockedByDefense
                      ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
                      : 'bg-red-950/40 border-red-500/60 text-red-200'
                  }`}
                >
                  {lastResult.blockedByDefense ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <span className="font-bold text-sm block">
                      {lastResult.blockedByDefense
                        ? '🛡️ ĐÃ PHÒNG THỦ THÀNH CÔNG!'
                        : '💥 TẤN CÔNG ĐÃ XÂM NHẬP HỆ THỐNG!'}
                    </span>
                    <p className="leading-relaxed">{lastResult.message}</p>
                    <p className="text-[11px] opacity-80">
                      Gói tin đã được đẩy lên bàn vẽ Topology Canvas và ghi nhận chi tiết vào bảng phân tích Wireshark-lite.
                    </p>
                  </div>
                </div>
              )}

              {/* Defense & Hardening Configuration Reference */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Kỹ Thuật Phòng Thủ Khắc Phục (Hardening)
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Công nghệ: {currentAttack.defenseTechnology}
                  </span>
                </div>

                <p className="text-xs text-slate-300">{currentAttack.mitigation}</p>

                {/* Commands */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-[11px] font-mono">
                  {currentAttack.ciscoCommand && (
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5">
                      <span className="text-cyan-400 font-bold block mb-1">Cisco IOS Configuration:</span>
                      <pre className="text-slate-300 whitespace-pre-wrap">{currentAttack.ciscoCommand}</pre>
                    </div>
                  )}

                  {currentAttack.linuxCommand && (
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5">
                      <span className="text-amber-400 font-bold block mb-1">Ubuntu Linux Command:</span>
                      <pre className="text-slate-300 whitespace-pre-wrap">{currentAttack.linuxCommand}</pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
