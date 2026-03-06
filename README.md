# BreedBuddy

A social community app for dog breed enthusiasts—like a Facebook Group + Q&A centered around dog breeds.

## Tech Stack

- **Expo** (latest) + TypeScript
- **React Navigation** (native stack + bottom tabs)
- **TanStack Query** for data fetching/caching
- **Zustand** for session + UI state
- **Zod** for form validation
- **Supabase** (Auth, Postgres, Storage)
- **StyleSheet** for styling

## Supported Breeds (v1)

- Australian Shepherd
- Husky
- Golden Retriever
- French Bulldog
- Pit Bull
- Labrador Retriever

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Supabase setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the migrations in order:
   - `supabase/migrations/001_initial_schema.sql`
3. Create Storage buckets (Supabase Dashboard → Storage):
   - **dog-images** (public)
   - **post-images** (public)

   For each bucket, enable public access so images can be displayed.

4. Enable Email auth in **Authentication → Providers** (Email is on by default)

### 3. Environment variables

Create `.env` (or `.env.local`) in the project root:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Get these from Supabase Dashboard → Settings → API.

### 4. Run the app

```bash
npx expo start
```

Then press `i` for iOS simulator or `a` for Android emulator.

## Project Structure

```
src/
├── api/          # Supabase queries (auth, posts, dogs, reactions, etc.)
├── components/   # Reusable UI (PostCard, DogAvatar, ReactionBar, etc.)
├── hooks/        # Custom hooks (useReactionMutation)
├── lib/          # Supabase client, image upload helpers
├── navigation/   # React Navigation setup
├── screens/      # App screens
├── store/        # Zustand stores (auth, UI)
├── types/        # TypeScript types
└── utils/        # Validation, breed helpers
```

## Features

- **Auth**: Email + password sign up / sign in, session persistence
- **Profiles**: User profile (name, email, city) + dog profile (name, breed, age, energy, photo)
- **Breed communities**: Home feed for your dog’s breed, Explore all 6 breeds
- **Posts**: Create posts with type (Question, Update/Story, Tip), tag, and multiple images
- **Reactions**: Facebook-style emoji reactions (Like, Love, Haha, Wow, Sad, Angry)
- **Comments**: Q&A style comments on posts
- **Search**: Search posts by text with breed/tag/type filters
- **Notifications**: Notify post author on new comments
- **Reports**: Report posts/comments
- **Health disclaimer**: Shown when post tag is Health

## Storage

- **dog-images**: `${uid}/dogs/${dogId}/${uuid}.jpg`
- **post-images**: `${uid}/posts/${postId}/${uuid}.jpg`

Images are stored as full public URLs in the database for display.

## License

MIT
