import { NetworkDevice, DevicePort } from '@/types/network';

export type IosMode =
  | 'USER_EXEC'
  | 'PRIVILEGED_EXEC'
  | 'GLOBAL_CONFIG'
  | 'IF_CONFIG'
  | 'SUBIF_CONFIG'
  | 'VLAN_CONFIG'
  | 'ROUTER_CONFIG';

export interface IosExecutionResult {
  output: string;
  newMode: IosMode;
  currentInterface?: string;
  updatedDevice: NetworkDevice;
}

export class CiscoIosEngine {
  public static getPrompt(device: NetworkDevice, mode: IosMode): string {
    const host = device.hostname || 'Router';
    switch (mode) {
      case 'USER_EXEC':
        return `${host}>`;
      case 'PRIVILEGED_EXEC':
        return `${host}#`;
      case 'GLOBAL_CONFIG':
        return `${host}(config)#`;
      case 'IF_CONFIG':
        return `${host}(config-if)#`;
      case 'SUBIF_CONFIG':
        return `${host}(config-subif)#`;
      case 'VLAN_CONFIG':
        return `${host}(config-vlan)#`;
      case 'ROUTER_CONFIG':
        return `${host}(config-router)#`;
      default:
        return `${host}>`;
    }
  }

  public static execute(
    input: string,
    device: NetworkDevice,
    mode: IosMode,
    currentIf?: string
  ): IosExecutionResult {
    const cmd = input.trim();
    if (!cmd) {
      return { output: '', newMode: mode, currentInterface: currentIf, updatedDevice: device };
    }

    const parts = cmd.split(/\s+/);
    const verb = parts[0].toLowerCase();
    const args = parts.slice(1);

    // Deep copy device for safe mutation
    const updatedDevice: NetworkDevice = JSON.parse(JSON.stringify(device));

    // Handle help query '?'
    if (cmd === '?' || cmd.endsWith('?')) {
      return {
        output: this.getHelpText(mode),
        newMode: mode,
        currentInterface: currentIf,
        updatedDevice,
      };
    }

    // ==========================================
    // 1. NAVIGATION COMMANDS
    // ==========================================
    if (verb === 'enable' || verb === 'en') {
      return { output: '', newMode: 'PRIVILEGED_EXEC', currentInterface: currentIf, updatedDevice };
    }
    if (verb === 'disable') {
      return { output: '', newMode: 'USER_EXEC', currentInterface: undefined, updatedDevice };
    }
    if (verb === 'exit' || verb === 'ex') {
      if (mode === 'IF_CONFIG' || mode === 'SUBIF_CONFIG' || mode === 'VLAN_CONFIG' || mode === 'ROUTER_CONFIG') {
        return { output: '', newMode: 'GLOBAL_CONFIG', currentInterface: undefined, updatedDevice };
      }
      if (mode === 'GLOBAL_CONFIG') {
        return { output: '', newMode: 'PRIVILEGED_EXEC', currentInterface: undefined, updatedDevice };
      }
      if (mode === 'PRIVILEGED_EXEC') {
        return { output: '', newMode: 'USER_EXEC', currentInterface: undefined, updatedDevice };
      }
      return { output: '', newMode: mode, currentInterface: currentIf, updatedDevice };
    }
    if (verb === 'end') {
      return { output: '', newMode: 'PRIVILEGED_EXEC', currentInterface: undefined, updatedDevice };
    }
    if ((verb === 'configure' && args[0]?.toLowerCase() === 'terminal') || verb === 'conf' || cmd === 'conf t') {
      if (mode === 'USER_EXEC') {
        return { output: '% Authorization required. Please enter enable mode first.', newMode: mode, currentInterface: currentIf, updatedDevice };
      }
      return {
        output: 'Enter configuration commands, one per line. End with CNTL/Z or exit.',
        newMode: 'GLOBAL_CONFIG',
        currentInterface: undefined,
        updatedDevice,
      };
    }

    // ==========================================
    // 2. GLOBAL CONFIG COMMANDS
    // ==========================================
    if (mode === 'GLOBAL_CONFIG') {
      if (verb === 'hostname' && args[0]) {
        updatedDevice.hostname = args[0];
        return { output: '', newMode: mode, currentInterface: currentIf, updatedDevice };
      }

      // interface fa0/1, int g0/0/0, int vlan 10, int g0/0/0.10
      if (verb === 'interface' || verb === 'int') {
        const targetIfName = this.normalizeInterfaceName(args[0], updatedDevice.ports);
        if (!targetIfName) {
          return {
            output: `% Invalid interface name. Available interfaces: ${updatedDevice.ports.map((p) => p.name).join(', ')}`,
            newMode: mode,
            currentInterface: currentIf,
            updatedDevice,
          };
        }
        const isSubIf = targetIfName.includes('.');
        return {
          output: '',
          newMode: isSubIf ? 'SUBIF_CONFIG' : 'IF_CONFIG',
          currentInterface: targetIfName,
          updatedDevice,
        };
      }

      // vlan <id>
      if (verb === 'vlan' && args[0]) {
        const vlanId = parseInt(args[0], 10);
        if (!isNaN(vlanId)) {
          if (!updatedDevice.vlans) updatedDevice.vlans = [];
          if (!updatedDevice.vlans.some((v) => v.id === vlanId)) {
            updatedDevice.vlans.push({ id: vlanId, name: `VLAN${vlanId.toString().padStart(4, '0')}` });
          }
          return { output: '', newMode: 'VLAN_CONFIG', currentInterface: args[0], updatedDevice };
        }
      }

      // ip route <dest> <mask> <nextHop>
      if (verb === 'ip' && args[0]?.toLowerCase() === 'route') {
        const dest = args[1];
        const mask = args[2];
        const nextHop = args[3];
        if (dest && mask && nextHop) {
          if (!updatedDevice.routes) updatedDevice.routes = [];
          updatedDevice.routes.push({
            id: `static-${Date.now()}`,
            destination: dest,
            netmask: mask,
            nextHop: nextHop,
            interfaceName: 'GigabitEthernet0/0/0',
            type: 'S',
          });
          return { output: '', newMode: mode, currentInterface: currentIf, updatedDevice };
        }
        return { output: '% Incomplete command. Syntax: ip route <network> <mask> <next-hop>', newMode: mode, currentInterface: currentIf, updatedDevice };
      }

      // ip dhcp pool <name>
      if (verb === 'ip' && args[0]?.toLowerCase() === 'dhcp' && args[1]?.toLowerCase() === 'pool') {
        const poolName = args[2] || 'LAN_POOL';
        if (!updatedDevice.dhcpPools) updatedDevice.dhcpPools = [];
        if (!updatedDevice.dhcpPools.some((p) => p.name === poolName)) {
          updatedDevice.dhcpPools.push({
            id: `dhcp-${Date.now()}`,
            name: poolName,
            network: '192.168.1.0',
            netmask: '255.255.255.0',
            defaultGateway: '192.168.1.1',
            dnsServer: '8.8.8.8',
            startIp: '192.168.1.100',
            endIp: '192.168.1.200',
            leaseTimeHours: 24,
            excludedIps: ['192.168.1.1'],
          });
        }
        return { output: '', newMode: 'GLOBAL_CONFIG', currentInterface: currentIf, updatedDevice };
      }

      // router bgp <asn>
      if (verb === 'router' && args[0]?.toLowerCase() === 'bgp') {
        const asn = parseInt(args[1], 10);
        if (!isNaN(asn)) {
          if (!updatedDevice.bgpConfig) {
            updatedDevice.bgpConfig = {
              asNumber: asn,
              routerId: updatedDevice.ports.find((p) => p.ipAddress)?.ipAddress || '10.0.0.1',
              neighbors: [],
              networks: [],
            };
          } else {
            updatedDevice.bgpConfig.asNumber = asn;
          }
          return { output: '', newMode: 'ROUTER_CONFIG', currentInterface: args[1], updatedDevice };
        }
        return { output: '% Incomplete command. Syntax: router bgp <1-65535>', newMode: mode, currentInterface: currentIf, updatedDevice };
      }
    }

    // ==========================================
    // 3. INTERFACE / SUB-INTERFACE CONFIG COMMANDS
    // ==========================================
    if (mode === 'IF_CONFIG' || mode === 'SUBIF_CONFIG') {
      const port = updatedDevice.ports.find(
        (p) => p.name.toLowerCase() === currentIf?.toLowerCase()
      );

      // ip address <ip> <subnet-mask>
      if (verb === 'ip' && args[0]?.toLowerCase() === 'address') {
        const ip = args[1];
        const mask = args[2];
        if (ip && mask && port) {
          port.ipAddress = ip;
          port.subnetMask = mask;
          return { output: '', newMode: mode, currentInterface: currentIf, updatedDevice };
        }
        return { output: '% Incomplete command: ip address <ip> <subnet-mask>', newMode: mode, currentInterface: currentIf, updatedDevice };
      }

      // no shutdown / shutdown
      if (cmd.toLowerCase() === 'no shutdown' || cmd.toLowerCase() === 'no shut') {
        if (port) {
          port.status = 'up';
          return {
            output: `%LINK-3-UPDOWN: Interface ${port.name}, changed state to up\n%LINEPROTO-5-UPDOWN: Line protocol on Interface ${port.name}, changed state to up`,
            newMode: mode,
            currentInterface: currentIf,
            updatedDevice,
          };
        }
      }
      if (cmd.toLowerCase() === 'shutdown' || cmd.toLowerCase() === 'shut') {
        if (port) {
          port.status = 'down';
          return {
            output: `%LINK-5-CHANGED: Interface ${port.name}, changed state to administratively down`,
            newMode: mode,
            currentInterface: currentIf,
            updatedDevice,
          };
        }
      }

      // switchport mode access / trunk
      if (verb === 'switchport' && args[0]?.toLowerCase() === 'mode') {
        const pMode = args[1]?.toLowerCase() as 'access' | 'trunk';
        if (port && (pMode === 'access' || pMode === 'trunk')) {
          port.mode = pMode;
          return { output: '', newMode: mode, currentInterface: currentIf, updatedDevice };
        }
      }

      // switchport access vlan <id>
      if (verb === 'switchport' && args[0]?.toLowerCase() === 'access' && args[1]?.toLowerCase() === 'vlan') {
        const vId = parseInt(args[2], 10);
        if (port && !isNaN(vId)) {
          port.vlanId = vId;
          return { output: '', newMode: mode, currentInterface: currentIf, updatedDevice };
        }
      }

      // encapsulation dot1Q <vlan-id> (for Router-on-a-stick subinterface)
      if (verb === 'encapsulation' && args[0]?.toLowerCase() === 'dot1q') {
        const vId = parseInt(args[1], 10);
        if (port && !isNaN(vId)) {
          port.vlanId = vId;
          return { output: '', newMode: mode, currentInterface: currentIf, updatedDevice };
        }
      }
    }

    // ==========================================
    // 4. VLAN CONFIG COMMANDS
    // ==========================================
    if (mode === 'VLAN_CONFIG') {
      if (verb === 'name' && args[0]) {
        const vlanId = parseInt(currentIf || '1', 10);
        const v = updatedDevice.vlans?.find((vl) => vl.id === vlanId);
        if (v) {
          v.name = args[0];
          return { output: '', newMode: mode, currentInterface: currentIf, updatedDevice };
        }
      }
    }

    // ==========================================
    // 5. ROUTER CONFIG COMMANDS (BGP)
    // ==========================================
    if (mode === 'ROUTER_CONFIG') {
      if (!updatedDevice.bgpConfig) {
        updatedDevice.bgpConfig = {
          asNumber: 65001,
          routerId: '10.0.0.1',
          neighbors: [],
          networks: [],
        };
      }

      // bgp router-id <ip>
      if (verb === 'bgp' && args[0]?.toLowerCase() === 'router-id') {
        if (args[1]) {
          updatedDevice.bgpConfig.routerId = args[1];
          return { output: '', newMode: mode, currentInterface: currentIf, updatedDevice };
        }
      }

      // neighbor <ip> remote-as <asn>
      if (verb === 'neighbor' && args[1]?.toLowerCase() === 'remote-as') {
        const neighborIp = args[0];
        const remoteAs = parseInt(args[2], 10);
        if (neighborIp && !isNaN(remoteAs)) {
          const existing = updatedDevice.bgpConfig.neighbors.find((n) => n.ipAddress === neighborIp);
          if (existing) {
            existing.remoteAs = remoteAs;
          } else {
            updatedDevice.bgpConfig.neighbors.push({
              ipAddress: neighborIp,
              remoteAs,
              state: 'Established',
              routesReceived: 3,
              upTime: '00:12:45',
            });
          }
          return {
            output: `%BGP-5-ADJCHANGE: neighbor ${neighborIp} Up`,
            newMode: mode,
            currentInterface: currentIf,
            updatedDevice,
          };
        }
        return { output: '% Incomplete command: neighbor <ip> remote-as <asn>', newMode: mode, currentInterface: currentIf, updatedDevice };
      }

      // network <prefix> mask <mask>
      if (verb === 'network') {
        const prefix = args[0];
        const maskIdx = args.indexOf('mask');
        const mask = maskIdx !== -1 ? args[maskIdx + 1] : '255.255.255.0';
        if (prefix) {
          updatedDevice.bgpConfig.networks.push({ prefix, netmask: mask });
          return { output: '', newMode: mode, currentInterface: currentIf, updatedDevice };
        }
      }
    }

    // ==========================================
    // 6. SHOW & DIAGNOSTIC COMMANDS
    // ==========================================
    if (verb === 'show' || verb === 'sh') {
      const showTarget = args.join(' ').toLowerCase();

      // show ip bgp summary
      if (showTarget === 'ip bgp summary' || showTarget === 'ip bgp sum') {
        return {
          output: this.renderShowIpBgpSummary(updatedDevice),
          newMode: mode,
          currentInterface: currentIf,
          updatedDevice,
        };
      }

      // show ip bgp
      if (showTarget === 'ip bgp') {
        return {
          output: this.renderShowIpBgp(updatedDevice),
          newMode: mode,
          currentInterface: currentIf,
          updatedDevice,
        };
      }

      // show ip interface brief
      if (showTarget === 'ip interface brief' || showTarget === 'ip int br' || showTarget === 'ip int brief') {
        return {
          output: this.renderShowIpIntBrief(updatedDevice),
          newMode: mode,
          currentInterface: currentIf,
          updatedDevice,
        };
      }

      // show ip route
      if (showTarget === 'ip route') {
        return {
          output: this.renderShowIpRoute(updatedDevice),
          newMode: mode,
          currentInterface: currentIf,
          updatedDevice,
        };
      }

      // show vlan brief
      if (showTarget === 'vlan brief' || showTarget === 'vlan') {
        return {
          output: this.renderShowVlanBrief(updatedDevice),
          newMode: mode,
          currentInterface: currentIf,
          updatedDevice,
        };
      }

      // show mac address-table
      if (showTarget === 'mac address-table' || showTarget === 'mac-address-table') {
        return {
          output: this.renderShowMacAddressTable(updatedDevice),
          newMode: mode,
          currentInterface: currentIf,
          updatedDevice,
        };
      }

      // show running-config
      if (showTarget === 'running-config' || showTarget === 'run') {
        return {
          output: this.renderRunningConfig(updatedDevice),
          newMode: mode,
          currentInterface: currentIf,
          updatedDevice,
        };
      }

      // show arp
      if (showTarget === 'arp') {
        return {
          output: this.renderShowArp(updatedDevice),
          newMode: mode,
          currentInterface: currentIf,
          updatedDevice,
        };
      }
    }

    // ping <ip>
    if (verb === 'ping' && args[0]) {
      const target = args[0];
      return {
        output: `Type escape sequence to abort.\nSending 5, 100-byte ICMP Echos to ${target}, timeout is 2 seconds:\n.!!!!\nSuccess rate is 80 percent (4/5), round-trip min/avg/max = 1/2/4 ms`,
        newMode: mode,
        currentInterface: currentIf,
        updatedDevice,
      };
    }

    // Default unrecognized command
    return {
      output: `% Unrecognized command or invalid syntax. Type '?' for help.`,
      newMode: mode,
      currentInterface: currentIf,
      updatedDevice,
    };
  }

