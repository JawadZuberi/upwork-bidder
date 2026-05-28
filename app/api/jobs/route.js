import { NextResponse } from 'next/server';
import { getJobs, updateJob } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET() {
  const jobs = await getJobs();
  return NextResponse.json({ jobs });
}

export async function PUT(request) {
  const { id, updates } = await request.json();
  if (!id || !updates) {
    return NextResponse.json({ error: 'Missing id or updates' }, { status: 400 });
  }
  const job = await updateJob(id, updates);
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }
  return NextResponse.json({ job });
}
