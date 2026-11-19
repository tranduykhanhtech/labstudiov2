import { NetworkDevice } from '@/types/network';

export interface BashExecutionResult {
  output: string;
  updatedDevice: NetworkDevice;
}

export class UbuntuBashEngine {
  public static getPrompt(device: NetworkDevice, isRoot: boolean = false): string {
    const user = isRoot ? 'root' : 'student';
    const host = device.hostname || 'ubuntu-server';
    const sym = isRoot ? '#' : '$';
    return `${user}@${host}:~${sym}`;
  }

  public static execute(
    input: string,
    device: NetworkDevice,
    allDevices: NetworkDevice[] = []
  ): BashExecutionResult {
    const cmd = input.trim();
    if (!cmd) {
      return { output: '', updatedDevice: device };
    }

    const updatedDevice: NetworkDevice = JSON.parse(JSON.stringify(device));
    const parts = cmd.split(/\s+/);
    const verb = parts[0].toLowerCase();
    const args = parts.slice(1);

    // 1. ip a / ip addr / ifconfig
    if (verb === 'ifconfig' || (verb === 'ip' && (args[0] === 'a' || args[0] === 'addr' || args[0] === 'address'))) {
      return {
        output: this.renderIpAddr(updatedDevice),
        updatedDevice,
      };
    }

    // 2. ip route
    if (verb === 'ip' && (args[0] === 'r' || args[0] === 'route')) {
      return {
        output: this.renderIpRoute(updatedDevice),
        updatedDevice,
      };
    }

    // 3. ping <ip>
    if (verb === 'ping' && args[0]) {
      const target = args[args.length - 1];
      const count = 4;
      const lines = [
        `PING ${target} (${target}) 56(84) bytes of data.`,
        `64 bytes from ${target}: icmp_seq=1 ttl=64 time=0.482 ms`,
        `64 bytes from ${target}: icmp_seq=2 ttl=64 time=0.315 ms`,
        `64 bytes from ${target}: icmp_seq=3 ttl=64 time=0.298 ms`,
        `64 bytes from ${target}: icmp_seq=4 ttl=64 time=0.340 ms`,
        '',
        `--- ${target} ping statistics ---`,
        `${count} packets transmitted, ${count} received, 0% packet loss, time 3042ms`,
        `rtt min/avg/max/mdev = 0.298/0.358/0.482/0.071 ms`,
      ];
      return { output: lines.join('\n'), updatedDevice };
    }

    // 4. curl http://<ip>
    if (verb === 'curl' && args[0]) {
      const url = args.find((a) => !a.startsWith('-')) || '';
      const cleanTarget = url.replace(/https?:\/\//, '').split('/')[0];

      // Try finding web server device with this IP or domain
      const webDev = allDevices.find(
        (d) =>
          d.ports.some((p) => p.ipAddress === cleanTarget) ||
          d.hostname === cleanTarget ||
          (d.type === 'linux-server' && cleanTarget.includes('web'))
      );

      const html =
        webDev?.webRootHtml ||
        `<!DOCTYPE html>
<html>
<head><title>Welcome to Nginx!</title></head>
<body style="font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 2rem;">
  <h1>NetLab Studio — Nginx Web Server</h1>
  <p>If you see this page, the Nginx web server is successfully installed and working.</p>
</body>
</html>`;

      if (cmd.includes('-v') || cmd.includes('-I')) {
        return {
          output: `* Trying ${cleanTarget}:80...
* Connected to ${cleanTarget} (${cleanTarget}) port 80 (#0)
> GET / HTTP/1.1
> Host: ${cleanTarget}
> User-Agent: curl/7.81.0
> Accept: */*
> 
< HTTP/1.1 200 OK
< Server: nginx/1.18.0 (Ubuntu)
< Date: ${new Date().toUTCString()}
< Content-Type: text/html
< Content-Length: ${html.length}
< Connection: keep-alive
< 
${html}`,
          updatedDevice,
        };
      }

      return { output: html, updatedDevice };
    }

    // 5. nslookup / dig <domain>
    if (verb === 'nslookup' || verb === 'dig') {
      const domain = args[0] || 'netlab.edu';
      const dnsDev = allDevices.find((d) => d.type === 'dns-server');
      const record = dnsDev?.dnsRecords?.find((r) => r.domain.toLowerCase() === domain.toLowerCase());
      const resolvedIp = record?.value || '192.168.1.100';

      if (verb === 'dig') {
        return {
          output: `; <<>> DiG 9.18.1-1ubuntu1-Ubuntu <<>> ${domain}
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 48123
;; flags: qr aa rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1

;; ANSWER SECTION:
${domain}.		3600	IN	A	${resolvedIp}

;; Query time: 1 msec
;; SERVER: 192.168.1.254#53(192.168.1.254) (UDP)`,
          updatedDevice,
        };
      }

      return {
        output: `Server:		192.168.1.254
Address:	192.168.1.254#53

Name:	${domain}
Address: ${resolvedIp}`,
        updatedDevice,
      };
    }

    // 6. cat <file>
    if (verb === 'cat' && args[0]) {
      const file = args[0];
      if (file.includes('index.html')) {
        return {
          output: updatedDevice.webRootHtml || '<h1>Welcome to NetLab Studio</h1>',
          updatedDevice,
        };
      }
      if (file.includes('netplan') || file.includes('yaml')) {
        const port = updatedDevice.ports[0];
        return {
          output: `network:
  version: 2
  renderer: networkd
  ethernets:
    ${port?.name || 'eth0'}:
      dhcp4: no
      addresses:
        - ${port?.ipAddress || '192.168.1.100'}/24
      gateway4: ${updatedDevice.defaultGateway || '192.168.1.1'}
      nameservers:
        addresses: [${updatedDevice.dnsServer || '8.8.8.8'}, 1.1.1.1]`,
          updatedDevice,
        };
      }
      return { output: `cat: ${file}: No such file or directory`, updatedDevice };
    }

    // 7. systemctl status/restart nginx
    if (verb === 'systemctl') {
      const action = args[0];
      const service = args[1];
      if (service === 'nginx') {
        if (action === 'status') {
          return {
            output: `● nginx.service - A high performance web server and a reverse proxy server
     Loaded: loaded (/lib/systemd/system/nginx.service; enabled; vendor preset: enabled)
     Active: active (running) since ${new Date(Date.now() - 3600000).toTimeString()}
   Main PID: 1248 (nginx)
      Tasks: 2 (limit: 4625)
     Memory: 4.8M
        CPU: 12ms
     CGroup: /system.slice/nginx.service
             ├─1248 nginx: master process /usr/sbin/nginx -g daemon on; master_process on;
             └─1249 nginx: worker process`,
            updatedDevice,
          };
        }
        if (action === 'restart' || action === 'start') {
          return { output: `[OK] Restarted nginx.service successfully.`, updatedDevice };
        }
      }
    }

    // 8. iptables -L
    if (verb === 'iptables') {
      return {
        output: `Chain INPUT (policy ACCEPT 142 packets, 11K bytes)
 pkts bytes target     prot opt in     out     source               destination         
   48  3984 ACCEPT     tcp  --  *      *       0.0.0.0/0            0.0.0.0/0            tcp dpt:80
   12   960 ACCEPT     tcp  --  *      *       0.0.0.0/0            0.0.0.0/0            tcp dpt:22

Chain FORWARD (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination         

Chain OUTPUT (policy ACCEPT 112 packets, 15K bytes)
 pkts bytes target     prot opt in     out     source               destination`,
        updatedDevice,
      };
    }

    // 9. arp -a
    if (verb === 'arp') {
      return {
        output: `? (192.168.1.1) at 00:50:79:66:68:01 [ether] on eth0
? (192.168.1.254) at 00:50:79:66:68:fe [ether] on eth0`,
        updatedDevice,
      };
    }

    // 10. netstat -tuln
    if (verb === 'netstat') {
      return {
        output: `Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State      
tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN     
tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN     
udp        0      0 0.0.0.0:53              0.0.0.0:*                          
udp        0      0 0.0.0.0:67              0.0.0.0:*`,
        updatedDevice,
      };
    }

    // 11. uname -a, whoami, hostname, clear
    if (verb === 'uname') {
      return { output: 'Linux ubuntu-server 5.15.0-89-generic #99-Ubuntu SMP x86_64 GNU/Linux', updatedDevice };
    }
    if (verb === 'whoami') {
      return { output: 'student', updatedDevice };
    }
    if (verb === 'hostname') {
      return { output: updatedDevice.hostname, updatedDevice };
    }
    if (verb === 'clear') {
      return { output: '__CLEAR__', updatedDevice };
    }

    return { output: `${verb}: command not found`, updatedDevice };
  }

  private static renderIpAddr(dev: NetworkDevice): string {
    const lines = [
      '1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000',
      '    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00',
      '    inet 127.0.0.1/8 scope host lo',
      '       valid_lft forever preferred_lft forever',
    ];

    dev.ports.forEach((p, idx) => {
      const idxNum = idx + 2;
      const state = p.status === 'up' ? 'UP' : 'DOWN';
      lines.push(
        `${idxNum}: ${p.name}: <BROADCAST,MULTICAST,${state},LOWER_UP> mtu 1500 qdisc fq_codel state ${state} group default qlen 1000`
      );
      lines.push(`    link/ether ${p.macAddress} brd ff:ff:ff:ff:ff:ff`);
      if (p.ipAddress) {
        lines.push(
          `    inet ${p.ipAddress}/24 brd 192.168.1.255 scope global ${p.name}`
        );
        lines.push('       valid_lft forever preferred_lft forever');
      }
    });

    return lines.join('\n');
  }

  private static renderIpRoute(dev: NetworkDevice): string {
    const lines = [];
    if (dev.defaultGateway) {
      lines.push(`default via ${dev.defaultGateway} dev eth0 proto static`);
    }
    for (const p of dev.ports) {
      if (p.ipAddress && p.status === 'up') {
        lines.push(`192.168.1.0/24 dev ${p.name} proto kernel scope link src ${p.ipAddress}`);
      }
    }
    return lines.join('\n');
  }
}
