// Upwork RSS feed fetcher — fetches jobs matching ghostwriting/publishing queries

const SEARCH_QUERIES = [
  'ghostwriter memoir',
  'ghostwriter business book',
  'book publishing consultant',
  'ebook ghostwriter',
  'self publish book',
  'ghostwriting nonfiction',
  'book manuscript writer',
  'author ghostwriter',
];

export async function fetchUpworkJobs() {
  const allJobs = [];
  const seen = new Set();

  for (const query of SEARCH_QUERIES) {
    try {
      const encoded = encodeURIComponent(query);
      const url = `https://www.upwork.com/ab/feed/jobs/rss?q=${encoded}&sort=recency`;

      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          Accept: 'application/rss+xml, application/xml, text/xml, */*',
        },
        signal: AbortSignal.timeout(12000),
        next: { revalidate: 0 },
      });

      if (!res.ok) {
        console.warn(`Upwork RSS returned ${res.status} for: ${query}`);
        continue;
      }

      const xml = await res.text();
      const jobs = parseRSS(xml);

      for (const job of jobs) {
        if (!seen.has(job.id)) {
          seen.add(job.id);
          job.score = scoreJob(job);
          allJobs.push(job);
        }
      }
    } catch (e) {
      console.error(`RSS fetch failed for "${query}":`, e.message);
    }
  }

  // Sort: highest score first, then newest
  return allJobs.sort((a, b) => b.score - a.score || b.postedMs - a.postedMs);
}

function parseRSS(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];

    const title = extractTag(block, 'title');
    const link = extractTag(block, 'link') || extractTag(block, 'guid');
    const description = extractTag(block, 'description');
    const pubDate = extractTag(block, 'pubDate');

    if (!title || !link) continue;

    // Extract unique ID from Upwork URL
    const idMatch = link.match(/~([a-zA-Z0-9]+)/);
    const id = idMatch ? idMatch[1] : link;

    const decodedDesc = decodeHtml(description || '');

    items.push({
      id,
      title: decodeHtml(title),
      url: link,
      description: decodedDesc,
      shortDesc: decodedDesc.slice(0, 300),
      budget: extractBudget(decodedDesc),
      jobType: extractJobType(decodedDesc),
      postedMs: pubDate ? new Date(pubDate).getTime() : Date.now(),
      postedStr: pubDate ? formatRelative(new Date(pubDate)) : 'recently',
      status: 'new', // new | ready | sent
      proposal: null,
    });
  }

  return items;
}

function extractTag(xml, tag) {
  const cdataMatch = xml.match(
    new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`)
  );
  if (cdataMatch) return cdataMatch[1].trim();
  const plainMatch = xml.match(
    new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`)
  );
  return plainMatch ? plainMatch[1].trim() : '';
}

function extractBudget(text) {
  const fixedMatch = text.match(/Budget[:\s]+\$?([\d,]+(?:\s*[-–]\s*\$?[\d,]+)?)/i);
  if (fixedMatch) return '$' + fixedMatch[1].trim();
  const hourlyMatch = text.match(/Hourly Range[:\s]+\$?([\d.]+(?:\s*[-–]\s*\$?[\d.]+)?)/i);
  if (hourlyMatch) return '$' + hourlyMatch[1].trim() + '/hr';
  return 'Not specified';
}

function extractJobType(text) {
  if (/hourly/i.test(text)) return 'Hourly';
  if (/fixed.price|fixed price/i.test(text)) return 'Fixed';
  return 'Fixed';
}

function decodeHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function scoreJob(job) {
  const text = (job.title + ' ' + job.description).toLowerCase();
  let score = 50;

  const tier1 = [
    'memoir', 'autobiography', 'business book', 'ingram', 'ingramspark',
    'isbn', 'book proposal', 'manuscript', 'nonfiction book', 'self-publishing',
    'self publishing', 'kdp', 'amazon publish', 'barnes',
  ];
  const tier2 = [
    'ghostwrite', 'ghostwriter', 'co-author', 'book writing',
    'ebook', 'self-publish', 'publish my book', 'writing a book', 'book author',
  ];
  const tier3 = ['blog post', 'article writing', 'social media', 'copywriting', 'content writing'];
  const negative = [
    'logo design', 'web design', 'coding', 'developer', 'programming',
    'translation', 'video editing', 'data entry', 'seo', 'resume', 'cv writing',
  ];

  tier1.forEach((kw) => { if (text.includes(kw)) score += 14; });
  tier2.forEach((kw) => { if (text.includes(kw)) score += 8; });
  tier3.forEach((kw) => { if (text.includes(kw)) score -= 6; });
  negative.forEach((kw) => { if (text.includes(kw)) score -= 25; });

  // Budget bonus
  const nums = job.budget.match(/\d+/g)?.map(Number) || [];
  const maxBudget = Math.max(...nums, 0);
  if (maxBudget >= 3000) score += 18;
  else if (maxBudget >= 1000) score += 12;
  else if (maxBudget >= 500) score += 6;
  else if (maxBudget > 0 && maxBudget < 100) score -= 12;

  return Math.max(5, Math.min(100, Math.round(score)));
}

function formatRelative(date) {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
