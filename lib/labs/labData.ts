import {
  NetworkDevice,
  NetworkLink,
  LabScenario,
  DeviceType,
} from '@/types/network';

let deviceCounter = 100;
export function createDefaultDevice(type: DeviceType, x: number, y: number, nameSuffix: string = '1'): NetworkDevice {
  deviceCounter += 1;
  const id = `dev-${type}-${deviceCounter}-${nameSuffix}`;

  switch (type) {
    case 'cisco-router':
      return {
        id,
        type,
        name: `Cisco Router ISR 4331 (${nameSuffix})`,
        hostname: `Router${nameSuffix}`,
        x,
        y,
        cliMode: 'USER_EXEC',
        cliHistory: [],
        ports: [
          { id: `${id}-p0`, name: 'GigabitEthernet0/0/0', type: 'gigabit', macAddress: `00:01:42:34:12:0${nameSuffix}`, status: 'down' },
          { id: `${id}-p1`, name: 'GigabitEthernet0/0/1', type: 'gigabit', macAddress: `00:01:42:34:12:1${nameSuffix}`, status: 'down' },
          { id: `${id}-p2`, name: 'GigabitEthernet0/0/2', type: 'gigabit', macAddress: `00:01:42:34:12:2${nameSuffix}`, status: 'down' },
          { id: `${id}-p3`, name: 'Serial0/1/0', type: 'serial', macAddress: `00:01:42:34:12:3${nameSuffix}`, status: 'down' },
          { id: `${id}-p4`, name: 'Console', type: 'console', macAddress: '00:00:00:00:00:00', status: 'up', isConsole: true },
        ],
        routes: [],
        arpTable: [],
      };

    case 'l3-switch':
      return {
        id,
        type,
        name: `Switch L3 Catalyst 3650 (${nameSuffix})`,
        hostname: `Switch-L3-${nameSuffix}`,
        x,
        y,
        cliMode: 'USER_EXEC',
        cliHistory: [],
        vlans: [
          { id: 1, name: 'default' },
          { id: 10, name: 'MANAGEMENT' },
        ],
        ports: Array.from({ length: 8 }, (_, i) => ({
          id: `${id}-p${i}`,
          name: `GigabitEthernet1/0/${i + 1}`,
          type: 'gigabit' as const,
          macAddress: `00:50:79:66:36:0${i + 1}`,
          status: 'up' as const,
          vlanId: 1,
          mode: 'access' as const,
        })),
        macTable: [],
      };

    case 'l2-switch':
      return {
        id,
        type,
        name: `Switch L2 Catalyst 2960 (${nameSuffix})`,
        hostname: `Switch-L2-${nameSuffix}`,
        x,
        y,
        cliMode: 'USER_EXEC',
        cliHistory: [],
        vlans: [{ id: 1, name: 'default' }],
        ports: Array.from({ length: 8 }, (_, i) => ({
          id: `${id}-p${i}`,
          name: `FastEthernet0/${i + 1}`,
          type: 'ethernet' as const,
          macAddress: `00:50:79:66:29:0${i + 1}`,
          status: 'up' as const,
          vlanId: 1,
          mode: 'access' as const,
        })),
        macTable: [],
      };

    case 'wireless-ap':
      return {
        id,
        type,
        name: `Access Point Wi-Fi (${nameSuffix})`,
        hostname: `AP-Office-${nameSuffix}`,
        x,
        y,
        cliMode: 'EXEC',
        cliHistory: [],
        wifiSsid: 'NetLab-WiFi',
        wifiPassword: 'CiscoPassword123',
        wifiChannel: 6,
        ports: [
          { id: `${id}-p0`, name: 'Ethernet0 (WAN)', type: 'ethernet', macAddress: '00:04:9a:11:22:01', status: 'up' },
          { id: `${id}-p1`, name: 'Ethernet1 (LAN)', type: 'ethernet', macAddress: '00:04:9a:11:22:02', status: 'up' },
          { id: `${id}-p2`, name: 'Radio0 (2.4GHz/5GHz)', type: 'wireless', macAddress: '00:04:9a:11:22:ff', status: 'up' },
        ],
      };

    case 'firewall':
      return {
        id,
        type,
        name: `Next-Gen Firewall ASA (${nameSuffix})`,
        hostname: `ciscoasa`,
        x,
        y,
        cliMode: 'USER_EXEC',
        cliHistory: [],
        ports: [
          { id: `${id}-p0`, name: 'Inside (eth0)', type: 'gigabit', ipAddress: '192.168.1.1', subnetMask: '255.255.255.0', macAddress: '00:08:e3:11:22:01', status: 'up' },
          { id: `${id}-p1`, name: 'Outside (eth1)', type: 'gigabit', ipAddress: '203.0.113.1', subnetMask: '255.255.255.0', macAddress: '00:08:e3:11:22:02', status: 'up' },
          { id: `${id}-p2`, name: 'DMZ (eth2)', type: 'gigabit', ipAddress: '172.16.1.1', subnetMask: '255.255.255.0', macAddress: '00:08:e3:11:22:03', status: 'up' },
        ],
        aclRules: [
          { id: 'acl-1', action: 'permit', protocol: 'tcp', source: 'any', destination: '172.16.1.100', destPort: 80 },
          { id: 'acl-2', action: 'deny', protocol: 'icmp', source: 'any', destination: '192.168.1.0/24' },
          { id: 'acl-3', action: 'permit', protocol: 'ip', source: '192.168.1.0/24', destination: 'any' },
        ],
      };

    case 'linux-server':
      return {
        id,
        type,
        name: `Ubuntu Linux Server (${nameSuffix})`,
        hostname: `ubuntu-server`,
        x,
        y,
        cliMode: 'BASH',
        cliHistory: [],
        defaultGateway: '192.168.1.1',
        dnsServer: '8.8.8.8',
        ports: [
          { id: `${id}-p0`, name: 'eth0', type: 'ethernet', ipAddress: '192.168.1.100', subnetMask: '255.255.255.0', macAddress: '00:50:79:66:68:10', status: 'up' },
        ],
        webRootHtml: `<!DOCTYPE html>
<html>
<head>
  <title>NetLab Studio Web Server</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0b132b; color: #6fffe9; padding: 2rem; }
    .card { background: #1c2541; padding: 1.5rem; border-radius: 8px; border: 1px solid #3a506b; }
    h1 { color: #5bc0be; margin-top: 0; }
    .badge { display: inline-block; padding: 4px 10px; background: #48cae4; color: #03045e; font-weight: bold; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">NGINX ACTIVE</span>
    <h1>Xin chào từ Máy Chủ Nginx Ubuntu!</h1>
    <p>Hạ tầng thực hành NetLab Studio — Gói tin HTTP GET đã truyền tải thành công.</p>
    <p>Trạng thái máy chủ: <strong>200 OK</strong> | Uptime: <strong>99.9%</strong></p>
  </div>
</body>
</html>`,
      };

    case 'dns-server':
      return {
        id,
        type,
        name: `DNS Server (${nameSuffix})`,
        hostname: `dns-server`,
        x,
        y,
        cliMode: 'BASH',
        cliHistory: [],
        defaultGateway: '192.168.1.1',
        ports: [
          { id: `${id}-p0`, name: 'eth0', type: 'ethernet', ipAddress: '192.168.1.2', subnetMask: '255.255.255.0', macAddress: '00:50:79:66:68:02', status: 'up' },
        ],
        dnsRecords: [
          { id: 'dns-1', domain: 'netlab.edu', type: 'A', value: '192.168.1.100', ttl: 3600 },
          { id: 'dns-2', domain: 'cisco.local', type: 'A', value: '192.168.1.1', ttl: 3600 },
          { id: 'dns-3', domain: 'web.internal', type: 'CNAME', value: 'netlab.edu', ttl: 3600 },
        ],
      };

    case 'dhcp-server':
      return {
        id,
        type,
        name: `DHCP Server (${nameSuffix})`,
        hostname: `dhcp-server`,
        x,
        y,
        cliMode: 'BASH',
        cliHistory: [],
        defaultGateway: '192.168.1.1',
        ports: [
          { id: `${id}-p0`, name: 'eth0', type: 'ethernet', ipAddress: '192.168.1.3', subnetMask: '255.255.255.0', macAddress: '00:50:79:66:68:03', status: 'up' },
        ],
        dhcpPools: [
          {
            id: 'pool-1',
            name: 'OFFICE_POOL',
            network: '192.168.1.0',
            netmask: '255.255.255.0',
            defaultGateway: '192.168.1.1',
            dnsServer: '192.168.1.2',
            startIp: '192.168.1.50',
            endIp: '192.168.1.99',
            leaseTimeHours: 24,
            excludedIps: ['192.168.1.1', '192.168.1.2', '192.168.1.3'],
          },
        ],
        dhcpLeases: [
          { macAddress: '00:50:79:66:68:a1', ipAddress: '192.168.1.50', hostname: 'Laptop-01', expiresAt: '24h' },
        ],
      };

    case 'syslog-server':
      return {
        id,
        type,
        name: `Syslog & NTP Server (${nameSuffix})`,
        hostname: `syslog-srv`,
        x,
        y,
        cliMode: 'BASH',
        cliHistory: [],
        defaultGateway: '192.168.1.1',
        ports: [
          { id: `${id}-p0`, name: 'eth0', type: 'ethernet', ipAddress: '192.168.1.5', subnetMask: '255.255.255.0', macAddress: '00:50:79:66:68:05', status: 'up' },
        ],
        syslogLogs: [
          { id: 'log-1', timestamp: '12:00:01', facility: 'LINK', severity: 'NOTICE', sourceDevice: 'Switch-L2-1', message: 'Interface FastEthernet0/1 changed state to up' },
          { id: 'log-2', timestamp: '12:00:05', facility: 'SYS', severity: 'INFO', sourceDevice: 'Router1', message: 'Configured from console by student' },
        ],
      };

    case 'pc':
      return {
        id,
        type,
        name: `PC (${nameSuffix})`,
        hostname: `PC-${nameSuffix}`,
        x,
        y,
        cliMode: 'BASH',
        cliHistory: [],
        defaultGateway: '192.168.1.1',
        dnsServer: '192.168.1.2',
        ports: [
          { id: `${id}-p0`, name: 'FastEthernet0', type: 'ethernet', ipAddress: `192.168.1.1${nameSuffix}`, subnetMask: '255.255.255.0', macAddress: `00:50:79:66:68:1${nameSuffix}`, status: 'up' },
        ],
      };

    case 'laptop':
      return {
        id,
        type,
        name: `Laptop (${nameSuffix})`,
        hostname: `Laptop-${nameSuffix}`,
        x,
        y,
        cliMode: 'BASH',
        cliHistory: [],
        defaultGateway: '192.168.1.1',
        dnsServer: '192.168.1.2',
        connectedSsid: 'NetLab-WiFi',
        isWifiConnected: true,
        ports: [
          { id: `${id}-p0`, name: 'FastEthernet0', type: 'ethernet', ipAddress: '', subnetMask: '255.255.255.0', macAddress: `00:50:79:66:68:2${nameSuffix}`, status: 'up' },
          { id: `${id}-p1`, name: 'Wireless0', type: 'wireless', ipAddress: `192.168.1.5${nameSuffix}`, subnetMask: '255.255.255.0', macAddress: `00:50:79:66:68:3${nameSuffix}`, status: 'up' },
        ],
      };

    case 'smartphone':
      return {
        id,
        type,
        name: `Smartphone (${nameSuffix})`,
        hostname: `Phone-${nameSuffix}`,
        x,
        y,
        cliMode: 'BASH',
        cliHistory: [],
        defaultGateway: '192.168.1.1',
        dnsServer: '192.168.1.2',
        connectedSsid: 'NetLab-WiFi',
        isWifiConnected: true,
        ports: [
          { id: `${id}-p0`, name: 'wlan0', type: 'wireless', ipAddress: `192.168.1.8${nameSuffix}`, subnetMask: '255.255.255.0', macAddress: `00:50:79:66:68:4${nameSuffix}`, status: 'up' },
        ],
      };

    case 'iot-gateway':
      return {
        id,
        type,
        name: `Industrial IoT Sensor (${nameSuffix})`,
        hostname: `IoT-Sensor-${nameSuffix}`,
        x,
        y,
        cliMode: 'BASH',
        cliHistory: [],
        defaultGateway: '192.168.1.1',
        ports: [
          { id: `${id}-p0`, name: 'eth0', type: 'ethernet', ipAddress: `192.168.1.9${nameSuffix}`, subnetMask: '255.255.255.0', macAddress: `00:50:79:66:68:5${nameSuffix}`, status: 'up' },
        ],
        sensorData: {
          temperature: 26.4,
          humidity: 62.5,
          motionDetected: false,
          lastPing: 'Just now',
        },
      };

    case 'hub':
      return {
        id,
        type,
        name: `Hub Repeater L1 (${nameSuffix})`,
        hostname: `Hub-${nameSuffix}`,
        x,
        y,
        cliMode: 'EXEC',
        cliHistory: [],
        ports: Array.from({ length: 6 }, (_, i) => ({
          id: `${id}-p${i}`,
          name: `Port ${i + 1}`,
          type: 'ethernet' as const,
          macAddress: '00:00:00:00:00:00',
          status: 'up' as const,
        })),
      };
  }
}

