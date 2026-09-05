import React, { useState } from 'react';
import {
  LayoutGrid,
  Sparkles,
  BookOpen,
  Briefcase,
  Dumbbell,
  GraduationCap,
  ArrowRight,
  Check,
} from 'lucide-react';
import { INITIAL_TIMETABLES, TEMPLATE_PREVIEWS } from '../data/presets';
import { Timetable } from '../types';

interface TemplatesViewProps {
  onUseTemplate: (template: Timetable) => void;
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({ onUseTemplate }) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categories = ['All', 'Education', 'Productivity', 'Fitness', 'Study'];

  const filteredTemplates = TEMPLATE_PREVIEWS.filter(
    (tp) => activeCategory === 'All' || tp.category === activeCategory
  );

  const handleApply = (templateId: string) => {
    // Find matching initial timetable or clone first
    const source =
      INITIAL_TIMETABLES.find((t) => t.id === templateId || t.type === templateId) ||
      INITIAL_TIMETABLES[0];

    const newTimetable: Timetable = {
      ...source,
      id: `tt_${Date.now()}`,
      name: `${source.name} (Custom)`,
      lastEdited: new Date().toISOString(),
    };

    onUseTemplate(newTimetable);
  };

  return (
    <div className="flex-1 bg-[#0a0a0a] p-6 lg:p-10 overflow-y-auto text-[#ededed]">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#c5a059]/15 border border-[#c5a059]/30 text-[#e0bf79] text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#c5a059]" />
            Curated Timetable Archetypes
          </div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#f5f5f5] tracking-tight">
            Timetable Templates Library
          </h1>
          <p className="text-xs sm:text-sm text-[#a3a3a3] mt-1 max-w-2xl">
            Jumpstart your schedule with battle-tested timetable layouts for colleges, high schools, deep work sprints, and fitness routines.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-[#c5a059] text-[#0a0a0a] shadow-xs'
                  : 'bg-[#141414] border border-[#262626] text-[#a3a3a3] hover:text-[#ededed] hover:bg-[#1a1a1a]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((tp) => (
            <div
              key={tp.id}
              className="bg-[#141414] rounded-2xl border border-[#262626] shadow-2xs hover:shadow-md hover:border-[#c5a059]/40 transition-all p-6 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-[#e0bf79] bg-[#c5a059]/10 border border-[#c5a059]/25 px-2 py-0.5 rounded-full">
                    {tp.category}
                  </span>
                  <span className="text-[10px] font-semibold text-[#888888] bg-[#1c1c1c] border border-[#262626] px-2 py-0.5 rounded-md">
                    {tp.badge}
                  </span>
                </div>

                <h3 className="font-serif font-bold text-base text-[#ededed] group-hover:text-[#c5a059] transition-colors mb-1.5">{tp.name}</h3>
                <p className="text-xs text-[#888888] leading-relaxed min-h-[48px]">{tp.description}</p>

                <div className="flex items-center gap-2 mt-4 text-[11px] text-[#888888] font-medium">
                  <span className="bg-[#1c1c1c] border border-[#262626] px-2 py-0.5 rounded-md font-mono">{tp.daysCount} Days</span>
                  <span>•</span>
                  <span className="bg-[#1c1c1c] border border-[#262626] px-2 py-0.5 rounded-md font-mono">{tp.slotsCount} Periods</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#262626]">
                <button
                  onClick={() => handleApply(tp.id)}
                  className="w-full py-2.5 bg-[#1a1a1a] hover:bg-[#c5a059] hover:text-[#0a0a0a] text-[#ededed] border border-[#2e2e2e] hover:border-[#c5a059] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                >
                  <span>Use This Template</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
