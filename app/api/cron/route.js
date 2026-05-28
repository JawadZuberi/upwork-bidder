import { NextResponse } from 'next/server';
import { fetchUpworkJobs } from '@/lib/upwork';
import { addJob, clearOldJobs } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  // Verify this is being called by Vercel Cron (or with the correct secret)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Clean up jobs older than 7 days
    const removed = await clearOldJobs();

    // Fetch fresh jobs from Upwork RSS
    const jobs = await fetchUpworkJobs();
    let newCount = 0;

    for (const job of jobs) {
      const isNew = await addJob(job);
      if (isNew) newCount++;
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      fetched: jobs.length,
      newJobs: newCount,
      removedOld: removed,
    });
  } catch (e) {
    console.error('Cron job failed:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
