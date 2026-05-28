import { NextResponse } from 'next/server';
import { fetchUpworkJobs } from '@/lib/upwork';
import { addJob } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const jobs = await fetchUpworkJobs();
    let newCount = 0;

    for (const job of jobs) {
      const isNew = await addJob(job);
      if (isNew) newCount++;
    }

    return NextResponse.json({
      success: true,
      fetched: jobs.length,
      newJobs: newCount,
      message: `Found ${jobs.length} jobs, ${newCount} new`,
    });
  } catch (e) {
    console.error('Fetch jobs failed:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
