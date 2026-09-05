import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, Copy, BookOpen } from 'lucide-react';
import { TimetableEntry } from '../types';
import { COMMON_ICONS, IconRenderer } from './IconRenderer';

interface QuickEditModalProps {
  entry: TimetableEntry | null;
  onClose: () => void;
  onSave: (updated: TimetableEntry) => void;
  onDelete: (id: string) => void;
}

export const QuickEditModal: React.FC<QuickEditModalProps> = ({
  entry,
  onClose,
  onSave,
  onDelete,
}) => {
  if (!entry) return null;

  const [title, setTitle] = useState(entry.title);
  const [shortCode, setShortCode] = useState(entry.shortCode || '');
  const [teacher, setTeacher] = useState(entry.teacher || '');
  const [room, setRoom] = useState(entry.room || '');
  const [color, setColor] = useState(entry.color);
  const [icon, setIcon] = useState(entry.icon || 'BookOpen');

  useEffect(() => {
    setTitle(entry.title);
    setShortCode(entry.shortCode || '');
    setTeacher(entry.teacher || '');
    setRoom(entry.room || '');
    setColor(entry.color);
    setIcon(entry.icon || 'BookOpen');
  }, [entry]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...entry,
      title: title.trim(),
      shortCode: shortCode.trim() || undefined,
      teacher: teacher.trim() || undefined,
      room: room.trim() || undefined,
      color,
      icon,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-[#141414] rounded-2xl shadow-xl border border-[#2a2a2a] w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-100 text-[#ededed]">
        <div className="p-4 border-b border-[#262626] flex items-center justify-between">
          <h3 className="font-serif font-bold text-sm text-[#f5f5f5] tracking-wide">Edit Class / Activity</h3>
          <button onClick={onClose} className="p-1 text-[#737373] hover:text-[#ededed] rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-4 space-y-3">
          <div>
            <label className="text-[11px] font-medium text-[#a3a3a3] block mb-1">Title / Subject</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 bg-[#1a1a1a] border border-[#2e2e2e] text-[#ededed] rounded-lg focus:border-[#c5a059] focus:outline-hidden"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-medium text-[#a3a3a3] block mb-1">Code</label>
              <input
                type="text"
                value={shortCode}
                onChange={(e) => setShortCode(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 bg-[#1a1a1a] border border-[#2e2e2e] text-[#ededed] rounded-lg focus:border-[#c5a059] focus:outline-hidden"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-[#a3a3a3] block mb-1">Room</label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 bg-[#1a1a1a] border border-[#2e2e2e] text-[#ededed] rounded-lg focus:border-[#c5a059] focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-[#a3a3a3] block mb-1">Teacher / Staff</label>
            <input
              type="text"
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 bg-[#1a1a1a] border border-[#2e2e2e] text-[#ededed] rounded-lg focus:border-[#c5a059] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-[#a3a3a3] block mb-1.5">Color</label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {['#c5a059', '#1e3a8a', '#991b1b', '#065f46', '#581c87', '#dbeafe', '#fef3c7', '#e0e7ff', '#fce7f3', '#dcfce7'].map(
                (c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full border transition-transform flex items-center justify-center ${
                      color === c ? 'scale-125 border-[#c5a059] shadow-xs' : 'border-[#383838]'
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {color === c && <Check className="w-3 h-3 text-[#0a0a0a]" />}
                  </button>
                )
              )}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-[#a3a3a3] block mb-1.5">Icon</label>
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {COMMON_ICONS.slice(0, 10).map((ic) => (
                <button
                  key={ic.name}
                  type="button"
                  onClick={() => setIcon(ic.name)}
                  className={`p-1.5 rounded-lg border shrink-0 transition-all ${
                    icon === ic.name
                      ? 'border-[#c5a059] bg-[#c5a059]/15 text-[#e0bf79]'
                      : 'border-[#262626] text-[#a3a3a3] hover:bg-[#1e1e1e] hover:text-[#ededed]'
                  }`}
                >
                  <IconRenderer name={ic.name} size={15} />
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#262626] flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onDelete(entry.id);
                onClose();
              }}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1 p-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 border border-[#2e2e2e] rounded-lg text-xs font-semibold text-[#a3a3a3] hover:text-[#ededed] hover:bg-[#1e1e1e]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#c5a059] hover:bg-[#d4af37] text-[#0a0a0a] rounded-lg text-xs font-semibold shadow-xs"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
