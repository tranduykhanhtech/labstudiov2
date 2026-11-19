'use client';

import React, { useState, useEffect, useRef } from 'react';
import { WireColor } from '@/types/network';
import {
  WIRE_COLORS,
  T568A_SEQUENCE,
  T568B_SEQUENCE,
  testCableRJ45,
} from '@/lib/engine/cableTester';
import { sound } from '@/lib/sound/soundEffects';
import { X, Play, Square, Scissors, CheckCircle, AlertTriangle, ShieldCheck, Sparkles } from 'lucide-react';

interface CableWorkshopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCableToCanvas?: (cableType: 'straight' | 'crossover' | 'console') => void;
}

export const CableWorkshopModal: React.FC<CableWorkshopModalProps> = ({
  isOpen,
  onClose,
  onAddCableToCanvas,
}) => {
  const [pinsA, setPinsA] = useState<(WireColor | null)[]>([...T568B_SEQUENCE]);
  const [pinsB, setPinsB] = useState<(WireColor | null)[]>([...T568B_SEQUENCE]);
  const [activeSide, setActiveSide] = useState<'A' | 'B'>('A');
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  const [crimpAnimation, setCrimpAnimation] = useState<boolean>(false);

  // 8-LED Tester state
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [activeLedStep, setActiveLedStep] = useState<number | null>(null);

  // Calculate test result derived from pins
  const testResult = React.useMemo(() => testCableRJ45(pinsA, pinsB), [pinsA, pinsB]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle 8-LED continuous sequential scan
  useEffect(() => {
    if (!isTesting) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    let step = 1;
    const interval = setInterval(() => {
      step = step >= 8 ? 1 : step + 1;
      setActiveLedStep(step);

      // Play sound per LED tick
      const isMatched = testResult?.pinMap[step - 1]?.matched ?? true;
      sound.playTesterTick(isMatched);
    }, 450);

    timerRef.current = interval;

    return () => {
      clearInterval(interval);
      setActiveLedStep(null);
    };
  }, [isTesting, testResult]);

  if (!isOpen) return null;

  const handleCrimp = () => {
    sound.playCrimpSnap();
    setCrimpAnimation(true);
    setTimeout(() => {
      setCrimpAnimation(false);
    }, 600);
  };

  const applyPreset = (type: 'straight-B' | 'straight-A' | 'crossover' | 'miswire' | 'clear') => {
    if (type === 'straight-B') {
      setPinsA([...T568B_SEQUENCE]);
      setPinsB([...T568B_SEQUENCE]);
    } else if (type === 'straight-A') {
      setPinsA([...T568A_SEQUENCE]);
      setPinsB([...T568A_SEQUENCE]);
    } else if (type === 'crossover') {
      setPinsA([...T568A_SEQUENCE]);
      setPinsB([...T568B_SEQUENCE]);
    } else if (type === 'miswire') {
      // Invert pin 3 and pin 6 intentionally
      const faultyA = [...T568B_SEQUENCE];
      const temp = faultyA[2];
      faultyA[2] = faultyA[5];
      faultyA[5] = temp;
      setPinsA(faultyA);
      setPinsB([...T568B_SEQUENCE]);
    } else if (type === 'clear') {
      setPinsA(Array(8).fill(null));
      setPinsB(Array(8).fill(null));
    }
  };

  const handleAssignWire = (color: WireColor) => {
    const targetPins = activeSide === 'A' ? [...pinsA] : [...pinsB];
    if (selectedSlot !== null) {
      targetPins[selectedSlot] = color;
      if (activeSide === 'A') setPinsA(targetPins);
      else setPinsB(targetPins);
      // Auto advance to next slot
      setSelectedSlot(selectedSlot < 7 ? selectedSlot + 1 : null);
    } else {
      // Find first empty slot
      const firstEmpty = targetPins.findIndex((p) => p === null);
      if (firstEmpty !== -1) {
        targetPins[firstEmpty] = color;
        if (activeSide === 'A') setPinsA(targetPins);
        else setPinsB(targetPins);
      }
    }
    sound.playKeyClick();
  };

  const getWireInfo = (color: WireColor | null) => {
    return WIRE_COLORS.find((w) => w.code === color);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-xl text-slate-100 overflow-hidden">
        {/* Header - Clean & Focused */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white">
                  Xưởng Bấm Cáp Mạng RJ45 & Đo 8 Đèn LED
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Chuẩn T568A / T568B
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Thực hành xếp 8 lõi dây màu, bấm hạt mạng và dùng máy đo kiểm tra thông mạch
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Preset Buttons Bar */}
          <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs">
            <span className="text-slate-400 font-medium mr-1.5">Mẫu dây:</span>
            <button
              onClick={() => applyPreset('straight-B')}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              Cáp Thẳng T568B
            </button>
            <button
              onClick={() => applyPreset('straight-A')}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              Cáp Thẳng T568A
            </button>
            <button
              onClick={() => applyPreset('crossover')}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              Cáp Chéo (Crossover)
            </button>
            <button
              onClick={() => applyPreset('miswire')}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-300 transition-colors"
            >
              Lỗi Đảo Dây
            </button>
            <button
              onClick={() => applyPreset('clear')}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white ml-auto transition-colors"
            >
              Xóa Làm Lại
            </button>
          </div>

          {/* Connectors Workspace */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* End A */}
            <div
              className={`p-5 rounded-2xl border transition-all ${
                activeSide === 'A'
                  ? 'bg-slate-800/60 border-blue-500/50 ring-2 ring-blue-500/20'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
              onClick={() => setActiveSide('A')}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xs">
                    A
                  </span>
                  <h3 className="font-semibold text-white">Đầu Cáp RJ45 A (End A)</h3>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                  {pinsA.every((c, i) => c === T568B_SEQUENCE[i])
                    ? 'Chuẩn T568B'
                    : pinsA.every((c, i) => c === T568A_SEQUENCE[i])
                    ? 'Chuẩn T568A'
                    : 'Tự Do'}
                </span>
              </div>

              {/* RJ45 Head Visual */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 relative">
                {/* 8 Pins Slots */}
                <div className="grid grid-cols-8 gap-1.5 mb-3">
                  {pinsA.map((color, idx) => {
                    const info = getWireInfo(color);
                    const isSelected = activeSide === 'A' && selectedSlot === idx;
                    return (
                      <div
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSide('A');
                          setSelectedSlot(idx);
                        }}
                        className={`h-28 rounded-md flex flex-col items-center justify-between p-1 cursor-pointer transition-all border ${
                          isSelected
                            ? 'ring-2 ring-amber-400 border-amber-400 bg-slate-800'
                            : 'border-slate-800 bg-slate-900/80 hover:border-slate-600'
                        }`}
                      >
                        {/* Gold Contact Pin */}
                        <div className="w-full h-3 rounded-t-sm bg-gradient-to-b from-yellow-300 to-amber-500 shadow-sm" />
                        {/* Wire Representation */}
                        {info ? (
                          <div
                            className="w-3 flex-1 rounded-sm my-1 relative overflow-hidden shadow-inner"
                            style={{
                              backgroundColor: info.baseColor,
                              backgroundImage: info.code.includes('white-')
                                ? `repeating-linear-gradient(45deg, transparent, transparent 3px, ${info.stripeColor} 3px, ${info.stripeColor} 6px)`
                                : undefined,
                            }}
                          />
                        ) : (
                          <div className="w-3 flex-1 rounded-sm my-1 border border-dashed border-slate-700 bg-slate-950" />
                        )}
                        <span className="text-[10px] font-mono text-slate-400">{idx + 1}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="text-[11px] text-center text-slate-500 font-mono">
                  Mặt tiếp xúc hạt mạng RJ45 (Nhìn từ chân gài hướng xuống)
                </div>
              </div>
            </div>

            {/* End B */}
            <div
              className={`p-5 rounded-2xl border transition-all ${
                activeSide === 'B'
                  ? 'bg-slate-800/60 border-blue-500/50 ring-2 ring-blue-500/20'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
              onClick={() => setActiveSide('B')}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-xs">
                    B
                  </span>
                  <h3 className="font-semibold text-white">Đầu Cáp RJ45 B (End B)</h3>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                  {pinsB.every((c, i) => c === T568B_SEQUENCE[i])
                    ? 'Chuẩn T568B'
                    : pinsB.every((c, i) => c === T568A_SEQUENCE[i])
                    ? 'Chuẩn T568A'
                    : 'Tự Do'}
                </span>
              </div>

              {/* RJ45 Head Visual */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 relative">
                {/* 8 Pins Slots */}
                <div className="grid grid-cols-8 gap-1.5 mb-3">
                  {pinsB.map((color, idx) => {
                    const info = getWireInfo(color);
                    const isSelected = activeSide === 'B' && selectedSlot === idx;
                    return (
                      <div
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSide('B');
                          setSelectedSlot(idx);
                        }}
                        className={`h-28 rounded-md flex flex-col items-center justify-between p-1 cursor-pointer transition-all border ${
                          isSelected
                            ? 'ring-2 ring-amber-400 border-amber-400 bg-slate-800'
                            : 'border-slate-800 bg-slate-900/80 hover:border-slate-600'
                        }`}
                      >
                        {/* Gold Contact Pin */}
                        <div className="w-full h-3 rounded-t-sm bg-gradient-to-b from-yellow-300 to-amber-500 shadow-sm" />
                        {/* Wire Representation */}
                        {info ? (
                          <div
                            className="w-3 flex-1 rounded-sm my-1 relative overflow-hidden shadow-inner"
                            style={{
                              backgroundColor: info.baseColor,
                              backgroundImage: info.code.includes('white-')
                                ? `repeating-linear-gradient(45deg, transparent, transparent 3px, ${info.stripeColor} 3px, ${info.stripeColor} 6px)`
                                : undefined,
                            }}
                          />
                        ) : (
                          <div className="w-3 flex-1 rounded-sm my-1 border border-dashed border-slate-700 bg-slate-950" />
                        )}
                        <span className="text-[10px] font-mono text-slate-400">{idx + 1}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="text-[11px] text-center text-slate-500 font-mono">
                  Mặt tiếp xúc hạt mạng RJ45 (Nhìn từ chân gài hướng xuống)
                </div>
              </div>
            </div>
          </div>

          {/* Wire Palette Bar */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-300">
                Khay 8 sợi dây màu (Nhấn để gán vào Đầu {activeSide} - Chân {selectedSlot !== null ? selectedSlot + 1 : 'tiếp theo'}):
              </span>
              <button
                onClick={handleCrimp}
                className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  crimpAnimation
                    ? 'bg-amber-500 scale-95 text-slate-950'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950'
                }`}
              >
                <Scissors className="w-3.5 h-3.5" />
                {crimpAnimation ? 'Đang Bấm Kìm Tách!...' : 'Bấm Kìm (Crimp RJ45)'}
              </button>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {WIRE_COLORS.map((wire) => (
                <button
                  key={wire.code}
                  onClick={() => handleAssignWire(wire.code)}
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-600 flex flex-col items-center gap-1.5 transition-transform active:scale-95 text-center group"
                >
                  <div
                    className="w-6 h-6 rounded-md border border-slate-700 shadow-sm"
                    style={{
                      backgroundColor: wire.baseColor,
                      backgroundImage: wire.code.includes('white-')
                        ? `repeating-linear-gradient(45deg, transparent, transparent 2px, ${wire.stripeColor} 2px, ${wire.stripeColor} 4px)`
                        : undefined,
                    }}
                  />
                  <span className="text-[10px] font-medium text-slate-300 group-hover:text-white leading-tight">
                    {wire.nameVi}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ========================================== */}
          {/* 8-LED MASTER & REMOTE CABLE TESTER */}
          {/* ========================================== */}
          <div className="p-5 bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800 rounded-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    Máy Đo Cáp Mạng 8 Đèn LED (Master & Remote Cable Tester)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Mô phỏng máy đo cáp chuyên dụng (RJ45 Network Cable Tester) quét xung nhịp từng cặp dây
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsTesting(!isTesting)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg ${
                    isTesting
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {isTesting ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  {isTesting ? 'Dừng Máy Đo' : 'Bật Quét 8 Đèn LED'}
                </button>

                {testResult?.isPass && onAddCableToCanvas && (
                  <button
                    onClick={() => {
                      onAddCableToCanvas(testResult.type as 'straight' | 'crossover' | 'console');
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    Thêm Vào Kho Cáp
                  </button>
                )}
              </div>
            </div>

            {/* Tester Hardware Units */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Master Unit */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Master Unit (Bộ Phát)
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">TX SCANNER</span>
                </div>
                {/* 8 LEDs Row */}
                <div className="grid grid-cols-8 gap-2">
                  {Array.from({ length: 8 }).map((_, i) => {
                    const pinNum = i + 1;
                    const isActive = activeLedStep === pinNum;
                    return (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-mono text-slate-400">{pinNum}</span>
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-150 ${
                            isActive
                              ? 'bg-emerald-500 shadow-[0_0_12px_#10b981] scale-110'
                              : 'bg-slate-800 border border-slate-700'
                          }`}
                        >
                          <div
                            className={`w-2.5 h-2.5 rounded-full ${
                              isActive ? 'bg-white' : 'bg-slate-600'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Remote Unit */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Remote Unit (Bộ Thu)
                  </span>
                  <span className="text-[10px] text-blue-400 font-mono">RX RECEIVER</span>
                </div>
                {/* 8 LEDs Row */}
                <div className="grid grid-cols-8 gap-2">
                  {Array.from({ length: 8 }).map((_, i) => {
                    const pinNum = i + 1;
                    // Determine which remote LED turns on based on pin mapping
                    const mappedPin = testResult?.pinMap[activeLedStep ? activeLedStep - 1 : -1]?.pinB;
                    const isActive = mappedPin === pinNum;
                    const isMatched = activeLedStep === pinNum;

                    return (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-mono text-slate-400">{pinNum}</span>
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-150 ${
                            isActive
                              ? isMatched
                                ? 'bg-emerald-500 shadow-[0_0_12px_#10b981] scale-110'
                                : 'bg-amber-500 shadow-[0_0_12px_#f59e0b] scale-110'
                              : 'bg-slate-800 border border-slate-700'
                          }`}
                        >
                          <div
                            className={`w-2.5 h-2.5 rounded-full ${
                              isActive ? 'bg-white' : 'bg-slate-600'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Test Result Verdict */}
            {testResult && (
              <div
                className={`mt-4 p-4 rounded-xl border flex items-start gap-3 ${
                  testResult.isPass
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                }`}
              >
                {testResult.isPass ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-bold text-sm text-white">{testResult.title}</h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {testResult.description}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
