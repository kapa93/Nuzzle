import type { BreedEnum, PostTypeEnum, PostTagEnum, ReactionEnum } from '../types';
import {
  BREED_LABELS,
  BREEDS,
  POST_TAG_LABELS,
  POST_TAGS,
  POST_TYPE_LABELS,
  POST_TYPES,
  REACTIONS,
} from '../types';

export { BREED_LABELS, BREEDS, POST_TAG_LABELS, POST_TAGS, POST_TYPE_LABELS, POST_TYPES, REACTIONS };

export const REACTION_EMOJI: Record<ReactionEnum, string> = {
  LIKE: '👍',
  LOVE: '❤️',
  HAHA: '😂',
  WOW: '😮',
  SAD: '😢',
  ANGRY: '😡',
};

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export const AGE_GROUPS = ['PUPPY', 'ADOLESCENT', 'ADULT', 'SENIOR'] as const;
export const AGE_GROUP_LABELS: Record<string, string> = {
  PUPPY: 'Puppy',
  ADOLESCENT: 'Adolescent',
  ADULT: 'Adult',
  SENIOR: 'Senior',
};

export const ENERGY_LEVELS = ['LOW', 'MED', 'HIGH'] as const;
export const ENERGY_LEVEL_LABELS: Record<string, string> = {
  LOW: 'Low',
  MED: 'Medium',
  HIGH: 'High',
};
