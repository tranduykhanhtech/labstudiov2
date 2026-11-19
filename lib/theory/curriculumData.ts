import { NetworkDevice, NetworkLink, CableType } from '@/types/network';
import { createDefaultDevice } from '@/lib/labs/labData';

export interface TheoryChapter {
  id: string;
  title: string;
  badge: string;
  contentMarkdown: string;
}

export interface WiringConnection {
  fromDevice: string;
  fromPort: string;
  cableType: CableType;
  cableLabel: string;
  toDevice: string;
  toPort: string;
  purpose: string;
}

export interface TopologyTemplate {
  id: string;
  title: string;
  badge: string;
  description: string;
  wiringTable: WiringConnection[];
  explanationMarkdown: string;
  createTopology: () => { devices: NetworkDevice[]; links: NetworkLink[] };
}

// ==========================================
// 1. GIÁO TRÌNH LÝ THUYẾT CHI TIẾT
// ==========================================

export const THEORY_CHAPTERS: TheoryChapter[] = [
  {
    id: 'chap-1',
    title: 'Chương 1: Tổng Quan Mô Hình OSI 7 Lớp & TCP/IP 4 Tầng',
    badge: 'Kiến Trúc Cốt Lõi',
    contentMarkdown: `### 1. Bản Chất của Mô Hình OSI và TCP/IP
Trong truyền thông dữ liệu, không có thiết bị nào có thể truyền trực tiếp một bức ảnh hay trang web thành dòng điện nếu không trải qua quá trình phân lớp chuẩn hóa.

Mô hình **OSI (Open Systems Interconnection)** gồm 7 tầng logic:
- **Tầng 7 - Application (Ứng dụng)**: Giao tiếp trực tiếp với người dùng và phần mềm (HTTP, DNS, DHCP, FTP, Telnet).
- **Tầng 6 - Presentation (Trình diễn)**: Mã hóa dữ liệu, nén và mã hóa bảo mật (ASCII, JPEG, TLS/SSL).
- **Tầng 5 - Session (Phiên)**: Thiết lập, duy trì và giải phóng phiên truyền thông giữa các ứng dụng.
- **Tầng 4 - Transport (Vận chuyển)**: Truyền dữ liệu đầu-cuối tin cậy (TCP) hoặc tốc độ cao (UDP). PDU là **Segment**.
- **Tầng 3 - Network (Mạng)**: Định tuyến gói tin qua các mạng con khác nhau bằng địa chỉ logic IPv4/IPv6. Thiết bị chính: **Router, L3 Switch, Firewall**. PDU là **Packet**.
- **Tầng 2 - Data Link (Liên kết dữ liệu)**: Truyền khung tin cậy giữa 2 thiết bị trong cùng một mạng cục bộ (LAN) bằng địa chỉ vật lý MAC. Thiết bị chính: **Switch L2, Bridge**. PDU là **Frame**.
- **Tầng 1 - Physical (Vật lý)**: Chuyển đổi dữ liệu thành xung điện, ánh sáng hoặc sóng radio truyền trên dây cáp. Thiết bị chính: **Hub, Repeater, Cáp RJ45, Card mạng NIC**. PDU là **Bit**.

---

### 2. Quá Trình Đóng Gói (Encapsulation) & Mở Gói (Decapsulation)
1. **Phía Gửi (Encapsulation - Đi từ trên xuống dưới L7 -> L1)**:
   - Dữ liệu ứng dụng (HTTP GET) được sinh ra ở L7.
   - L4 gắn thêm **TCP Header** (chứa Source Port, Destination Port) tạo thành **Segment**.
   - L3 gắn thêm **IP Header** (chứa Source IP, Destination IP, TTL) tạo thành **Packet**.
   - L2 gắn thêm **Ethernet Header** (chứa Source MAC, Destination MAC, EtherType) và FCS đuôi tạo thành **Frame**.
   - L1 mã hóa Frame thành các bit nhị phân (0 và 1) phát tín hiệu qua cáp đồng hoặc sóng Wi-Fi.
2. **Phía Nhận (Decapsulation - Đi từ dưới lên trên L1 -> L7)**:
   - Card mạng nhận bit -> L2 kiểm tra MAC đích -> L3 bóc tách IP header -> L4 kiểm tra Port -> L7 đưa dữ liệu vào ứng dụng (Web Server / Trình duyệt).`,
  },
  {
    id: 'chap-2',
    title: 'Chương 2: Tầng 1 Vật Lý — Cáp Mạng RJ45, Chuẩn T568A/B & Đo 8 Đèn LED',
    badge: 'Thực Hành Cáp',
    contentMarkdown: `### 1. Cấu Tạo Dây Cáp Mạng UTP (Unshielded Twisted Pair)
Cáp mạng chuẩn Cat5e/Cat6 gồm **8 sợi dây đồng** được xoắn lại thành **4 cặp** để triệt tiêu nhiễu điện từ (Crosstalk):
- Cặp 1: Trắng-Cam & Cam
- Cặp 2: Trắng-Xanh lá & Xanh lá
- Cặp 3: Trắng-Xanh dương & Xanh dương
- Cặp 4: Trắng-Nâu & Nâu

Hạt mạng **RJ45 (8P8C)** có 8 chân mạ vàng đánh số từ **1 đến 8** (tính từ trái qua phải khi nhìn mặt tiếp xúc chân đồng, lẫy gài hướng xuống dưới).

---

### 2. Hai Chuẩn Xếp Dây Quốc Tế: T568A và T568B
| Chân (Pin) | Chuẩn T568A | Chuẩn T568B (Phổ biến nhất tại VN) |
| :--- | :--- | :--- |
| **Chân 1** | Trắng - Xanh lá | **Trắng - Cam** |
| **Chân 2** | Xanh lá | **Cam** |
| **Chân 3** | Trắng - Cam | **Trắng - Xanh lá** |
| **Chân 4** | Xanh dương | **Xanh dương** |
| **Chân 5** | Trắng - Xanh dương | **Trắng - Xanh dương** |
| **Chân 6** | Cam | **Xanh lá** |
| **Chân 7** | Trắng - Nâu | **Trắng - Nâu** |
| **Chân 8** | Nâu | **Nâu** |

---

### 3. Quy Tắc Nối Cáp Giữa Các Thiết Bị (Vô Cùng Quan Trọng)
1. **Cáp Thẳng (Straight-Through)**:
   - Cách bấm: Cả 2 đầu bấm cùng một chuẩn (**T568B - T568B** hoặc **T568A - T568A**).
   - Ứng dụng: Kết nối hai thiết bị **KHÁC TẦNG** trong mô hình mạng:
     - **PC / Laptop / Server nối với Switch**
     - **Router nối với Switch**
     - **Switch nối với Hub**
2. **Cáp Chéo (Crossover)**:
   - Cách bấm: Một đầu bấm **T568A**, một đầu bấm **T568B** (Đảo chân 1<->3 và 2<->6 giữa Tx và Rx).
   - Ứng dụng: Kết nối hai thiết bị **CÙNG TẦNG** (cùng loại cổng truyền/nhận):
     - **Switch nối với Switch**
     - **PC nối với PC**
     - **Router nối với Router**
     - **PC nối trực tiếp với Router** (vì cổng Ethernet của PC và Router cùng phát xung trên chân 1, 2)
3. **Cáp Console (Rollover)**:
   - Cách bấm: Chân 1 nối sang 8, 2 sang 7, 3 sang 6, 4 sang 5...
   - Ứng dụng: Cắm từ cổng Serial/USB của máy tính vào cổng **Console (RJ45)** của Router/Switch Cisco để cấu hình thiết bị ban đầu.

---

### 4. Cách Đọc Máy Đo Cáp Mạng 8 Đèn LED (Master & Remote)
- **Cáp Thẳng Đạt Chuẩn**: Cả bộ phát Master và bộ thu Remote đều sáng đèn xanh chạy tuần tự từ **1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8** hoàn toàn thẳng hàng.
- **Cáp Chéo**: Bộ Master sáng 1..8, bộ Remote sẽ sáng theo thứ tự: **3 -> 6 -> 1 -> 4 -> 5 -> 2 -> 7 -> 8**.
- **Lỗi Bấm Nhầm Chân (Miswire)**: Đèn sáng nhảy cóc lệch pha hoặc đỏ.
- **Lỗi Đứt Sợi (Open Circuit)**: Đèn tại vị trí chân đứt không sáng.`,
  },
  {
    id: 'chap-3',
    title: 'Chương 3: Tầng 2 Liên Kết — Switch, Bảng MAC, VLAN 802.1Q & STP',
    badge: 'Chuyển Mạch L2',
    contentMarkdown: `### 1. Địa Chỉ MAC (Media Access Control) & Bảng CAM
- Mỗi cổng card mạng Ethernet có một địa chỉ MAC duy nhất toàn cầu gồm **48 bit (6 byte)** biểu diễn bằng 12 ký tự hex (ví dụ: \`00:50:79:66:68:01\`).
- **Nguyên lý Switch học địa chỉ MAC (CAM Table)**:
  1. Khi một Frame đến cổng Fa0/1, Switch đọc **MAC nguồn** và lưu vào bảng CAM: *"Thiết bị MAC A đang nằm ở cổng Fa0/1"*.
  2. Switch đọc **MAC đích**:
     - Nếu MAC đích đã có trong bảng CAM -> Switch chỉ chuyển tiếp Frame ra duy nhất cổng đó (Unicast Forwarding).
     - Nếu MAC đích chưa có trong bảng CAM hoặc là Broadcast (\`ff:ff:ff:ff:ff:ff\`) -> Switch nhân bản Frame gửi ra **TẤT CẢ các cổng còn lại** (Flooding).

---

### 2. Mạng Ảo VLAN (Virtual Local Area Network)
- Mặc định toàn bộ cổng trên Switch thuộc **VLAN 1 (default)**, nghĩa là cùng nằm trong 1 miền quảng bá (Broadcast Domain).
- Khi chia VLAN (ví dụ VLAN 10 cho Kế Toán, VLAN 20 cho Kỹ Thuật):
  - Thiết bị ở VLAN 10 **hoàn toàn cách ly** với VLAN 20 ở tầng 2, không thể gửi tin broadcast làm nghẽn mạng của nhau.
- **Hai chế độ cổng Switch**:
  - **Cổng Access**: Dùng nối tới máy trạm (PC, Server, Printer). Cổng này chỉ thuộc về 1 VLAN duy nhất và gỡ bỏ nhãn tag trước khi truyền đến máy trạm.
  - **Cổng Trunk**: Dùng nối giữa **Switch với Switch** hoặc **Switch với Router**. Cổng Trunk cho phép nhiều VLAN đi qua cùng lúc bằng cách gắn thêm **nhãn tag IEEE 802.1Q (4 byte)** chứa VLAN ID.

---

### 3. Giao Thức Chống Vòng Lặp Spanning Tree Protocol (STP 802.1D)
- Khi nối dự phòng nhiều switch với nhau để tránh đứt cáp, vô tình sẽ tạo thành một **vòng lặp kín (Loop)**.
- Gói tin broadcast (như ARP) sẽ bị các switch flood qua lại liên tục theo vòng tròn, tạo ra **Cơn bão Broadcast (Broadcast Storm)** làm sập toàn bộ mạng LAN chỉ trong vài giây!
- **STP giải quyết thế nào?**
  1. Các Switch trao đổi gói tin BPDU để bầu chọn một Switch làm **Root Bridge**.
  2. Tính toán đường đi ngắn nhất về Root Bridge.
  3. Đặt một hoặc nhiều cổng dự phòng vào trạng thái **Blocking (Chặn - Đèn Hổ Phách/Cam)**.
  4. Khi đường truyền chính bị đứt, cổng Blocking sẽ tự động chuyển sang **Forwarding (Xanh lá)** sau 30-50 giây để duy trì kết nối.`,
  },
  {
    id: 'chap-4',
    title: 'Chương 4: Tầng 3 Mạng — IPv4, Subnetting, Router, NAT/PAT & Firewall',
    badge: 'Định Tuyến & Bảo Mật',
    contentMarkdown: `### 1. Địa Chỉ IPv4, Subnet Mask & Phân Chia Mạng Con (CIDR)
Địa chỉ IPv4 gồm **32 bit**, chia làm 4 octet (mỗi octet 8 bit từ 0 đến 255):
- **Network ID**: Xác định mạng con chung.
- **Host ID**: Xác định từng thiết bị cụ thể trong mạng đó.
- **Subnet Mask**: Dùng để phân tách phần Network và Host.

Ví dụ phổ biến:
- \`/24\` (Mask \`255.255.255.0\`): 24 bit mạng, 8 bit host -> $2^8 - 2 = 254$ địa chỉ khả dụng cho máy tính.
- \`/28\` (Mask \`255.255.255.240\`): 28 bit mạng, 4 bit host -> $2^4 - 2 = 14$ địa chỉ khả dụng.
- \`/30\` (Mask \`255.255.255.252\`): 30 bit mạng, 2 bit host -> $2^2 - 2 = 2$ địa chỉ (chuẩn chuyên dụng để nối điểm-điểm 2 Router).

---

### 2. Cổng Mặc Định (Default Gateway) & Định Tuyến (Routing)
- Khi PC1 (\`192.168.1.10\`) gửi tin cho PC2 (\`192.168.1.20\`) cùng mạng con: PC1 tự gửi trực tiếp qua tầng 2 (ARP lấy MAC của PC2 rồi gửi Frame).
- Khi PC1 (\`192.168.1.10\`) gửi tin cho Web Server (\`172.16.1.100\`) khác mạng con: PC1 không thể gửi trực tiếp, nó bắt buộc phải gửi gói tin đến địa chỉ **Default Gateway** (chính là cổng của Router \`192.168.1.1\`).
- **Router** nhận gói tin, bóc Frame L2, đọc IP đích ở L3, tra cứu **Bảng Định Tuyến (Routing Table)** theo thuật toán **So khớp tiền tố dài nhất (Longest Prefix Match - LPM)** để quyết định đẩy gói tin ra cổng nào.

---

### 3. Cơ Chế NAT / PAT (Network Address Translation)
- Dải IP Private (\`192.168.x.x\`, \`10.x.x.x\`, \`172.16.x.x\`) không thể định tuyến trên Internet toàn cầu.
- Router biên thực hiện **NAT quá tải (PAT - Port Address Translation)**:
  - Dịch chuyển hàng trăm IP Private nội bộ thành **duy nhất 1 địa chỉ IP Public** của nhà mạng bằng cách gán cho mỗi luồng kết nối một số Port ngẫu nhiên khác nhau.

---

### 4. Tường Lửa Firewall Cisco ASA & Phân Vùng DMZ
- **Vùng Inside**: Mạng LAN nội bộ tin cậy cao nhất (Security level 100).
- **Vùng Outside**: Internet bên ngoài, không an toàn (Security level 0).
- **Vùng DMZ (Demilitarized Zone)**: Vùng đệm chứa các máy chủ công khai như Web, Mail, DNS (Security level 50).
- **Luật ACL (Access Control List)**:
  - Cho phép máy từ Inside tự do đi ra Internet.
  - Ngăn chặn hoàn toàn các kết nối bất hợp pháp từ Outside chủ động đi vào Inside.
  - Chỉ cho phép Outside kết nối vào đúng Port 80/443 của Web Server đặt tại vùng DMZ.`,
  },
  {
    id: 'chap-5',
    title: 'Chương 5: Tầng 4 & 7 — TCP 3-Way Handshake, DHCP DORA, DNS & HTTP',
    badge: 'Ứng Dụng & Dịch Vụ',
    contentMarkdown: `### 1. Bắt Tay 3 Bước TCP (Transmission Control Protocol)
Khác với UDP gửi dữ liệu mà không cần biết đích có nhận được không, TCP đảm bảo dữ liệu truyền tải nguyên vẹn 100%:
1. **Bước 1 (SYN)**: Client gửi cờ \`SYN\` (Synchronize) với số thứ tự Sequence \`seq = x\`.
2. **Bước 2 (SYN-ACK)**: Server phản hồi cờ \`SYN\` và \`ACK\` với \`ack = x + 1\` và số thứ tự riêng \`seq = y\`.
3. **Bước 3 (ACK)**: Client gửi cờ \`ACK\` với \`ack = y + 1\`. Phiên truyền tin cậy được thiết lập (ESTABLISHED).

---

### 2. Quy Trình Cấp Phát IP Động DHCP (Quy Trình DORA)
Khi một máy tính (hoặc Laptop, Điện thoại) cắm cáp hoặc kết nối Wi-Fi, nó xin IP tự động qua 4 bước:
1. **Discover (Khám phá)**: Client chưa có IP (src \`0.0.0.0\`) gửi tin quảng bá Broadcast (dst \`255.255.255.255\`) hỏi: *"Có DHCP Server nào ở đây không?"*.
2. **Offer (Đề nghị)**: DHCP Server nhận tin, chọn 1 IP chưa ai dùng trong Pool (ví dụ \`192.168.1.50\`) gửi lại cho Client.
3. **Request (Yêu cầu)**: Client gửi tin xác nhận: *"Tôi muốn dùng địa chỉ 192.168.1.50 mà server vừa cấp!"*.
4. **Acknowledge (Xác nhận)**: Server gửi ACK cam kết cấp IP, kèm Subnet Mask, Default Gateway và DNS Server.

---

### 3. Dịch Vụ Phân Giải Tên Miền DNS (Domain Name System)
- Con người nhớ tên miền như \`netlab.edu\`, nhưng máy tính và Router chỉ hiểu địa chỉ IP \`192.168.1.100\`.
- Khi bạn gõ URL vào trình duyệt:
  1. Máy trạm gửi DNS Query (UDP Port 53) hỏi DNS Server: *"IP của netlab.edu là gì?"*.
  2. DNS Server tra cứu bảng bản ghi **A Record** và trả lời: *"\`netlab.edu\` tương ứng IP \`192.168.1.100\`"*.
  3. Trình duyệt dùng IP đó để khởi tạo kết nối TCP tới Web Server.

---

### 4. Giao Thức HTTP & Máy Chủ Nginx
- Sau khi có IP qua DNS và bắt tay TCP xong, trình duyệt gửi bản tin:
  \`\`\`http
  GET / HTTP/1.1
  Host: netlab.edu
  User-Agent: NetLabBrowser/1.0
  \`\`\`
- Máy chủ Nginx xử lý và phản hồi mã trạng thái **HTTP 200 OK** kèm theo toàn bộ mã nguồn HTML, CSS để trình duyệt hiển thị giao diện đẹp mắt cho người dùng.`,
  },
  {
    id: 'chap-6',
    title: 'Chương 6: Cẩm Nang 14 Thiết Bị Mạng & Sổ Tay Lệnh Cisco IOS + Ubuntu Bash',
    badge: 'Tra Cứu Lệnh',
    contentMarkdown: `### 1. Vai Trò 14 Thiết Bị Mạng Trên NetLab Studio
1. **Cisco Router (ISR 4331)**: Định tuyến giữa các mạng con khác nhau, xử lý NAT, chạy DHCP Relay, Sub-interface 802.1Q.
2. **Switch L3 Multilayer (Catalyst 3650)**: Chuyển mạch tốc độ phần cứng, định tuyến qua các cổng ảo SVI (\`interface vlan\`).
3. **Switch L2 (Catalyst 2960)**: Chuyển mạch tầng 2, chia VLAN, ngăn loop bằng STP.
4. **Wireless AP**: Phát sóng vô tuyến Wi-Fi 2.4/5GHz cho Laptop và Smartphone.
5. **Firewall Cisco ASA**: Lọc gói tin trạng thái, phân tách 3 vùng Inside, Outside, DMZ.
6. **Ubuntu Linux Server (Web/Nginx)**: Máy chủ web lưu file \`/var/www/html/index.html\`, phản hồi HTTP 200 OK.
7. **DNS Server**: Quản lý bản ghi A Record, phân giải tên miền thành IP.
8. **DHCP Server**: Cấp phát IP tự động, Gateway và DNS cho các client trong mạng.
9. **Syslog & NTP Server**: Máy chủ lưu nhật ký sự kiện hệ thống và đồng bộ đồng hồ mạng.
10. **Client Desktop PC**: Máy trạm có card Ethernet, CMD terminal và trình duyệt web.
11. **Laptop**: Card mạng kép Ethernet và card Wi-Fi không dây.
12. **Smartphone / Tablet**: Thiết bị di động kết nối Wi-Fi.
13. **Industrial IoT Gateway & Sensor**: Thiết bị đo nhiệt độ, độ ẩm và gửi viễn thám.
14. **Unmanaged Hub L1**: Bộ chia mạng tầng 1, nhân bản mọi bit nhận được ra tất cả các cổng (gây collision).

---

### 2. Sổ Tay Lệnh Cisco IOS Cốt Lõi
\`\`\`bash
Router> enable                         # Vào chế độ Privileged EXEC (dấu nhắc đổi sang #)
Router# configure terminal             # Vào cấu hình hệ thống (dấu nhắc đổi sang (config)#)
Router(config)# hostname R1            # Đổi tên thiết bị thành R1

# Cấu hình IP và mở cổng:
Router(config)# interface GigabitEthernet0/0/0
Router(config-if)# ip address 192.168.1.1 255.255.255.0
Router(config-if)# no shutdown        # Bật cổng chuyển sang trạng thái UP

# Cấu hình Định tuyến tĩnh (Static Route):
Router(config)# ip route 192.168.2.0 255.255.255.0 10.0.0.2

# Cấu hình VLAN & Trunk trên Switch:
Switch(config)# vlan 10
Switch(config-vlan)# name SALES
Switch(config)# interface FastEthernet0/1
Switch(config-if)# switchport mode access
Switch(config-if)# switchport access vlan 10
Switch(config)# interface FastEthernet0/24
Switch(config-if)# switchport mode trunk

# Các lệnh kiểm tra chẩn đoán:
Router# show ip interface brief       # Xem nhanh danh sách IP và trạng thái các cổng
Router# show ip route                 # Xem bảng định tuyến
Switch# show vlan brief               # Xem danh sách VLAN
Switch# show mac address-table        # Xem bảng địa chỉ MAC đã học
Router# show running-config           # Xem toàn bộ cấu hình đang chạy
\`\`\`

---

### 3. Sổ Tay Lệnh Ubuntu Linux Bash
\`\`\`bash
ip a                                   # Xem danh sách cổng mạng, địa chỉ MAC và IP
ip route                               # Xem bảng định tuyến kernel
ping -c 4 192.168.1.1                  # Gửi 4 gói tin ICMP Ping kiểm tra thông mạch
curl -v http://192.168.1.100           # Tải nội dung web HTTP và in header chi tiết
nslookup netlab.edu                    # Phân giải tên miền qua DNS Server
systemctl status nginx                 # Kiểm tra trạng thái máy chủ web Nginx
cat /var/www/html/index.html           # Xem nội dung trang web đang lưu trên server
arp -a                                 # Xem bộ nhớ đệm phân giải địa chỉ IP - MAC
\`\`\``,
  },
  {
    id: 'chap-7',
    title: 'Chương 7: An Ninh Mạng, 16 Kịch Bản Tấn Công & Kỹ Thuật Phòng Thủ Hardening',
    badge: 'An Ninh Mạng Chuyên Sâu',
    contentMarkdown: `## Chương 7: An Ninh Mạng Toàn Diện & Kỹ Thuật Tấn Công / Phòng Thủ

Trong kỷ nguyên mạng hiện đại, một kỹ sư hạ tầng mạng không chỉ cần biết cách cấu hình cho hệ thống thông suốt, mà bắt buộc phải hiểu rõ các lỗ hổng bảo mật giao thức để bảo vệ hệ thống trước các đòn tấn công mạng.

---

### 1. Bảng Ma Trận 16 Cuộc Tấn Công Mạng (Red Team Vector)

| Tên Cuộc Tấn Công | Tầng OSI | Giao Thức | Phân Loại | Hậu Quả & Tác Động | Công Nghệ Phòng Thủ (Blue Team) |
|---|---|---|---|---|---|
| **TCP SYN Flood** | L4 | TCP | Phổ biến | Tràn hàng đợi bán mở (SYN Backlog), CPU 100%, sập Web Server (DoS) | SYN Cookies, TCP Intercept, Rate Limiting |
| **ARP Spoofing / Poisoning** | L2 | ARP | Phổ biến | Đánh tráo MAC Gateway, nghe lén & đánh cắp mật khẩu (MITM) | Dynamic ARP Inspection (DAI), DHCP Snooping |
| **DHCP Starvation & Rogue DHCP** | L2/L7 | DHCP | Phổ biến | Vét cạn IP pool, cấp Gateway và DNS lừa đảo cho máy con | DHCP Snooping (Trusted Ports), Port Security |
| **DNS Cache Poisoning** | L7 | DNS | Phổ biến | Đầu độc bộ nhớ đệm DNS, chuyển hướng người dùng sang trang lừa đảo | DNSSEC, Source Port & Transaction ID Randomization |
| **Ping of Death / ICMP Flood** | L3 | ICMP | Phổ biến | Gói IP phân mảnh quá 65,535 bytes hoặc bão ping gây nghẽn băng thông | ICMP Rate-Limiting, Chặn IP Fragments bất thường |
| **Slowloris DoS** | L7 | HTTP | Phổ biến | Mở hàng trăm kết nối HTTP gửi header chậm chạp, chiếm trọn worker pool | Giảm Client Header Timeout, limit_conn Nginx |
| **Nmap SYN Port Scan** | L4 | TCP | Phổ biến | Quét ngầm dò tìm các cổng dịch vụ mở (21, 22, 53, 80, 443) | IDS/IPS Snort, Firewall Port-Scan Shun Blocker |
| **SSH / Telnet Brute-force** | L7 | SSH | Phổ biến | Dò quét mật khẩu từ điển nhằm chiếm quyền root terminal | Khóa đăng nhập sau 3 lần sai, SSH Key, Fail2ban |
| **SQL Injection** | L7 | HTTP | Phổ biến | Bơm mã \`' OR '1'='1\` trích xuất hoặc xóa sạch cơ sở dữ liệu web | Web Application Firewall (WAF), Prepared Statements |
| **CAM Table Overflow (MAC Flood)** | L2 | Ethernet | Chuyên sâu | Làm tràn bảng MAC CAM, ép Switch biến thành Hub phát tán gói tin | Port Security (Giới hạn MAC, Violation Shutdown) |
| **VLAN Hopping (Double Tagging)** | L2 | 802.1Q | Chuyên sâu | Lồng thẻ đôi (Outer Native + Inner Target) nhảy qua rào VLAN | Đổi Native VLAN sang VLAN phụ, vlan dot1q tag native |
| **STP Root Takeover (BPDU Spoof)** | L2 | STP | Chuyên sâu | Gửi BPDU Priority=0 cướp ngôi Root Bridge, bẻ hướng chuyển mạch | STP BPDU Guard, Root Guard trên cổng Edge |
| **Smurf Attack** | L3 | ICMP | Chuyên sâu | Giả mạo IP nạn nhân ping địa chỉ Broadcast (.255) khuếch đại bão reply | no ip directed-broadcast trên interface Router |
| **Land Attack** | L4 | TCP | Chuyên sâu | Gói SYN có Source IP/Port = Destination IP/Port gây crash kernel | Stateful Firewall Inspection, Anti-Spoofing ACLs |
| **Teardrop Attack** | L3 | IPv4 | Chuyên sâu | Phân mảnh IP Offset bị chồng lấn gây lỗi tràn bộ đệm BSOD/Kernel Panic | IP Virtual Reassembly trên Router/Firewall |
| **Rogue OSPF LSA Injection** | L3 | OSPF | Chuyên sâu | Bơm tuyến đường giả mạo vào OSPF Area 0, cướp quyền định tuyến WAN | OSPF Message-Digest MD5 / SHA-256 Authentication |

---

### 2. Kỹ Thuật Phòng Thủ Cơ Bản Đến Nâng Cao (Cisco Hardening Guide)

#### A. Khắc chế Tấn công Tầng 2 (L2 Security Hardening):
\`\`\`bash
# 1. Chống CAM Table Overflow (Port Security):
Switch(config)# interface range FastEthernet0/1 - 24
Switch(config-if-range)# switchport mode access
Switch(config-if-range)# switchport port-security
Switch(config-if-range)# switchport port-security maximum 2
Switch(config-if-range)# switchport port-security mac-address sticky
Switch(config-if-range)# switchport port-security violation shutdown

# 2. Chống STP Root Takeover (BPDU Guard):
Switch(config)# spanning-tree portfast bpduguard default
Switch(config)# interface range FastEthernet0/1 - 24
Switch(config-if-range)# spanning-tree portfast
Switch(config-if-range)# spanning-tree bpduguard enable

# 3. Chống Rogue DHCP Server (DHCP Snooping):
Switch(config)# ip dhcp snooping
Switch(config)# ip dhcp snooping vlan 1,10,20
Switch(config)# interface GigabitEthernet0/1       # Cổng nối lên Router DHCP hợp lệ
Switch(config-if)# ip dhcp snooping trust

# 4. Chống ARP Spoofing / Poisoning (Dynamic ARP Inspection - DAI):
Switch(config)# ip arp inspection vlan 1,10,20
Switch(config)# interface GigabitEthernet0/1
Switch(config-if)# ip arp inspection trust

# 5. Chống VLAN Hopping:
Switch(config)# vlan dot1q tag native
Switch(config)# interface GigabitEthernet0/24      # Cổng Trunk
Switch(config-if)# switchport trunk native vlan 999
Switch(config-if)# switchport nonegotiate
\`\`\`

#### B. Khắc chế Tấn công Tầng 3 & 4 (L3/L4 Security Hardening):
\`\`\`bash
# 1. Chống Smurf Attack (Tắt Directed Broadcast):
Router(config)# interface GigabitEthernet0/0/0
Router(config-if)# no ip directed-broadcast

# 2. Chống Land Attack & IP Spoofing (Anti-Spoofing ACL):
Router(config)# access-list 105 deny ip host 192.168.1.1 host 192.168.1.1
Router(config)# access-list 105 permit ip any any
Router(config)# interface GigabitEthernet0/0/0
Router(config-if)# ip access-group 105 in

# 3. Chống Teardrop Attack (IP Virtual Reassembly):
Router(config)# interface GigabitEthernet0/0/0
Router(config-if)# ip virtual-reassembly in max-fragments 16

# 4. Bảo vệ OSPF Routing chống bơm đường đi độc hại (OSPF MD5 Auth):
Router(config)# router ospf 1
Router(config-router)# passive-interface default
Router(config-router)# no passive-interface GigabitEthernet0/0/0
Router(config)# interface GigabitEthernet0/0/0
Router(config-if)# ip ospf authentication message-digest
Router(config-if)# ip ospf message-digest-key 1 md5 CiscoSecretKey123
\`\`\`

---

### 3. Tra Cứu Danh Mục Toàn Bộ Giao Thức Mạng (L2 đến L7)

- **Tầng 2**:
  - \`ARP\` (Address Resolution Protocol): Phân giải IP -> MAC.
  - \`STP / RSTP\` (IEEE 802.1D / 802.1w): Chống loop chuyển mạch.
  - \`802.1Q\`: Gắn thẻ VLAN Trunking (12-bit VLAN ID).
  - \`CDP / LLDP\`: Tự động khám phá thông số thiết bị lân cận.
- **Tầng 3**:
  - \`IPv4\`: Giao thức mạng nền tảng Internet (32-bit IP, TTL, Checksum).
  - \`ICMP\` (Protocol 1): Báo lỗi và chẩn đoán kết nối.
  - \`OSPF\` (Protocol 89): Định tuyến động Link-State nội vùng.
  - \`RIPv2\` (UDP 520): Định tuyến động Distance-Vector theo số chặng (hop).
  - \`BGPv4\` (TCP 179): Định tuyến liên hệ thống tự trị Internet.
- **Tầng 4**:
  - \`TCP\` (Protocol 6): Bắt tay 3 bước, truyền tin cậy, kiểm soát nghẽn.
  - \`UDP\` (Protocol 17): Phi kết nối, độ trễ thấp tối đa.
- **Tầng 7**:
  - \`HTTP\` (TCP 80) / \`HTTPS\` (TCP 443): Truyền tải web văn bản thuần vs mã hóa TLS.
  - \`DNS\` (UDP/TCP 53): Phân giải tên miền.
  - \`DHCP\` (UDP 67/68): Cấp phát IP động 4 bước DORA.
  - \`SSH\` (TCP 22): Quản trị dòng lệnh mã hóa an toàn.
  - \`TELNET\` (TCP 23): Quản trị dòng lệnh cleartext cổ điển.
  - \`NTP\` (UDP 123): Đồng bộ đồng hồ thiết bị.
  - \`SNMP\` (UDP 161/162): Giám sát phần cứng và gửi cảnh báo trap.
  - \`SYSLOG\` (UDP 514): Gửi nhật ký sự kiện hệ thống.
  - \`FTP / TFTP\` (TCP 21 / UDP 69): Truyền tải file qua mạng.`,
  },
];

