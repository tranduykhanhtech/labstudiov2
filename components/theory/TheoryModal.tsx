'use client';

import React, { useState } from 'react';
import { NetworkDevice, NetworkLink } from '@/types/network';
import {
  THEORY_CHAPTERS,
  TOPOLOGY_TEMPLATES,
  TopologyTemplate,
} from '@/lib/theory/curriculumData';
import { sound } from '@/lib/sound/soundEffects';
import {
  X,
  BookOpen,
  Network,
  Play,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { MarkdownViewer } from './MarkdownViewer';

interface TheoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadTopology: (topology: { devices: NetworkDevice[]; links: NetworkLink[] }) => void;
}

export const TheoryModal: React.FC<TheoryModalProps> = ({
  isOpen,
  onClose,
  onLoadTopology,
}) => {
  const [mainTab, setMainTab] = useState<'theory' | 'templates'>('theory');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('chap-1');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('topo-1');

  if (!isOpen) return null;

  const currentChapter =
    THEORY_CHAPTERS.find((c) => c.id === selectedChapterId) || THEORY_CHAPTERS[0];
  const currentTemplate =
    TOPOLOGY_TEMPLATES.find((t) => t.id === selectedTemplateId) || TOPOLOGY_TEMPLATES[0];

  const handleApplyTemplate = (template: TopologyTemplate) => {
    const topology = template.createTopology();
    onLoadTopology(topology);
    sound.playPingSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-xl text-slate-100 overflow-hidden">
        {/* Header - Clean & Focused */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white">
                  Giáo Trình Lý Thuyết & Sơ Đồ Mạng Mẫu
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  CCNA & Network+
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Lý thuyết mô hình OSI L1-L7, nguyên lý thiết bị và nạp nhanh các sơ đồ mạng mẫu
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

        {/* Tab Selector Bar */}
        <div className="flex items-center px-5 border-b border-slate-800 bg-slate-950/60 gap-4">
          <button
            onClick={() => setMainTab('theory')}
            className={`flex items-center gap-1.5 py-2.5 border-b-2 font-medium text-xs transition-colors ${
              mainTab === 'theory'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            Lý Thuyết Giảng Dạy (7 Chương)
          </button>

          <button
            onClick={() => setMainTab('templates')}
            className={`flex items-center gap-1.5 py-2.5 border-b-2 font-medium text-xs transition-colors ${
              mainTab === 'templates'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Network className="w-4 h-4" />
            Sơ Đồ Mẫu 1-Click (7 Mô Hình)
          </button>
        </div>

        {/* Main Body Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* TAB 1: LÝ THUYẾT GIẢNG DẠY */}
          {mainTab === 'theory' && (
            <>
              {/* Left Sidebar Chapters */}
              <div className="w-80 border-r border-slate-800 overflow-y-auto p-3 space-y-2 bg-slate-950/40">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                  Mục Lục Các Chương
                </div>
                {THEORY_CHAPTERS.map((chapter) => {
                  const isSelected = chapter.id === selectedChapterId;
                  return (
                    <button
                      key={chapter.id}
                      onClick={() => {
                        setSelectedChapterId(chapter.id);
                        sound.playKeyClick();
                      }}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-500/50 text-white shadow-md'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono block w-fit mb-1.5">
                        {chapter.badge}
                      </span>
                      <h4 className="text-xs font-bold leading-snug">{chapter.title}</h4>
                    </button>
                  );
                })}
              </div>

              {/* Right Content Viewport */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider font-mono">
                    {currentChapter.badge}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1">{currentChapter.title}</h3>
                </div>

                {/* Rich Formatted Markdown Content */}
                <div className="p-6 bg-slate-950/70 rounded-xl border border-slate-800">
                  <MarkdownViewer content={currentChapter.contentMarkdown} />
                </div>
              </div>
            </>
          )}

          {/* TAB 2: CÁC MÔ HÌNH MẪU & SƠ ĐỒ NỐI DÂY */}
          {mainTab === 'templates' && (
            <>
              {/* Left Sidebar Templates */}
              <div className="w-80 border-r border-slate-800 overflow-y-auto p-3 space-y-2 bg-slate-950/40">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                  Mô Hình Kiến Trúc Mẫu
                </div>
                {TOPOLOGY_TEMPLATES.map((tmpl) => {
                  const isSelected = tmpl.id === selectedTemplateId;
                  return (
                    <button
                      key={tmpl.id}
                      onClick={() => {
                        setSelectedTemplateId(tmpl.id);
                        sound.playKeyClick();
                      }}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500/50 text-white shadow-md'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono block w-fit mb-1.5">
                        {tmpl.badge}
                      </span>
                      <h4 className="text-xs font-bold leading-snug">{tmpl.title}</h4>
                    </button>
                  );
                })}
              </div>

              {/* Right Blueprint Viewport */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Title & Quick Load Action */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider font-mono">
                      {currentTemplate.badge}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-1">{currentTemplate.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-2xl">{currentTemplate.description}</p>
                  </div>

                  <button
                    onClick={() => handleApplyTemplate(currentTemplate)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all shrink-0 active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Nạp Mô Hình Này Lên Canvas</span>
                  </button>
                </div>

                {/* Sơ Đồ Bảng Nối Dây Chi Tiết */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
                    <Info className="w-4 h-4 text-blue-400" />
                    Bảng Sơ Đồ Nối Dây Chi Tiết Giữa Các Thiết Bị (Wiring Diagram)
                  </div>

                  <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
                    <table className="w-full text-left font-mono text-[11px]">
                      <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 select-none">
                        <tr>
                          <th className="py-2.5 px-3">Thiết Bị Nguồn (Cổng)</th>
                          <th className="py-2.5 px-3">Loại Cáp Chuẩn</th>
                          <th className="py-2.5 px-3">Thiết Bị Đích (Cổng)</th>
                          <th className="py-2.5 px-3">Mục Đích & Nguyên Lý Nối Dây</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {currentTemplate.wiringTable.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                            <td className="py-2.5 px-3 text-white font-semibold flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              {row.fromDevice} <span className="text-slate-400 font-normal">({row.fromPort})</span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                  row.cableType === 'straight'
                                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                    : row.cableType === 'crossover'
                                    ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                                    : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                                }`}
                              >
                                {row.cableLabel}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-white font-semibold">
                              <span className="text-slate-400 mr-1.5">→</span>
                              {row.toDevice} <span className="text-slate-400 font-normal">({row.toPort})</span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-300 text-[10.5px] leading-relaxed">
                              {row.purpose}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Giải Thích Kiến Trúc Bổ Trợ */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Phân Tích Kiến Trúc & Hướng Dẫn Thực Chiến
                  </div>
                  <div className="p-5 bg-slate-950/70 rounded-xl border border-slate-800">
                    <MarkdownViewer content={currentTemplate.explanationMarkdown} />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
