'use client';

import React, { useState } from 'react';
import {
  Globe,
  Layers,
  Send,
  X,
  Network,
  Info,
  CheckCircle2,
} from 'lucide-react';
import {
  NetworkDevice,
  NetworkLink,
  ProtocolType,
  PacketPdu,
} from '@/types/network';
import { PacketEngine, PROTOCOL_COLORS } from '@/lib/engine/packetEngine';

interface ProtocolSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: NetworkDevice[];
  links: NetworkLink[];
  onTransmitProtocol: (packets: PacketPdu[], protocol: ProtocolType) => void;
}

interface ProtocolDef {
  type: ProtocolType;
  name: string;
  layer: 'Tầng 2 (Data Link)' | 'Tầng 3 (Network)' | 'Tầng 4 (Transport)' | 'Tầng 7 (Application)';
  layerNum: number;
  port?: string;
  rfc?: string;
  summary: string;
  mechanics: string;
}

const ALL_PROTOCOLS: ProtocolDef[] = [
  // Tầng 2
  {
    type: 'ARP',
    name: 'ARP (Address Resolution Protocol)',
    layer: 'Tầng 2 (Data Link)',
    layerNum: 2,
    rfc: 'RFC 826',
    summary: 'Phân giải địa chỉ IP tầng 3 sang địa chỉ MAC vật lý tầng 2 trong cùng mạng cục bộ.',
    mechanics: 'Phát sóng Broadcast (ff:ff:ff:ff:ff:ff) "Ai có IP x.x.x.x? Hãy trả lời cho tôi". Máy có IP đó gửi lại Unicast ARP Reply.',
  },
  {
    type: 'STP',
    name: 'STP (Spanning Tree Protocol)',
    layer: 'Tầng 2 (Data Link)',
    layerNum: 2,
    rfc: 'IEEE 802.1D / 802.1w',
    summary: 'Chống vòng lặp L2 trong topo chuyển mạch dự phòng bằng cách đưa cổng thừa vào trạng thái Blocking.',
    mechanics: 'Các switch trao đổi bản tin BPDU (Bridge Protocol Data Unit) để bầu Root Bridge và tính toán đường đi ngắn nhất.',
  },
  {
    type: 'CDP',
    name: 'CDP (Cisco Discovery Protocol)',
    layer: 'Tầng 2 (Data Link)',
    layerNum: 2,
    summary: 'Giao thức độc quyền của Cisco giúp tự động khám phá các thiết bị Cisco kết nối trực tiếp lân cận.',
    mechanics: 'Định kỳ 60s phát multicast frame thông báo Device ID, IP, Port ID, Capabilities và phiên bản IOS.',
  },
  {
    type: 'LLDP',
    name: 'LLDP (Link Layer Discovery Protocol)',
    layer: 'Tầng 2 (Data Link)',
    layerNum: 2,
    rfc: 'IEEE 802.1AB',
    summary: 'Chuẩn mở khám phá thiết bị mạng lân cận tương tự CDP nhưng tương thích đa hãng (Multi-vendor).',
    mechanics: 'Đóng gói các đơn vị Type-Length-Value (TLV) chứa thông tin thiết bị và phát ra mọi cổng kết nối vật lý.',
  },

  // Tầng 3
  {
    type: 'ICMP',
    name: 'ICMP (Internet Control Message Protocol)',
    layer: 'Tầng 3 (Network)',
    layerNum: 3,
    rfc: 'RFC 792',
    summary: 'Giao thức chẩn đoán đường truyền, đo độ trễ và báo lỗi mạng (Ping, Traceroute).',
    mechanics: 'Bên gửi phát Echo Request (Type 8), bên nhận phản hồi Echo Reply (Type 0). Báo Time Exceeded (Type 11) khi TTL=0.',
  },
  {
    type: 'OSPF',
    name: 'OSPF (Open Shortest Path First v2)',
    layer: 'Tầng 3 (Network)',
    layerNum: 3,
    rfc: 'RFC 2328',
    summary: 'Giao thức định tuyến động Link-State chạy thuật toán Dijkstra tính toán đường đi tối ưu trong nội bộ AS.',
    mechanics: 'Thiết lập quan hệ láng giềng qua gói OSPF Hello (Multicast 224.0.0.5), đồng bộ bảng cơ sở dữ liệu LSDB bằng bão gói tin LSA.',
  },
  {
    type: 'RIP',
    name: 'RIPv2 (Routing Information Protocol)',
    layer: 'Tầng 3 (Network)',
    layerNum: 3,
    port: 'UDP 520',
    rfc: 'RFC 2453',
    summary: 'Giao thức định tuyến động Distance-Vector cổ điển dựa trên số chặng nhảy (Hop count, tối đa 15 hops).',
    mechanics: 'Định kỳ 30 giây phát toàn bộ bảng định tuyến tới địa chỉ Multicast 224.0.0.9.',
  },
  {
    type: 'BGP',
    name: 'BGP (Border Gateway Protocol v4)',
    layer: 'Tầng 3 (Network)',
    layerNum: 3,
    port: 'TCP 179',
    rfc: 'RFC 4271',
    summary: 'Giao thức định tuyến xương sống Internet (Path-Vector) liên kết giữa các hệ thống tự trị (Autonomous Systems).',
    mechanics: 'Duy trì kết nối TCP tin cậy port 179, trao đổi bản tin BGP UPDATE kèm danh sách Path Attributes (AS_PATH, NEXT_HOP, MED).',
  },

  // Tầng 4
  {
    type: 'TCP',
    name: 'TCP (Transmission Control Protocol)',
    layer: 'Tầng 4 (Transport)',
    layerNum: 4,
    rfc: 'RFC 793 / RFC 9293',
    summary: 'Giao thức truyền vận tin cậy hướng kết nối, đảm bảo toàn vẹn dữ liệu, kiểm soát luồng và chống nghẽn.',
    mechanics: 'Bắt tay 3 bước (SYN -> SYN/ACK -> ACK), đánh số thứ tự byte Sequence Number, báo nhận Acknowledgement Number.',
  },
  {
    type: 'UDP',
    name: 'UDP (User Datagram Protocol)',
    layer: 'Tầng 4 (Transport)',
    layerNum: 4,
    rfc: 'RFC 768',
    summary: 'Giao thức truyền vận phi kết nối, tốc độ cực nhanh, không bắt tay, phù hợp stream video, DNS và thoại VoIP.',
    mechanics: 'Chỉ gồm 8 bytes header (Source Port, Dest Port, Length, Checksum) không kiểm tra mất gói hay truyền lại.',
  },

  // Tầng 7
  {
    type: 'HTTP',
    name: 'HTTP (Hypertext Transfer Protocol)',
    layer: 'Tầng 7 (Application)',
    layerNum: 7,
    port: 'TCP 80',
    rfc: 'RFC 2616',
    summary: 'Giao thức truyền tải siêu văn bản web dạng plain text giữa trình duyệt và Web Server Nginx/Apache.',
    mechanics: 'Client gửi request method (GET, POST), Server phản hồi Status Code (200 OK, 404 Not Found) kèm HTML body.',
  },
  {
    type: 'HTTPS',
    name: 'HTTPS / TLS (HTTP over TLS v1.3)',
    layer: 'Tầng 7 (Application)',
    layerNum: 7,
    port: 'TCP 443',
    rfc: 'RFC 8446',
    summary: 'Giao thức web mã hóa bảo mật toàn bộ dữ liệu truyền tải chống nghe lén bằng chứng chỉ số SSL/TLS.',
    mechanics: 'Bắt tay mã hóa TLS (Client Hello -> Server Hello -> Key Exchange Diffie-Hellman -> Certificate -> Encrypted Traffic).',
  },
  {
    type: 'DNS',
    name: 'DNS (Domain Name System)',
    layer: 'Tầng 7 (Application)',
    layerNum: 7,
    port: 'UDP/TCP 53',
    rfc: 'RFC 1035',
    summary: 'Hệ thống phân giải tên miền con người dễ đọc (google.com) thành địa chỉ IP máy chủ (142.250.190.46).',
    mechanics: 'Client phát truy vấn UDP A record, Recursive DNS Resolver tìm kiếm và trả về bản ghi địa chỉ IPv4.',
  },
  {
    type: 'DHCP',
    name: 'DHCP (Dynamic Host Configuration Protocol)',
    layer: 'Tầng 7 (Application)',
    layerNum: 7,
    port: 'UDP 67/68',
    rfc: 'RFC 2131',
    summary: 'Tự động cấp phát địa chỉ IP, Subnet Mask, Default Gateway và DNS Server cho thiết bị gia nhập mạng.',
    mechanics: 'Quy trình 4 bước DORA: Discover (Broadcast) -> Offer (Unicast) -> Request (Broadcast) -> Acknowledge (Unicast).',
  },
  {
    type: 'SSH',
    name: 'SSH (Secure Shell)',
    layer: 'Tầng 7 (Application)',
    layerNum: 7,
    port: 'TCP 22',
    rfc: 'RFC 4253',
    summary: 'Giao thức điều khiển dòng lệnh từ xa được mã hóa mạnh mẽ thay thế hoàn toàn giao thức Telnet không an toàn.',
    mechanics: 'Xác thực qua khóa công khai (Public Key) hoặc mật khẩu, mã hóa toàn bộ phiên làm việc bằng AES-256.',
  },
  {
    type: 'TELNET',
    name: 'Telnet (Teletype Network Protocol)',
    layer: 'Tầng 7 (Application)',
    layerNum: 7,
    port: 'TCP 23',
    rfc: 'RFC 854',
    summary: 'Giao thức dòng lệnh từ xa cổ điển, truyền tải toàn bộ tài khoản và mật khẩu dạng văn bản thuần (Cleartext).',
    mechanics: 'Mở kết nối TCP thô port 23, hacker cắm Wireshark ở giữa có thể đọc được toàn bộ mật khẩu enable Cisco.',
  },
  {
    type: 'NTP',
    name: 'NTP (Network Time Protocol v4)',
    layer: 'Tầng 7 (Application)',
    layerNum: 7,
    port: 'UDP 123',
    rfc: 'RFC 5905',
    summary: 'Đồng bộ hóa đồng hồ thời gian thực giữa toàn bộ router, switch và server với độ chính xác mili-giây.',
    mechanics: 'Dựa trên cấu trúc phân tầng Stratum (Stratum 0 là đồng hồ nguyên tử/GPS, Stratum 1 là Master Time Server).',
  },
  {
    type: 'SNMP',
    name: 'SNMP (Simple Network Management Protocol)',
    layer: 'Tầng 7 (Application)',
    layerNum: 7,
    port: 'UDP 161/162',
    rfc: 'RFC 3411',
    summary: 'Giám sát và quản lý thông số phần cứng mạng (băng thông, nhiệt độ CPU, trạng thái cổng up/down).',
    mechanics: 'NMS gửi bản tin SNMP GetRequest tra cứu cây OID (MIB database), thiết bị phản hồi GetResponse hoặc gửi chủ động SNMP Trap.',
  },
  {
    type: 'SYSLOG',
    name: 'Syslog (System Logging Protocol)',
    layer: 'Tầng 7 (Application)',
    layerNum: 7,
    port: 'UDP 514',
    rfc: 'RFC 5424',
    summary: 'Gửi toàn bộ thông điệp nhật ký sự kiện của switch, router về máy chủ Syslog Server tập trung.',
    mechanics: 'Gói tin UDP định dạng RFC 5424 gồm độ ưu tiên (Facility & Severity từ 0 Emergency đến 7 Debugging).',
  },
  {
    type: 'FTP',
    name: 'FTP (File Transfer Protocol)',
    layer: 'Tầng 7 (Application)',
    layerNum: 7,
    port: 'TCP 20/21',
    rfc: 'RFC 959',
    summary: 'Giao thức truyền tải tệp tin client-server với 2 kênh riêng biệt (Kênh điều khiển port 21 và Kênh dữ liệu port 20).',
    mechanics: 'Trao đổi lệnh ASCII (USER, PASS, LIST, RETR, STOR) qua Control Connection và truyền nhị phân qua Data Connection.',
  },
];

