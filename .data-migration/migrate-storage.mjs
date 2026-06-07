import { createClient } from '@supabase/supabase-js';

const OLD_PROJECT_URL = process.env.OLD_PROJECT_URL;
const OLD_PROJECT_SERVICE_KEY = process.env.OLD_PROJECT_SERVICE_KEY;
const NEW_PROJECT_URL = process.env.NEW_PROJECT_URL;
const NEW_PROJECT_SERVICE_KEY = process.env.NEW_PROJECT_SERVICE_KEY;

if (!OLD_PROJECT_URL || !OLD_PROJECT_SERVICE_KEY || !NEW_PROJECT_URL || !NEW_PROJECT_SERVICE_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const oldSupabase = createClient(OLD_PROJECT_URL, OLD_PROJECT_SERVICE_KEY);
const newSupabase = createClient(NEW_PROJECT_URL, NEW_PROJECT_SERVICE_KEY);

async function listAllFiles(bucket, path = '') {
  const { data, error } = await oldSupabase.storage.from(bucket).list(path, { limit: 1000 });
  if (error) throw new Error(`List failed for ${bucket}${path ? `/${path}` : ''}: ${error.message}`);
  if (!data?.length) return [];

  let files = [];
  for (const item of data) {
    if (!item.metadata) {
      files = files.concat(await listAllFiles(bucket, `${path}${item.name}/`));
    } else {
      files.push({ fullPath: `${path}${item.name}`, metadata: item.metadata });
    }
  }
  return files;
}

async function migrateFile(sourceBucket, targetBucket, file) {
  const { data, error: downloadError } = await oldSupabase.storage
    .from(sourceBucket)
    .download(file.fullPath);
  if (downloadError) throw new Error(`Download failed: ${downloadError.message}`);

  const { error: uploadError } = await newSupabase.storage
    .from(targetBucket)
    .upload(file.fullPath, data, {
      upsert: true,
      contentType: file.metadata?.mimetype,
      cacheControl: file.metadata?.cacheControl,
    });
  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
}

async function main() {
  const { data: buckets, error } = await oldSupabase.storage.listBuckets();
  if (error) throw error;

  let success = 0;
  let failed = 0;

  for (const bucket of buckets) {
    console.log(`Processing bucket: ${bucket.name}`);
    const files = await listAllFiles(bucket.name);
    console.log(`  Found ${files.length} files`);

    for (const file of files) {
      try {
        await migrateFile(bucket.name, bucket.name, file);
        success += 1;
      } catch (err) {
        failed += 1;
        console.error(`  Failed ${file.fullPath}: ${err.message}`);
      }
    }
  }

  console.log(`Done. ${success} succeeded, ${failed} failed.`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
