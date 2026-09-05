import React, { useState } from 'react';
import {
  X,
  Printer,
  ExternalLink,
  Download,
  FileCode,
  Check,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Timetable } from '../types';
import {
  exportTimetableToPng,
  exportTimetableToPdf,
  downloadPrintableHtml,
} from '../utils/exportHelper';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  timetable: Timetable;
}

export const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  onClose,
  timetable,
}) => {
  if (!isOpen) return null;

  const [isExportingPng, setIsExportingPng] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Construct URL for printing in new tab
  const getPrintUrl = () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('print', 'true');
      return url.toString();
    } catch {
      return `${window.location.href}?print=true`;
    }
  };

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    try {
      const success = await exportTimetableToPdf(timetable, 'a4', 'landscape');
      if (success) {
        setSuccessMessage('✓ Complete PDF document downloaded');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadPng = async () => {
    setIsExportingPng(true);
    try {
      const success = await exportTimetableToPng(timetable);
      if (success) {
        setSuccessMessage('✓ Complete high-resolution image downloaded');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      console.error('PNG export error:', err);
    } finally {
      setIsExportingPng(false);
    }
  };

  const handleDownloadHtml = () => {
    downloadPrintableHtml(timetable);
    setSuccessMessage('✓ Standalone printable file downloaded');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#141414] rounded-2xl shadow-2xl border border-[#2a2a2a] w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-[#ededed]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#262626] flex items-center justify-between bg-[#161616]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#c5a059]/15 text-[#c5a059] flex items-center justify-center font-bold">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-[#f5f5f5] tracking-wide">
                Print Timetable
              </h2>
              <p className="text-xs text-[#a3a3a3]">
                {timetable.name || 'Timetable Schedule'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#737373] hover:text-[#ededed] rounded-lg hover:bg-[#202020] transition-colors"
            title="Close"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Iframe Notice */}
          <div className="p-3.5 bg-amber-950/20 border border-amber-800/40 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-[#d4d4d4] leading-relaxed">
              <span className="font-bold text-amber-300">Live Preview Sandbox Notice:</span>{' '}
              Browsers restrict popup modal print dialogs inside live preview iframes. Choose one of the instant printing options below:
            </div>
          </div>

          {/* Options List */}
          <div className="space-y-2.5">
            {/* 1. Open in new tab */}
            <a
              href={getPrintUrl()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onClose()}
              className="group p-3.5 bg-[#1a1a1a] hover:bg-[#202020] border border-[#2e2e2e] hover:border-[#c5a059]/60 rounded-xl flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#c5a059]/10 text-[#c5a059] flex items-center justify-center shrink-0">
                  <ExternalLink className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-[#ededed] group-hover:text-[#c5a059] transition-colors flex items-center gap-1.5">
                    Open in New Tab to Print
                    <span className="text-[10px] px-1.5 py-0.2 bg-[#c5a059]/20 text-[#c5a059] rounded font-mono font-medium">
                      Recommended
                    </span>
                  </div>
                  <div className="text-[11px] text-[#888888]">
                    Opens fullscreen in a real browser tab and automatically invokes print
                  </div>
                </div>
              </div>
              <Printer className="w-4 h-4 text-[#737373] group-hover:text-[#c5a059] shrink-0" />
            </a>

            {/* 2. Direct PDF Document Download */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="w-full text-left group p-3.5 bg-[#1a1a1a] hover:bg-[#202020] border border-[#2e2e2e] hover:border-[#c5a059]/60 rounded-xl flex items-center justify-between transition-all disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-[#ededed] group-hover:text-[#c5a059] transition-colors">
                    Download Complete PDF Document (.pdf)
                  </div>
                  <div className="text-[11px] text-[#888888]">
                    Ready-to-print vector PDF with full unclipped table & margins
                  </div>
                </div>
              </div>
              {isExportingPdf ? (
                <Sparkles className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
              ) : (
                <Download className="w-4 h-4 text-[#737373] group-hover:text-amber-400 shrink-0" />
              )}
            </button>

            {/* 3. Download Standalone HTML */}
            <button
              type="button"
              onClick={handleDownloadHtml}
              className="w-full text-left group p-3.5 bg-[#1a1a1a] hover:bg-[#202020] border border-[#2e2e2e] hover:border-[#383838] rounded-xl flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                  <FileCode className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-[#ededed] group-hover:text-blue-400 transition-colors">
                    Download Standalone Printable Web Document
                  </div>
                  <div className="text-[11px] text-[#888888]">
                    Self-contained HTML file formatted for landscape paper printing
                  </div>
                </div>
              </div>
              <Download className="w-4 h-4 text-[#737373] group-hover:text-blue-400 shrink-0" />
            </button>

            {/* 4. Download High-Res PNG */}
            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={isExportingPng}
              className="w-full text-left group p-3.5 bg-[#1a1a1a] hover:bg-[#202020] border border-[#2e2e2e] hover:border-[#383838] rounded-xl flex items-center justify-between transition-all disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-[#ededed] group-hover:text-emerald-400 transition-colors">
                    Download High-Res 2x PNG Image
                  </div>
                  <div className="text-[11px] text-[#888888]">
                    Sharp graphic file suitable for printing or sharing
                  </div>
                </div>
              </div>
              {isExportingPng ? (
                <Sparkles className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />
              ) : (
                <Download className="w-4 h-4 text-[#737373] group-hover:text-emerald-400 shrink-0" />
              )}
            </button>
          </div>

          {/* Feedback */}
          {successMessage && (
            <div className="p-3 bg-emerald-950/30 text-emerald-300 rounded-xl border border-emerald-800/40 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Footer */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-[#2e2e2e] rounded-lg text-xs font-semibold text-[#a3a3a3] hover:text-[#ededed] hover:bg-[#1e1e1e]"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
