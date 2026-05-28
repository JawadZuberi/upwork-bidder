// Vercel KV storage with in-memory fallback for local development
// KV is used automatically when KV_REST_API_URL is set in the environment

const memoryStore = new Map();

async function getKV() {
  if (!process.env.KV_REST_API_URL) return null;
  try {
    const { kv } = await import('@vercel/kv');
    return kv;
  } catch {
    return null;
  }
}

export async function getJobs() {
  const kv = await getKV();
  try {
    if (kv) {
      const jobs = await kv.get('upwork:jobs');
      return jobs || [];
    }
    return memoryStore.get('upwork:jobs') || [];
  } catch {
    return memoryStore.get('upwork:jobs') || [];
  }
}

export async function saveJobs(jobs) {
  const kv = await getKV();
  try {
    if (kv) {
      await kv.set('upwork:jobs', jobs);
    } else {
      memoryStore.set('upwork:jobs', jobs);
    }
  } catch (e) {
    console.error('saveJobs error:', e);
    memoryStore.set('upwork:jobs', jobs);
  }
}

export async function addJob(job) {
  const jobs = await getJobs();
  const exists = jobs.find((j) => j.id === job.id);
  if (!exists) {
    jobs.unshift(job);
    await saveJobs(jobs.slice(0, 150));
    return true;
  }
  return false;
}

export async function updateJob(id, updates) {
  const jobs = await getJobs();
  const idx = jobs.findIndex((j) => j.id === id);
  if (idx === -1) return null;
  jobs[idx] = { ...jobs[idx], ...updates };
  await saveJobs(jobs);
  return jobs[idx];
}

export async function clearOldJobs() {
  const jobs = await getJobs();
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const fresh = jobs.filter((j) => (j.postedMs || 0) > cutoff);
  await saveJobs(fresh);
  return jobs.length - fresh.length;
}
