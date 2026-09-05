import React, { useState } from 'react';
import {
  Calendar,
  Sparkles,
  Download,
  Share2,
  Undo2,
  Redo2,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Monitor,
  Tablet,
  Smartphone,
  FolderOpen,
  LayoutGrid,
  ChevronDown,
  Printer,
  MoreHorizontal,
  X,
} from 'lucide-react';
import { Timetable, ConflictIssue, DeviceView } from '../types';

interface HeaderNavProps {
  currentTab: 'editor' | 'dashboard' | 'templates';
  onTabChange: (tab: 'editor' | 'dashboard' | 'templates') => void;
  timetables: Timetable[];
  activeTimetableId: string;
  onSelectTimetable: (id: string) => void;
  onCreateClick: () => void;
  onOpenAiModal: () => void;
  onExportClick: () => void;
  onShareClick: () => void;
  onPrintClick: () => void;
  conflicts: ConflictIssue[];
  onResolveConflicts?: () => void;
  deviceView: DeviceView;
  onChangeDeviceView: (view: DeviceView) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  lastSavedText: string;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentTab,
  onTabChange,
  timetables,
  activeTimetableId,
  onSelectTimetable,
  onCreateClick,
  onOpenAiModal,
  onExportClick,
  onShareClick,
  onPrintClick,
  conflicts,
  onResolveConflicts,
  deviceView,
  onChangeDeviceView,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  lastSavedText,
}) => {
  const [showTimetableMenu, setShowTimetableMenu] = useState(false);
  const [showConflictMenu, setShowConflictMenu] = useState(false);
  const [showMobileMoreMenu, setShowMobileMoreMenu] = useState(false);

  const activeTimetable = timetables.find((t) => t.id === activeTimetableId);

  return (
    <header className="no-print sticky top-0 z-40 bg-[#121212] border-b border-[#262626] px-2.5 sm:px-4 py-2 flex items-center justify-between gap-2 shadow-xs select-none text-[#ededed]">
      {/* Left: Brand + App Mode Switcher */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Brand */}
        <div
          onClick={() => onTabChange('editor')}
          className="flex items-center gap-2 cursor-pointer group"
          id="brand-logo"
          role="button"
          tabIndex={0}
          aria-label="Timetable Studio Home"
          onKeyDown={(e) => {
            if (e.key === 'Enter') onTabChange('editor');
          }}
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-[#2a2416] to-[#141414] border border-[#c5a059]/40 flex items-center justify-center text-[#c5a059] shadow-xs group-hover:scale-105 transition-transform shrink-0">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-playfair font-bold text-[#f5f5f5] text-base sm:text-lg tracking-tight">
                Timetable<span className="text-[#c5a059]">Studio</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase tracking-wider font-semibold bg-[#c5a059]/10 text-[#e0bf79] border border-[#c5a059]/30 px-1.5 py-0.5 rounded-full">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-[#888888] font-medium leading-none hidden lg:block">
              Builder & Generator
            </p>
          </div>
        </div>

        {/* Separator */}
        <div className="h-6 w-px bg-[#262626] hidden lg:block" />

        {/* Active Timetable Quick Switcher */}
        {activeTimetable && (
          <div className="relative hidden lg:block">
            <button
              onClick={() => setShowTimetableMenu(!showTimetableMenu)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-[#2a2a2a] hover:border-[#c5a059]/40 bg-[#171717] hover:bg-[#1f1f1f] text-[#ededed] text-xs font-medium transition-colors max-w-[200px]"
              id="active-timetable-switcher"
              aria-label={`Current timetable: ${activeTimetable.name}. Tap to switch`}
            >
              <span className="truncate">{activeTimetable.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#888888] shrink-0" />
            </button>

            {showTimetableMenu && (
              <div
                className="absolute left-0 mt-1 w-64 bg-[#141414] rounded-xl shadow-2xl border border-[#2a2a2a] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                onMouseLeave={() => setShowTimetableMenu(false)}
              >
                <div className="px-3 py-1.5 text-[11px] font-semibold uppercase text-[#737373]">
                  Switch Timetable
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {timetables.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        onSelectTimetable(t.id);
                        setShowTimetableMenu(false);
                        onTabChange('editor');
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#1f1f1f] transition-colors ${
                        t.id === activeTimetableId ? 'bg-[#c5a059]/15 text-[#e0bf79] font-semibold' : 'text-[#d4d4d4]'
                      }`}
                    >
                      <span className="truncate">{t.name}</span>
                      <span className="text-[10px] text-[#737373] ml-2 capitalize shrink-0">{t.type}</span>
                    </button>
                  ))}
                </div>
                <div className="border-t border-[#262626] mt-1 pt-1 px-2">
                  <button
                    onClick={() => {
                      setShowTimetableMenu(false);
                      onCreateClick();
                    }}
                    className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs text-[#c5a059] hover:bg-[#c5a059]/10 rounded-md font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Timetable...
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* View Mode Switcher Pills */}
        <nav
          aria-label="Main navigation views"
          className="flex items-center bg-[#171717] border border-[#262626] p-0.5 sm:p-1 rounded-xl gap-0.5"
        >
          <button
            onClick={() => onTabChange('editor')}
            className={`min-h-[36px] px-2 sm:px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              currentTab === 'editor'
                ? 'bg-[#242424] text-[#f5f5f5] border border-[#383838] shadow-xs'
                : 'text-[#888888] hover:text-[#f5f5f5] hover:bg-[#202020]'
            }`}
            id="tab-editor-btn"
            aria-label="Timetable Editor"
          >
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Editor</span>
          </button>
          <button
            onClick={() => onTabChange('dashboard')}
            className={`min-h-[36px] px-2 sm:px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              currentTab === 'dashboard'
                ? 'bg-[#242424] text-[#f5f5f5] border border-[#383838] shadow-xs'
                : 'text-[#888888] hover:text-[#f5f5f5] hover:bg-[#202020]'
            }`}
            id="tab-dashboard-btn"
            aria-label={`My Timetables (${timetables.length})`}
          >
            <FolderOpen className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">My Plans</span>
            <span className="px-1.5 py-0.2 rounded-full bg-[#2a2a2a] text-[#c5a059] text-[10px] font-mono">
              {timetables.length}
            </span>
          </button>
          <button
            onClick={() => onTabChange('templates')}
            className={`min-h-[36px] px-2 sm:px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              currentTab === 'templates'
                ? 'bg-[#242424] text-[#f5f5f5] border border-[#383838] shadow-xs'
                : 'text-[#888888] hover:text-[#f5f5f5] hover:bg-[#202020]'
            }`}
            id="tab-templates-btn"
            aria-label="Browse Templates"
          >
            <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Templates</span>
          </button>
        </nav>
      </div>

      {/* Middle: Undo/Redo & Save status (only in editor mode) */}
      {currentTab === 'editor' && (
        <div className="hidden xl:flex items-center gap-3">
          <div className="flex items-center gap-1 bg-[#171717] p-1 rounded-lg border border-[#262626]">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
              className="p-1.5 rounded text-[#a3a3a3] hover:bg-[#242424] hover:text-[#f5f5f5] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              id="undo-btn"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo (Ctrl+Shift+Z)"
              className="p-1.5 rounded text-[#a3a3a3] hover:bg-[#242424] hover:text-[#f5f5f5] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              id="redo-btn"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <span className="text-[11px] text-[#737373] select-none">{lastSavedText}</span>

          {/* Conflict Detector Dropdown Badge */}
          <div className="relative">
            <button
              onClick={() => setShowConflictMenu(!showConflictMenu)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                conflicts.length > 0
                  ? 'bg-amber-950/40 text-amber-300 border-amber-800/60 hover:bg-amber-950/60'
                  : 'bg-emerald-950/30 text-emerald-400 border-emerald-800/40 hover:bg-emerald-950/50'
              }`}
              id="conflicts-badge"
            >
              {conflicts.length > 0 ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>{conflicts.length} Conflict{conflicts.length > 1 ? 's' : ''}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>No Conflicts</span>
                </>
              )}
            </button>

            {showConflictMenu && (
              <div
                className="absolute left-0 mt-1.5 w-80 bg-[#141414] rounded-xl shadow-2xl border border-[#2a2a2a] p-3 z-50 animate-in fade-in zoom-in-95 duration-100"
                onMouseLeave={() => setShowConflictMenu(false)}
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
                  <span className="text-xs font-bold text-[#f5f5f5] flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Conflict Inspector
                  </span>
                  <span className="text-[10px] text-[#737373]">Real-time check</span>
                </div>

                <div className="mt-2 max-h-60 overflow-y-auto space-y-2">
                  {conflicts.length === 0 ? (
                    <div className="text-center py-4 text-xs text-[#a3a3a3]">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1.5" />
                      All classes, instructors, and rooms are free of overlapping conflicts!
                    </div>
                  ) : (
                    <>
                      {conflicts.map((c) => (
                        <div
                          key={c.id}
                          className="p-2 rounded-lg bg-amber-950/30 border border-amber-800/40 text-xs text-amber-200 flex items-start gap-2"
                        >
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-semibold capitalize text-amber-100">
                              {c.type === 'overlap' ? 'Time Overlap' : c.type === 'teacher' ? 'Instructor Double-booked' : 'Room Conflict'}
                            </div>
                            <p className="text-[11px] text-amber-300 leading-snug mt-0.5">{c.message}</p>
                          </div>
                        </div>
                      ))}

                      {onResolveConflicts && conflicts.some((c) => c.type === 'overlap') && (
                        <button
                          onClick={() => {
                            onResolveConflicts();
                            setShowConflictMenu(false);
                          }}
                          className="w-full mt-2 py-1.5 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-[#0a0a0a] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Auto-Resolve Overlaps (Keep Latest)
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Device View Switcher (Desktop only) */}
        {currentTab === 'editor' && (
          <div className="hidden lg:flex items-center bg-[#171717] p-1 rounded-lg gap-0.5 border border-[#262626]">
            <button
              onClick={() => onChangeDeviceView('desktop')}
              title="Desktop View"
              aria-label="Switch preview to Desktop view"
              className={`p-1.5 rounded transition-all ${
                deviceView === 'desktop' ? 'bg-[#262626] text-[#c5a059] shadow-xs' : 'text-[#737373] hover:text-[#ededed]'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onChangeDeviceView('tablet')}
              title="Tablet View"
              aria-label="Switch preview to Tablet view"
              className={`p-1.5 rounded transition-all ${
                deviceView === 'tablet' ? 'bg-[#262626] text-[#c5a059] shadow-xs' : 'text-[#737373] hover:text-[#ededed]'
              }`}
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onChangeDeviceView('mobile')}
              title="Mobile View"
              aria-label="Switch preview to Mobile view"
              className={`p-1.5 rounded transition-all ${
                deviceView === 'mobile' ? 'bg-[#262626] text-[#c5a059] shadow-xs' : 'text-[#737373] hover:text-[#ededed]'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* AI Assistant Button */}
        <button
          onClick={onOpenAiModal}
          className="min-h-[38px] flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#8a6e34] to-[#c5a059] hover:from-[#9c7d3d] hover:to-[#d4af37] text-[#0a0a0a] text-xs font-semibold shadow-xs hover:shadow transition-all"
          id="btn-ai-assistant"
          title="AI Timetable Generator & Assistant"
          aria-label="Open AI Timetable Assistant"
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">AI Assistant</span>
        </button>

        {/* Create Timetable Button */}
        <button
          onClick={onCreateClick}
          className="min-h-[38px] flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#c5a059] hover:bg-[#d4af37] text-[#0a0a0a] text-xs font-semibold shadow-xs hover:shadow transition-all"
          id="btn-create-timetable"
          aria-label="Create New Timetable"
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">Create</span>
        </button>

        {/* Print / Export / Share (Visible on md and larger) */}
        {currentTab === 'editor' && (
          <div className="hidden md:flex items-center gap-1.5">
            <button
              onClick={onPrintClick}
              title="Direct Print"
              aria-label="Print timetable"
              className="p-2 rounded-lg border border-[#2a2a2a] text-[#ededed] bg-[#171717] hover:bg-[#222222] hover:border-[#c5a059]/40 transition-colors min-h-[38px] flex items-center justify-center"
              id="btn-print"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onExportClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2a2a2a] bg-[#171717] hover:bg-[#222222] text-[#ededed] hover:border-[#c5a059]/40 text-xs font-medium transition-colors min-h-[38px]"
              id="btn-export"
              aria-label="Export timetable as PNG or PDF"
            >
              <Download className="w-3.5 h-3.5 text-[#c5a059]" />
              <span className="hidden lg:inline">Export</span>
            </button>

            <button
              onClick={onShareClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2a2a2a] bg-[#171717] hover:bg-[#222222] text-[#ededed] hover:border-[#c5a059]/40 text-xs font-medium transition-colors min-h-[38px]"
              id="btn-share"
              aria-label="Share timetable link"
            >
              <Share2 className="w-3.5 h-3.5 text-[#c5a059]" />
              <span className="hidden lg:inline">Share</span>
            </button>
          </div>
        )}

        {/* Mobile Overflow Menu Trigger */}
        <div className="relative md:hidden">
          <button
            onClick={() => setShowMobileMoreMenu(!showMobileMoreMenu)}
            className="min-h-[38px] min-w-[38px] p-2 rounded-lg border border-[#2a2a2a] bg-[#171717] text-[#ededed] hover:border-[#c5a059]/40 flex items-center justify-center transition-colors"
            aria-label="More options and actions"
          >
            <MoreHorizontal className="w-4 h-4 text-[#c5a059]" />
          </button>

          {showMobileMoreMenu && (
            <div
              className="absolute right-0 mt-2 w-64 bg-[#141414] rounded-2xl shadow-2xl border border-[#2e2e2e] p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100"
              role="menu"
              aria-label="Mobile actions menu"
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#262626] px-1">
                <span className="text-xs font-serif font-bold text-[#f5f5f5]">Schedule Tools</span>
                <button
                  onClick={() => setShowMobileMoreMenu(false)}
                  className="p-1 text-[#888888] hover:text-[#ededed]"
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {currentTab === 'editor' && (
                <div className="space-y-1">
                  {/* Mobile Undo / Redo */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#1a1a1a] border border-[#262626] mb-2">
                    <span className="text-xs text-[#a3a3a3]">History</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          onUndo();
                          setShowMobileMoreMenu(false);
                        }}
                        disabled={!canUndo}
                        className="px-2.5 py-1 text-xs rounded bg-[#262626] text-[#ededed] disabled:opacity-30 flex items-center gap-1 min-h-[32px]"
                        aria-label="Undo last change"
                      >
                        <Undo2 className="w-3.5 h-3.5" /> Undo
                      </button>
                      <button
                        onClick={() => {
                          onRedo();
                          setShowMobileMoreMenu(false);
                        }}
                        disabled={!canRedo}
                        className="px-2.5 py-1 text-xs rounded bg-[#262626] text-[#ededed] disabled:opacity-30 flex items-center gap-1 min-h-[32px]"
                        aria-label="Redo change"
                      >
                        <Redo2 className="w-3.5 h-3.5" /> Redo
                      </button>
                    </div>
                  </div>

                  {/* Conflict Inspector Row */}
                  <div
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border transition-colors mb-1 ${
                      conflicts.length > 0
                        ? 'bg-amber-950/40 text-amber-300 border-amber-800/50'
                        : 'bg-emerald-950/30 text-emerald-400 border-emerald-800/40'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Conflicts
                    </span>
                    <span>{conflicts.length} issue{conflicts.length === 1 ? '' : 's'}</span>
                  </div>

                  {/* Export */}
                  <button
                    onClick={() => {
                      onExportClick();
                      setShowMobileMoreMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-[#ededed] hover:bg-[#202020] rounded-xl transition-colors min-h-[40px]"
                  >
                    <Download className="w-4 h-4 text-[#c5a059]" />
                    <span>Export Schedule (PNG / PDF)</span>
                  </button>

                  {/* Share */}
                  <button
                    onClick={() => {
                      onShareClick();
                      setShowMobileMoreMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-[#ededed] hover:bg-[#202020] rounded-xl transition-colors min-h-[40px]"
                  >
                    <Share2 className="w-4 h-4 text-[#c5a059]" />
                    <span>Share Timetable Link</span>
                  </button>

                  {/* Print */}
                  <button
                    onClick={() => {
                      onPrintClick();
                      setShowMobileMoreMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-[#ededed] hover:bg-[#202020] rounded-xl transition-colors min-h-[40px]"
                  >
                    <Printer className="w-4 h-4 text-[#c5a059]" />
                    <span>Print Timetable</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
