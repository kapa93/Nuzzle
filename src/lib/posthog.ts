import PostHog from 'posthog-react-native';

const apiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? '';

export const posthog = new PostHog(apiKey, {
  host: 'https://us.i.posthog.com',
  disabled: !apiKey,
  captureAppLifecycleEvents: true,
});

export type NuzzleEvents = {
  sign_up_completed: { method: 'email' | 'apple' | 'google' };
  onboarding_started: Record<string, never>;
  onboarding_skipped: Record<string, never>;
  onboarding_completed: { added_dog: boolean };
  create_post_opened: { trigger: 'tab' | 'home_prompt' | 'meetup_prompt' };
  create_post_type_selected: { type: string };
  create_post_submitted: { type: string; has_image: boolean; has_place: boolean; breed: string };
  post_viewed: { post_type: string; source?: string };
  post_reaction_added: { reaction_type: string; post_type: string };
  post_comment_added: { post_type: string };
  post_reported: { post_type: string };
  meetup_rsvp: { action: 'rsvp' | 'cancel' };
  place_checkin_completed: { place_name: string; dog_count: number };
  met_this_dog_tapped: { source_type: string };
};

export function track<K extends keyof NuzzleEvents>(event: K, properties: NuzzleEvents[K]): void {
  posthog.capture(event, properties as Record<string, string | number | boolean | null>);
}
