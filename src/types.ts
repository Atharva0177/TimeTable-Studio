export type TimetableType =
  | 'school'
  | 'college'
  | 'university'
  | 'study'
  | 'work'
  | 'personal'
  | 'workout'
  | 'custom';

export type LayoutMode = 'grid' | 'daily' | 'vertical' | 'calendar' | 'print';

export type DeviceView = 'desktop' | 'tablet' | 'mobile';

export interface DayConfig {
  id: string;
  name: string;
  shortName: string;
}

export interface TimeSlotConfig {
  id: string;
  name: string; // e.g., "Period 1", "Lunch Break"
  start: string; // "09:00"
  end: string; // "10:00"
  isBreak?: boolean;
  breakType?: 'lunch' | 'tea' | 'recess' | 'free' | 'custom';
}

export interface CellStyle {
  background?: string;
  textColor?: string;
  borderColor?: string;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
  borderRadius?: number;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right';
  opacity?: number;
}

export interface TimetableEntry {
  id: string;
  dayId: string;
  slotId: string;
  title: string;
  shortCode?: string;
  teacher?: string;
  room?: string;
  category?: string;
  icon?: string;
  color: string;
  textColor?: string;
  isBreak?: boolean;
  breakLabel?: string;
  notes?: string;
  style?: CellStyle;
}

export interface ThemeConfig {
  id: string;
  name: string;
  fontFamily: string;
  headingFont: string;
  primaryColor: string;
  backgroundColor: string;
  cardBackground: string;
  headerBackground: string;
  headerTextColor: string;
  timeColumnBackground: string;
  timeColumnTextColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  borderStyle: 'solid' | 'dashed' | 'dotted' | 'none';
  cellPadding: number;
  cellHeight: number;
  cellWidth: number;
  showIcons: boolean;
  showTeacher: boolean;
  showRoom: boolean;
  showTime: boolean;
  cardShadow: 'none' | 'sm' | 'md' | 'lg';
  showLegend: boolean;
}

export interface Timetable {
  id: string;
  name: string;
  description?: string;
  type: TimetableType;
  tags: string[];
  lastEdited: string;
  institutionName?: string;
  subTitle?: string;
  academicYear?: string;
  logoUrl?: string;
  footerNotes?: string;
  days: DayConfig[];
  timeSlots: TimeSlotConfig[];
  entries: TimetableEntry[];
  theme: ThemeConfig;
  notes?: string;
  customBadges?: Array<{ id: string; label: string; color?: string }>;
}

export interface ConflictIssue {
  id: string;
  type: 'teacher' | 'room' | 'overlap';
  dayId: string;
  slotId: string;
  entryIds: string[];
  message: string;
}

export interface GeneratorRequirements {
  type: TimetableType;
  name: string;
  institution?: string;
  days: string[]; // e.g. ["Monday", "Tuesday", ...]
  startTime: string; // "08:00"
  endTime: string; // "16:00"
  slotDurationMinutes: number; // 45, 60
  includeLunch: boolean;
  lunchStart: string;
  lunchEnd: string;
  includeShortBreak: boolean;
  breakStart?: string;
  breakEnd?: string;
  subjects: Array<{
    name: string;
    shortCode?: string;
    teacher?: string;
    room?: string;
    frequencyPerWeek: number;
    color: string;
    icon?: string;
    category?: string;
    priority?: 'high' | 'normal';
  }>;
  hardConstraints?: string[];
  softConstraints?: string[];
}
