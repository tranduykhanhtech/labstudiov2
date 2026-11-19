import {
  NetworkDevice,
  NetworkLink,
  DevicePort,
  PacketPdu,
  ProtocolType,
  RouteEntry,
} from '@/types/network';

// ==========================================
// IP & SUBNET HELPER FUNCTIONS
// ==========================================

export function ipToNumber(ip: string): number {
  return (
    ip
      .split('.')
      .reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0
  );
}

export function numberToIp(num: number): string {
  return [
    (num >>> 24) & 255,
    (num >>> 16) & 255,
    (num >>> 8) & 255,
    num & 255,
  ].join('.');
}

export function isIpInSubnet(ip: string, network: string, netmask: string): boolean {
  try {
    const ipNum = ipToNumber(ip);
    const netNum = ipToNumber(network);
    const maskNum = ipToNumber(netmask);
    return (ipNum & maskNum) === (netNum & maskNum);
  } catch {
    return false;
  }
}

export function getNetworkAddress(ip: string, netmask: string): string {
  try {
    const ipNum = ipToNumber(ip);
    const maskNum = ipToNumber(netmask);
    return numberToIp((ipNum & maskNum) >>> 0);
  } catch {
    return ip;
  }
}

export function cidrToNetmask(cidr: number): string {
  const mask = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
  return numberToIp(mask);
}

export function netmaskToCidr(netmask: string): number {
  try {
    const n = ipToNumber(netmask);
    let count = 0;
    for (let i = 0; i < 32; i++) {
      if ((n & (1 << (31 - i))) !== 0) count++;
      else break;
    }
    return count;
  } catch {
    return 24;
  }
}

// Generate Realistic Wireshark Hex & ASCII dump
export function generatePacketHexDump(
  proto: ProtocolType,
  srcMac: string,
  dstMac: string,
  srcIp?: string,
  dstIp?: string,
  payload?: string
): string {
  const cleanSrcMac = srcMac.replace(/[^0-9a-fA-F]/g, '').padEnd(12, '0');
  const cleanDstMac = dstMac.replace(/[^0-9a-fA-F]/g, '').padEnd(12, 'f');
  const etherType = proto === 'ARP' ? '0806' : '0800';

  let hexStr = `${cleanDstMac}${cleanSrcMac}${etherType}`;

  if (proto !== 'ARP' && srcIp && dstIp) {
    const srcHex = srcIp
      .split('.')
      .map((n) => parseInt(n).toString(16).padStart(2, '0'))
      .join('');
    const dstHex = dstIp
      .split('.')
      .map((n) => parseInt(n).toString(16).padStart(2, '0'))
      .join('');
    // IPv4 header (20 bytes: 45 00 00 3c 1a 2b 40 00 40 01/06/11 ... src dst)
    const protoNum = proto === 'ICMP' ? '01' : proto === 'TCP' || proto === 'HTTP' ? '06' : '11';
    hexStr += `4500003c1a2b400040${protoNum}3fa5${srcHex}${dstHex}`;
  }

  // Payload bytes
  if (payload) {
    for (let i = 0; i < payload.length; i++) {
      hexStr += payload.charCodeAt(i).toString(16).padStart(2, '0');
    }
  } else {
    hexStr += '08004d5a000100016162636465666768696a6b6c6d6e6f70717273747576776162636465';
  }

  // Format into 16-byte lines with offset and ASCII column
  const lines: string[] = [];
  for (let i = 0; i < hexStr.length; i += 32) {
    const offset = (i / 2).toString(16).padStart(4, '0');
    const chunk = hexStr.slice(i, i + 32);
    const bytes: string[] = [];
    let ascii = '';
    for (let j = 0; j < chunk.length; j += 2) {
      const byteHex = chunk.slice(j, j + 2);
      bytes.push(byteHex);
      const code = parseInt(byteHex, 16);
      ascii += code >= 32 && code <= 126 ? String.fromCharCode(code) : '.';
    }
    const byteCol = bytes.join(' ').padEnd(48, ' ');
    lines.push(`${offset}  ${byteCol}  |${ascii}|`);
  }

  return lines.join('\n');
}

