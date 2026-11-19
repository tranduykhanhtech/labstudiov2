'use client';

import React, { useState } from 'react';
import { LabScenario, NetworkDevice, NetworkLink } from '@/types/network';
import { PRACTICAL_LABS, evaluateLab } from '@/lib/labs/labData';
import { sound } from '@/lib/sound/soundEffects';
import confetti from 'canvas-confetti';
import {
  X,
  BookOpen,
  Play,
  Award,
  Sparkles,
  Clock,
  CheckSquare,
  Square,
} from 'lucide-react';

interface LabGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadLab: (lab: LabScenario) => void;
  currentDevices: NetworkDevice[];
  currentLinks: NetworkLink[];
}

export const LabGuideModal: React.FC<LabGuideModalProps> = ({
  isOpen,
  onClose,
  onLoadLab,
  currentDevices,
  currentLinks,
}) => {
  const [selectedLabId, setSelectedLabId] = useState<string>('lab-1');
  const [evalResult, setEvalResult] = useState<{
    score: number;
    total: number;
    percentage: number;
    passed: boolean;
    details: Record<string, boolean>;
  } | null>(null);

  if (!isOpen) return null;

  const currentLab = PRACTICAL_LABS.find((l) => l.id === selectedLabId) || PRACTICAL_LABS[0];

  const handleGradeLab = () => {
    const result = evaluateLab(currentLab, currentDevices, currentLinks);
    setEvalResult(result);

    if (result.passed) {
      sound.playPingSuccess();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    } else {
      sound.playError();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Bài Thực Hành Hạ Tầng Mạng (Practical Labs)
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  5 Chuyên Đề
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Thực hành thiết kế hạ tầng, phân chia mạng con, cấu hình thiết bị và chấm điểm tự động
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Lab Menu */}
          <div className="w-1/3 border-r border-slate-800 overflow-y-auto p-3 space-y-2 bg-slate-950/40">
            {PRACTICAL_LABS.map((lab) => {
              const isSelected = lab.id === selectedLabId;
              return (
                <button
                  key={lab.id}
                  onClick={() => {
                    setSelectedLabId(lab.id);
                    setEvalResult(null);
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500/50 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        lab.difficulty === 'Căn bản'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : lab.difficulty === 'Trung cấp'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {lab.difficulty}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="w-3 h-3" /> {lab.estimatedMinutes} phút
                    </span>
                  </div>
                  <h4 className="text-xs font-bold leading-snug">{lab.title}</h4>
                </button>
              );
            })}
          </div>

          {/* Right Lab Detail */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-white">{currentLab.title}</h3>
                <button
                  onClick={() => {
                    onLoadLab(currentLab);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors shadow-lg"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Nạp Bài Lab Này
                </button>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                {currentLab.summary}
              </p>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Hướng dẫn từng bước (Step-by-step Guide):
              </h4>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
                {currentLab.guideMarkdown}
              </div>
            </div>

            {/* Objectives Checklist & Grading */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Mục tiêu cần hoàn thành (Objectives):
                </h4>
                <button
                  onClick={handleGradeLab}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow"
                >
                  <Award className="w-3.5 h-3.5" /> Kiểm Tra Lab & Chấm Điểm
                </button>
              </div>

              <div className="space-y-2">
                {currentLab.objectives.map((obj) => {
                  const isDone = evalResult?.details[obj.id] ?? false;
                  return (
                    <div
                      key={obj.id}
                      className={`p-3 rounded-xl border flex items-start gap-3 transition-colors ${
                        isDone
                          ? 'bg-emerald-950/40 border-emerald-500/40'
                          : 'bg-slate-950/60 border-slate-800'
                      }`}
                    >
                      {isDone ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                      )}
                      <div>
                        <div className={`text-xs font-bold ${isDone ? 'text-emerald-300' : 'text-white'}`}>
                          {obj.title}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {obj.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Evaluation Result Toast / Banner */}
              {evalResult && (
                <div
                  className={`p-4 rounded-xl border flex items-center justify-between ${
                    evalResult.passed
                      ? 'bg-emerald-900/30 border-emerald-500/40 text-emerald-200'
                      : 'bg-amber-900/30 border-amber-500/40 text-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-6 h-6 text-yellow-400" />
                    <div>
                      <div className="text-sm font-bold">
                        {evalResult.passed ? 'Chúc mừng! Bạn đã hoàn thành xuất sắc bài lab.' : 'Chưa đạt đủ mục tiêu.'}
                      </div>
                      <div className="text-xs text-slate-300">
                        Điểm số: {evalResult.score}/{evalResult.total} ({evalResult.percentage}%)
                      </div>
                    </div>
                  </div>
                  <span className="text-2xl font-black font-mono">
                    {evalResult.percentage}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
