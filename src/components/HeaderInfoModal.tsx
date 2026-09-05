import React, { useState } from 'react';
import {
  X,
  Edit3,
  Trash2,
  Plus,
  Upload,
  Image as ImageIcon,
  Check,
  Tag,
  Calendar,
  Building,
  FileText,
  Sparkles,
} from 'lucide-react';
import { Timetable, TimetableType } from '../types';

interface HeaderInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  timetable: Timetable;
  onSave: (updated: Timetable) => void;
}

export const HeaderInfoModal: React.FC<HeaderInfoModalProps> = ({
  isOpen,
  onClose,
  timetable,
  onSave,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(timetable.institutionName || timetable.name || '');
  const [subTitle, setSubTitle] = useState(timetable.subTitle || '');
  const [academicYear, setAcademicYear] = useState(timetable.academicYear || '');
  const [scheduleType, setScheduleType] = useState<TimetableType>(timetable.type || 'study');
  const [customTypeLabel, setCustomTypeLabel] = useState<string>('');
  const [logoUrl, setLogoUrl] = useState(timetable.logoUrl || '');
  const [footerNotes, setFooterNotes] = useState(timetable.footerNotes || '');
  const [customBadges, setCustomBadges] = useState<Array<{ id: string; label: string; color?: string }>>(
    timetable.customBadges || []
  );
  const [newBadgeText, setNewBadgeText] = useState('');
  const [newBadgeColor, setNewBadgeColor] = useState('#c5a059');

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        setLogoUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCustomBadge = () => {
    if (!newBadgeText.trim()) return;
    const newBadge = {
      id: `badge-${Date.now()}`,
      label: newBadgeText.trim(),
      color: newBadgeColor,
    };
    setCustomBadges([...customBadges, newBadge]);
    setNewBadgeText('');
  };

  const handleRemoveCustomBadge = (id: string) => {
    setCustomBadges(customBadges.filter((b) => b.id !== id));
  };

  const handleSave = () => {
    const updated: Timetable = {
      ...timetable,
      institutionName: name.trim() || undefined,
      name: name.trim() || timetable.name,
      subTitle: subTitle.trim() || undefined,
      academicYear: academicYear.trim() || undefined,
      type: scheduleType,
      logoUrl: logoUrl.trim() || undefined,
      footerNotes: footerNotes.trim() || undefined,
      customBadges: customBadges.length > 0 ? customBadges : undefined,
      lastEdited: new Date().toISOString(),
    };
    onSave(updated);
    onClose();
  };

  const BADGE_COLORS = [
    { label: 'Gold', value: '#c5a059' },
    { label: 'Emerald', value: '#10b981' },
    { label: 'Blue', value: '#3b82f6' },
    { label: 'Purple', value: '#a855f7' },
    { label: 'Rose', value: '#f43f5e' },
    { label: 'Amber', value: '#f59e0b' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#141414] rounded-2xl shadow-2xl border border-[#262626] w-full max-w-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 text-[#ededed]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#262626] flex items-center justify-between bg-[#161616]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#c5a059]/15 text-[#c5a059] flex items-center justify-center font-bold">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-[#f5f5f5] tracking-wide">
                Edit Header Information
              </h2>
              <p className="text-xs text-[#a3a3a3]">
                Customize, create, or delete header titles, badges, and logos
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

        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Live Header Preview */}
          <div>
            <span className="text-[11px] font-bold text-[#888888] uppercase tracking-wider block mb-2">
              Live Header Preview
            </span>
            <div
              className="p-4 rounded-xl border border-[#262626] flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
              style={{ backgroundColor: timetable.theme?.backgroundColor || '#141414' }}
            >
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Preview Logo"
                    className="w-12 h-12 object-contain rounded-lg border border-[#2e2e2e] bg-[#1a1a1a] p-1 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : null}
                <div>
                  <h3
                    className="text-xl font-serif font-bold tracking-tight"
                    style={{ color: timetable.theme?.primaryColor || '#c5a059' }}
                  >
                    {name || 'Institution / Schedule Title'}
                  </h3>
                  {subTitle && (
                    <p className="text-xs text-[#a3a3a3] font-medium mt-0.5">{subTitle}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    {academicYear && (
                      <span className="text-[10px] font-semibold text-[#c5a059] bg-[#c5a059]/10 border border-[#c5a059]/30 px-2 py-0.5 rounded-md">
                        {academicYear}
                      </span>
                    )}
                    {customBadges.map((b) => (
                      <span
                        key={b.id}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-md border"
                        style={{
                          color: b.color || '#c5a059',
                          borderColor: `${b.color || '#c5a059'}40`,
                          backgroundColor: `${b.color || '#c5a059'}15`,
                        }}
                      >
                        {b.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-right hidden sm:block shrink-0">
                <span className="text-[10px] font-serif font-semibold uppercase tracking-wider text-[#888888] block">
                  Schedule Type
                </span>
                <span className="text-xs font-bold capitalize text-[#ededed]">
                  {scheduleType} Planner
                </span>
              </div>
            </div>
          </div>

          {/* 1. Main Title & Institution Name */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#ededed] flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-[#c5a059]" />
                Institution / Main Title
              </label>
              {name && (
                <button
                  type="button"
                  onClick={() => setName('')}
                  className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Apex National Academy"
              className="w-full text-sm px-3 py-2 bg-[#1a1a1a] border border-[#2e2e2e] focus:border-[#c5a059] rounded-xl text-[#ededed] placeholder-[#666666] outline-hidden transition-colors"
            />
          </div>

          {/* 2. Subtitle / Cohort */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#ededed] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#c5a059]" />
                Subtitle / Description Line
              </label>
              {subTitle ? (
                <button
                  type="button"
                  onClick={() => setSubTitle('')}
                  className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete Subtitle
                </button>
              ) : (
                <span className="text-[11px] text-[#737373] italic">Optional</span>
              )}
            </div>
            <input
              type="text"
              value={subTitle}
              onChange={(e) => setSubTitle(e.target.value)}
              placeholder="e.g. Civil Services & Technical Exam Marathon • Cohort 2026"
              className="w-full text-sm px-3 py-2 bg-[#1a1a1a] border border-[#2e2e2e] focus:border-[#c5a059] rounded-xl text-[#ededed] placeholder-[#666666] outline-hidden transition-colors"
            />
          </div>

          {/* 3. Academic Year / Primary Cycle Tag */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#ededed] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#c5a059]" />
                Academic Year / Cycle / Batch Tag
              </label>
              {academicYear ? (
                <button
                  type="button"
                  onClick={() => setAcademicYear('')}
                  className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete Tag
                </button>
              ) : (
                <span className="text-[11px] text-[#737373] italic">Optional</span>
              )}
            </div>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="e.g. Sprint Cycle 4, or Academic Year 2026"
              className="w-full text-sm px-3 py-2 bg-[#1a1a1a] border border-[#2e2e2e] focus:border-[#c5a059] rounded-xl text-[#ededed] placeholder-[#666666] outline-hidden transition-colors"
            />
          </div>

          {/* 4. Schedule Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#ededed] flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#c5a059]" />
              Schedule Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { type: 'study', label: 'Study Planner' },
                { type: 'college', label: 'College / Exam' },
                { type: 'university', label: 'University' },
                { type: 'school', label: 'School' },
                { type: 'work', label: 'Work Shifts' },
                { type: 'workout', label: 'Fitness / Gym' },
                { type: 'personal', label: 'Personal Routine' },
                { type: 'custom', label: 'Custom' },
              ].map((opt) => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setScheduleType(opt.type as TimetableType)}
                  className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                    scheduleType === opt.type
                      ? 'border-[#c5a059] bg-[#c5a059]/15 text-[#f5f5f5] font-bold'
                      : 'border-[#262626] hover:border-[#383838] bg-[#1a1a1a] text-[#a3a3a3]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Custom Header Badges (Create / Delete) */}
          <div className="space-y-2 p-3.5 bg-[#171717] rounded-xl border border-[#262626]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#ededed] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#c5a059]" />
                Additional Header Badges
              </span>
              <span className="text-[11px] text-[#737373]">
                {customBadges.length} custom badge(s)
              </span>
            </div>

            {/* List of custom badges */}
            {customBadges.length > 0 && (
              <div className="flex flex-wrap gap-2 py-1">
                {customBadges.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium"
                    style={{
                      borderColor: `${b.color || '#c5a059'}40`,
                      backgroundColor: `${b.color || '#c5a059'}15`,
                      color: b.color || '#c5a059',
                    }}
                  >
                    <span>{b.label}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomBadge(b.id)}
                      className="hover:text-rose-400 p-0.5 rounded transition-colors"
                      title="Delete Badge"
                      aria-label={`Delete badge ${b.label}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Create new badge input row */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newBadgeText}
                onChange={(e) => setNewBadgeText(e.target.value)}
                placeholder="e.g. Cohort 2026, AIR < 50, Batch A"
                className="flex-1 text-xs px-2.5 py-1.5 bg-[#1e1e1e] border border-[#2e2e2e] focus:border-[#c5a059] rounded-lg text-[#ededed] placeholder-[#666666] outline-hidden"
              />
              <div className="flex items-center gap-1">
                {BADGE_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setNewBadgeColor(c.value)}
                    className={`w-5 h-5 rounded-full border transition-transform ${
                      newBadgeColor === c.value
                        ? 'scale-125 border-white shadow-xs'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={handleAddCustomBadge}
                disabled={!newBadgeText.trim()}
                className="px-3 py-1.5 bg-[#c5a059] hover:bg-[#d4af37] disabled:opacity-40 text-[#0a0a0a] rounded-lg text-xs font-bold flex items-center gap-1 transition-all shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Badge
              </button>
            </div>
          </div>

          {/* 6. Institution Logo (Upload, URL, Delete) */}
          <div className="space-y-2 p-3.5 bg-[#171717] rounded-xl border border-[#262626]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#ededed] flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#c5a059]" />
                Header Logo
              </span>
              {logoUrl && (
                <button
                  type="button"
                  onClick={() => setLogoUrl('')}
                  className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete Logo
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {logoUrl ? (
                <div className="relative group shrink-0">
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="w-12 h-12 object-contain rounded-lg border border-[#2e2e2e] bg-[#0a0a0a] p-1"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    type="button"
                    onClick={() => setLogoUrl('')}
                    className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white p-0.5 rounded-full shadow-xs"
                    title="Remove Logo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-12 h-12 rounded-lg border border-dashed border-[#383838] flex items-center justify-center text-[#737373] bg-[#1a1a1a] shrink-0">
                  <ImageIcon className="w-6 h-6" />
                </div>
              )}

              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer px-3 py-1.5 rounded-lg border border-[#2e2e2e] bg-[#1e1e1e] hover:bg-[#282828] hover:border-[#c5a059]/50 text-xs font-semibold text-[#ededed] flex items-center gap-1.5 transition-colors">
                    <Upload className="w-3.5 h-3.5 text-[#c5a059]" />
                    <span>Upload File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[11px] text-[#737373]">or enter image URL below</span>
                </div>
                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full text-xs px-2.5 py-1.5 bg-[#1e1e1e] border border-[#2e2e2e] focus:border-[#c5a059] rounded-lg text-[#ededed] placeholder-[#666666] outline-hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-[#262626] bg-[#161616] flex items-center justify-between">
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
            Save Header Information
          </button>
        </div>
      </div>
    </div>
  );
};
