import React, { useState } from 'react';
import {
  Sliders,
  Type,
  Maximize2,
  Trash2,
  Copy,
  Eye,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Square,
  Sparkles,
  Layers,
  Palette,
  Check,
  X,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  ArrowLeftRight,
} from 'lucide-react';
import { Timetable, TimetableEntry, CellStyle } from '../types';
import { COMMON_ICONS, IconRenderer } from './IconRenderer';
import { swapTwoEntries } from '../utils/timetableOperations';

interface PropertiesPanelProps {
  timetable: Timetable;
  onUpdateTimetable: (updated: Timetable) => void;
  selectedCellIds: string[];
  onSelectCells: (ids: string[]) => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  onDeleteRow?: (slotId: string) => void;
  onMoveRow?: (slotId: string, direction: 'up' | 'down') => void;
  onCloseMobileDrawer?: () => void;
  onCollapse?: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  timetable,
  onUpdateTimetable,
  selectedCellIds,
  onSelectCells,
  onDeleteSelected,
  onDuplicateSelected,
  onDeleteRow,
  onMoveRow,
  onCloseMobileDrawer,
  onCollapse,
}) => {
  // Find selected entries
  const selectedEntries = timetable.entries.filter((e) => selectedCellIds.includes(e.id));
  const primarySelected = selectedEntries[0];
  const [exchangeTargetId, setExchangeTargetId] = useState<string>('');

  const handleUpdatePrimaryEntry = (patch: Partial<TimetableEntry>) => {
    if (!primarySelected) return;
    const updatedEntries = timetable.entries.map((e) => {
      if (selectedCellIds.includes(e.id)) {
        return { ...e, ...patch };
      }
      return e;
    });
    onUpdateTimetable({
      ...timetable,
      entries: updatedEntries,
      lastEdited: new Date().toISOString(),
    });
  };

  const handleUpdatePrimaryStyle = (stylePatch: Partial<CellStyle>) => {
    if (!primarySelected) return;
    const updatedEntries = timetable.entries.map((e) => {
      if (selectedCellIds.includes(e.id)) {
        return {
          ...e,
          style: {
            ...(e.style || {}),
            ...stylePatch,
          },
        };
      }
      return e;
    });
    onUpdateTimetable({
      ...timetable,
      entries: updatedEntries,
      lastEdited: new Date().toISOString(),
    });
  };

  const handleUpdateGlobalTheme = (patch: Partial<typeof timetable.theme>) => {
    onUpdateTimetable({
      ...timetable,
      theme: {
        ...timetable.theme,
        ...patch,
      },
      lastEdited: new Date().toISOString(),
    });
  };

  return (
    <aside className="no-print w-full lg:w-80 bg-[#141414] border-l border-[#262626] flex flex-col h-full min-h-0 shrink-0 select-none text-[#ededed]">
      {/* Header */}
      <div className="p-3 border-b border-[#262626] bg-[#181818] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <Sliders className="w-4 h-4 text-[#c5a059]" />
          <span className="text-xs font-serif font-bold text-[#f5f5f5] uppercase tracking-wider">
            {selectedEntries.length > 0
              ? `${selectedEntries.length} Cell${selectedEntries.length > 1 ? 's' : ''} Selected`
              : 'Inspector & Theme'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {selectedEntries.length > 0 && (
            <button
              onClick={() => onSelectCells([])}
              className="text-[11px] text-[#c5a059] hover:text-[#d4af37] font-medium px-2 py-1 rounded-md hover:bg-[#c5a059]/10"
              aria-label="Deselect selected cells"
            >
              Deselect
            </button>
          )}
          {onCollapse && (
            <button
              onClick={onCollapse}
              className="hidden lg:flex p-1.5 rounded-lg text-[#888888] hover:text-[#ededed] hover:bg-[#202020] transition-colors"
              title="Collapse Inspector"
              aria-label="Collapse Inspector"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
          {onCloseMobileDrawer && (
            <button
              onClick={onCloseMobileDrawer}
              className="p-1.5 rounded-lg bg-[#222222] hover:bg-[#2a2a2a] text-[#a3a3a3] hover:text-[#ededed] border border-[#2e2e2e] transition-colors lg:hidden"
              aria-label="Close properties inspector"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-5 pb-32">
        {/* =======================
            CELL PROPERTIES MODE
           ======================= */}
        {selectedEntries.length > 0 && primarySelected ? (
          <>
            {/* Quick Actions (Duplicate, Delete) */}
            <div className="flex items-center gap-2">
              <button
                onClick={onDuplicateSelected}
                className="flex-1 py-1.5 px-2.5 rounded-lg border border-[#2e2e2e] bg-[#1a1a1a] hover:bg-[#222222] text-[#ededed] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                id="duplicate-cell-btn"
              >
                <Copy className="w-3.5 h-3.5 text-[#a3a3a3]" />
                Duplicate
              </button>
              <button
                onClick={onDeleteSelected}
                className="py-1.5 px-3 rounded-lg border border-rose-900/50 bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                id="delete-cell-btn"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>

            {/* Exchange / Swap Position Section */}
            {selectedEntries.length === 2 && (
              <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
                    Exchange / Swap 2 Selected
                  </span>
                </div>
                <p className="text-[11px] text-amber-200/90 leading-tight">
                  Swap positions of <strong>"{selectedEntries[0].title}"</strong> and <strong>"{selectedEntries[1].title}"</strong>.
                </p>
                <button
                  onClick={() => {
                    const swapped = swapTwoEntries(timetable, selectedEntries[0].id, selectedEntries[1].id);
                    onUpdateTimetable(swapped);
                  }}
                  className="w-full py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  id="inspector-swap-selected-btn"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  Swap Positions Now
                </button>
              </div>
            )}

            {selectedEntries.length === 1 && (
              <div className="p-3 rounded-xl border border-[#2a2a2a] bg-[#181818] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#c5a059] uppercase tracking-wider flex items-center gap-1.5">
                    <ArrowLeftRight className="w-3.5 h-3.5 text-[#c5a059]" />
                    Exchange Subject Position
                  </span>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] text-[#888888] block">
                    Swap "{primarySelected.title}" with:
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={exchangeTargetId}
                      onChange={(e) => setExchangeTargetId(e.target.value)}
                      className="flex-1 min-w-0 bg-[#121212] border border-[#2e2e2e] text-xs text-[#ededed] rounded-lg px-2.5 py-1.5 outline-none focus:border-[#c5a059]"
                      aria-label="Select subject to exchange with"
                    >
                      <option value="">Choose another subject...</option>
                      {timetable.entries
                        .filter((e) => e.id !== primarySelected.id)
                        .map((e) => {
                          const dayName = timetable.days.find((d) => d.id === e.dayId)?.name || e.dayId;
                          const slotName = timetable.timeSlots.find((s) => s.id === e.slotId)?.name || e.slotId;
                          return (
                            <option key={e.id} value={e.id}>
                              {e.title} ({dayName} · {slotName})
                            </option>
                          );
                        })}
                    </select>
                    <button
                      disabled={!exchangeTargetId}
                      onClick={() => {
                        if (!exchangeTargetId) return;
                        const targetEntry = timetable.entries.find((e) => e.id === exchangeTargetId);
                        const swapped = swapTwoEntries(timetable, primarySelected.id, exchangeTargetId);
                        onUpdateTimetable(swapped);
                        onSelectCells([primarySelected.id, exchangeTargetId]);
                        setExchangeTargetId('');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#c5a059] hover:bg-[#d4af37] disabled:opacity-30 disabled:cursor-not-allowed text-black font-bold text-xs transition-colors shrink-0 cursor-pointer"
                      title="Swap positions with selected subject"
                    >
                      Swap
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-[#737373] leading-tight">
                  You can also drag this subject card directly over another subject on the timetable grid to exchange them.
                </p>
              </div>
            )}

            {/* Row / Period Reorder & Manage */}
            {primarySelected && (
              <div className="p-2.5 rounded-xl border border-[#262626] bg-[#171717] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] font-bold text-[#888888] uppercase tracking-wider">
                    Row: {timetable.timeSlots.find((s) => s.id === primarySelected.slotId)?.name || 'Period'}
                  </span>
                  <span className="text-[10px] text-[#737373] font-mono">
                    {timetable.timeSlots.find((s) => s.id === primarySelected.slotId)?.start} – {timetable.timeSlots.find((s) => s.id === primarySelected.slotId)?.end}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {onMoveRow && (
                    <>
                      <button
                        type="button"
                        onClick={() => onMoveRow(primarySelected.slotId, 'up')}
                        disabled={timetable.timeSlots.findIndex((s) => s.id === primarySelected.slotId) === 0}
                        className="flex-1 py-1 px-2 rounded-md border border-[#2e2e2e] bg-[#1f1f1f] hover:bg-[#2a2a2a] disabled:opacity-25 text-xs text-[#ededed] flex items-center justify-center gap-1 transition-colors"
                        title="Move this row / period up"
                      >
                        <ChevronUp className="w-3.5 h-3.5 text-[#c5a059]" />
                        <span>Move Up</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onMoveRow(primarySelected.slotId, 'down')}
                        disabled={timetable.timeSlots.findIndex((s) => s.id === primarySelected.slotId) === timetable.timeSlots.length - 1}
                        className="flex-1 py-1 px-2 rounded-md border border-[#2e2e2e] bg-[#1f1f1f] hover:bg-[#2a2a2a] disabled:opacity-25 text-xs text-[#ededed] flex items-center justify-center gap-1 transition-colors"
                        title="Move this row / period down"
                      >
                        <ChevronDown className="w-3.5 h-3.5 text-[#c5a059]" />
                        <span>Move Down</span>
                      </button>
                    </>
                  )}
                  {onDeleteRow && (
                    <button
                      type="button"
                      onClick={() => onDeleteRow(primarySelected.slotId)}
                      disabled={timetable.timeSlots.length <= 1}
                      className="py-1 px-2.5 rounded-md border border-rose-900/40 bg-rose-950/20 hover:bg-rose-950/40 disabled:opacity-25 text-xs text-rose-300 flex items-center justify-center gap-1 transition-colors shrink-0"
                      title="Delete this entire row"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Row</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Basic Content Info */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-[#888888] uppercase tracking-wider block">
                Activity Details
              </span>

              <div>
                <label className="text-[11px] font-medium text-[#a3a3a3] block mb-1">Title / Subject</label>
                <input
                  type="text"
                  value={primarySelected.title}
                  onChange={(e) => handleUpdatePrimaryEntry({ title: e.target.value })}
                  className="w-full text-xs px-2.5 py-1.5 bg-[#1a1a1a] border border-[#2e2e2e] text-[#ededed] rounded-lg focus:border-[#c5a059] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-[#a3a3a3] block mb-1">Short Code</label>
                  <input
                    type="text"
                    value={primarySelected.shortCode || ''}
                    placeholder="e.g. CS101"
                    onChange={(e) => handleUpdatePrimaryEntry({ shortCode: e.target.value })}
                    className="w-full text-xs px-2.5 py-1.5 bg-[#1a1a1a] border border-[#2e2e2e] text-[#ededed] placeholder-[#737373] rounded-lg focus:border-[#c5a059]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[#a3a3a3] block mb-1">Room / Hall</label>
                  <input
                    type="text"
                    value={primarySelected.room || ''}
                    placeholder="e.g. 204"
                    onChange={(e) => handleUpdatePrimaryEntry({ room: e.target.value })}
                    className="w-full text-xs px-2.5 py-1.5 bg-[#1a1a1a] border border-[#2e2e2e] text-[#ededed] placeholder-[#737373] rounded-lg focus:border-[#c5a059]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-[#a3a3a3] block mb-1">Instructor / Teacher</label>
                <input
                  type="text"
                  value={primarySelected.teacher || ''}
                  placeholder="e.g. Prof. Sharma"
                  onChange={(e) => handleUpdatePrimaryEntry({ teacher: e.target.value })}
                  className="w-full text-xs px-2.5 py-1.5 bg-[#1a1a1a] border border-[#2e2e2e] text-[#ededed] placeholder-[#737373] rounded-lg focus:border-[#c5a059]"
                />
              </div>
            </div>

            {/* Colors & Visual Styling */}
            <div className="space-y-3 pt-2 border-t border-[#262626]">
              <span className="text-[11px] font-bold text-[#888888] uppercase tracking-wider block">
                Cell Appearance
              </span>

              {/* Background Color Swatches */}
              <div>
                <label className="text-[11px] font-medium text-[#a3a3a3] block mb-1.5">Card Background</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    '#1e1c14', // dark luxury gold tint
                    '#18231c', // dark luxury emerald tint
                    '#17202a', // dark luxury navy tint
                    '#241920', // dark luxury burgundy
                    '#222222', // charcoal
                    '#dbeafe', // light blue
                    '#fef3c7', // light amber
                    '#e0e7ff', // light indigo
                    '#fce7f3', // light pink
                    '#dcfce7', // light green
                    '#ffedd5', // light orange
                    '#ccfbf1', // light teal
                  ].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleUpdatePrimaryEntry({ color: c })}
                      className={`w-6 h-6 rounded-full border transition-transform flex items-center justify-center ${
                        primarySelected.color === c ? 'scale-125 border-[#c5a059] shadow-xs ring-1 ring-[#c5a059]' : 'border-[#333333]'
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {primarySelected.color === c && <Check className="w-3 h-3 text-[#ededed]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon Quick Changer */}
              <div>
                <label className="text-[11px] font-medium text-[#a3a3a3] block mb-1.5">Icon</label>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {COMMON_ICONS.slice(0, 8).map((ic) => (
                    <button
                      key={ic.name}
                      onClick={() => handleUpdatePrimaryEntry({ icon: ic.name })}
                      className={`p-1.5 rounded-lg border transition-all shrink-0 ${
                        primarySelected.icon === ic.name
                          ? 'border-[#c5a059] bg-[#c5a059]/20 text-[#c5a059]'
                          : 'border-[#262626] text-[#a3a3a3] hover:bg-[#202020] hover:text-[#ededed]'
                      }`}
                    >
                      <IconRenderer name={ic.name} size={16} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Typography Options */}
              <div>
                <label className="text-[11px] font-medium text-[#a3a3a3] block mb-1.5">Typography & Alignment</label>
                <div className="flex items-center gap-1 bg-[#1a1a1a] p-1 rounded-lg border border-[#262626]">
                  <button
                    onClick={() =>
                      handleUpdatePrimaryStyle({
                        textAlign: 'left',
                      })
                    }
                    className={`p-1.5 rounded text-xs ${
                      primarySelected.style?.textAlign === 'left' || !primarySelected.style?.textAlign
                        ? 'bg-[#282828] text-[#c5a059] shadow-2xs'
                        : 'text-[#737373] hover:text-[#ededed]'
                    }`}
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() =>
                      handleUpdatePrimaryStyle({
                        textAlign: 'center',
                      })
                    }
                    className={`p-1.5 rounded text-xs ${
                      primarySelected.style?.textAlign === 'center'
                        ? 'bg-[#282828] text-[#c5a059] shadow-2xs'
                        : 'text-[#737373] hover:text-[#ededed]'
                    }`}
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() =>
                      handleUpdatePrimaryStyle({
                        textAlign: 'right',
                      })
                    }
                    className={`p-1.5 rounded text-xs ${
                      primarySelected.style?.textAlign === 'right'
                        ? 'bg-[#282828] text-[#c5a059] shadow-2xs'
                        : 'text-[#737373] hover:text-[#ededed]'
                    }`}
                  >
                    <AlignRight className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-px h-4 bg-[#333333] mx-1" />
                  <button
                    onClick={() =>
                      handleUpdatePrimaryStyle({
                        fontWeight: primarySelected.style?.fontWeight === 'bold' ? 'normal' : 'bold',
                      })
                    }
                    className={`p-1.5 rounded text-xs ${
                      primarySelected.style?.fontWeight === 'bold'
                        ? 'bg-[#282828] text-[#c5a059] font-bold shadow-2xs'
                        : 'text-[#737373] hover:text-[#ededed]'
                    }`}
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() =>
                      handleUpdatePrimaryStyle({
                        fontStyle: primarySelected.style?.fontStyle === 'italic' ? 'normal' : 'italic',
                      })
                    }
                    className={`p-1.5 rounded text-xs ${
                      primarySelected.style?.fontStyle === 'italic'
                        ? 'bg-[#282828] text-[#c5a059] shadow-2xs'
                        : 'text-[#737373] hover:text-[#ededed]'
                    }`}
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Cell Corner Radius */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-medium text-[#a3a3a3] mb-1">
                  <span>Corner Radius</span>
                  <span>{primarySelected.style?.borderRadius ?? timetable.theme.borderRadius}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={20}
                  step={2}
                  value={primarySelected.style?.borderRadius ?? timetable.theme.borderRadius}
                  onChange={(e) => handleUpdatePrimaryStyle({ borderRadius: Number(e.target.value) })}
                  className="w-full accent-[#c5a059] cursor-pointer"
                />
              </div>
            </div>
          </>
        ) : (
          /* =======================
              GLOBAL SETTINGS MODE
             ======================= */
          <>
            {/* Timetable Identity */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-[#888888] uppercase tracking-wider block">
                Timetable Identity
              </span>

              <div>
                <label className="text-[11px] font-medium text-[#a3a3a3] block mb-1">Timetable Name</label>
                <input
                  type="text"
                  value={timetable.name}
                  onChange={(e) => onUpdateTimetable({ ...timetable, name: e.target.value })}
                  className="w-full text-xs px-2.5 py-1.5 bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg focus:border-[#c5a059] focus:outline-hidden font-serif font-semibold text-[#ededed]"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-[#a3a3a3] block mb-1">Schedule Type</label>
                <select
                  value={timetable.type}
                  onChange={(e) => onUpdateTimetable({ ...timetable, type: e.target.value as any })}
                  className="w-full text-xs px-2.5 py-1.5 bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg capitalize text-[#ededed] focus:border-[#c5a059]"
                >
                  {['school', 'college', 'university', 'study', 'work', 'personal', 'workout', 'custom'].map((t) => (
                    <option key={t} value={t} className="bg-[#1a1a1a]">
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Typography Setting */}
            <div className="space-y-3 pt-2 border-t border-[#262626]">
              <span className="text-[11px] font-bold text-[#888888] uppercase tracking-wider block">
                Typography
              </span>

              <div>
                <label className="text-[11px] font-medium text-[#a3a3a3] block mb-1">Body Font Family</label>
                <select
                  value={timetable.theme.fontFamily}
                  onChange={(e) => handleUpdateGlobalTheme({ fontFamily: e.target.value })}
                  className="w-full text-xs px-2.5 py-1.5 bg-[#1a1a1a] border border-[#2e2e2e] text-[#ededed] rounded-lg focus:border-[#c5a059]"
                >
                  <option value="font-cormorant" className="bg-[#1a1a1a]">Cormorant Garamond (Sophisticated Luxury)</option>
                  <option value="font-playfair" className="bg-[#1a1a1a]">Playfair Display (Editorial Serif)</option>
                  <option value="font-jakarta" className="bg-[#1a1a1a]">Plus Jakarta Sans (Modern Clean)</option>
                  <option value="font-outfit" className="bg-[#1a1a1a]">Outfit (Geometric & Tech)</option>
                  <option value="font-dmsans" className="bg-[#1a1a1a]">DM Sans (Minimalist)</option>
                  <option value="font-mono" className="bg-[#1a1a1a]">JetBrains Mono (Technical)</option>
                </select>
              </div>
            </div>

            {/* Grid & Dimensions */}
            <div className="space-y-3 pt-2 border-t border-[#262626]">
              <span className="text-[11px] font-bold text-[#888888] uppercase tracking-wider block">
                Grid Geometry & Spacing
              </span>

              <div>
                <div className="flex items-center justify-between text-[11px] font-medium text-[#a3a3a3] mb-1">
                  <span>Row Height</span>
                  <span>{timetable.theme.cellHeight}px</span>
                </div>
                <input
                  type="range"
                  min={55}
                  max={120}
                  step={2}
                  value={timetable.theme.cellHeight}
                  onChange={(e) => handleUpdateGlobalTheme({ cellHeight: Number(e.target.value) })}
                  className="w-full accent-[#c5a059] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] font-medium text-[#a3a3a3] mb-1">
                  <span>Column Width</span>
                  <span>{timetable.theme.cellWidth}px</span>
                </div>
                <input
                  type="range"
                  min={110}
                  max={220}
                  step={5}
                  value={timetable.theme.cellWidth}
                  onChange={(e) => handleUpdateGlobalTheme({ cellWidth: Number(e.target.value) })}
                  className="w-full accent-[#c5a059] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] font-medium text-[#a3a3a3] mb-1">
                  <span>Corner Radius</span>
                  <span>{timetable.theme.borderRadius}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={16}
                  step={2}
                  value={timetable.theme.borderRadius}
                  onChange={(e) => handleUpdateGlobalTheme({ borderRadius: Number(e.target.value) })}
                  className="w-full accent-[#c5a059] cursor-pointer"
                />
              </div>
            </div>

            {/* Display Toggles */}
            <div className="space-y-2.5 pt-2 border-t border-[#262626]">
              <span className="text-[11px] font-bold text-[#888888] uppercase tracking-wider block">
                Cell Metadata Visibility
              </span>

              <label className="flex items-center justify-between cursor-pointer text-xs text-[#ededed]">
                <span>Show Icons</span>
                <input
                  type="checkbox"
                  checked={timetable.theme.showIcons}
                  onChange={(e) => handleUpdateGlobalTheme({ showIcons: e.target.checked })}
                  className="rounded accent-[#c5a059] w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer text-xs text-[#ededed]">
                <span>Show Instructor / Teacher</span>
                <input
                  type="checkbox"
                  checked={timetable.theme.showTeacher}
                  onChange={(e) => handleUpdateGlobalTheme({ showTeacher: e.target.checked })}
                  className="rounded accent-[#c5a059] w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer text-xs text-[#ededed]">
                <span>Show Room / Location</span>
                <input
                  type="checkbox"
                  checked={timetable.theme.showRoom}
                  onChange={(e) => handleUpdateGlobalTheme({ showRoom: e.target.checked })}
                  className="rounded accent-[#c5a059] w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer text-xs text-[#ededed]">
                <span>Show Color Legend</span>
                <input
                  type="checkbox"
                  checked={timetable.theme.showLegend}
                  onChange={(e) => handleUpdateGlobalTheme({ showLegend: e.target.checked })}
                  className="rounded accent-[#c5a059] w-4 h-4 cursor-pointer"
                />
              </label>
            </div>

            {/* Reorder Rows / Periods Quick Tool */}
            <div className="space-y-2.5 pt-2 border-t border-[#262626]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#888888] uppercase tracking-wider block">
                  Reorder Periods / Rows
                </span>
                <span className="text-[10px] text-[#c5a059] font-mono">
                  {timetable.timeSlots.length} periods
                </span>
              </div>
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {timetable.timeSlots.map((slot, idx) => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-[#181818] border border-[#262626] text-xs"
                  >
                    <div className="truncate min-w-0 pr-2">
                      <span className="font-semibold text-[#ededed] block truncate">{slot.name}</span>
                      <span className="text-[10px] text-[#737373] font-mono">{slot.start} – {slot.end}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {onMoveRow && (
                        <>
                          <button
                            type="button"
                            onClick={() => onMoveRow(slot.id, 'up')}
                            disabled={idx === 0}
                            title={`Move row "${slot.name}" up`}
                            aria-label={`Move row ${slot.name} up`}
                            className="p-1 rounded bg-[#202020] hover:bg-[#2a2a2a] text-[#a3a3a3] hover:text-[#c5a059] disabled:opacity-20 transition-colors"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onMoveRow(slot.id, 'down')}
                            disabled={idx === timetable.timeSlots.length - 1}
                            title={`Move row "${slot.name}" down`}
                            aria-label={`Move row ${slot.name} down`}
                            className="p-1 rounded bg-[#202020] hover:bg-[#2a2a2a] text-[#a3a3a3] hover:text-[#c5a059] disabled:opacity-20 transition-colors"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      {onDeleteRow && (
                        <button
                          type="button"
                          onClick={() => onDeleteRow(slot.id)}
                          disabled={timetable.timeSlots.length <= 1}
                          title={`Delete row "${slot.name}"`}
                          aria-label={`Delete row ${slot.name}`}
                          className="p-1 rounded bg-[#202020] hover:bg-rose-950/40 text-[#737373] hover:text-rose-400 disabled:opacity-20 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
};
