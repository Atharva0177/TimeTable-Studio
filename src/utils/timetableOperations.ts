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

export interface SwapEntriesResult {
  updatedTimetable: Timetable;
  action: 'swapped' | 'moved' | 'none';
  sourceEntry: TimetableEntry;
  targetEntry?: TimetableEntry;
}

/**
 * Directly swaps positions between two timetable entries by their IDs.
 */
export function swapTwoEntries(
  timetable: Timetable,
  entryIdA: string,
  entryIdB: string
): SwapEntriesResult {
  const entryA = timetable.entries.find((e) => e.id === entryIdA);
  const entryB = timetable.entries.find((e) => e.id === entryIdB);
  if (!entryA || !entryB || entryIdA === entryIdB) {
    return { updatedTimetable: timetable, action: 'none', sourceEntry: entryA || (undefined as any) };
  }

  const dayA = entryA.dayId;
  const slotA = entryA.slotId;
  const dayB = entryB.dayId;
  const slotB = entryB.slotId;

  const otherEntries = timetable.entries.filter((e) => e.id !== entryIdA && e.id !== entryIdB);
  const updatedA: TimetableEntry = { ...entryA, dayId: dayB, slotId: slotB };
  const updatedB: TimetableEntry = { ...entryB, dayId: dayA, slotId: slotA };

  const cleanEntries = deduplicateCellEntries([...otherEntries, updatedA, updatedB]);
  return {
    updatedTimetable: {
      ...timetable,
      entries: cleanEntries,
      lastEdited: new Date().toISOString(),
    },
    action: 'swapped',
    sourceEntry: updatedA,
    targetEntry: updatedB,
  };
}

/**
 * Moves an existing entry to a new slot, or exchanges (swaps) positions with the entry occupying the target slot.
 */
export function moveOrSwapEntry(
  timetable: Timetable,
  sourceEntryId: string,
  targetDayId: string,
  targetSlotId: string
): SwapEntriesResult {
  const sourceEntry = timetable.entries.find((e) => e.id === sourceEntryId);
  if (!sourceEntry) {
    return { updatedTimetable: timetable, action: 'none', sourceEntry: undefined as any };
  }

  // If dropped on the exact same cell, do nothing
  if (sourceEntry.dayId === targetDayId && sourceEntry.slotId === targetSlotId) {
    return { updatedTimetable: timetable, action: 'none', sourceEntry };
  }

  // Find target cell's entry (if any)
  const targetEntries = timetable.entries.filter(
    (e) => e.dayId === targetDayId && e.slotId === targetSlotId && e.id !== sourceEntryId
  );
  const targetEntry = targetEntries.length > 0 ? targetEntries[targetEntries.length - 1] : undefined;

  if (targetEntry) {
    // Both cells have an entry -> Exchange / Swap them!
    return swapTwoEntries(timetable, sourceEntry.id, targetEntry.id);
  } else {
    // Target cell is empty -> Move source entry to target cell
    const otherEntries = timetable.entries.filter(
      (e) => e.id !== sourceEntry.id && !(e.dayId === targetDayId && e.slotId === targetSlotId)
    );
    const updatedSource: TimetableEntry = {
      ...sourceEntry,
      dayId: targetDayId,
      slotId: targetSlotId,
    };
    const cleanEntries = deduplicateCellEntries([...otherEntries, updatedSource]);
    return {
      updatedTimetable: {
        ...timetable,
        entries: cleanEntries,
        lastEdited: new Date().toISOString(),
      },
      action: 'moved',
      sourceEntry: updatedSource,
    };
  }
}
