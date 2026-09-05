import React from 'react';
import * as LucideIcons from 'lucide-react';

interface IconRendererProps {
  name?: string;
  className?: string;
  size?: number;
}

export const IconRenderer: React.FC<IconRendererProps> = ({ name, className = 'w-4 h-4', size = 16 }) => {
  if (!name) return null;

  // Find icon in LucideIcons
  const IconComponent = (LucideIcons as Record<string, any>)[name];

  if (!IconComponent) {
    // Fallback default
    return <LucideIcons.BookOpen className={className} size={size} />;
  }

  return <IconComponent className={className} size={size} />;
};

export const COMMON_ICONS = [
  // Education
  { name: 'BookOpen', label: 'Book / Lecture', category: 'Education' },
  { name: 'Calculator', label: 'Math', category: 'Education' },
  { name: 'Cpu', label: 'Tech / CS', category: 'Education' },
  { name: 'Database', label: 'Database', category: 'Education' },
  { name: 'Network', label: 'Networking', category: 'Education' },
  { name: 'Code', label: 'Programming', category: 'Education' },
  { name: 'Terminal', label: 'Lab', category: 'Education' },
  { name: 'Atom', label: 'Physics / Science', category: 'Education' },
  { name: 'FlaskConical', label: 'Chemistry Lab', category: 'Education' },
  { name: 'Library', label: 'Library', category: 'Education' },
  { name: 'GraduationCap', label: 'Exam / Evaluation', category: 'Education' },

  // Work & Productivity
  { name: 'Briefcase', label: 'Work', category: 'Work' },
  { name: 'Users', label: 'Meeting / Sync', category: 'Work' },
  { name: 'Mail', label: 'Email / Comms', category: 'Work' },
  { name: 'Presentation', label: 'Presentation', category: 'Work' },
  { name: 'FileText', label: 'Documentation', category: 'Work' },
  { name: 'Zap', label: 'Deep Focus', category: 'Work' },
  { name: 'CheckSquare', label: 'Tasks', category: 'Work' },
  { name: 'Rocket', label: 'Launch / Release', category: 'Work' },

  // Fitness & Health
  { name: 'Dumbbell', label: 'Gym / Weights', category: 'Fitness' },
  { name: 'Activity', label: 'Cardio / Sport', category: 'Fitness' },
  { name: 'Flame', label: 'HIIT', category: 'Fitness' },
  { name: 'Footprints', label: 'Walk / Steps', category: 'Fitness' },
  { name: 'Heart', label: 'Health', category: 'Fitness' },
  { name: 'Sun', label: 'Yoga / Morning', category: 'Fitness' },

  // Breaks & Lifestyle
  { name: 'Coffee', label: 'Coffee / Tea', category: 'Personal' },
  { name: 'Utensils', label: 'Lunch / Meal', category: 'Personal' },
  { name: 'Smile', label: 'Free Time', category: 'Personal' },
  { name: 'Music', label: 'Music / Break', category: 'Personal' },
  { name: 'Moon', label: 'Sleep / Rest', category: 'Personal' },
];
