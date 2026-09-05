import React, { useState } from 'react';
import {
  Clock,
  MapPin,
  User,
  AlertTriangle,
  Utensils,
  Coffee,
  Plus,
  Edit2,
  Edit3,
  X,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { Timetable, LayoutMode, DeviceView, ConflictIssue, TimetableEntry, TimeSlotConfig } from '../types';
import { IconRenderer } from './IconRenderer';
import { HeaderInfoModal } from './HeaderInfoModal';
import { EditSessionModal } from './EditSessionModal';

interface TimetableCanvasProps {
  timetable: Timetable;
  onUpdateTimetable: (updated: Timetable) => void;
  layoutMode: LayoutMode;
  deviceView: DeviceView;
  zoomLevel: number;
  selectedCellIds: string[];
  onSelectCells: (ids: string[]) => void;
  conflicts: ConflictIssue[];
  onOpenQuickEdit: (entry: TimetableEntry) => void;
  onAddSubjectToSlot: (dayId: string, slotId: string) => void;
  onDeleteRow?: (slotId: string) => void;
  onAddRow?: () => void;
  onMoveRow?: (slotId: string, direction: 'up' | 'down') => void;
}

export const TimetableCanvas: React.FC<TimetableCanvasProps> = ({
  timetable,
  onUpdateTimetable,
  layoutMode,
  deviceView,
  zoomLevel,
  selectedCellIds,
  onSelectCells,
  conflicts,
  onOpenQuickEdit,
  onAddSubjectToSlot,
  onDeleteRow,
  onAddRow,
  onMoveRow,
}) => {
  const [draggedEntryId, setDraggedEntryId] = useState<string | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{ dayId: string; slotId: string } | null>(null);
  const [activeDailyDayId, setActiveDailyDayId] = useState<string>(timetable.days[0]?.id || 'mon');

  // Header & Session Edit Modal states
  const [isHeaderModalOpen, setIsHeaderModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlotConfig | null>(null);

  const handleSaveSlot = (updatedSlot: TimeSlotConfig, shiftSubsequentMinutes: number = 0) => {
    const slotIndex = timetable.timeSlots.findIndex((s) => s.id === updatedSlot.id);
    if (slotIndex === -1) return;

    const updatedSlots = [...timetable.timeSlots];
    updatedSlots[slotIndex] = updatedSlot;

    if (shiftSubsequentMinutes > 0) {
      const shiftTime = (timeStr: string, deltaMinutes: number) => {
        const parts = timeStr.split(':').map(Number);
        if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          const total = (parts[0] * 60 + parts[1] + deltaMinutes) % (24 * 60);
          const h = Math.floor(total / 60);
          const m = total % 60;
          return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        }
        return timeStr;
      };

      for (let i = slotIndex + 1; i < updatedSlots.length; i++) {
        updatedSlots[i] = {
          ...updatedSlots[i],
          start: shiftTime(updatedSlots[i].start, shiftSubsequentMinutes),
          end: shiftTime(updatedSlots[i].end, shiftSubsequentMinutes),
        };
      }
    }

    onUpdateTimetable({
      ...timetable,
      timeSlots: updatedSlots,
      lastEdited: new Date().toISOString(),
    });
  };

  const handleDeleteSlot = (slotId: string) => {
    if (onDeleteRow) {
      onDeleteRow(slotId);
    } else {
      const newSlots = timetable.timeSlots.filter((s) => s.id !== slotId);
      const newEntries = timetable.entries.filter((e) => e.slotId !== slotId);
      onUpdateTimetable({
        ...timetable,
        timeSlots: newSlots,
        entries: newEntries,
        lastEdited: new Date().toISOString(),
      });
    }
  };

  const handleInsertSlotAfter = (targetSlotId: string) => {
    const idx = timetable.timeSlots.findIndex((s) => s.id === targetSlotId);
    if (idx === -1) return;

    const targetSlot = timetable.timeSlots[idx];
    const parseMinutes = (timeStr: string) => {
      const parts = timeStr.split(':').map(Number);
      return (parts[0] || 0) * 60 + (parts[1] || 0);
    };
    const formatMinutes = (total: number) => {
      const norm = total % (24 * 60);
      return `${String(Math.floor(norm / 60)).padStart(2, '0')}:${String(norm % 60).padStart(2, '0')}`;
    };

    const newStartMins = parseMinutes(targetSlot.end);
    const newEndMins = (newStartMins + 60) % (24 * 60);

    const newSlot: TimeSlotConfig = {
      id: `slot_${Date.now()}`,
      name: `Session ${timetable.timeSlots.length + 1}`,
      start: targetSlot.end || '10:00',
      end: formatMinutes(newEndMins) || '11:00',
      isBreak: false,
    };

    const newSlots = [...timetable.timeSlots];
    newSlots.splice(idx + 1, 0, newSlot);

    onUpdateTimetable({
      ...timetable,
      timeSlots: newSlots,
      lastEdited: new Date().toISOString(),
    });
  };

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, entryId: string) => {
    e.dataTransfer.setData('text/plain', entryId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedEntryId(entryId);
  };

  const handleDragOver = (e: React.DragEvent, dayId: string, slotId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!dragOverCell || dragOverCell.dayId !== dayId || dragOverCell.slotId !== slotId) {
      setDragOverCell({ dayId, slotId });
    }
  };

  const handleDragLeave = (e: React.DragEvent, dayId: string, slotId: string) => {
    if (dragOverCell && dragOverCell.dayId === dayId && dragOverCell.slotId === slotId) {
      setDragOverCell(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetDayId: string, targetSlotId: string) => {
    e.preventDefault();
    setDragOverCell(null);

    // 1. Check for new subject dropped from left panel (Quick Subjects, Custom Card, Breaks)
    const rawJson = e.dataTransfer.getData('application/json');
    if (rawJson) {
      try {
        const payload = JSON.parse(rawJson);
        if (payload.type === 'new_subject' && payload.subject) {
          const newEntry: TimetableEntry = {
            id: `entry_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            dayId: targetDayId,
            slotId: targetSlotId,
            title: payload.subject.title,
            shortCode: payload.subject.shortCode,
            teacher: payload.subject.teacher,
            room: payload.subject.room,
            color: payload.subject.color,
            icon: payload.subject.icon,
            category: payload.subject.category,
          };

          // "only the latest selected should be shown"
          // Replace any existing entry at this cell
          const remaining = timetable.entries.filter(
            (entry) => !(entry.dayId === targetDayId && entry.slotId === targetSlotId)
          );

          onUpdateTimetable({
            ...timetable,
            entries: [...remaining, newEntry],
            lastEdited: new Date().toISOString(),
          });
          onSelectCells([newEntry.id]);
          return;
        }

        if (payload.type === 'new_break') {
          // If dropped on slot, convert slot to break or set entry
          const newBreakEntry: TimetableEntry = {
            id: `break_${Date.now()}`,
            dayId: targetDayId,
            slotId: targetSlotId,
            title: payload.subject.title || 'Break',
            shortCode: payload.subject.shortCode || 'BREAK',
            color: payload.subject.color || '#fef3c7',
            icon: payload.subject.icon || 'Coffee',
            category: 'Break',
          };
          const remaining = timetable.entries.filter(
            (entry) => !(entry.dayId === targetDayId && entry.slotId === targetSlotId)
          );
          onUpdateTimetable({
            ...timetable,
            entries: [...remaining, newBreakEntry],
            lastEdited: new Date().toISOString(),
          });
          onSelectCells([newBreakEntry.id]);
          return;
        }
      } catch (err) {
        console.warn('Could not parse dropped JSON payload', err);
      }
    }

    // 2. Check for existing entry moved inside the canvas
    const entryId = e.dataTransfer.getData('text/plain') || draggedEntryId;
    if (!entryId) return;

    const sourceEntry = timetable.entries.find((entry) => entry.id === entryId);
    if (!sourceEntry) return;

    // Moving existing entry to target cell:
    // Filter out target cell's previous entry so only the latest placed subject is shown!
    const remainingEntries = timetable.entries.filter(
      (entry) =>
        entry.id !== entryId && !(entry.dayId === targetDayId && entry.slotId === targetSlotId)
    );

    const movedEntry: TimetableEntry = {
      ...sourceEntry,
      dayId: targetDayId,
      slotId: targetSlotId,
    };

    onUpdateTimetable({
      ...timetable,
      entries: [...remainingEntries, movedEntry],
      lastEdited: new Date().toISOString(),
    });

    onSelectCells([movedEntry.id]);
    setDraggedEntryId(null);
  };

  // Helper to check if an entry has a conflict
  const getConflictForEntry = (entryId: string) => {
    return conflicts.find((c) => c.entryIds.includes(entryId));
  };

  // Container width constraint based on Device View
  const getDeviceContainerClass = () => {
    if (deviceView === 'mobile') return 'max-w-[420px] shadow-2xl rounded-2xl border-4 border-[#2e2e2e] my-4';
    if (deviceView === 'tablet') return 'max-w-[820px] shadow-xl rounded-xl border-2 border-[#2e2e2e] my-4';
    return 'w-full max-w-7xl';
  };

  return (
    <div
      className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 flex justify-center bg-[#0a0a0a]"
      id="canvas-scroll-viewport"
    >
      <div
        style={{
          transform: `scale(${zoomLevel / 100})`,
          transformOrigin: 'top center',
          transition: 'transform 0.15s ease-out',
        }}
        className={`transition-all duration-200 ${getDeviceContainerClass()}`}
        id="printable-timetable-root"
      >
        {/* The Card Canvas */}
        <div
          className="print-container rounded-2xl shadow-xl border border-[#262626] p-5 sm:p-8"
          style={{
            fontFamily: timetable.theme.fontFamily,
            backgroundColor: timetable.theme.backgroundColor || '#141414',
            color: '#ededed',
          }}
        >
          {/* Header Banner */}
          <div className="mb-6 pb-5 border-b border-[#262626] group/header relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {timetable.logoUrl ? (
                  <div className="relative group/logo shrink-0">
                    <img
                      src={timetable.logoUrl}
                      alt="Institution Logo"
                      className="w-14 h-14 object-contain rounded-xl border border-[#2e2e2e] bg-[#1a1a1a] p-1 shrink-0 cursor-pointer hover:border-[#c5a059]/60 transition-colors"
                      referrerPolicy="no-referrer"
                      onClick={() => setIsHeaderModalOpen(true)}
                      title="Click to edit or replace logo"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateTimetable({ ...timetable, logoUrl: undefined });
                      }}
                      className="absolute -top-1.5 -right-1.5 bg-rose-600 hover:bg-rose-500 text-white p-1 rounded-full opacity-0 group-hover/logo:opacity-100 transition-opacity shadow-xs"
                      title="Delete Logo"
                      aria-label="Delete Logo"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsHeaderModalOpen(true)}
                    className="w-12 h-12 rounded-xl border border-dashed border-[#383838] hover:border-[#c5a059] flex items-center justify-center text-[#737373] hover:text-[#c5a059] bg-[#1a1a1a]/60 hover:bg-[#1a1a1a] shrink-0 transition-colors"
                    title="Add Logo"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 group/title">
                    <h1
                      onClick={() => setIsHeaderModalOpen(true)}
                      className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#f5f5f5] cursor-pointer hover:opacity-90 transition-opacity"
                      style={{ color: timetable.theme.primaryColor || '#c5a059' }}
                      title="Click to edit title"
                    >
                      {timetable.institutionName || timetable.name}
                    </h1>
                    <button
                      type="button"
                      onClick={() => setIsHeaderModalOpen(true)}
                      className="p-1 rounded-md text-[#737373] hover:text-[#c5a059] hover:bg-[#c5a059]/10 opacity-0 group-hover/header:opacity-100 transition-opacity"
                      title="Edit Title"
                      aria-label="Edit Title"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {timetable.subTitle ? (
                    <div className="flex items-center gap-1.5 group/sub mt-0.5">
                      <p
                        onClick={() => setIsHeaderModalOpen(true)}
                        className="text-xs sm:text-sm text-[#a3a3a3] hover:text-[#ededed] font-medium cursor-pointer transition-colors"
                        title="Click to edit subtitle"
                      >
                        {timetable.subTitle}
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateTimetable({ ...timetable, subTitle: undefined });
                        }}
                        className="p-0.5 text-[#737373] hover:text-rose-400 opacity-0 group-hover/sub:opacity-100 transition-opacity"
                        title="Delete Subtitle"
                        aria-label="Delete Subtitle"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsHeaderModalOpen(true)}
                      className="text-xs text-[#737373] hover:text-[#c5a059] opacity-0 group-hover/header:opacity-100 flex items-center gap-1 mt-0.5 transition-opacity cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Add Subtitle / Cohort
                    </button>
                  )}

                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {timetable.academicYear ? (
                      <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#c5a059] bg-[#c5a059]/10 border border-[#c5a059]/30 px-2 py-0.5 rounded-md group/tag">
                        <span
                          onClick={() => setIsHeaderModalOpen(true)}
                          className="cursor-pointer hover:underline"
                          title="Click to edit tag"
                        >
                          {timetable.academicYear}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateTimetable({ ...timetable, academicYear: undefined });
                          }}
                          className="p-0.5 hover:text-rose-400 opacity-70 hover:opacity-100 transition-opacity"
                          title="Delete Tag"
                          aria-label="Delete Tag"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsHeaderModalOpen(true)}
                        className="text-[11px] text-[#737373] hover:text-[#c5a059] opacity-0 group-hover/header:opacity-100 flex items-center gap-1 border border-dashed border-[#383838] px-2 py-0.5 rounded-md transition-opacity cursor-pointer"
                      >
                        <Plus className="w-2.5 h-2.5" /> Add Cycle/Year Tag
                      </button>
                    )}

                    {timetable.customBadges?.map((b) => (
                      <div
                        key={b.id}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border group/badge"
                        style={{
                          color: b.color || '#c5a059',
                          borderColor: `${b.color || '#c5a059'}40`,
                          backgroundColor: `${b.color || '#c5a059'}15`,
                        }}
                      >
                        <span
                          onClick={() => setIsHeaderModalOpen(true)}
                          className="cursor-pointer hover:underline"
                        >
                          {b.label}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const remaining = (timetable.customBadges || []).filter(
                              (badge) => badge.id !== b.id
                            );
                            onUpdateTimetable({
                              ...timetable,
                              customBadges: remaining.length > 0 ? remaining : undefined,
                            });
                          }}
                          className="p-0.5 hover:text-rose-400 opacity-70 hover:opacity-100 transition-opacity"
                          title="Delete Badge"
                          aria-label={`Delete badge ${b.label}`}
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => setIsHeaderModalOpen(true)}
                      className="text-[10px] text-[#737373] hover:text-[#c5a059] opacity-0 group-hover/header:opacity-100 flex items-center gap-0.5 border border-dashed border-[#383838] hover:border-[#c5a059]/40 px-1.5 py-0.5 rounded-md transition-opacity cursor-pointer"
                      title="Create a new header badge"
                    >
                      <Plus className="w-2.5 h-2.5" /> Add Badge
                    </button>
                  </div>
                </div>
              </div>

              {/* Right side: Schedule Type & Direct Edit Header Button */}
              <div className="flex items-center sm:flex-col sm:items-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsHeaderModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#202020] hover:bg-[#c5a059] text-[#ededed] hover:text-[#0a0a0a] text-xs font-bold border border-[#333333] hover:border-[#c5a059] shadow-xs transition-all cursor-pointer"
                  title="Edit, create, or delete header information"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Header</span>
                </button>

                <div
                  onClick={() => setIsHeaderModalOpen(true)}
                  className="text-left sm:text-right cursor-pointer group/type"
                  title="Click to edit schedule type"
                >
                  <span className="text-[10px] font-serif font-semibold uppercase tracking-wider text-[#888888] block group-hover/type:text-[#c5a059] transition-colors">
                    Schedule Type
                  </span>
                  <span className="text-xs sm:text-sm font-bold capitalize text-[#ededed] group-hover/type:text-[#c5a059] transition-colors">
                    {timetable.type} Planner
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================
              LAYOUT MODE 1: STANDARD WEEKLY GRID (Default & Primary)
             ========================================================= */}
          {(layoutMode === 'grid' || layoutMode === 'print') && (
            <div className="overflow-x-auto">
              <table
                className="w-full border-collapse select-none table-fixed"
                style={{
                  minWidth: `${175 + timetable.days.length * Math.max(160, timetable.theme.cellWidth || 160)}px`,
                }}
              >
                <thead>
                  <tr>
                    {/* Corner Header (Time / Period) */}
                    <th
                      className="p-3 text-left text-xs font-serif font-bold uppercase tracking-wider border border-[#262626] rounded-tl-xl w-[175px] min-w-[175px]"
                      style={{
                        backgroundColor: timetable.theme.headerBackground || '#171717',
                        color: timetable.theme.headerTextColor || '#c5a059',
                        width: '175px',
                        minWidth: '175px',
                      }}
                    >
                      Time / Period
                    </th>

                    {/* Day Headers */}
                    {timetable.days.map((day, idx) => (
                      <th
                        key={day.id}
                        className={`p-3 text-center text-xs font-serif font-bold uppercase tracking-wider border border-[#262626] ${
                          idx === timetable.days.length - 1 ? 'rounded-tr-xl' : ''
                        }`}
                        style={{
                          backgroundColor: timetable.theme.headerBackground || '#171717',
                          color: timetable.theme.headerTextColor || '#c5a059',
                          minWidth: `${timetable.theme.cellWidth}px`,
                        }}
                      >
                        <div>{day.name}</div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {timetable.timeSlots.map((slot) => {
                    const isBreakRow = slot.isBreak;

                    return (
                      <tr key={slot.id} className={isBreakRow ? 'bg-[#c5a059]/5' : ''}>
                        {/* Time Slot Label */}
                        <td
                          className="p-2.5 sm:p-3 text-xs font-semibold border border-[#262626] align-middle group/row relative w-[175px] min-w-[175px]"
                          style={{
                            backgroundColor: timetable.theme.timeColumnBackground || '#121212',
                            color: timetable.theme.timeColumnTextColor || '#a3a3a3',
                            width: '175px',
                            minWidth: '175px',
                          }}
                        >
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-start justify-between gap-1.5">
                              <button
                                type="button"
                                onClick={() => setEditingSlot(slot)}
                                className="text-left font-bold text-xs text-[#ededed] hover:text-[#c5a059] leading-snug break-words whitespace-normal transition-colors cursor-pointer"
                                title={`Click to edit session "${slot.name}" timings & details`}
                              >
                                {slot.name}
                              </button>

                              <div className="flex items-center gap-0.5 opacity-90 sm:opacity-0 sm:group-hover/row:opacity-100 transition-opacity shrink-0 bg-[#1c1c1c] rounded-md p-0.5 border border-[#2a2a2a] shadow-xs">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingSlot(slot);
                                  }}
                                  title={`Edit timings & details for "${slot.name}"`}
                                  aria-label={`Edit timings for ${slot.name}`}
                                  className="p-1 rounded text-[#888888] hover:text-[#c5a059] hover:bg-[#c5a059]/15 transition-all cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                {onMoveRow && (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onMoveRow(slot.id, 'up');
                                      }}
                                      disabled={timetable.timeSlots.findIndex((s) => s.id === slot.id) === 0}
                                      title={`Move row "${slot.name}" up`}
                                      aria-label={`Move row ${slot.name} up`}
                                      className="p-1 rounded text-[#888888] hover:text-[#c5a059] hover:bg-[#c5a059]/15 disabled:opacity-20 transition-all"
                                    >
                                      <ChevronUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onMoveRow(slot.id, 'down');
                                      }}
                                      disabled={timetable.timeSlots.findIndex((s) => s.id === slot.id) === timetable.timeSlots.length - 1}
                                      title={`Move row "${slot.name}" down`}
                                      aria-label={`Move row ${slot.name} down`}
                                      className="p-1 rounded text-[#888888] hover:text-[#c5a059] hover:bg-[#c5a059]/15 disabled:opacity-20 transition-all"
                                    >
                                      <ChevronDown className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSlot(slot.id);
                                  }}
                                  disabled={timetable.timeSlots.length <= 1}
                                  title={`Delete row "${slot.name}"`}
                                  aria-label={`Delete row ${slot.name}`}
                                  className="p-1 rounded text-[#737373] hover:text-rose-400 hover:bg-rose-950/50 transition-all disabled:opacity-20 shrink-0"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Session Timing Badge (Clickable to Edit) */}
                            <button
                              type="button"
                              onClick={() => setEditingSlot(slot)}
                              className="text-[10px] text-[#888888] hover:text-[#c5a059] font-mono flex items-center gap-1 group/time py-0.5 px-1 rounded-md hover:bg-[#c5a059]/10 transition-colors cursor-pointer text-left w-fit"
                              title={`Click to edit session timings (${slot.start} – ${slot.end})`}
                            >
                              <Clock className="w-2.5 h-2.5 text-[#737373] group-hover/time:text-[#c5a059] shrink-0" />
                              <span className="whitespace-nowrap font-bold">
                                {slot.start} – {slot.end}
                              </span>
                              <Edit3 className="w-2.5 h-2.5 opacity-0 group-hover/time:opacity-100 text-[#c5a059] shrink-0 ml-0.5 transition-opacity" />
                            </button>
                          </div>
                        </td>

                        {/* Day Cells */}
                        {timetable.days.map((day) => {
                          const entriesInCell = timetable.entries.filter(
                            (e) => e.dayId === day.id && e.slotId === slot.id
                          );
                          // "only the latest selected should be shown"
                          const entry =
                            entriesInCell.length > 0
                              ? entriesInCell[entriesInCell.length - 1]
                              : undefined;
                          const isSelected = entry && selectedCellIds.includes(entry.id);
                          const conflict = entry ? getConflictForEntry(entry.id) : null;
                          const isDropTarget =
                            dragOverCell?.dayId === day.id && dragOverCell?.slotId === slot.id;

                          return (
                            <td
                              key={day.id}
                              onDragOver={(e) => handleDragOver(e, day.id, slot.id)}
                              onDragLeave={(e) => handleDragLeave(e, day.id, slot.id)}
                              onDrop={(e) => handleDrop(e, day.id, slot.id)}
                              style={{
                                height: `${timetable.theme.cellHeight}px`,
                                padding: `${timetable.theme.cellPadding}px`,
                                borderColor: timetable.theme.borderColor || '#262626',
                              }}
                              className={`border relative transition-all group ${
                                isDropTarget
                                  ? 'bg-[#c5a059]/25 ring-2 ring-inset ring-[#c5a059]'
                                  : isBreakRow
                                  ? 'bg-[#c5a059]/5'
                                  : 'bg-transparent hover:bg-[#c5a059]/5'
                              }`}
                            >
                              {entry ? (
                                <div
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, entry.id)}
                                  onClick={(e) => {
                                    if (e.ctrlKey || e.metaKey || e.shiftKey) {
                                      onSelectCells(
                                        selectedCellIds.includes(entry.id)
                                          ? selectedCellIds.filter((id) => id !== entry.id)
                                          : [...selectedCellIds, entry.id]
                                      );
                                    } else {
                                      onSelectCells([entry.id]);
                                    }
                                  }}
                                  onDoubleClick={() => onOpenQuickEdit(entry)}
                                  style={{
                                    backgroundColor: entry.style?.background || entry.color,
                                    color: entry.style?.textColor || entry.textColor || '#0f172a',
                                    borderRadius: `${entry.style?.borderRadius ?? timetable.theme.borderRadius}px`,
                                    borderStyle: entry.style?.borderStyle || 'solid',
                                    borderColor: entry.style?.borderColor || 'rgba(255,255,255,0.1)',
                                    borderWidth: '1px',
                                    textAlign: entry.style?.textAlign || 'left',
                                  }}
                                  className={`w-full h-full p-2.5 flex flex-col justify-between shadow-2xs hover:shadow-md cursor-grab active:cursor-grabbing transition-all relative overflow-hidden ${
                                    isSelected
                                      ? 'ring-2 ring-[#c5a059] ring-offset-1 ring-offset-[#0a0a0a] shadow-lg scale-[1.01]'
                                      : ''
                                  } ${conflict ? 'ring-2 ring-amber-500' : ''}`}
                                >
                                  {/* Conflict Badge */}
                                  {conflict && (
                                    <div
                                      title={conflict.message}
                                      className="absolute top-1 right-1 bg-amber-500 text-white rounded-full p-0.5 animate-pulse"
                                    >
                                      <AlertTriangle className="w-2.5 h-2.5" />
                                    </div>
                                  )}

                                  {/* Top Row: Title + Icon */}
                                  <div>
                                    <div className="flex items-start justify-between gap-1">
                                      <span
                                        className={`font-semibold text-xs leading-tight line-clamp-2 ${
                                          entry.style?.fontWeight === 'bold' ? 'font-bold' : ''
                                        } ${entry.style?.fontStyle === 'italic' ? 'italic' : ''}`}
                                      >
                                        {entry.title}
                                      </span>
                                      {timetable.theme.showIcons && entry.icon && (
                                        <div className="shrink-0 opacity-80">
                                          <IconRenderer name={entry.icon} size={14} />
                                        </div>
                                      )}
                                    </div>
                                    {entry.shortCode && (
                                      <span className="text-[10px] font-mono opacity-70 block mt-0.5">
                                        {entry.shortCode}
                                      </span>
                                    )}
                                  </div>

                                  {/* Bottom Row: Teacher & Room */}
                                  <div className="mt-1 flex items-center justify-between text-[10px] opacity-80 leading-none pt-1 border-t border-black/10">
                                    {timetable.theme.showTeacher && entry.teacher && (
                                      <span className="flex items-center gap-0.5 truncate max-w-[65%]">
                                        <User className="w-2.5 h-2.5 shrink-0" />
                                        <span className="truncate">{entry.teacher}</span>
                                      </span>
                                    )}
                                    {timetable.theme.showRoom && entry.room && (
                                      <span className="flex items-center gap-0.5 ml-auto font-medium shrink-0">
                                        <MapPin className="w-2.5 h-2.5" />
                                        <span>{entry.room}</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                /* Empty Slot -> Add Button on hover */
                                <div
                                  onClick={() => onAddSubjectToSlot(day.id, slot.id)}
                                  className="w-full h-full rounded-lg border border-dashed border-transparent hover:border-[#3a3a3a] flex items-center justify-center text-[#555555] hover:text-[#c5a059] hover:bg-[#c5a059]/5 cursor-pointer transition-all group/btn"
                                >
                                  <Plus className="w-4 h-4 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>

                {/* Table Footer with Add Row Button */}
                {onAddRow && (
                  <tfoot>
                    <tr>
                      <td
                        colSpan={timetable.days.length + 1}
                        className="p-2.5 border border-[#262626] bg-[#121212]/60 text-center"
                      >
                        <button
                          onClick={onAddRow}
                          className="px-4 py-1.5 rounded-lg border border-dashed border-[#383838] hover:border-[#c5a059] text-xs font-semibold text-[#a3a3a3] hover:text-[#c5a059] hover:bg-[#c5a059]/10 transition-all inline-flex items-center gap-1.5 shadow-2xs"
                          id="canvas-add-row-btn"
                          title="Add a new period / row to timetable"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Row / Period</span>
                        </button>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}

          {/* =========================================================
              LAYOUT MODE 2: DAILY VIEW (Chronological list for single day)
             ========================================================= */}
          {layoutMode === 'daily' && (
            <div className="space-y-4">
              {/* Day Selector Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[#262626]">
                {timetable.days.map((day) => (
                  <button
                    key={day.id}
                    onClick={() => setActiveDailyDayId(day.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-serif font-bold transition-all whitespace-nowrap ${
                      activeDailyDayId === day.id
                        ? 'bg-[#c5a059] text-[#0a0a0a] shadow-xs'
                        : 'bg-[#181818] text-[#a3a3a3] hover:bg-[#222222] hover:text-[#ededed] border border-[#262626]'
                    }`}
                  >
                    {day.name}
                  </button>
                ))}
              </div>

              {/* Day Chronological Flow */}
              <div className="space-y-2.5 pt-2">
                {timetable.timeSlots.map((slot) => {
                  const entriesInSlot = timetable.entries.filter(
                    (e) => e.dayId === activeDailyDayId && e.slotId === slot.id
                  );
                  // "only the latest selected should be shown"
                  const entry =
                    entriesInSlot.length > 0 ? entriesInSlot[entriesInSlot.length - 1] : undefined;
                  const isDropTarget =
                    dragOverCell?.dayId === activeDailyDayId && dragOverCell?.slotId === slot.id;

                  return (
                    <div
                      key={slot.id}
                      onDragOver={(e) => handleDragOver(e, activeDailyDayId, slot.id)}
                      onDragLeave={(e) => handleDragLeave(e, activeDailyDayId, slot.id)}
                      onDrop={(e) => handleDrop(e, activeDailyDayId, slot.id)}
                      className={`flex items-start gap-4 p-3 rounded-xl border transition-all ${
                        isDropTarget
                          ? 'border-[#c5a059] bg-[#c5a059]/20 ring-2 ring-[#c5a059]'
                          : 'border-[#262626] hover:border-[#333333] bg-[#141414]'
                      }`}
                    >
                      {/* Time Column with Delete Row option */}
                      <div className="w-48 sm:w-52 shrink-0 text-[#a3a3a3]">
                        <div className="flex items-start justify-between gap-1.5 mb-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingSlot(slot)}
                            className="text-left font-bold text-xs text-[#ededed] hover:text-[#c5a059] leading-snug break-words whitespace-normal transition-colors cursor-pointer"
                            title={`Click to edit session "${slot.name}" timings & details`}
                          >
                            {slot.name}
                          </button>
                          <div className="flex items-center gap-0.5 shrink-0 bg-[#1c1c1c] rounded-md p-0.5 border border-[#2a2a2a] shadow-xs">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingSlot(slot);
                              }}
                              title={`Edit timings & details for "${slot.name}"`}
                              aria-label={`Edit timings for ${slot.name}`}
                              className="text-[#888888] hover:text-[#c5a059] p-1 rounded hover:bg-[#c5a059]/15 transition-colors shrink-0 cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            {onMoveRow && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onMoveRow(slot.id, 'up');
                                  }}
                                  disabled={timetable.timeSlots.findIndex((s) => s.id === slot.id) === 0}
                                  title={`Move row "${slot.name}" up`}
                                  aria-label={`Move row ${slot.name} up`}
                                  className="text-[#888888] hover:text-[#c5a059] p-1 rounded hover:bg-[#c5a059]/15 disabled:opacity-20 transition-colors shrink-0"
                                >
                                  <ChevronUp className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onMoveRow(slot.id, 'down');
                                  }}
                                  disabled={timetable.timeSlots.findIndex((s) => s.id === slot.id) === timetable.timeSlots.length - 1}
                                  title={`Move row "${slot.name}" down`}
                                  aria-label={`Move row ${slot.name} down`}
                                  className="text-[#888888] hover:text-[#c5a059] p-1 rounded hover:bg-[#c5a059]/15 disabled:opacity-20 transition-colors shrink-0"
                                >
                                  <ChevronDown className="w-3 h-3" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSlot(slot.id);
                              }}
                              disabled={timetable.timeSlots.length <= 1}
                              title={`Delete row "${slot.name}"`}
                              aria-label={`Delete row ${slot.name}`}
                              className="text-[#737373] hover:text-rose-400 p-1 rounded hover:bg-rose-950/40 disabled:opacity-20 transition-colors shrink-0"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingSlot(slot)}
                          className="text-[11px] font-mono text-[#888888] hover:text-[#c5a059] flex items-center gap-1 group/time p-0.5 rounded-md hover:bg-[#c5a059]/10 transition-colors cursor-pointer text-left"
                          title={`Click to edit session timings (${slot.start} – ${slot.end})`}
                        >
                          <Clock className="w-3 h-3 text-[#737373] group-hover/time:text-[#c5a059] shrink-0" />
                          <span className="whitespace-nowrap font-bold">{slot.start} – {slot.end}</span>
                          <Edit3 className="w-2.5 h-2.5 opacity-0 group-hover/time:opacity-100 text-[#c5a059] shrink-0 ml-0.5 transition-opacity" />
                        </button>
                      </div>

                      {/* Entry Content */}
                      <div className="flex-1">
                        {entry ? (
                          <div
                            draggable
                            onDragStart={(e) => handleDragStart(e, entry.id)}
                            onClick={() => onSelectCells([entry.id])}
                            onDoubleClick={() => onOpenQuickEdit(entry)}
                            style={{
                              backgroundColor: entry.style?.background || entry.color,
                              color: entry.style?.textColor || entry.textColor || '#0f172a',
                              borderRadius: `${timetable.theme.borderRadius}px`,
                            }}
                            className="p-3 shadow-xs rounded-xl flex items-center justify-between cursor-grab active:cursor-grabbing"
                          >
                            <div className="flex items-center gap-3">
                              {entry.icon && (
                                <div className="p-2 rounded-lg bg-black/20 shadow-2xs">
                                  <IconRenderer name={entry.icon} size={18} />
                                </div>
                              )}
                              <div>
                                <h4 className="font-bold text-sm leading-tight">{entry.title}</h4>
                                <div className="flex items-center gap-3 text-xs opacity-80 mt-1">
                                  {entry.teacher && (
                                    <span className="flex items-center gap-1">
                                      <User className="w-3 h-3" />
                                      {entry.teacher}
                                    </span>
                                  )}
                                  {entry.room && (
                                    <span className="flex items-center gap-1 font-medium">
                                      <MapPin className="w-3 h-3" />
                                      {entry.room}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenQuickEdit(entry);
                              }}
                              className="p-1.5 rounded-lg bg-[#222222] hover:bg-[#2a2a2a] text-[#ededed] border border-[#2e2e2e] shadow-2xs"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => onAddSubjectToSlot(activeDailyDayId, slot.id)}
                            className="w-full py-2.5 rounded-xl border border-dashed border-[#2e2e2e] hover:border-[#c5a059] hover:bg-[#c5a059]/10 text-[#737373] hover:text-[#c5a059] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add or Drop Subject to {slot.name}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =========================================================
              LAYOUT MODE 3: VERTICAL WEEKLY (Cards for each day)
             ========================================================= */}
          {layoutMode === 'vertical' && (
            <div className="space-y-6">
              {timetable.days.map((day) => {
                const dayEntries = timetable.entries.filter((e) => e.dayId === day.id);

                return (
                  <div
                    key={day.id}
                    className="p-4 rounded-xl border border-[#262626] bg-[#141414]"
                  >
                    <h3 className="font-serif font-bold text-base text-[#f5f5f5] mb-3 flex items-center justify-between">
                      <span>{day.name}</span>
                      <span className="text-xs font-semibold text-[#888888]">
                        {dayEntries.length} Activities
                      </span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {timetable.timeSlots.map((slot) => {
                        const entriesInSlot = dayEntries.filter((e) => e.slotId === slot.id);
                        // "only the latest selected should be shown"
                        const entry =
                          entriesInSlot.length > 0
                            ? entriesInSlot[entriesInSlot.length - 1]
                            : undefined;
                        const isDropTarget =
                          dragOverCell?.dayId === day.id && dragOverCell?.slotId === slot.id;

                        return (
                          <div
                            key={slot.id}
                            onDragOver={(e) => handleDragOver(e, day.id, slot.id)}
                            onDragLeave={(e) => handleDragLeave(e, day.id, slot.id)}
                            onDrop={(e) => handleDrop(e, day.id, slot.id)}
                            className={`p-2.5 rounded-xl border shadow-2xs flex flex-col justify-between transition-all ${
                              isDropTarget
                                ? 'border-[#c5a059] bg-[#c5a059]/20 ring-2 ring-[#c5a059]'
                                : 'border-[#262626] bg-[#181818]'
                            }`}
                          >
                            <div className="text-[10px] font-bold text-[#888888] mb-1 flex items-center justify-between">
                              <span>{slot.name}</span>
                              <span>
                                {slot.start} – {slot.end}
                              </span>
                            </div>

                            {entry ? (
                              <div
                                draggable
                                onDragStart={(e) => handleDragStart(e, entry.id)}
                                onClick={() => onSelectCells([entry.id])}
                                style={{
                                  backgroundColor: entry.style?.background || entry.color,
                                  color: entry.style?.textColor || entry.textColor || '#0f172a',
                                  borderRadius: `${timetable.theme.borderRadius}px`,
                                }}
                                className="p-2 rounded-lg cursor-grab active:cursor-grabbing flex-1"
                              >
                                <span className="font-semibold text-xs block truncate">{entry.title}</span>
                                <div className="flex items-center justify-between text-[10px] opacity-75 mt-1">
                                  <span>{entry.teacher}</span>
                                  <span>{entry.room}</span>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => onAddSubjectToSlot(day.id, slot.id)}
                                className="py-2 text-[11px] text-[#737373] hover:text-[#c5a059] hover:bg-[#c5a059]/10 rounded-lg flex items-center justify-center gap-1 border border-dashed border-[#2e2e2e]"
                              >
                                <Plus className="w-3 h-3" />
                                Empty (Drop Here)
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* =========================================================
              LAYOUT MODE 4: CALENDAR VIEW (Compact month-like block)
             ========================================================= */}
          {layoutMode === 'calendar' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {timetable.days.map((day) => {
                const dayEntries = timetable.entries.filter((e) => e.dayId === day.id);

                return (
                  <div
                    key={day.id}
                    className="p-3 rounded-xl border border-[#262626] bg-[#141414] shadow-2xs flex flex-col min-h-[300px]"
                  >
                    <div className="font-serif font-bold text-xs uppercase tracking-wider text-center pb-2 border-b border-[#262626] text-[#ededed]">
                      {day.name}
                    </div>

                    <div className="mt-2 space-y-1.5 flex-1">
                      {timetable.timeSlots.map((slot) => {
                        const entry = dayEntries.find((e) => e.slotId === slot.id);

                        return (
                          <div
                            key={slot.id}
                            className={`p-1.5 rounded-md text-[11px] transition-colors ${
                              entry
                                ? 'shadow-2xs cursor-pointer'
                                : 'text-[#737373] hover:bg-[#1a1a1a] border border-dashed border-[#262626]'
                            }`}
                            style={
                              entry
                                ? {
                                    backgroundColor: entry.color,
                                    color: entry.textColor || '#0f172a',
                                  }
                                : {}
                            }
                            onClick={() => {
                              if (entry) onSelectCells([entry.id]);
                              else onAddSubjectToSlot(day.id, slot.id);
                            }}
                          >
                            <div className="font-medium truncate">{entry ? entry.title : `+ ${slot.name}`}</div>
                            {entry && entry.room && (
                              <div className="text-[9px] opacity-75 truncate">{entry.room}</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer & Color Legend */}
          {(timetable.footerNotes || timetable.theme.showLegend) && (
            <div className="mt-6 pt-5 border-t border-[#262626] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-[#888888]">
              {timetable.footerNotes && (
                <div className="max-w-xl">
                  <span className="font-serif font-semibold text-[#ededed] block mb-0.5">Notes & Instructions:</span>
                  <p className="leading-relaxed">{timetable.footerNotes}</p>
                </div>
              )}

              {/* Color Key / Legend */}
              {timetable.theme.showLegend && (
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-serif font-semibold text-[#ededed]">Legend:</span>
                  {Array.from(new Set(timetable.entries.map((e) => e.category || 'Lecture'))).map((cat) => {
                    const sample = timetable.entries.find((e) => e.category === cat);
                    return (
                      <div key={cat} className="flex items-center gap-1.5">
                        <div
                          className="w-3 h-3 rounded-full border border-[#333333] shrink-0"
                          style={{ backgroundColor: sample?.color || '#dbeafe' }}
                        />
                        <span className="text-[11px] text-[#a3a3a3]">{cat}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Header Info Editor Modal */}
      {isHeaderModalOpen && (
        <HeaderInfoModal
          key={Date.now()}
          isOpen={isHeaderModalOpen}
          onClose={() => setIsHeaderModalOpen(false)}
          timetable={timetable}
          onSave={onUpdateTimetable}
        />
      )}

      {/* Edit Session Timings & Name Modal */}
      {editingSlot && (
        <EditSessionModal
          key={editingSlot.id}
          isOpen={Boolean(editingSlot)}
          onClose={() => setEditingSlot(null)}
          slot={editingSlot}
          timetable={timetable}
          onSaveSlot={handleSaveSlot}
          onDeleteSlot={handleDeleteSlot}
          onInsertSlotAfter={handleInsertSlotAfter}
        />
      )}
    </div>
  );
};
