import { GeneratorRequirements, Timetable, TimeSlotConfig, DayConfig, TimetableEntry } from '../types';
import { PRESET_THEMES } from '../data/presets';

// Helper to format 24-hr time into HH:MM
function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function parseTimeToMinutes(timeStr: string): number {
  const parts = timeStr.split(':');
  if (parts.length < 2) return 540; // default 9:00
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

export function generateTimetableFromRequirements(req: GeneratorRequirements): {
  timetable: Timetable;
  warnings: string[];
} {
  const warnings: string[] = [];

  // 1. Build Day list
  const days: DayConfig[] = req.days.map((dayName, idx) => {
    const id = `day_${idx}_${dayName.toLowerCase().slice(0, 3)}`;
    return {
      id,
      name: dayName,
      shortName: dayName.slice(0, 3),
    };
  });

  // 2. Build Time Slots and Breaks
  const startMin = parseTimeToMinutes(req.startTime);
  const endMin = parseTimeToMinutes(req.endTime);
  const slotDuration = req.slotDurationMinutes || 60;
  const lunchStart = req.includeLunch ? parseTimeToMinutes(req.lunchStart) : -1;
  const lunchEnd = req.includeLunch ? parseTimeToMinutes(req.lunchEnd) : -1;
  const breakStart = req.includeShortBreak && req.breakStart ? parseTimeToMinutes(req.breakStart) : -1;
  const breakEnd = req.includeShortBreak && req.breakEnd ? parseTimeToMinutes(req.breakEnd) : -1;

  const timeSlots: TimeSlotConfig[] = [];
  let currentMin = startMin;
  let periodIndex = 1;

  while (currentMin + slotDuration <= endMin + 15) {
    // Check if a short break fits here
    if (
      breakStart > 0 &&
      breakEnd > breakStart &&
      currentMin >= breakStart &&
      !timeSlots.some((s) => s.breakType === 'tea' || s.breakType === 'recess')
    ) {
      timeSlots.push({
        id: `slot_break_${timeSlots.length}`,
        name: 'Short Break',
        start: formatTime(breakStart),
        end: formatTime(breakEnd),
        isBreak: true,
        breakType: 'recess',
      });
      currentMin = breakEnd;
      continue;
    }

    // Check if lunch break fits here
    if (
      lunchStart > 0 &&
      lunchEnd > lunchStart &&
      currentMin >= lunchStart &&
      !timeSlots.some((s) => s.breakType === 'lunch')
    ) {
      timeSlots.push({
        id: `slot_lunch_${timeSlots.length}`,
        name: 'Lunch Break',
        start: formatTime(lunchStart),
        end: formatTime(lunchEnd),
        isBreak: true,
        breakType: 'lunch',
      });
      currentMin = lunchEnd;
      continue;
    }

    // Regular class period
    const slotEnd = Math.min(currentMin + slotDuration, endMin);
    timeSlots.push({
      id: `slot_p${periodIndex}`,
      name: `Period ${periodIndex}`,
      start: formatTime(currentMin),
      end: formatTime(slotEnd),
      isBreak: false,
    });
    periodIndex++;
    currentMin = slotEnd;

    if (currentMin >= endMin) break;
  }

  // Filter regular non-break slots for scheduling activities
  const teachingSlots = timeSlots.filter((s) => !s.isBreak);
  const totalAvailableCells = days.length * teachingSlots.length;

  // 3. Prepare Activities Pool
  interface ActivityItem {
    name: string;
    shortCode?: string;
    teacher?: string;
    room?: string;
    color: string;
    icon?: string;
    category?: string;
    priority?: 'high' | 'normal';
  }

  const activityQueue: ActivityItem[] = [];
  for (const subj of req.subjects) {
    const count = Math.max(1, subj.frequencyPerWeek || 1);
    for (let i = 0; i < count; i++) {
      activityQueue.push({
        name: subj.name,
        shortCode: subj.shortCode || subj.name.slice(0, 4).toUpperCase(),
        teacher: subj.teacher || '',
        room: subj.room || '',
        color: subj.color,
        icon: subj.icon || 'BookOpen',
        category: subj.category || 'General',
        priority: subj.priority || 'normal',
      });
    }
  }

  if (activityQueue.length > totalAvailableCells) {
    warnings.push(
      `Total requested activity periods (${activityQueue.length}) exceeds available weekly slots (${totalAvailableCells}). Some activities will be trimmed to fit.`
    );
  }

  // 4. Constraint Solver: Distribute items evenly
  // Sort priority first
  activityQueue.sort((a, b) => (b.priority === 'high' ? 1 : 0) - (a.priority === 'high' ? 1 : 0));

  const entries: TimetableEntry[] = [];
  const cellOccupied = new Map<string, boolean>();

  // Track subject distribution per day so that the same subject is not crowded on a single day
  const subjectDayCount = new Map<string, number>();

  let activityIndex = 0;

  // Iterate over teaching slots (morning periods first for high priority)
  for (let sIdx = 0; sIdx < teachingSlots.length; sIdx++) {
    const slot = teachingSlots[sIdx];

    for (let dIdx = 0; dIdx < days.length; dIdx++) {
      const day = days[dIdx];
      const cellKey = `${day.id}___${slot.id}`;

      if (activityIndex >= activityQueue.length) {
        break;
      }

      // Find an activity suitable for this day (avoid same subject twice in one day if possible)
      let selectedIdx = -1;
      for (let i = 0; i < activityQueue.length; i++) {
        const item = activityQueue[i];
        const daySubjKey = `${day.id}___${item.name}`;
        const currentCountOnDay = subjectDayCount.get(daySubjKey) || 0;

        // If high frequency subject or only few subjects, allow 2 max per day
        const maxPerDay = req.subjects.length <= 3 ? 2 : 1;
        if (currentCountOnDay < maxPerDay) {
          selectedIdx = i;
          break;
        }
      }

      // Fallback to first available if constraint is too tight
      if (selectedIdx === -1) {
        selectedIdx = 0;
      }

      const chosen = activityQueue.splice(selectedIdx, 1)[0];
      const daySubjKey = `${day.id}___${chosen.name}`;
      subjectDayCount.set(daySubjKey, (subjectDayCount.get(daySubjKey) || 0) + 1);

      entries.push({
        id: `gen_entry_${Date.now()}_${entries.length}`,
        dayId: day.id,
        slotId: slot.id,
        title: chosen.name,
        shortCode: chosen.shortCode,
        teacher: chosen.teacher,
        room: chosen.room,
        color: chosen.color,
        icon: chosen.icon,
        category: chosen.category,
      });

      cellOccupied.set(cellKey, true);
    }
  }

  // 5. Build Theme
  const theme = PRESET_THEMES.find((t) => t.id === 'academic') || PRESET_THEMES[0];

  const timetable: Timetable = {
    id: `tt_${Date.now()}`,
    name: req.name || 'Custom Generated Timetable',
    description: `Generated for ${req.type} with ${days.length} days and ${timeSlots.length} periods.`,
    type: req.type,
    tags: [`#${req.type}`, '#generated', '#2026'],
    lastEdited: new Date().toISOString(),
    institutionName: req.institution || 'My Institution',
    subTitle: `${req.type.toUpperCase()} TIMETABLE • ${days[0]?.name || 'Mon'} - ${days[days.length - 1]?.name || 'Fri'}`,
    academicYear: 'Academic Session 2026-2027',
    days,
    timeSlots,
    entries,
    theme,
  };

  return { timetable, warnings };
}
