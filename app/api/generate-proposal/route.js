import { NextResponse } from 'next/server';
import { generateProposal } from '@/lib/claude';
import { updateJob } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const { jobId, jobTitle, jobDescription, tone } = await request.json();

  if (!jobTitle || !jobDescription) {
    return NextResponse.json({ error: 'jobTitle and jobDescription are required' }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not set. Add it in Vercel → Settings → Environment Variables.' },
      { status: 500 }
    );
  }

  try {
    const proposal = await generateProposal(jobTitle, jobDescription, tone);

    // If a stored job ID was provided, save the proposal back to storage
    if (jobId) {
      await updateJob(jobId, { proposal, status: 'ready' });
    }

    return NextResponse.json({ proposal });
  } catch (e) {
    console.error('Proposal generation failed:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
