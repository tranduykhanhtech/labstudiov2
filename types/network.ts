export type DeviceType =
  | 'cisco-router'      // 1. Cisco Router L3 (ISR 4331)
  | 'l3-switch'          // 2. Multilayer Switch L3 (Catalyst 3650)
  | 'l2-switch'          // 3. Managed Switch L2 (Catalyst 2960)
  | 'wireless-ap'        // 4. Wireless Access Point / Wi-Fi Router
  | 'firewall'           // 5. Next-Gen Firewall / Cisco ASA
  | 'linux-server'       // 6. Ubuntu Linux Server (Web/Nginx)
  | 'dns-server'         // 7. DNS Server
  | 'dhcp-server'        // 8. DHCP Server
  | 'syslog-server'      // 9. Syslog & NTP Server
  | 'pc'                 // 10. Client Desktop PC
  | 'laptop'             // 11. Laptop (Ethernet + Wi-Fi)
  | 'smartphone'         // 12. Smartphone / Mobile Tablet
  | 'iot-gateway'        // 13. Industrial IoT Gateway & Sensor
  | 'hub';               // 14. Unmanaged Hub (Repeater L1)

export type PortType = 'ethernet' | 'gigabit' | 'serial' | 'console' | 'wireless';

export type PortStatus = 'up' | 'down' | 'blocking' | 'listening' | 'learning';

export interface DevicePort {
  id: string;
  name: string;
  type: PortType;
  ipAddress?: string;
  subnetMask?: string;
  macAddress: string;
  status: 'up' | 'down';
  stpStatus?: PortStatus;
  vlanId?: number;
  mode?: 'access' | 'trunk';
  allowedVlans?: number[];
  connectedLinkId?: string;
  isConsole?: boolean;
}

export type CableType =
  | 'straight'     // Cáp thẳng T568B - T568B
  | 'crossover'    // Cáp chéo T568A - T568B
  | 'fiber'        // Cáp quang
  | 'serial'       // Cáp Serial DCE/DTE
  | 'console';     // Cáp Console Rollover RJ45-to-DB9/USB

export interface NetworkLink {
  id: string;
  cableType: CableType;
  fromDeviceId: string;
  fromPortId: string;
  toDeviceId: string;
  toPortId: string;
  status: 'up' | 'down' | 'error';
  lengthMeters?: number;
}

export interface VlanConfig {
  id: number;
  name: string;
}

export interface RouteEntry {
  id: string;
  destination: string; // e.g. "192.168.2.0"
  netmask: string;     // e.g. "255.255.255.0"
  nextHop: string;     // e.g. "192.168.1.254" or "Direct"
  interfaceName: string;
  metric?: number;
  type: 'C' | 'S' | 'R' | 'O'; // Connected, Static, RIP, OSPF
}

export interface MacTableEntry {
  vlan: number;
  macAddress: string;
  type: 'DYNAMIC' | 'STATIC';
  port: string;
  ageSeconds: number;
}

export interface ArpTableEntry {
  ipAddress: string;
  macAddress: string;
  interfaceName: string;
  type: 'dynamic' | 'static';
  ageSeconds: number;
}

export interface DnsRecord {
  id: string;
  domain: string;
  type: 'A' | 'CNAME' | 'MX';
  value: string;
  ttl: number;
}

export interface DhcpPool {
  id: string;
  name: string;
  network: string;
  netmask: string;
  defaultGateway: string;
  dnsServer: string;
  startIp: string;
  endIp: string;
  leaseTimeHours: number;
  excludedIps: string[];
}

export interface DhcpLease {
  macAddress: string;
  ipAddress: string;
  hostname: string;
  expiresAt: string;
}

export interface NatEntry {
  id: string;
  insideLocal: string;
  insideGlobal: string;
  outsideLocal?: string;
  outsideGlobal?: string;
  protocol: 'TCP' | 'UDP' | 'ICMP' | 'ALL';
}

