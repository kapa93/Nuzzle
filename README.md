# Nuzzle

## Tech Stack

- **Expo SDK ~55** + **TypeScript**
- **React 19** / **React Native 0.83**
- **React Navigation** (native stack + custom bottom tab bar)
- **TanStack Query** for data fetching and caching
- **Zustand** for session, onboarding, and UI state
- **Zod** for validation
- **Supabase** (Auth, Postgres, Storage, row-level security)
- **Inter** (`@expo-google-fonts/inter`) as the primary typeface
- **StyleSheet** + shared tokens in `src/theme/`
- **expo-location** for proximity check-ins; **expo-image-picker** for photos; **expo-haptics** for feedback; **react-native-reanimated** for motion

## Setup

### Install dependencies

```bash
npm install
```

### Run the app

```bash
npx expo start
```

Then press `i` for the iOS simulator, `a` for the Android emulator, or `w` for web.

## Testing

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

CI-style (single worker):

```bash
npm run test:ci
```

Seed reusable dog-interaction QA data:

```bash
npm run seed:dog-interactions
```

Reset only the seeded dog-interaction rows and Dog Beach check-ins:

```bash
npm run seed:dog-interactions:reset
```

## Project structure

```
src/
├── api/          # Supabase queries (auth, posts, dogs, reactions, meetups, etc.)
├── components/   # Reusable UI (PostCard, carousels, ReactionBar, headers, …)
├── context/      # App-wide UI context (e.g. scroll direction for headers/tab bar)
├── hooks/        # Custom hooks
├── lib/          # Supabase client, uploads, helpers
├── navigation/   # React Navigation + NuzzleTabBar
├── screens/      # Feature screens
├── store/        # Zustand stores (auth, onboarding, UI)
├── theme/        # Colors and shared visual tokens
├── types/        # TypeScript types aligned with the DB
└── utils/        # Breed/post helpers, formatting
```
