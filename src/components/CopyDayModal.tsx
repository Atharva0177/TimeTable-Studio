import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  ArrowRight,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Layers,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { Timetable, DayConfig, TimetableEntry } from '../types';
import { getNextDay } from '../utils/timetableOperations';
import { IconRenderer } from './IconRenderer';

interface CopyDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  timetable: Timetable;
  initialSourceDayId?: string;
  onConfirmCopy: (sourceDayId: string, targetDayId: string, mode: 'replace' | 'merge') => void;
}

export const CopyDayModal: React.FC<CopyDayModalProps> = ({
  isOpen,
  onClose,
  timetable,
  initialSourceDayId,
  onConfirmCopy,
}) => {
  const days = timetable.days || [];
  
  // Default source day to passed initialSourceDayId or first day
  const defaultSourceId =
    initialSourceDayId && days.some((d) => d.id === initialSourceDayId)
      ? initialSourceDayId
      : days[0]?.id || '';

  const [sourceDayId, setSourceDayId] = useState<string>(defaultSourceId);
  const [targetDayId, setTargetDayId] = useState<string>('');
  const [mode, setMode] = useState<'replace' | 'merge'>('replace');

  // When modal opens or initialSourceDayId changes, update source & auto-select next day
  useEffect(() => {
    if (isOpen && days.length > 0) {
      const srcId =
        initialSourceDayId && days.some((d) => d.id === initialSourceDayId)
          ? initialSourceDayId
          : days[0].id;
      setSourceDayId(srcId);
      
      const next = getNextDay(days, srcId);
      if (next) {
        setTargetDayId(next.id);
      }
    }
  }, [isOpen, initialSourceDayId, timetable.days]);

  // When user changes sourceDayId, automatically recommend the next day as target
  const handleSourceDayChange = (newSrcId: string) => {
    setSourceDayId(newSrcId);
    const next = getNextDay(days, newSrcId);
    if (next) {
      setTargetDayId(next.id);
    }
  };

  if (!isOpen) return null;

  const sourceDay = days.find((d) => d.id === sourceDayId);
  const targetDay = days.find((d) => d.id === targetDayId);
  const nextDay = sourceDay ? getNextDay(days, sourceDay.id) : null;
  const isTargetTheNextDay = nextDay?.id === targetDayId;

  // Entries for source and target days
  const sourceEntries = timetable.entries.filter((e) => e.dayId === sourceDayId);
  const targetEntries = timetable.entries.filter((e) => e.dayId === targetDayId);

  // Group source entries by time slot order
  const orderedSourceEntries: Array<{ slotName: string; time: string; entry: TimetableEntry }> = [];
  timetable.timeSlots.forEach((slot) => {
    const entry = sourceEntries.find((e) => e.slotId === slot.id);
    if (entry) {
      orderedSourceEntries.push({
        slotName: slot.name,
        time: `${slot.start} – ${slot.end}`,
        entry,
      });
    }
  });

  const handleCopy = () => {
    if (!sourceDayId || !targetDayId || sourceDayId === targetDayId) return;
    onConfirmCopy(sourceDayId, targetDayId, mode);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="copy-day-title"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-[#141414] rounded-2xl shadow-2xl border border-[#2e2e2e] w-full max-w-lg overflow-hidden text-[#ededed] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-[#262626] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#c5a059]/15 border border-[#c5a059]/30 flex items-center justify-center text-[#c5a059]">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <h3 id="copy-day-title" className="font-serif font-bold text-base text-[#f5f5f5] tracking-wide">
                Copy Day Timetable
              </h3>
              <p className="text-xs text-[#888888]">
                Duplicate sessions from a single day to the next day
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#737373] hover:text-[#ededed] hover:bg-[#202020] rounded-lg transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Source & Target Day Selection Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] items-center gap-3 p-4 rounded-xl bg-[#181818] border border-[#262626]">
            {/* Source Day Card */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#a3a3a3] uppercase tracking-wider block">
                Copy From (Source)
              </label>
              <select
                value={sourceDayId}
                onChange={(e) => handleSourceDayChange(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 bg-[#202020] border border-[#333333] hover:border-[#c5a059] focus:border-[#c5a059] text-[#f5f5f5] rounded-xl focus:outline-hidden cursor-pointer"
              >
                {days.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-1 text-[11px] text-[#888888]">
                <Calendar className="w-3 h-3 text-[#c5a059]" />
                <span>
                  {sourceEntries.length} {sourceEntries.length === 1 ? 'session' : 'sessions'} scheduled
                </span>
              </div>
            </div>

            {/* Direction Arrow */}
            <div className="hidden sm:flex flex-col items-center justify-center px-1">
              <div className="w-8 h-8 rounded-full bg-[#242424] border border-[#383838] flex items-center justify-center text-[#c5a059]">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Target Day Card */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-[#a3a3a3] uppercase tracking-wider block">
                  Copy To (Target)
                </label>
                {isTargetTheNextDay && (
                  <span className="text-[10px] font-bold text-[#c5a059] bg-[#c5a059]/15 px-1.5 py-0.2 rounded-md">
                    Next Day
                  </span>
                )}
              </div>
              <select
                value={targetDayId}
                onChange={(e) => setTargetDayId(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 bg-[#202020] border border-[#333333] hover:border-[#c5a059] focus:border-[#c5a059] text-[#f5f5f5] rounded-xl focus:outline-hidden cursor-pointer"
              >
                {days.map((d) => (
                  <option key={d.id} value={d.id} disabled={d.id === sourceDayId}>
                    {d.name} {d.id === nextDay?.id ? '(Next Day)' : ''} {d.id === sourceDayId ? '(Source)' : ''}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-1 text-[11px] text-[#888888]">
                {targetEntries.length > 0 ? (
                  <span className="text-amber-400/90 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    Has {targetEntries.length} existing {targetEntries.length === 1 ? 'session' : 'sessions'}
                  </span>
                ) : (
                  <span className="text-emerald-400/90 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    Currently empty
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Warning if source day is empty */}
          {sourceEntries.length === 0 && (
            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 text-amber-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                <strong>{sourceDay?.name || 'Selected day'}</strong> has no scheduled sessions to copy yet. Add some subjects or select a different day.
              </span>
            </div>
          )}

          {/* Copy Mode Options */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider block">
              Copy Strategy
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Replace Strategy */}
              <button
                type="button"
                onClick={() => setMode('replace')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  mode === 'replace'
                    ? 'border-[#c5a059] bg-[#c5a059]/10 shadow-xs'
                    : 'border-[#262626] bg-[#181818] hover:border-[#3a3a3a]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#ededed]">Replace Target Day</span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      mode === 'replace'
                        ? 'border-[#c5a059] bg-[#c5a059]'
                        : 'border-[#444444]'
                    }`}
                  >
                    {mode === 'replace' && <div className="w-1.5 h-1.5 rounded-full bg-[#0a0a0a]" />}
                  </div>
                </div>
                <p className="text-[11px] text-[#888888] leading-snug">
                  Clears any existing classes on {targetDay?.name || 'target day'} and completely mirrors {sourceDay?.name || 'source day'}.
                </p>
              </button>

              {/* Merge Strategy */}
              <button
                type="button"
                onClick={() => setMode('merge')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  mode === 'merge'
                    ? 'border-[#c5a059] bg-[#c5a059]/10 shadow-xs'
                    : 'border-[#262626] bg-[#181818] hover:border-[#3a3a3a]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#ededed]">Merge (Fill Empty Only)</span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      mode === 'merge'
                        ? 'border-[#c5a059] bg-[#c5a059]'
                        : 'border-[#444444]'
                    }`}
                  >
                    {mode === 'merge' && <div className="w-1.5 h-1.5 rounded-full bg-[#0a0a0a]" />}
                  </div>
                </div>
                <p className="text-[11px] text-[#888888] leading-snug">
                  Preserves existing classes on {targetDay?.name || 'target day'}, only copying sessions into empty periods.
                </p>
              </button>
            </div>
          </div>

          {/* Sessions Preview */}
          {orderedSourceEntries.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider block">
                  Sessions to be Copied ({orderedSourceEntries.length})
                </label>
                <span className="text-[11px] text-[#737373]">
                  From {sourceDay?.name} → To {targetDay?.name}
                </span>
              </div>

              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {orderedSourceEntries.map(({ slotName, time, entry }) => (
                  <div
                    key={entry.id}
                    className="p-2 rounded-lg bg-[#181818] border border-[#262626] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: entry.color || '#c5a059' }}
                      />
                      <div className="min-w-0">
                        <span className="font-semibold text-[#ededed] truncate block">
                          {entry.title}
                        </span>
                        <span className="text-[10px] text-[#888888] block">
                          {slotName} ({time})
                          {entry.room ? ` • ${entry.room}` : ''}
                          {entry.teacher ? ` • ${entry.teacher}` : ''}
                        </span>
                      </div>
                    </div>

                    {entry.icon && (
                      <div className="opacity-60 shrink-0">
                        <IconRenderer name={entry.icon} size={14} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#262626] bg-[#121212] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#a3a3a3] hover:text-[#ededed] hover:bg-[#1f1f1f] transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleCopy}
            disabled={
              sourceEntries.length === 0 ||
              !sourceDayId ||
              !targetDayId ||
              sourceDayId === targetDayId
            }
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
              sourceEntries.length === 0 || sourceDayId === targetDayId
                ? 'bg-[#262626] text-[#666666] cursor-not-allowed'
                : 'bg-[#c5a059] hover:bg-[#d4af37] text-[#0a0a0a]'
            }`}
            id="btn-confirm-copy-day"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>
              {isTargetTheNextDay
                ? `Copy to Next Day (${targetDay?.name || 'Next Day'})`
                : `Copy to ${targetDay?.name || 'Selected Day'}`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