let packetGlobalCounter = 0;
function createUniquePacketId(type: string, step: number): string {
  packetGlobalCounter += 1;
  return `${type}-${packetGlobalCounter}-${Date.now()}-${step}-${Math.random().toString(36).substring(2, 6)}`;
}

// Color schemes per protocol (Packet Tracer & Wireshark style)
export const PROTOCOL_COLORS: Record<ProtocolType, string> = {
  ARP: '#f97316',    // Orange
  ICMP: '#ec4899',   // Pink / Magenta
  DNS: '#eab308',    // Amber / Yellow
  DHCP: '#a855f7',   // Purple
  TCP: '#10b981',    // Emerald Green
  UDP: '#06b6d4',    // Cyan
  HTTP: '#3b82f6',   // Blue
  HTTPS: '#2563eb',  // Royal Blue
  STP: '#f59e0b',    // Gold
  OSPF: '#8b5cf6',   // Violet
  RIP: '#d97706',    // Amber Brown
  BGP: '#059669',    // Teal
  CDP: '#0284c7',    // Sky Blue
  LLDP: '#0ea5e9',   // Light Sky
  SSH: '#14b8a6',    // Teal Green
  TELNET: '#64748b', // Slate
  NTP: '#6366f1',    // Indigo
  SNMP: '#84cc16',   // Lime
  SYSLOG: '#f43f5e', // Rose
  FTP: '#e11d48',    // Ruby Red
  ATTACK: '#ef4444', // Red Hazard
};

// ==========================================
// MULTI-LAYER SIMULATION ENGINE
// ==========================================

export class PacketEngine {
  // Calculate Spanning Tree (STP) states for L2/L3 switches to prevent L2 loops
  public static calculateStp(devices: NetworkDevice[], links: NetworkLink[]) {
    const switches = devices.filter((d) => d.type === 'l2-switch' || d.type === 'l3-switch');
    if (switches.length === 0) return;

    // Lowest MAC/hostname becomes root
    switches.sort((a, b) => a.hostname.localeCompare(b.hostname));
    const rootSwitch = switches[0];
    rootSwitch.isStpRoot = true;

    // Reset switch port STP states to forwarding
    for (const sw of switches) {
      for (const p of sw.ports) {
        p.stpStatus = 'up';
      }
    }

    // Detect loops in graph of switches using simple cycle detection
    // If redundant switch-to-switch links exist, set alternate port to 'blocking'
    const switchLinks = links.filter((l) => {
      const devA = devices.find((d) => d.id === l.fromDeviceId);
      const devB = devices.find((d) => d.id === l.toDeviceId);
      return (
        (devA?.type === 'l2-switch' || devA?.type === 'l3-switch') &&
        (devB?.type === 'l2-switch' || devB?.type === 'l3-switch')
      );
    });

    if (switchLinks.length >= switches.length) {
      // There's a redundant link/loop: block the link on the non-root switch with the highest ID
      const nonRootLinks = switchLinks.filter(
        (l) => l.fromDeviceId !== rootSwitch.id && l.toDeviceId !== rootSwitch.id
      );
      const linkToBlock = nonRootLinks[0] || switchLinks[switchLinks.length - 1];
      if (linkToBlock) {
        const dev = devices.find((d) => d.id === linkToBlock.toDeviceId);
        const port = dev?.ports.find((p) => p.id === linkToBlock.toPortId);
        if (port) {
          port.stpStatus = 'blocking';
        }
      }
    }
  }

