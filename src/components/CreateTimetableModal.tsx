import React, { useState } from 'react';
import {
  X,
  FilePlus2,
  LayoutTemplate,
  Wand2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Plus,
  Trash2,
  Clock,
  Calendar,
  Layers,
  AlertCircle,
} from 'lucide-react';
import { Timetable, TimetableType, GeneratorRequirements } from '../types';
import { INITIAL_TIMETABLES, PRESET_THEMES, TEMPLATE_PREVIEWS } from '../data/presets';
import { generateTimetableFromRequirements } from '../utils/generatorEngine';

interface CreateTimetableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTimetable: (timetable: Timetable) => void;
}

export const CreateTimetableModal: React.FC<CreateTimetableModalProps> = ({
  isOpen,
  onClose,
  onCreateTimetable,
}) => {
  if (!isOpen) return null;

  const [activeMode, setActiveMode] = useState<'options' | 'blank' | 'template' | 'wizard' | 'ai'>('options');

  // Blank Form State
  const [blankName, setBlankName] = useState('My New Schedule');
  const [blankType, setBlankType] = useState<TimetableType>('college');
  const [blankDaysPreset, setBlankDaysPreset] = useState<'5days' | '6days' | '7days'>('6days');
  const [blankPeriodsCount, setBlankPeriodsCount] = useState(6);

  // AI Prompt State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Wizard State (Steps 1 to 5)
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardType, setWizardType] = useState<TimetableType>('college');
  const [wizardName, setWizardName] = useState('Class Schedule 2026');
  const [wizardInstitution, setWizardInstitution] = useState('Apex University');
  const [wizardDays, setWizardDays] = useState<string[]>([
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ]);
  const [wizardStartTime, setWizardStartTime] = useState('09:00');
  const [wizardEndTime, setWizardEndTime] = useState('16:00');
  const [wizardSlotDuration, setWizardSlotDuration] = useState(60);
  const [wizardIncludeLunch, setWizardIncludeLunch] = useState(true);
  const [wizardLunchStart, setWizardLunchStart] = useState('13:00');
  const [wizardLunchEnd, setWizardLunchEnd] = useState('14:00');
  const [wizardIncludeBreak, setWizardIncludeBreak] = useState(true);
  const [wizardBreakStart, setWizardBreakStart] = useState('11:00');
  const [wizardBreakEnd, setWizardBreakEnd] = useState('11:15');

  // Subjects in Wizard
  const [wizardSubjects, setWizardSubjects] = useState([
    { name: 'Mathematics', shortCode: 'MATH', teacher: 'Prof. Sharma', room: '204', frequencyPerWeek: 4, color: '#dbeafe' },
    { name: 'Physics', shortCode: 'PHY', teacher: 'Dr. Anita Roy', room: 'Lab 1', frequencyPerWeek: 4, color: '#fce7f3' },
    { name: 'Computer Science', shortCode: 'CS', teacher: 'Prof. K. Verma', room: 'Lab 2', frequencyPerWeek: 4, color: '#e0e7ff' },
    { name: 'Database Systems', shortCode: 'DBMS', teacher: 'Dr. Meera P.', room: 'Hall B', frequencyPerWeek: 3, color: '#ffedd5' },
    { name: 'Web Engineering', shortCode: 'WEB', teacher: 'Prof. Alex J.', room: 'Lab 4', frequencyPerWeek: 3, color: '#ccfbf1' },
  ]);

  const [newWizardSubjName, setNewWizardSubjName] = useState('');
  const [newWizardSubjTeacher, setNewWizardSubjTeacher] = useState('');

  // Handle Blank Creation
  const handleCreateBlank = () => {
    const daysList =
      blankDaysPreset === '5days'
        ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        : blankDaysPreset === '6days'
        ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const days = daysList.map((d, i) => ({
      id: `day_${i}`,
      name: d,
      shortName: d.slice(0, 3),
    }));

    const timeSlots = Array.from({ length: blankPeriodsCount }, (_, i) => {
      const startH = 9 + i;
      const endH = startH + 1;
      return {
        id: `slot_${i + 1}`,
        name: `Period ${i + 1}`,
        start: `${startH.toString().padStart(2, '0')}:00`,
        end: `${endH.toString().padStart(2, '0')}:00`,
        isBreak: false,
      };
    });

    const newTt: Timetable = {
      id: `tt_${Date.now()}`,
      name: blankName || 'Untitled Timetable',
      type: blankType,
      tags: [`#${blankType}`, '#new'],
      lastEdited: new Date().toISOString(),
      institutionName: 'My Institution',
      days,
      timeSlots,
      entries: [],
      theme: PRESET_THEMES[0],
    };

    onCreateTimetable(newTt);
    onClose();
  };

  // Handle Template Selection
  const handleSelectTemplate = (templateId: string) => {
    const existing = INITIAL_TIMETABLES.find((t) => t.id === templateId) || INITIAL_TIMETABLES[0];
    const cloned: Timetable = {
      ...existing,
      id: `tt_${Date.now()}`,
      name: `${existing.name} (Copy)`,
      lastEdited: new Date().toISOString(),
    };
    onCreateTimetable(cloned);
    onClose();
  };

  // Handle Wizard Submission
  const handleWizardSubmit = () => {
    const req: GeneratorRequirements = {
      type: wizardType,
      name: wizardName,
      institution: wizardInstitution,
      days: wizardDays,
      startTime: wizardStartTime,
      endTime: wizardEndTime,
      slotDurationMinutes: wizardSlotDuration,
      includeLunch: wizardIncludeLunch,
      lunchStart: wizardLunchStart,
      lunchEnd: wizardLunchEnd,
      includeShortBreak: wizardIncludeBreak,
      breakStart: wizardBreakStart,
      breakEnd: wizardBreakEnd,
      subjects: wizardSubjects,
    };

    const result = generateTimetableFromRequirements(req);
    onCreateTimetable(result.timetable);
    onClose();
  };

  // Handle AI Prompt Submission
  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiError(null);

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          type: 'college',
          institution: 'Apex College',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Server error generating timetable');
      }

      const generatedData = data.data;
      const completeTimetable: Timetable = {
        id: `tt_${Date.now()}`,
        name: generatedData.name || 'AI Generated Schedule',
        institutionName: generatedData.institutionName || 'Apex Institution',
        subTitle: generatedData.subTitle || 'Custom Schedule',
        type: generatedData.type || 'college',
        tags: ['#ai-generated', '#custom'],
        lastEdited: new Date().toISOString(),
        days: generatedData.days || [
          { id: 'mon', name: 'Monday', shortName: 'Mon' },
          { id: 'tue', name: 'Tuesday', shortName: 'Tue' },
          { id: 'wed', name: 'Wednesday', shortName: 'Wed' },
          { id: 'thu', name: 'Thursday', shortName: 'Thu' },
          { id: 'fri', name: 'Friday', shortName: 'Fri' },
        ],
        timeSlots: generatedData.timeSlots || [
          { id: 's1', name: 'Period 1', start: '09:00', end: '10:00' },
          { id: 's2', name: 'Period 2', start: '10:00', end: '11:00' },
          { id: 's3', name: 'Period 3', start: '11:00', end: '12:00' },
          { id: 'lunch', name: 'Lunch Break', start: '12:00', end: '13:00', isBreak: true },
          { id: 's4', name: 'Period 4', start: '13:00', end: '14:00' },
        ],
        entries: generatedData.entries || [],
        theme: PRESET_THEMES[0],
      };

      onCreateTimetable(completeTimetable);
      onClose();
    } catch (err: any) {
      console.warn('AI API not reachable, falling back to smart solver:', err);
      setAiError(
        'Gemini API key not configured or unreachable. Falling back to the built-in Intelligent Generator!'
      );
      // Fallback: parse basic prompt using smart solver
      setTimeout(() => {
        const fallbackReq: GeneratorRequirements = {
          type: 'college',
          name: 'AI-Generated Schedule',
          institution: 'Apex Institution',
          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          startTime: '09:00',
          endTime: '16:00',
          slotDurationMinutes: 60,
          includeLunch: true,
          lunchStart: '13:00',
          lunchEnd: '14:00',
          includeShortBreak: true,
          breakStart: '11:00',
          breakEnd: '11:15',
          subjects: wizardSubjects,
        };
        const result = generateTimetableFromRequirements(fallbackReq);
        onCreateTimetable(result.timetable);
        onClose();
      }, 1200);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#141414] rounded-2xl shadow-2xl border border-[#2a2a2a] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-[#ededed]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#262626] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#c5a059]/20 text-[#c5a059] flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-[#f5f5f5] tracking-wide">Create New Timetable</h2>
              <p className="text-xs text-[#a3a3a3]">Choose how you want to start designing your schedule</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#737373] hover:text-[#ededed] rounded-lg hover:bg-[#202020] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* =====================================
              PRIMARY OPTIONS MENU (Section 9)
             ===================================== */}
          {activeMode === 'options' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Option A: Blank */}
                <button
                  onClick={() => setActiveMode('blank')}
                  className="p-4 rounded-xl border border-[#262626] hover:border-[#c5a059]/50 bg-[#181818] hover:bg-[#1e1e1e] text-left transition-all group flex flex-col justify-between min-h-[160px]"
                  id="choice-blank-btn"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-[#222222] text-[#c5a059] flex items-center justify-center group-hover:bg-[#c5a059] group-hover:text-[#0a0a0a] transition-colors mb-3">
                      <FilePlus2 className="w-5 h-5" />
                    </div>
                    <h3 className="font-serif font-bold text-sm text-[#ededed] group-hover:text-[#c5a059]">
                      Blank Timetable
                    </h3>
                    <p className="text-xs text-[#888888] mt-1 leading-relaxed">
                      Start with a clean canvas. Choose days and periods manually.
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-[#c5a059] flex items-center gap-1 mt-3">
                    Start Blank <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </button>

                {/* Option B: Template */}
                <button
                  onClick={() => setActiveMode('template')}
                  className="p-4 rounded-xl border border-[#262626] hover:border-[#c5a059]/50 bg-[#181818] hover:bg-[#1e1e1e] text-left transition-all group flex flex-col justify-between min-h-[160px]"
                  id="choice-template-btn"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-[#222222] text-[#c5a059] flex items-center justify-center group-hover:bg-[#c5a059] group-hover:text-[#0a0a0a] transition-colors mb-3">
                      <LayoutTemplate className="w-5 h-5" />
                    </div>
                    <h3 className="font-serif font-bold text-sm text-[#ededed] group-hover:text-[#c5a059]">
                      Use Template
                    </h3>
                    <p className="text-xs text-[#888888] mt-1 leading-relaxed">
                      Pick from pre-made college, school, deep work, or gym routines.
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-[#c5a059] flex items-center gap-1 mt-3">
                    Browse Templates <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </button>

                {/* Option C: Automatic / AI Wizard */}
                <button
                  onClick={() => setActiveMode('wizard')}
                  className="p-4 rounded-xl border border-[#333333] bg-gradient-to-br from-[#1c1c1c] via-[#221e14] to-[#181818] hover:border-[#c5a059] hover:shadow-md text-left transition-all group flex flex-col justify-between min-h-[160px]"
                  id="choice-wizard-btn"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-[#c5a059] text-[#0a0a0a] flex items-center justify-center shadow-xs mb-3">
                      <Wand2 className="w-5 h-5" />
                    </div>
                    <h3 className="font-serif font-bold text-sm text-[#f5f5f5] group-hover:text-[#c5a059] flex items-center gap-1.5">
                      Automatic Generator
                    </h3>
                    <p className="text-xs text-[#a3a3a3] mt-1 leading-relaxed">
                      Specify subjects, times, and breaks. Let our solver arrange everything.
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-[#c5a059] flex items-center gap-1 mt-3">
                    Configure Wizard <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </button>
              </div>

              {/* Natural Language Prompt Shortcut ("Describe It -> Generate It") */}
              <div className="mt-4 p-4 rounded-xl border border-[#382f18] bg-[#1c1912] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#c5a059] text-[#0a0a0a] flex items-center justify-center shrink-0 shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#f5f5f5]">Describe It → Generate It</h4>
                    <p className="text-[11px] text-[#a3a3a3]">
                      Type your schedule in plain English and let AI generate it in seconds.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveMode('ai')}
                  className="px-3.5 py-1.5 bg-[#c5a059] hover:bg-[#d4af37] text-[#0a0a0a] rounded-lg text-xs font-semibold shrink-0 shadow-xs transition-colors"
                >
                  Try AI Prompt
                </button>
              </div>
            </div>
          )}

          {/* =====================================
              BLANK TIMETABLE FORM
             ===================================== */}
          {activeMode === 'blank' && (
            <div className="space-y-4">
              <button
                onClick={() => setActiveMode('options')}
                className="text-xs text-[#737373] hover:text-[#ededed] flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to choices
              </button>

              <div>
                <label className="text-xs font-semibold text-[#ededed] block mb-1">Timetable Name</label>
                <input
                  type="text"
                  value={blankName}
                  onChange={(e) => setBlankName(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-[#1a1a1a] border border-[#2e2e2e] text-[#ededed] rounded-lg focus:border-[#c5a059] focus:outline-hidden"
                  placeholder="e.g. B.Tech Semester 4"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#ededed] block mb-1">Schedule Type</label>
                <select
                  value={blankType}
                  onChange={(e) => setBlankType(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 bg-[#1a1a1a] border border-[#2e2e2e] text-[#ededed] rounded-lg capitalize focus:border-[#c5a059]"
                >
                  {['college', 'school', 'university', 'study', 'work', 'workout', 'personal', 'custom'].map((t) => (
                    <option key={t} value={t} className="bg-[#1a1a1a]">
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#ededed] block mb-1">Days of Week</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBlankDaysPreset('5days')}
                    className={`p-2.5 rounded-lg border text-xs font-medium transition-all ${
                      blankDaysPreset === '5days'
                        ? 'border-[#c5a059] bg-[#c5a059]/15 text-[#e0bf79] font-semibold'
                        : 'border-[#262626] text-[#a3a3a3] hover:bg-[#1e1e1e]'
                    }`}
                  >
                    Mon – Fri (5 Days)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBlankDaysPreset('6days')}
                    className={`p-2.5 rounded-lg border text-xs font-medium transition-all ${
                      blankDaysPreset === '6days'
                        ? 'border-[#c5a059] bg-[#c5a059]/15 text-[#e0bf79] font-semibold'
                        : 'border-[#262626] text-[#a3a3a3] hover:bg-[#1e1e1e]'
                    }`}
                  >
                    Mon – Sat (6 Days)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBlankDaysPreset('7days')}
                    className={`p-2.5 rounded-lg border text-xs font-medium transition-all ${
                      blankDaysPreset === '7days'
                        ? 'border-[#c5a059] bg-[#c5a059]/15 text-[#e0bf79] font-semibold'
                        : 'border-[#262626] text-[#a3a3a3] hover:bg-[#1e1e1e]'
                    }`}
                  >
                    All 7 Days (Mon – Sun)
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-[#ededed] mb-1">
                  <span>Number of Periods / Slots per day</span>
                  <span className="font-mono text-[#c5a059]">{blankPeriodsCount} Periods</span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={10}
                  value={blankPeriodsCount}
                  onChange={(e) => setBlankPeriodsCount(Number(e.target.value))}
                  className="w-full accent-[#c5a059]"
                />
              </div>

              <div className="pt-3 border-t border-[#262626] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveMode('options')}
                  className="px-4 py-2 border border-[#2e2e2e] rounded-lg text-xs font-semibold text-[#a3a3a3] hover:text-[#ededed] hover:bg-[#1e1e1e]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateBlank}
                  className="px-5 py-2 bg-[#c5a059] hover:bg-[#d4af37] text-[#0a0a0a] rounded-lg text-xs font-semibold shadow-xs"
                >
                  Create Blank Timetable
                </button>
              </div>
            </div>
          )}

          {/* =====================================
              TEMPLATE GALLERY
             ===================================== */}
          {activeMode === 'template' && (
            <div className="space-y-4">
              <button
                onClick={() => setActiveMode('options')}
                className="text-xs text-[#737373] hover:text-[#ededed] flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to choices
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TEMPLATE_PREVIEWS.map((tp) => (
                  <div
                    key={tp.id}
                    className="p-3.5 rounded-xl border border-[#262626] hover:border-[#c5a059]/40 bg-[#181818] hover:bg-[#1e1e1e] transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] uppercase font-bold text-[#e0bf79] bg-[#c5a059]/10 px-2 py-0.5 rounded-full border border-[#c5a059]/25">
                          {tp.category}
                        </span>
                        <span className="text-[10px] text-[#888888] font-mono">
                          {tp.daysCount} Days • {tp.slotsCount} Slots
                        </span>
                      </div>
                      <h4 className="font-serif font-bold text-xs text-[#ededed]">{tp.name}</h4>
                      <p className="text-[11px] text-[#888888] mt-1 leading-relaxed">{tp.description}</p>
                    </div>

                    <button
                      onClick={() => handleSelectTemplate(tp.id)}
                      className="mt-3 w-full py-1.5 rounded-lg bg-[#222222] hover:bg-[#c5a059] hover:text-[#0a0a0a] text-[#ededed] text-xs font-semibold transition-colors border border-[#2e2e2e]"
                    >
                      Use This Template
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =====================================
              AI NATURAL LANGUAGE PROMPT
             ===================================== */}
          {activeMode === 'ai' && (
            <div className="space-y-4">
              <button
                onClick={() => setActiveMode('options')}
                className="text-xs text-[#737373] hover:text-[#ededed] flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to choices
              </button>

              <div className="p-3 bg-[#c5a059]/10 rounded-xl border border-[#c5a059]/25 text-xs text-[#e0bf79] leading-relaxed">
                <Sparkles className="w-4 h-4 text-[#c5a059] inline mr-1" />
                Describe your desired schedule in natural language. Our assistant will extract the days, time slots, lunch breaks, and subjects to construct the complete timetable.
              </div>

              <div>
                <label className="text-xs font-semibold text-[#ededed] block mb-1">
                  Your Schedule Description
                </label>
                <textarea
                  rows={4}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. Create a Monday to Friday engineering timetable from 9 AM to 4 PM. Lunch from 1 PM to 2 PM. Subjects: Data Structures, Operating Systems, Computer Networks, and DBMS. Put difficult subjects in the morning."
                  className="w-full text-xs p-3 bg-[#1a1a1a] border border-[#2e2e2e] text-[#ededed] placeholder-[#737373] rounded-xl focus:border-[#c5a059] focus:outline-hidden leading-relaxed"
                />
              </div>

              {/* Sample Prompts */}
              <div>
                <span className="text-[11px] font-semibold text-[#888888] uppercase tracking-wider block mb-1.5">
                  Try Sample Prompts
                </span>
                <div className="space-y-1.5">
                  {[
                    'Create a Monday to Saturday college timetable with 6 periods, 45-min lunch break at 1 PM, and computer science subjects.',
                    'Create a 5-day school timetable with 7 periods, morning assembly at 8:30, recess at 11, and lunch at 1 PM.',
                    'Create a 7-day fitness routine with Push, Pull, Legs split, morning cardio, and Sunday rest day.',
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAiPrompt(p)}
                      className="w-full text-left text-xs p-2 rounded-lg bg-[#181818] border border-[#262626] hover:border-[#c5a059]/40 hover:bg-[#202020] text-[#ededed] transition-colors truncate block"
                    >
                      "{p}"
                    </button>
                  ))}
                </div>
              </div>

              {aiError && (
                <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{aiError}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveMode('options')}
                  className="px-4 py-2 border border-[#2e2e2e] rounded-lg text-xs font-semibold text-[#a3a3a3] hover:text-[#ededed] hover:bg-[#1e1e1e]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAiGenerate}
                  disabled={aiLoading || !aiPrompt.trim()}
                  className="px-5 py-2 bg-[#c5a059] hover:bg-[#d4af37] disabled:opacity-40 text-[#0a0a0a] rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
                >
                  {aiLoading ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      Generating Timetable...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Generate Schedule
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* =====================================
              STEP-BY-STEP REQUIREMENT WIZARD (PRD 10-16)
             ===================================== */}
          {activeMode === 'wizard' && (
            <div className="space-y-4">
              {/* Wizard Steps indicator */}
              <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#c5a059] text-[#0a0a0a] font-bold text-xs flex items-center justify-center">
                    {wizardStep}
                  </span>
                  <span className="text-xs font-bold text-[#f5f5f5]">
                    {wizardStep === 1 && 'Step 1: Type & Institution'}
                    {wizardStep === 2 && 'Step 2: Days & Times'}
                    {wizardStep === 3 && 'Step 3: Breaks Configuration'}
                    {wizardStep === 4 && 'Step 4: Subjects & Frequencies'}
                  </span>
                </div>
                <span className="text-xs text-[#888888]">Step {wizardStep} of 4</span>
              </div>

              {/* Wizard Step 1: Type & Name */}
              {wizardStep === 1 && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-[#ededed] block mb-1">Timetable Name</label>
                    <input
                      type="text"
                      value={wizardName}
                      onChange={(e) => setWizardName(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-[#1a1a1a] border border-[#2e2e2e] text-[#ededed] rounded-lg focus:border-[#c5a059] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#ededed] block mb-1">
                      Institution / School Name
                    </label>
                    <input
                      type="text"
                      value={wizardInstitution}
                      onChange={(e) => setWizardInstitution(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-[#1a1a1a] border border-[#2e2e2e] text-[#ededed] rounded-lg focus:border-[#c5a059] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#ededed] block mb-1">Timetable Archetype</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {['college', 'school', 'university', 'study', 'work', 'workout', 'personal', 'custom'].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setWizardType(t as any)}
                          className={`p-2 rounded-lg border text-xs capitalize font-medium transition-all ${
                            wizardType === t
                              ? 'border-[#c5a059] bg-[#c5a059]/15 text-[#e0bf79] font-bold'
                              : 'border-[#262626] text-[#a3a3a3] hover:bg-[#1e1e1e]'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Wizard Step 2: Days & Working Hours */}
              {wizardStep === 2 && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-[#ededed] block mb-1">Operating Days</label>
                    <div className="flex flex-wrap gap-2">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                        const isSelected = wizardDays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                if (wizardDays.length > 1) {
                                  setWizardDays(wizardDays.filter((d) => d !== day));
                                }
                              } else {
                                setWizardDays([...wizardDays, day]);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                              isSelected
                                ? 'border-[#c5a059] bg-[#c5a059]/15 text-[#e0bf79] font-bold'
                                : 'border-[#262626] text-[#a3a3a3] hover:bg-[#1e1e1e]'
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="text-xs font-semibold text-[#ededed] block mb-1">Start Time</label>
                      <input
                        type="time"
                        value={wizardStartTime}
                        onChange={(e) => setWizardStartTime(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-[#1a1a1a] border border-[#2e2e2e] text-[#ededed] rounded-lg focus:border-[#c5a059]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#ededed] block mb-1">End Time</label>
                      <input
                        type="time"
                        value={wizardEndTime}
                        onChange={(e) => setWizardEndTime(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-[#1a1a1a] border border-[#2e2e2e] text-[#ededed] rounded-lg focus:border-[#c5a059]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#ededed] block mb-1">
                      Period Slot Duration
                    </label>
                    <select
                      value={wizardSlotDuration}
                      onChange={(e) => setWizardSlotDuration(Number(e.target.value))}
                      className="w-full text-xs px-3 py-2 bg-[#1a1a1a] border border-[#2e2e2e] text-[#ededed] rounded-lg focus:border-[#c5a059]"
                    >
                      <option value={45} className="bg-[#1a1a1a]">45 Minutes</option>
                      <option value={50} className="bg-[#1a1a1a]">50 Minutes</option>
                      <option value={60} className="bg-[#1a1a1a]">60 Minutes (1 Hour)</option>
                      <option value={90} className="bg-[#1a1a1a]">90 Minutes (1.5 Hours)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Wizard Step 3: Breaks */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  {/* Lunch Break */}
                  <div className="p-3 rounded-xl border border-[#262626] bg-[#181818] space-y-2.5">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-xs font-bold text-[#ededed]">Include Lunch Break</span>
                      <input
                        type="checkbox"
                        checked={wizardIncludeLunch}
                        onChange={(e) => setWizardIncludeLunch(e.target.checked)}
                        className="rounded accent-[#c5a059] w-4 h-4"
                      />
                    </label>

                    {wizardIncludeLunch && (
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="text-[11px] font-medium text-[#a3a3a3] block mb-1">
                            Lunch Starts
                          </label>
                          <input
                            type="time"
                            value={wizardLunchStart}
                            onChange={(e) => setWizardLunchStart(e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 border border-[#2e2e2e] rounded-lg bg-[#141414] text-[#ededed]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-medium text-[#a3a3a3] block mb-1">Lunch Ends</label>
                          <input
                            type="time"
                            value={wizardLunchEnd}
                            onChange={(e) => setWizardLunchEnd(e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 border border-[#2e2e2e] rounded-lg bg-[#141414] text-[#ededed]"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Short Break / Recess */}
                  <div className="p-3 rounded-xl border border-[#262626] bg-[#181818] space-y-2.5">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-xs font-bold text-[#ededed]">Include Short Break / Tea</span>
                      <input
                        type="checkbox"
                        checked={wizardIncludeBreak}
                        onChange={(e) => setWizardIncludeBreak(e.target.checked)}
                        className="rounded accent-[#c5a059] w-4 h-4"
                      />
                    </label>

                    {wizardIncludeBreak && (
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="text-[11px] font-medium text-[#a3a3a3] block mb-1">
                            Break Starts
                          </label>
                          <input
                            type="time"
                            value={wizardBreakStart}
                            onChange={(e) => setWizardBreakStart(e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 border border-[#2e2e2e] rounded-lg bg-[#141414] text-[#ededed]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-medium text-[#a3a3a3] block mb-1">Break Ends</label>
                          <input
                            type="time"
                            value={wizardBreakEnd}
                            onChange={(e) => setWizardBreakEnd(e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 border border-[#2e2e2e] rounded-lg bg-[#141414] text-[#ededed]"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Wizard Step 4: Subjects & Frequencies */}
              {wizardStep === 4 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#ededed]">Subjects to Schedule</span>
                    <span className="text-[11px] text-[#888888]">
                      Total: {wizardSubjects.reduce((acc, s) => acc + s.frequencyPerWeek, 0)} slots/week
                    </span>
                  </div>

                  {/* Existing Subjects List */}
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {wizardSubjects.map((s, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg border border-[#262626] bg-[#181818] flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                          <span className="font-semibold text-[#ededed] truncate">{s.name}</span>
                          <span className="text-[10px] text-[#888888] truncate">({s.teacher})</span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-mono text-[#a3a3a3]">
                            {s.frequencyPerWeek}x / wk
                          </span>
                          <button
                            type="button"
                            onClick={() => setWizardSubjects(wizardSubjects.filter((_, i) => i !== idx))}
                            className="text-[#737373] hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Subject Row */}
                  <div className="p-2.5 rounded-lg border border-[#262626] bg-[#181818] space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Subject name"
                        value={newWizardSubjName}
                        onChange={(e) => setNewWizardSubjName(e.target.value)}
                        className="text-xs px-2.5 py-1.5 bg-[#141414] border border-[#2e2e2e] text-[#ededed] rounded-lg focus:border-[#c5a059]"
                      />
                      <input
                        type="text"
                        placeholder="Teacher / Room"
                        value={newWizardSubjTeacher}
                        onChange={(e) => setNewWizardSubjTeacher(e.target.value)}
                        className="text-xs px-2.5 py-1.5 bg-[#141414] border border-[#2e2e2e] text-[#ededed] rounded-lg focus:border-[#c5a059]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!newWizardSubjName.trim()) return;
                        setWizardSubjects([
                          ...wizardSubjects,
                          {
                            name: newWizardSubjName.trim(),
                            shortCode: newWizardSubjName.slice(0, 4).toUpperCase(),
                            teacher: newWizardSubjTeacher.trim() || 'Staff',
                            room: 'Room 101',
                            frequencyPerWeek: 3,
                            color: '#dbeafe',
                          },
                        ]);
                        setNewWizardSubjName('');
                        setNewWizardSubjTeacher('');
                      }}
                      className="w-full py-1.5 bg-[#222222] hover:bg-[#2c2c2c] text-[#ededed] border border-[#2e2e2e] rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add Subject to Pool
                    </button>
                  </div>
                </div>
              )}

              {/* Wizard Navigation Footer */}
              <div className="pt-3 border-t border-[#262626] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    if (wizardStep === 1) setActiveMode('options');
                    else setWizardStep(wizardStep - 1);
                  }}
                  className="px-4 py-2 border border-[#2e2e2e] rounded-lg text-xs font-semibold text-[#a3a3a3] hover:text-[#ededed] hover:bg-[#1e1e1e] flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  {wizardStep === 1 ? 'Cancel' : 'Previous'}
                </button>

                {wizardStep < 4 ? (
                  <button
                    type="button"
                    onClick={() => setWizardStep(wizardStep + 1)}
                    className="px-5 py-2 bg-[#c5a059] hover:bg-[#d4af37] text-[#0a0a0a] rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs"
                  >
                    Next <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleWizardSubmit}
                    className="px-5 py-2 bg-[#c5a059] hover:bg-[#d4af37] text-[#0a0a0a] rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    Generate Timetable Now
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
