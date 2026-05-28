// Claude API wrapper for proposal generation

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

const SYSTEM_PROMPT = `You are an expert Upwork proposal writer with 15 years of experience in ghostwriting and book publishing. You represent Quill Forge Publishing — a full-service firm offering ghostwriting, editing, ISBN registration, IngramSpark distribution, and Amazon KDP setup.

Your proposals win because:
1. You open with a SPECIFIC detail from the job post — never generic greetings
2. You address their exact pain point in 1-2 sentences
3. You mention one relevant credential naturally
4. You offer one concrete insight for their specific project
5. You end with a clear, low-friction call to action
6. You stay under 180 words — concise beats comprehensive

NEVER open with: "Hello", "Hi", "I saw your job post", "I am interested in your project", "I am writing to apply", or any variation. Jump straight into their world.`;

export async function generateProposal(jobTitle, jobDescription, tone = 'warm and professional') {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured');

  const userPrompt = `Write a winning Upwork proposal for this job.

JOB TITLE: ${jobTitle}

JOB DESCRIPTION:
${jobDescription}

REQUIREMENTS:
- Under 180 words total
- Open with something SPECIFIC from their description (a detail, a goal, a challenge they mentioned)
- Show you understand what they want to achieve
- Briefly mention publishing expertise (ghostwriting, IngramSpark, KDP, etc.) only if relevant
- Include one concrete suggestion or insight for their specific project
- End with a specific CTA like "Can we jump on a quick 20-minute call this week?"
- Tone: ${tone}
- Do NOT add a subject line or "Proposal:" header — just the body text`;

  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text?.trim() || '';
}
