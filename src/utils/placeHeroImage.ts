import type { ImageSourcePropType } from 'react-native';
import type { Place } from '@/types';

const FIESTA_ISLAND_HERO_IMAGE = require('../../assets/banners/fiesta-island.jpg');
const OB_DOG_BEACH_HERO_IMAGE = require('../../assets/banners/ob-dogbeach.jpg');

/**
 * Returns the bundled hero image for a place, or null if the place only has
 * remote (Google) photos or no photos at all.
 */
export function getPlaceHeroImage(place: Place): ImageSourcePropType | null {
  const slug = place.slug.toLowerCase();
  const name = place.name.toLowerCase();
  if (slug.includes('fiesta-island') || name.includes('fiesta island')) {
    return FIESTA_ISLAND_HERO_IMAGE;
  }
  if (slug.includes('ocean-beach-dog-beach') || name.includes('ocean beach dog beach')) {
    return OB_DOG_BEACH_HERO_IMAGE;
  }
  return null;
}
