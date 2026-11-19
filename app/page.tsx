'use client';

import React, { useState, useEffect } from 'react';
import {
  NetworkDevice,
  NetworkLink,
  PacketPdu,
  CableType,
  DeviceType,
  AttackResult,
} from '@/types/network';
import { TopologyCanvas } from '@/components/canvas/TopologyCanvas';
import { DeviceModal } from '@/components/modals/DeviceModal';
import { CableWorkshopModal } from '@/components/crimping/CableWorkshopModal';
import { WiresharkInspector } from '@/components/wireshark/WiresharkInspector';
import { TheoryModal } from '@/components/theory/TheoryModal';
import { CyberAttackModal } from '@/components/security/CyberAttackModal';
import { ProtocolSimulatorModal } from '@/components/protocols/ProtocolSimulatorModal';
import { DeviceIcon } from '@/components/devices/DeviceIcons';
import { PacketEngine } from '@/lib/engine/packetEngine';
import { createDefaultDevice } from '@/lib/labs/labData';
import { sound } from '@/lib/sound/soundEffects';
import {
  Scissors,
  Layers,
  BookOpen,
  Volume2,
  VolumeX,
  Mail,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Download,
  Upload,
  Trash2,
  ShieldAlert,
  Globe,
} from 'lucide-react';

function getInitialLab1State() {
  const devPc = createDefaultDevice('pc', 140, 240, '1');
  const devSw = createDefaultDevice('l2-switch', 380, 240, '1');
  const devRouter = createDefaultDevice('cisco-router', 640, 240, '1');
  const devServer = createDefaultDevice('linux-server', 640, 420, '1');

  devPc.ports[0].ipAddress = '192.168.1.10';
  devPc.ports[0].subnetMask = '255.255.255.0';
  devPc.defaultGateway = '192.168.1.1';

  devRouter.ports[0].ipAddress = '192.168.1.1';
  devRouter.ports[0].subnetMask = '255.255.255.0';
  devRouter.ports[0].status = 'up';

  devRouter.ports[1].ipAddress = '10.0.0.1';
  devRouter.ports[1].subnetMask = '255.255.255.0';
  devRouter.ports[1].status = 'up';

  devServer.ports[0].ipAddress = '192.168.1.100';
  devServer.ports[0].subnetMask = '255.255.255.0';
  devServer.defaultGateway = '192.168.1.1';

  const initialLinks: NetworkLink[] = [
    {
      id: 'link-1',
      cableType: 'straight',
      fromDeviceId: devPc.id,
      fromPortId: devPc.ports[0].id,
      toDeviceId: devSw.id,
      toPortId: devSw.ports[0].id,
      status: 'up',
    },
    {
      id: 'link-2',
      cableType: 'straight',
      fromDeviceId: devSw.id,
      fromPortId: devSw.ports[1].id,
      toDeviceId: devRouter.id,
      toPortId: devRouter.ports[0].id,
      status: 'up',
    },
    {
      id: 'link-3',
      cableType: 'straight',
      fromDeviceId: devSw.id,
      fromPortId: devSw.ports[2].id,
      toDeviceId: devServer.id,
      toPortId: devServer.ports[0].id,
      status: 'up',
    },
  ];

  return { devices: [devPc, devSw, devRouter, devServer], links: initialLinks };
}

