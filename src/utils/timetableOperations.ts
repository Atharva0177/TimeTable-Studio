import { Timetable, TimetableEntry } from '../types';
import { deduplicateCellEntries } from './conflictDetector';

export interface CopyDayOptions {
  sourceDayId: string;
  targetDayId: string;
  mode?: 'replace' | 'merge'; // 'replace' clears target day's existing sessions, 'merge' fills only empty slots
}

export interface CopyDayResult {
  updatedTimetable: Timetable;
  copiedCount: number;
  replacedCount: number;
}

/**
 * Copies all timetable sessions from sourceDayId to targetDayId.
 * - In 'replace' mode: any existing sessions on targetDay are removed and replaced by the copied source sessions.
 * - In 'merge' mode: source sessions are only copied into slots where targetDay does not already have a session.
 */
export function copyDayTimetable(
  timetable: Timetable,
  options: CopyDayOptions
): CopyDayResult {
  const { sourceDayId, targetDayId, mode = 'replace' } = options;
  const sourceEntries = timetable.entries.filter((e) => e.dayId === sourceDayId);

  if (sourceEntries.length === 0) {
    return { updatedTimetable: timetable, copiedCount: 0, replacedCount: 0 };
  }

  const existingTargetEntries = timetable.entries.filter((e) => e.dayId === targetDayId);
  const now = Date.now();

  let remainingEntries: TimetableEntry[];
  const newEntries: TimetableEntry[] = [];

  if (mode === 'replace') {
    // Remove existing target day entries
    remainingEntries = timetable.entries.filter((e) => e.dayId !== targetDayId);

    sourceEntries.forEach((entry, idx) => {
      newEntries.push({
        ...entry,
        id: `entry_${now}_${idx}_${Math.random().toString(36).slice(2, 7)}`,
        dayId: targetDayId,
      });
    });
  } else {
    // Merge mode: only add for slots where target day has no current entry
    const existingTargetSlotIds = new Set(existingTargetEntries.map((e) => e.slotId));
    remainingEntries = [...timetable.entries];

    sourceEntries.forEach((entry, idx) => {
      if (!existingTargetSlotIds.has(entry.slotId)) {
        newEntries.push({
          ...entry,
          id: `entry_${now}_${idx}_${Math.random().toString(36).slice(2, 7)}`,
          dayId: targetDayId,
        });
      }
    });
  }

  const updatedEntries = deduplicateCellEntries([...remainingEntries, ...newEntries]);

  const updatedTimetable: Timetable = {
    ...timetable,
    entries: updatedEntries,
    lastEdited: new Date().toISOString(),
  };

  return {
    updatedTimetable,
    copiedCount: newEntries.length,
    replacedCount: mode === 'replace' ? existingTargetEntries.length : 0,
  };
}

/**
 * Returns the day following the given currentDayId in the schedule order (wraps around to the first day).
 */
export function getNextDay<T extends { id: string; name: string }>(
  days: T[],
  currentDayId: string
): T | null {
  if (!days || days.length === 0) return null;
  const currentIndex = days.findIndex((d) => d.id === currentDayId);
  if (currentIndex === -1) return days[0];
  const nextIndex = (currentIndex + 1) % days.length;
  return days[nextIndex];
}
