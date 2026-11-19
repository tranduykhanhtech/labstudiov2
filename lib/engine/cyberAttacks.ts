import {
  CyberAttackDefinition,
  AttackType,
  AttackResult,
  NetworkDevice,
  NetworkLink,
  PacketPdu,
} from '@/types/network';
import { PROTOCOL_COLORS } from './packetEngine';

// Monotonic unique packet ID counter for attacks
let attackPacketCounter = 1000;
function createAttackPacketId(attackId: string, idx: number): string {
  attackPacketCounter += 1;
  return `atk-${attackId}-${attackPacketCounter}-${Date.now()}-${idx}`;
}

// ==========================================
// 16 CYBER ATTACK DEFINITIONS (POPULAR + ADVANCED)
// ==========================================

export const CYBER_ATTACKS: CyberAttackDefinition[] = [
  // ----------------------------------------
  // PHỔ BIẾN (POPULAR ATTACKS)
  // ----------------------------------------
  {
    id: 'syn-flood',
    name: 'TCP SYN Flood (DDoS L4)',
    category: 'popular',
    layer: 'L4',
    protocol: 'TCP',
    severity: 'CRITICAL',
    shortDesc: 'Bão gói TCP SYN với IP giả mạo làm tràn hàng đợi kết nối bán mở (half-open backlog).',
    mechanism: 'Kẻ tấn công gửi hàng ngàn gói tin TCP [SYN] từ các địa chỉ IP nguồn ngẫu nhiên/giả mạo mà không bao giờ phản hồi ACK bước 3. Bảng SYN Backlog của mục tiêu bị lấp đầy hoàn toàn, khiến các máy khách hợp lệ không thể kết nối.',
    impact: 'Web Server / Router bị treo kết nối L4, CPU tải vọt lên 95-100%, từ chối toàn bộ kết nối của người dùng hợp lệ (Denial of Service).',
    defenseTechnology: 'SYN Cookies, TCP Intercept, Rate Limiting & Firewall Connection Limits',
    mitigation: 'Bật TCP SYN Cookies trên Linux kernel (sysctl -w net.ipv4.tcp_syncookies=1) hoặc cấu hình TCP Intercept / Connection limits trên Cisco Firewall ASA.',
    ciscoCommand: 'class-map SYN-FLOOD\n match access-list ALL-TCP\npolicy-map GLOBAL-POLICY\n class SYN-FLOOD\n  set connection per-client-max 50',
    linuxCommand: 'sudo sysctl -w net.ipv4.tcp_syncookies=1\nsudo iptables -A INPUT -p tcp --syn -m limit --limit 20/s --limit-burst 50 -j ACCEPT',
  },
  {
    id: 'arp-spoofing',
    name: 'ARP Spoofing / Poisoning (MITM L2)',
    category: 'popular',
    layer: 'L2',
    protocol: 'ARP',
    severity: 'HIGH',
    shortDesc: 'Đầu độc bảng ARP cache của nạn nhân để chiếm quyền làm Gateway trung gian nghe lén.',
    mechanism: 'Kẻ tấn công liên tục gửi các bản tin Gratuitous ARP Reply giả mạo đến Switch và PC nạn nhân với nội dung: "IP của Default Gateway đang mang địa chỉ MAC của Hacker". Máy nạn nhân cập nhật bảng ARP và chuyển mọi lưu lượng ra Internet qua máy Hacker.',
    impact: 'Man-in-the-Middle (MITM): Kẻ tấn công đọc trộm mật khẩu, dữ liệu chưa mã hóa, hoặc sửa đổi nội dung gói tin trước khi chuyển tiếp ra router.',
    defenseTechnology: 'Dynamic ARP Inspection (DAI) & Static ARP Bindings',
    mitigation: 'Bật Dynamic ARP Inspection (DAI) trên Switch kết hợp với DHCP Snooping database để kiểm tra tính hợp lệ của MAC-IP trước khi cho phép frame ARP đi qua.',
    ciscoCommand: 'ip arp inspection vlan 1,10,20\ninterface GigabitEthernet0/24\n ip arp inspection trust',
    linuxCommand: 'sudo arp -s 192.168.1.1 00:0c:29:ab:cd:01\nsudo arptables -A INPUT --source-ip 192.168.1.1 --source-mac ! 00:0c:29:ab:cd:01 -j DROP',
  },
  {
    id: 'dhcp-starvation',
    name: 'DHCP Starvation & Rogue DHCP (L2/L7)',
    category: 'popular',
    layer: 'L7',
    protocol: 'DHCP',
    severity: 'HIGH',
    shortDesc: 'Vét cạn dải IP của DHCP Server hợp lệ, sau đó dựng DHCP Server giả mạo cấp DNS/Gateway độc hại.',
    mechanism: 'Hacker gửi bão bản tin DHCP Discover với hàng triệu địa chỉ MAC ảo, xin thuê sạch toàn bộ địa chỉ IP trong pool của Router. Khi dải IP cạn kiệt, Hacker dựng Rogue DHCP Server để cấp IP, Gateway và DNS giả mạo cho các máy con mới gia nhập mạng.',
    impact: 'Toàn bộ PC mới không nhận được IP hợp lệ, bị định tuyến qua Gateway độc hại của hacker và truy cập vào máy chủ DNS lừa đảo.',
    defenseTechnology: 'DHCP Snooping & Port Security',
    mitigation: 'Bật DHCP Snooping trên Switch, chỉ định duy nhất cổng kết nối tới Router/DHCP Server hợp lệ là "trusted port", chặn bản tin DHCP Offer từ tất cả các cổng máy con (untrusted).',
    ciscoCommand: 'ip dhcp snooping\nip dhcp snooping vlan 1,10,20\ninterface GigabitEthernet0/1\n ip dhcp snooping trust',
    linuxCommand: 'sudo iptables -A INPUT -p udp --dport 67 --sport 68 -m mac ! --mac-source 00:0c:29:ab:cd:01 -j DROP',
  },
  {
    id: 'dns-cache-poisoning',
    name: 'DNS Cache Poisoning / Spoofing (L7)',
    category: 'popular',
    layer: 'L7',
    protocol: 'DNS',
    severity: 'HIGH',
    shortDesc: 'Đầu độc bộ nhớ đệm máy chủ DNS, bẻ hướng tên miền ngân hàng/web sang địa chỉ lừa đảo.',
    mechanism: 'Hacker gửi một truy vấn DNS và nhanh chóng gửi hàng loạt bản tin DNS Response giả mạo với Transaction ID dự đoán, chèn bản ghi A record giả (ví dụ: cisco.lab -> 192.168.1.666) vào bộ nhớ cache của DNS Server nội bộ trước khi máy chủ DNS gốc kịp trả lời.',
    impact: 'Người dùng gõ đúng địa chỉ trang web nhưng trình duyệt lại tải giao diện giả mạo từ máy tính của hacker để chiếm đoạt tài khoản mật khẩu.',
    defenseTechnology: 'DNSSEC (DNS Security Extensions) & Source Port Randomization',
    mitigation: 'Kích hoạt DNSSEC để ký số cryptographic mọi bản ghi DNS; cấu hình DNS resolver ngẫu nhiên hóa Transaction ID và Source Port UDP.',
    ciscoCommand: 'ip dns view default\n dnssec enable\n dnssec validation enable',
    linuxCommand: 'sudo sed -i "s/dnssec-validation no/dnssec-validation auto/" /etc/bind/named.conf.options\nsudo systemctl restart bind9',
  },
  {
    id: 'ping-of-death',
    name: 'Ping of Death & ICMP Flood (L3)',
    category: 'popular',
    layer: 'L3',
    protocol: 'ICMP',
    severity: 'MEDIUM',
    shortDesc: 'Bão gói tin ICMP Echo hoặc phân mảnh siêu kích thước làm cạn kiệt băng thông và nghẽn CPU.',
    mechanism: 'Gửi gói tin ICMP Echo vượt quá giới hạn 65,535 bytes của chuẩn IPv4 hoặc phát tán hàng triệu gói Echo Request mỗi giây khiến router/máy chủ phải liên tục xử lý ngắt phần cứng (hardware interrupts) để ghép mảnh và phản hồi Echo Reply.',
    impact: 'Làm sập stack mạng hệ điều hành cổ hoặc chiếm dụng 100% tài nguyên CPU và đường truyền mạng vật lý, ngắt quãng lưu lượng hợp lệ.',
    defenseTechnology: 'ICMP Rate Limiting & Firewall State Inspection',
    mitigation: 'Cấu hình giới hạn tốc độ ICMP (ICMP rate-limiting) trên router và chặn các gói tin IP fragments không chuẩn mực.',
    ciscoCommand: 'ip icmp rate-limit unreachable 500\naccess-list 101 deny icmp any any fragments\naccess-list 101 permit ip any any',
    linuxCommand: 'sudo iptables -A INPUT -p icmp --icmp-type echo-request -m limit --limit 5/s --limit-burst 10 -j ACCEPT\nsudo iptables -A INPUT -p icmp -j DROP',
  },
  {
    id: 'slowloris',
    name: 'Slowloris Low & Slow HTTP DoS (L7)',
    category: 'popular',
    layer: 'L7',
    protocol: 'HTTP',
    severity: 'HIGH',
    shortDesc: 'Mở hàng loạt kết nối HTTP và truyền header cực chậm, giữ chân toàn bộ worker pool của Web Server.',
    mechanism: 'Kẻ tấn công không dùng bão lưu lượng lớn mà chỉ mở hàng trăm kết nối TCP hợp lệ đến cổng 80 của Nginx/Apache, gửi từng dòng header HTTP dở dang (ví dụ: `X-a: b\\r\\n`) cách nhau mỗi 15 giây. Web server phải duy trì socket mở chờ request hoàn tất cho đến khi hết slot kết nối.',
    impact: 'Chỉ cần một máy tính băng thông yếu cũng có thể khiến Web Server ngừng phục vụ khách truy cập (HTTP 503 / Connection Timeout).',
    defenseTechnology: 'Client Header Timeout, mod_reqtimeout & Nginx limit_conn',
    mitigation: 'Cấu hình giảm client_body_timeout, client_header_timeout xuống 10s và giới hạn số kết nối đồng thời trên mỗi IP trong Nginx.',
    ciscoCommand: 'policy-map type inspect http HTTP-MAP\n parameters\n  body-length max 100000\n  request-length max 2048',
    linuxCommand: 'limit_conn_zone $binary_remote_addr zone=addr:10m;\nlimit_conn addr 20;\nclient_header_timeout 10s;\nclient_body_timeout 10s;',
  },
  {
    id: 'port-scan',
    name: 'Nmap SYN Stealth Port Scan (Reconnaissance L4)',
    category: 'popular',
    layer: 'L4',
    protocol: 'TCP',
    severity: 'MEDIUM',
    shortDesc: 'Quét ngầm toàn bộ dải cổng từ 1..1024 nhằm thám mã dịch vụ mở trước khi tấn công.',
    mechanism: 'Kẻ tấn công gửi gói tin TCP [SYN] đến lần lượt các cổng (21, 22, 23, 53, 80, 443,...). Nếu nhận được [SYN, ACK] thì cổng đang mở (Open); sau đó hacker gửi ngay gói [RST] để ngắt kết nối mà không hoàn tất bắt tay 3 bước, tránh để lại log ứng dụng.',
    impact: 'Lộ diện toàn bộ danh sách dịch vụ mạng, phiên bản hệ điều hành và các lỗ hổng phần mềm sẵn sàng cho hacker khai thác sâu.',
    defenseTechnology: 'Intrusion Detection System (Snort/Suricata) & Port Scan Blocker',
    mitigation: 'Cấu hình phát hiện quét cổng trên Firewall, tự động đưa địa chỉ IP có hành vi thăm dò liên tục vào danh sách đen (Blacklist / Fail2ban).',
    ciscoCommand: 'threat-detection scanning-threat shun\nthreat-detection scanning-threat shun duration 3600',
    linuxCommand: 'sudo iptables -A INPUT -m recent --name portscan --set\nsudo iptables -A INPUT -m recent --name portscan --rcheck --seconds 60 --hitcount 10 -j DROP',
  },
  {
    id: 'ssh-bruteforce',
    name: 'SSH / Telnet Credential Brute-Force (L7)',
    category: 'popular',
    layer: 'L7',
    protocol: 'SSH',
    severity: 'HIGH',
    shortDesc: 'Dò quét mật khẩu quản trị dòng lệnh từ điển nhằm chiếm quyền root/enable CLI.',
    mechanism: 'Hacker sử dụng bot tự động gửi hàng ngàn cặp tài khoản/mật khẩu phổ biến (admin, cisco, root, 123456, toor) đến cổng 22 của Router/Server để cố gắng đăng nhập.',
    impact: 'Nếu thành công, kẻ tấn công chiếm toàn quyền kiểm soát thiết bị mạng qua CLI Cisco IOS hoặc bash shell Ubuntu Linux.',
    defenseTechnology: 'SSH Key Authentication, Fail2ban, Login Delay & Block',
    mitigation: 'Cấm đăng nhập mật khẩu (chỉ dùng SSH Key), đổi cổng mặc định 22, và cấu hình khóa IP sau 3 lần nhập sai liên tiếp.',
    ciscoCommand: 'login block-for 180 within 60 attempts 3\nip ssh time-out 60\nip ssh authentication-retries 3',
    linuxCommand: 'sudo apt install fail2ban -y\n# Sửa /etc/ssh/sshd_config:\nPasswordAuthentication no\nPermitRootLogin no',
  },
  {
    id: 'sql-injection',
    name: 'SQL Injection & Web Exploit (L7)',
    category: 'popular',
    layer: 'L7',
    protocol: 'HTTP',
    severity: 'CRITICAL',
    shortDesc: 'Bơm mã SQL độc hại qua request HTTP để trích xuất hoặc phá hủy cơ sở dữ liệu web server.',
    mechanism: 'Gửi chuỗi dữ liệu đầu vào chứa các ký tự đặc biệt như `\' OR \'1\'=\'1` hoặc `UNION SELECT * FROM users` qua tham số URL hoặc form POST nhằm thay đổi logic câu truy vấn SQL trên Web Server.',
    impact: 'Rò rỉ toàn bộ cơ sở dữ liệu người dùng, thay đổi giao diện web (Defacement), hoặc thực thi lệnh shell từ xa (RCE).',
    defenseTechnology: 'Web Application Firewall (WAF) & Parameterized Queries (Prepared Statements)',
    mitigation: 'Triển khai WAF (ModSecurity / Cloudflare) để nhận diện pattern SQLi và luôn sử dụng Prepared Statements trong mã nguồn backend.',
    ciscoCommand: 'policy-map type inspect http WAF-POLICY\n match request-uri regex ".*(select|insert|update|delete|drop).*"\n drop',
    linuxCommand: 'sudo apt install libapache2-mod-security2 -y\nsudo cp /etc/modsecurity/modsecurity.conf-recommended /etc/modsecurity/modsecurity.conf\nsudo sed -i "s/SecRuleEngine DetectionOnly/SecRuleEngine On/" /etc/modsecurity/modsecurity.conf',
  },

  // ----------------------------------------
  // CHUYÊN SÂU / ÍT PHỔ BIẾN (ADVANCED & OBSCURE ATTACKS)
  // ----------------------------------------
  {
    id: 'cam-table-overflow',
    name: 'CAM Table Overflow / MAC Flooding (L2)',
    category: 'advanced',
    layer: 'L2',
    protocol: 'ATTACK',
    severity: 'HIGH',
    shortDesc: 'Bắn hàng ngàn frame MAC giả làm tràn bộ nhớ CAM, ép Switch biến thành Hub để nghe lén gói tin.',
    mechanism: 'Bộ nhớ Content Addressable Memory (CAM) của Switch L2 chỉ lưu được một số lượng địa chỉ MAC nhất định (thường 4096-8192). Kẻ tấn công phát hàng trăm ngàn ethernet frame với MAC nguồn ngẫu nhiên mỗi giây. Khi bảng CAM đầy, Switch rơi vào cơ chế dự phòng an toàn (Fail-Open), phát tán (flood) toàn bộ frame unicast nhận được ra TẤT CẢ các cổng như một chiếc Hub sơ khai.',
    impact: 'Biến môi trường mạng chuyển mạch bảo mật (Switching) thành môi trường chia sẻ (Hub), kẻ tấn công cắm ở bất kỳ cổng nào cũng có thể cắm Wireshark bắt trọn gói tin của các phòng ban khác.',
    defenseTechnology: 'Port Security with MAC Limiting & Shutdown Violation',
    mitigation: 'Cấu hình Cisco Port Security giới hạn mỗi cổng chỉ được học tối đa 1-2 địa chỉ MAC hợp lệ; nếu phát hiện MAC thứ 3 thì tự động shutdown cổng (err-disable).',
    ciscoCommand: 'interface range FastEthernet0/1 - 24\n switchport mode access\n switchport port-security\n switchport port-security maximum 2\n switchport port-security violation shutdown',
    linuxCommand: 'sudo bridge link set dev eth0 learning off\nsudo ebtables -A INPUT --limit 10/s -j ACCEPT',
  },
  {
    id: 'vlan-hopping',
    name: 'VLAN Hopping (Double 802.1Q Tagging L2)',
    category: 'advanced',
    layer: 'L2',
    protocol: 'ATTACK',
    severity: 'HIGH',
    shortDesc: 'Lồng 2 thẻ VLAN (Outer Native + Inner Target) để vượt rào cô lập VLAN mà không cần router cho phép.',
    mechanism: 'Hacker gửi frame chứa 2 thẻ VLAN 802.1Q: Thẻ ngoài (Outer) là Native VLAN (thường là VLAN 1), thẻ trong (Inner) là VLAN mục tiêu của nạn nhân (ví dụ VLAN 20 - Tài chính). Khi Switch thứ nhất nhận frame, do nằm trên Native VLAN, nó bóc thẻ ngoài ra rồi đẩy frame lên đường Trunk. Khi Switch thứ hai nhận frame, nó thấy thẻ trong là VLAN 20 và chuyển tiếp frame thẳng vào máy nạn nhân ở VLAN 20 mà router không hề hay biết.',
    impact: 'Phá vỡ hoàn toàn ranh giới cô lập phân đoạn mạng (VLAN Segmentation), tấn công thẳng vào máy chủ nội bộ nhạy cảm.',
    defenseTechnology: 'Explicit Native VLAN Tagging & Disable DTP',
    mitigation: 'Đổi Native VLAN sang một VLAN riêng biệt không sử dụng (ví dụ VLAN 999), kích hoạt bắt buộc gắn tag cho Native VLAN trên toàn bộ Trunk, và tắt chế độ Dynamic Trunking Protocol (switchport nonegotiate).',
    ciscoCommand: 'vlan dot1q tag native\ninterface GigabitEthernet0/24\n switchport trunk native vlan 999\n switchport mode trunk\n switchport nonegotiate',
    linuxCommand: 'sudo ip link add link eth0 name eth0.999 type vlan id 999\nsudo ip link set dev eth0.999 up',
  },
  {
    id: 'stp-root-takeover',
    name: 'STP Root Takeover / BPDU Spoofing (L2)',
    category: 'advanced',
    layer: 'L2',
    protocol: 'STP',
    severity: 'CRITICAL',
    shortDesc: 'Gửi gói BPDU với Priority = 0 cướp ngôi Root Bridge, bẻ hướng cây chuyển mạch toàn công ty.',
    mechanism: 'Kẻ tấn công cắm máy tính vào cổng Switch thông thường, chạy phần mềm phát gói Spanning Tree Configuration BPDU với Bridge Priority cực thấp (0) và địa chỉ MAC siêu nhỏ. Các Switch trong mạng coi máy hacker là Root Bridge mới, tính toán lại toàn bộ cấu trúc cây Spanning Tree và mở các cổng dự phòng để chuyển tiếp lưu lượng qua máy hacker.',
    impact: 'Hacker trở thành điểm trung chuyển trung tâm của toàn bộ mạng LAN công ty, gây ngắt quãng mạng tức thì (Topology Reconvergence) và nghe lén dữ liệu.',
    defenseTechnology: 'STP BPDU Guard & Root Guard',
    mitigation: 'Kích hoạt BPDU Guard trên tất cả các cổng Access (PortFast) nối tới người dùng cuối. Nếu cổng này nhận được bất kỳ gói BPDU nào, switch lập tức khóa cổng đưa vào trạng thái err-disabled.',
    ciscoCommand: 'spanning-tree portfast bpduguard default\ninterface range FastEthernet0/1 - 20\n spanning-tree portfast\n spanning-tree bpduguard enable',
    linuxCommand: 'sudo brctl setageing br0 0\nsudo ebtables -A INPUT -p 0x010c -j DROP',
  },
  {
    id: 'smurf-attack',
    name: 'Smurf Attack (ICMP Amplification L3)',
    category: 'advanced',
    layer: 'L3',
    protocol: 'ICMP',
    severity: 'HIGH',
    shortDesc: 'Gửi Ping giả mạo IP nạn nhân đến địa chỉ Directed Broadcast khiến cả mạng dội ngược bão phản hồi.',
    mechanism: 'Kẻ tấn công gửi gói ICMP Echo Request với địa chỉ IP NGUỒN là IP của nạn nhân, nhưng IP ĐÍCH lại là địa chỉ Directed Broadcast của mạng LAN trung gian (ví dụ: `192.168.1.255`). Tất cả 254 máy tính trong mạng nhận được gói ping broadcast sẽ đồng loạt gửi lại 254 gói ICMP Echo Reply về duy nhất IP của nạn nhân.',
    impact: 'Hệ số khuếch đại (Amplification factor) lên tới hàng trăm lần làm nghẹt băng thông vào của máy nạn nhân và khiến card mạng bị treo cứng.',
    defenseTechnology: 'No IP Directed-Broadcast & Ingress Filtering',
    mitigation: 'Vô hiệu hóa tính năng chuyển tiếp directed broadcast trên tất cả các cổng router (no ip directed-broadcast là mặc định trên Cisco IOS hiện đại).',
    ciscoCommand: 'interface GigabitEthernet0/0\n no ip directed-broadcast',
    linuxCommand: 'sudo sysctl -w net.ipv4.icmp_echo_ignore_broadcasts=1\necho "1" | sudo tee /proc/sys/net/ipv4/icmp_echo_ignore_broadcasts',
  },
  {
    id: 'land-attack',
    name: 'Land Attack (Identical IP/Port Loop L4)',
    category: 'advanced',
    layer: 'L4',
    protocol: 'TCP',
    severity: 'HIGH',
    shortDesc: 'Gửi TCP SYN với Source IP/Port trùng hoàn toàn Destination IP/Port của mục tiêu.',
    mechanism: 'Kẻ tấn công tạo một gói tin TCP [SYN] đặc biệt, trong đó Source IP = Destination IP (ví dụ: 192.168.1.10) và Source Port = Destination Port (ví dụ: 80). Khi hệ điều hành nạn nhân nhận gói tin này, nó cố gắng phản hồi gói [SYN, ACK] cho chính bản thân mình trên cùng một socket, rơi vào vòng lặp vô tận tiêu thụ 100% thời gian xử lý của nhân kernel.',
    impact: 'Kernel Panic hoặc crash hoàn toàn ngăn xếp TCP/IP của máy chủ, bắt buộc phải khởi động lại máy bằng nút nguồn vật lý.',
    defenseTechnology: 'Stateful Firewall Inspection & Anti-Spoofing ACLs',
    mitigation: 'Cấu hình Tường lửa hoặc Router kiểm tra và hủy bỏ ngay lập tức bất kỳ gói tin nào có Source IP trùng Destination IP hoặc Source IP thuộc dải nội bộ đi vào từ ngoài Internet.',
    ciscoCommand: 'access-list 105 deny ip host 192.168.1.10 host 192.168.1.10\naccess-list 105 permit ip any any\ninterface GigabitEthernet0/0\n ip access-group 105 in',
    linuxCommand: 'sudo iptables -A INPUT -s 192.168.1.10 -d 192.168.1.10 -j DROP\nsudo iptables -A INPUT -m addrtype --src-type LOCAL -j DROP',
  },
  {
    id: 'teardrop-attack',
    name: 'Teardrop Attack (Fragment Offset Overlap L3)',
    category: 'advanced',
    layer: 'L3',
    protocol: 'ATTACK',
    severity: 'HIGH',
    shortDesc: 'Gửi các phân mảnh IP bị chồng lấn offset và sai kích thước, khiến giải thuật ghép gói bị crash.',
    mechanism: 'Khi dữ liệu vượt quá MTU (1500 bytes), IP sẽ chia nhỏ thành các phân mảnh (Fragments) với trường Fragment Offset. Kẻ tấn công cố tình sửa đổi Offset của mảnh thứ 2 sao cho nó đè lên (overlap) vùng nhớ của mảnh thứ nhất (ví dụ mảnh 1: byte 0-99, mảnh 2: byte 50-149). Giải thuật tái ghép nối (reassembly algorithm) của hệ điều hành tính toán sai độ dài bộ đệm buffer gây tràn số âm hoặc memory corruption.',
    impact: 'Gây lỗi Blue Screen of Death (BSOD) trên Windows hoặc Kernel Panic trên Linux, máy chủ lập tức khởi động lại đột ngột.',
    defenseTechnology: 'Virtual Reassembly & Fragment Inspection',
    mitigation: 'Bật tính năng IP Virtual Reassembly trên Router/Firewall để lắp ráp và kiểm tra tính toàn vẹn của tất cả các mảnh trước khi chuyển tiếp cho máy chủ.',
    ciscoCommand: 'interface GigabitEthernet0/0\n ip virtual-reassembly in max-fragments 16 timeout 5',
    linuxCommand: 'sudo sysctl -w net.ipv4.ipfrag_high_thresh=262144\nsudo sysctl -w net.ipv4.ipfrag_low_thresh=196608',
  },
  {
    id: 'ospf-route-injection',
    name: 'Rogue OSPF LSA Route Injection (L3)',
    category: 'advanced',
    layer: 'L3',
    protocol: 'OSPF',
    severity: 'CRITICAL',
    shortDesc: 'Phát tán gói OSPF LSA giả mạo chèn tuyến đường đen (Blackhole) bẻ hướng lưu lượng toàn mạng WAN.',
    mechanism: 'Nếu mạng định tuyến động OSPF không bật xác thực mật khẩu, kẻ tấn công cắm vào switch có thể gửi các gói OSPF Hello giả mạo để thiết lập quan hệ láng giềng (Adjacency), sau đó bơm gói tin Link-State Advertisement (LSA Type 1/Type 5) quảng bá dải mạng nhạy cảm (10.0.0.0/8) với Metric bằng 1 (độ ưu tiên cao nhất).',
    impact: 'Toàn bộ bảng định tuyến của tất cả các router trong vùng OSPF Area 0 bị cập nhật sai lệch, lưu lượng bị hút về máy hacker để nghe lén hoặc rơi vào hố đen (Blackhole) làm mất kết nối toàn bộ hệ thống doanh nghiệp.',
    defenseTechnology: 'OSPF MD5 / SHA-256 Cryptographic Authentication',
    mitigation: 'Cấu hình OSPF cryptographic authentication trên toàn bộ interface router và bật tính năng passive-interface trên các cổng nối xuống máy trạm người dùng.',
    ciscoCommand: 'router ospf 1\n passive-interface default\n no passive-interface GigabitEthernet0/0\ninterface GigabitEthernet0/0\n ip ospf authentication message-digest\n ip ospf message-digest-key 1 md5 CiscoSecurePass123',
    linuxCommand: 'sudo vtysh\nconfigure terminal\ninterface eth0\nip ospf authentication message-digest\nip ospf message-digest-key 1 md5 SecretOspfPass\nend',
  },
  {
    id: 'bgp-route-hijacking',
    name: 'BGP Route Hijacking / Prefix Hijacking (L3 WAN)',
    category: 'advanced',
    layer: 'L3',
    protocol: 'BGP',
    severity: 'CRITICAL',
    shortDesc: 'Quảng bá tiền tố mạng IP giả mạo có độ dài chi tiết hơn (/24 vs /22), hút sạch lưu lượng Internet toàn cầu về máy chủ hacker.',
    mechanism: 'Hacker dựng một BGP Autonomous System giả mạo (Rogue AS) rồi phát các bản tin BGP UPDATE quảng bá các dải IP của dịch vụ lớn với tiền tố mạng chi tiết hơn (ví dụ /24 thay vì /22). Theo nguyên tắc Longest Prefix Match (LPM) của BGP, các router biên ISP trên khắp thế giới tự động bẻ toàn bộ luồng dữ liệu sang AS của hacker.',
    impact: 'Làm mất kết nối dịch vụ trên diện rộng toàn cầu, hacker có thể nghe lén mật khẩu, cấp chứng chỉ SSL giả mạo hoặc âm thầm chuyển tiếp dữ liệu sau khi sửa đổi (Traffic Interception & Wiretapping).',
    defenseTechnology: 'RPKI (Resource Public Key Infrastructure) & ROA Validation',
    mitigation: 'Triển khai ký số xác thực nguồn gốc định tuyến RPKI Route Origin Authorization (ROA), kết hợp bộ lọc Prefix-list và AS-Path Filter nghiêm ngặt trên các cổng biên eBGP peering.',
    ciscoCommand: 'router bgp 65001\n bgp rpki server tcp 10.0.0.100 port 3323\n address-family ipv4\n  bgp rpki validate\n  neighbor 10.0.0.2 route-map RPKI-FILTER in',
    linuxCommand: 'sudo vtysh\nconfigure terminal\nrouter bgp 65001\nrpki\nrpki polling_period 1000\nrpki cache 10.0.0.100 3323 preference 1\nexit\nend',
  },
];