export interface AclRule {
  id: string;
  action: 'permit' | 'deny';
  protocol: 'ip' | 'tcp' | 'udp' | 'icmp';
  source: string;      // "any" or CIDR e.g. "192.168.1.0/24"
  destination: string; // "any" or CIDR
  destPort?: number;
}

export interface SyslogMessage {
  id: string;
  timestamp: string;
  facility: string;
  severity: 'EMERGENCY' | 'ALERT' | 'CRITICAL' | 'ERROR' | 'WARNING' | 'NOTICE' | 'INFO' | 'DEBUG';
  sourceDevice: string;
  message: string;
}

export interface BgpNeighbor {
  ipAddress: string;
  remoteAs: number;
  state: 'Idle' | 'Connect' | 'Active' | 'OpenSent' | 'OpenConfirm' | 'Established';
  routesReceived: number;
  upTime: string;
}

export interface BgpConfig {
  asNumber: number;
  routerId: string;
  neighbors: BgpNeighbor[];
  networks: { prefix: string; netmask: string }[];
}

export interface NetworkDevice {
  id: string;
  type: DeviceType;
  name: string;
  x: number;
  y: number;
  hostname: string;
  ports: DevicePort[];
  // Routing & L3 properties
  defaultGateway?: string;
  dnsServer?: string;
  routes?: RouteEntry[];
  arpTable?: ArpTableEntry[];
  natEntries?: NatEntry[];
  bgpConfig?: BgpConfig;
  // Switching & L2 properties
  vlans?: VlanConfig[];
  macTable?: MacTableEntry[];
  isStpRoot?: boolean;
  // Specific servers
  dhcpPools?: DhcpPool[];
  dhcpLeases?: DhcpLease[];
  dnsRecords?: DnsRecord[];
  webRootHtml?: string;
  syslogLogs?: SyslogMessage[];
  aclRules?: AclRule[];
  // Wi-Fi properties
  wifiSsid?: string;
  wifiPassword?: string;
  wifiChannel?: number;
  connectedSsid?: string;
  isWifiConnected?: boolean;
  // Security & Health state
  cpuUtilization?: number; // 0..100%
  ramUtilization?: number; // 0..100%
  securityStatus?: 'normal' | 'under-attack' | 'compromised' | 'offline';
  securityDefenseActive?: boolean; // Port-Security, DAI, DHCP Snooping, BPDU Guard, SYN Cookies, ACL
  isCamOverflowed?: boolean;
  isArpPoisoned?: boolean;
  attackLogs?: string[];
  // CLI State
  cliHistory: string[];
  cliMode: string; // e.g. "EXEC", "PRIVILEGED", "CONFIG", "CONFIG_IF" etc.
  cliCurrentInterface?: string;
  runningConfigText?: string;
  // IoT Sensor
  sensorData?: {
    temperature: number;
    humidity: number;
    motionDetected: boolean;
    lastPing: string;
  };
}

// ==========================================
// PACKET & PDU STRUCTURE (Wireshark & Engine)
// ==========================================

export type ProtocolType =
  | 'ARP'
  | 'ICMP'
  | 'DNS'
  | 'DHCP'
  | 'TCP'
  | 'UDP'
  | 'HTTP'
  | 'HTTPS'
  | 'STP'
  | 'OSPF'
  | 'RIP'
  | 'BGP'
  | 'CDP'
  | 'LLDP'
  | 'SSH'
  | 'TELNET'
  | 'NTP'
  | 'SNMP'
  | 'SYSLOG'
  | 'FTP'
  | 'ATTACK';

export type AttackCategory = 'popular' | 'advanced';

