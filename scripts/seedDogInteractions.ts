import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { toCanonicalDogPair } from '../src/api/dogInteractions.helpers';
import { DOG_BEACH } from '../src/config/dogBeach';
import type { AgeGroupEnum, BreedEnum, Dog, EnergyLevelEnum, PlayStyleEnum } from '../src/types';

type SeedDog = {
  name: string;
  breed: BreedEnum;
  age_group: AgeGroupEnum;
  energy_level: EnergyLevelEnum;
  play_style?: PlayStyleEnum | null;
  dog_friendliness?: number | null;
  temperament_notes?: string | null;
};

type SeedUser = {
  email: string;
  password: string;
  name: string;
  city: string;
  dogs: SeedDog[];
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    'Missing env vars. Set EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running the seed script.'
  );
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const seedUsers: SeedUser[] = [
  {
    email: 'alice.dogtester@example.com',
    password: 'Nuzzle123!',
    name: 'Alice Dogtester',
    city: 'San Francisco',
    dogs: [
      {
        name: 'Mochi',
        breed: 'HUSKY',
        age_group: 'ADULT',
        energy_level: 'HIGH',
        play_style: 'chase',
        dog_friendliness: 5,
        temperament_notes: 'Confident and loves making fast friends.',
      },
      {
        name: 'Poppy',
        breed: 'GOLDEN_RETRIEVER',
        age_group: 'ADULT',
        energy_level: 'MED',
        play_style: 'gentle',
        dog_friendliness: 4,
        temperament_notes: 'Easygoing and happiest in small groups.',
      },
    ],
  },
  {
    email: 'ben.dogtester@example.com',
    password: 'Nuzzle123!',
    name: 'Ben Dogtester',
    city: 'San Francisco',
    dogs: [
      {
        name: 'Scout',
        breed: 'LABRADOR_RETRIEVER',
        age_group: 'ADULT',
        energy_level: 'HIGH',
        play_style: 'mixed',
        dog_friendliness: 5,
        temperament_notes: 'Very social and usually the first dog to say hi.',
      },
    ],
  },
];

async function getExistingUserByEmail(email: string) {
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });

  if (error) throw error;
  return data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

async function ensureUser(seedUser: SeedUser) {
  const existingUser = await getExistingUserByEmail(seedUser.email);

  if (existingUser) {
    const { data, error } = await supabase.auth.admin.updateUserById(existingUser.id, {
      password: seedUser.password,
      email_confirm: true,
      user_metadata: {
        name: seedUser.name,
      },
    });

    if (error) throw error;

    await upsertProfile({
      id: data.user.id,
      email: seedUser.email,
      name: seedUser.name,
      city: seedUser.city,
    });

    return data.user.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: seedUser.email,
    password: seedUser.password,
    email_confirm: true,
    user_metadata: {
      name: seedUser.name,
    },
  });

  if (error) throw error;
  if (!data.user) throw new Error(`Could not create user ${seedUser.email}`);

  await upsertProfile({
    id: data.user.id,
    email: seedUser.email,
    name: seedUser.name,
    city: seedUser.city,
  });

  return data.user.id;
}

async function upsertProfile({
  id,
  email,
  name,
  city,
}: {
  id: string;
  email: string;
  name: string;
  city: string;
}) {
  const { error } = await supabase.from('profiles').upsert({
    id,
    email,
    name,
    city,
  });

  if (error) throw error;
}

async function ensureDog(ownerId: string, seedDog: SeedDog) {
  const { data: existingDog, error: existingDogError } = await supabase
    .from('dogs')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('name', seedDog.name)
    .maybeSingle();

  if (existingDogError) throw existingDogError;

  const dogPayload = {
    owner_id: ownerId,
    name: seedDog.name,
    breed: seedDog.breed,
    age_group: seedDog.age_group,
    energy_level: seedDog.energy_level,
    play_style: seedDog.play_style ?? null,
    dog_friendliness: seedDog.dog_friendliness ?? null,
    temperament_notes: seedDog.temperament_notes ?? null,
  };

  if (existingDog) {
    const { data, error } = await supabase
      .from('dogs')
      .update(dogPayload)
      .eq('id', existingDog.id)
      .select('*')
      .single();

    if (error) throw error;
    return data as Dog;
  }

  const { data, error } = await supabase
    .from('dogs')
    .insert(dogPayload)
    .select('*')
    .single();

  if (error) throw error;
  return data as Dog;
}

