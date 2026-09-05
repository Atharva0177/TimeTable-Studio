import React from 'react';
import {
  Grid,
  CalendarDays,
  ListOrdered,
  Calendar,
  ZoomIn,
  ZoomOut,
  CheckSquare,
  Printer,
  Download,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import { LayoutMode } from '../types';

interface CanvasToolbarProps {
  layoutMode: LayoutMode;
  onChangeLayoutMode: (mode: LayoutMode) => void;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onSelectAll: () => void;
  onPrint: () => void;
  onQuickDownload?: () => void;
  onOpenExportModal?: () => void;
  isLeftPanelCollapsed?: boolean;
  onToggleLeftPanel?: () => void;
  isRightPanelCollapsed?: boolean;
  onToggleRightPanel?: () => void;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  layoutMode,
  onChangeLayoutMode,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onSelectAll,
  onPrint,
  onQuickDownload,
  onOpenExportModal,
  isLeftPanelCollapsed = false,
  onToggleLeftPanel,
  isRightPanelCollapsed = false,
  onToggleRightPanel,
}) => {
  return (
    <div
      role="toolbar"
      aria-label="Canvas formatting and view options"
      className="no-print bg-[#121212] border-b border-[#262626] px-3 sm:px-4 py-2 flex items-center justify-between gap-2 sm:gap-3 text-xs select-none shadow-xs text-[#ededed] overflow-x-auto"
    >
      {/* Left: Sidebar Toggle & Layout Switcher */}
      <div className="flex items-center gap-1.5 shrink-0">
        {onToggleLeftPanel && (
          <button
            onClick={onToggleLeftPanel}
            className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all min-h-[32px] ${
              isLeftPanelCollapsed
                ? 'bg-[#1e1e1e] text-[#c5a059] border-[#c5a059]/40 hover:bg-[#252525]'
                : 'bg-[#171717] text-[#888888] border-[#2a2a2a] hover:text-[#f5f5f5] hover:bg-[#202020]'
            }`}
            title={isLeftPanelCollapsed ? 'Expand Left Toolbox' : 'Collapse Left Toolbox'}
            aria-label={isLeftPanelCollapsed ? 'Expand Left Toolbox' : 'Collapse Left Toolbox'}
            id="btn-toggle-left-panel"
          >
            {isLeftPanelCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-[#c5a059]" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
            <span className="text-[11px] font-medium hidden xl:inline">
              {isLeftPanelCollapsed ? 'Show Tools' : 'Hide Tools'}
            </span>
          </button>
        )}

        <div className="flex items-center gap-1 bg-[#171717] border border-[#262626] p-1 rounded-xl">
          <button
            onClick={() => onChangeLayoutMode('grid')}
            className={`min-h-[36px] sm:min-h-[32px] px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              layoutMode === 'grid'
                ? 'bg-[#242424] text-[#c5a059] border border-[#383838] shadow-xs'
                : 'text-[#888888] hover:text-[#f5f5f5]'
            }`}
            title="Weekly Grid (Standard)"
            aria-label="Switch to Weekly Grid layout"
            id="btn-layout-grid"
          >
            <Grid className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Weekly Grid</span>
            <span className="sm:hidden text-[11px]">Grid</span>
          </button>

          <button
            onClick={() => onChangeLayoutMode('daily')}
            className={`min-h-[36px] sm:min-h-[32px] px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              layoutMode === 'daily'
                ? 'bg-[#242424] text-[#c5a059] border border-[#383838] shadow-xs'
                : 'text-[#888888] hover:text-[#f5f5f5]'
            }`}
            title="Daily Chronological Flow"
            aria-label="Switch to Daily Chronological Flow layout"
            id="btn-layout-daily"
          >
            <CalendarDays className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Day View</span>
            <span className="sm:hidden text-[11px]">Day</span>
          </button>

          <button
            onClick={() => onChangeLayoutMode('vertical')}
            className={`min-h-[36px] sm:min-h-[32px] px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              layoutMode === 'vertical'
                ? 'bg-[#242424] text-[#c5a059] border border-[#383838] shadow-xs'
                : 'text-[#888888] hover:text-[#f5f5f5]'
            }`}
            title="Vertical Day Cards"
            aria-label="Switch to Vertical Day Cards layout"
            id="btn-layout-vertical"
          >
            <ListOrdered className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden md:inline">Vertical</span>
          </button>

          <button
            onClick={() => onChangeLayoutMode('calendar')}
            className={`min-h-[36px] sm:min-h-[32px] px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              layoutMode === 'calendar'
                ? 'bg-[#242424] text-[#c5a059] border border-[#383838] shadow-xs'
                : 'text-[#888888] hover:text-[#f5f5f5]'
            }`}
            title="Calendar Month Layout"
            aria-label="Switch to Calendar layout"
            id="btn-layout-calendar"
          >
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden md:inline">Calendar</span>
          </button>
        </div>
      </div>

      {/* Middle & Right: Actions, Zoom & Inspector Toggle */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Select All */}
        <button
          onClick={onSelectAll}
          className="hidden md:flex items-center gap-1 px-2.5 py-1.5 text-[#a3a3a3] hover:text-[#f5f5f5] font-medium hover:bg-[#1a1a1a] rounded-lg transition-colors min-h-[32px]"
          title="Select all cells (Ctrl+A)"
          aria-label="Select all timetable cells"
        >
          <CheckSquare className="w-3.5 h-3.5 text-[#c5a059]" />
          <span>Select All</span>
        </button>

        <div className="h-4 w-px bg-[#262626] hidden md:block" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-0.5 sm:gap-1 bg-[#171717] border border-[#262626] p-0.5 rounded-lg">
          <button
            onClick={onZoomOut}
            className="p-1.5 text-[#a3a3a3] hover:text-[#f5f5f5] hover:bg-[#242424] rounded transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
            title="Zoom Out"
            aria-label="Zoom out timetable"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onResetZoom}
            className="px-1.5 text-[11px] font-mono font-medium text-[#ededed] hover:text-[#c5a059] transition-colors min-h-[32px] flex items-center justify-center"
            title="Reset to 100%"
            aria-label={`Current zoom ${zoomLevel}%. Tap to reset to 100%`}
          >
            {zoomLevel}%
          </button>
          <button
            onClick={onZoomIn}
            className="p-1.5 text-[#a3a3a3] hover:text-[#f5f5f5] hover:bg-[#242424] rounded transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
            title="Zoom In"
            aria-label="Zoom in timetable"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-4 w-px bg-[#262626]" />

        {/* Download Button */}
        <button
          onClick={onQuickDownload || onOpenExportModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1a1a1a] hover:bg-[#222222] text-[#ededed] hover:text-[#c5a059] rounded-lg border border-[#2d2d2d] hover:border-[#c5a059]/50 transition-all min-h-[32px]"
          title="Download Timetable Image (PNG)"
          aria-label="Download timetable image"
          id="btn-quick-download"
        >
          <Download className="w-3.5 h-3.5 text-[#c5a059]" />
          <span className="font-semibold text-xs hidden sm:inline">Download</span>
        </button>

        {/* Print Button */}
        <button
          onClick={onPrint}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1a1a1a] hover:bg-[#222222] text-[#ededed] hover:text-[#c5a059] rounded-lg border border-[#2d2d2d] hover:border-[#c5a059]/50 transition-all min-h-[32px]"
          title="Print Timetable (Ctrl+P)"
          aria-label="Print timetable"
          id="btn-toolbar-print"
        >
          <Printer className="w-3.5 h-3.5 text-[#c5a059]" />
          <span className="font-semibold text-xs hidden sm:inline">Print</span>
        </button>

        {/* Right Inspector Toggle */}
        {onToggleRightPanel && (
          <button
            onClick={onToggleRightPanel}
            className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all min-h-[32px] ${
              isRightPanelCollapsed
                ? 'bg-[#1e1e1e] text-[#c5a059] border-[#c5a059]/40 hover:bg-[#252525]'
                : 'bg-[#171717] text-[#888888] border-[#2a2a2a] hover:text-[#f5f5f5] hover:bg-[#202020]'
            }`}
            title={isRightPanelCollapsed ? 'Expand Inspector' : 'Collapse Inspector'}
            aria-label={isRightPanelCollapsed ? 'Expand Inspector' : 'Collapse Inspector'}
            id="btn-toggle-right-panel"
          >
            <span className="text-[11px] font-medium hidden xl:inline">
              {isRightPanelCollapsed ? 'Show Inspector' : 'Hide Inspector'}
            </span>
            {isRightPanelCollapsed ? (
              <PanelRightOpen className="w-4 h-4 text-[#c5a059]" />
            ) : (
              <PanelRightClose className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};