  private static normalizeInterfaceName(input: string, ports: DevicePort[]): string | null {
    if (!input) return null;
    const lower = input.toLowerCase();
    const match = ports.find((p) => {
      const pLow = p.name.toLowerCase();
      if (pLow === lower) return true;
      // fa0/1 -> fastethernet0/1
      if (pLow.replace('fastethernet', 'fa') === lower) return true;
      if (pLow.replace('gigabitethernet', 'g') === lower) return true;
      if (pLow.replace('gigabitethernet', 'gi') === lower) return true;
      return false;
    });
    return match ? match.name : input;
  }

  private static renderShowIpIntBrief(dev: NetworkDevice): string {
    const lines = [
      'Interface              IP-Address      OK? Method Status                Protocol',
      '================================================================================',
    ];
    for (const p of dev.ports) {
      const ip = p.ipAddress || 'unassigned';
      const status = p.status === 'up' ? 'up' : 'administratively down';
      const proto = p.status === 'up' ? 'up' : 'down';
      lines.push(
        `${p.name.padEnd(23, ' ')}${ip.padEnd(16, ' ')}YES manual ${status.padEnd(22, ' ')}${proto}`
      );
    }
    return lines.join('\n');
  }

  private static renderShowIpRoute(dev: NetworkDevice): string {
    const lines = [
      'Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP',
      '       D - EIGRP, EX - EIGRP external, O - OSPF, IA - OSPF inter area',
      '',
      'Gateway of last resort is not set',
      '',
    ];

    // Connected interfaces
    for (const p of dev.ports) {
      if (p.ipAddress && p.subnetMask && p.status === 'up') {
        lines.push(`C    ${p.ipAddress}/24 is directly connected, ${p.name}`);
        lines.push(`L    ${p.ipAddress}/32 is directly connected, ${p.name}`);
      }
    }

    // Static routes
    if (dev.routes) {
      for (const r of dev.routes) {
        lines.push(`S    ${r.destination}/24 [1/0] via ${r.nextHop}`);
      }
    }

    return lines.join('\n');
  }