export type AttackType =
  // Popular
  | 'syn-flood'
  | 'arp-spoofing'
  | 'dhcp-starvation'
  | 'dns-cache-poisoning'
  | 'ping-of-death'
  | 'slowloris'
  | 'port-scan'
  | 'ssh-bruteforce'
  | 'sql-injection'
  // Advanced / Obscure
  | 'cam-table-overflow'
  | 'vlan-hopping'
  | 'stp-root-takeover'
  | 'smurf-attack'
  | 'land-attack'
  | 'teardrop-attack'
  | 'ospf-route-injection'
  | 'bgp-route-hijacking';

export interface CyberAttackDefinition {
  id: AttackType;
  name: string;
  category: AttackCategory;
  layer: 'L2' | 'L3' | 'L4' | 'L7';
  protocol: ProtocolType;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  shortDesc: string;
  mechanism: string;
  impact: string;
  mitigation: string;
  defenseTechnology: string;
  ciscoCommand?: string;
  linuxCommand?: string;
}

export interface AttackResult {
  attackId: AttackType;
  attackerId: string;
  targetId: string;
  success: boolean;
  blockedByDefense: boolean;
  defenseTriggered?: string;
  message: string;
  cpuDelta: number;
  ramDelta: number;
  statusChange: 'normal' | 'under-attack' | 'compromised' | 'offline';
  generatedPackets: PacketPdu[];
}

export interface PacketPdu {
  id: string;
  timestamp: number; // millisecond timestamp
  currentDeviceId: string;
  targetDeviceId: string;
  fromPort: string;
  toPort: string;
  linkId: string;
  protocol: ProtocolType;
  color: string;
  summary: string;
  // Layer 1
  layer1: {
    inPort: string;
    outPort: string;
    media: string;
    bandwidth: string;
  };
  // Layer 2
  layer2: {
    sourceMac: string;
    destMac: string;
    etherType: string; // e.g. "0x0800 (IPv4)" or "0x0806 (ARP)"
    vlanId?: number;
  };
  // Layer 3
  layer3?: {
    version: number;
    ttl: number;
    protocol: number; // 1 = ICMP, 6 = TCP, 17 = UDP
    sourceIp: string;
    destIp: string;
    flags: string;
  };
  // Layer 4
  layer4?: {
    sourcePort: number;
    destPort: number;
    protocolName: string;
    seqNumber?: number;
    ackNumber?: number;
    flags?: {
      syn?: boolean;
      ack?: boolean;
      fin?: boolean;
      rst?: boolean;
      psh?: boolean;
    };
  };
  // Layer 7
  layer7?: {
    application: string;
    details: Record<string, unknown>;
    payloadString?: string;
  };
  // Raw Hex representation
  rawHex: string;
  progress: number; // 0.0 to 1.0 (for canvas animation)
  completed: boolean;
}

// ==========================================
// CABLE WORKSHOP TYPES
// ==========================================

export type WireColor =
  | 'white-orange'  // Trắng Cam
  | 'orange'        // Cam
  | 'white-green'   // Trắng Xanh lá
  | 'blue'          // Xanh dương
  | 'white-blue'    // Trắng Xanh dương
  | 'green'         // Xanh lá
  | 'white-brown'   // Trắng Nâu
  | 'brown';        // Nâu

export interface Rj45Connector {
  pins: (WireColor | null)[]; // 8 pins (index 0..7 for pins 1..8)
  crimped: boolean;
}

export interface CableTestResult {
  isPass: boolean;
  type: 'straight' | 'crossover' | 'rollover' | 'miswire' | 'open' | 'incomplete';
  title: string;
  description: string;
  pinMap: { pinA: number; pinB: number | null; matched: boolean; errorNote?: string }[];
}

// ==========================================
// PRACTICAL LAB TYPES
// ==========================================

export interface LabObjective {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  hint?: string;
}

export interface LabScenario {
  id: string;
  title: string;
  difficulty: 'Căn bản' | 'Trung cấp' | 'Nâng cao';
  estimatedMinutes: number;
  summary: string;
  guideMarkdown: string;
  initialDevices: NetworkDevice[];
  initialLinks: NetworkLink[];
  objectives: LabObjective[];
}
