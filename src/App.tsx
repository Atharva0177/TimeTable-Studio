/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Timetable, LayoutMode, DeviceView, TimetableEntry } from './types';
import { INITIAL_TIMETABLES } from './data/presets';
import { detectConflicts, deduplicateCellEntries } from './utils/conflictDetector';
import { HeaderNav } from './components/HeaderNav';
import { CanvasToolbar } from './components/CanvasToolbar';
import { LeftPanel } from './components/LeftPanel';
import { TimetableCanvas } from './components/TimetableCanvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import { DashboardView } from './components/DashboardView';
import { TemplatesView } from './components/TemplatesView';
import { CreateTimetableModal } from './components/CreateTimetableModal';
import { ExportModal } from './components/ExportModal';
import { ShareModal } from './components/ShareModal';
import { AiAssistantModal } from './components/AiAssistantModal';
import { QuickEditModal } from './components/QuickEditModal';
import { PrintModal } from './components/PrintModal';
import { CopyDayModal } from './components/CopyDayModal';
import { ExportTimetableTarget } from './components/ExportTimetableTarget';
import { copyDayTimetable, swapTwoEntries } from './utils/timetableOperations';
import {
  Palette,
  SlidersHorizontal,
  CalendarDays,
  Grid,
  Sparkles,
  PanelLeftOpen,
  PanelRightOpen,
  Plus,
  Layers,
  Sliders,
} from 'lucide-react';
import {
  exportTimetableToPng,
  triggerTimetablePrint,
  isSandboxedIframe,
} from './utils/exportHelper';

const STORAGE_KEY = 'timetable_studio_v1_timetables';
const ACTIVE_ID_KEY = 'timetable_studio_v1_active_id';