  private static renderShowVlanBrief(dev: NetworkDevice): string {
    const lines = [
      'VLAN Name                             Status    Ports',
      '---- -------------------------------- --------- -------------------------------',
      '1    default                          active    Fa0/1, Fa0/2, Fa0/3, Fa0/4',
    ];
    if (dev.vlans) {
      for (const v of dev.vlans) {
        if (v.id === 1) continue;
        const ports = dev.ports
          .filter((p) => p.vlanId === v.id)
          .map((p) => p.name)
          .join(', ');
        lines.push(`${v.id.toString().padEnd(4, ' ')} ${v.name.padEnd(32, ' ')} active    ${ports || 'None'}`);
      }
    }
    return lines.join('\n');
  }

  private static renderShowMacAddressTable(dev: NetworkDevice): string {
    const lines = [
      '          Mac Address Table',
      '-------------------------------------------',
      'Vlan    Mac Address       Type        Ports',
      '----    -----------       --------    -----',
    ];
    if (dev.macTable && dev.macTable.length > 0) {
      for (const m of dev.macTable) {
        lines.push(
          `${m.vlan.toString().padEnd(7, ' ')} ${m.macAddress.padEnd(17, ' ')} ${m.type.padEnd(11, ' ')} ${m.port}`
        );
      }
    } else {
      lines.push('   1    0050.7966.6801    DYNAMIC     Fa0/1');
      lines.push('   1    0050.7966.6802    DYNAMIC     Fa0/2');
    }
    return lines.join('\n');
  }

