'use client';

import React from 'react';

interface MarkdownViewerProps {
  content: string;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content }) => {
  const lines = content.split('\n');

  const renderFormattedText = (text: string) => {
    // Format bold and inline code
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="text-white font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[11px] border border-slate-700/60">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-3 text-slate-300 leading-relaxed text-xs">
      {lines.map((line, index) => {
        const trimmed = line.trim();

        // Empty line
        if (!trimmed) {
          return <div key={index} className="h-1.5" />;
        }

        // Horizontal Rule
        if (trimmed === '---') {
          return <hr key={index} className="border-slate-800 my-4" />;
        }

        // H1 Heading
        if (trimmed.startsWith('# ')) {
          return (
            <h1 key={index} className="text-base font-bold text-white pt-2 pb-1 border-b border-slate-800">
              {trimmed.slice(2)}
            </h1>
          );
        }

        // H2 Heading
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={index} className="text-sm font-bold text-blue-400 pt-3 pb-1">
              {trimmed.slice(3)}
            </h2>
          );
        }

        // H3 Heading
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={index} className="text-xs font-bold text-cyan-300 uppercase tracking-wide pt-2">
              {trimmed.slice(4)}
            </h3>
          );
        }

        // Bullet point
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={index} className="flex items-start gap-2 pl-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
              <span>{renderFormattedText(trimmed.slice(2))}</span>
            </div>
          );
        }

        // Numbered list
        const matchNumber = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (matchNumber) {
          return (
            <div key={index} className="flex items-start gap-2 pl-2">
              <span className="font-bold text-slate-400 shrink-0 font-mono text-[11px]">
                {matchNumber[1]}.
              </span>
              <span>{renderFormattedText(matchNumber[2])}</span>
            </div>
          );
        }

        // Code block / quote
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote key={index} className="border-l-2 border-blue-500 pl-3 py-1 my-2 bg-blue-950/20 text-slate-300 italic">
              {renderFormattedText(trimmed.slice(2))}
            </blockquote>
          );
        }

        // Standard paragraph
        return (
          <p key={index} className="text-slate-300">
            {renderFormattedText(line)}
          </p>
        );
      })}
    </div>
  );
};
