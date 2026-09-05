import React, { useState, useMemo } from 'react';
import {
  X,
  Clock,
  Trash2,
  Check,
  Coffee,
  Utensils,
  BookOpen,
  ArrowRight,
  Plus,
  AlertTriangle,
  FastForward,
} from 'lucide-react';
import { TimeSlotConfig, Timetable } from '../types';

interface EditSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: TimeSlotConfig | null;
  timetable: Timetable;
  onSaveSlot: (updatedSlot: TimeSlotConfig, shiftSubsequentMinutes?: number) => void;
  onDeleteSlot: (slotId: string) => void;
  onInsertSlotAfter?: (slotId: string) => void;
}

export const EditSessionModal: React.FC<EditSessionModalProps> = ({
  isOpen,
  onClose,
  slot,
  timetable,
  onSaveSlot,
  onDeleteSlot,
  onInsertSlotAfter,
}) => {
  if (!isOpen || !slot) return null;

  const [name, setName] = useState(slot.name || '');
  const [start, setStart] = useState(slot.start || '09:00');
  const [end, setEnd] = useState(slot.end || '10:00');
  const [isBreak, setIsBreak] = useState(Boolean(slot.isBreak));
  const [breakType, setBreakType] = useState<'lunch' | 'tea' | 'recess' | 'free' | 'custom'>(
    slot.breakType || 'lunch'
  );
  const [shiftSubsequent, setShiftSubsequent] = useState<number>(0);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Helper to parse "HH:MM" to total minutes
  const parseMinutes = (timeStr: string): number => {
    const parts = timeStr.split(':').map(Number);
    if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return parts[0] * 60 + parts[1];
    }
    return 0;
  };

  // Helper to format total minutes to "HH:MM"
  const formatMinutes = (totalMinutes: number): string => {
    const normalized = Math.max(0, Math.min(24 * 60 - 1, totalMinutes));
    const h = Math.floor(normalized / 60);
    const m = normalized % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // Calculate duration string
  const durationInfo = useMemo(() => {
    const s = parseMinutes(start);
    const e = parseMinutes(end);
    let diff = e - s;
    if (diff < 0) diff += 24 * 60; // Crosses midnight

    const hours = Math.floor(diff / 60);
    const mins = diff % 60;

    let text = '';
    if (hours > 0 && mins > 0) text = `${hours} hr ${mins} mins`;
    else if (hours > 0) text = `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    else text = `${mins} mins`;

    return { diffMinutes: diff, text };
  }, [start, end]);

  // Quick duration setter: updates end time based on start time + minutes
  const handleSetDuration = (minutes: number) => {
    const startMins = parseMinutes(start);
    const newEndMins = (startMins + minutes) % (24 * 60);
    setEnd(formatMinutes(newEndMins));
  };

  // Count entries using this slot
  const entriesInThisSlot = timetable.entries.filter((e) => e.slotId === slot.id);

  const handleSave = () => {
    const updatedSlot: TimeSlotConfig = {
      ...slot,
      name: name.trim() || 'Session',
      start: start.trim(),
      end: end.trim(),
      isBreak,
      breakType: isBreak ? breakType : undefined,
    };
    onSaveSlot(updatedSlot, shiftSubsequent);
    onClose();
  };

  const QUICK_DURATIONS = [
    { label: '30m', minutes: 30 },
    { label: '45m', minutes: 45 },
    { label: '1h', minutes: 60 },
    { label: '1.5h', minutes: 90 },
    { label: '2h', minutes: 120 },
    { label: '2.5h', minutes: 150 },
  ];

  const POPULAR_SLOT_NAMES = [
    'Morning Recall',
    'Core Subject Drill',
    'Quantitative & Logic',
    'Nutritious Lunch & Walk',
    'Full-Length Mock Test',
    'Error Log & Analytics',
    'Concept Revision',
    'Dinner & Break',
    'Daily Wrap-up / Journal',
    'Sleep & Recovery',
    'Lecture',
    'Laboratory Session',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#141414] rounded-2xl shadow-2xl border border-[#262626] w-full max-w-lg overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 text-[#ededed]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#262626] flex items-center justify-between bg-[#161616]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#c5a059]/15 text-[#c5a059] flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-[#f5f5f5] tracking-wide">
                Edit Session Timings
              </h2>
              <p className="text-xs text-[#a3a3a3]">
                Adjust period name, start/end times, and duration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#737373] hover:text-[#ededed] rounded-lg hover:bg-[#202020] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* 1. Session Name */}
          <div>
            <label className="text-xs font-bold text-[#ededed] block mb-1.5">
              Session / Period Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Morning Recall or Period 1"
              className="w-full text-sm px-3 py-2 bg-[#1a1a1a] border border-[#2e2e2e] focus:border-[#c5a059] rounded-xl text-[#ededed] placeholder-[#666666] outline-hidden font-medium transition-colors"
            />

            {/* Quick Name Suggestions */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {POPULAR_SLOT_NAMES.slice(0, 5).map((sugg) => (
                <button
                  key={sugg}
                  type="button"
                  onClick={() => setName(sugg)}
                  className="text-[10px] px-2 py-0.5 rounded-md border border-[#2a2a2a] bg-[#181818] hover:border-[#c5a059]/50 hover:text-[#c5a059] text-[#888888] transition-colors"
                >
                  {sugg}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Timing Inputs (Start - End) */}
          <div className="p-4 bg-[#181818] rounded-xl border border-[#262626] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#ededed] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#c5a059]" />
                Session Time Window
              </span>
              <span className="text-xs font-mono font-bold text-[#c5a059] bg-[#c5a059]/10 px-2 py-0.5 rounded-md border border-[#c5a059]/30">
                {durationInfo.text}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <label className="text-[11px] font-semibold text-[#888888] block mb-1">
                  Start Time
                </label>
                <div className="relative">
                  <input
                    type="time"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                    className="w-full text-sm font-mono px-3 py-2 bg-[#1f1f1f] border border-[#303030] focus:border-[#c5a059] rounded-lg text-[#ededed] outline-hidden cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#888888] block mb-1">
                  End Time
                </label>
                <div className="relative">
                  <input
                    type="time"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                    className="w-full text-sm font-mono px-3 py-2 bg-[#1f1f1f] border border-[#303030] focus:border-[#c5a059] rounded-lg text-[#ededed] outline-hidden cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Quick Duration Adjusters */}
            <div>
              <span className="text-[11px] font-medium text-[#737373] block mb-1.5">
                Set Duration (from start time):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_DURATIONS.map((dur) => (
                  <button
                    key={dur.label}
                    type="button"
                    onClick={() => handleSetDuration(dur.minutes)}
                    className="text-xs font-mono font-medium px-2.5 py-1 rounded-lg border border-[#333333] hover:border-[#c5a059] bg-[#222222] hover:bg-[#c5a059]/10 text-[#d4d4d4] hover:text-[#c5a059] transition-all"
                  >
                    {dur.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Session Classification (Normal vs Break) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#ededed] block">Session Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsBreak(false)}
                className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                  !isBreak
                    ? 'border-[#c5a059] bg-[#c5a059]/10 ring-2 ring-[#c5a059]/30 text-[#f5f5f5] font-bold'
                    : 'border-[#262626] hover:border-[#383838] bg-[#1a1a1a] text-[#888888]'
                }`}
              >
                <BookOpen className="w-4 h-4 text-[#c5a059]" />
                <div>
                  <div className="text-xs">Class / Study Period</div>
                  <div className="text-[10px] text-[#737373]">Subjects scheduled per day</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsBreak(true)}
                className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                  isBreak
                    ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30 text-[#f5f5f5] font-bold'
                    : 'border-[#262626] hover:border-[#383838] bg-[#1a1a1a] text-[#888888]'
                }`}
              >
                <Coffee className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-xs">Break / Rest Interval</div>
                  <div className="text-[10px] text-[#737373]">Spans across all days</div>
                </div>
              </button>
            </div>

            {isBreak && (
              <div className="flex items-center gap-2 pt-1">
                {(['lunch', 'tea', 'recess', 'free'] as const).map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBreakType(b)}
                    className={`text-xs capitalize px-3 py-1.5 rounded-lg border transition-all ${
                      breakType === b
                        ? 'border-amber-500 bg-amber-500/20 text-amber-300 font-bold'
                        : 'border-[#2e2e2e] bg-[#1a1a1a] text-[#888888] hover:text-[#ededed]'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 4. Cascade Shift Subsequent Sessions */}
          <div className="p-3 bg-[#171717] rounded-xl border border-[#262626] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#a3a3a3] flex items-center gap-1.5">
                <FastForward className="w-3.5 h-3.5 text-[#c5a059]" />
                Auto-Shift Subsequent Sessions
              </span>
              {shiftSubsequent !== 0 && (
                <span className="text-xs font-bold text-[#c5a059]">
                  {shiftSubsequent > 0 ? `+${shiftSubsequent}m` : `${shiftSubsequent}m`}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#737373]">
              Automatically adjust all following sessions by this offset to prevent gaps or overlaps.
            </p>
            <div className="flex items-center gap-1.5 pt-1">
              {[0, 15, 30, 45, 60].map((shift) => (
                <button
                  key={shift}
                  type="button"
                  onClick={() => setShiftSubsequent(shift)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                    shiftSubsequent === shift
                      ? 'border-[#c5a059] bg-[#c5a059]/15 text-[#c5a059] font-bold'
                      : 'border-[#2a2a2a] bg-[#1f1f1f] text-[#888888] hover:text-[#ededed]'
                  }`}
                >
                  {shift === 0 ? 'No Shift' : `+${shift}m`}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Delete Session Confirmation Option */}
          {showConfirmDelete ? (
            <div className="p-3 bg-rose-950/30 border border-rose-800/50 rounded-xl space-y-2 animate-in fade-in duration-150">
              <div className="flex items-start gap-2 text-xs text-rose-200">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Delete "{slot.name}"?</span>
                  {entriesInThisSlot.length > 0 && (
                    <p className="text-[11px] text-rose-300/80 mt-0.5">
                      This will also remove {entriesInThisSlot.length} scheduled subject(s) in this row.
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(false)}
                  className="px-3 py-1 rounded-lg text-xs font-semibold text-[#a3a3a3] hover:text-[#ededed] bg-[#222222]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteSlot(slot.id);
                    onClose();
                  }}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  Yes, Delete Session
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#262626] bg-[#161616] flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!showConfirmDelete && (
              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                disabled={timetable.timeSlots.length <= 1}
                className="px-3 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-20"
                title="Delete this session / period row"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Delete Session</span>
              </button>
            )}

            {onInsertSlotAfter && (
              <button
                type="button"
                onClick={() => {
                  onInsertSlotAfter(slot.id);
                  onClose();
                }}
                className="px-3 py-2 text-[#888888] hover:text-[#c5a059] hover:bg-[#c5a059]/10 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Insert a new session row immediately after this one"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Insert Below</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#2e2e2e] rounded-lg text-xs font-semibold text-[#a3a3a3] hover:text-[#ededed] hover:bg-[#1e1e1e] transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-[#c5a059] hover:bg-[#d4af37] text-[#0a0a0a] rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Check className="w-4 h-4" />
              Save Timings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