export default function App() {
  // 1. Initialize State with LocalStorage persistence
  const [timetables, setTimetables] = useState<Timetable[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((t: Timetable) => ({
            ...t,
            entries: deduplicateCellEntries(t.entries || []),
          }));
        }
      }
    } catch (e) {
      console.error('Failed to load timetables from localStorage', e);
    }
    return INITIAL_TIMETABLES.map((t) => ({
      ...t,
      entries: deduplicateCellEntries(t.entries || []),
    }));
  });

  const [activeTimetableId, setActiveTimetableId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem(ACTIVE_ID_KEY);
      if (savedId && timetables.some((t) => t.id === savedId)) {
        return savedId;
      }
    } catch {}
    return timetables[0]?.id || 'tt_college_eng';
  });

  const [currentTab, setCurrentTab] = useState<'editor' | 'dashboard' | 'templates'>('editor');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('grid');
  const [deviceView, setDeviceView] = useState<DeviceView>('desktop');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [selectedCellIds, setSelectedCellIds] = useState<string[]>([]);
  const [lastSavedText, setLastSavedText] = useState<string>('✓ All changes saved');
  const [mobileDrawer, setMobileDrawer] = useState<'none' | 'left' | 'right'>('none');
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setDownloadToast(msg);
    setTimeout(() => {
      setDownloadToast((current) => (current === msg ? null : current));
    }, 3000);
  }, []);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isCopyDayModalOpen, setIsCopyDayModalOpen] = useState(false);
  const [copyDaySourceId, setCopyDaySourceId] = useState<string | undefined>(undefined);
  const [quickEditEntry, setQuickEditEntry] = useState<TimetableEntry | null>(null);

  // Check for ?print=true parameter when opened in a dedicated browser tab
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('print') === 'true' && !isSandboxedIframe()) {
        const timer = setTimeout(() => {
          window.print();
        }, 800);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      console.warn('Could not parse print search param', e);
    }
  }, []);

  // Undo/Redo History Stack (per active timetable)
  const [history, setHistory] = useState<Timetable[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Active timetable lookup
  const activeTimetable =
    timetables.find((t) => t.id === activeTimetableId) || timetables[0] || INITIAL_TIMETABLES[0];

  // Initialize history when switching timetables
  useEffect(() => {
    if (activeTimetable) {
      setHistory([activeTimetable]);
      setHistoryIndex(0);
      setSelectedCellIds([]);
    }
  }, [activeTimetableId]);

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(timetables));
      localStorage.setItem(ACTIVE_ID_KEY, activeTimetableId);
    } catch (e) {
      console.warn('LocalStorage full or disabled', e);
    }
  }, [timetables, activeTimetableId]);

  // Detect Conflicts
  const conflicts = detectConflicts(activeTimetable);

  // Timetable update handler with history recording
  const handleUpdateActiveTimetable = useCallback(
    (updated: Timetable, recordHistory = true) => {
      // Ensure only the latest selected per cell is kept (resolves any overlap immediately)
      const sanitized: Timetable = {
        ...updated,
        entries: deduplicateCellEntries(updated.entries || []),
      };

      setTimetables((prev) => prev.map((t) => (t.id === sanitized.id ? sanitized : t)));

      if (recordHistory) {
        setHistory((prev) => {
          const next = prev.slice(0, historyIndex + 1);
          return [...next, sanitized];
        });
        setHistoryIndex((prev) => prev + 1);
      }

      setLastSavedText('✓ Autosaved just now');
    },
    [historyIndex]
  );

  // Undo / Redo handlers
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setTimetables((list) => list.map((t) => (t.id === prev.id ? prev : t)));
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setTimetables((list) => list.map((t) => (t.id === next.id ? next : t)));
    }
  }, [history, historyIndex]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Ctrl/Cmd + Z = Undo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }

      // Ctrl/Cmd + Shift + Z or Ctrl + Y = Redo
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && e.shiftKey) ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y')
      ) {
        e.preventDefault();
        handleRedo();
      }

      // Delete or Backspace = Delete selected cells
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedCellIds.length > 0) {
          e.preventDefault();
          handleDeleteSelectedCells();
        }
      }

      // Ctrl/Cmd + A = Select all cells
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setSelectedCellIds(activeTimetable.entries.map((item) => item.id));
      }

      // Ctrl/Cmd + P = Print
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        window.print();
      }

      // Ctrl/Cmd + S = Prevent default browser save & show saved feedback
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setLastSavedText('✓ Timetable saved');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, selectedCellIds, activeTimetable]);

  // Cell manipulation actions
  const handleDeleteSelectedCells = () => {
    if (selectedCellIds.length === 0) return;
    const updatedEntries = activeTimetable.entries.filter((e) => !selectedCellIds.includes(e.id));
    handleUpdateActiveTimetable({
      ...activeTimetable,
      entries: updatedEntries,
      lastEdited: new Date().toISOString(),
    });
    setSelectedCellIds([]);
  };

  const handleDuplicateSelectedCells = () => {
    if (selectedCellIds.length === 0) return;
    const selected = activeTimetable.entries.filter((e) => selectedCellIds.includes(e.id));
    const duplicates: TimetableEntry[] = selected.map((e) => ({
      ...e,
      id: `copy_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: `${e.title} (Copy)`,
    }));

    handleUpdateActiveTimetable({
      ...activeTimetable,
      entries: [...activeTimetable.entries, ...duplicates],
      lastEdited: new Date().toISOString(),
    });
  };

  // Swap the 2 selected entries
  const handleSwapSelectedEntries = useCallback(() => {
    if (selectedCellIds.length !== 2) return;
    const [idA, idB] = selectedCellIds;
    const entryA = activeTimetable.entries.find((e) => e.id === idA);
    const entryB = activeTimetable.entries.find((e) => e.id === idB);
    if (!entryA || !entryB) return;

    const swapped = swapTwoEntries(activeTimetable, idA, idB);
    handleUpdateActiveTimetable(swapped);
    setDownloadToast(`⇄ Exchanged "${entryA.title}" with "${entryB.title}"`);
    setTimeout(() => setDownloadToast(null), 3500);
  }, [selectedCellIds, activeTimetable, handleUpdateActiveTimetable]);

  // Copy single day timetable to next day
  const handleOpenCopyDayModal = useCallback(
    (sourceDayId?: string) => {
      setCopyDaySourceId(sourceDayId || activeTimetable.days[0]?.id);
      setIsCopyDayModalOpen(true);
    },
    [activeTimetable.days]
  );

  const handleConfirmCopyDay = useCallback(
    (sourceDayId: string, targetDayId: string, mode: 'replace' | 'merge') => {
      const sourceDay = activeTimetable.days.find((d) => d.id === sourceDayId);
      const targetDay = activeTimetable.days.find((d) => d.id === targetDayId);

      const { updatedTimetable, copiedCount } = copyDayTimetable(activeTimetable, {
        sourceDayId,
        targetDayId,
        mode,
      });

      handleUpdateActiveTimetable(updatedTimetable);

      const srcName = sourceDay?.name || 'day';
      const tgtName = targetDay?.name || 'next day';
      setDownloadToast(
        `✓ Copied ${srcName} timetable to ${tgtName} (${copiedCount} ${
          copiedCount === 1 ? 'session' : 'sessions'
        } copied)`
      );
      setTimeout(() => setDownloadToast(null), 3500);
    },
    [activeTimetable, handleUpdateActiveTimetable]
  );

  // Add subject element to selected cell or first empty slot
  const handleAddSubjectFromPanel = (subject: {
    title: string;
    shortCode?: string;
    teacher?: string;
    room?: string;
    color: string;
    icon?: string;
    category?: string;
  }) => {
    // If a cell is currently selected, add to that slot
    let targetDayId = activeTimetable.days[0]?.id || 'mon';
    let targetSlotId = activeTimetable.timeSlots[0]?.id || 's1';

    if (selectedCellIds.length > 0) {
      const selectedEntry = activeTimetable.entries.find((e) => e.id === selectedCellIds[0]);
      if (selectedEntry) {
        targetDayId = selectedEntry.dayId;
        targetSlotId = selectedEntry.slotId;
      }
    } else {
      // Find first empty slot
      for (const d of activeTimetable.days) {
        for (const s of activeTimetable.timeSlots) {
          if (!s.isBreak && !activeTimetable.entries.some((e) => e.dayId === d.id && e.slotId === s.id)) {
            targetDayId = d.id;
            targetSlotId = s.id;
            break;
          }
        }
      }
    }

    const newEntry: TimetableEntry = {
      id: `entry_${Date.now()}`,
      dayId: targetDayId,
      slotId: targetSlotId,
      title: subject.title,
      shortCode: subject.shortCode,
      teacher: subject.teacher,
      room: subject.room,
      color: subject.color,
      icon: subject.icon,
      category: subject.category,
    };

    // Remove any previous entry at this cell so ONLY the latest selected is kept
    const remainingEntries = activeTimetable.entries.filter(
      (e) => !(e.dayId === targetDayId && e.slotId === targetSlotId)
    );

    handleUpdateActiveTimetable({
      ...activeTimetable,
      entries: [...remainingEntries, newEntry],
      lastEdited: new Date().toISOString(),
    });
    setSelectedCellIds([newEntry.id]);
  };

  // Add break slot
  const handleAddBreak = (breakType: 'lunch' | 'tea' | 'free') => {
    const breakSlot = {
      id: `slot_break_${Date.now()}`,
      name: breakType === 'lunch' ? 'Lunch Break' : breakType === 'tea' ? 'Tea / Recess' : 'Free Period',
      start: '12:30',
      end: '13:15',
      isBreak: true,
      breakType,
    };

    handleUpdateActiveTimetable({
      ...activeTimetable,
      timeSlots: [...activeTimetable.timeSlots, breakSlot],
      lastEdited: new Date().toISOString(),
    });
  };

  // Add subject directly to a specific slot from canvas
  const handleAddSubjectToSlot = (dayId: string, slotId: string) => {
    const newEntry: TimetableEntry = {
      id: `entry_${Date.now()}`,
      dayId,
      slotId,
      title: 'New Subject',
      shortCode: 'SUBJ',
      teacher: 'Instructor',
      room: 'Room 101',
      color: '#dbeafe',
      icon: 'BookOpen',
      category: 'Core',
    };

    // Remove any previous entry at this cell so ONLY the latest selected is kept
    const remainingEntries = activeTimetable.entries.filter(
      (e) => !(e.dayId === dayId && e.slotId === slotId)
    );

    handleUpdateActiveTimetable({
      ...activeTimetable,
      entries: [...remainingEntries, newEntry],
      lastEdited: new Date().toISOString(),
    });

    setQuickEditEntry(newEntry);
  };

  // Move a row / period up or down
  const handleMoveRow = useCallback(
    (slotId: string, direction: 'up' | 'down') => {
      const slots = [...activeTimetable.timeSlots];
      const index = slots.findIndex((s) => s.id === slotId);
      if (index === -1) return;
      if (direction === 'up' && index === 0) return;
      if (direction === 'down' && index === slots.length - 1) return;

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      const temp = slots[index];
      slots[index] = slots[targetIndex];
      slots[targetIndex] = temp;

      handleUpdateActiveTimetable({
        ...activeTimetable,
        timeSlots: slots,
        lastEdited: new Date().toISOString(),
      });
    },
    [activeTimetable, handleUpdateActiveTimetable]
  );

  // Delete an entire row / period from timetable
  const handleDeleteRow = useCallback(
    (slotId: string) => {
      if (activeTimetable.timeSlots.length <= 1) return;
      const updatedTimeSlots = activeTimetable.timeSlots.filter((s) => s.id !== slotId);
      const updatedEntries = activeTimetable.entries.filter((e) => e.slotId !== slotId);
      handleUpdateActiveTimetable({
        ...activeTimetable,
        timeSlots: updatedTimeSlots,
        entries: updatedEntries,
        lastEdited: new Date().toISOString(),
      });
      setSelectedCellIds((prev) =>
        prev.filter((id) => !activeTimetable.entries.some((e) => e.id === id && e.slotId === slotId))
      );
    },
    [activeTimetable, handleUpdateActiveTimetable]
  );

  // Add a new row / period to timetable
  const handleAddRow = useCallback(() => {
    const periodCount = activeTimetable.timeSlots.filter((s) => !s.isBreak).length + 1;
    const lastSlot = activeTimetable.timeSlots[activeTimetable.timeSlots.length - 1];
    let start = '16:00';
    let end = '17:00';
    if (lastSlot) {
      start = lastSlot.end;
      const [h, m] = start.split(':').map(Number);
      const endH = ((h + 1) % 24).toString().padStart(2, '0');
      end = `${endH}:${(m || 0).toString().padStart(2, '0')}`;
    }

    const newSlot = {
      id: `slot_${Date.now()}`,
      name: `Period ${periodCount}`,
      start,
      end,
      isBreak: false,
    };

    handleUpdateActiveTimetable({
      ...activeTimetable,
      timeSlots: [...activeTimetable.timeSlots, newSlot],
      lastEdited: new Date().toISOString(),
    });
  }, [activeTimetable, handleUpdateActiveTimetable]);

  // Resolve overlaps by retaining only the latest entry per cell
  const handleResolveConflicts = useCallback(() => {
    const deduplicated = deduplicateCellEntries(activeTimetable.entries);
    handleUpdateActiveTimetable({
      ...activeTimetable,
      entries: deduplicated,
      lastEdited: new Date().toISOString(),
    });
  }, [activeTimetable, handleUpdateActiveTimetable]);

  // Dashboard Actions
  const handleDuplicateTimetable = (id: string) => {
    const target = timetables.find((t) => t.id === id);
    if (!target) return;

    const copy: Timetable = {
      ...target,
      id: `tt_${Date.now()}`,
      name: `${target.name} (Copy)`,
      lastEdited: new Date().toISOString(),
    };

    setTimetables([copy, ...timetables]);
    setActiveTimetableId(copy.id);
  };

  const handleDeleteTimetable = (id: string) => {
    if (timetables.length <= 1) return;
    const remaining = timetables.filter((t) => t.id !== id);
    setTimetables(remaining);
    if (activeTimetableId === id) {
      setActiveTimetableId(remaining[0].id);
    }
  };

  const handleRenameTimetable = (id: string, newName: string) => {
    setTimetables((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, name: newName, lastEdited: new Date().toISOString() } : t
      )
    );
  };

  const handleCreateTimetable = (newTt: Timetable) => {
    setTimetables([newTt, ...timetables]);
    setActiveTimetableId(newTt.id);
    setCurrentTab('editor');
  };

  const handleQuickDownload = async () => {
    setDownloadToast('Generating high-resolution timetable image...');
    try {
      const success = await exportTimetableToPng(activeTimetable);
      if (success) {
        setDownloadToast('✓ Timetable image downloaded successfully');
        setTimeout(() => setDownloadToast(null), 3000);
      } else {
        setDownloadToast('Opening export options...');
        setTimeout(() => {
          setDownloadToast(null);
          setIsExportModalOpen(true);
        }, 1200);
      }
    } catch {
      setDownloadToast('Opening export options...');
      setTimeout(() => {
        setDownloadToast(null);
        setIsExportModalOpen(true);
      }, 1200);
    }
  };

  const handlePrintAction = () => {
    const res = triggerTimetablePrint(() => {
      setIsPrintModalOpen(true);
    });
    if (res.sandboxed) {
      setIsPrintModalOpen(true);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0a0a0a] overflow-hidden text-[#ededed] font-sans">
      {/* 1. Header Navigation */}
      <HeaderNav
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        timetables={timetables}
        activeTimetableId={activeTimetableId}
        onSelectTimetable={setActiveTimetableId}
        onCreateClick={() => setIsCreateModalOpen(true)}
        onOpenAiModal={() => setIsAiModalOpen(true)}
        onExportClick={() => setIsExportModalOpen(true)}
        onShareClick={() => setIsShareModalOpen(true)}
        onPrintClick={handlePrintAction}
        conflicts={conflicts}
        onResolveConflicts={handleResolveConflicts}
        deviceView={deviceView}
        onChangeDeviceView={setDeviceView}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        lastSavedText={lastSavedText}
      />

      {/* 2. Main Work Area based on active tab */}
      {currentTab === 'editor' && (
        <div className="flex flex-col flex-1 overflow-hidden min-h-0">
          {/* Secondary Canvas Toolbar */}
          <CanvasToolbar
            layoutMode={layoutMode}
            onChangeLayoutMode={setLayoutMode}
            zoomLevel={zoomLevel}
            onZoomIn={() => setZoomLevel((z) => Math.min(z + 15, 150))}
            onZoomOut={() => setZoomLevel((z) => Math.max(z - 15, 50))}
            onResetZoom={() => setZoomLevel(100)}
            onSelectAll={() => setSelectedCellIds(activeTimetable.entries.map((e) => e.id))}
            onPrint={handlePrintAction}
            onQuickDownload={handleQuickDownload}
            onOpenExportModal={() => setIsExportModalOpen(true)}
            isLeftPanelCollapsed={isLeftPanelCollapsed}
            onToggleLeftPanel={() => setIsLeftPanelCollapsed((v) => !v)}
            isRightPanelCollapsed={isRightPanelCollapsed}
            onToggleRightPanel={() => setIsRightPanelCollapsed((v) => !v)}
            onOpenCopyDay={() => handleOpenCopyDayModal()}
            onSwapSelected={selectedCellIds.length === 2 ? handleSwapSelectedEntries : undefined}
          />

          {/* 3-Panel Design Studio Workspace (Responsive: Sidebars on desktop, Bottom Dock + Drawers on mobile) */}
          <div className="flex flex-1 overflow-hidden relative min-h-0 h-full">
            {/* Left Panel: Elements, Themes, Structure (Desktop) */}
            <div className="hidden lg:flex shrink-0 h-full min-h-0 transition-all duration-200">
              {!isLeftPanelCollapsed ? (
                <LeftPanel
                  timetable={activeTimetable}
                  onUpdateTimetable={handleUpdateActiveTimetable}
                  selectedCellIds={selectedCellIds}
                  onAddSubject={handleAddSubjectFromPanel}
                  onAddBreak={handleAddBreak}
                  onMoveRow={handleMoveRow}
                  onCollapse={() => setIsLeftPanelCollapsed(true)}
                  onOpenCopyDay={handleOpenCopyDayModal}
                />
              ) : (
                <div className="w-12 bg-[#121212] border-r border-[#262626] flex flex-col items-center py-3 gap-3 shrink-0 h-full select-none">
                  <button
                    onClick={() => setIsLeftPanelCollapsed(false)}
                    className="p-2 rounded-xl text-[#888888] hover:text-[#c5a059] hover:bg-[#202020] transition-colors border border-transparent hover:border-[#c5a059]/30"
                    title="Expand Left Toolbox (Elements, Themes, Structure)"
                    aria-label="Expand Left Toolbox"
                  >
                    <PanelLeftOpen className="w-4 h-4" />
                  </button>
                  <div className="w-6 h-px bg-[#262626]" />
                  <button
                    onClick={() => setIsLeftPanelCollapsed(false)}
                    className="p-2 rounded-lg text-[#888888] hover:text-[#ededed] hover:bg-[#1a1a1a] transition-colors"
                    title="Insert Subject / Break"
                    aria-label="Insert Subject / Break"
                  >
                    <Plus className="w-4 h-4 text-[#c5a059]" />
                  </button>
                  <button
                    onClick={() => setIsLeftPanelCollapsed(false)}
                    className="p-2 rounded-lg text-[#888888] hover:text-[#ededed] hover:bg-[#1a1a1a] transition-colors"
                    title="Themes & Colors"
                    aria-label="Themes & Colors"
                  >
                    <Palette className="w-4 h-4 text-[#c5a059]" />
                  </button>
                  <button
                    onClick={() => setIsLeftPanelCollapsed(false)}
                    className="p-2 rounded-lg text-[#888888] hover:text-[#ededed] hover:bg-[#1a1a1a] transition-colors"
                    title="Grid Structure"
                    aria-label="Grid Structure"
                  >
                    <Layers className="w-4 h-4 text-[#c5a059]" />
                  </button>
                </div>
              )}
            </div>

            {/* Center: Timetable Canvas (Fluid & Responsive) */}
            <div className="flex-1 min-w-0 flex flex-col h-full min-h-0 overflow-hidden">
              <TimetableCanvas
                timetable={activeTimetable}
                onUpdateTimetable={handleUpdateActiveTimetable}
                layoutMode={layoutMode}
                deviceView={deviceView}
                zoomLevel={zoomLevel}
                selectedCellIds={selectedCellIds}
                onSelectCells={setSelectedCellIds}
                conflicts={conflicts}
                onOpenQuickEdit={setQuickEditEntry}
                onAddSubjectToSlot={handleAddSubjectToSlot}
                onDeleteRow={handleDeleteRow}
                onAddRow={handleAddRow}
                onMoveRow={handleMoveRow}
                onOpenCopyDay={handleOpenCopyDayModal}
                onShowToast={showToast}
              />
            </div>

            {/* Right Panel: Properties & Styles Inspector (Desktop) */}
            <div className="hidden lg:flex shrink-0 h-full min-h-0 transition-all duration-200">
              {!isRightPanelCollapsed ? (
                <PropertiesPanel
                  timetable={activeTimetable}
                  onUpdateTimetable={handleUpdateActiveTimetable}
                  selectedCellIds={selectedCellIds}
                  onSelectCells={setSelectedCellIds}
                  onDeleteSelected={handleDeleteSelectedCells}
                  onDuplicateSelected={handleDuplicateSelectedCells}
                  onDeleteRow={handleDeleteRow}
                  onMoveRow={handleMoveRow}
                  onCollapse={() => setIsRightPanelCollapsed(true)}
                />
              ) : (
                <div className="w-12 bg-[#141414] border-l border-[#262626] flex flex-col items-center py-3 gap-3 shrink-0 h-full select-none">
                  <button
                    onClick={() => setIsRightPanelCollapsed(false)}
                    className="p-2 rounded-xl text-[#888888] hover:text-[#c5a059] hover:bg-[#202020] transition-colors border border-transparent hover:border-[#c5a059]/30"
                    title="Expand Inspector & Properties"
                    aria-label="Expand Inspector & Properties"
                  >
                    <PanelRightOpen className="w-4 h-4" />
                  </button>
                  <div className="w-6 h-px bg-[#262626]" />
                  <button
                    onClick={() => setIsRightPanelCollapsed(false)}
                    className="p-2 rounded-lg text-[#888888] hover:text-[#ededed] hover:bg-[#1a1a1a] transition-colors"
                    title="Cell & Theme Inspector"
                    aria-label="Cell & Theme Inspector"
                  >
                    <Sliders className="w-4 h-4 text-[#c5a059]" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Bottom Navigation & Action Dock (Mobile/Tablet only) */}
          <nav
            aria-label="Mobile Schedule Controls"
            className="no-print lg:hidden shrink-0 bg-[#121212] border-t border-[#262626] px-2 py-1.5 flex items-center justify-around gap-1 z-30 shadow-lg text-xs"
          >
            <button
              onClick={() => setMobileDrawer(mobileDrawer === 'left' ? 'none' : 'left')}
              className={`flex-1 py-1.5 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors min-h-[44px] ${
                mobileDrawer === 'left'
                  ? 'bg-[#222222] text-[#c5a059]'
                  : 'text-[#a3a3a3] hover:text-[#f5f5f5] active:bg-[#1a1a1a]'
              }`}
              aria-label="Open Design Elements, Themes, and Structure Drawer"
            >
              <Palette className="w-4 h-4 text-[#c5a059]" />
              <span className="text-[11px] font-medium leading-none">Elements</span>
            </button>

            <button
              onClick={() => setLayoutMode(layoutMode === 'daily' ? 'grid' : 'daily')}
              className="flex-1 py-1.5 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors min-h-[44px] text-[#a3a3a3] hover:text-[#f5f5f5] active:bg-[#1a1a1a]"
              aria-label={`Toggle view: currently ${layoutMode === 'daily' ? 'Day View' : 'Weekly Grid'}. Tap to switch`}
            >
              {layoutMode === 'daily' ? (
                <Grid className="w-4 h-4 text-[#ededed]" />
              ) : (
                <CalendarDays className="w-4 h-4 text-[#ededed]" />
              )}
              <span className="text-[11px] font-medium leading-none">
                {layoutMode === 'daily' ? 'Grid' : 'Day Flow'}
              </span>
            </button>

            <button
              onClick={() => setMobileDrawer(mobileDrawer === 'right' ? 'none' : 'right')}
              className={`flex-1 py-1.5 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors min-h-[44px] relative ${
                mobileDrawer === 'right'
                  ? 'bg-[#222222] text-[#c5a059]'
                  : 'text-[#a3a3a3] hover:text-[#f5f5f5] active:bg-[#1a1a1a]'
              }`}
              aria-label={`Inspect cell styling and properties. ${selectedCellIds.length} cells selected`}
            >
              <div className="relative">
                <SlidersHorizontal className="w-4 h-4 text-[#c5a059]" />
                {selectedCellIds.length > 0 && (
                  <span className="absolute -top-1.5 -right-3 w-4 h-4 rounded-full bg-[#c5a059] text-[#0a0a0a] text-[10px] font-bold flex items-center justify-center shadow-xs">
                    {selectedCellIds.length}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium leading-none">
                {selectedCellIds.length > 0 ? 'Edit Cell' : 'Inspect'}
              </span>
            </button>

            <button
              onClick={() => setIsAiModalOpen(true)}
              className="flex-1 py-1.5 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors min-h-[44px] text-[#a3a3a3] hover:text-[#f5f5f5] active:bg-[#1a1a1a]"
              aria-label="Open AI Timetable Assistant"
            >
              <Sparkles className="w-4 h-4 text-[#c5a059]" />
              <span className="text-[11px] font-medium leading-none">AI Assist</span>
            </button>
          </nav>

          {/* Mobile Drawer: Left Panel (Elements, Themes, Structure) */}
          {mobileDrawer === 'left' && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Timetable Elements and Themes"
              className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
              onClick={() => setMobileDrawer('none')}
            >
              <div
                className="w-full max-w-lg h-[85vh] sm:h-[650px] bg-[#141414] rounded-t-2xl sm:rounded-2xl border border-[#2e2e2e] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <LeftPanel
                  timetable={activeTimetable}
                  onUpdateTimetable={handleUpdateActiveTimetable}
                  selectedCellIds={selectedCellIds}
                  onAddSubject={handleAddSubjectFromPanel}
                  onAddBreak={handleAddBreak}
                  onMoveRow={handleMoveRow}
                  onCloseMobileDrawer={() => setMobileDrawer('none')}
                  onOpenCopyDay={(dayId) => {
                    setMobileDrawer('none');
                    handleOpenCopyDayModal(dayId);
                  }}
                />
              </div>
            </div>
          )}

          {/* Mobile Drawer: Right Panel (Properties & Styling) */}
          {mobileDrawer === 'right' && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Cell Properties and Inspector"
              className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
              onClick={() => setMobileDrawer('none')}
            >
              <div
                className="w-full max-w-lg h-[85vh] sm:h-[650px] bg-[#141414] rounded-t-2xl sm:rounded-2xl border border-[#2e2e2e] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <PropertiesPanel
                  timetable={activeTimetable}
                  onUpdateTimetable={handleUpdateActiveTimetable}
                  selectedCellIds={selectedCellIds}
                  onSelectCells={setSelectedCellIds}
                  onDeleteSelected={handleDeleteSelectedCells}
                  onDuplicateSelected={handleDuplicateSelectedCells}
                  onDeleteRow={handleDeleteRow}
                  onMoveRow={handleMoveRow}
                  onCloseMobileDrawer={() => setMobileDrawer('none')}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Dashboard View */}
      {currentTab === 'dashboard' && (
        <DashboardView
          timetables={timetables}
          onOpenTimetable={(id) => {
            setActiveTimetableId(id);
            setCurrentTab('editor');
          }}
          onDuplicateTimetable={handleDuplicateTimetable}
          onDeleteTimetable={handleDeleteTimetable}
          onRenameTimetable={handleRenameTimetable}
          onCreateNewClick={() => setIsCreateModalOpen(true)}
        />
      )}

      {/* 4. Templates Gallery View */}
      {currentTab === 'templates' && (
        <TemplatesView
          onUseTemplate={(template) => {
            handleCreateTimetable(template);
          }}
        />
      )}

      {/* 5. Modals & Drawers */}
      <CreateTimetableModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateTimetable={handleCreateTimetable}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        timetable={activeTimetable}
        onPrint={handlePrintAction}
      />

      <PrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        timetable={activeTimetable}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        timetable={activeTimetable}
      />

      <AiAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        timetable={activeTimetable}
        onUpdateTimetable={handleUpdateActiveTimetable}
      />

      <QuickEditModal
        entry={quickEditEntry}
        onClose={() => setQuickEditEntry(null)}
        onSave={(updated) => {
          const updatedEntries = activeTimetable.entries.map((e) =>
            e.id === updated.id ? updated : e
          );
          handleUpdateActiveTimetable({
            ...activeTimetable,
            entries: updatedEntries,
            lastEdited: new Date().toISOString(),
          });
        }}
        onDelete={(id) => {
          const updatedEntries = activeTimetable.entries.filter((e) => e.id !== id);
          handleUpdateActiveTimetable({
            ...activeTimetable,
            entries: updatedEntries,
            lastEdited: new Date().toISOString(),
          });
        }}
      />

      <CopyDayModal
        isOpen={isCopyDayModalOpen}
        onClose={() => setIsCopyDayModalOpen(false)}
        timetable={activeTimetable}
        initialSourceDayId={copyDaySourceId}
        onConfirmCopy={handleConfirmCopyDay}
      />

      {/* Floating Download Notification Toast */}
      {downloadToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#181818] text-[#f5f5f5] border border-[#383838] shadow-2xl px-4 py-3 rounded-xl flex items-center gap-3 text-xs font-medium animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="w-2 h-2 rounded-full bg-[#c5a059] animate-pulse" />
          <span>{downloadToast}</span>
        </div>
      )}

      {/* Dedicated Standalone Export Rendering Staging Area (hidden from view, full-fidelity layout for PNG/PDF) */}
      <div
        id="export-staging-area"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: -99999,
          pointerEvents: 'none',
          opacity: 1,
          overflow: 'visible',
        }}
        className="no-print"
        aria-hidden="true"
      >
        <ExportTimetableTarget timetable={activeTimetable} />
      </div>
    </div>
  );
}