// Map lookup helper
export const ATTACK_MAP = new Map<AttackType, CyberAttackDefinition>(
  CYBER_ATTACKS.map((a) => [a.id, a])
);

// ==========================================
// ATTACK EXECUTION & IMPACT CALCULATOR
// ==========================================

export class CyberAttackEngine {
  /**
   * Execute an attack simulation against a target device
   */
  public static executeAttack(
    attackId: AttackType,
    attacker: NetworkDevice,
    target: NetworkDevice,
    devices: NetworkDevice[],
    links: NetworkLink[]
  ): AttackResult {
    const def = ATTACK_MAP.get(attackId);
    if (!def) {
      throw new Error(`Attack ${attackId} not found`);
    }

    // Check if target or intermediate devices have defense active
    const isDefenseOn = !!target.securityDefenseActive;
    
    // Check if an intermediate firewall exists with ACL rules
    const intermediateFirewall = devices.find(
      (d) => d.type === 'firewall' && d.securityDefenseActive
    );

    let blockedByDefense = false;
    let defenseTriggered = '';
    let success = true;
    let cpuDelta = 0;
    let ramDelta = 0;
    let statusChange: 'normal' | 'under-attack' | 'compromised' | 'offline' = 'under-attack';
    let message = '';

    // If target has defense shield enabled
    if (isDefenseOn || intermediateFirewall) {
      blockedByDefense = true;
      success = false;
      statusChange = 'normal';
      defenseTriggered = def.defenseTechnology;
      message = `🛡️ Cuộc tấn công [${def.name}] đã bị CHẶN ĐỨNG bởi tính năng phòng thủ [${def.defenseTechnology}]!`;
      cpuDelta = 5;
      ramDelta = 2;
    } else {
      // Defense is OFF -> Attack succeeds with severe impacts!
      success = true;
      blockedByDefense = false;

      switch (attackId) {
        case 'syn-flood':
          cpuDelta = 85;
          ramDelta = 60;
          statusChange = 'offline';
          message = `💥 TẤN CÔNG THÀNH CÔNG! [${target.hostname}] bị tràn hàng đợi kết nối TCP SYN Backlog. CPU đạt 100%, máy chủ rơi vào trạng thái ngắt kết nối DoS!`;
          break;
        case 'arp-spoofing':
          cpuDelta = 20;
          ramDelta = 10;
          statusChange = 'compromised';
          target.isArpPoisoned = true;
          message = `⚠️ NGUY HIỂM! Bảng ARP của [${target.hostname}] đã bị nhiễm độc! Default Gateway hiện đang trỏ về MAC của Hacker (${attacker.ports[0]?.macAddress || 'Hacker-MAC'}). Toàn bộ gói tin bị nghe lén (MITM)!`;
          break;
        case 'cam-table-overflow':
          cpuDelta = 65;
          ramDelta = 80;
          statusChange = 'compromised';
          target.isCamOverflowed = true;
          message = `💥 BẢNG CAM ĐÃ ĐẦY! Switch [${target.hostname}] bị tràn 4096 địa chỉ MAC và rơi vào chế độ Fail-Open (Hub Mode). Toàn bộ gói tin chuyển mạch đang bị phát tán công khai ra mọi cổng!`;
          break;
        case 'vlan-hopping':
          cpuDelta = 15;
          ramDelta = 10;
          statusChange = 'compromised';
          message = `⚠️ XÂM NHẬP THÀNH CÔNG! Gói tin gắn thẻ đôi Double 802.1Q đã nhảy xuyên qua ranh giới Native VLAN, thâm nhập trực tiếp vào phân vùng dữ liệu nội bộ của [${target.hostname}]!`;
          break;
        case 'stp-root-takeover':
          cpuDelta = 40;
          ramDelta = 30;
          statusChange = 'compromised';
          message = `🚨 CƯỚP QUYỀN ROOT BRIDGE! Gói tin BPDU Priority=0 của Hacker đã ép Switch [${target.hostname}] hạ cấp nhường quyền Root Bridge. Cây Spanning Tree bị tái định tuyến đi qua máy tấn công!`;
          break;
        case 'dhcp-starvation':
          cpuDelta = 50;
          ramDelta = 45;
          statusChange = 'under-attack';
          message = `💥 VÉT CẠN IP! Toàn bộ dải IP pool trên [${target.hostname}] đã bị chiếm dụng sạch. Các máy tính con mới trong mạng không thể lấy được địa chỉ IP hợp lệ!`;
          break;
        case 'dns-cache-poisoning':
          cpuDelta = 25;
          ramDelta = 20;
          statusChange = 'compromised';
          message = `⚠️ ĐẦU ĐỘC DNS THÀNH CÔNG! Bản ghi tên miền trên [${target.hostname}] đã bị chèn địa chỉ IP máy chủ lừa đảo. Người dùng đang bị chuyển hướng!`;
          break;
        case 'ping-of-death':
          cpuDelta = 95;
          ramDelta = 40;
          statusChange = 'offline';
          message = `💥 NGHẼN MẠNG TOÀN DIỆN! Bão gói tin ICMP kích thước lớn làm nghẽn đường truyền và treo CPU của [${target.hostname}]!`;
          break;
        case 'slowloris':
          cpuDelta = 40;
          ramDelta = 75;
          statusChange = 'offline';
          message = `💥 TỆ LIỆT WEB SERVER! Hàng trăm kết nối HTTP treo của Slowloris đã chiếm dụng trọn bộ thread pool của Nginx trên [${target.hostname}]. Mã phản hồi HTTP 503 Service Unavailable!`;
          break;
        case 'land-attack':
          cpuDelta = 99;
          ramDelta = 90;
          statusChange = 'offline';
          message = `💥 HỆ ĐIỀU HÀNH BỊ CRASH! [${target.hostname}] nhận gói tin Land Attack với Source IP/Port = Destination IP/Port, tự gửi phản hồi cho chính mình vào vòng lặp vô tận!`;
          break;
        case 'teardrop-attack':
          cpuDelta = 90;
          ramDelta = 85;
          statusChange = 'offline';
          message = `💥 KERNEL PANIC! Lỗi phân mảnh IP Offset Overlap khiến thuật toán ghép nối gói tin trên [${target.hostname}] bị sập, máy chủ khởi động lại!`;
          break;
        case 'ospf-route-injection':
          cpuDelta = 35;
          ramDelta = 30;
          statusChange = 'compromised';
          message = `🚨 HIJACK TUYẾN ĐƯỜNG WAN! Tuyến đường giả mạo đã được bơm thành công vào bảng định tuyến OSPF của [${target.hostname}]. Lưu lượng bị hút về máy Hacker!`;
          break;
        case 'bgp-route-hijacking':
          cpuDelta = 45;
          ramDelta = 40;
          statusChange = 'compromised';
          message = `🚨 CƯỚP ĐƯỜNG ĐỊNH TUYẾN TOÀN CẦU (BGP PREFIX HIJACKING)! Rogue AS 66666 đã phát tán bản tin BGP UPDATE với tiền tố /24 chi tiết hơn. Bảng định tuyến BGP của [${target.hostname}] bị chuyển hướng, lưu lượng Internet bị đánh chặn (Man-in-the-Middle WAN)!`;
          break;
        default:
          cpuDelta = 60;
          ramDelta = 40;
          statusChange = 'under-attack';
          message = `⚠️ Cuộc tấn công [${def.name}] đã thâm nhập thành công vào mục tiêu [${target.hostname}]!`;
          break;
      }
    }

    // Generate simulated attack packets for visualization
    const generatedPackets = this.generateAttackPackets(
      attackId,
      attacker,
      target,
      blockedByDefense,
      links
    );

    return {
      attackId,
      attackerId: attacker.id,
      targetId: target.id,
      success,
      blockedByDefense,
      defenseTriggered: blockedByDefense ? defenseTriggered : undefined,
      message,
      cpuDelta,
      ramDelta,
      statusChange,
      generatedPackets,
    };
  }

