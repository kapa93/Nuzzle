/**
 * Seed script: generates images via DALL-E 3 for seeded posts and uploads
 * them to Supabase Storage, then inserts post_images rows.
 *
 * Usage:
 *   npm run seed:images                  # dev (default)
 *   npm run seed:images -- --env=prod    # production
 *
 * Prerequisites:
 *   - OPENAI_API_KEY must be set in your .env.development / .env.production
 *   - Posts must already be seeded (run seed:posts first)
 *
 * Rate limits:
 *   DALL-E 3 default: 5 images/min (tier 1). The script waits --delay-ms
 *   between generations (default 13000ms). Pass --delay-ms=3000 if you're
 *   on a higher tier.
 *
 *   60 images × 13s ≈ 13 min total.
 */

import dotenv from 'dotenv';
import path from 'path';

const envArg = process.argv.find(a => a.startsWith('--env='))?.split('=')[1] ?? 'dev';
const envFile = envArg === 'prod' ? '.env.production' : '.env.development';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });
console.log(`Environment: ${envFile}`);

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import seedData from './seedPostData_all.json';

// ── Clients ───────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(`Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in ${envFile}`);
  process.exit(1);
}
if (!OPENAI_API_KEY) {
  console.error(`Missing OPENAI_API_KEY in ${envFile}`);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// ── Config ────────────────────────────────────────────────────────────────────

const delayArg = process.argv.find(a => a.startsWith('--delay-ms='))?.split('=')[1];
const DELAY_MS = delayArg ? parseInt(delayArg, 10) : 13_000;

const SEED_EMAIL_SUFFIX = '@nuzzle.seed';
const STORAGE_BUCKET = 'post-images';

// ── Helpers ───────────────────────────────────────────────────────────────────

function toEmail(name: string): string {
  return `${name.toLowerCase().replace(/\s+/g, '.')}${SEED_EMAIL_SUFFIX}`;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function storagePath(postId: string, index: number): string {
  return `seed/${postId}/${index}.png`;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface SeedPost {
  author_name: string;
  type: string;
  title: string;
  content_text: string;
  has_images: boolean;
  image_briefs?: string[];
}

interface SeedBreedGroup {
  breed: string;
  posts: SeedPost[];
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Resolve author name → UUID from auth
  console.log('\n🔍 Resolving seeded author UUIDs...');
  const { data: listData, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listError) {
    console.error('Could not list users:', listError.message);
    process.exit(1);
  }

  const authorIdMap = new Map<string, string>(); // author_name → UUID
  for (const group of (seedData as { breeds: SeedBreedGroup[] }).breeds) {
    for (const post of group.posts) {
      if (authorIdMap.has(post.author_name)) continue;
      const email = toEmail(post.author_name);
      const user = listData.users.find(u => u.email === email);
      if (user) authorIdMap.set(post.author_name, user.id);
    }
  }
  console.log(`Resolved ${authorIdMap.size} authors`);

  // 2. Build work queue: posts that need images
  interface WorkItem {
    authorId: string;
    title: string;
    imageBriefs: string[];
  }
  const workQueue: WorkItem[] = [];

  for (const group of (seedData as { breeds: SeedBreedGroup[] }).breeds) {
    for (const post of group.posts) {
      if (!post.has_images || !post.image_briefs?.length) continue;

      const authorId = authorIdMap.get(post.author_name);
      if (!authorId) {
        console.warn(`⚠️  No UUID for "${post.author_name}" — skipping: ${post.title}`);
        continue;
      }

      workQueue.push({ authorId, title: post.title, imageBriefs: post.image_briefs });
    }
  }

  const totalImages = workQueue.reduce((sum, w) => sum + w.imageBriefs.length, 0);
  console.log(`\n📋 ${workQueue.length} posts with images, ${totalImages} images total`);
  console.log(`   Delay between generations: ${DELAY_MS}ms`);
  console.log(`   Estimated time: ~${Math.ceil((totalImages * DELAY_MS) / 60_000)} min\n`);

  // 3. Generate + upload
  let generated = 0;
  let skipped = 0;
  let failed = 0;
  let imageCount = 0;

  for (const work of workQueue) {
    // Resolve post ID
    const { data: postRow, error: postErr } = await supabase
      .from('posts')
      .select('id')
      .eq('author_id', work.authorId)
      .eq('title', work.title)
      .maybeSingle();

    if (postErr || !postRow) {
      console.warn(`⚠️  Post not found in DB: "${work.title}" — skipping`);
      skipped++;
      continue;
    }

    const postId = postRow.id as string;

    for (let i = 0; i < work.imageBriefs.length; i++) {
      const brief = work.imageBriefs[i];
      imageCount++;

      // Check for existing image at this slot
      const filePath = storagePath(postId, i);
      const { data: existingFile } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list(`seed/${postId}`, { search: `${i}.png` });

      if (existingFile && existingFile.length > 0) {
        console.log(`  ~ [${imageCount}/${totalImages}] Already exists: ${filePath}`);
        skipped++;
        continue;
      }

      // Generate image
      console.log(`  ↻ [${imageCount}/${totalImages}] Generating: "${brief.slice(0, 60)}..."`);

      let imageBytes: ArrayBuffer;
      try {
        const response = await openai.images.generate({
          model: 'dall-e-3',
          prompt: brief,
          n: 1,
          size: '1024x1024',
          response_format: 'b64_json',
        });

        const b64 = response.data?.[0]?.b64_json;
        if (!b64) throw new Error('No b64_json in response');

        // Decode base64 to bytes
        const binaryStr = atob(b64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let j = 0; j < binaryStr.length; j++) {
          bytes[j] = binaryStr.charCodeAt(j);
        }
        imageBytes = bytes.buffer;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`  ✗ DALL-E error for "${work.title}" brief ${i}: ${msg}`);
        failed++;
        await sleep(DELAY_MS);
        continue;
      }

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, imageBytes, {
          contentType: 'image/png',
          upsert: false,
        });

      if (uploadError) {
        console.error(`  ✗ Upload failed for ${filePath}: ${uploadError.message}`);
        failed++;
        await sleep(DELAY_MS);
        continue;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Insert post_images row
      const { error: dbError } = await supabase.from('post_images').insert({
        post_id: postId,
        image_url: publicUrl,
        sort_order: i,
      });

      if (dbError) {
        console.error(`  ✗ post_images insert failed: ${dbError.message}`);
        failed++;
      } else {
        console.log(`  ✓ [${imageCount}/${totalImages}] Done: ${filePath}`);
        generated++;
      }

      // Respect rate limit
      if (imageCount < totalImages) await sleep(DELAY_MS);
    }
  }

  console.log('\n✅ Done.');
  console.log(`   Generated & uploaded: ${generated}`);
  console.log(`   Skipped (existing):   ${skipped}`);
  console.log(`   Failed:               ${failed}`);
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
