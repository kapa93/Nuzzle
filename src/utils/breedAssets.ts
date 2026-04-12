import type { ImageSourcePropType } from "react-native";
import type { BreedEnum } from "@/types";
import type { BreedColorKey } from "@/theme";
import type { ImageStyle, StyleProp } from "react-native";
import { BREED_LABELS } from "@/utils/breed";

/** Local breed images for pack grid (assets/breeds) */
const BREED_PACK_IMAGES: Record<BreedEnum, ImageSourcePropType> = {
  AUSTRALIAN_SHEPHERD: require("../../assets/breeds/aussie-head.jpg"),
  DACHSHUND: require("../../assets/breeds/dachshund.jpg"),
  GERMAN_SHEPHERD: require("../../assets/breeds/german-shepherd.jpg"),
  HUSKY: require("../../assets/breeds/husky.jpg"),
  GOLDEN_DOODLE: require("../../assets/breeds/golden-doodle.jpg"),
  GOLDEN_RETRIEVER: require("../../assets/breeds/golden.jpg"),
  MIXED_BREED: require("../../assets/breeds/mixed-breed.jpg"),
  PUG: require("../../assets/breeds/pug.jpg"),
  FRENCH_BULLDOG: require("../../assets/breeds/frenchie.jpg"),
  PIT_BULL: require("../../assets/breeds/pitbull.jpg"),
  LABRADOR_RETRIEVER: require("../../assets/breeds/lab.jpg"),
  LABRADOODLE: require("../../assets/breeds/labradoodle.jpg"),
};

/** Map BreedEnum to theme BreedColorKey */
export const BREED_TO_COLOR: Record<BreedEnum, BreedColorKey> = {
  AUSTRALIAN_SHEPHERD: "aussie",
  DACHSHUND: "dachshund",
  GERMAN_SHEPHERD: "german",
  HUSKY: "husky",
  GOLDEN_DOODLE: "goldendoodle",
  GOLDEN_RETRIEVER: "golden",
  MIXED_BREED: "mixed",
  PUG: "pug",
  FRENCH_BULLDOG: "frenchie",
  PIT_BULL: "pitbull",
  LABRADOR_RETRIEVER: "lab",
  LABRADOODLE: "labradoodle",
};

/** Breed hero banner images (Unsplash, optimized for 390x210) */
export const BREED_HERO_IMAGES: Record<BreedEnum, string> = {
  AUSTRALIAN_SHEPHERD:
    "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800",
  DACHSHUND:
    "https://images.unsplash.com/photo-1593134257782-e89567b7718a?w=800",
  GERMAN_SHEPHERD:
    "https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=800",
  HUSKY: "https://images.unsplash.com/photo-1611003228941-98852ba62227?w=800",
  GOLDEN_DOODLE:
    "https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?w=800",
  GOLDEN_RETRIEVER:
    "https://images.unsplash.com/photo-1633722715463-d30f4f325e40?w=800",
  MIXED_BREED:
    "https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?w=800",
  PUG:
    "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800",
  FRENCH_BULLDOG:
    "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800",
  PIT_BULL: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800",
  LABRADOR_RETRIEVER:
    "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800",
  LABRADOODLE:
    "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800",
};

/** Local asset for Australian Shepherd feed banner */
const AUSSIE_FEED_IMAGE = require("../../assets/banners/aussie-hero.jpg");
const HUSKY_FEED_IMAGE = require("../../assets/banners/husky-hero.jpg");
const PUG_FEED_IMAGE = require("../../assets/banners/pug-hero.jpg");
const PIT_BULL_FEED_IMAGE = require("../../assets/banners/pittie-hero.jpg");
const LABRADOR_FEED_IMAGE = require("../../assets/banners/lab-hero.jpg");
const GERMAN_SHEPHERD_FEED_IMAGE = require("../../assets/banners/shepherd-hero.jpg");
const MIXED_BREED_FEED_IMAGE = require("../../assets/banners/mixed-breed-hero.jpg");
const LABRADOODLE_FEED_IMAGE = require("../../assets/banners/labradoodle-hero.jpg");
const GOLDEN_DOODLE_FEED_IMAGE = require("../../assets/banners/golden-doodle-hero.jpg");
const GOLDEN_RETRIEVER_FEED_IMAGE = require("../../assets/banners/golden-hero.jpg");