  // Resolve next hop interface using Longest Prefix Match (LPM)
  public static resolveRoute(device: NetworkDevice, targetIp: string): RouteEntry | null {
    // 1. Direct connected check on device's own interfaces
    for (const port of device.ports) {
      if (port.ipAddress && port.subnetMask && port.status === 'up') {
        if (isIpInSubnet(targetIp, port.ipAddress, port.subnetMask)) {
          return {
            id: `direct-${port.id}`,
            destination: getNetworkAddress(port.ipAddress, port.subnetMask),
            netmask: port.subnetMask,
            nextHop: 'Direct',
            interfaceName: port.name,
            type: 'C',
          };
        }
      }
    }

    // 2. Custom Routing Table entries sorted by longest prefix (most specific mask first)
    if (device.routes && device.routes.length > 0) {
      const sorted = [...device.routes].sort((a, b) => {
        return netmaskToCidr(b.netmask) - netmaskToCidr(a.netmask);
      });

      for (const r of sorted) {
        if (isIpInSubnet(targetIp, r.destination, r.netmask)) {
          return r;
        }
      }
    }

    // 3. Default Gateway fallback
    if (device.defaultGateway) {
      const outPort = device.ports.find((p) => p.status === 'up' && p.ipAddress);
      return {
        id: 'default-gw',
        destination: '0.0.0.0',
        netmask: '0.0.0.0',
        nextHop: device.defaultGateway,
        interfaceName: outPort ? outPort.name : device.ports[0]?.name || 'Fa0/1',
        type: 'S',
      };
    }

    return null;
  }