  private static renderRunningConfig(dev: NetworkDevice): string {
    const lines = [
      'Building configuration...',
      'Current configuration : 1842 bytes',
      '!',
      'version 15.4',
      'no service timestamps log datetime msec',
      'no service password-encryption',
      '!',
      `hostname ${dev.hostname || 'Router'}`,
      '!',
      'ip cef',
      'no ip domain lookup',
      '!',
    ];

    for (const p of dev.ports) {
      lines.push(`interface ${p.name}`);
      if (p.ipAddress && p.subnetMask) {
        lines.push(` ip address ${p.ipAddress} ${p.subnetMask}`);
      }
      if (p.mode === 'trunk') {
        lines.push(' switchport mode trunk');
      } else if (p.vlanId) {
        lines.push(` switchport access vlan ${p.vlanId}`);
      }
      if (p.status === 'down') {
        lines.push(' shutdown');
      } else {
        lines.push(' no shutdown');
      }
      lines.push('!');
    }

    if (dev.routes) {
      for (const r of dev.routes) {
        lines.push(`ip route ${r.destination} ${r.netmask} ${r.nextHop}`);
      }
      lines.push('!');
    }

    lines.push('line con 0');
    lines.push(' logging synchronous');
    lines.push('line vty 0 4');
    lines.push(' login');
    lines.push('!');
    lines.push('end');

    return lines.join('\n');
  }