async function getSeedInteractionIds(dogIds: string[]) {
  const [firstSide, secondSide] = await Promise.all([
    supabase.from('dog_interactions').select('id').in('dog_id_1', dogIds),
    supabase.from('dog_interactions').select('id').in('dog_id_2', dogIds),
  ]);

  if (firstSide.error) throw firstSide.error;
  if (secondSide.error) throw secondSide.error;

  return Array.from(
    new Set([...(firstSide.data ?? []), ...(secondSide.data ?? [])].map((row) => row.id))
  );
}

async function resetSeededState(dogIds: string[]) {
  const interactionIds = await getSeedInteractionIds(dogIds);

  if (interactionIds.length > 0) {
    const { error } = await supabase.from('dog_interactions').delete().in('id', interactionIds);
    if (error) throw error;
  }

  const { error: checkinError } = await supabase
    .from('dog_location_checkins')
    .delete()
    .in('dog_id', dogIds);

  if (checkinError) throw checkinError;
}

async function seedInteractions({
  mochiId,
  poppyId,
  scoutId,
  createdByUserId,
}: {
  mochiId: string;
  poppyId: string;
  scoutId: string;
  createdByUserId: string;
}) {
  const now = Date.now();
  const interactionPayloads = [
    {
      ...toCanonicalDogPair(mochiId, scoutId),
      created_by_user_id: createdByUserId,
      location_name: DOG_BEACH.locationName,
      source_type: 'dog_beach',
      created_at: new Date(now - 90 * 60_000).toISOString(),
    },
    {
      ...toCanonicalDogPair(poppyId, scoutId),
      created_by_user_id: createdByUserId,
      location_name: 'Mission Dolores Park',
      source_type: 'manual',
      created_at: new Date(now - 30 * 60_000).toISOString(),
    },
    {
      ...toCanonicalDogPair(mochiId, scoutId),
      created_by_user_id: createdByUserId,
      location_name: DOG_BEACH.locationName,
      source_type: 'manual',
      created_at: new Date(now - 5 * 60_000).toISOString(),
    },
  ];

  const { error } = await supabase.from('dog_interactions').insert(interactionPayloads);

  if (error) throw error;
}

async function seedDogBeachCheckin({
  userId,
  dogId,
}: {
  userId: string;
  dogId: string;
}) {
  const { error } = await supabase.from('dog_location_checkins').insert({
    user_id: userId,
    dog_id: dogId,
    location_key: DOG_BEACH.locationKey,
    location_name: DOG_BEACH.locationName,
    expires_at: new Date(Date.now() + 60 * 60_000).toISOString(),
  });

  if (error) throw error;
}

async function main() {
  const userIds = new Map<string, string>();
  const dogsByName = new Map<string, Dog>();

  for (const seedUser of seedUsers) {
    const userId = await ensureUser(seedUser);
    userIds.set(seedUser.email, userId);

    for (const seedDog of seedUser.dogs) {
      const dog = await ensureDog(userId, seedDog);
      dogsByName.set(seedDog.name, dog);
    }
  }

  const allSeedDogIds = Array.from(dogsByName.values()).map((dog) => dog.id);
  await resetSeededState(allSeedDogIds);

  if (process.argv.includes('--reset')) {
    console.log('Reset complete for seeded dog interactions and Dog Beach check-ins.');
    return;
  }

  const aliceUserId = userIds.get('alice.dogtester@example.com');
  const benUserId = userIds.get('ben.dogtester@example.com');
  const mochi = dogsByName.get('Mochi');
  const poppy = dogsByName.get('Poppy');
  const scout = dogsByName.get('Scout');

  if (!aliceUserId || !benUserId || !mochi || !poppy || !scout) {
    throw new Error('Seed data was not created as expected.');
  }

  await seedInteractions({
    mochiId: mochi.id,
    poppyId: poppy.id,
    scoutId: scout.id,
    createdByUserId: aliceUserId,
  });

  await seedDogBeachCheckin({
    userId: benUserId,
    dogId: scout.id,
  });

  console.log('Dog interaction seed complete.');
  console.log('Sign in with either of these test accounts:');
  console.log(`- alice.dogtester@example.com / ${seedUsers[0].password}`);
  console.log(`- ben.dogtester@example.com / ${seedUsers[1].password}`);
  console.log('Seeded dogs: Mochi, Poppy, Scout');
  console.log(`Scout is also checked in at ${DOG_BEACH.locationName} for Dog Beach testing.`);
}

main().catch((error) => {
  console.error('Dog interaction seed failed.');
  console.error(error);
  process.exit(1);
});