// 5 Guided Practical Labs
export const PRACTICAL_LABS: LabScenario[] = [
  {
    id: 'lab-1',
    title: 'Lab 1: IP Subnetting & Cấu hình Cổng Mặc định (Default Gateway)',
    difficulty: 'Căn bản',
    estimatedMinutes: 15,
    summary: 'Xây dựng mạng LAN đơn giản gồm PC, Switch, Router Cisco ISR 4331 và Nginx Web Server. Đặt IP tĩnh và kiểm tra ping thông suốt.',
    guideMarkdown: `### Mục tiêu bài lab:
1. Đặt địa chỉ IP cho **PC1**: \`192.168.1.10/24\`, Default Gateway: \`192.168.1.1\`.
2. Mở CLI Router **Router1**, cấu hình cổng **GigabitEthernet0/0/0** với IP \`192.168.1.1 255.255.255.0\` và kích hoạt \`no shutdown\`.
3. Kiểm tra cổng **GigabitEthernet0/0/0** đã chuyển sang trạng thái **UP** (xanh lá).
4. Dùng công cụ **Gửi Gói Tin PDU** (Envelope) hoặc vào Terminal PC1 gõ \`ping 192.168.1.100\` để kiểm tra kết nối tới Máy Chủ Web.`,
    objectives: [
      { id: 'obj-pc-ip', title: 'Cấu hình IP PC1', description: 'Đặt IP 192.168.1.10, mask 255.255.255.0, gateway 192.168.1.1 trên PC1', completed: false },
      { id: 'obj-router-ip', title: 'Cấu hình Gateway trên Router1', description: 'Cấu hình IP 192.168.1.1 trên Gi0/0/0 và mở cổng (no shutdown)', completed: false },
      { id: 'obj-link-up', title: 'Kết nối cáp vật lý thông mạch', description: 'Cáp nối giữa PC1, Switch và Router1 đều ở trạng thái UP', completed: false },
    ],
    initialDevices: [
      {
        ...createDefaultDevice('pc', 120, 200, '1'),
        ports: [{ id: 'p-pc1-0', name: 'FastEthernet0', type: 'ethernet', ipAddress: '', subnetMask: '', macAddress: '00:50:79:66:68:11', status: 'up' }],
      },
      createDefaultDevice('l2-switch', 340, 200, '1'),
      createDefaultDevice('cisco-router', 580, 200, '1'),
      createDefaultDevice('linux-server', 580, 380, '1'),
    ],
    initialLinks: [
      { id: 'l1', cableType: 'straight', fromDeviceId: '', fromPortId: '', toDeviceId: '', toPortId: '', status: 'up' }, // will be linked
    ],
  },
  {
    id: 'lab-2',
    title: 'Lab 2: Phân chia VLAN & Định tuyến Router-on-a-Stick 802.1Q',
    difficulty: 'Trung cấp',
    estimatedMinutes: 25,
    summary: 'Cấu hình Switch phân chia 2 phòng ban VLAN 10 (Sales) và VLAN 20 (IT). Định tuyến liên VLAN thông qua Sub-interface 802.1Q trên Router Cisco.',
    guideMarkdown: `### Hướng dẫn thực hành:
1. Trên Switch:
   - Tạo VLAN 10 (\`name SALES\`) và VLAN 20 (\`name IT\`).
   - Gán cổng **Fa0/1** vào VLAN 10 (\`switchport access vlan 10\`).
   - Gán cổng **Fa0/2** vào VLAN 20 (\`switchport access vlan 20\`).
   - Đặt cổng nối lên Router **Fa0/24** làm cổng Trunk (\`switchport mode trunk\`).
2. Trên Router Cisco:
   - Kích hoạt cổng vật lý Gi0/0/0 (\`no shutdown\`).
   - Tạo Sub-interface Gi0/0/0.10: \`encapsulation dot1Q 10\`, \`ip address 192.168.10.1 255.255.255.0\`.
   - Tạo Sub-interface Gi0/0/0.20: \`encapsulation dot1Q 20\`, \`ip address 192.168.20.1 255.255.255.0\`.
3. Kiểm tra: PC-Sales (\`192.168.10.10\`) ping thành công sang PC-IT (\`192.168.20.20\`).`,
    objectives: [
      { id: 'obj-vlans', title: 'Tạo VLAN 10 & 20 trên Switch', description: 'Đã định nghĩa đủ VLAN 10 và VLAN 20 trên Switch-L2', completed: false },
      { id: 'obj-trunk', title: 'Cấu hình Trunking 802.1Q', description: 'Cổng nối giữa Switch và Router được gán mode Trunk', completed: false },
      { id: 'obj-subif', title: 'Cấu hình Sub-interface trên Router', description: 'Router có Sub-interface .10 và .20 đóng gói dot1Q', completed: false },
    ],
    initialDevices: [
      createDefaultDevice('pc', 120, 140, 'Sales'),
      createDefaultDevice('pc', 120, 320, 'IT'),
      createDefaultDevice('l2-switch', 350, 230, '1'),
      createDefaultDevice('cisco-router', 600, 230, '1'),
    ],
    initialLinks: [],
  },
  {
    id: 'lab-3',
    title: 'Lab 3: Dịch vụ Doanh Nghiệp (DHCP + DNS + Web Nginx + Wi-Fi)',
    difficulty: 'Trung cấp',
    estimatedMinutes: 20,
    summary: 'Triển khai hạ tầng dịch vụ doanh nghiệp hoàn chỉnh: cấp phát IP tự động qua DHCP, phân giải tên miền netlab.edu và truy cập trang Web qua Wi-Fi.',
    guideMarkdown: `### Các bước thực hiện:
1. Mở cấu hình **DHCP Server**: Thiết lập dải cấp phát \`192.168.1.50\` - \`192.168.1.99\`, Gateway \`192.168.1.1\`, DNS Server \`192.168.1.2\`.
2. Mở cấu hình **DNS Server**: Thêm bản ghi A Record cho tên miền \`netlab.edu\` trỏ về IP Web Server \`192.168.1.100\`.
3. Trên **Laptop**: Chuyển chế độ IP sang **DHCP** để nhận IP tự động.
4. Mở tab **Web Browser** trên Laptop, gõ \`http://netlab.edu\` và tận hưởng trang web hiển thị trực quan!`,
    objectives: [
      { id: 'obj-dhcp', title: 'Kích hoạt DHCP Pool', description: 'DHCP Server có pool hợp lệ với Gateway và DNS', completed: false },
      { id: 'obj-dns', title: 'Tạo DNS Record netlab.edu', description: 'Bản ghi A Record netlab.edu trỏ về 192.168.1.100', completed: false },
      { id: 'obj-laptop-ip', title: 'Laptop nhận IP qua DHCP', description: 'Laptop đã được cấp IP thuộc dải DHCP hợp lệ', completed: false },
    ],
    initialDevices: [
      createDefaultDevice('dhcp-server', 100, 120, '1'),
      createDefaultDevice('dns-server', 280, 120, '1'),
      createDefaultDevice('linux-server', 460, 120, '1'),
      createDefaultDevice('l2-switch', 280, 260, '1'),
      createDefaultDevice('wireless-ap', 480, 260, '1'),
      createDefaultDevice('laptop', 480, 420, '1'),
    ],
    initialLinks: [],
  },
  {
    id: 'lab-4',
    title: 'Lab 4: Bảo mật Tường Lửa Firewall ACL & Vùng DMZ',
    difficulty: 'Nâng cao',
    estimatedMinutes: 30,
    summary: 'Phân tách 3 vùng mạng Inside (Nội bộ), Outside (Internet) và DMZ (Chứa Máy chủ Web). Cấu hình luật ACL chặn Ping và chỉ mở Port 80 Web.',
    guideMarkdown: `### Hướng dẫn:
1. Kiểm tra 3 interface của Tường lửa ASA: Inside (eth0: 192.168.1.1), Outside (eth1: 203.0.113.1), DMZ (eth2: 172.16.1.1).
2. Thiết lập quy tắc ACL trên Firewall:
   - **Permit** TCP Port 80 từ Outside vào Web Server DMZ (\`172.16.1.100\`).
   - **Deny** ICMP Ping từ Outside vào mạng Inside (\`192.168.1.0/24\`).
3. Dùng PC Ngoài Internet ping vào mạng Inside -> quan sát gói tin bị Tường lửa drop tại chỗ.
4. Mở trình duyệt PC Ngoài Internet truy cập HTTP DMZ -> phản hồi 200 OK thành công!`,
    objectives: [
      { id: 'obj-firewall-ports', title: 'Cấu hình 3 vùng Inside, Outside, DMZ', description: 'Các cổng firewall đều được gán IP đúng vùng mạng', completed: false },
      { id: 'obj-acl-rules', title: 'Thiết lập quy tắc lọc gói tin ACL', description: 'Có luật permit Port 80 và deny ICMP trái phép', completed: false },
    ],
    initialDevices: [
      createDefaultDevice('pc', 100, 240, 'Inside'),
      createDefaultDevice('firewall', 360, 240, '1'),
      createDefaultDevice('linux-server', 360, 420, 'DMZ'),
      createDefaultDevice('pc', 620, 240, 'Outside'),
    ],
    initialLinks: [],
  },
  {
    id: 'lab-5',
    title: 'Lab 5: Xưởng Bấm Cáp Mạng RJ45 & Đo Kiểm 8 Đèn LED',
    difficulty: 'Căn bản',
    estimatedMinutes: 10,
    summary: 'Vào Xưởng Bấm Cáp RJ45, xếp đúng 8 sợi màu theo chuẩn T568A hoặc T568B, dùng kìm bấm và chạy máy quét 8 đèn LED để kiểm tra thông mạch.',
    guideMarkdown: `### Yêu cầu:
1. Mở cửa sổ **Xưởng Bấm Cáp RJ45** trên thanh công cụ.
2. Xếp 8 sợi màu ở Đầu A theo chuẩn **T568B**:
   - 1: Trắng-Cam, 2: Cam, 3: Trắng-Xanh lá, 4: Xanh dương, 5: Trắng-Xanh dương, 6: Xanh lá, 7: Trắng-Nâu, 8: Nâu.
3. Xếp Đầu B tương tự (T568B) để tạo **Cáp Thẳng** (Straight-Through), hoặc xếp T568A để tạo **Cáp Chéo** (Crossover).
4. Bấm nút **Bấm Kìm (Crimp)** để cố định các chân tiếp xúc mạ vàng.
5. Nhấn **Đo Kiểm Cáp (Test)** để xem máy đo 8 đèn LED quét tuần tự từ 1 đến 8 và nhận chứng nhận đạt chuẩn 100%!`,
    objectives: [
      { id: 'obj-crimped-cable', title: 'Hoàn thành bấm cáp chuẩn', description: 'Tạo thành công cáp mạng đạt chuẩn T568B hoặc Crossover', completed: false },
      { id: 'obj-8led-pass', title: 'Máy đo 8 đèn LED kiểm tra Pass', description: 'Tất cả 8 cặp chân đều thông mạch và sáng đèn xanh', completed: false },
    ],
    initialDevices: [],
    initialLinks: [],
  },
];

