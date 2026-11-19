'use client';

import React, { useState, useEffect, useRef } from 'react';
import { NetworkDevice, DevicePort } from '@/types/network';
import { CiscoIosEngine, IosMode } from '@/lib/engine/ciscoIos';
import { UbuntuBashEngine } from '@/lib/engine/ubuntuBash';
import { DeviceIcon } from '@/components/devices/DeviceIcons';
import { sound } from '@/lib/sound/soundEffects';
import {
  X,
  Terminal,
  Settings,
  Cpu,
  Globe,
  Monitor,
  Plus,
  Trash2,
  RefreshCw,
} from 'lucide-react';

interface DeviceModalProps {
  device: NetworkDevice | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateDevice: (updated: NetworkDevice) => void;
  allDevices: NetworkDevice[];
}

function getDefaultBanner(device: NetworkDevice | null) {
  if (!device) return [];
  if (device.type === 'cisco-router' || device.type === 'l2-switch' || device.type === 'l3-switch' || device.type === 'firewall') {
    return [
      { text: `Cisco IOS Software, ${device.name} Software (Cisco-IOS), Version 15.4` },
      { text: 'Technical Support: http://www.cisco.com/techsupport' },
      { text: 'Copyright (c) 1986-2024 by Cisco Systems, Inc.' },
      { text: 'Press RETURN to get started!' },
      { text: '' },
    ];
  }
  return [
    { text: 'Welcome to Ubuntu 22.04.3 LTS (GNU/Linux 5.15.0-89-generic x86_64)' },
    { text: ' * Documentation:  https://help.ubuntu.com' },
    { text: ' * Management:     https://landscape.canonical.com' },
    { text: ` * System load:    0.08, IP: ${device.ports[0]?.ipAddress || 'Not assigned'}` },
    { text: '' },
  ];
}