/** Get breed hero image source - uses local assets for selected breeds, URI for others */
export function getBreedHeroImageSource(breed: BreedEnum) {
  if (breed === "AUSTRALIAN_SHEPHERD") {
    return AUSSIE_FEED_IMAGE;
  }
  if (breed === "HUSKY") {
    return HUSKY_FEED_IMAGE;
  }
  if (breed === "PUG") {
    return PUG_FEED_IMAGE;
  }
  if (breed === "PIT_BULL") {
    return PIT_BULL_FEED_IMAGE;
  }
  if (breed === "LABRADOR_RETRIEVER") {
    return LABRADOR_FEED_IMAGE;
  }
  if (breed === "GERMAN_SHEPHERD") {
    return GERMAN_SHEPHERD_FEED_IMAGE;
  }
  if (breed === "MIXED_BREED") {
    return MIXED_BREED_FEED_IMAGE;
  }
  if (breed === "LABRADOODLE") {
    return LABRADOODLE_FEED_IMAGE;
  }
  if (breed === "GOLDEN_DOODLE") {
    return GOLDEN_DOODLE_FEED_IMAGE;
  }
  if (breed === "GOLDEN_RETRIEVER") {
    return GOLDEN_RETRIEVER_FEED_IMAGE;
  }
  return { uri: BREED_HERO_IMAGES[breed] } as const;
}

export function getBreedHeroImageStyle(breed: BreedEnum): StyleProp<ImageStyle> | undefined {
  if (breed === "AUSTRALIAN_SHEPHERD") {
    return {
      transform: [{ scale: 1.35 }, { translateY: -25 }],
    };
  }
  if (breed === "HUSKY") {
    return {
      transform: [{ scale: 1.45 }, { translateY: 10 }, { translateX: -15 }],
    };
  }
  if (breed === "PUG") {
    return {
      transform: [{ scale: 1.24 }, { translateY: -6 }, { translateX: -10 }],
    };
  }
  if (breed === "PIT_BULL") {
    return {
      transform: [{ scale: 1.22 }, { translateY: 13 }, { translateX: -10 }],
    };
  }
  if (breed === "LABRADOR_RETRIEVER") {
    return {
      transform: [{ scale: 1.2 }, { translateY: 8 }, { translateX: -10 }],
    };
  }
  if (breed === "GERMAN_SHEPHERD") {
    return {
      transform: [{ scale: 1.22 }, { translateY: 10 }, { translateX: -10 }],
    };
  }
  if (breed === "MIXED_BREED") {
    return {
      transform: [{ scale: 1.18 }, { translateY: 10 }, { translateX: -15 }],
    };
  }
  if (breed === "LABRADOODLE") {
    return {
      transform: [{ scale: 1.2 }, { translateY: -6 }, { translateX: -2 }],
    };
  }
  if (breed === "GOLDEN_DOODLE") {
    return {
      transform: [{ scale: 1.25 }, { translateY: 8 }, { translateX: -5 }],
    };
  }
  if (breed === "GOLDEN_RETRIEVER") {
    return {
      transform: [{ scale: 1.2 }, { translateY: -8 }, { translateX: -6 }],
    };
  }
  return undefined;
}

export function getBreedHeroTitle(breed: BreedEnum): string {
  if (breed === "MIXED_BREED") {
    return "Mixed\nBreed";
  }
  if (breed === "GOLDEN_DOODLE") {
    return "Golden\nDoodle";
  }
  return BREED_LABELS[breed];
}

export type PackItem = {
  breed: BreedEnum;
  label: string;
  image: ImageSourcePropType;
  breedColor: BreedColorKey;
};

const PACK_BREED_ORDER: BreedEnum[] = [
  "AUSTRALIAN_SHEPHERD",
  "HUSKY",
  "GOLDEN_RETRIEVER",
  "FRENCH_BULLDOG",
  "PIT_BULL",
  "LABRADOR_RETRIEVER",
  "GOLDEN_DOODLE",
  "LABRADOODLE",
  "DACHSHUND",
  "GERMAN_SHEPHERD",
  "PUG",
  "MIXED_BREED",
];

export function getPackItems(): PackItem[] {
  return PACK_BREED_ORDER.map((breed) => ({
    breed,
    label: BREED_LABELS[breed],
    image: BREED_PACK_IMAGES[breed],
    breedColor: BREED_TO_COLOR[breed],
  }));
}
