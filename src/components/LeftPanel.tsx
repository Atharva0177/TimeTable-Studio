import React, { useState } from 'react';
import {
  Plus,
  Palette,
  Layers,
  Clock,
  Image as ImageIcon,
  Sparkles,
  Coffee,
  Utensils,
  BookOpen,
  Dumbbell,
  Briefcase,
  Upload,
  Trash2,
  Smile,
  ChevronRight,
  MoveUp,
  MoveDown,
  ChevronUp,
  ChevronDown,
  X,
  GripVertical,
  Edit3,
  Tag,
  SlidersHorizontal,
} from 'lucide-react';
import { Timetable, ThemeConfig, TimeSlotConfig, DayConfig } from '../types';
import { PRESET_THEMES } from '../data/presets';
import { COMMON_ICONS, IconRenderer } from './IconRenderer';
import { HeaderInfoModal } from './HeaderInfoModal';
import { EditSessionModal } from './EditSessionModal';

interface LeftPanelProps {
  timetable: Timetable;
  onUpdateTimetable: (updated: Timetable) => void;
  selectedCellIds: string[];
  onAddSubject: (subject: {
    title: string;
    shortCode?: string;
    teacher?: string;
    room?: string;
    color: string;
    icon?: string;
    category?: string;
  }) => void;
  onAddBreak: (breakType: 'lunch' | 'tea' | 'free') => void;
  onMoveRow?: (slotId: string, direction: 'up' | 'down') => void;
  onCloseMobileDrawer?: () => void;
  onCollapse?: () => void;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
  timetable,
  onUpdateTimetable,
  selectedCellIds,
  onAddSubject,
  onAddBreak,
  onMoveRow,
  onCloseMobileDrawer,
  onCollapse,
}) => {
  const [activeTab, setActiveTab] = useState<'elements' | 'themes' | 'icons' | 'structure' | 'branding'>('elements');

  const [editingSlot, setEditingSlot] = useState<TimeSlotConfig | null>(null);
  const [isHeaderModalOpen, setIsHeaderModalOpen] = useState(false);

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
    const newSlots = timetable.timeSlots.filter((s) => s.id !== slotId);
    const newEntries = timetable.entries.filter((e) => e.slotId !== slotId);
    onUpdateTimetable({
      ...timetable,
      timeSlots: newSlots,
      entries: newEntries,
      lastEdited: new Date().toISOString(),
    });
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
      name: `Period ${timetable.timeSlots.length + 1}`,
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

  // New quick subject form state
  const [newSubjTitle, setNewSubjTitle] = useState('');
  const [newSubjCode, setNewSubjCode] = useState('');
  const [newSubjTeacher, setNewSubjTeacher] = useState('');
  const [newSubjRoom, setNewSubjRoom] = useState('');
  const [newSubjColor, setNewSubjColor] = useState('#dbeafe');
  const [newSubjIcon, setNewSubjIcon] = useState('BookOpen');

  // Quick subject presets
  const SUBJECT_PRESETS = [
    { title: 'Mathematics', code: 'MATH', color: '#dbeafe', icon: 'Calculator', category: 'Core' },
    { title: 'Computer Science', code: 'CS', color: '#e0e7ff', icon: 'Code', category: 'Tech' },
    { title: 'Physics Lab', code: 'PHY', color: '#fce7f3', icon: 'Atom', category: 'Science' },
    { title: 'Chemistry', code: 'CHEM', color: '#ffedd5', icon: 'FlaskConical', category: 'Science' },
    { title: 'Deep Work / Focus', code: 'FOCUS', color: '#dcfce7', icon: 'Zap', category: 'Productivity' },
    { title: 'Team Meeting / Sync', code: 'SYNC', color: '#fef3c7', icon: 'Users', category: 'Work' },
    { title: 'Strength Training', code: 'GYM', color: '#fee2e2', icon: 'Dumbbell', category: 'Fitness' },
    { title: 'Library / Study', code: 'LIB', color: '#f1f5f9', icon: 'Library', category: 'Study' },
  ];

  const handleApplyTheme = (theme: ThemeConfig) => {
    onUpdateTimetable({
      ...timetable,
      theme: { ...theme },
      lastEdited: new Date().toISOString(),
    });
  };

  const handleAddDay = () => {
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const nextIdx = timetable.days.length;
    const name = dayNames[nextIdx % dayNames.length] || `Day ${nextIdx + 1}`;
    const newDay: DayConfig = {
      id: `day_${Date.now()}`,
      name,
      shortName: name.slice(0, 3),
    };
    onUpdateTimetable({
      ...timetable,
      days: [...timetable.days, newDay],
      lastEdited: new Date().toISOString(),
    });
  };

  const handleRemoveDay = (dayId: string) => {
    if (timetable.days.length <= 1) return;
    onUpdateTimetable({
      ...timetable,
      days: timetable.days.filter((d) => d.id !== dayId),
      entries: timetable.entries.filter((e) => e.dayId !== dayId),
      lastEdited: new Date().toISOString(),
    });
  };

  const handleAddPeriod = () => {
    const periodCount = timetable.timeSlots.filter((s) => !s.isBreak).length + 1;
    // Calculate last slot end time
    const lastSlot = timetable.timeSlots[timetable.timeSlots.length - 1];
    let start = '16:00';
    let end = '17:00';
    if (lastSlot) {
      start = lastSlot.end;
      const [h, m] = start.split(':').map(Number);
      const endH = (h + 1).toString().padStart(2, '0');
      end = `${endH}:${m.toString().padStart(2, '0')}`;
    }

    const newSlot: TimeSlotConfig = {
      id: `slot_${Date.now()}`,
      name: `Period ${periodCount}`,
      start,
      end,
      isBreak: false,
    };

    onUpdateTimetable({
      ...timetable,
      timeSlots: [...timetable.timeSlots, newSlot],
      lastEdited: new Date().toISOString(),
    });
  };

  const handleRemoveSlot = (slotId: string) => {
    if (timetable.timeSlots.length <= 1) return;
    onUpdateTimetable({
      ...timetable,
      timeSlots: timetable.timeSlots.filter((s) => s.id !== slotId),
      entries: timetable.entries.filter((e) => e.slotId !== slotId),
      lastEdited: new Date().toISOString(),
    });
  };

  const handleMoveSlot = (slotId: string, direction: 'up' | 'down') => {
    if (onMoveRow) {
      onMoveRow(slotId, direction);
      return;
    }
    const slots = [...timetable.timeSlots];
    const idx = slots.findIndex((s) => s.id === slotId);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === slots.length - 1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const temp = slots[idx];
    slots[idx] = slots[targetIdx];
    slots[targetIdx] = temp;
    onUpdateTimetable({
      ...timetable,
      timeSlots: slots,
      lastEdited: new Date().toISOString(),
    });
  };

  const handleMoveDay = (dayId: string, direction: 'up' | 'down') => {
    const days = [...timetable.days];
    const idx = days.findIndex((d) => d.id === dayId);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === days.length - 1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const temp = days[idx];
    days[idx] = days[targetIdx];
    days[targetIdx] = temp;
    onUpdateTimetable({
      ...timetable,
      days,
      lastEdited: new Date().toISOString(),
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onUpdateTimetable({
        ...timetable,
        logoUrl: reader.result as string,
        lastEdited: new Date().toISOString(),
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <aside className="no-print w-full lg:w-80 bg-[#121212] border-r border-[#262626] flex flex-col h-full min-h-0 shrink-0 select-none text-[#ededed]">
      {/* Desktop Header with Collapse Button */}
      <div className="hidden lg:flex items-center justify-between px-3.5 py-2.5 border-b border-[#262626] bg-[#161616] shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#c5a059]" />
          <span className="text-xs font-serif font-bold text-[#f5f5f5] uppercase tracking-wider">
            Toolbox & Design
          </span>
        </div>
        {onCollapse && (
          <button
            onClick={onCollapse}
            className="p-1.5 rounded-lg text-[#888888] hover:text-[#ededed] hover:bg-[#202020] transition-colors"
            title="Collapse Left Toolbox"
            aria-label="Collapse Left Toolbox"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
        )}
      </div>

      {/* Mobile Drawer Header */}
      {onCloseMobileDrawer && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#262626] bg-[#161616] lg:hidden">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#c5a059]" />
            <span className="font-serif font-bold text-sm text-[#f5f5f5]">Design Tools & Elements</span>
          </div>
          <button
            onClick={onCloseMobileDrawer}
            className="p-2 rounded-lg bg-[#222222] hover:bg-[#2a2a2a] text-[#a3a3a3] hover:text-[#ededed] border border-[#2e2e2e] transition-colors"
            aria-label="Close design tools drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-[#262626] bg-[#161616] px-2 pt-2 gap-1 overflow-x-auto text-xs font-semibold shrink-0">
        <button
          onClick={() => setActiveTab('elements')}
          className={`px-3 py-2 border-b-2 rounded-t-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'elements'
              ? 'border-[#c5a059] text-[#c5a059] bg-[#1c1c1c] shadow-xs'
              : 'border-transparent text-[#888888] hover:text-[#ededed]'
          }`}
          id="tab-btn-elements"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Insert</span>
        </button>

        <button
          onClick={() => setActiveTab('themes')}
          className={`px-3 py-2 border-b-2 rounded-t-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'themes'
              ? 'border-[#c5a059] text-[#c5a059] bg-[#1c1c1c] shadow-xs'
              : 'border-transparent text-[#888888] hover:text-[#ededed]'
          }`}
          id="tab-btn-themes"
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Themes</span>
        </button>

        <button
          onClick={() => setActiveTab('structure')}
          className={`px-3 py-2 border-b-2 rounded-t-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'structure'
              ? 'border-[#c5a059] text-[#c5a059] bg-[#1c1c1c] shadow-xs'
              : 'border-transparent text-[#888888] hover:text-[#ededed]'
          }`}
          id="tab-btn-structure"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Grid</span>
        </button>

        <button
          onClick={() => setActiveTab('icons')}
          className={`px-3 py-2 border-b-2 rounded-t-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'icons'
              ? 'border-[#c5a059] text-[#c5a059] bg-[#1c1c1c] shadow-xs'
              : 'border-transparent text-[#888888] hover:text-[#ededed]'
          }`}
          id="tab-btn-icons"
        >
          <Smile className="w-3.5 h-3.5" />
          <span>Icons</span>
        </button>

        <button
          onClick={() => setActiveTab('branding')}
          className={`px-3 py-2 border-b-2 rounded-t-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'branding'
              ? 'border-[#c5a059] text-[#c5a059] bg-[#1c1c1c] shadow-xs'
              : 'border-transparent text-[#888888] hover:text-[#ededed]'
          }`}
          id="tab-btn-branding"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Header</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-6 pb-32">
        {/* ELEMENTS TAB */}
        {activeTab === 'elements' && (
          <div className="space-y-5">
            {/* Break Inserts */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-[#ededed] uppercase tracking-wider block">
                  Breaks & Intervals
                </label>
                <span className="text-[10px] text-[#737373]">Click or Drag</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData(
                      'application/json',
                      JSON.stringify({
                        type: 'new_break',
                        breakType: 'lunch',
                        subject: {
                          title: 'Lunch Break',
                          shortCode: 'LUNCH',
                          color: '#fef3c7',
                          icon: 'Utensils',
                          category: 'Break',
                        },
                      })
                    );
                    e.dataTransfer.setData('text/plain', 'Lunch Break');
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  onClick={() => onAddBreak('lunch')}
                  className="p-2.5 rounded-xl border border-amber-800/40 bg-amber-950/25 hover:bg-amber-950/45 text-amber-200 text-xs font-semibold flex items-center justify-between gap-1.5 transition-all cursor-grab active:cursor-grabbing select-none"
                  id="insert-lunch-btn"
                  title="Click to add or drag into any period"
                >
                  <div className="flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Lunch Break</span>
                  </div>
                  <GripVertical className="w-3 h-3 text-amber-500/60 shrink-0" />
                </div>
                <div
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData(
                      'application/json',
                      JSON.stringify({
                        type: 'new_break',
                        breakType: 'tea',
                        subject: {
                          title: 'Tea / Recess',
                          shortCode: 'RECESS',
                          color: '#ffedd5',
                          icon: 'Coffee',
                          category: 'Break',
                        },
                      })
                    );
                    e.dataTransfer.setData('text/plain', 'Tea / Recess');
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  onClick={() => onAddBreak('tea')}
                  className="p-2.5 rounded-xl border border-orange-800/40 bg-orange-950/25 hover:bg-orange-950/45 text-orange-200 text-xs font-semibold flex items-center justify-between gap-1.5 transition-all cursor-grab active:cursor-grabbing select-none"
                  id="insert-tea-btn"
                  title="Click to add or drag into any period"
                >
                  <div className="flex items-center gap-2">
                    <Coffee className="w-4 h-4 text-orange-400 shrink-0" />
                    <span>Tea / Recess</span>
                  </div>
                  <GripVertical className="w-3 h-3 text-orange-500/60 shrink-0" />
                </div>
              </div>
            </div>

            {/* Quick Preset Subjects */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-[#ededed] uppercase tracking-wider">
                  Quick Subjects
                </label>
                <span className="text-[10px] text-[#c5a059] font-medium flex items-center gap-1">
                  Drag to Cell or Click
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {SUBJECT_PRESETS.map((p, idx) => (
                  <div
                    key={idx}
                    draggable={true}
                    onDragStart={(e) => {
                      e.dataTransfer.setData(
                        'application/json',
                        JSON.stringify({
                          type: 'new_subject',
                          subject: {
                            title: p.title,
                            shortCode: p.code,
                            color: p.color,
                            icon: p.icon,
                            category: p.category,
                          },
                        })
                      );
                      e.dataTransfer.setData('text/plain', p.title);
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    onClick={() =>
                      onAddSubject({
                        title: p.title,
                        shortCode: p.code,
                        color: p.color,
                        icon: p.icon,
                        category: p.category,
                      })
                    }
                    className="p-2 rounded-lg border border-[#262626] hover:border-[#c5a059]/60 bg-[#171717] hover:bg-[#202020] text-left transition-all group flex items-center justify-between gap-1.5 cursor-grab active:cursor-grabbing select-none shadow-2xs"
                    title={`Drag "${p.title}" to any slot in timetable, or click to replace selected cell`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-3 h-3 rounded-full shrink-0 shadow-xs ring-1 ring-black/40"
                        style={{ backgroundColor: p.color }}
                      />
                      <div className="truncate">
                        <div className="text-xs font-medium text-[#ededed] truncate group-hover:text-[#c5a059]">
                          {p.title}
                        </div>
                        <div className="text-[10px] text-[#737373]">{p.code}</div>
                      </div>
                    </div>
                    <GripVertical className="w-3 h-3 text-[#444444] group-hover:text-[#c5a059] shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Subject Creator */}
            <div className="p-3 bg-[#161616] rounded-xl border border-[#262626] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#f5f5f5] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#c5a059]" />
                  Custom Subject Card
                </span>
                {newSubjTitle.trim() && (
                  <span className="text-[10px] text-[#c5a059]">Ready to drag or add</span>
                )}
              </div>

              <div>
                <label className="text-[11px] font-medium text-[#a3a3a3] block mb-1">Subject Name</label>
                <input
                  type="text"
                  placeholder="e.g. Artificial Intelligence"
                  value={newSubjTitle}
                  onChange={(e) => setNewSubjTitle(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 bg-[#1f1f1f] border border-[#2e2e2e] rounded-lg text-[#ededed] placeholder-[#737373] focus:outline-hidden focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059]/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-[#a3a3a3] block mb-1">Code</label>
                  <input
                    type="text"
                    placeholder="e.g. AI-401"
                    value={newSubjCode}
                    onChange={(e) => setNewSubjCode(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 bg-[#1f1f1f] border border-[#2e2e2e] rounded-lg text-[#ededed] placeholder-[#737373]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[#a3a3a3] block mb-1">Room / Hall</label>
                  <input
                    type="text"
                    placeholder="e.g. Lab 3"
                    value={newSubjRoom}
                    onChange={(e) => setNewSubjRoom(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 bg-[#1f1f1f] border border-[#2e2e2e] rounded-lg text-[#ededed] placeholder-[#737373]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-[#a3a3a3] block mb-1">Teacher / Instructor</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Alan Turing"
                  value={newSubjTeacher}
                  onChange={(e) => setNewSubjTeacher(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 bg-[#1f1f1f] border border-[#2e2e2e] rounded-lg text-[#ededed] placeholder-[#737373]"
                />
              </div>

              {/* Color swatch picker */}
              <div>
                <label className="text-[11px] font-medium text-[#a3a3a3] block mb-1">Badge Color</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {['#c5a059', '#1e3a8a', '#991b1b', '#065f46', '#581c87', '#dbeafe', '#fef3c7', '#e0e7ff', '#fce7f3', '#dcfce7'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewSubjColor(c)}
                      className={`w-5 h-5 rounded-full border transition-transform ${
                        newSubjColor === c ? 'scale-125 border-[#c5a059] shadow-xs' : 'border-[#383838]'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Draggable preview & add button */}
              <div
                draggable={Boolean(newSubjTitle.trim())}
                onDragStart={(e) => {
                  if (!newSubjTitle.trim()) return;
                  e.dataTransfer.setData(
                    'application/json',
                    JSON.stringify({
                      type: 'new_subject',
                      subject: {
                        title: newSubjTitle.trim(),
                        shortCode: newSubjCode.trim() || undefined,
                        teacher: newSubjTeacher.trim() || undefined,
                        room: newSubjRoom.trim() || undefined,
                        color: newSubjColor,
                        icon: newSubjIcon,
                        category: 'Custom',
                      },
                    })
                  );
                  e.dataTransfer.setData('text/plain', newSubjTitle.trim());
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                onClick={() => {
                  if (!newSubjTitle.trim()) return;
                  onAddSubject({
                    title: newSubjTitle.trim(),
                    shortCode: newSubjCode.trim() || undefined,
                    teacher: newSubjTeacher.trim() || undefined,
                    room: newSubjRoom.trim() || undefined,
                    color: newSubjColor,
                    icon: newSubjIcon,
                  });
                  setNewSubjTitle('');
                  setNewSubjCode('');
                  setNewSubjTeacher('');
                  setNewSubjRoom('');
                }}
                className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-between transition-all ${
                  newSubjTitle.trim()
                    ? 'bg-[#c5a059] hover:bg-[#d4af37] text-[#0a0a0a] shadow-xs cursor-grab active:cursor-grabbing'
                    : 'bg-[#222222] text-[#666666] cursor-not-allowed'
                }`}
                id="add-custom-subject-btn"
                title={newSubjTitle.trim() ? 'Click to assign to selected cell, or drag onto any slot' : 'Enter a subject name first'}
              >
                <div className="flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  <span>{newSubjTitle.trim() ? `Add / Drag "${newSubjTitle}"` : 'Enter Name to Add'}</span>
                </div>
                {newSubjTitle.trim() && <GripVertical className="w-3.5 h-3.5 text-[#0a0a0a]/70" />}
              </div>
            </div>
          </div>
        )}

        {/* THEMES TAB */}
        {activeTab === 'themes' && (
          <div className="space-y-4">
            <div className="text-xs text-[#a3a3a3] leading-relaxed">
              Select any pre-crafted theme. All colors, borders, typography, and contrast automatically adapt.
            </div>

            <div className="space-y-2.5">
              {PRESET_THEMES.map((th) => {
                const isCurrent = timetable.theme.id === th.id;
                return (
                  <button
                    key={th.id}
                    onClick={() => handleApplyTheme(th)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      isCurrent
                        ? 'border-[#c5a059] ring-2 ring-[#c5a059]/30 bg-[#c5a059]/10 shadow-xs'
                        : 'border-[#262626] hover:border-[#383838] bg-[#171717]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-[#ededed]">{th.name}</span>
                      {isCurrent && (
                        <span className="text-[10px] font-semibold text-[#0a0a0a] bg-[#c5a059] px-1.5 py-0.5 rounded-full">
                          Active
                        </span>
                      )}
                    </div>

                    {/* Color Swatch Preview Bar */}
                    <div className="flex items-center gap-1 h-3 rounded-md overflow-hidden border border-[#2a2a2a]">
                      <div className="h-full flex-1" style={{ backgroundColor: th.headerBackground }} />
                      <div className="h-full flex-1" style={{ backgroundColor: th.primaryColor }} />
                      <div className="h-full flex-1" style={{ backgroundColor: th.timeColumnBackground }} />
                      <div className="h-full flex-1" style={{ backgroundColor: th.backgroundColor }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* GRID STRUCTURE TAB */}
        {activeTab === 'structure' && (
          <div className="space-y-5">
            {/* Days Management */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#ededed] uppercase tracking-wider">
                  Days ({timetable.days.length})
                </span>
                <button
                  onClick={handleAddDay}
                  className="text-xs text-[#c5a059] hover:text-[#e0bf79] font-semibold flex items-center gap-1"
                  id="add-day-btn"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Day
                </button>
              </div>

              <div className="space-y-1.5">
                {timetable.days.map((day, idx) => (
                  <div
                    key={day.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-[#171717] border border-[#262626] text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-4 text-[#737373] font-mono text-[10px]">{idx + 1}</span>
                      <input
                        type="text"
                        value={day.name}
                        onChange={(e) => {
                          const updated = timetable.days.map((d) =>
                            d.id === day.id
                              ? { ...d, name: e.target.value, shortName: e.target.value.slice(0, 3) }
                              : d
                          );
                          onUpdateTimetable({ ...timetable, days: updated });
                        }}
                        className="font-medium text-[#ededed] bg-transparent border-b border-transparent hover:border-[#3a3a3a] focus:border-[#c5a059] focus:outline-hidden w-28 px-1"
                      />
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => handleMoveDay(day.id, 'up')}
                        disabled={idx === 0}
                        title={`Move day "${day.name}" up`}
                        aria-label={`Move day ${day.name} up`}
                        className="text-[#888888] hover:text-[#c5a059] hover:bg-[#c5a059]/15 disabled:opacity-20 p-1 rounded-md transition-colors"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveDay(day.id, 'down')}
                        disabled={idx === timetable.days.length - 1}
                        title={`Move day "${day.name}" down`}
                        aria-label={`Move day ${day.name} down`}
                        className="text-[#888888] hover:text-[#c5a059] hover:bg-[#c5a059]/15 disabled:opacity-20 p-1 rounded-md transition-colors"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRemoveDay(day.id)}
                        disabled={timetable.days.length <= 1}
                        title="Delete Day"
                        className="text-[#737373] hover:text-rose-400 hover:bg-rose-950/50 disabled:opacity-20 p-1 rounded-md transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Time Slots Management */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#ededed] uppercase tracking-wider">
                  Periods & Breaks ({timetable.timeSlots.length})
                </span>
                <button
                  onClick={handleAddPeriod}
                  className="text-xs text-[#c5a059] hover:text-[#e0bf79] font-semibold flex items-center gap-1"
                  id="add-period-btn"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Period
                </button>
              </div>

              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {timetable.timeSlots.map((slot, idx) => (
                  <div
                    key={slot.id}
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs ${
                      slot.isBreak ? 'bg-amber-950/20 border-amber-800/30' : 'bg-[#171717] border-[#262626]'
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                      <span className="w-4 text-[#737373] font-mono text-[10px]">{idx + 1}</span>
                      <div className="min-w-0 flex-1">
                        <input
                          type="text"
                          value={slot.name}
                          onChange={(e) => {
                            const updated = timetable.timeSlots.map((s) =>
                              s.id === slot.id ? { ...s, name: e.target.value } : s
                            );
                            onUpdateTimetable({ ...timetable, timeSlots: updated });
                          }}
                          className="font-medium text-[#ededed] bg-transparent border-b border-transparent hover:border-[#3a3a3a] focus:border-[#c5a059] focus:outline-hidden w-full px-1 truncate"
                        />
                        <div className="flex items-center gap-1 text-[10px] text-[#737373] mt-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          <input
                            type="text"
                            value={slot.start}
                            onChange={(e) => {
                              const updated = timetable.timeSlots.map((s) =>
                                s.id === slot.id ? { ...s, start: e.target.value } : s
                              );
                              onUpdateTimetable({ ...timetable, timeSlots: updated });
                            }}
                            className="w-10 bg-transparent text-center border-b border-[#2e2e2e] focus:border-[#c5a059] text-[#a3a3a3]"
                          />
                          <span>–</span>
                          <input
                            type="text"
                            value={slot.end}
                            onChange={(e) => {
                              const updated = timetable.timeSlots.map((s) =>
                                s.id === slot.id ? { ...s, end: e.target.value } : s
                              );
                              onUpdateTimetable({ ...timetable, timeSlots: updated });
                            }}
                            className="w-10 bg-transparent text-center border-b border-[#2e2e2e] focus:border-[#c5a059] text-[#a3a3a3]"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => setEditingSlot(slot)}
                        title={`Configure & edit session "${slot.name}" timings`}
                        aria-label={`Configure session ${slot.name}`}
                        className="text-[#888888] hover:text-[#c5a059] hover:bg-[#c5a059]/15 p-1.5 rounded-md transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveSlot(slot.id, 'up')}
                        disabled={idx === 0}
                        title={`Move row "${slot.name}" up`}
                        aria-label={`Move row ${slot.name} up`}
                        className="text-[#888888] hover:text-[#c5a059] hover:bg-[#c5a059]/15 disabled:opacity-20 p-1.5 rounded-md transition-colors"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveSlot(slot.id, 'down')}
                        disabled={idx === timetable.timeSlots.length - 1}
                        title={`Move row "${slot.name}" down`}
                        aria-label={`Move row ${slot.name} down`}
                        className="text-[#888888] hover:text-[#c5a059] hover:bg-[#c5a059]/15 disabled:opacity-20 p-1.5 rounded-md transition-colors"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRemoveSlot(slot.id)}
                        disabled={timetable.timeSlots.length <= 1}
                        title={`Delete row / period "${slot.name}"`}
                        aria-label={`Delete row / period "${slot.name}"`}
                        className="text-[#888888] hover:text-rose-400 hover:bg-rose-950/50 disabled:opacity-20 p-1.5 rounded-md transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ICONS TAB */}
        {activeTab === 'icons' && (
          <div className="space-y-4">
            <div className="text-xs text-[#a3a3a3]">
              Click any icon to assign to selected cell(s) or set as default for new subjects.
            </div>

            <div className="grid grid-cols-4 gap-2">
              {COMMON_ICONS.map((ic) => (
                <button
                  key={ic.name}
                  onClick={() => {
                    setNewSubjIcon(ic.name);
                    // If cells are selected, update them immediately
                    if (selectedCellIds.length > 0) {
                      const updatedEntries = timetable.entries.map((e) =>
                        selectedCellIds.includes(e.id) ? { ...e, icon: ic.name } : e
                      );
                      onUpdateTimetable({ ...timetable, entries: updatedEntries });
                    }
                  }}
                  title={ic.label}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                    newSubjIcon === ic.name
                      ? 'border-[#c5a059] bg-[#c5a059]/15 text-[#e0bf79] font-bold scale-105 shadow-xs'
                      : 'border-[#262626] hover:border-[#383838] bg-[#171717] hover:bg-[#1f1f1f] text-[#a3a3a3] hover:text-[#ededed]'
                  }`}
                >
                  <IconRenderer name={ic.name} size={18} />
                  <span className="text-[9px] text-[#737373] truncate w-full text-center">{ic.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* BRANDING / HEADER TAB */}
        {activeTab === 'branding' && (
          <div className="space-y-4">
            {/* Header info modal trigger button */}
            <button
              type="button"
              onClick={() => setIsHeaderModalOpen(true)}
              className="w-full py-2 px-3 rounded-xl bg-[#222222] hover:bg-[#c5a059] text-[#ededed] hover:text-[#0a0a0a] border border-[#333333] hover:border-[#c5a059] text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Open Full Header Designer</span>
            </button>

            <div>
              <label className="text-xs font-bold text-[#ededed] uppercase tracking-wider block mb-1">
                Institution / School Logo
              </label>
              <div className="flex items-center gap-3 p-3 bg-[#161616] rounded-xl border border-[#262626]">
                {timetable.logoUrl ? (
                  <div className="relative group shrink-0">
                    <img
                      src={timetable.logoUrl}
                      alt="Logo"
                      className="w-12 h-12 object-contain rounded-lg border border-[#2e2e2e] bg-[#0a0a0a]"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      onClick={() => onUpdateTimetable({ ...timetable, logoUrl: undefined })}
                      className="absolute -top-1 -right-1 bg-rose-600 text-white p-0.5 rounded-full shadow-xs"
                      title="Remove Logo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg border border-dashed border-[#383838] flex items-center justify-center text-[#737373] bg-[#1a1a1a]">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                )}

                <label className="cursor-pointer px-3 py-1.5 rounded-lg border border-[#2e2e2e] bg-[#1e1e1e] hover:bg-[#282828] hover:border-[#c5a059]/40 text-xs font-semibold text-[#ededed] flex items-center gap-1.5 transition-colors">
                  <Upload className="w-3.5 h-3.5 text-[#c5a059]" />
                  <span>Upload Image</span>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#a3a3a3] block mb-1">Institution Name</label>
              <input
                type="text"
                value={timetable.institutionName || ''}
                placeholder="e.g. Apex Institute of Technology"
                onChange={(e) => onUpdateTimetable({ ...timetable, institutionName: e.target.value })}
                className="w-full text-xs px-2.5 py-1.5 bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg text-[#ededed] placeholder-[#737373] focus:border-[#c5a059] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#a3a3a3] block mb-1">Subtitle / Department</label>
              <input
                type="text"
                value={timetable.subTitle || ''}
                placeholder="e.g. Department of Computer Science • Room 304"
                onChange={(e) => onUpdateTimetable({ ...timetable, subTitle: e.target.value })}
                className="w-full text-xs px-2.5 py-1.5 bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg text-[#ededed] placeholder-[#737373] focus:border-[#c5a059] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#a3a3a3] block mb-1">Academic Year / Term</label>
              <input
                type="text"
                value={timetable.academicYear || ''}
                placeholder="e.g. Semester 5 (2026-2027)"
                onChange={(e) => onUpdateTimetable({ ...timetable, academicYear: e.target.value })}
                className="w-full text-xs px-2.5 py-1.5 bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg text-[#ededed] placeholder-[#737373] focus:border-[#c5a059] focus:outline-hidden"
              />
            </div>

            {/* Custom Header Badges */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#a3a3a3]">Custom Header Badges</label>
                <button
                  type="button"
                  onClick={() => setIsHeaderModalOpen(true)}
                  className="text-[11px] text-[#c5a059] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Manage Badges
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 min-h-[28px] p-2 bg-[#161616] rounded-lg border border-[#262626]">
                {timetable.customBadges && timetable.customBadges.length > 0 ? (
                  timetable.customBadges.map((b) => (
                    <span
                      key={b.id}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border"
                      style={{
                        color: b.color || '#c5a059',
                        borderColor: `${b.color || '#c5a059'}40`,
                        backgroundColor: `${b.color || '#c5a059'}15`,
                      }}
                    >
                      {b.label}
                      <button
                        type="button"
                        onClick={() => {
                          const remaining = (timetable.customBadges || []).filter(
                            (badge) => badge.id !== b.id
                          );
                          onUpdateTimetable({
                            ...timetable,
                            customBadges: remaining.length > 0 ? remaining : undefined,
                          });
                        }}
                        className="hover:text-rose-400 opacity-70 hover:opacity-100"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-[#666666] italic">No custom badges added yet</span>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#a3a3a3] block mb-1">Footer Notes / Instructions</label>
              <textarea
                rows={3}
                value={timetable.footerNotes || ''}
                placeholder="e.g. Attendance mandatory (75% minimum). Practical lab wear required."
                onChange={(e) => onUpdateTimetable({ ...timetable, footerNotes: e.target.value })}
                className="w-full text-xs px-2.5 py-1.5 bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg text-[#ededed] placeholder-[#737373] focus:border-[#c5a059] focus:outline-hidden"
              />
            </div>
          </div>
        )}
      </div>

      {/* Header Info Modal */}
      {isHeaderModalOpen && (
        <HeaderInfoModal
          key={Date.now()}
          isOpen={isHeaderModalOpen}
          onClose={() => setIsHeaderModalOpen(false)}
          timetable={timetable}
          onSave={onUpdateTimetable}
        />
      )}

      {/* Edit Session Timings Modal */}
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
    </aside>
  );
};