  private static renderShowArp(dev: NetworkDevice): string {
    const lines = [
      'Protocol  Address          Age (min)  Hardware Addr   Type   Interface',
      'Internet  192.168.1.1             -   0001.4234.1201  ARPA   GigabitEthernet0/0/0',
    ];
    if (dev.arpTable) {
      for (const a of dev.arpTable) {
        lines.push(
          `Internet  ${a.ipAddress.padEnd(16, ' ')}  ${a.ageSeconds.toString().padEnd(9, ' ')}  ${a.macAddress.padEnd(14, ' ')}  ARPA   ${a.interfaceName}`
        );
      }
    }
    return lines.join('\n');
  }

  private static getHelpText(mode: IosMode): string {
    if (mode === 'USER_EXEC') {
      return `Exec commands:
  enable             Turn on privileged commands
  ping               Send echo messages
  show               Show running system information
  exit               Exit from the EXEC`;
    }
    if (mode === 'PRIVILEGED_EXEC') {
      return `Privileged EXEC commands:
  configure          Enter configuration mode (conf t)
  disable            Turn off privileged commands
  ping               Send echo messages
  show               Show running system information
  exit               Exit from the EXEC`;
    }
    if (mode === 'GLOBAL_CONFIG') {
      return `Global configuration commands:
  hostname           Set system's network name
  interface          Select an interface to configure
  ip                 Global IP configuration subcommands
  vlan               Configure VLAN parameters
  exit               Exit from configure mode
  end                Exit to privileged EXEC mode`;
    }
    if (mode === 'IF_CONFIG' || mode === 'SUBIF_CONFIG') {
      return `Interface configuration commands:
  ip address         Set the IP address of an interface
  encapsulation      Set encapsulation type for an 802.1Q subinterface
  no shutdown        Restart an interface
  shutdown           Shut down the selected interface
  switchport         Set switching characteristics of the Layer 2 port
  exit               Exit from interface configuration mode`;
    }
    return `Commands:
  exit               Exit current configuration mode
  end                Exit to privileged EXEC`;
  }

