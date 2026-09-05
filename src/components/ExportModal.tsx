import React, { useState } from 'react';
import {
  X,
  Download,
  FileText,
  Image as ImageIcon,
  Table,
  Printer,
  FileCode,
  Check,
  Sparkles,
} from 'lucide-react';
import { Timetable } from '../types';
import {
  exportTimetableToPng,
  exportTimetableToPdf,
  exportTimetableToCsv,
  exportTimetableToJson,
  downloadPrintableHtml,
  isSandboxedIframe,
} from '../utils/exportHelper';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  timetable: Timetable;
  onPrint: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  timetable,
  onPrint,
}) => {
  if (!isOpen) return null;

  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'png' | 'csv' | 'json'>('pdf');
  const [pageSize, setPageSize] = useState<'a4' | 'a3' | 'letter'>('a4');
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // PDF Export handler
  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      const success = await exportTimetableToPdf(timetable, pageSize, orientation);
      if (success) {
        setExportSuccess(true);
        setTimeout(() => {
          setExportSuccess(false);
          onClose();
        }, 1200);
      }
    } catch (err) {
      console.error('Export PDF failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // PNG Export handler
  const handleExportPng = async () => {
    setIsExporting(true);
    try {
      const success = await exportTimetableToPng(timetable);
      if (success) {
        setExportSuccess(true);
        setTimeout(() => {
          setExportSuccess(false);
          onClose();
        }, 1200);
      }
    } catch (err) {
      console.error('Export PNG failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // CSV Export handler
  const handleExportCsv = () => {
    exportTimetableToCsv(timetable);
  };

  // JSON Export handler
  const handleExportJson = () => {
    exportTimetableToJson(timetable);
  };

  const handleRunExport = () => {
    if (selectedFormat === 'pdf') {
      handleExportPdf();
    } else if (selectedFormat === 'png') {
      handleExportPng();
    } else if (selectedFormat === 'csv') {
      handleExportCsv();
      onClose();
    } else if (selectedFormat === 'json') {
      handleExportJson();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#141414] rounded-2xl shadow-2xl border border-[#2a2a2a] w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-[#ededed]">
        <div className="p-4 sm:p-5 border-b border-[#262626] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#c5a059]/15 text-[#c5a059] flex items-center justify-center font-bold">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-[#f5f5f5] tracking-wide">Export Timetable</h2>
              <p className="text-xs text-[#a3a3a3]">Download or print your styled timetable document</p>
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
          {/* Format Selection Grid */}
          <div>
            <label className="text-xs font-bold text-[#ededed] uppercase tracking-wider block mb-2">
              Export Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedFormat('pdf')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  selectedFormat === 'pdf'
                    ? 'border-[#c5a059] bg-[#c5a059]/10 ring-2 ring-[#c5a059]/30 text-[#f5f5f5]'
                    : 'border-[#262626] hover:border-[#383838] bg-[#181818] text-[#a3a3a3]'
                }`}
              >
                <Printer className="w-4 h-4 text-[#c5a059] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs text-[#ededed]">PDF / Print Mode</div>
                  <div className="text-[11px] text-[#737373]">Direct print or Save-as-PDF</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedFormat('png')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  selectedFormat === 'png'
                    ? 'border-[#c5a059] bg-[#c5a059]/10 ring-2 ring-[#c5a059]/30 text-[#f5f5f5]'
                    : 'border-[#262626] hover:border-[#383838] bg-[#181818] text-[#a3a3a3]'
                }`}
              >
                <ImageIcon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs text-[#ededed]">PNG Image (High-Res)</div>
                  <div className="text-[11px] text-[#737373]">2x crisp resolution graphic</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedFormat('csv')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  selectedFormat === 'csv'
                    ? 'border-[#c5a059] bg-[#c5a059]/10 ring-2 ring-[#c5a059]/30 text-[#f5f5f5]'
                    : 'border-[#262626] hover:border-[#383838] bg-[#181818] text-[#a3a3a3]'
                }`}
              >
                <Table className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs text-[#ededed]">CSV Spreadsheet</div>
                  <div className="text-[11px] text-[#737373]">Excel / Google Sheets data</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedFormat('json')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  selectedFormat === 'json'
                    ? 'border-[#c5a059] bg-[#c5a059]/10 ring-2 ring-[#c5a059]/30 text-[#f5f5f5]'
                    : 'border-[#262626] hover:border-[#383838] bg-[#181818] text-[#a3a3a3]'
                }`}
              >
                <FileCode className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs text-[#ededed]">JSON Project File</div>
                  <div className="text-[11px] text-[#737373]">Full backup & importable</div>
                </div>
              </button>
            </div>
          </div>

          {/* PDF / Print Settings */}
          {selectedFormat === 'pdf' && (
            <div className="p-3.5 bg-[#181818] rounded-xl border border-[#262626] space-y-3">
              <span className="text-xs font-bold text-[#ededed]">Page Configuration</span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-[#a3a3a3] block mb-1">Paper Size</label>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(e.target.value as any)}
                    className="w-full text-xs px-2.5 py-1.5 bg-[#1f1f1f] border border-[#2e2e2e] text-[#ededed] rounded-lg focus:outline-hidden focus:border-[#c5a059]"
                  >
                    <option value="a4">A4 (Standard)</option>
                    <option value="a3">A3 (Poster)</option>
                    <option value="letter">US Letter</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-[#a3a3a3] block mb-1">Orientation</label>
                  <select
                    value={orientation}
                    onChange={(e) => setOrientation(e.target.value as any)}
                    className="w-full text-xs px-2.5 py-1.5 bg-[#1f1f1f] border border-[#2e2e2e] text-[#ededed] rounded-lg focus:outline-hidden focus:border-[#c5a059]"
                  >
                    <option value="landscape">Landscape (Recommended)</option>
                    <option value="portrait">Portrait</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {exportSuccess && (
            <div className="p-3 bg-emerald-950/30 text-emerald-300 rounded-xl border border-emerald-800/40 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Timetable successfully exported!</span>
            </div>
          )}

          <div className="pt-2 flex flex-wrap justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-[#2e2e2e] rounded-lg text-xs font-semibold text-[#a3a3a3] hover:text-[#ededed] hover:bg-[#1e1e1e]"
            >
              Cancel
            </button>

            {selectedFormat === 'pdf' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setTimeout(() => onPrint(), 100);
                }}
                className="px-3.5 py-2 border border-[#383838] rounded-lg text-xs font-semibold text-[#c5a059] hover:bg-[#c5a059]/10 flex items-center gap-1.5 transition-colors"
                title="Open the browser's native print modal"
              >
                <Printer className="w-3.5 h-3.5" />
                Browser Print
              </button>
            )}

            <button
              onClick={handleRunExport}
              disabled={isExporting}
              className="px-5 py-2 bg-[#c5a059] hover:bg-[#d4af37] disabled:opacity-50 text-[#0a0a0a] rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 font-medium transition-colors"
            >
              {isExporting ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  Generating Export...
                </>
              ) : selectedFormat === 'pdf' ? (
                <>
                  <Download className="w-3.5 h-3.5" />
                  Download PDF Document
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  Download {selectedFormat.toUpperCase()}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
