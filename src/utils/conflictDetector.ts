import { Timetable, ConflictIssue, TimetableEntry } from '../types';

/**
 * Ensures strictly one entry per (dayId, slotId) by keeping ONLY the latest selected/added entry.
 * Resolves overlapping duplicates cleanly across all views.
 */
export function deduplicateCellEntries(entries: TimetableEntry[]): TimetableEntry[] {
  if (!entries || entries.length === 0) return [];
  const map = new Map<string, TimetableEntry>();
  for (const entry of entries) {
    // Later entries in array will overwrite earlier ones, guaranteeing only the latest selected is kept
    map.set(`${entry.dayId}___${entry.slotId}`, entry);
  }
  return Array.from(map.values());
}

export function detectConflicts(timetable: Timetable): ConflictIssue[] {
  const issues: ConflictIssue[] = [];

  // Group entries by day and slot
  const cellMap = new Map<string, typeof timetable.entries>();

  for (const entry of timetable.entries) {
    const key = `${entry.dayId}___${entry.slotId}`;
    const current = cellMap.get(key) || [];
    current.push(entry);
    cellMap.set(key, current);
  }

  // 1. Check for slot overlaps (multiple entries in the same day and slot)
  cellMap.forEach((entriesInCell, key) => {
    if (entriesInCell.length > 1) {
      const [dayId, slotId] = key.split('___');
      const day = timetable.days.find((d) => d.id === dayId)?.name || dayId;
      const slot = timetable.timeSlots.find((s) => s.id === slotId)?.name || slotId;
      const titles = entriesInCell.map((e) => e.title).join(', ');

      issues.push({
        id: `overlap_${key}`,
        type: 'overlap',
        dayId,
        slotId,
        entryIds: entriesInCell.map((e) => e.id),
        message: `Multiple activities scheduled simultaneously on ${day} during ${slot}: ${titles}`,
      });
    }
  });

  // 2. Check for teacher conflicts (same teacher scheduled in multiple places at the same time slot across different days or double booked)
  // Check within each slot across the timetable
  for (const slot of timetable.timeSlots) {
    for (const day of timetable.days) {
      const entriesForDaySlot = timetable.entries.filter(
        (e) => e.dayId === day.id && e.slotId === slot.id && e.teacher && e.teacher.trim() !== ''
      );

      const teacherMap = new Map<string, string[]>();
      for (const entry of entriesForDaySlot) {
        if (!entry.teacher) continue;
        const normalized = entry.teacher.trim().toLowerCase();
        const ids = teacherMap.get(normalized) || [];
        ids.push(entry.id);
        teacherMap.set(normalized, ids);
      }

      teacherMap.forEach((ids, teacherName) => {
        if (ids.length > 1) {
          issues.push({
            id: `teacher_${day.id}_${slot.id}_${teacherName}`,
            type: 'teacher',
            dayId: day.id,
            slotId: slot.id,
            entryIds: ids,
            message: `Instructor "${entriesForDaySlot.find((e) => e.teacher?.toLowerCase() === teacherName)?.teacher}" is assigned to multiple classes at ${slot.name} on ${day.name}.`,
          });
        }
      });
    }
  }

  // 3. Check for room conflicts (same room occupied twice in same day and slot)
  for (const slot of timetable.timeSlots) {
    for (const day of timetable.days) {
      const entriesForDaySlot = timetable.entries.filter(
        (e) => e.dayId === day.id && e.slotId === slot.id && e.room && e.room.trim() !== ''
      );

      const roomMap = new Map<string, string[]>();
      for (const entry of entriesForDaySlot) {
        if (!entry.room) continue;
        const normalized = entry.room.trim().toLowerCase();
        const ids = roomMap.get(normalized) || [];
        ids.push(entry.id);
        roomMap.set(normalized, ids);
      }

      roomMap.forEach((ids, roomName) => {
        if (ids.length > 1) {
          issues.push({
            id: `room_${day.id}_${slot.id}_${roomName}`,
            type: 'room',
            dayId: day.id,
            slotId: slot.id,
            entryIds: ids,
            message: `Room "${entriesForDaySlot.find((e) => e.room?.toLowerCase() === roomName)?.room}" has conflicting bookings during ${slot.name} on ${day.name}.`,
          });
        }
      });
    }
  }

  return issues;
}