  // Simulate end-to-end Simple PDU (ICMP Ping / HTTP / DNS / DHCP) and return generated Packet PDUs
  public static simulatePacketFlow(
    srcDevice: NetworkDevice,
    dstDevice: NetworkDevice,
    protocol: ProtocolType,
    allDevices: NetworkDevice[],
    allLinks: NetworkLink[],
    extraData?: { domain?: string; url?: string }
  ): { packets: PacketPdu[]; success: boolean; message: string } {
    const packets: PacketPdu[] = [];
    const now = Date.now();

    // Source IP & MAC
    const srcPort =
      srcDevice.ports.find((p) => p.status === 'up' && (p.ipAddress || srcDevice.type === 'hub')) ||
      srcDevice.ports[0];
    const srcIp = srcPort?.ipAddress || '0.0.0.0';
    const srcMac = srcPort?.macAddress || '00:11:22:33:44:01';

    // Target IP & MAC
    const dstPort =
      dstDevice.ports.find((p) => p.status === 'up' && p.ipAddress) || dstDevice.ports[0];
    const dstIp = dstPort?.ipAddress || '255.255.255.255';
    const dstMac = dstPort?.macAddress || 'ff:ff:ff:ff:ff:ff';

    // Find path using BFS across links
    const path = this.findPath(srcDevice.id, dstDevice.id, allDevices, allLinks);

    if (path.length === 0) {
      return {
        packets: [],
        success: false,
        message: `Không tìm thấy đường truyền vật lý giữa ${srcDevice.hostname} và ${dstDevice.hostname}. Vui lòng cắm cáp kết nối!`,
      };
    }

    // 1. ARP Resolution (if ARP table doesn't have destination MAC yet)
    const hasArp = srcDevice.arpTable?.some((a) => a.ipAddress === dstIp);
    if (!hasArp && protocol !== 'DHCP' && protocol !== 'STP' && srcIp !== '0.0.0.0') {
      // Forward ARP Request
      for (let i = 0; i < path.length - 1; i++) {
        const stepCurrent = path[i];
        const stepNext = path[i + 1];
        const link = stepCurrent.link;

        packets.push({
          id: createUniquePacketId('arp-req', i),
          timestamp: now + i * 400,
          currentDeviceId: stepCurrent.device.id,
          targetDeviceId: stepNext.device.id,
          fromPort: stepCurrent.outPort.name,
          toPort: stepNext.inPort.name,
          linkId: link.id,
          protocol: 'ARP',
          color: PROTOCOL_COLORS.ARP,
          summary: `ARP Request: Who has ${dstIp}? Tell ${srcIp} (Broadcast)`,
          layer1: {
            inPort: stepCurrent.outPort.name,
            outPort: stepNext.inPort.name,
            media: 'Copper 100BASE-TX',
            bandwidth: '100 Mbps',
          },
          layer2: {
            sourceMac: srcMac,
            destMac: 'ff:ff:ff:ff:ff:ff',
            etherType: '0x0806 (ARP)',
          },
          layer3: {
            version: 4,
            ttl: 64,
            protocol: 0,
            sourceIp: srcIp,
            destIp: dstIp,
            flags: '0x00',
          },
          layer7: {
            application: 'Address Resolution Protocol',
            details: {
              hardwareType: 'Ethernet (1)',
              protocolType: 'IPv4 (0x0800)',
              opcode: 'Request (1)',
              senderMac: srcMac,
              senderIp: srcIp,
              targetMac: '00:00:00:00:00:00',
              targetIp: dstIp,
            },
          },
          rawHex: generatePacketHexDump('ARP', srcMac, 'ffffffffffff'),
          progress: 0,
          completed: false,
        });
      }

      // Backward ARP Reply
      for (let i = path.length - 1; i > 0; i--) {
        const stepCurrent = path[i];
        const stepNext = path[i - 1];
        const link = stepNext.link;

        packets.push({
          id: createUniquePacketId('arp-reply', i),
          timestamp: now + (path.length + (path.length - i)) * 400,
          currentDeviceId: stepCurrent.device.id,
          targetDeviceId: stepNext.device.id,
          fromPort: stepCurrent.inPort.name,
          toPort: stepNext.outPort.name,
          linkId: link.id,
          protocol: 'ARP',
          color: PROTOCOL_COLORS.ARP,
          summary: `ARP Reply: ${dstIp} is at ${dstMac}`,
          layer1: {
            inPort: stepCurrent.inPort.name,
            outPort: stepNext.outPort.name,
            media: 'Copper 100BASE-TX',
            bandwidth: '100 Mbps',
          },
          layer2: {
            sourceMac: dstMac,
            destMac: srcMac,
            etherType: '0x0806 (ARP)',
          },
          layer7: {
            application: 'Address Resolution Protocol',
            details: {
              opcode: 'Reply (2)',
              senderMac: dstMac,
              senderIp: dstIp,
              targetMac: srcMac,
              targetIp: srcIp,
            },
          },
          rawHex: generatePacketHexDump('ARP', dstMac, srcMac),
          progress: 0,
          completed: false,
        });
      }

      // Update ARP table on srcDevice
      if (!srcDevice.arpTable) srcDevice.arpTable = [];
      srcDevice.arpTable.push({
        ipAddress: dstIp,
        macAddress: dstMac,
        interfaceName: srcPort.name,
        type: 'dynamic',
        ageSeconds: 0,
      });
    }

    // 2. Primary Protocol Flow (ICMP Ping / HTTP / DNS)
    const baseTime = now + (hasArp ? 0 : path.length * 800);

    // Forward path
    for (let i = 0; i < path.length - 1; i++) {
      const stepCurrent = path[i];
      const stepNext = path[i + 1];
      const link = stepCurrent.link;

      // Firewall ACL inspection check
      if (stepCurrent.device.type === 'firewall' && stepCurrent.device.aclRules) {
        const blocked = stepCurrent.device.aclRules.some(
          (r) => r.action === 'deny' && (r.protocol === 'ip' || r.protocol.toUpperCase() === protocol)
        );
        if (blocked) {
          return {
            packets,
            success: false,
            message: `Gói tin bị chặn bởi Tường lửa (Firewall ACL Rule: Deny) trên ${stepCurrent.device.hostname}!`,
          };
        }
      }

      let summary = '';
      let destPort = 0;
      let protoNum = 6;

      switch (protocol) {
        case 'ICMP':
          summary = `ICMP Echo Request (Ping) src=${srcIp} dst=${dstIp} id=0x0001 seq=1`;
          protoNum = 1;
          break;
        case 'HTTP':
          summary = `HTTP GET / HTTP/1.1 Host: ${dstIp}`;
          destPort = 80;
          protoNum = 6;
          break;
        case 'HTTPS':
          summary = `TLSv1.3 Client Hello (SNI: secure.lab.cisco, Cipher: TLS_AES_256_GCM_SHA384)`;
          destPort = 443;
          protoNum = 6;
          break;
        case 'DNS':
          summary = `DNS Standard query 0x1234 A ${extraData?.domain || 'web.cisco.local'}`;
          destPort = 53;
          protoNum = 17;
          break;
        case 'DHCP':
          summary = `DHCP Discover (Broadcast Transaction 0x7a3f)`;
          destPort = 67;
          protoNum = 17;
          break;
        case 'TCP':
          summary = `TCP 49152 → 80 [SYN] Seq=0 Win=64240 Len=0 MSS=1460 WS=256`;
          destPort = 80;
          protoNum = 6;
          break;
        case 'UDP':
          summary = `UDP Source port: 51234 Destination port: 9000 Length: 48`;
          destPort = 9000;
          protoNum = 17;
          break;
        case 'STP':
          summary = `STP Config BPDU: Root ID=32768/${srcMac} Cost=0 Port=0x8001`;
          protoNum = 0;
          break;
        case 'OSPF':
          summary = `OSPFv2 Hello Packet: Area 0.0.0.0, Router ID ${srcIp}, Hello=10s Dead=40s`;
          protoNum = 89;
          break;
        case 'RIP':
          summary = `RIPv2 Request: Command 1 (Request all routing table entries)`;
          destPort = 520;
          protoNum = 17;
          break;
        case 'BGP':
          summary = `BGP OPEN Message: Version 4, AS 65001, Hold Time 180s, ID ${srcIp}`;
          destPort = 179;
          protoNum = 6;
          break;
        case 'CDP':
          summary = `CDP Device-ID: ${stepCurrent.device.hostname}, Capabilities: Router, Switch`;
          protoNum = 0;
          break;
        case 'LLDP':
          summary = `LLDP Chassis ID: ${srcMac}, Port: ${stepCurrent.outPort.name}, TTL: 120s`;
          protoNum = 0;
          break;
        case 'SSH':
          summary = `SSH-2.0-OpenSSH_8.9p1 Key Exchange Init (Client to Server)`;
          destPort = 22;
          protoNum = 6;
          break;
        case 'TELNET':
          summary = `Telnet: DO ECHO, WILL SUPPRESS GO AHEAD, DO TERMINAL TYPE`;
          destPort = 23;
          protoNum = 6;
          break;
        case 'NTP':
          summary = `NTP v4 Client Request: Stratum 0, Precision -20, Transmit Timestamp`;
          destPort = 123;
          protoNum = 17;
          break;
        case 'SNMP':
          summary = `SNMPv2c GetRequest: 1.3.6.1.2.1.1.1.0 (sysDescr.0), Community: public`;
          destPort = 161;
          protoNum = 17;
          break;
        case 'SYSLOG':
          summary = `Syslog RFC 5424: <134>1 ${stepCurrent.device.hostname} %LINK-3-UPDOWN: Gi0/1 is up`;
          destPort = 514;
          protoNum = 17;
          break;
        case 'FTP':
          summary = `FTP Request: USER anonymous (Command channel port 21)`;
          destPort = 21;
          protoNum = 6;
          break;
        case 'ATTACK':
          summary = `[EXPLOIT PAYLOAD] Malicious probe transmitted to target ${dstIp}`;
          destPort = 80;
          protoNum = 6;
          break;
        default:
          summary = `${protocol} Transmission from ${srcIp} to ${dstIp}`;
          break;
      }

      packets.push({
        id: createUniquePacketId('pdu-fwd', i),
        timestamp: baseTime + i * 350,
        currentDeviceId: stepCurrent.device.id,
        targetDeviceId: stepNext.device.id,
        fromPort: stepCurrent.outPort.name,
        toPort: stepNext.inPort.name,
        linkId: link.id,
        protocol: protocol,
        color: PROTOCOL_COLORS[protocol] || '#3b82f6',
        summary,
        layer1: {
          inPort: stepCurrent.outPort.name,
          outPort: stepNext.inPort.name,
          media: 'Copper 100BASE-TX',
          bandwidth: '100 Mbps',
        },
        layer2: {
          sourceMac: srcMac,
          destMac: dstMac,
          etherType: protocol === 'STP' || protocol === 'CDP' || protocol === 'LLDP' ? '0x88CC' : '0x0800 (IPv4)',
        },
        layer3: {
          version: 4,
          ttl: 64 - i,
          protocol: protoNum,
          sourceIp: srcIp,
          destIp: dstIp,
          flags: "0x40 (Don't Fragment)",
        },
        layer4: {
          sourcePort: 49152 + (i % 100),
          destPort: destPort,
          protocolName: protocol,
          flags: protocol === 'TCP' ? { syn: true } : undefined,
        },
        layer7: {
          application: protocol,
          details: {
            requestType: `${protocol} Standard Frame`,
            info: summary,
          },
          payloadString: extraData?.url || summary,
        },
        rawHex: generatePacketHexDump(protocol, srcMac, dstMac, srcIp, dstIp, summary),
        progress: 0,
        completed: false,
      });
    }

    // Return path (Reply / Response)
    const returnBaseTime = baseTime + path.length * 350;
    for (let i = path.length - 1; i > 0; i--) {
      const stepCurrent = path[i];
      const stepNext = path[i - 1];
      const link = stepNext.link;

      let replySummary = '';
      let replyProtoNum = 6;

      switch (protocol) {
        case 'ICMP':
          replySummary = `ICMP Echo Reply (Pong) src=${dstIp} dst=${srcIp} ttl=64 time=1ms`;
          replyProtoNum = 1;
          break;
        case 'HTTP':
          replySummary = `HTTP/1.1 200 OK (text/html; charset=UTF-8, 452 bytes)`;
          replyProtoNum = 6;
          break;
        case 'HTTPS':
          replySummary = `TLSv1.3 Server Hello, Change Cipher Spec, Encrypted Extensions`;
          replyProtoNum = 6;
          break;
        case 'DNS':
          replySummary = `DNS Standard query response 0x1234 A ${dstIp}`;
          replyProtoNum = 17;
          break;
        case 'DHCP':
          replySummary = `DHCP Offer / Ack: Your IP is 192.168.1.105`;
          replyProtoNum = 17;
          break;
        case 'TCP':
          replySummary = `TCP 80 → 49152 [SYN, ACK] Seq=0 Ack=1 Win=65160 Len=0`;
          replyProtoNum = 6;
          break;
        case 'UDP':
          replySummary = `UDP Echo Reply: Length 48 bytes`;
          replyProtoNum = 17;
          break;
        case 'STP':
          replySummary = `STP Topology Change Notification (TCN) Acknowledge`;
          replyProtoNum = 0;
          break;
        case 'OSPF':
          replySummary = `OSPFv2 LS Update: Type 1 Router-LSA Flooding (2 links advertised)`;
          replyProtoNum = 89;
          break;
        case 'RIP':
          replySummary = `RIPv2 Response: Route 192.168.1.0/24 Metric 1, NextHop ${dstIp}`;
          replyProtoNum = 17;
          break;
        case 'BGP':
          replySummary = `BGP UPDATE Message: AS_PATH: 65002, NEXT_HOP: ${dstIp}, NLRI: 10.0.0.0/8`;
          replyProtoNum = 6;
          break;
        case 'CDP':
          replySummary = `CDP Neighbor Response: ${stepCurrent.device.hostname} acknowledged`;
          replyProtoNum = 0;
          break;
        case 'LLDP':
          replySummary = `LLDP Acknowledged: Link Layer Discovery complete`;
          replyProtoNum = 0;
          break;
        case 'SSH':
          replySummary = `SSH-2.0 Diffie-Hellman Key Exchange Reply (Server Signature Verified)`;
          replyProtoNum = 6;
          break;
        case 'TELNET':
          replySummary = `Telnet: WILL ECHO, DO SUPPRESS GO AHEAD, WILL TERMINAL TYPE`;
          replyProtoNum = 6;
          break;
        case 'NTP':
          replySummary = `NTP v4 Server Response: Stratum 2, Clock synchronized within 0.12ms`;
          replyProtoNum = 17;
          break;
        case 'SNMP':
          replySummary = `SNMPv2c GetResponse: Cisco IOS Software C3650-UNIVERSALK9-M, Version 16.6.4`;
          replyProtoNum = 17;
          break;
        case 'SYSLOG':
          replySummary = `Syslog RFC 5424 Ack: Event saved to central audit logs`;
          replyProtoNum = 17;
          break;
        case 'FTP':
          replySummary = `FTP Response: 331 User name okay, please specify password`;
          replyProtoNum = 6;
          break;
        case 'ATTACK':
          replySummary = `[ATTACK IMPACT] Resource drained on target ${dstIp}`;
          replyProtoNum = 6;
          break;
        default:
          replySummary = `${protocol} Response from ${dstIp} to ${srcIp}`;
          break;
      }

      packets.push({
        id: createUniquePacketId('pdu-rev', i),
        timestamp: returnBaseTime + (path.length - i) * 350,
        currentDeviceId: stepCurrent.device.id,
        targetDeviceId: stepNext.device.id,
        fromPort: stepCurrent.inPort.name,
        toPort: stepNext.outPort.name,
        linkId: link.id,
        protocol: protocol,
        color: PROTOCOL_COLORS[protocol] || '#3b82f6',
        summary: replySummary,
        layer1: {
          inPort: stepCurrent.inPort.name,
          outPort: stepNext.outPort.name,
          media: 'Copper 100BASE-TX',
          bandwidth: '100 Mbps',
        },
        layer2: {
          sourceMac: dstMac,
          destMac: srcMac,
          etherType: protocol === 'STP' || protocol === 'CDP' || protocol === 'LLDP' ? '0x88CC' : '0x0800 (IPv4)',
        },
        layer3: {
          version: 4,
          ttl: 64,
          protocol: replyProtoNum,
          sourceIp: dstIp,
          destIp: srcIp,
          flags: '0x00',
        },
        layer4: {
          sourcePort: protocol === 'HTTP' ? 80 : 49152,
          destPort: 49152,
          protocolName: protocol,
          flags: protocol === 'TCP' ? { syn: true, ack: true } : undefined,
        },
        layer7: {
          application: protocol,
          details: {
            status: '200 OK / Response Acknowledged',
            response: replySummary,
          },
          payloadString: replySummary,
        },
        rawHex: generatePacketHexDump(protocol, dstMac, srcMac, dstIp, srcIp, replySummary),
        progress: 0,
        completed: false,
      });
    }

    return {
      packets,
      success: true,
      message: `Ping thành công! Gói tin đã truyền tải hai chiều hoàn hảo giữa ${srcDevice.hostname} và ${dstDevice.hostname}.`,
    };
  }