// ==========================================
// 2. BỘ SƯU TẬP 6 MÔ HÌNH MẪU KIẾN TRÚC
// ==========================================

export const TOPOLOGY_TEMPLATES: TopologyTemplate[] = [
  {
    id: 'topo-1',
    title: 'Mô hình 1: Mạng SOHO Căn Bản (PC - Switch - Router - Web Server)',
    badge: 'Mô Hình Căn Bản',
    description: 'Mô hình kinh điển văn phòng nhỏ. Máy tính kết nối vào Switch L2, đi qua Gateway Router Cisco để truy cập vào Máy chủ Web Nginx.',
    wiringTable: [
      { fromDevice: 'PC-1', fromPort: 'FastEthernet0', cableType: 'straight', cableLabel: 'Cáp Thẳng T568B', toDevice: 'Switch-L2-1', toPort: 'FastEthernet0/1', purpose: 'Nối máy trạm vào Switch (khác tầng: L3/Host vào L2)' },
      { fromDevice: 'Switch-L2-1', fromPort: 'FastEthernet0/2', cableType: 'straight', cableLabel: 'Cáp Thẳng T568B', toDevice: 'Router-1', toPort: 'GigabitEthernet0/0/0', purpose: 'Nối Switch lên cổng Default Gateway của Router' },
      { fromDevice: 'Switch-L2-1', fromPort: 'FastEthernet0/3', cableType: 'straight', cableLabel: 'Cáp Thẳng T568B', toDevice: 'Ubuntu-Web', toPort: 'eth0', purpose: 'Nối Máy Chủ Web vào Switch để phục vụ mạng LAN' },
    ],
    explanationMarkdown: `### Phân tích kiến trúc:
- **Nguyên tắc nối dây**: PC, Server và Router đều hoạt động ở các tầng khác với Switch L2, do đó toàn bộ các kết nối trong mô hình này đều sử dụng **Cáp Thẳng (Straight-Through)**.
- **Quy hoạch IP**:
  - Mạng con: \`192.168.1.0/24\` (Subnet Mask: \`255.255.255.0\`).
  - Router Gi0/0/0 (Default Gateway): \`192.168.1.1\`.
  - PC-1: \`192.168.1.10\` (Gateway: \`192.168.1.1\`).
  - Web Server: \`192.168.1.100\` (Gateway: \`192.168.1.1\`).`,
    createTopology: () => {
      const pc = createDefaultDevice('pc', 120, 240, '1');
      pc.ports[0].ipAddress = '192.168.1.10';
      pc.ports[0].subnetMask = '255.255.255.0';
      pc.defaultGateway = '192.168.1.1';

      const sw = createDefaultDevice('l2-switch', 380, 240, '1');

      const router = createDefaultDevice('cisco-router', 640, 240, '1');
      router.ports[0].ipAddress = '192.168.1.1';
      router.ports[0].subnetMask = '255.255.255.0';
      router.ports[0].status = 'up';

      const server = createDefaultDevice('linux-server', 640, 420, '1');
      server.hostname = 'Ubuntu-Web';
      server.ports[0].ipAddress = '192.168.1.100';
      server.ports[0].subnetMask = '255.255.255.0';
      server.defaultGateway = '192.168.1.1';

      const links: NetworkLink[] = [
        { id: `l-${Date.now()}-1`, cableType: 'straight', fromDeviceId: pc.id, fromPortId: pc.ports[0].id, toDeviceId: sw.id, toPortId: sw.ports[0].id, status: 'up' },
        { id: `l-${Date.now()}-2`, cableType: 'straight', fromDeviceId: sw.id, fromPortId: sw.ports[1].id, toDeviceId: router.id, toPortId: router.ports[0].id, status: 'up' },
        { id: `l-${Date.now()}-3`, cableType: 'straight', fromDeviceId: sw.id, fromPortId: sw.ports[2].id, toDeviceId: server.id, toPortId: server.ports[0].id, status: 'up' },
      ];

      return { devices: [pc, sw, router, server], links };
    },
  },
  {
    id: 'topo-2',
    title: 'Mô hình 2: Phân Chia VLAN & Router-on-a-Stick 802.1Q',
    badge: 'Chuyển Mạch & Trunking',
    description: 'Tách 2 phòng ban VLAN 10 (Sales) và VLAN 20 (IT). Một sợi cáp Trunk nối lên Router mang 2 Sub-interfaces định tuyến liên VLAN.',
    wiringTable: [
      { fromDevice: 'PC-Sales', fromPort: 'FastEthernet0', cableType: 'straight', cableLabel: 'Cáp Thẳng', toDevice: 'Switch-L2', toPort: 'FastEthernet0/1', purpose: 'Cổng Access VLAN 10 (Sales)' },
      { fromDevice: 'PC-IT', fromPort: 'FastEthernet0', cableType: 'straight', cableLabel: 'Cáp Thẳng', toDevice: 'Switch-L2', toPort: 'FastEthernet0/2', purpose: 'Cổng Access VLAN 20 (IT)' },
      { fromDevice: 'Switch-L2', fromPort: 'FastEthernet0/24', cableType: 'straight', cableLabel: 'Cáp Thẳng (Trunk 802.1Q)', toDevice: 'Router-Cisco', toPort: 'GigabitEthernet0/0/0', purpose: 'Đường truyền Trunk mang nhãn tag 802.1Q của cả 2 VLAN lên Router' },
    ],
    explanationMarkdown: `### Phân tích kiến trúc:
- **Router-on-a-Stick**: Thay vì phải cắm 2 dây mạng tốn 2 cổng vật lý trên Router, ta chỉ dùng 1 cổng vật lý \`Gi0/0/0\` và chia thành 2 cổng logic:
  - Sub-interface \`Gi0/0/0.10\`: Đóng gói \`encapsulation dot1Q 10\`, IP \`192.168.10.1\`.
  - Sub-interface \`Gi0/0/0.20\`: Đóng gói \`encapsulation dot1Q 20\`, IP \`192.168.20.1\`.
- **Cổng Trunk**: Cổng Fa0/24 trên Switch phải được cấu hình lệnh \`switchport mode trunk\` để không gỡ bỏ tag 802.1Q khi frame di chuyển lên Router.`,
    createTopology: () => {
      const pc1 = createDefaultDevice('pc', 120, 160, '1');
      pc1.hostname = 'PC-Sales';
      pc1.ports[0].ipAddress = '192.168.10.10';
      pc1.ports[0].subnetMask = '255.255.255.0';
      pc1.defaultGateway = '192.168.10.1';

      const pc2 = createDefaultDevice('pc', 120, 340, '2');
      pc2.hostname = 'PC-IT';
      pc2.ports[0].ipAddress = '192.168.20.20';
      pc2.ports[0].subnetMask = '255.255.255.0';
      pc2.defaultGateway = '192.168.20.1';

      const sw = createDefaultDevice('l2-switch', 380, 250, '1');
      sw.vlans = [
        { id: 1, name: 'default' },
        { id: 10, name: 'SALES' },
        { id: 20, name: 'IT' },
      ];
      sw.ports[0].vlanId = 10;
      sw.ports[0].mode = 'access';
      sw.ports[1].vlanId = 20;
      sw.ports[1].mode = 'access';
      sw.ports[7].mode = 'trunk';

      const router = createDefaultDevice('cisco-router', 650, 250, '1');
      router.ports[0].status = 'up';
      router.ports.push({
        id: `${router.id}-sub10`,
        name: 'GigabitEthernet0/0/0.10',
        type: 'gigabit',
        ipAddress: '192.168.10.1',
        subnetMask: '255.255.255.0',
        macAddress: router.ports[0].macAddress,
        status: 'up',
        vlanId: 10,
      });
      router.ports.push({
        id: `${router.id}-sub20`,
        name: 'GigabitEthernet0/0/0.20',
        type: 'gigabit',
        ipAddress: '192.168.20.1',
        subnetMask: '255.255.255.0',
        macAddress: router.ports[0].macAddress,
        status: 'up',
        vlanId: 20,
      });

      const links: NetworkLink[] = [
        { id: `l-${Date.now()}-1`, cableType: 'straight', fromDeviceId: pc1.id, fromPortId: pc1.ports[0].id, toDeviceId: sw.id, toPortId: sw.ports[0].id, status: 'up' },
        { id: `l-${Date.now()}-2`, cableType: 'straight', fromDeviceId: pc2.id, fromPortId: pc2.ports[0].id, toDeviceId: sw.id, toPortId: sw.ports[1].id, status: 'up' },
        { id: `l-${Date.now()}-3`, cableType: 'straight', fromDeviceId: sw.id, fromPortId: sw.ports[7].id, toDeviceId: router.id, toPortId: router.ports[0].id, status: 'up' },
      ];

      return { devices: [pc1, pc2, sw, router], links };
    },
  },
  {
    id: 'topo-3',
    title: 'Mô hình 3: Hạ Tầng Dịch Vụ Mạng Doanh Nghiệp (DHCP + DNS + Web Nginx + Wi-Fi)',
    badge: 'Dịch Vụ Mạng',
    description: 'Hạ tầng dịch vụ hoàn chỉnh. DHCP Server cấp IP tự động, DNS Server phân giải netlab.edu, Web Nginx và Access Point phát Wi-Fi cho Laptop và Smartphone.',
    wiringTable: [
      { fromDevice: 'DHCP-Server', fromPort: 'eth0', cableType: 'straight', cableLabel: 'Cáp Thẳng', toDevice: 'Switch-L2', toPort: 'FastEthernet0/1', purpose: 'Cung cấp dịch vụ cấp phát IP động qua quy trình DORA' },
      { fromDevice: 'DNS-Server', fromPort: 'eth0', cableType: 'straight', cableLabel: 'Cáp Thẳng', toDevice: 'Switch-L2', toPort: 'FastEthernet0/2', purpose: 'Phân giải tên miền netlab.edu thành IP' },
      { fromDevice: 'Web-Server', fromPort: 'eth0', cableType: 'straight', cableLabel: 'Cáp Thẳng', toDevice: 'Switch-L2', toPort: 'FastEthernet0/3', purpose: 'Lưu trữ và phản hồi trang web HTTP Port 80' },
      { fromDevice: 'Switch-L2', fromPort: 'FastEthernet0/4', cableType: 'straight', cableLabel: 'Cáp Thẳng', toDevice: 'Access-Point', toPort: 'Ethernet0 (WAN)', purpose: 'Cung cấp đường truyền có dây nối vào Access Point' },
      { fromDevice: 'Access-Point', fromPort: 'Radio0', cableType: 'straight', cableLabel: 'Sóng Radio 802.11', toDevice: 'Laptop & Phone', toPort: 'Wireless', purpose: 'Kết nối mạng không dây (SSID: NetLab-WiFi, Pass: CiscoPassword123)' },
    ],
    explanationMarkdown: `### Luồng hoạt động của một Client:
1. **Laptop bật máy**: Kết nối vào sóng Wi-Fi của Access Point.
2. **Xin IP tự động**: Gửi DHCP Discover -> DHCP Server phản hồi Offer IP \`192.168.1.51\`, Gateway \`192.168.1.1\`, DNS \`192.168.1.2\`.
3. **Mở trình duyệt gõ \`http://netlab.edu\`**:
   - Laptop gửi DNS Query tới DNS Server (\`192.168.1.2\`).
   - DNS Server trả lời: \`netlab.edu\` có IP là \`192.168.1.100\`.
   - Laptop mở kết nối TCP Port 80 tới Web Server \`192.168.1.100\` và tải trang web về hiển thị!`,
    createTopology: () => {
      const dhcp = createDefaultDevice('dhcp-server', 100, 100, '1');
      const dns = createDefaultDevice('dns-server', 280, 100, '1');
      const web = createDefaultDevice('linux-server', 460, 100, '1');
      const sw = createDefaultDevice('l2-switch', 280, 250, '1');
      const ap = createDefaultDevice('wireless-ap', 520, 250, '1');
      const laptop = createDefaultDevice('laptop', 520, 420, '1');
      const phone = createDefaultDevice('smartphone', 660, 420, '1');

      const links: NetworkLink[] = [
        { id: `l-${Date.now()}-1`, cableType: 'straight', fromDeviceId: dhcp.id, fromPortId: dhcp.ports[0].id, toDeviceId: sw.id, toPortId: sw.ports[0].id, status: 'up' },
        { id: `l-${Date.now()}-2`, cableType: 'straight', fromDeviceId: dns.id, fromPortId: dns.ports[0].id, toDeviceId: sw.id, toPortId: sw.ports[1].id, status: 'up' },
        { id: `l-${Date.now()}-3`, cableType: 'straight', fromDeviceId: web.id, fromPortId: web.ports[0].id, toDeviceId: sw.id, toPortId: sw.ports[2].id, status: 'up' },
        { id: `l-${Date.now()}-4`, cableType: 'straight', fromDeviceId: sw.id, fromPortId: sw.ports[3].id, toDeviceId: ap.id, toPortId: ap.ports[0].id, status: 'up' },
      ];

      return { devices: [dhcp, dns, web, sw, ap, laptop, phone], links };
    },
  },
  {
    id: 'topo-4',
    title: 'Mô hình 4: Vùng DMZ & Tường Lửa Bảo Mật Cisco ASA (Inside, Outside, DMZ)',
    badge: 'Bảo Mật Tường Lửa',
    description: 'Mô hình bảo vệ mạng doanh nghiệp chuyên nghiệp. Tường lửa ASA chia 3 vùng cách ly độc lập: Mạng nội bộ Inside, Mạng Internet Outside và Vùng máy chủ DMZ.',
    wiringTable: [
      { fromDevice: 'PC-Inside', fromPort: 'FastEthernet0', cableType: 'straight', cableLabel: 'Cáp Thẳng', toDevice: 'Cisco-ASA', toPort: 'Inside (eth0)', purpose: 'Vùng mạng nội bộ tin cậy (Security Level 100 - IP 192.168.1.1)' },
      { fromDevice: 'PC-Outside', fromPort: 'FastEthernet0', cableType: 'straight', cableLabel: 'Cáp Thẳng', toDevice: 'Cisco-ASA', toPort: 'Outside (eth1)', purpose: 'Vùng Internet công cộng nguy hiểm (Security Level 0 - IP 203.0.113.1)' },
      { fromDevice: 'DMZ-WebServer', fromPort: 'eth0', cableType: 'straight', cableLabel: 'Cáp Thẳng', toDevice: 'Cisco-ASA', toPort: 'DMZ (eth2)', purpose: 'Vùng đệm máy chủ công khai (Security Level 50 - IP 172.16.1.1)' },
    ],
    explanationMarkdown: `### Chính sách an ninh mạng:
- **Inside ra Outside/DMZ**: Được phép mặc định vì mức bảo mật cao hơn (100 > 0 và 100 > 50).
- **Outside vào Inside**: BỊ CHẶN TUYỆT ĐỐI (Denied) để bảo vệ dữ liệu nội bộ nhân viên.
- **Outside vào DMZ**: Chỉ mở duy nhất cổng TCP Port 80 (HTTP) để người dùng Internet xem website, toàn bộ các cổng khác và lệnh ICMP Ping đều bị drop tại chỗ.`,
    createTopology: () => {
      const pcInside = createDefaultDevice('pc', 120, 240, 'Inside');
      pcInside.hostname = 'PC-Inside';
      pcInside.ports[0].ipAddress = '192.168.1.10';
      pcInside.defaultGateway = '192.168.1.1';

      const fw = createDefaultDevice('firewall', 380, 240, '1');

      const serverDmz = createDefaultDevice('linux-server', 380, 420, 'DMZ');
      serverDmz.hostname = 'Web-DMZ';
      serverDmz.ports[0].ipAddress = '172.16.1.100';
      serverDmz.defaultGateway = '172.16.1.1';

      const pcOutside = createDefaultDevice('pc', 650, 240, 'Outside');
      pcOutside.hostname = 'PC-Internet';
      pcOutside.ports[0].ipAddress = '203.0.113.50';
      pcOutside.defaultGateway = '203.0.113.1';

      const links: NetworkLink[] = [
        { id: `l-${Date.now()}-1`, cableType: 'straight', fromDeviceId: pcInside.id, fromPortId: pcInside.ports[0].id, toDeviceId: fw.id, toPortId: fw.ports[0].id, status: 'up' },
        { id: `l-${Date.now()}-2`, cableType: 'straight', fromDeviceId: pcOutside.id, fromPortId: pcOutside.ports[0].id, toDeviceId: fw.id, toPortId: fw.ports[1].id, status: 'up' },
        { id: `l-${Date.now()}-3`, cableType: 'straight', fromDeviceId: serverDmz.id, fromPortId: serverDmz.ports[0].id, toDeviceId: fw.id, toPortId: fw.ports[2].id, status: 'up' },
      ];

      return { devices: [pcInside, fw, serverDmz, pcOutside], links };
    },
  },
  {
    id: 'topo-5',
    title: 'Mô hình 5: Chống Vòng Lặp & Dự Phòng Spanning Tree Protocol (STP Ring)',
    badge: 'Chống Loop L2',
    description: 'Mô hình tam giác 3 Switch nối vòng khép kín. Trực quan hóa thuật toán STP tự động phát hiện loop và khóa 1 cổng sang trạng thái Blocking (đèn cam).',
    wiringTable: [
      { fromDevice: 'Switch-A (Root)', fromPort: 'FastEthernet0/1', cableType: 'crossover', cableLabel: 'Cáp Chéo Crossover', toDevice: 'Switch-B', toPort: 'FastEthernet0/1', purpose: 'Nối Switch sang Switch (Cùng tầng L2 bắt buộc dùng cáp chéo)' },
      { fromDevice: 'Switch-B', fromPort: 'FastEthernet0/2', cableType: 'crossover', cableLabel: 'Cáp Chéo Crossover', toDevice: 'Switch-C', toPort: 'FastEthernet0/1', purpose: 'Đường truyền dự phòng liên Switch' },
      { fromDevice: 'Switch-C', fromPort: 'FastEthernet0/2', cableType: 'crossover', cableLabel: 'Cáp Chéo Crossover', toDevice: 'Switch-A (Root)', toPort: 'FastEthernet0/2', purpose: 'Tạo vòng lặp kín -> Cổng này được STP khóa Blocking (cam) để triệt tiêu Broadcast Storm' },
    ],
    explanationMarkdown: `### Cơ chế Spanning Tree tự động:
- **Cáp chéo**: Khi nối giữa 2 Switch (cùng tầng Data Link), theo quy chuẩn mạng bắt buộc phải dùng **Cáp Chéo (Crossover)**.
- **Trạng thái cổng STP**:
  - Switch có MAC/ID nhỏ nhất trở thành **STP Root Bridge** (ở đây là Switch-A).
  - Thuật toán STP phát hiện vòng lặp kín 3 cạnh.
  - Cổng của Switch không phải Root có chi phí cao nhất sẽ bị đưa vào trạng thái **Blocking (đèn cam)**.
  - Dữ liệu lưu thông an toàn không bị lặp vô tận. Khi 1 sợi cáp bất kỳ bị đứt, cổng Blocking sẽ tự động đổi sang Forwarding (xanh) để cứu mạng!`,
    createTopology: () => {
      const swA = createDefaultDevice('l2-switch', 380, 130, 'A');
      swA.hostname = 'Switch-A';
      swA.isStpRoot = true;

      const swB = createDefaultDevice('l2-switch', 200, 350, 'B');
      swB.hostname = 'Switch-B';

      const swC = createDefaultDevice('l2-switch', 560, 350, 'C');
      swC.hostname = 'Switch-C';
      swC.ports[1].stpStatus = 'blocking';

      const links: NetworkLink[] = [
        { id: `l-${Date.now()}-1`, cableType: 'crossover', fromDeviceId: swA.id, fromPortId: swA.ports[0].id, toDeviceId: swB.id, toPortId: swB.ports[0].id, status: 'up' },
        { id: `l-${Date.now()}-2`, cableType: 'crossover', fromDeviceId: swB.id, fromPortId: swB.ports[1].id, toDeviceId: swC.id, toPortId: swC.ports[0].id, status: 'up' },
        { id: `l-${Date.now()}-3`, cableType: 'crossover', fromDeviceId: swC.id, fromPortId: swC.ports[1].id, toDeviceId: swA.id, toPortId: swA.ports[1].id, status: 'up' },
      ];

      return { devices: [swA, swB, swC], links };
    },
  },
  {
    id: 'topo-6',
    title: 'Mô hình 6: Unmanaged Hub Repeater L1 & Xung Đột Collision Domain',
    badge: 'Tầng Vật Lý L1',
    description: 'Minh họa sự khác biệt giữa Hub L1 và Switch L2. Hub chỉ đơn thuần lặp xung điện trên tầng vật lý, gửi tín hiệu đến tất cả các máy trạm.',
    wiringTable: [
      { fromDevice: 'PC-A', fromPort: 'FastEthernet0', cableType: 'straight', cableLabel: 'Cáp Thẳng', toDevice: 'Hub-L1', toPort: 'Port 1', purpose: 'Nối máy trạm vào cổng Hub' },
      { fromDevice: 'PC-B', fromPort: 'FastEthernet0', cableType: 'straight', cableLabel: 'Cáp Thẳng', toDevice: 'Hub-L1', toPort: 'Port 2', purpose: 'Nối máy trạm vào cổng Hub' },
      { fromDevice: 'PC-C', fromPort: 'FastEthernet0', cableType: 'straight', cableLabel: 'Cáp Thẳng', toDevice: 'Hub-L1', toPort: 'Port 3', purpose: 'Nối máy trạm vào cổng Hub' },
    ],
    explanationMarkdown: `### Sự khác biệt cơ bản giữa Hub và Switch:
- **Hub (L1 Repeater)**: Không có bộ xử lý, không có địa chỉ MAC, không có bảng CAM. Bất kỳ tín hiệu điện nào đi vào một cổng sẽ được kích đại và **nhại ra tất cả các cổng còn lại**. Toàn bộ thiết bị nối vào Hub cùng chia sẻ **1 miền xung đột (Collision Domain)** duy nhất.
- **Switch (L2 Bridge)**: Đọc được MAC đích và chỉ chuyển tiếp gói tin đến đúng máy nhận. Mỗi cổng trên Switch là **1 miền xung đột độc lập** (Collision Domain tách biệt).`,
    createTopology: () => {
      const hub = createDefaultDevice('hub', 380, 240, '1');

      const pcA = createDefaultDevice('pc', 140, 140, 'A');
      pcA.ports[0].ipAddress = '192.168.1.11';

      const pcB = createDefaultDevice('pc', 140, 340, 'B');
      pcB.ports[0].ipAddress = '192.168.1.12';

      const pcC = createDefaultDevice('pc', 620, 240, 'C');
      pcC.ports[0].ipAddress = '192.168.1.13';

      const links: NetworkLink[] = [
        { id: `l-${Date.now()}-1`, cableType: 'straight', fromDeviceId: pcA.id, fromPortId: pcA.ports[0].id, toDeviceId: hub.id, toPortId: hub.ports[0].id, status: 'up' },
        { id: `l-${Date.now()}-2`, cableType: 'straight', fromDeviceId: pcB.id, fromPortId: pcB.ports[0].id, toDeviceId: hub.id, toPortId: hub.ports[1].id, status: 'up' },
        { id: `l-${Date.now()}-3`, cableType: 'straight', fromDeviceId: pcC.id, fromPortId: pcC.ports[0].id, toDeviceId: hub.id, toPortId: hub.ports[2].id, status: 'up' },
      ];

      return { devices: [hub, pcA, pcB, pcC], links };
    },
  },
  {
    id: 'topo-7',
    title: 'Mô hình 7: Định Tuyến Toàn Cầu eBGP Đa Vùng Tự Trị (Dual-AS eBGP Peering)',
    badge: 'Định Tuyến WAN BGP',
    description: 'Mô hình kết nối định tuyến BGP giữa hai Hệ thống Tự trị (Autonomous System): AS 65001 (ISP Alpha) và AS 65002 (ISP Beta). Thiết lập quan hệ láng giềng eBGP qua cổng Serial/Gigabit và quảng bá dải mạng nội bộ.',
    wiringTable: [
      { fromDevice: 'Router-AS65001', fromPort: 'GigabitEthernet0/0/1', cableType: 'serial', cableLabel: 'Cáp Serial / Cáp Quang', toDevice: 'Router-AS65002', toPort: 'GigabitEthernet0/0/1', purpose: 'Đường truyền liên mạng WAN eBGP Peering (Dải IP 10.0.0.0/30)' },
      { fromDevice: 'PC-AS65001', fromPort: 'FastEthernet0', cableType: 'straight', cableLabel: 'Cáp Thẳng T568B', toDevice: 'Router-AS65001', toPort: 'GigabitEthernet0/0/0', purpose: 'Nối mạng nội bộ AS 65001 (Dải IP 192.168.1.0/24)' },
      { fromDevice: 'PC-AS65002', fromPort: 'FastEthernet0', cableType: 'straight', cableLabel: 'Cáp Thẳng T568B', toDevice: 'Router-AS65002', toPort: 'GigabitEthernet0/0/0', purpose: 'Nối mạng nội bộ AS 65002 (Dải IP 192.168.2.0/24)' },
    ],
    explanationMarkdown: `### Phân tích kiến trúc BGP (Border Gateway Protocol):
- **Cấu hình Router-AS65001**:
  \`\`\`bash
  Router# configure terminal
  Router(config)# hostname R1-AS65001
  Router(config)# interface GigabitEthernet0/0/1
  Router(config-if)# ip address 10.0.0.1 255.255.255.252
  Router(config-if)# no shutdown
  Router(config)# router bgp 65001
  Router(config-router)# bgp router-id 10.0.0.1
  Router(config-router)# neighbor 10.0.0.2 remote-as 65002
  Router(config-router)# network 192.168.1.0 mask 255.255.255.0
  \`\`\`
- **Cấu hình Router-AS65002**:
  \`\`\`bash
  Router# configure terminal
  Router(config)# hostname R2-AS65002
  Router(config)# interface GigabitEthernet0/0/1
  Router(config-if)# ip address 10.0.0.2 255.255.255.252
  Router(config-if)# no shutdown
  Router(config)# router bgp 65002
  Router(config-router)# bgp router-id 10.0.0.2
  Router(config-router)# neighbor 10.0.0.1 remote-as 65001
  Router(config-router)# network 192.168.2.0 mask 255.255.255.0
  \`\`\`
- **Kiểm tra trạng thái BGP**:
  - Gõ lệnh \`show ip bgp summary\` trên Router để kiểm tra trạng thái **Established**.
  - Gõ lệnh \`show ip bgp\` để xem bảng BGP Table gồm các tuyến đường AS-Path.
  - Bắn thử Ping từ PC-AS65001 sang PC-AS65002 để quan sát luồng gói tin BGP và ICMP đi qua 2 vùng tự trị!`,
    createTopology: () => {
      const r1 = createDefaultDevice('cisco-router', 320, 240, 'AS65001');
      r1.hostname = 'R1-AS65001';
      r1.ports[0].ipAddress = '192.168.1.1';
      r1.ports[0].subnetMask = '255.255.255.0';
      r1.ports[0].status = 'up';
      r1.ports[1].ipAddress = '10.0.0.1';
      r1.ports[1].subnetMask = '255.255.255.252';
      r1.ports[1].status = 'up';
      r1.bgpConfig = {
        asNumber: 65001,
        routerId: '10.0.0.1',
        neighbors: [
          { ipAddress: '10.0.0.2', remoteAs: 65002, state: 'Established', routesReceived: 2, upTime: '01:24:00' },
        ],
        networks: [{ prefix: '192.168.1.0', netmask: '255.255.255.0' }],
      };

      const r2 = createDefaultDevice('cisco-router', 580, 240, 'AS65002');
      r2.hostname = 'R2-AS65002';
      r2.ports[0].ipAddress = '192.168.2.1';
      r2.ports[0].subnetMask = '255.255.255.0';
      r2.ports[0].status = 'up';
      r2.ports[1].ipAddress = '10.0.0.2';
      r2.ports[1].subnetMask = '255.255.255.252';
      r2.ports[1].status = 'up';
      r2.bgpConfig = {
        asNumber: 65002,
        routerId: '10.0.0.2',
        neighbors: [
          { ipAddress: '10.0.0.1', remoteAs: 65001, state: 'Established', routesReceived: 2, upTime: '01:24:00' },
        ],
        networks: [{ prefix: '192.168.2.0', netmask: '255.255.255.0' }],
      };

      const pc1 = createDefaultDevice('pc', 120, 240, 'AS65001');
      pc1.hostname = 'PC-AS65001';
      pc1.ports[0].ipAddress = '192.168.1.10';
      pc1.ports[0].subnetMask = '255.255.255.0';
      pc1.defaultGateway = '192.168.1.1';

      const pc2 = createDefaultDevice('pc', 780, 240, 'AS65002');
      pc2.hostname = 'PC-AS65002';
      pc2.ports[0].ipAddress = '192.168.2.10';
      pc2.ports[0].subnetMask = '255.255.255.0';
      pc2.defaultGateway = '192.168.2.1';

      const links: NetworkLink[] = [
        { id: `l-${Date.now()}-1`, cableType: 'serial', fromDeviceId: r1.id, fromPortId: r1.ports[1].id, toDeviceId: r2.id, toPortId: r2.ports[1].id, status: 'up' },
        { id: `l-${Date.now()}-2`, cableType: 'straight', fromDeviceId: pc1.id, fromPortId: pc1.ports[0].id, toDeviceId: r1.id, toPortId: r1.ports[0].id, status: 'up' },
        { id: `l-${Date.now()}-3`, cableType: 'straight', fromDeviceId: pc2.id, fromPortId: pc2.ports[0].id, toDeviceId: r2.id, toPortId: r2.ports[0].id, status: 'up' },
      ];

      return { devices: [pc1, r1, r2, pc2], links };
    },
  },
];
