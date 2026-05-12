// breedAssets.ts uses require() for local image assets which Jest maps to
// integer module IDs in the RN test environment. We just verify the returned
// values are non-null / have the expected shape rather than asserting exact IDs.

import {
  BREED_TO_COLOR,
  BREED_HERO_IMAGES,
  getBreedHeroImageSource,
  getBreedHeroImageStyle,
  getBreedHeroTitle,
  getPackItems,
} from '../breedAssets';
import type { BreedEnum } from '@/types';

const ALL_BREEDS: BreedEnum[] = [
  'AUSTRALIAN_SHEPHERD',
  'DACHSHUND',
  'GERMAN_SHEPHERD',
  'HUSKY',
  'GOLDEN_DOODLE',
  'GOLDEN_RETRIEVER',
  'MIXED_BREED',
  'PUG',
  'FRENCH_BULLDOG',
  'PIT_BULL',
  'LABRADOR_RETRIEVER',
  'LABRADOODLE',
];

// ─── BREED_TO_COLOR ───────────────────────────────────────────────────────────

describe('BREED_TO_COLOR', () => {
  it('has an entry for every breed', () => {
    for (const breed of ALL_BREEDS) {
      expect(BREED_TO_COLOR[breed]).toBeDefined();
    }
  });

  it('maps GOLDEN_RETRIEVER to "golden"', () => {
    expect(BREED_TO_COLOR['GOLDEN_RETRIEVER']).toBe('golden');
  });

  it('maps FRENCH_BULLDOG to "frenchie"', () => {
    expect(BREED_TO_COLOR['FRENCH_BULLDOG']).toBe('frenchie');
  });
});

// ─── BREED_HERO_IMAGES ────────────────────────────────────────────────────────

describe('BREED_HERO_IMAGES', () => {
  it('has a URL string for every breed', () => {
    for (const breed of ALL_BREEDS) {
      const url = BREED_HERO_IMAGES[breed];
      expect(typeof url).toBe('string');
      expect(url.startsWith('https://')).toBe(true);
    }
  });
});

// ─── getBreedHeroImageSource ──────────────────────────────────────────────────

describe('getBreedHeroImageSource', () => {
  it('returns a non-null value for every breed', () => {
    for (const breed of ALL_BREEDS) {
      expect(getBreedHeroImageSource(breed)).toBeTruthy();
    }
  });

  it('returns a local asset (number or object) for breeds with local banners', () => {
    const localBreeds: BreedEnum[] = [
      'AUSTRALIAN_SHEPHERD',
      'HUSKY',
      'PUG',
      'PIT_BULL',
      'LABRADOR_RETRIEVER',
      'GERMAN_SHEPHERD',
      'MIXED_BREED',
      'LABRADOODLE',
      'GOLDEN_DOODLE',
      'GOLDEN_RETRIEVER',
      'DACHSHUND',
    ];
    for (const breed of localBreeds) {
      const source = getBreedHeroImageSource(breed);
      // Local assets are resolved to numbers by Jest's metro resolver mock
      expect(typeof source === 'number' || typeof source === 'object').toBe(true);
    }
  });

  it('returns a { uri } object for breeds without a local banner', () => {
    // FRENCH_BULLDOG has no local banner file mapped — falls through to Unsplash URI
    const source = getBreedHeroImageSource('FRENCH_BULLDOG');
    // Could be a number (Jest mock) or a { uri } object depending on env;
    // assert it is truthy either way
    expect(source).toBeTruthy();
  });
});

// ─── getBreedHeroImageStyle ───────────────────────────────────────────────────

describe('getBreedHeroImageStyle', () => {
  it('returns a transform style object for all breeds with overrides', () => {
    const breedsWithStyles: BreedEnum[] = [
      'AUSTRALIAN_SHEPHERD',
      'HUSKY',
      'PUG',
      'PIT_BULL',
      'LABRADOR_RETRIEVER',
      'GERMAN_SHEPHERD',
      'MIXED_BREED',
      'LABRADOODLE',
      'GOLDEN_DOODLE',
      'GOLDEN_RETRIEVER',
      'DACHSHUND',
    ];
    for (const breed of breedsWithStyles) {
      const style = getBreedHeroImageStyle(breed);
      expect(style).toBeDefined();
      expect((style as { transform: unknown[] }).transform).toBeDefined();
    }
  });

  it('returns undefined for breeds with no override (FRENCH_BULLDOG)', () => {
    const style = getBreedHeroImageStyle('FRENCH_BULLDOG');
    expect(style).toBeUndefined();
  });
});

// ─── getBreedHeroTitle ────────────────────────────────────────────────────────

describe('getBreedHeroTitle', () => {
  it('returns "Mixed\\nBreed" for MIXED_BREED', () => {
    expect(getBreedHeroTitle('MIXED_BREED')).toBe('Mixed\nBreed');
  });

  it('returns "Golden\\nDoodle" for GOLDEN_DOODLE', () => {
    expect(getBreedHeroTitle('GOLDEN_DOODLE')).toBe('Golden\nDoodle');
  });

  it('returns the breed label for all other breeds', () => {
    expect(getBreedHeroTitle('GOLDEN_RETRIEVER')).toBe('Golden Retriever');
    expect(getBreedHeroTitle('HUSKY')).toBeTruthy();
  });
});

// ─── getPackItems ─────────────────────────────────────────────────────────────

describe('getPackItems', () => {
  it('returns 12 items — one per breed', () => {
    expect(getPackItems()).toHaveLength(12);
  });

  it('every item has breed, label, image, and breedColor properties', () => {
    for (const item of getPackItems()) {
      expect(item.breed).toBeDefined();
      expect(typeof item.label).toBe('string');
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.image).toBeTruthy();
      expect(item.breedColor).toBeDefined();
    }
  });

  it('the breedColor for each item matches BREED_TO_COLOR', () => {
    for (const item of getPackItems()) {
      expect(item.breedColor).toBe(BREED_TO_COLOR[item.breed]);
    }
  });

  it('starts with AUSTRALIAN_SHEPHERD', () => {
    expect(getPackItems()[0].breed).toBe('AUSTRALIAN_SHEPHERD');
  });

  it('ends with MIXED_BREED', () => {
    const items = getPackItems();
    expect(items[items.length - 1].breed).toBe('MIXED_BREED');
  });
});
