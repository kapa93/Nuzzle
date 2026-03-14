import { supabase } from '@/lib/supabase';

export async function rsvpMeetup(meetupPostId: string, userId: string): Promise<void> {
  const { error } = await supabase.from('meetup_rsvps').insert({
    meetup_post_id: meetupPostId,
    user_id: userId,
  });
  if (error) {
    // Ignore duplicate key (user already RSVP'd)
    if (error.code === '23505') return;
    throw error;
  }
}

export async function unrsvpMeetup(meetupPostId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('meetup_rsvps')
    .delete()
    .eq('meetup_post_id', meetupPostId)
    .eq('user_id', userId);
  if (error) throw error;
}
