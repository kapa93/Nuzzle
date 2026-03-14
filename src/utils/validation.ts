import { z } from 'zod';
import { BREEDS, MEETUP_KINDS, POST_TAGS, POST_TYPES } from './breed';

export const meetupDetailsSchema = z.object({
  location_name: z.string().min(1, 'Location is required').max(200),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().optional().nullable(),
  meetup_kind: z.enum(MEETUP_KINDS as unknown as [string, ...string[]]).optional().nullable(),
  spots_available: z.number().int().positive().optional().nullable(),
  host_notes: z.string().max(500).optional().nullable(),
});

export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const profileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  city: z.string().max(100).optional(),
});

export const dogSchema = z.object({
  name: z.string().min(1, 'Dog name is required').max(50),
  breed: z.enum(BREEDS as unknown as [string, ...string[]]),
  age_group: z.enum(['PUPPY', 'ADOLESCENT', 'ADULT', 'SENIOR']),
  energy_level: z.enum(['LOW', 'MED', 'HIGH']),
  dog_friendliness: z.number().int().min(1).max(5).optional().nullable(),
  play_style: z.enum(['gentle', 'chase', 'wrestle', 'independent', 'mixed']).optional().nullable(),
  good_with_puppies: z.enum(['yes', 'no', 'unsure']).optional().nullable(),
  good_with_large_dogs: z.enum(['yes', 'no', 'unsure']).optional().nullable(),
  good_with_small_dogs: z.enum(['yes', 'no', 'unsure']).optional().nullable(),
  temperament_notes: z.string().max(240).optional().nullable(),
});

export const postSchema = z.object({
  content_text: z.string().min(1, 'Content is required').max(5000),
  type: z.enum(POST_TYPES as unknown as [string, ...string[]]),
  tag: z.enum(POST_TAGS as unknown as [string, ...string[]]),
  breed: z.enum(BREEDS as unknown as [string, ...string[]]),
  title: z.string().optional(),
  meetup_details: meetupDetailsSchema.optional(),
}).refine(
  (data) => {
    if (data.type !== 'MEETUP') return true;
    return data.meetup_details != null;
  },
  { message: 'Meetup posts require location and date/time', path: ['meetup_details'] }
);

export const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(2000),
});
