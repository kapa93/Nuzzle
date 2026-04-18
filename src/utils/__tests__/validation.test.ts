import {
  signUpSchema,
  signInSchema,
  profileSchema,
  dogSchema,
  postSchema,
  commentSchema,
  meetupDetailsSchema,
} from '../validation';

describe('signUpSchema', () => {
  it('accepts valid credentials', () => {
    const result = signUpSchema.safeParse({ email: 'user@example.com', password: 'secret123' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = signUpSchema.safeParse({ email: 'not-an-email', password: 'secret123' });
    expect(result.success).toBe(false);
  });

  it('rejects password shorter than 6 characters', () => {
    const result = signUpSchema.safeParse({ email: 'user@example.com', password: '123' });
    expect(result.success).toBe(false);
  });
});

describe('signInSchema', () => {
  it('accepts valid credentials', () => {
    const result = signInSchema.safeParse({ email: 'user@example.com', password: 'any' });
    expect(result.success).toBe(true);
  });

  it('rejects empty password', () => {
    const result = signInSchema.safeParse({ email: 'user@example.com', password: '' });
    expect(result.success).toBe(false);
  });
});

describe('profileSchema', () => {
  it('accepts valid profile', () => {
    expect(profileSchema.safeParse({ name: 'Alice', city: 'San Diego' }).success).toBe(true);
    expect(profileSchema.safeParse({ name: 'Alice' }).success).toBe(true);
  });

  it('rejects empty name', () => {
    expect(profileSchema.safeParse({ name: '' }).success).toBe(false);
  });

  it('rejects name over 100 characters', () => {
    expect(profileSchema.safeParse({ name: 'a'.repeat(101) }).success).toBe(false);
  });
});

describe('dogSchema', () => {
  const validDog = {
    name: 'Koda',
    breed: 'AUSTRALIAN_SHEPHERD',
    age_group: 'ADULT',
    energy_level: 'HIGH',
  };

  it('accepts valid dog', () => {
    expect(dogSchema.safeParse(validDog).success).toBe(true);
  });

  it('rejects unknown breed', () => {
    expect(dogSchema.safeParse({ ...validDog, breed: 'UNICORN' }).success).toBe(false);
  });

  it('rejects invalid age_group', () => {
    expect(dogSchema.safeParse({ ...validDog, age_group: 'KITTEN' }).success).toBe(false);
  });

  it('rejects invalid energy_level', () => {
    expect(dogSchema.safeParse({ ...validDog, energy_level: 'EXTREME' }).success).toBe(false);
  });

  it('accepts valid optional fields', () => {
    expect(dogSchema.safeParse({ ...validDog, play_style: 'chase', dog_friendliness: 4 }).success).toBe(true);
  });

  it('rejects dog_friendliness out of range', () => {
    expect(dogSchema.safeParse({ ...validDog, dog_friendliness: 6 }).success).toBe(false);
    expect(dogSchema.safeParse({ ...validDog, dog_friendliness: 0 }).success).toBe(false);
  });
});

describe('postSchema', () => {
  const validPost = {
    content_text: 'Hello world',
    type: 'QUESTION',
    tag: 'TRAINING',
    breed: 'GOLDEN_RETRIEVER',
  };

  it('accepts valid post', () => {
    expect(postSchema.safeParse(validPost).success).toBe(true);
  });

  it('rejects empty content', () => {
    expect(postSchema.safeParse({ ...validPost, content_text: '' }).success).toBe(false);
  });

  it('rejects unknown type', () => {
    expect(postSchema.safeParse({ ...validPost, type: 'RANT' }).success).toBe(false);
  });

  it('requires meetup_details for MEETUP type', () => {
    const noDetails = postSchema.safeParse({ ...validPost, type: 'MEETUP' });
    expect(noDetails.success).toBe(false);
  });

  it('accepts MEETUP type with valid meetup_details', () => {
    const withDetails = postSchema.safeParse({
      ...validPost,
      type: 'MEETUP',
      meetup_details: { location_name: 'Fiesta Island', start_time: '2026-04-20T08:00:00Z' },
    });
    expect(withDetails.success).toBe(true);
  });
});

describe('commentSchema', () => {
  it('accepts valid comment', () => {
    expect(commentSchema.safeParse({ content: 'Nice post!' }).success).toBe(true);
  });

  it('rejects empty content', () => {
    expect(commentSchema.safeParse({ content: '' }).success).toBe(false);
  });

  it('rejects content over 2000 characters', () => {
    expect(commentSchema.safeParse({ content: 'a'.repeat(2001) }).success).toBe(false);
  });
});

describe('meetupDetailsSchema', () => {
  it('accepts valid meetup details', () => {
    const result = meetupDetailsSchema.safeParse({
      location_name: 'Dog Beach',
      start_time: '2026-04-20T08:00:00Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty location_name', () => {
    const result = meetupDetailsSchema.safeParse({
      location_name: '',
      start_time: '2026-04-20T08:00:00Z',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing start_time', () => {
    const result = meetupDetailsSchema.safeParse({ location_name: 'Dog Beach', start_time: '' });
    expect(result.success).toBe(false);
  });

  it('accepts optional nullable fields as null', () => {
    const result = meetupDetailsSchema.safeParse({
      location_name: 'Park',
      start_time: '2026-04-20T08:00:00Z',
      end_time: null,
      spots_available: null,
    });
    expect(result.success).toBe(true);
  });
});