// Automated Evaluation Engine for Labs
export function evaluateLab(
  scenario: LabScenario,
  devices: NetworkDevice[],
  links: NetworkLink[]
): { score: number; total: number; percentage: number; passed: boolean; details: Record<string, boolean> } {
  const details: Record<string, boolean> = {};

  if (scenario.id === 'lab-1') {
    const pc1 = devices.find((d) => d.hostname === 'PC-1' || d.type === 'pc');
    const pcPort = pc1?.ports.find((p) => p.ipAddress?.startsWith('192.168.1.'));
    details['obj-pc-ip'] = !!(pcPort && pc1?.defaultGateway === '192.168.1.1');

    const router = devices.find((d) => d.type === 'cisco-router');
    const rPort = router?.ports.find((p) => p.ipAddress === '192.168.1.1' && p.status === 'up');
    details['obj-router-ip'] = !!rPort;

    details['obj-link-up'] = links.length >= 2 && links.every((l) => l.status === 'up');
  } else if (scenario.id === 'lab-2') {
    const sw = devices.find((d) => d.type === 'l2-switch');
    const hasVlan10 = sw?.vlans?.some((v) => v.id === 10);
    const hasVlan20 = sw?.vlans?.some((v) => v.id === 20);
    details['obj-vlans'] = !!(hasVlan10 && hasVlan20);

    const hasTrunk = sw?.ports.some((p) => p.mode === 'trunk');
    details['obj-trunk'] = !!hasTrunk;

    const router = devices.find((d) => d.type === 'cisco-router');
    const hasSubIf = router?.ports.some((p) => p.vlanId === 10 || p.name.includes('.10'));
    details['obj-subif'] = !!hasSubIf;
  } else if (scenario.id === 'lab-3') {
    const dhcp = devices.find((d) => d.type === 'dhcp-server');
    details['obj-dhcp'] = !!(dhcp?.dhcpPools && dhcp.dhcpPools.length > 0);

    const dns = devices.find((d) => d.type === 'dns-server');
    details['obj-dns'] = !!dns?.dnsRecords?.some((r) => r.domain.includes('netlab'));

    const laptop = devices.find((d) => d.type === 'laptop');
    const hasIp = laptop?.ports.some((p) => p.ipAddress && p.ipAddress !== '');
    details['obj-laptop-ip'] = !!hasIp;
  } else if (scenario.id === 'lab-4') {
    const fw = devices.find((d) => d.type === 'firewall');
    details['obj-firewall-ports'] = !!(fw && fw.ports.length >= 3);
    details['obj-acl-rules'] = !!(fw?.aclRules && fw.aclRules.length >= 2);
  } else if (scenario.id === 'lab-5') {
    details['obj-crimped-cable'] = true;
    details['obj-8led-pass'] = true;
  }

  const keys = Object.keys(details);
  const score = keys.filter((k) => details[k]).length;
  const total = Math.max(scenario.objectives.length, keys.length, 1);
  const percentage = Math.round((score / total) * 100);

  return {
    score,
    total,
    percentage,
    passed: percentage >= 80,
    details,
  };
}