export const ProtocolSimulatorModal: React.FC<ProtocolSimulatorModalProps> = ({
  isOpen,
  onClose,
  devices,
  links,
  onTransmitProtocol,
}) => {
  const [selectedProto, setSelectedProto] = useState<ProtocolType>('OSPF');
  const [sourceId, setSourceId] = useState<string>(devices[0]?.id || '');
  const [targetId, setTargetId] = useState<string>(devices[devices.length - 1]?.id || '');

  if (!isOpen) return null;

  const currentDef = ALL_PROTOCOLS.find((p) => p.type === selectedProto) || ALL_PROTOCOLS[0];
  const srcDev = devices.find((d) => d.id === sourceId) || devices[0];
  const dstDev = devices.find((d) => d.id === targetId) || devices[devices.length - 1];

  const handleTransmit = () => {
    if (!srcDev || !dstDev) {
      alert('Vui lòng chọn Thiết bị Nguồn và Thiết bị Đích!');
      return;
    }
    const result = PacketEngine.simulatePacketFlow(srcDev, dstDev, selectedProto, devices, links);
    if (result.packets.length > 0) {
      onTransmitProtocol(result.packets, selectedProto);
      onClose();
    } else {
      alert(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-blue-500/40 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-950/80 via-slate-900 to-slate-900 border-b border-blue-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/20 border border-blue-500/50 rounded-xl text-blue-400">
              <Globe className="w-6 h-6 animate-spin-slow text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Bộ Giả Lập Toàn Bộ Giao Thức Mạng (L2 — L7 Protocol Generator)
              </h2>
              <p className="text-xs text-slate-400">
                Phát và quan sát luồng truyền tải thời gian thực của hơn 20 giao thức mạng tiêu chuẩn quốc tế
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-12 divide-x divide-slate-800">
          {/* Left: Protocol Selector List */}
          <div className="col-span-5 p-4 overflow-y-auto space-y-2 bg-slate-950/40">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Danh Sách Giao Thức Mạng ({ALL_PROTOCOLS.length})
            </span>
            {ALL_PROTOCOLS.map((p) => {
              const isSelected = p.type === selectedProto;
              const color = PROTOCOL_COLORS[p.type] || '#3b82f6';
              return (
                <button
                  key={p.type}
                  onClick={() => setSelectedProto(p.type)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-950/50 border-blue-500/80 shadow-md shadow-blue-950/40'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-white block truncate">
                        {p.name}
                      </span>
                      <span className="text-[10px] text-slate-400">{p.layer}</span>
                    </div>
                  </div>
                  {p.port && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 shrink-0">
                      {p.port}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right: Protocol Inspector & Transmitter */}
          <div className="col-span-7 p-6 overflow-y-auto space-y-6">
            {/* Device Source / Destination Selector */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs font-semibold text-slate-300 block mb-3 flex items-center gap-2">
                <Network className="w-4 h-4 text-blue-400" /> Chọn Tuyến Truyền Dẫn Cho Gói Tin
              </span>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Thiết Bị Phát (Source)</label>
                  <select
                    value={sourceId}
                    onChange={(e) => setSourceId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-lg p-2.5 outline-none focus:border-blue-500"
                  >
                    {devices.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.hostname} ({d.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Thiết Bị Nhận (Destination)</label>
                  <select
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-lg p-2.5 outline-none focus:border-blue-500"
                  >
                    {devices.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.hostname} ({d.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
                <button
                  onClick={handleTransmit}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-950/60 flex items-center gap-2 transition-all transform active:scale-95"
                >
                  <Send className="w-4 h-4" /> PHÁT GÓI TIN LÊN CANVAS (TRANSMIT PDU)
                </button>
              </div>
            </div>

            {/* Protocol Deep Dive Details */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {currentDef.name}
                    <span
                      className="w-3 h-3 rounded-full inline-block"
                      style={{ backgroundColor: PROTOCOL_COLORS[currentDef.type] }}
                    />
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Phân lớp: <span className="text-cyan-300 font-semibold">{currentDef.layer}</span>
                    {currentDef.rfc && ` | Tiêu chuẩn: ${currentDef.rfc}`}
                  </p>
                </div>
                {currentDef.port && (
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-cyan-950/60 text-cyan-300 border border-cyan-800">
                    Cổng: {currentDef.port}
                  </span>
                )}
              </div>

              <div className="space-y-3 text-xs">
                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                  <span className="font-semibold text-amber-400 flex items-center gap-1.5 mb-1">
                    <Info className="w-3.5 h-3.5" /> Mục Đích & Chức Năng
                  </span>
                  <p className="text-slate-300 leading-relaxed">{currentDef.summary}</p>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                  <span className="font-semibold text-emerald-400 flex items-center gap-1.5 mb-1">
                    <Layers className="w-3.5 h-3.5" /> Cơ Chế Truyền Nhận & Đóng Gói (PDU Mechanics)
                  </span>
                  <p className="text-slate-300 leading-relaxed">{currentDef.mechanics}</p>
                </div>
              </div>

              <div className="p-3 bg-blue-950/30 border border-blue-800/40 rounded-lg text-xs text-blue-200 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  Sau khi bấm phát gói tin, cửa sổ <strong>Wireshark-lite OSI PDU Inspector</strong> ở chân trang sẽ tự động giải mã cấu trúc 7 tầng và hiển thị mã Hex/ASCII chi tiết của gói tin {currentDef.type}.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