export const DeviceModal: React.FC<DeviceModalProps> = ({
  device,
  isOpen,
  onClose,
  onUpdateDevice,
  allDevices,
}) => {
  const [activeTab, setActiveTab] = useState<'physical' | 'config' | 'cli' | 'desktop'>('physical');

  // CLI state
  const [cliLines, setCliLines] = useState<Array<{ text: string; isPrompt?: boolean }>>(() => getDefaultBanner(device));
  const [cliInput, setCliInput] = useState<string>('');
  const [cliMode, setCliMode] = useState<IosMode>('USER_EXEC');
  const [cliCurrentIf, setCliCurrentIf] = useState<string | undefined>(undefined);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Desktop Web Browser App state
  const [browserUrl, setBrowserUrl] = useState<string>('http://netlab.edu');
  const [browserContent, setBrowserContent] = useState<string>('');
  const [browserLoading, setBrowserLoading] = useState<boolean>(false);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [cliLines]);

  if (!isOpen || !device) return null;

  const isCisco =
    device.type === 'cisco-router' ||
    device.type === 'l2-switch' ||
    device.type === 'l3-switch' ||
    device.type === 'firewall';

  const isEndpoint =
    device.type === 'pc' ||
    device.type === 'laptop' ||
    device.type === 'smartphone';

  // Handle CLI command submission
  const handleCliSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = cliInput.trim();
    sound.playKeyClick();

    if (isCisco) {
      const prompt = CiscoIosEngine.getPrompt(device, cliMode);
      const newLines = [...cliLines, { text: `${prompt} ${cmd}`, isPrompt: true }];

      if (cmd) {
        const result = CiscoIosEngine.execute(cmd, device, cliMode, cliCurrentIf);
        if (result.output) {
          newLines.push({ text: result.output });
        }
        setCliMode(result.newMode);
        setCliCurrentIf(result.currentInterface);
        onUpdateDevice(result.updatedDevice);
      }

      setCliLines(newLines);
    } else {
      const prompt = UbuntuBashEngine.getPrompt(device);
      const newLines = [...cliLines, { text: `${prompt} ${cmd}`, isPrompt: true }];

      if (cmd) {
        const result = UbuntuBashEngine.execute(cmd, device, allDevices);
        if (result.output === '__CLEAR__') {
          setCliLines([]);
          setCliInput('');
          return;
        }
        if (result.output) {
          newLines.push({ text: result.output });
        }
        onUpdateDevice(result.updatedDevice);
      }

      setCliLines(newLines);
    }

    // Save history
    if (cmd) {
      const updatedHistory = [...device.cliHistory, cmd];
      onUpdateDevice({ ...device, cliHistory: updatedHistory });
    }
    setCliInput('');
  };

  // Web Browser Go
  const handleBrowserNavigate = () => {
    setBrowserLoading(true);
    sound.playKeyClick();

    setTimeout(() => {
      const cleanTarget = browserUrl.replace(/https?:\/\//, '').split('/')[0];
      const webDev = allDevices.find(
        (d) =>
          d.ports.some((p) => p.ipAddress === cleanTarget) ||
          d.hostname.toLowerCase() === cleanTarget.toLowerCase() ||
          (d.type === 'linux-server' && (cleanTarget.includes('netlab') || cleanTarget.includes('web')))
      );

      if (webDev?.webRootHtml) {
        setBrowserContent(webDev.webRootHtml);
      } else {
        setBrowserContent(`
          <div style="font-family: sans-serif; padding: 2rem; color: #ef4444; background: #0f172a;">
            <h2>404 Not Found</h2>
            <p>Không thể kết nối tới máy chủ tại: <strong>${browserUrl}</strong></p>
            <p>Vui lòng kiểm tra lại cấu hình DNS Server hoặc Gateway.</p>
          </div>
        `);
      }
      setBrowserLoading(false);
    }, 400);
  };

  const updatePort = (portId: string, partial: Partial<DevicePort>) => {
    const updatedPorts = device.ports.map((p) => (p.id === portId ? { ...p, ...partial } : p));
    onUpdateDevice({ ...device, ports: updatedPorts });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 border border-slate-700 rounded-xl">
              <DeviceIcon type={device.type} size={36} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">{device.name}</h2>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
                  {device.hostname}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Quản trị thiết bị, cấu hình cổng vật lý & đồng bộ 2 chiều với CLI
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-slate-800 bg-slate-950/40 gap-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('physical')}
            className={`flex items-center gap-1.5 py-3 px-4 border-b-2 transition-colors ${
              activeTab === 'physical'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Cpu className="w-4 h-4" />
            Cổng Vật Lý (Physical Ports)
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-1.5 py-3 px-4 border-b-2 transition-colors ${
              activeTab === 'config'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            Cấu Hình Hệ Thống (Config)
          </button>

          <button
            onClick={() => setActiveTab('cli')}
            className={`flex items-center gap-1.5 py-3 px-4 border-b-2 transition-colors ${
              activeTab === 'cli'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Terminal className="w-4 h-4" />
            {isCisco ? 'Cisco IOS CLI' : 'Ubuntu Linux Bash'}
          </button>

          {isEndpoint && (
            <button
              onClick={() => setActiveTab('desktop')}
              className={`flex items-center gap-1.5 py-3 px-4 border-b-2 transition-colors ${
                activeTab === 'desktop'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="w-4 h-4" />
              Desktop Apps (Web Browser)
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 1. PHYSICAL PORTS TAB */}
          {activeTab === 'physical' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400 mb-2">
                Danh sách các cổng mạng (Interfaces). Thay đổi IP hoặc trạng thái Up/Down tại đây sẽ tự động cập nhật vào CLI.
              </div>

              <div className="grid grid-cols-1 gap-3">
                {device.ports.map((port) => (
                  <div
                    key={port.id}
                    className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          port.status === 'up'
                            ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
                            : 'bg-rose-500 shadow-[0_0_8px_#ef4444]'
                        }`}
                      />
                      <div>
                        <div className="font-mono text-sm font-bold text-white flex items-center gap-2">
                          {port.name}
                          <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                            {port.type.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          MAC: {port.macAddress}
                        </div>
                      </div>
                    </div>

                    {/* Port Config Inputs */}
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                      {port.type !== 'console' && device.type !== 'hub' && (
                        <>
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5 font-mono">
                              IP Address
                            </label>
                            <input
                              type="text"
                              value={port.ipAddress || ''}
                              placeholder="192.168.1.1"
                              onChange={(e) => updatePort(port.id, { ipAddress: e.target.value })}
                              className="px-2.5 py-1 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white font-mono focus:border-blue-500 outline-none w-32"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5 font-mono">
                              Subnet Mask
                            </label>
                            <input
                              type="text"
                              value={port.subnetMask || '255.255.255.0'}
                              placeholder="255.255.255.0"
                              onChange={(e) => updatePort(port.id, { subnetMask: e.target.value })}
                              className="px-2.5 py-1 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white font-mono focus:border-blue-500 outline-none w-32"
                            />
                          </div>
                        </>
                      )}

                      {/* Port Up/Down toggle */}
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5 font-mono">
                          Trạng Thái
                        </label>
                        <button
                          onClick={() => {
                            const next = port.status === 'up' ? 'down' : 'up';
                            updatePort(port.id, { status: next });
                            sound.playKeyClick();
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            port.status === 'up'
                              ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-600/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {port.status === 'up' ? 'Port UP' : 'Shutdown'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. CONFIG TAB */}
          {activeTab === 'config' && (
            <div className="space-y-6">
              {/* General Hostname & Gateway */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Hostname</label>
                  <input
                    type="text"
                    value={device.hostname}
                    onChange={(e) => onUpdateDevice({ ...device, hostname: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white font-mono focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Default Gateway</label>
                  <input
                    type="text"
                    value={device.defaultGateway || ''}
                    placeholder="192.168.1.1"
                    onChange={(e) => onUpdateDevice({ ...device, defaultGateway: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white font-mono focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">DNS Server</label>
                  <input
                    type="text"
                    value={device.dnsServer || ''}
                    placeholder="192.168.1.2"
                    onChange={(e) => onUpdateDevice({ ...device, dnsServer: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white font-mono focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* VLAN Manager (for Switches) */}
              {(device.type === 'l2-switch' || device.type === 'l3-switch') && (
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-white">Quản Lý VLAN (802.1Q Database)</h3>
                    <button
                      onClick={() => {
                        const newId = (device.vlans?.length || 1) * 10;
                        const updated = [...(device.vlans || []), { id: newId, name: `VLAN_${newId}` }];
                        onUpdateDevice({ ...device, vlans: updated });
                      }}
                      className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-blue-600/30 text-blue-300 border border-blue-500/40 hover:bg-blue-600/40"
                    >
                      <Plus className="w-3.5 h-3.5" /> Thêm VLAN
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {device.vlans?.map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono"
                      >
                        <div>
                          <span className="text-blue-400 font-bold">VLAN {v.id}:</span> {v.name}
                        </div>
                        {v.id !== 1 && (
                          <button
                            onClick={() => {
                              const updated = device.vlans?.filter((item) => item.id !== v.id);
                              onUpdateDevice({ ...device, vlans: updated });
                            }}
                            className="text-slate-500 hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* DNS Zone Records (for DNS Server) */}
              {device.type === 'dns-server' && (
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-white">DNS Zone Records</h3>
                    <button
                      onClick={() => {
                        const recs = device.dnsRecords || [];
                        const updated = [
                          ...recs,
                          { id: `dns-${Date.now()}`, domain: 'app.local', type: 'A' as const, value: '192.168.1.100', ttl: 3600 },
                        ];
                        onUpdateDevice({ ...device, dnsRecords: updated });
                      }}
                      className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-600/40"
                    >
                      <Plus className="w-3.5 h-3.5" /> Thêm Record A
                    </button>
                  </div>

                  <div className="space-y-2">
                    {device.dnsRecords?.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono"
                      >
                        <div className="flex items-center gap-3">
                          <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px]">
                            {r.type}
                          </span>
                          <span className="text-white font-bold">{r.domain}</span>
                          <span className="text-slate-400">→</span>
                          <span className="text-emerald-300">{r.value}</span>
                        </div>
                        <button
                          onClick={() => {
                            const updated = device.dnsRecords?.filter((item) => item.id !== r.id);
                            onUpdateDevice({ ...device, dnsRecords: updated });
                          }}
                          className="text-slate-500 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Web Server HTML Editor */}
              {device.type === 'linux-server' && (
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    Web Root File (/var/www/html/index.html)
                  </h3>
                  <textarea
                    rows={8}
                    value={device.webRootHtml || ''}
                    onChange={(e) => onUpdateDevice({ ...device, webRootHtml: e.target.value })}
                    className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-emerald-300 font-mono text-xs focus:border-emerald-500 outline-none leading-relaxed"
                  />
                </div>
              )}
            </div>
          )}

          {/* 3. CLI TERMINAL TAB */}
          {activeTab === 'cli' && (
            <div className="h-[460px] flex flex-col bg-black rounded-xl border border-slate-800 overflow-hidden font-mono text-xs shadow-inner">
              {/* Terminal Screen Output */}
              <div className="flex-1 p-4 overflow-y-auto space-y-1 text-slate-300">
                {cliLines.map((line, idx) => (
                  <div
                    key={idx}
                    className={`leading-relaxed whitespace-pre-wrap ${
                      line.isPrompt ? 'text-amber-400 font-semibold' : 'text-slate-300'
                    }`}
                  >
                    {line.text}
                  </div>
                ))}
                <div ref={terminalEndRef} />
              </div>

              {/* Command Input Bar */}
              <form
                onSubmit={handleCliSubmit}
                className="flex items-center px-4 py-2.5 bg-slate-950 border-t border-slate-800 gap-2"
              >
                <span className="text-amber-400 font-bold shrink-0">
                  {isCisco
                    ? CiscoIosEngine.getPrompt(device, cliMode)
                    : UbuntuBashEngine.getPrompt(device)}
                </span>
                <input
                  type="text"
                  value={cliInput}
                  onChange={(e) => setCliInput(e.target.value)}
                  placeholder="Gõ lệnh (e.g. 'show ip int brief' hoặc 'ping 192.168.1.1'). Gõ '?' để xem trợ giúp..."
                  className="flex-1 bg-transparent text-white outline-none font-mono"
                  autoFocus
                />
              </form>
            </div>
          )}

          {/* 4. DESKTOP APPS TAB (PC / Laptop) */}
          {activeTab === 'desktop' && isEndpoint && (
            <div className="space-y-4">
              {/* Web Browser Frame */}
              <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
                {/* Browser URL Bar */}
                <div className="flex items-center gap-2 p-2.5 bg-slate-900 border-b border-slate-800">
                  <Globe className="w-4 h-4 text-blue-400 ml-1" />
                  <input
                    type="text"
                    value={browserUrl}
                    onChange={(e) => setBrowserUrl(e.target.value)}
                    placeholder="http://netlab.edu hoặc http://192.168.1.100"
                    className="flex-1 px-3 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white font-mono outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={handleBrowserNavigate}
                    disabled={browserLoading}
                    className="px-4 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    {browserLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Truy Cập'}
                  </button>
                </div>

                {/* Browser Viewport */}
                <div className="p-6 min-h-[300px] bg-slate-950 flex flex-col items-center justify-center">
                  {browserContent ? (
                    <div
                      className="w-full bg-white text-slate-900 rounded-lg p-6 shadow"
                      dangerouslySetInnerHTML={{ __html: browserContent }}
                    />
                  ) : (
                    <div className="text-center text-slate-500">
                      <Globe className="w-12 h-12 mx-auto mb-2 opacity-40 text-blue-400" />
                      <p className="text-sm font-medium">Trình duyệt Web máy trạm</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Nhập địa chỉ Web Server hoặc tên miền DNS (như <code className="text-blue-400">http://netlab.edu</code>) rồi bấm Truy Cập.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