  private static renderShowIpBgpSummary(dev: NetworkDevice): string {
    const bgp = dev.bgpConfig;
    if (!bgp) {
      return '% BGP not active';
    }
    const lines = [
      `BGP router identifier ${bgp.routerId}, local AS number ${bgp.asNumber}`,
      `BGP table version is 1, main routing table version 1`,
      `2 network entries using 288 bytes of memory`,
      `2 path entries using 160 bytes of memory`,
      ``,
      `Neighbor        V    AS MsgRcvd MsgSent   TblVer  InQ OutQ Up/Down  State/PfxRcd`,
    ];
    if (bgp.neighbors.length === 0) {
      lines.push(`(No neighbors configured)`);
    } else {
      for (const n of bgp.neighbors) {
        lines.push(
          `${n.ipAddress.padEnd(16, ' ')}4 ${n.remoteAs.toString().padEnd(5, ' ')}    42      45        1    0    0 ${n.upTime.padEnd(9, ' ')} ${n.routesReceived}`
        );
      }
    }
    return lines.join('\n');
  }

  private static renderShowIpBgp(dev: NetworkDevice): string {
    const bgp = dev.bgpConfig;
    if (!bgp) {
      return '% BGP not active';
    }
    const lines = [
      `BGP table version is 3, local router ID is ${bgp.routerId}`,
      `Status codes: s suppressed, d damped, h history, * valid, > best, i - internal`,
      `Origin codes: i - IGP, e - EGP, ? - incomplete`,
      ``,
      `   Network          Next Hop            Metric LocPrf Weight Path`,
    ];
    for (const net of bgp.networks) {
      lines.push(`*> ${net.prefix.padEnd(17, ' ')}0.0.0.0                  0         32768 i`);
    }
    for (const n of bgp.neighbors) {
      lines.push(`*> 192.168.2.0/24   ${n.ipAddress.padEnd(20, ' ')}0             0 ${n.remoteAs} i`);
    }
    return lines.join('\n');
  }
}
