'use client';

import React, { useState, useRef, MouseEvent } from 'react';
import {
  NetworkDevice,
  NetworkLink,
  PacketPdu,
  CableType,
} from '@/types/network';
import { DeviceIcon } from '@/components/devices/DeviceIcons';
import { sound } from '@/lib/sound/soundEffects';
import {
  Trash2,
  Settings,
  Mail,
  Zap,
  ZoomIn,
  ZoomOut,
  Maximize,
  Radio,
} from 'lucide-react';

interface TopologyCanvasProps {
  devices: NetworkDevice[];
  links: NetworkLink[];
  activePackets: PacketPdu[];
  onUpdateDevices: (devices: NetworkDevice[]) => void;
  onUpdateLinks: (links: NetworkLink[]) => void;
  onOpenDeviceModal: (device: NetworkDevice) => void;
  onSendSimplePdu: (srcDevice: NetworkDevice, dstDevice: NetworkDevice) => void;
  selectedDeviceId: string | null;
  onSelectDevice: (id: string | null) => void;
  cableMode: CableType | null;
  onSetCableMode: (mode: CableType | null) => void;
  isPduMode: boolean;
  onSetPduMode: (val: boolean) => void;
}

export const TopologyCanvas: React.FC<TopologyCanvasProps> = ({
  devices,
  links,
  activePackets,
  onUpdateDevices,
  onUpdateLinks,
  onOpenDeviceModal,
  onSendSimplePdu,
  selectedDeviceId,
  onSelectDevice,
  cableMode,
  onSetCableMode,
  isPduMode,
  onSetPduMode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Zoom & Pan
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Dragging device
  const [draggingDeviceId, setDraggingDeviceId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Cable creation temporary state
  const [cableSource, setCableSource] = useState<{ deviceId: string; portId: string } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // PDU source selection state
  const [pduSourceDev, setPduSourceDev] = useState<NetworkDevice | null>(null);

  // Handle Canvas Pan & Drag
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (e.button === 1 || (e.button === 0 && e.target === containerRef.current)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const currentX = (e.clientX - rect.left - pan.x) / zoom;
    const currentY = (e.clientY - rect.top - pan.y) / zoom;
    setMousePos({ x: currentX, y: currentY });

    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    } else if (draggingDeviceId) {
      const updated = devices.map((d) =>
        d.id === draggingDeviceId
          ? {
              ...d,
              x: Math.max(40, currentX - dragOffset.x),
              y: Math.max(40, currentY - dragOffset.y),
            }
          : d
      );
      onUpdateDevices(updated);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingDeviceId(null);
  };

  // Device interaction
  const handleDeviceMouseDown = (e: MouseEvent, device: NetworkDevice) => {
    e.stopPropagation();

    // 1. PDU Mode (click source then click destination)
    if (isPduMode) {
      if (!pduSourceDev) {
        setPduSourceDev(device);
        sound.playKeyClick();
      } else {
        if (pduSourceDev.id !== device.id) {
          onSendSimplePdu(pduSourceDev, device);
          setPduSourceDev(null);
          onSetPduMode(false);
        }
      }
      return;
    }

    // 2. Cable connection mode
    if (cableMode) {
      if (!cableSource) {
        // Find first available port on device
        const freePort = device.ports.find((p) => !p.connectedLinkId) || device.ports[0];
        setCableSource({ deviceId: device.id, portId: freePort.id });
        sound.playKeyClick();
      } else {
        if (cableSource.deviceId !== device.id) {
          // Connect cable
          const targetPort = device.ports.find((p) => !p.connectedLinkId) || device.ports[0];
          const newLink: NetworkLink = {
            id: `link-${device.id}-${cableSource.deviceId}-${targetPort.id}`,
            cableType: cableMode,
            fromDeviceId: cableSource.deviceId,
            fromPortId: cableSource.portId,
            toDeviceId: device.id,
            toPortId: targetPort.id,
            status: 'up',
          };

          // Mark ports connected and up
          const updatedDevs = devices.map((d) => {
            if (d.id === cableSource.deviceId) {
              const updatedPorts = d.ports.map((p) =>
                p.id === cableSource.portId ? { ...p, connectedLinkId: newLink.id, status: 'up' as const } : p
              );
              return { ...d, ports: updatedPorts };
            }
            if (d.id === device.id) {
              const updatedPorts = d.ports.map((p) =>
                p.id === targetPort.id ? { ...p, connectedLinkId: newLink.id, status: 'up' as const } : p
              );
              return { ...d, ports: updatedPorts };
            }
            return d;
          });

          onUpdateLinks([...links, newLink]);
          onUpdateDevices(updatedDevs);
          sound.playPingSuccess();
        }
        setCableSource(null);
        onSetCableMode(null);
      }
      return;
    }

    // 3. Normal selection & drag
    onSelectDevice(device.id);
    setDraggingDeviceId(device.id);
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const clickX = (e.clientX - rect.left - pan.x) / zoom;
      const clickY = (e.clientY - rect.top - pan.y) / zoom;
      setDragOffset({ x: clickX - device.x, y: clickY - device.y });
    }
  };

  const getCableStroke = (cableType: CableType) => {
    switch (cableType) {
      case 'straight':
        return { stroke: '#3b82f6', strokeWidth: 3, strokeDasharray: undefined }; // Blue solid
      case 'crossover':
        return { stroke: '#f97316', strokeWidth: 3, strokeDasharray: '6 4' }; // Orange dashed
      case 'fiber':
        return { stroke: '#eab308', strokeWidth: 3.5, strokeDasharray: undefined }; // Yellow solid
      case 'serial':
        return { stroke: '#ef4444', strokeWidth: 2.5, strokeDasharray: undefined }; // Red
      case 'console':
        return { stroke: '#06b6d4', strokeWidth: 2.5, strokeDasharray: '4 2' }; // Cyan
    }
  };

  // Find wireless AP to draw animated radio waves
  const wirelessAp = devices.find((d) => d.type === 'wireless-ap');
  const wirelessClients = devices.filter(
    (d) => (d.type === 'laptop' || d.type === 'smartphone') && d.isWifiConnected
  );

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="relative w-full h-full bg-[#0a0f1d] overflow-hidden select-none cursor-grab active:cursor-grabbing"
      style={{
        backgroundImage: `
          radial-gradient(circle at 1px 1px, #1e293b 1px, transparent 0)
        `,
        backgroundSize: `${30 * zoom}px ${30 * zoom}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px`,
      }}
    >
      {/* Viewport Zoom / Reset Controls */}
      <div className="absolute top-3 right-4 z-20 flex items-center gap-1 p-1 rounded-lg bg-slate-900/90 border border-slate-800 shadow-md backdrop-blur">
        <button
          onClick={() => setZoom((z) => Math.min(2.0, z + 0.1))}
          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Phóng to"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <div className="px-2 py-0.5 text-[11px] font-mono text-slate-300 font-semibold min-w-[45px] text-center">
          {Math.round(zoom * 100)}%
        </div>
        <button
          onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))}
          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Thu nhỏ"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Khôi phục góc nhìn"
        >
          <Maximize className="w-4 h-4" />
        </button>
      </div>

      {/* SVG Canvas Layer (Glow Filters, Cables, Animations, Packets) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        <defs>
          {/* Cable Glow Filter */}
          <filter id="cable-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          {/* Attack Pulse Filter */}
          <filter id="attack-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 2 -0.2"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Wireless AP Radio Waves */}
        {wirelessAp &&
          wirelessClients.map((client) => (
            <g key={`wifi-${client.id}`} className="opacity-60">
              <line
                x1={wirelessAp.x + 48}
                y1={wirelessAp.y + 44}
                x2={client.x + 48}
                y2={client.y + 44}
                stroke="#38bdf8"
                strokeWidth={1.5}
                strokeDasharray="4 6"
                className="animate-photon"
              />
            </g>
          ))}

        {/* Network Cables (High-Tech Dual Layer with Optical Glow) */}
        {links.map((link) => {
          const devA = devices.find((d) => d.id === link.fromDeviceId);
          const devB = devices.find((d) => d.id === link.toDeviceId);
          if (!devA || !devB) return null;

          const x1 = devA.x + 48;
          const y1 = devA.y + 44;
          const x2 = devB.x + 48;
          const y2 = devB.y + 44;

          const strokeStyle = getCableStroke(link.cableType);

          return (
            <g key={link.id} className="cursor-pointer pointer-events-auto">
              {/* Outer Ambient Glow Line */}
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={strokeStyle.stroke}
                strokeWidth={strokeStyle.strokeWidth + 5}
                strokeOpacity={0.25}
                strokeLinecap="round"
              />
              {/* Core Physical Cable */}
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={strokeStyle.stroke}
                strokeWidth={strokeStyle.strokeWidth}
                strokeDasharray={strokeStyle.strokeDasharray}
                strokeLinecap="round"
                className="hover:stroke-white transition-colors"
              />
              {/* Animated Optical Pulse Stream */}
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#ffffff"
                strokeWidth={1.5}
                strokeDasharray="3 16"
                strokeOpacity={0.7}
                className="animate-photon"
              />

              {/* Port A Fiber Activity LED */}
              <circle cx={x1 + (x2 - x1) * 0.15} cy={y1 + (y2 - y1) * 0.15} r={4} fill="#10b981" className="shadow-lg" />
              <circle cx={x1 + (x2 - x1) * 0.15} cy={y1 + (y2 - y1) * 0.15} r={6} fill="#10b981" opacity={0.3} className="animate-ping" />

              {/* Port B Fiber Activity LED */}
              <circle cx={x2 - (x2 - x1) * 0.15} cy={y2 - (y2 - y1) * 0.15} r={4} fill="#10b981" className="shadow-lg" />
              <circle cx={x2 - (x2 - x1) * 0.15} cy={y2 - (y2 - y1) * 0.15} r={6} fill="#10b981" opacity={0.3} className="animate-ping" />
            </g>
          );
        })}

        {/* Temporary cable line during connection */}
        {cableSource && (
          <g>
            <line
              x1={(devices.find((d) => d.id === cableSource.deviceId)?.x || 0) + 48}
              y1={(devices.find((d) => d.id === cableSource.deviceId)?.y || 0) + 44}
              x2={mousePos.x}
              y2={mousePos.y}
              stroke="#06b6d4"
              strokeWidth={3}
              strokeDasharray="6 4"
              className="animate-photon"
            />
            <circle cx={mousePos.x} cy={mousePos.y} r={6} fill="#06b6d4" opacity={0.5} className="animate-ping" />
          </g>
        )}

        {/* Traveling Animated Packets */}
        {activePackets.map((pkt) => {
          const srcDev = devices.find((d) => d.id === pkt.currentDeviceId);
          const dstDev = devices.find((d) => d.id === pkt.targetDeviceId);
          if (!srcDev || !dstDev) return null;

          const startX = srcDev.x + 48;
          const startY = srcDev.y + 44;
          const endX = dstDev.x + 48;
          const endY = dstDev.y + 44;

          const curX = startX + (endX - startX) * pkt.progress;
          const curY = startY + (endY - startY) * pkt.progress;

          const isAtk = pkt.protocol === 'ATTACK';

          return (
            <g key={pkt.id} className="transition-transform duration-75">
              {/* Outer Glowing Energy Field */}
              <circle
                cx={curX}
                cy={curY}
                r={isAtk ? 18 : 14}
                fill={pkt.color}
                opacity={isAtk ? 0.7 : 0.4}
                className="animate-ping"
              />
              {/* Photon Core Capsule */}
              <circle
                cx={curX}
                cy={curY}
                r={isAtk ? 9 : 7.5}
                fill={pkt.color}
                stroke="#ffffff"
                strokeWidth={2}
                className="drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
              />
              {/* Holographic Protocol Tag */}
              <g transform={`translate(${curX}, ${curY - 22})`}>
                <rect
                  x={isAtk ? -24 : -18}
                  y={-10}
                  width={isAtk ? 48 : 36}
                  height={16}
                  rx={5}
                  fill="#030712"
                  stroke={pkt.color}
                  strokeWidth={1.8}
                  className="shadow-xl"
                />
                <text
                  x={0}
                  y={2}
                  fill={isAtk ? '#f87171' : '#38bdf8'}
                  fontSize={8.5}
                  fontWeight="900"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {isAtk ? '⚠️ ATK' : pkt.protocol}
                </text>
              </g>
            </g>
          );
        })}
      </svg>

      {/* HTML Devices Layer - Glassmorphism Blade Chassis Units */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {devices.map((device) => {
          const isSelected = selectedDeviceId === device.id;
          const isPduSrc = pduSourceDev?.id === device.id;
          const isUnderAttack = device.securityStatus === 'under-attack' || (device.cpuUtilization || 0) > 80;
          const isCompromised = device.securityStatus === 'compromised';
          const isOffline = device.securityStatus === 'offline';
          const primaryPort = device.ports.find((p) => p.ipAddress) || device.ports[0];

          return (
            <div
              key={device.id}
              style={{
                transform: `translate(${device.x}px, ${device.y}px)`,
              }}
              onMouseDown={(e) => handleDeviceMouseDown(e, device)}
              onDoubleClick={() => onOpenDeviceModal(device)}
              className={`absolute pointer-events-auto flex flex-col items-center group cursor-pointer select-none ${
                isOffline ? 'opacity-80' : ''
              }`}
            >
              {/* Clean Device Container */}
              <div
                className={`relative flex flex-col items-center p-2 rounded-xl transition-all ${
                  isOffline
                    ? 'bg-red-950/70 ring-2 ring-red-500 shadow-lg'
                    : isUnderAttack
                    ? 'bg-rose-950/60 ring-2 ring-rose-500 shadow-md'
                    : isCompromised
                    ? 'bg-amber-950/60 ring-2 ring-amber-500'
                    : isSelected
                    ? 'bg-blue-900/30 ring-2 ring-blue-500 shadow-md'
                    : isPduSrc
                    ? 'bg-pink-900/30 ring-2 ring-pink-500'
                    : 'hover:bg-slate-800/50'
                }`}
              >
                {/* Device Icon */}
                <div className="relative flex items-center justify-center">
                  <DeviceIcon type={device.type} size={48} />

                  {/* Defense Shield Badge */}
                  {device.securityDefenseActive && (
                    <span className="absolute -top-1 -left-2 px-1 py-0.2 rounded-full bg-emerald-600 text-white font-bold text-[8px] flex items-center gap-0.5 shadow">
                      🛡️
                    </span>
                  )}

                  {/* Status Badges */}
                  {isOffline && (
                    <span className="absolute -top-2 -right-2 px-1 py-0.2 rounded bg-red-600 text-white font-bold text-[8px] shadow animate-pulse">
                      SẬP
                    </span>
                  )}
                  {isUnderAttack && !isOffline && (
                    <span className="absolute -top-2 -right-2 px-1 py-0.2 rounded bg-rose-600 text-white font-bold text-[8px] shadow">
                      {device.cpuUtilization}%
                    </span>
                  )}
                  {device.isCamOverflowed && (
                    <span className="absolute -bottom-1 -left-1 px-1 rounded bg-amber-600 text-white font-bold text-[7.5px]">
                      HUB
                    </span>
                  )}
                  {device.isArpPoisoned && (
                    <span className="absolute -bottom-1 -right-1 px-1 rounded bg-purple-600 text-white font-bold text-[7.5px]">
                      MITM
                    </span>
                  )}
                  {device.isStpRoot && (
                    <span className="absolute -top-1 -right-1 px-1 py-0.2 rounded bg-amber-500 text-slate-950 font-bold text-[8px]">
                      ROOT
                    </span>
                  )}
                  {device.type === 'wireless-ap' && (
                    <Radio className="absolute -top-1 -left-1 w-3.5 h-3.5 text-sky-400 animate-pulse" />
                  )}
                </div>

                {/* Device Hostname & IP */}
                <div className="mt-1 flex flex-col items-center">
                  <span className="text-[11px] font-semibold text-white tracking-tight">
                    {device.hostname}
                  </span>
                  {primaryPort?.ipAddress && (
                    <span className="text-[10px] font-mono text-slate-400">
                      {primaryPort.ipAddress}
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Actions Hover Pill */}
              <div className="absolute -bottom-7 opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded-lg shadow-lg transition-opacity z-30">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDeviceModal(device);
                  }}
                  className="p-1 hover:text-blue-400 text-slate-400 transition-colors"
                  title="Cấu hình thiết bị"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
                <div className="h-3 w-px bg-slate-700" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const updated = devices.filter((d) => d.id !== device.id);
                    const updatedLinks = links.filter(
                      (l) => l.fromDeviceId !== device.id && l.toDeviceId !== device.id
                    );
                    onUpdateDevices(updated);
                    onUpdateLinks(updatedLinks);
                  }}
                  className="p-1 hover:text-rose-400 text-slate-400 transition-colors"
                  title="Xóa thiết bị"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Status Hints */}
      {isPduMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-2xl bg-pink-600/90 text-white font-semibold text-xs shadow-[0_0_25px_rgba(236,72,153,0.5)] flex items-center gap-2 backdrop-blur-xl border border-pink-400/40 animate-bounce">
          <Mail className="w-4 h-4" />
          {pduSourceDev
            ? `Đã chọn nguồn ${pduSourceDev.hostname}. Hãy click vào Thiết bị ĐÍCH!`
            : 'Chọn Thiết bị NGUỒN để gửi gói tin PDU...'}
        </div>
      )}

      {cableMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-2xl bg-cyan-600/90 text-white font-semibold text-xs shadow-[0_0_25px_rgba(6,182,212,0.5)] flex items-center gap-2 backdrop-blur-xl border border-cyan-400/40">
          <Zap className="w-4 h-4 text-cyan-200" />
          {cableSource
            ? 'Kéo và click vào Thiết bị ĐÍCH để cắm cáp!'
            : `Đang cắm cáp: ${cableMode.toUpperCase()}. Click vào Thiết bị thứ nhất...`}
        </div>
      )}
    </div>
  );
};