  // BFS path finder across topology links
  private static findPath(
    startId: string,
    endId: string,
    devices: NetworkDevice[],
    links: NetworkLink[]
  ): Array<{ device: NetworkDevice; outPort: DevicePort; inPort: DevicePort; link: NetworkLink }> {
    const queue: Array<{
      currentId: string;
      steps: Array<{ device: NetworkDevice; outPort: DevicePort; inPort: DevicePort; link: NetworkLink }>;
    }> = [{ currentId: startId, steps: [] }];

    const visited = new Set<string>([startId]);

    while (queue.length > 0) {
      const { currentId, steps } = queue.shift()!;
      const currentDev = devices.find((d) => d.id === currentId);
      if (!currentDev) continue;

      if (currentId === endId) {
        return steps;
      }

      // Find active links connected to current device
      const connectedLinks = links.filter((l) => {
        if (l.status === 'down') return false;
        return l.fromDeviceId === currentId || l.toDeviceId === currentId;
      });

      for (const link of connectedLinks) {
        const isFrom = link.fromDeviceId === currentId;
        const nextId = isFrom ? link.toDeviceId : link.fromDeviceId;
        const outPortId = isFrom ? link.fromPortId : link.toPortId;
        const inPortId = isFrom ? link.toPortId : link.fromPortId;

        const nextDev = devices.find((d) => d.id === nextId);
        if (!nextDev) continue;

        const outPort = currentDev.ports.find((p) => p.id === outPortId);
        const inPort = nextDev.ports.find((p) => p.id === inPortId);

        // STP blocked port check
        if (outPort?.stpStatus === 'blocking' || inPort?.stpStatus === 'blocking') {
          continue;
        }

        if (!visited.has(nextId)) {
          visited.add(nextId);
          queue.push({
            currentId: nextId,
            steps: [
              ...steps,
              {
                device: currentDev,
                outPort: outPort || currentDev.ports[0],
                inPort: inPort || nextDev.ports[0],
                link,
              },
              ...(nextId === endId
                ? [
                    {
                      device: nextDev,
                      outPort: inPort || nextDev.ports[0],
                      inPort: inPort || nextDev.ports[0],
                      link,
                    },
                  ]
                : []),
            ],
          });
        }
      }
    }

    return [];
  }
}