  /**
   * Generate visual attack packets traveling between devices
   */
  public static generateAttackPackets(
    attackId: AttackType,
    attacker: NetworkDevice,
    target: NetworkDevice,
    isBlocked: boolean,
    links: NetworkLink[]
  ): PacketPdu[] {
    const def = ATTACK_MAP.get(attackId);
    const packets: PacketPdu[] = [];
    const now = Date.now();

    // Find direct or indirect link
    const link = links.find(
      (l) =>
        (l.fromDeviceId === attacker.id && l.toDeviceId === target.id) ||
        (l.fromDeviceId === target.id && l.toDeviceId === attacker.id)
    ) || links[0];

    const linkId = link ? link.id : 'atk-link-virtual';
    const attackerPort = attacker.ports[0]?.name || 'eth0';
    const targetPort = target.ports[0]?.name || 'eth0';
    const attackerMac = attacker.ports[0]?.macAddress || '00:0c:29:66:66:66';
    const targetMac = target.ports[0]?.macAddress || '00:0c:29:aa:bb:cc';
    const attackerIp = attacker.ports[0]?.ipAddress || '192.168.1.66';
    const targetIp = target.ports[0]?.ipAddress || '192.168.1.1';

    const packetCount = isBlocked ? 3 : 8;

    for (let i = 0; i < packetCount; i++) {
      let summary = '';
      if (attackId === 'syn-flood') {
        const fakeIp = `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254 + 1)}`;
        summary = `[ATTACK] TCP [SYN] src=${fakeIp}:${40000 + i} dst=${targetIp}:80 (Seq=0x${i}abc)`;
      } else if (attackId === 'arp-spoofing') {
        summary = `[ATTACK] ARP Reply (Poison): 192.168.1.1 is at ${attackerMac} (Claimed Gateway MAC)`;
      } else if (attackId === 'cam-table-overflow') {
        const randMac = `00:50:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}`;
        summary = `[ATTACK] CAM Overflow: Frame with random Source MAC ${randMac}`;
      } else if (attackId === 'vlan-hopping') {
        summary = `[ATTACK] 802.1Q Double Tag: Outer VLAN=1 (Native) -> Inner VLAN=20 (Target)`;
      } else if (attackId === 'stp-root-takeover') {
        summary = `[ATTACK] STP BPDU Root Claim: Priority=0, Root ID=00:00:00:00:00:01`;
      } else if (attackId === 'land-attack') {
        summary = `[ATTACK] Land Attack: TCP [SYN] src=${targetIp}:80 dst=${targetIp}:80 (Identical IP/Port Loop)`;
      } else if (attackId === 'teardrop-attack') {
        summary = `[ATTACK] Teardrop: IP Fragment Overlap (Frag 1: Offset=0 Len=100, Frag 2: Offset=40 Len=80)`;
      } else if (attackId === 'smurf-attack') {
        summary = `[ATTACK] Smurf Amplification: ICMP Echo to 192.168.1.255 spoofing src=${targetIp}`;
      } else if (attackId === 'bgp-route-hijacking') {
        summary = `[ATTACK] BGP UPDATE (Hijack): NLRI=192.168.1.0/24 AS_PATH=66666 (Falsified Origin Prefix)`;
      } else {
        summary = `[ATTACK] ${def?.name || 'Malicious Payload'} -> ${targetIp}`;
      }

      packets.push({
        id: createAttackPacketId(attackId, i),
        timestamp: now + i * 200,
        currentDeviceId: attacker.id,
        targetDeviceId: target.id,
        fromPort: attackerPort,
        toPort: targetPort,
        linkId,
        protocol: 'ATTACK',
        color: isBlocked ? '#f59e0b' : PROTOCOL_COLORS.ATTACK,
        summary: isBlocked ? `[BLOCKED BY DEFENSE] ${summary}` : summary,
        layer1: {
          inPort: attackerPort,
          outPort: targetPort,
          media: 'Copper 100BASE-TX (Exploit Transmission)',
          bandwidth: '100 Mbps',
        },
        layer2: {
          sourceMac: attackerMac,
          destMac: targetMac,
          etherType: '0x0800 (IPv4)',
        },
        layer3: {
          version: 4,
          ttl: 64,
          protocol: 6,
          sourceIp: attackerIp,
          destIp: targetIp,
          flags: '0x00',
        },
        layer4: {
          sourcePort: 45000 + i,
          destPort: 80,
          protocolName: 'TCP',
          flags: { syn: true },
        },
        layer7: {
          application: 'Cyber Attack Vector',
          details: {
            attackName: def?.name,
            severity: def?.severity,
            blocked: isBlocked,
            impact: def?.impact,
          },
          payloadString: summary,
        },
        rawHex: `ffffffffffff${attackerMac.replace(/:/g, '')}08004500003cdeadbeef4006c0a80142c0a80101`,
        progress: 0,
        completed: false,
      });
    }

    return packets;
  }
}
