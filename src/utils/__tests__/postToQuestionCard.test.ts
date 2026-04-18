import { postToQuestionCardData, tagTone } from '../postToQuestionCard';
import type { PostWithDetails } from '@/types';

const makePost = (overrides: Partial<PostWithDetails> = {}): PostWithDetails => ({
  id: 'post-1',
  author_id: 'user-1',
  author_name: 'Alice Smith',
  author_dog_name: 'Koda',
  author_dog_image_url: 'https://example.com/koda.jpg',
  breed: 'AUSTRALIAN_SHEPHERD',
  type: 'QUESTION',
  tag: 'TRAINING',
  content_text: 'Any training tips?',
  title: null,
  images: [],
  created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  updated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  comment_count: 3,
  reaction_counts: { LIKE: 2, LOVE: 1, HAHA: 0, WOW: 0, SAD: 0, ANGRY: 0 },
  user_reaction: null,
  ...overrides,
} as PostWithDetails);

describe('postToQuestionCardData', () => {
  it('maps basic fields correctly', () => {
    const post = makePost();
    const card = postToQuestionCardData(post);

    expect(card.id).toBe('post-1');
    expect(card.authorId).toBe('user-1');
    expect(card.author).toBe('Alice & Koda');
    expect(card.authorMeta).toBe('5m ago');
    expect(card.authorAvatarUri).toBe('https://example.com/koda.jpg');
  });

  it('sets hasTitle false when title is null', () => {
    const card = postToQuestionCardData(makePost({ title: null }));
    expect(card.hasTitle).toBe(false);
    expect(card.title).toBe('');
    expect(card.preview).toBeUndefined();
  });

  it('sets hasTitle true and preview to content when title is provided', () => {
    const post = makePost({ title: 'My Title', content_text: 'Body text' });
    const card = postToQuestionCardData(post);
    expect(card.hasTitle).toBe(true);
    expect(card.title).toBe('My Title');
    expect(card.preview).toBe('Body text');
  });

  it('maps reaction counts correctly', () => {
    const card = postToQuestionCardData(makePost());
    expect(card.likeCount).toBe(2);
    expect(card.loveCount).toBe(1);
    expect(card.hahaCount).toBe(0);
  });

  it('defaults reaction counts to 0 when absent', () => {
    const card = postToQuestionCardData(makePost({ reaction_counts: undefined }));
    expect(card.likeCount).toBe(0);
    expect(card.loveCount).toBe(0);
    expect(card.hahaCount).toBe(0);
  });

  it('maps comment_count to answerCount', () => {
    const card = postToQuestionCardData(makePost({ comment_count: 7 }));
    expect(card.answerCount).toBe(7);
  });

  it('defaults answerCount to 0 when comment_count is null/undefined', () => {
    const card = postToQuestionCardData(makePost({ comment_count: undefined }));
    expect(card.answerCount).toBe(0);
  });

  it('passes through images array', () => {
    const images = ['https://example.com/img.jpg'];
    const card = postToQuestionCardData(makePost({ images }));
    expect(card.images).toEqual(images);
  });
});

describe('tagTone', () => {
  it('maps all PostTagEnum values', () => {
    const expectedKeys = [
      'TRAINING', 'BEHAVIOR', 'HEALTH', 'GROOMING', 'FOOD',
      'GEAR', 'PUPPY', 'ADOLESCENT', 'ADULT', 'SENIOR', 'PLAYDATE',
    ];
    expectedKeys.forEach((key) => {
      expect(tagTone).toHaveProperty(key);
      expect(typeof tagTone[key as keyof typeof tagTone]).toBe('string');
    });
  });
});