export default function NetLabStudioApp() {
  // Network Topology State (Starts completely empty / blank canvas)
  const [devices, setDevices] = useState<NetworkDevice[]>([]);
  const [links, setLinks] = useState<NetworkLink[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  // Tools & Modes
  const [cableMode, setCableMode] = useState<CableType | null>(null);
  const [isPduMode, setIsPduMode] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Simulation Engine State
  const [isSimulationMode, setIsSimulationMode] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [activePackets, setActivePackets] = useState<PacketPdu[]>([]);
  const [capturedPackets, setCapturedPackets] = useState<PacketPdu[]>([]);
  const [selectedPacket, setSelectedPacket] = useState<PacketPdu | null>(null);

  // Modals
  const [inspectingDevice, setInspectingDevice] = useState<NetworkDevice | null>(null);
  const [isCableWorkshopOpen, setIsCableWorkshopOpen] = useState<boolean>(false);
  const [isTheoryOpen, setIsTheoryOpen] = useState<boolean>(false);
  const [isWiresharkOpen, setIsWiresharkOpen] = useState<boolean>(false);
  const [isAttackModalOpen, setIsAttackModalOpen] = useState<boolean>(false);
  const [isProtocolModalOpen, setIsProtocolModalOpen] = useState<boolean>(false);

  // Multi-user & No-account Persistence: Auto-save workspace to browser LocalStorage when devices exist
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'netlab_workspace_session',
          JSON.stringify({ devices, links, timestamp: Date.now() })
        );
      }
    } catch {
      // Ignore quota exceptions
    }
  }, [devices, links]);

  // Recalculate STP whenever switches or links change
  useEffect(() => {
    PacketEngine.calculateStp(devices, links);
  }, [devices, links]);

  // Simulation Animation Loop (Tick Runner)
  useEffect(() => {
    if (activePackets.length === 0 || !isPlaying) return;

    const interval = setInterval(() => {
      setActivePackets((prevPackets) => {
        const updated = prevPackets.map((pkt) => {
          const nextProg = pkt.progress + 0.04 * simSpeed;
          return {
            ...pkt,
            progress: Math.min(1.0, nextProg),
            completed: nextProg >= 1.0,
          };
        });

        // Filter out completed ones and log them into capturedPackets
        const finished = updated.filter((p) => p.completed);
        if (finished.length > 0) {
          setCapturedPackets((prevCaptured) => {
            const existingIds = new Set(prevCaptured.map((p) => p.id));
            const fresh = finished.filter((p) => !existingIds.has(p.id));
            return [...prevCaptured, ...fresh];
          });
          sound.playPingSuccess();
        }

        return updated.filter((p) => !p.completed);
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying, simSpeed, activePackets.length]);



  const handleAddDevice = (type: DeviceType) => {
    const nameSuffix = (devices.filter((d) => d.type === type).length + 1).toString();
    const newDev = createDefaultDevice(type, 300 + Math.random() * 100, 200 + Math.random() * 80, nameSuffix);
    setDevices((prev) => [...prev, newDev]);
    sound.playKeyClick();
  };

  // Trigger PDU Ping
  const handleSendSimplePdu = (src: NetworkDevice, dst: NetworkDevice) => {
    const result = PacketEngine.simulatePacketFlow(src, dst, 'ICMP', devices, links);
    if (result.packets.length > 0) {
      setActivePackets(result.packets);
      setIsPlaying(true);
      setIsWiresharkOpen(true);
      sound.playPingSuccess();
    } else {
      sound.playError();
      alert(result.message);
    }
  };

  const handleExecuteAttack = (result: AttackResult) => {
    setDevices((prev) =>
      prev.map((d) => {
        if (d.id === result.targetId) {
          const cpu = Math.min(100, (d.cpuUtilization || 15) + result.cpuDelta);
          const ram = Math.min(100, (d.ramUtilization || 20) + result.ramDelta);
          return {
            ...d,
            cpuUtilization: cpu,
            ramUtilization: ram,
            securityStatus: result.statusChange,
            isCamOverflowed: result.attackId === 'cam-table-overflow' && !result.blockedByDefense,
            isArpPoisoned: result.attackId === 'arp-spoofing' && !result.blockedByDefense,
            attackLogs: [...(d.attackLogs || []), `[${new Date().toLocaleTimeString()}] ${result.message}`],
          };
        }
        return d;
      })
    );

    setActivePackets((prev) => [...prev, ...result.generatedPackets]);
    setIsPlaying(true);
    setIsWiresharkOpen(true);
    if (result.blockedByDefense) {
      sound.playPingSuccess();
    } else {
      sound.playError();
    }
  };

  const handleToggleDefense = (deviceId: string) => {
    setDevices((prev) =>
      prev.map((d) =>
        d.id === deviceId
          ? {
              ...d,
              securityDefenseActive: !d.securityDefenseActive,
              securityStatus: !d.securityDefenseActive ? 'normal' : d.securityStatus,
              cpuUtilization: !d.securityDefenseActive ? 15 : d.cpuUtilization,
              isCamOverflowed: false,
              isArpPoisoned: false,
            }
          : d
      )
    );
    sound.playKeyClick();
  };

  const handleTransmitProtocol = (packets: PacketPdu[]) => {
    setActivePackets(packets);
    setIsPlaying(true);
    setIsWiresharkOpen(true);
    sound.playPingSuccess();
  };

  // Step Forward in Simulation
  const handleStepSimulation = () => {
    if (activePackets.length === 0) return;
    setActivePackets((prev) => {
      const updated = prev.map((p) => ({
        ...p,
        progress: Math.min(1.0, p.progress + 0.25),
        completed: p.progress + 0.25 >= 1.0,
      }));
      const finished = updated.filter((p) => p.completed);
      if (finished.length > 0) {
        setCapturedPackets((prevCaptured) => {
          const existingIds = new Set(prevCaptured.map((p) => p.id));
          const fresh = finished.filter((p) => !existingIds.has(p.id));
          return [...prevCaptured, ...fresh];
        });
      }
      return updated.filter((p) => !p.completed);
    });
    sound.playTesterTick(true);
  };

  const handleToggleSound = () => {
    const next = sound.toggle();
    setSoundEnabled(next);
  };

  const handleExportTopology = () => {
    const payload = { devices, links };
    const str = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const a = document.createElement('a');
    a.href = str;
    a.download = `netlab-topology-${Date.now()}.json`;
    a.click();
    a.remove();
  };

  const handleImportTopology = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.devices && parsed.links) {
          setDevices(parsed.devices);
          setLinks(parsed.links);
          sound.playPingSuccess();
        }
      } catch {
        alert('File JSON không đúng định dạng topology NetLab Studio!');
      }
    };
    reader.readAsText(file);
  };

  const handleReloadLocalSession = () => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('netlab_workspace_session');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed.devices) && Array.isArray(parsed.links) && parsed.devices.length > 0) {
            setDevices(parsed.devices);
            setLinks(parsed.links);
            setActivePackets([]);
            sound.playPingSuccess();
            alert('✓ Đã khôi phục thành công sơ đồ mạng từ bộ nhớ LocalStorage của trình duyệt!');
            return;
          }
        }
        // Fallback to initial lab
        const initial = getInitialLab1State();
        setDevices(initial.devices);
        setLinks(initial.links);
        setActivePackets([]);
        sound.playPingSuccess();
        alert('ℹ️ Đã làm mới về sơ đồ mạng SOHO mặc định ban đầu!');
      }
    } catch {
      alert('Không thể đọc dữ liệu LocalStorage!');
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#030712] text-slate-100 font-sans select-none">
      {/* 1. TOP HEADER APP BAR - CLEAN & MODERN */}
      <header className="h-13 border-b border-slate-800 bg-slate-900/95 px-4 flex items-center justify-between shrink-0 z-30 shadow-sm backdrop-blur">
        <div className="flex items-center gap-2.5">
          {/* Professional Network Node Logo */}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-sky-500 p-0.5 shadow-md flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-sky-400">
                <circle cx="12" cy="12" r="7" stroke="#38bdf8" strokeWidth="2" fill="#0f172a" />
                <circle cx="12" cy="12" r="2.5" fill="#38bdf8" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-1 font-sans">
                <span>NetLab</span>
                <span className="text-sky-400 font-mono font-semibold text-xs">STUDIO</span>
              </h1>
              <span className="text-[10px] font-medium px-2 py-0.2 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                Packet Tracer++
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Mô phỏng mạng L1 - L7 • BGP / OSPF / STP • Kiểm thử bảo mật
            </p>
          </div>
        </div>

        {/* Action Tools Center & Right */}
        <div className="flex items-center gap-2">
          {/* Cyber Attack & Security Studio Button */}
          <button
            onClick={() => setIsAttackModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 text-xs font-medium transition-colors"
            title="Thử nghiệm 17 kịch bản tấn công mạng (DoS, MITM, BGP Route Hijacking...)"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span>Kịch Bản Tấn Công</span>
          </button>

          {/* Full Protocol Simulator Button */}
          <button
            onClick={() => setIsProtocolModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 text-xs font-medium transition-colors"
            title="Phát và giải mã hơn 20 giao thức mạng L2-L7"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>Giả Lập Giao Thức</span>
          </button>

          {/* Comprehensive Theory & Reference Templates Button */}
          <button
            onClick={() => setIsTheoryOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 text-xs font-medium transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            <span>Giáo Trình Lý Thuyết</span>
          </button>

          {/* RJ45 Cable Workshop Button */}
          <button
            onClick={() => setIsCableWorkshopOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 text-xs font-medium transition-colors"
          >
            <Scissors className="w-3.5 h-3.5 text-amber-400" />
            <span>Bấm Cáp</span>
          </button>

          {/* Wireshark Inspector Toggle */}
          <button
            onClick={() => setIsWiresharkOpen(!isWiresharkOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isWiresharkOpen
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Wireshark</span>
            <span className="px-1.5 py-0.2 rounded bg-black/30 text-[10px] font-mono">
              {capturedPackets.length}
            </span>
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            className={`p-1.5 rounded-lg border transition-colors ${
              soundEnabled
                ? 'bg-slate-800 text-slate-200 border-slate-700 hover:text-white'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
            title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Reload Local Session Button */}
          <button
            onClick={handleReloadLocalSession}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors text-xs font-medium"
            title="Khôi phục trạng thái mạng từ trình duyệt"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Khôi phục</span>
          </button>

          {/* Export / Import Topology */}
          <button
            onClick={handleExportTopology}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:text-white transition-colors"
            title="Lưu file JSON"
          >
            <Download className="w-4 h-4" />
          </button>

          <label
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:text-white transition-colors cursor-pointer"
            title="Mở file JSON"
          >
            <Upload className="w-4 h-4" />
            <input type="file" accept=".json" onChange={handleImportTopology} className="hidden" />
          </label>

          {/* Reset / Clear */}
          <button
            onClick={() => {
              if (confirm('Bạn có chắc muốn xóa trắng toàn bộ Topology?')) {
                setDevices([]);
                setLinks([]);
                setActivePackets([]);
              }
            }}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors"
            title="Xóa trắng canvas"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. SUB-BAR: CONTROLS & CABLES - STREAMLINED */}
      <div className="h-10 border-b border-slate-800/80 bg-slate-900/60 px-4 flex items-center justify-between shrink-0 z-20 text-xs">
        {/* Simulation Controls */}
        <div className="flex items-center gap-2">
          {/* Mode switch */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => {
                setIsSimulationMode(false);
                setIsPlaying(true);
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                !isSimulationMode ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Realtime
            </button>
            <button
              onClick={() => {
                setIsSimulationMode(true);
                setIsPlaying(false);
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                isSimulationMode ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Simulation
            </button>
          </div>

          {/* Play/Pause & Step Buttons */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-white transition-colors"
            title={isPlaying ? 'Tạm dừng mô phỏng' : 'Chạy mô phỏng'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          </button>

          <button
            onClick={handleStepSimulation}
            className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-white transition-colors"
            title="Bước tới 1 gói tin (Step Forward)"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setActivePackets([])}
            className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Đặt lại gói tin"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Speed selector */}
          <div className="flex items-center gap-1 text-[11px] font-mono ml-2 text-slate-400">
            <span>Tốc độ:</span>
            {[0.5, 1, 2].map((s) => (
              <button
                key={s}
                onClick={() => setSimSpeed(s)}
                className={`px-1.5 py-0.5 rounded ${
                  simSpeed === s ? 'bg-blue-600 text-white font-bold' : 'hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Send Simple PDU Button */}
          <button
            onClick={() => setIsPduMode(!isPduMode)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors ml-3 ${
              isPduMode
                ? 'bg-pink-600 text-white shadow-sm'
                : 'bg-slate-800 border border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-pink-400" />
            <span>Gửi Ping (PDU)</span>
          </button>
        </div>

        {/* Cable Connection Types */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400 mr-1 font-medium">Nối cáp:</span>

          <button
            onClick={() => setCableMode(cableMode === 'straight' ? null : 'straight')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5 transition-colors ${
              cableMode === 'straight'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800/80 border border-slate-700 text-blue-400 hover:bg-slate-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-500" /> Cáp Thẳng
          </button>

          <button
            onClick={() => setCableMode(cableMode === 'crossover' ? null : 'crossover')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5 transition-colors ${
              cableMode === 'crossover'
                ? 'bg-orange-600 text-white'
                : 'bg-slate-800/80 border border-slate-700 text-orange-400 hover:bg-slate-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-orange-500" /> Cáp Chéo
          </button>

          <button
            onClick={() => setCableMode(cableMode === 'fiber' ? null : 'fiber')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5 transition-colors ${
              cableMode === 'fiber'
                ? 'bg-yellow-600 text-white'
                : 'bg-slate-800/80 border border-slate-700 text-yellow-400 hover:bg-slate-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-yellow-500" /> Cáp Quang
          </button>

          <button
            onClick={() => setCableMode(cableMode === 'console' ? null : 'console')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5 transition-colors ${
              cableMode === 'console'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-800/80 border border-slate-700 text-cyan-400 hover:bg-slate-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-500" /> Console
          </button>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE (CANVAS + FLOATING DEVICE PALETTE) */}
      <div className="flex-1 relative overflow-hidden flex">
        {/* Canvas Area */}
        <TopologyCanvas
          devices={devices}
          links={links}
          activePackets={activePackets}
          onUpdateDevices={setDevices}
          onUpdateLinks={setLinks}
          onOpenDeviceModal={(dev) => setInspectingDevice(dev)}
          onSendSimplePdu={handleSendSimplePdu}
          selectedDeviceId={selectedDeviceId}
          onSelectDevice={setSelectedDeviceId}
          cableMode={cableMode}
          onSetCableMode={setCableMode}
          isPduMode={isPduMode}
          onSetPduMode={setIsPduMode}
        />

        {/* 14 Network Devices Palette (Bottom Dock - Clean & Compact) */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 max-w-[95vw] overflow-x-auto bg-slate-900/95 border border-slate-800 p-2 rounded-xl shadow-xl backdrop-blur flex items-center gap-1.5">
          {/* L3 & Security */}
          <div className="flex items-center gap-1 px-2 border-r border-slate-800">
            <span className="text-[10px] font-semibold text-slate-500 uppercase mr-1">L3</span>
            <button
              onClick={() => handleAddDevice('cisco-router')}
              className="px-2 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 hover:text-white border border-slate-700/60 flex flex-col items-center gap-1 transition-colors"
              title="Thêm Router L3"
            >
              <DeviceIcon type="cisco-router" size={26} />
              <span className="text-[10px] text-slate-300">Router</span>
            </button>
            <button
              onClick={() => handleAddDevice('firewall')}
              className="px-2 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 hover:text-white border border-slate-700/60 flex flex-col items-center gap-1 transition-colors"
              title="Thêm Firewall"
            >
              <DeviceIcon type="firewall" size={26} />
              <span className="text-[10px] text-slate-300">Firewall</span>
            </button>
          </div>

          {/* Switch */}
          <div className="flex items-center gap-1 px-2 border-r border-slate-800">
            <span className="text-[10px] font-semibold text-slate-500 uppercase mr-1">Switch</span>
            <button
              onClick={() => handleAddDevice('l3-switch')}
              className="px-2 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 hover:text-white border border-slate-700/60 flex flex-col items-center gap-1 transition-colors"
              title="Thêm Switch L3"
            >
              <DeviceIcon type="l3-switch" size={26} />
              <span className="text-[10px] text-slate-300">Switch L3</span>
            </button>
            <button
              onClick={() => handleAddDevice('l2-switch')}
              className="px-2 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 hover:text-white border border-slate-700/60 flex flex-col items-center gap-1 transition-colors"
              title="Thêm Switch L2"
            >
              <DeviceIcon type="l2-switch" size={26} />
              <span className="text-[10px] text-slate-300">Switch L2</span>
            </button>
            <button
              onClick={() => handleAddDevice('hub')}
              className="px-2 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 hover:text-white border border-slate-700/60 flex flex-col items-center gap-1 transition-colors"
              title="Thêm Hub L1"
            >
              <DeviceIcon type="hub" size={26} />
              <span className="text-[10px] text-slate-300">Hub L1</span>
            </button>
          </div>

          {/* Servers */}
          <div className="flex items-center gap-1 px-2 border-r border-slate-800">
            <span className="text-[10px] font-semibold text-slate-500 uppercase mr-1">Server</span>
            <button
              onClick={() => handleAddDevice('linux-server')}
              className="px-2 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 hover:text-white border border-slate-700/60 flex flex-col items-center gap-1 transition-colors"
              title="Thêm Web Server"
            >
              <DeviceIcon type="linux-server" size={26} />
              <span className="text-[10px] text-slate-300">Web</span>
            </button>
            <button
              onClick={() => handleAddDevice('dns-server')}
              className="px-2 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 hover:text-white border border-slate-700/60 flex flex-col items-center gap-1 transition-colors"
              title="Thêm DNS Server"
            >
              <DeviceIcon type="dns-server" size={26} />
              <span className="text-[10px] text-slate-300">DNS</span>
            </button>
            <button
              onClick={() => handleAddDevice('dhcp-server')}
              className="px-2 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 hover:text-white border border-slate-700/60 flex flex-col items-center gap-1 transition-colors"
              title="Thêm DHCP Server"
            >
              <DeviceIcon type="dhcp-server" size={26} />
              <span className="text-[10px] text-slate-300">DHCP</span>
            </button>
            <button
              onClick={() => handleAddDevice('syslog-server')}
              className="px-2 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 hover:text-white border border-slate-700/60 flex flex-col items-center gap-1 transition-colors"
              title="Thêm Syslog & NTP Server"
            >
              <DeviceIcon type="syslog-server" size={26} />
              <span className="text-[10px] text-slate-300">Syslog</span>
            </button>
          </div>

          {/* Wi-Fi & IoT */}
          <div className="flex items-center gap-1 px-2 border-r border-slate-800">
            <span className="text-[10px] font-semibold text-slate-500 uppercase mr-1">Không dây</span>
            <button
              onClick={() => handleAddDevice('wireless-ap')}
              className="px-2 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 hover:text-white border border-slate-700/60 flex flex-col items-center gap-1 transition-colors"
              title="Thêm Wireless AP"
            >
              <DeviceIcon type="wireless-ap" size={26} />
              <span className="text-[10px] text-slate-300">AP</span>
            </button>
            <button
              onClick={() => handleAddDevice('iot-gateway')}
              className="px-2 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 hover:text-white border border-slate-700/60 flex flex-col items-center gap-1 transition-colors"
              title="Thêm Thiết Bị IoT"
            >
              <DeviceIcon type="iot-gateway" size={26} />
              <span className="text-[10px] text-slate-300">IoT</span>
            </button>
          </div>

          {/* Hosts */}
          <div className="flex items-center gap-1 px-2">
            <span className="text-[10px] font-semibold text-slate-500 uppercase mr-1">Host</span>
            <button
              onClick={() => handleAddDevice('pc')}
              className="px-2 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 hover:text-white border border-slate-700/60 flex flex-col items-center gap-1 transition-colors"
              title="Thêm Desktop PC"
            >
              <DeviceIcon type="pc" size={26} />
              <span className="text-[10px] text-slate-300">PC</span>
            </button>
            <button
              onClick={() => handleAddDevice('laptop')}
              className="px-2 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 hover:text-white border border-slate-700/60 flex flex-col items-center gap-1 transition-colors"
              title="Thêm Laptop"
            >
              <DeviceIcon type="laptop" size={26} />
              <span className="text-[10px] text-slate-300">Laptop</span>
            </button>
            <button
              onClick={() => handleAddDevice('smartphone')}
              className="px-2 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 hover:text-white border border-slate-700/60 flex flex-col items-center gap-1 transition-colors"
              title="Thêm Smartphone"
            >
              <DeviceIcon type="smartphone" size={26} />
              <span className="text-[10px] text-slate-300">Phone</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. MODALS & PANELS */}
      {/* Device Configurator & CLI Modal */}
      <DeviceModal
        key={inspectingDevice?.id || 'none'}
        device={inspectingDevice}
        isOpen={inspectingDevice !== null}
        onClose={() => setInspectingDevice(null)}
        onUpdateDevice={(updated) => {
          setDevices((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
          setInspectingDevice(updated);
        }}
        allDevices={devices}
      />

      {/* RJ45 Cable Crimping Studio Modal */}
      <CableWorkshopModal
        isOpen={isCableWorkshopOpen}
        onClose={() => setIsCableWorkshopOpen(false)}
        onAddCableToCanvas={(type) => {
          setCableMode(type as CableType);
          sound.playPingSuccess();
        }}
      />

      {/* Comprehensive Theory Curriculum & Reference Blueprints Modal */}
      <TheoryModal
        isOpen={isTheoryOpen}
        onClose={() => setIsTheoryOpen(false)}
        onLoadTopology={(topo) => {
          setDevices(topo.devices);
          setLinks(topo.links);
          setActivePackets([]);
          setCapturedPackets([]);
        }}
      />

      {/* Cyber Attack & Penetration Testing Studio Modal */}
      <CyberAttackModal
        isOpen={isAttackModalOpen}
        onClose={() => setIsAttackModalOpen(false)}
        devices={devices}
        links={links}
        onExecuteAttack={handleExecuteAttack}
        onToggleDefense={handleToggleDefense}
      />

      {/* Full Network Protocol Simulator Modal */}
      <ProtocolSimulatorModal
        isOpen={isProtocolModalOpen}
        onClose={() => setIsProtocolModalOpen(false)}
        devices={devices}
        links={links}
        onTransmitProtocol={handleTransmitProtocol}
      />

      {/* Wireshark-lite OSI PDU Inspector Panel */}
      <WiresharkInspector
        packets={capturedPackets}
        selectedPacket={selectedPacket}
        onSelectPacket={(pkt) => setSelectedPacket(pkt)}
        onClearPackets={() => setCapturedPackets([])}
        isOpen={isWiresharkOpen}
        onToggleOpen={() => setIsWiresharkOpen(!isWiresharkOpen)}
      />
    </div>
  );
}
