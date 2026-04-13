# Nuzzle

A social community app for dog breed enthusiasts—like a Facebook Group + Q&A centered around dog breeds, with breed feeds, meetups, and optional **Dog Beach Now** check-ins (Ocean Beach Dog Beach, SF).

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

## Supported breeds

Twelve first-class breed communities (feeds and posting):

- Australian Shepherd  
- Dachshund  
- German Shepherd  
- Husky  
- Golden Doodle  
- Golden Retriever  
- Mixed Breed  
- Pug  
- French Bulldog  
- Pit Bull  
- Labrador Retriever  
- Labradoodle  

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run the migrations in numeric order under `supabase/migrations/`:

   - `001_initial_schema.sql`  
   - `002_storage_buckets.sql`  
   - `003_multi_dog.sql`  
   - `004_profile_image.sql`  
   - `005_seed_australian_shepherd_posts.sql` *(optional demo data; requires at least one signed-up user/profile)*  
   - `006_user_breed_joins.sql`  
   - `007_meetup_posts.sql`  
   - `008_dog_beach_checkins.sql`  
   - `009_dog_compatibility_profile_fields.sql`  
   - `010_dog_interactions.sql`  
   - `011_multi_dog_dog_beach_checkins.sql`  
   - `012_post_notifications.sql`  
   - `013_add_golden_doodle_breed.sql`  
   - `014_meetup_rsvp_notifications.sql`
   - `015_dog_interaction_notifications.sql`

3. Enable auth providers in **Authentication → Providers**:

   - Email (on by default)  
   - Apple (for native Sign in with Apple on iOS)

4. **Redirect URL** (mobile): **Authentication → URL Configuration** → add `nuzzle://auth/callback` to **Redirect URLs** so auth deep links open the app.

5. **Apple provider** (Supabase + Apple Developer): configure Services ID, Team ID, Key ID, and private key in Supabase; use the same bundle identifier as the app (`com.kapa.nuzzle` in `app.json`). Test on a dev or TestFlight build—Apple sign-in is not available in Expo Go.

### 3. Environment variables

Create `.env` or `.env.local` in the project root:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Values are in Supabase **Settings → API**. The service role key is only needed for local scripts (e.g. seeding), not the client app.  
The Sentry DSN is optional; if omitted, Sentry initialization stays disabled.

### 4. Run the app

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

See `docs/dog-interactions-qa.md` for the manual QA checklist and test accounts.

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

## Features

- **Auth**: Email/password and native iOS Sign in with Apple; session persistence and deep-link callback handling.
- **Onboarding**: New users add a first dog before entering the main app.
- **Profiles**: Human profile (name, email, city, photo) and **multiple dogs** per account with breed, age group, energy, photo, and **compatibility fields** (play style, good with puppies/large/small dogs, notes).
- **Home**: Personalized feed, **Search** (stack and modal) with breed/tag/type filters, **Dog Beach Now** (location-aware check-ins for Ocean Beach Dog Beach), dog and user profile deep links.
- **Explore**: Browse all breeds and open each breed’s feed.
- **Posts**: Types include Question, Update/Story, Tip, and **Meetup** (details + RSVP). Multiple images per post; edit and delete your own posts.
- **Reactions**: Emoji reactions (Like, Love, Haha, Wow, Sad, Angry).
- **Comments**: Threaded discussion on posts.
- **Notifications**: In-app notifications when someone **comments on or reacts to your posts**, **joins your meetup**, or **marks that your dog met their dog**.
- **Dog social graph**: Log **dog-to-dog interactions** (e.g. at Dog Beach or meetups) for “dogs you’ve met” style flows (see seed script and QA doc).
- **Search**: Full-text style discovery with filters.
- **Reports**: Report posts and comments.
- **Health disclaimer**: Shown when a post is tagged Health.

## Storage (Supabase buckets)

- **profile-images**: `${uid}/avatar.jpg` (user avatar)  
- **dog-images**: `${uid}/dogs/${dogId}/${uuid}.jpg`  
- **post-images**: `${uid}/posts/${postId}/${uuid}.jpg`  

Public URLs are stored on rows for display in the app.

## License

MIT
