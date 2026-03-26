# Dog Interactions QA Checklist

Use this checklist to repeatedly verify the "Who Did My Dog Meet?" MVP without recreating data by hand.

## Prerequisites

- Run the `dog_interactions` migration:
  - `supabase/migrations/010_dog_interactions.sql`
  - `supabase/migrations/011_multi_dog_dog_beach_checkins.sql`
- Make sure your local `.env` includes:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

- Start the app:

```bash
npx expo start
```

## Seed Test Data

Create or refresh the reusable dog interaction fixtures:

```bash
npm run seed:dog-interactions
```

Reset only the seeded interactions and Dog Beach check-ins:

```bash
npm run seed:dog-interactions:reset
```

## Seeded Test Accounts

- `alice.dogtester@example.com` / `Nuzzle123!`
- `ben.dogtester@example.com` / `Nuzzle123!`

## Seeded Dogs

- Alice
  - `Mochi`
  - `Poppy`
- Ben
  - `Scout`

## Seeded State

- `Mochi` has met `Scout` twice.
- `Poppy` has met `Scout` once.
- `Scout` has an active Dog Beach check-in at `Ocean Beach Dog Beach`.

## Manual QA Checklist

### 1. Profile entry point

- Sign in as `alice.dogtester@example.com`.
- Open Ben's profile.
- Confirm Ben's dog card shows `Met this dog`.
- Tap `Met this dog`.
- Expected:
  - You are prompted with `Which of your dogs?`
  - `Both dogs` appears along with `Mochi` and `Poppy`
  - Choosing `Both dogs` records an interaction for both dogs

### 2. Single-dog fast path

- Sign out and sign in as `ben.dogtester@example.com`.
- Open Alice's profile and then one of Alice's dog profiles.
- Tap `Met this dog`.
- Expected:
  - No chooser is shown because Ben only has `Scout`
  - The interaction saves immediately

### 3. Dog profile entry point

- From any dog card, tap into that dog's profile.
- Confirm the dog profile screen loads.
- Confirm `Met this dog` is available for another user's dog.
- Confirm the `Friends` section is visible on the dog profile.

### 4. Dog Beach entry point

- Sign in as Alice.
- Open `Dog Beach Now`.
- Confirm `Scout` appears as an active attendee.
- Tap `Met this dog` on Scout's row.
- Expected:
  - Alice sees the multi-dog chooser
  - `Both dogs` appears as an option
  - Choosing `Both dogs` records the interaction for both `Mochi` and `Poppy`

### 5. Dog Beach check-in for multiple dogs

- Sign in as Alice.
- Trigger Dog Beach check-in from Home or `Dog Beach Now`.
- Expected:
  - Alice sees `Both dogs` in the chooser
  - Choosing `Both dogs` checks in both `Mochi` and `Poppy`
  - Dog Beach count increases by both dogs
  - Status text reflects how many of Alice's dogs are checked in

### 6. Friends section rendering

- Open `Scout`'s dog profile.
- Expected:
  - `Mochi` and `Poppy` appear in `Friends`
  - `Mochi` shows a higher interaction count than `Poppy`
- Open `Mochi`'s dog profile.
- Expected:
  - `Scout` appears in `Friends`

### 7. Navigation behavior

- Tap a dog row inside `Friends`.
- Expected:
  - The app navigates to that dog's profile screen

### 8. Empty states

- Use a freshly created non-seeded user with no interactions.
- Open one of that user's dog profiles.
- Expected:
  - `Friends` shows `No dogs met yet`

### 9. No-dog edge case

- Use a user account with no dog profiles.
- Try to trigger `Met this dog`.
- Expected:
  - An alert explains that a dog profile is required first

### 10. Duplicate protection

- Tap `Met this dog` multiple times in quick succession for the same pair.
- Expected:
  - The app should avoid creating rapid duplicate rows within the short duplicate window

### 11. Self-protection

- View your own dog.
- Expected:
  - `Met this dog` should not appear for your own dog profile/card

## Regression Checks

- Dog cards still render on user profiles.
- Dog profile navigation still works from profile cards and Dog Beach.
- Dog Beach attendee list still loads with active check-ins.
- Existing profile edit/delete dog flows still work.
- `npx tsc --noEmit` passes.
- `npm test -- --runInBand` passes.
