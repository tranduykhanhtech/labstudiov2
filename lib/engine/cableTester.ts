import { WireColor, CableTestResult } from '@/types/network';

export interface WireColorInfo {
  code: WireColor;
  nameVi: string;
  nameEn: string;
  stripeColor: string;
  baseColor: string;
}

export const WIRE_COLORS: WireColorInfo[] = [
  { code: 'white-orange', nameVi: 'Trắng - Cam', nameEn: 'White-Orange', stripeColor: '#f97316', baseColor: '#ffffff' },
  { code: 'orange', nameVi: 'Cam', nameEn: 'Orange', stripeColor: '#f97316', baseColor: '#f97316' },
  { code: 'white-green', nameVi: 'Trắng - Xanh Lá', nameEn: 'White-Green', stripeColor: '#22c55e', baseColor: '#ffffff' },
  { code: 'blue', nameVi: 'Xanh Dương', nameEn: 'Blue', stripeColor: '#3b82f6', baseColor: '#3b82f6' },
  { code: 'white-blue', nameVi: 'Trắng - Xanh Dương', nameEn: 'White-Blue', stripeColor: '#3b82f6', baseColor: '#ffffff' },
  { code: 'green', nameVi: 'Xanh Lá', nameEn: 'Green', stripeColor: '#22c55e', baseColor: '#22c55e' },
  { code: 'white-brown', nameVi: 'Trắng - Nâu', nameEn: 'White-Brown', stripeColor: '#92400e', baseColor: '#ffffff' },
  { code: 'brown', nameVi: 'Nâu', nameEn: 'Brown', stripeColor: '#92400e', baseColor: '#92400e' },
];

export const T568A_SEQUENCE: WireColor[] = [
  'white-green',
  'green',
  'white-orange',
  'blue',
  'white-blue',
  'orange',
  'white-brown',
  'brown',
];

export const T568B_SEQUENCE: WireColor[] = [
  'white-orange',
  'orange',
  'white-green',
  'blue',
  'white-blue',
  'green',
  'white-brown',
  'brown',
];

export function testCableRJ45(
  connectorA: (WireColor | null)[],
  connectorB: (WireColor | null)[]
): CableTestResult {
  // Check if both sides have all 8 pins populated
  const missingA = connectorA.some((p) => p === null);
  const missingB = connectorB.some((p) => p === null);

  if (missingA || missingB) {
    const pinMap = Array.from({ length: 8 }, (_, i) => ({
      pinA: i + 1,
      pinB: connectorB[i] ? i + 1 : null,
      matched: connectorA[i] !== null && connectorB[i] !== null,
      errorNote: !connectorA[i] ? 'Đầu A thiếu dây' : !connectorB[i] ? 'Đầu B thiếu dây' : undefined,
    }));

    return {
      isPass: false,
      type: 'incomplete',
      title: 'Chưa đủ 8 sợi dây mạng',
      description: 'Vui lòng xếp đủ cả 8 sợi dây vào đúng rãnh chân cắm RJ45 trên cả 2 đầu trước khi bấm kìm và đo kiểm.',
      pinMap,
    };
  }

  // Exact standard checks
  const isA_T568A = connectorA.every((c, i) => c === T568A_SEQUENCE[i]);
  const isA_T568B = connectorA.every((c, i) => c === T568B_SEQUENCE[i]);
  const isB_T568A = connectorB.every((c, i) => c === T568A_SEQUENCE[i]);
  const isB_T568B = connectorB.every((c, i) => c === T568B_SEQUENCE[i]);

  // Build pin mapping: for each pin i on A, where does that wire color connect on B?
  const pinMap = connectorA.map((colorA, indexA) => {
    const pinA = indexA + 1;
    // find index in B with the exact same wire color
    const indexB = connectorB.findIndex((c) => c === colorA);
    const pinB = indexB !== -1 ? indexB + 1 : null;

    let matched = false;
    let errorNote: string | undefined;

    if (pinB === null) {
      errorNote = 'Mất kết nối / đứt sợi';
    } else if (indexA === indexB) {
      matched = true;
    } else {
      matched = false;
      errorNote = `Đấu chéo sang chân ${pinB}`;
    }

    return { pinA, pinB, matched, errorNote };
  });

  // 1. Straight-Through T568B - T568B
  if (isA_T568B && isB_T568B) {
    return {
      isPass: true,
      type: 'straight',
      title: 'Cáp Thẳng Chuẩn T568B (Straight-Through)',
      description: 'Hoàn hảo! Cả 2 đầu bấm chuẩn T568B. Đèn LED quét 1->8 sáng thẳng hàng. Dùng để kết nối khác tầng: PC/Server đến Switch/Hub, hoặc Router đến Switch.',
      pinMap,
    };
  }

  // 2. Straight-Through T568A - T568A
  if (isA_T568A && isB_T568A) {
    return {
      isPass: true,
      type: 'straight',
      title: 'Cáp Thẳng Chuẩn T568A (Straight-Through)',
      description: 'Đạt chuẩn! Cả 2 đầu bấm chuẩn T568A. Dùng kết nối PC/Server đến Switch/Hub.',
      pinMap,
    };
  }

  // 3. Crossover Cable (T568A - T568B or T568B - T568A)
  if ((isA_T568A && isB_T568B) || (isA_T568B && isB_T568A)) {
    return {
      isPass: true,
      type: 'crossover',
      title: 'Cáp Chéo Chuẩn (Crossover Cable)',
      description: 'Chính xác! Một đầu T568A, một đầu T568B. Đèn LED đảo chân Tx/Rx (1<->3, 2<->6). Dùng để kết nối cùng tầng thiết bị: Switch nối Switch, PC nối PC, Router nối Router.',
      pinMap,
    };
  }

  // 4. Rollover (Console Cable) check: 1->8, 2->7, 3->6, 4->5
  const isRollover = connectorA.every((c, i) => c === connectorB[7 - i]);
  if (isRollover) {
    return {
      isPass: true,
      type: 'rollover',
      title: 'Cáp Console Rollover (Cisco Console)',
      description: 'Cáp cuộn Rollover chuẩn Cisco Console! Chân 1 nối 8, 2 nối 7, 3 nối 6... Dùng để cắm cổng COM/Console quản trị thiết bị.',
      pinMap,
    };
  }

  // 5. Miswired / Faulty
  return {
    isPass: false,
    type: 'miswire',
    title: 'Lỗi Bấm Cáp — Sai Thứ Tự Chân (Miswire / Crossed Pairs)',
    description: 'Thứ tự màu dây không tuân theo chuẩn T568A hoặc T568B. Đèn LED sẽ sáng lệch pha hoặc không thông mạch, gây mất gói tín hiệu mạng.',
    pinMap,
  };
}
