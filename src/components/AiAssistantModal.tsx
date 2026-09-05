import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Send,
  Wand2,
  Palette,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Timetable } from '../types';
import { PRESET_THEMES } from '../data/presets';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  timetable: Timetable;
  onUpdateTimetable: (updated: Timetable) => void;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  timetable,
  onUpdateTimetable,
}) => {
  if (!isOpen) return null;

  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const QUICK_COMMANDS = [
    { label: 'Apply Professional Corporate Theme', cmd: 'Apply the executive slate professional theme' },
    { label: 'Color Core Lectures Light Blue', cmd: 'Make all lecture cells blue with dark blue text' },
    { label: 'Add 15-min Morning Break', cmd: 'Add a 15-minute tea break between period 2 and 3' },
    { label: 'Switch to Modern Outfit Font', cmd: 'Change timetable typography to Outfit font' },
  ];

  const handleApplyInstruction = async (cmdText: string) => {
    const textToRun = cmdText || instruction;
    if (!textToRun.trim()) return;

    setLoading(true);
    setFeedbackMessage(null);

    try {
      const res = await fetch('/api/ai/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction: textToRun,
          currentTimetable: timetable,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to edit with AI');
      }

      onUpdateTimetable(data.data);
      setFeedbackMessage('Timetable updated according to your instruction!');
      setTimeout(() => setFeedbackMessage(null), 3000);
      setInstruction('');
    } catch (err: any) {
      console.warn('AI edit error, using heuristic fallback:', err);
      // Fallback heuristics: check keywords in textToRun
      const lower = textToRun.toLowerCase();
      let updated = { ...timetable };

      if (lower.includes('blue')) {
        updated.entries = updated.entries.map((e) => ({
          ...e,
          color: '#dbeafe',
          textColor: '#1e40af',
        }));
        setFeedbackMessage('Heuristic Applied: Updated cell color theme to blue!');
      } else if (lower.includes('dark') || lower.includes('midnight')) {
        const darkTheme = PRESET_THEMES.find((t) => t.id === 'dark');
        if (darkTheme) updated.theme = darkTheme;
        setFeedbackMessage('Heuristic Applied: Switched to Twilight Midnight theme!');
      } else if (lower.includes('professional') || lower.includes('slate') || lower.includes('executive')) {
        const profTheme = PRESET_THEMES.find((t) => t.id === 'professional');
        if (profTheme) updated.theme = profTheme;
        setFeedbackMessage('Heuristic Applied: Switched to Executive Slate theme!');
      } else if (lower.includes('outfit')) {
        updated.theme = { ...updated.theme, fontFamily: 'font-outfit' };
        setFeedbackMessage('Heuristic Applied: Changed font to Outfit!');
      } else {
        setFeedbackMessage(
          'Gemini API key is not active. For full natural language rewriting, configure GEMINI_API_KEY in AI Studio secrets.'
        );
      }

      onUpdateTimetable(updated);
      setTimeout(() => setFeedbackMessage(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#141414] rounded-2xl shadow-2xl border border-[#2a2a2a] w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-[#ededed]">
        <div className="p-4 sm:p-5 border-b border-[#262626] flex items-center justify-between bg-gradient-to-r from-[#181818] via-[#1c1810] to-[#181818]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#c5a059]/20 text-[#c5a059] flex items-center justify-center font-bold shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-[#f5f5f5] tracking-wide">AI Timetable Assistant</h2>
              <p className="text-xs text-[#a3a3a3]">Edit, restyle, and optimize your schedule using natural language</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#737373] hover:text-[#ededed] rounded-lg hover:bg-[#202020] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Natural language instruction input */}
          <div>
            <label className="text-xs font-bold text-[#ededed] uppercase tracking-wider block mb-1.5">
              What would you like to change?
            </label>
            <div className="relative">
              <textarea
                rows={3}
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="e.g. Move all math classes to the morning, or apply a modern university aesthetic..."
                className="w-full text-xs p-3 pr-12 bg-[#1a1a1a] border border-[#2e2e2e] text-[#ededed] placeholder-[#737373] rounded-xl focus:border-[#c5a059] focus:outline-hidden leading-relaxed"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleApplyInstruction(instruction);
                  }
                }}
              />
              <button
                onClick={() => handleApplyInstruction(instruction)}
                disabled={loading || !instruction.trim()}
                className="absolute bottom-3 right-3 p-1.5 rounded-lg bg-[#c5a059] text-[#0a0a0a] hover:bg-[#d4af37] disabled:opacity-30 transition-colors"
                title="Send instruction"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick command pills */}
          <div>
            <span className="text-[11px] font-semibold text-[#888888] uppercase tracking-wider block mb-2">
              Quick AI Transformations
            </span>
            <div className="space-y-1.5">
              {QUICK_COMMANDS.map((qc, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInstruction(qc.cmd);
                    handleApplyInstruction(qc.cmd);
                  }}
                  className="w-full text-left p-2.5 rounded-xl border border-[#262626] hover:border-[#c5a059]/50 bg-[#181818] hover:bg-[#202020] text-xs font-medium text-[#ededed] flex items-center justify-between group transition-all"
                >
                  <span>{qc.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#737373] group-hover:text-[#c5a059] group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>
          </div>

          {feedbackMessage && (
            <div className="p-3 bg-[#c5a059]/10 border border-[#c5a059]/30 rounded-xl text-xs text-[#e0bf79] flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-[#c5a059] shrink-0 mt-0.5" />
              <span>{feedbackMessage}</span>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#1e1e1e] hover:bg-[#282828] border border-[#2e2e2e] text-[#ededed] rounded-lg text-xs font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
