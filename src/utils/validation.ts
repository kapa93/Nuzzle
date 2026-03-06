import { z } from 'zod';
import { BREEDS, POST_TAGS, POST_TYPES } from './breed';

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
});

export const postSchema = z.object({
  content_text: z.string().min(1, 'Content is required').max(5000),
  type: z.enum(POST_TYPES as unknown as [string, ...string[]]),
  tag: z.enum(POST_TAGS as unknown as [string, ...string[]]),
  breed: z.enum(BREEDS as unknown as [string, ...string[]]),
});

export const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(2000),
});
