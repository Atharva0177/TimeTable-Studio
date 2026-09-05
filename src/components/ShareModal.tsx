import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Globe,
  Lock,
  Link as LinkIcon,
  QrCode,
} from 'lucide-react';
import { Timetable } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  timetable: Timetable;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, timetable }) => {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);
  const [accessMode, setAccessMode] = useState<'anyone' | 'private' | 'editable'>('anyone');

  const shareUrl = `${window.location.origin}/#share=${timetable.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#141414] rounded-2xl shadow-2xl border border-[#2a2a2a] w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-[#ededed]">
        <div className="p-4 sm:p-5 border-b border-[#262626] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#c5a059]/20 text-[#c5a059] flex items-center justify-center font-bold">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-[#f5f5f5] tracking-wide">Share Timetable</h2>
              <p className="text-xs text-[#a3a3a3]">Collaborate or share this schedule with students or colleagues</p>
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
          {/* Access Mode Selectors */}
          <div className="space-y-2">
            <label className="text-xs font-serif font-bold text-[#888888] uppercase tracking-wider block">
              Access Permission
            </label>

            <div
              onClick={() => setAccessMode('anyone')}
              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                accessMode === 'anyone'
                  ? 'border-[#c5a059] bg-[#c5a059]/10 text-[#ededed] ring-1 ring-[#c5a059]/30'
                  : 'border-[#262626] bg-[#181818] hover:bg-[#1e1e1e] text-[#a3a3a3]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-[#c5a059]" />
                <div>
                  <div className="font-bold text-xs text-[#ededed]">Anyone with link</div>
                  <div className="text-[11px] text-[#888888]">Can view and print timetable</div>
                </div>
              </div>
              {accessMode === 'anyone' && <Check className="w-4 h-4 text-[#c5a059]" />}
            </div>

            <div
              onClick={() => setAccessMode('private')}
              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                accessMode === 'private'
                  ? 'border-[#c5a059] bg-[#c5a059]/10 text-[#ededed] ring-1 ring-[#c5a059]/30'
                  : 'border-[#262626] bg-[#181818] hover:bg-[#1e1e1e] text-[#a3a3a3]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-[#888888]" />
                <div>
                  <div className="font-bold text-xs text-[#ededed]">Only me (Private)</div>
                  <div className="text-[11px] text-[#888888]">Only accessible in this browser</div>
                </div>
              </div>
              {accessMode === 'private' && <Check className="w-4 h-4 text-[#c5a059]" />}
            </div>
          </div>

          {/* Link box */}
          <div>
            <label className="text-xs font-semibold text-[#ededed] block mb-1">Shareable Link</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full text-xs px-3 py-2 bg-[#181818] border border-[#2e2e2e] rounded-lg text-[#ededed] select-all font-mono"
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-2 bg-[#c5a059] hover:bg-[#d4af37] text-[#0a0a0a] rounded-lg text-xs font-semibold shrink-0 shadow-xs flex items-center gap-1 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-[#2e2e2e] bg-[#222222] hover:bg-[#2a2a2a] text-[#ededed] rounded-lg text-xs font-semibold transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
