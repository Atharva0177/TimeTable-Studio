import React, { useState } from 'react';
import {
  Search,
  Plus,
  Calendar,
  Clock,
  MoreVertical,
  Copy,
  Trash2,
  Download,
  Edit3,
  ExternalLink,
  Sparkles,
  Tag,
  Share2,
} from 'lucide-react';
import { Timetable } from '../types';

interface DashboardViewProps {
  timetables: Timetable[];
  onOpenTimetable: (id: string) => void;
  onDuplicateTimetable: (id: string) => void;
  onDeleteTimetable: (id: string) => void;
  onRenameTimetable: (id: string, newName: string) => void;
  onCreateNewClick: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  timetables,
  onOpenTimetable,
  onDuplicateTimetable,
  onDeleteTimetable,
  onRenameTimetable,
  onCreateNewClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState('');

  // Collect all unique tags
  const allTags = Array.from(
    new Set(timetables.flatMap((t) => t.tags || []))
  );

  // Filter timetables
  const filtered = timetables.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.institutionName && t.institutionName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      t.entries.some((e) => e.title.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTag = selectedTag === 'all' || (t.tags && t.tags.includes(selectedTag));

    return matchesSearch && matchesTag;
  });

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="flex-1 bg-[#0a0a0a] p-6 lg:p-10 overflow-y-auto text-[#ededed]">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#f5f5f5] tracking-tight">
              My Timetables
            </h1>
            <p className="text-xs sm:text-sm text-[#a3a3a3] mt-1">
              Manage, customize, duplicate, and export all your saved schedules.
            </p>
          </div>

          <button
            onClick={onCreateNewClick}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#c5a059] hover:bg-[#d4af37] text-[#0a0a0a] rounded-xl text-xs font-semibold shadow-xs hover:shadow transition-all self-start sm:self-auto"
            id="dashboard-new-timetable-btn"
          >
            <Plus className="w-4 h-4" />
            <span>Create Timetable</span>
          </button>
        </div>

        {/* Search & Tag Filter Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#141414] p-3 rounded-2xl border border-[#262626] shadow-2xs">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search timetables by name, subject, or instructor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-[#1a1a1a] border border-[#2e2e2e] text-[#ededed] placeholder-[#737373] rounded-xl focus:border-[#c5a059] focus:outline-hidden transition-colors"
            />
          </div>

          {/* Tags Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setSelectedTag('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                selectedTag === 'all'
                  ? 'bg-[#c5a059] text-[#0a0a0a] shadow-2xs'
                  : 'bg-[#1e1e1e] text-[#a3a3a3] hover:text-[#ededed] hover:bg-[#252525]'
              }`}
            >
              All ({timetables.length})
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  selectedTag === tag
                    ? 'bg-[#c5a059] text-[#0a0a0a] shadow-2xs'
                    : 'bg-[#1e1e1e] text-[#a3a3a3] hover:text-[#ededed] hover:bg-[#252525]'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Timetables Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-[#141414] rounded-2xl border border-dashed border-[#2e2e2e] p-8">
            <Calendar className="w-12 h-12 text-[#404040] mx-auto mb-3" />
            <h3 className="font-bold text-base text-[#ededed]">No timetables found</h3>
            <p className="text-xs text-[#a3a3a3] mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No schedules matching "${searchQuery}". Try a different search query.`
                : 'Create your first schedule or use a template to get started.'}
            </p>
            <button
              onClick={onCreateNewClick}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#c5a059] hover:bg-[#d4af37] text-[#0a0a0a] text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Timetable</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((timetable) => {
              const isMenuOpen = activeMenuId === timetable.id;
              const isRenaming = editingNameId === timetable.id;

              return (
                <div
                  key={timetable.id}
                  className="bg-[#141414] rounded-2xl border border-[#262626] shadow-2xs hover:border-[#c5a059]/40 hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden group"
                >
                  <div className="p-5">
                    {/* Top row: Type badge + Action menu */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-[#1c1c1c] text-[#c5a059] border border-[#2e2e2e]">
                        {timetable.type}
                      </span>

                      <div className="relative">
                        <button
                          onClick={() => setActiveMenuId(isMenuOpen ? null : timetable.id)}
                          className="p-1 rounded-lg text-[#737373] hover:text-[#ededed] hover:bg-[#1e1e1e] transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {isMenuOpen && (
                          <div
                            className="absolute right-0 mt-1 w-44 bg-[#1a1a1a] rounded-xl shadow-xl border border-[#2e2e2e] py-1 z-20 animate-in fade-in zoom-in-95 duration-100 text-[#ededed]"
                            onMouseLeave={() => setActiveMenuId(null)}
                          >
                            <button
                              onClick={() => {
                                onOpenTimetable(timetable.id);
                                setActiveMenuId(null);
                              }}
                              className="w-full text-left px-3 py-2 text-xs text-[#ededed] hover:bg-[#262626] flex items-center gap-2"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-[#c5a059]" />
                              Open in Editor
                            </button>

                            <button
                              onClick={() => {
                                setEditingNameId(timetable.id);
                                setEditingNameValue(timetable.name);
                                setActiveMenuId(null);
                              }}
                              className="w-full text-left px-3 py-2 text-xs text-[#ededed] hover:bg-[#262626] flex items-center gap-2"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-[#a3a3a3]" />
                              Rename
                            </button>

                            <button
                              onClick={() => {
                                onDuplicateTimetable(timetable.id);
                                setActiveMenuId(null);
                              }}
                              className="w-full text-left px-3 py-2 text-xs text-[#ededed] hover:bg-[#262626] flex items-center gap-2"
                            >
                              <Copy className="w-3.5 h-3.5 text-[#a3a3a3]" />
                              Duplicate
                            </button>

                            <div className="border-t border-[#2e2e2e] my-1" />

                            <button
                              onClick={() => {
                                onDeleteTimetable(timetable.id);
                                setActiveMenuId(null);
                              }}
                              disabled={timetables.length <= 1}
                              className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-[#262626] flex items-center gap-2 disabled:opacity-30"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Timetable Name (or inline rename input) */}
                    {isRenaming ? (
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="text"
                          value={editingNameValue}
                          onChange={(e) => setEditingNameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              onRenameTimetable(timetable.id, editingNameValue);
                              setEditingNameId(null);
                            } else if (e.key === 'Escape') {
                              setEditingNameId(null);
                            }
                          }}
                          autoFocus
                          className="w-full text-sm font-bold px-2 py-1 bg-[#1f1f1f] border border-[#c5a059] text-[#ededed] rounded-lg focus:outline-hidden"
                        />
                        <button
                          onClick={() => {
                            onRenameTimetable(timetable.id, editingNameValue);
                            setEditingNameId(null);
                          }}
                          className="text-xs bg-[#c5a059] text-[#0a0a0a] px-2 py-1 rounded-lg font-semibold"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <h3
                        onClick={() => onOpenTimetable(timetable.id)}
                        className="font-serif font-bold text-base text-[#ededed] group-hover:text-[#c5a059] cursor-pointer transition-colors line-clamp-1 mb-1"
                      >
                        {timetable.name}
                      </h3>
                    )}

                    <p className="text-xs text-[#a3a3a3] line-clamp-2 min-h-[32px]">
                      {timetable.institutionName || timetable.description || 'Custom schedule'}
                    </p>

                    {/* Stats Pill Row */}
                    <div className="flex items-center gap-2 mt-4 text-[11px] text-[#888888] font-medium">
                      <span className="bg-[#1c1c1c] border border-[#282828] px-2 py-0.5 rounded-md">
                        {timetable.days.length} Days
                      </span>
                      <span>•</span>
                      <span className="bg-[#1c1c1c] border border-[#282828] px-2 py-0.5 rounded-md">
                        {timetable.timeSlots.length} Slots
                      </span>
                      <span>•</span>
                      <span className="bg-[#1c1c1c] border border-[#282828] px-2 py-0.5 rounded-md">
                        {timetable.entries.length} Activities
                      </span>
                    </div>

                    {/* Tags */}
                    {timetable.tags && timetable.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap mt-3">
                        {timetable.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] text-[#e0bf79] bg-[#c5a059]/10 border border-[#c5a059]/25 px-1.5 py-0.2 rounded-md font-mono"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Bottom / Footer Bar */}
                  <div className="p-3 bg-[#101010] border-t border-[#202020] flex items-center justify-between text-[11px] text-[#737373]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(timetable.lastEdited)}
                    </span>

                    <button
                      onClick={() => onOpenTimetable(timetable.id)}
                      className="text-xs font-semibold text-[#c5a059] hover:text-[#e0bf79] flex items-center gap-1 transition-colors"
                    >
                      <span>Open Editor</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
