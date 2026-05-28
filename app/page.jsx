'use client';
import { useState, useEffect, useCallback } from 'react';

const UPWORK_GREEN = '#14a800';

function ScoreBadge({ score }) {
  if (score >= 80) return <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">{score}% match</span>;
  if (score >= 60) return <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">{score}% match</span>;
  return <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">{score}% match</span>;
}

function StatusBadge({ status }) {
  if (status === 'sent') return <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-600">sent</span>;
  if (status === 'ready') return <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-600">ready</span>;
  return <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">new</span>;
}

function Spinner({ size = 4 }) {
  return (
    <svg className={`animate-spin w-${size} h-${size}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [proposal, setProposal] = useState('');
  const [generating, setGenerating] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customText, setCustomText] = useState('');
  const [fetchMsg, setFetchMsg] = useState(null);
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState('all'); // all | new | ready | sent
  const [error, setError] = useState(null);

  const loadJobs = useCallback(async () => {
    try {
      const res = await fetch('/api/jobs');
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (e) {
      console.error('loadJobs:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
    const interval = setInterval(loadJobs, 90000);
    return () => clearInterval(interval);
  }, [loadJobs]);

  const handleFetchJobs = async () => {
    setFetching(true);
    setFetchMsg(null);
    try {
      const res = await fetch('/api/fetch-jobs', { method: 'POST' });
      const data = await res.json();
      if (data.error) {
        setFetchMsg({ type: 'error', text: data.error });
      } else {
        setFetchMsg({ type: 'success', text: data.message });
        await loadJobs();
      }
    } catch {
      setFetchMsg({ type: 'error', text: 'Failed to fetch jobs. Check your connection.' });
    } finally {
      setFetching(false);
      setTimeout(() => setFetchMsg(null), 6000);
    }
  };

  const handleGenerate = async (title, desc, jobId = null) => {
    if (!title || !desc) return;
    setGenerating(true);
    setProposal('');
    setError(null);
    try {
      const res = await fetch('/api/generate-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, jobTitle: title, jobDescription: desc }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setProposal(data.proposal || '');
        if (jobId) await loadJobs();
      }
    } catch {
      setError('Failed to generate proposal. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkSent = async (jobId) => {
    await fetch('/api/jobs', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: jobId, updates: { status: 'sent' } }),
    });
    await loadJobs();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(proposal);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredJobs = jobs.filter((j) => filter === 'all' || j.status === filter);

  const stats = {
    total: jobs.length,
    highMatch: jobs.filter((j) => j.score >= 80).length,
    ready: jobs.filter((j) => j.status === 'ready').length,
    sent: jobs.filter((j) => j.status === 'sent').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: UPWORK_GREEN }}>
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-gray-900 text-sm leading-tight">Upwork Auto-Bidder</div>
              <div className="text-xs text-gray-400">Quill Forge Publishing · Claude AI</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Auto-fetch on
            </div>
            <button
              onClick={handleFetchJobs}
              disabled={fetching}
              className="flex items-center gap-2 text-white text-sm font-medium px-4 py-2 rounded-lg transition-opacity disabled:opacity-60"
              style={{ background: UPWORK_GREEN }}
            >
              {fetching ? <><Spinner size={4} /> Fetching...</> : <>↺ Fetch Jobs</>}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto w-full px-6 py-5 flex flex-col gap-5 flex-1">
        {/* Fetch message */}
        {fetchMsg && (
          <div className={`text-sm px-4 py-2.5 rounded-lg ${fetchMsg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {fetchMsg.type === 'success' ? '✓ ' : '✕ '}{fetchMsg.text}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total Jobs', value: stats.total, sub: 'in pipeline' },
            { label: 'High Match', value: stats.highMatch, sub: '80%+ score' },
            { label: 'Proposals Ready', value: stats.ready, sub: 'to review' },
            { label: 'Bids Sent', value: stats.sent, sub: 'this session' },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">{s.label}</div>
              <div className="text-2xl font-semibold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Paste custom job */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Paste any job description</div>
          <div className="flex gap-3">
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Paste an Upwork job post here → Claude will write a proposal instantly..."
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2.5 resize-none h-[72px] focus:outline-none focus:border-green-500 placeholder-gray-400 text-gray-800"
            />
            <button
              onClick={() => { setSelectedJob(null); handleGenerate('Custom Job', customText); }}
              disabled={!customText.trim() || generating}
              className="self-end text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50 transition-opacity"
              style={{ background: UPWORK_GREEN }}
            >
              Generate ↗
            </button>
          </div>
        </div>

        {/* Jobs + Proposal */}
        <div className="grid grid-cols-2 gap-5 flex-1">
          {/* Job List */}
          <div className="bg-white border border-gray-200 rounded-xl flex flex-col" style={{ minHeight: 460 }}>
            <div className="px-4 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Matched Jobs</span>
              <div className="flex gap-1">
                {['all', 'new', 'ready', 'sent'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                      filter === f ? 'text-white' : 'text-gray-500 hover:bg-gray-100'
                    }`}
                    style={filter === f ? { background: UPWORK_GREEN } : {}}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
                  <Spinner size={4} /> Loading...
                </div>
              ) : filteredJobs.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-3xl mb-2">📭</div>
                  <div className="text-gray-500 text-sm font-medium mb-1">No jobs yet</div>
                  <div className="text-gray-400 text-xs">Click "Fetch Jobs" to pull from Upwork RSS feeds</div>
                </div>
              ) : (
                filteredJobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => { setSelectedJob(job); setProposal(job.proposal || ''); setError(null); setCustomText(''); }}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedJob?.id === job.id
                        ? 'bg-green-50'
                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                    }`}
                    style={selectedJob?.id === job.id ? { borderColor: UPWORK_GREEN, borderWidth: '1.5px' } : {}}
                  >
                    <div className="text-sm font-medium text-gray-800 leading-snug mb-2">{job.title}</div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <ScoreBadge score={job.score} />
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{job.budget}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{job.jobType}</span>
                      <StatusBadge status={job.status} />
                      <span className="text-xs text-gray-400 ml-auto">{job.postedStr}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Proposal Panel */}
          <div className="bg-white border border-gray-200 rounded-xl flex flex-col" style={{ minHeight: 460 }}>
            <div className="px-4 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between gap-3">
              <div className="text-sm font-medium text-gray-700 truncate">
                {selectedJob
                  ? selectedJob.title.length > 50
                    ? selectedJob.title.slice(0, 50) + '…'
                    : selectedJob.title
                  : 'AI Proposal Generator'}
              </div>
              {selectedJob && (
                <button
                  onClick={() => handleGenerate(selectedJob.title, selectedJob.description, selectedJob.id)}
                  disabled={generating}
                  className="shrink-0 flex items-center gap-1.5 text-white text-xs font-medium px-3 py-1.5 rounded-lg disabled:opacity-50"
                  style={{ background: UPWORK_GREEN }}
                >
                  {generating ? <><Spinner size={3} /> Writing...</> : '✦ Generate'}
                </button>
              )}
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              {generating ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm py-6">
                  <span className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </span>
                  Claude is crafting your proposal…
                </div>
              ) : error ? (
                <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</div>
              ) : proposal ? (
                <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{proposal}</div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="text-4xl mb-3">✦</div>
                  <div className="text-gray-500 text-sm font-medium mb-1">
                    {selectedJob ? 'Ready to generate' : 'Select a job to start'}
                  </div>
                  <div className="text-gray-400 text-xs">
                    {selectedJob
                      ? 'Click "Generate" and Claude will write a winning proposal'
                      : 'Or paste a job description above'}
                  </div>
                </div>
              )}
            </div>

            {proposal && !generating && (
              <div className="px-4 pb-4 flex gap-2 border-t border-gray-100 pt-3">
                <button
                  onClick={handleCopy}
                  className="flex-1 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  {copied ? '✓ Copied!' : 'Copy'}
                </button>
                <button
                  onClick={() =>
                    selectedJob
                      ? handleGenerate(selectedJob.title, selectedJob.description, selectedJob.id)
                      : handleGenerate('Custom Job', customText)
                  }
                  className="flex-1 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Regenerate
                </button>
                {selectedJob && selectedJob.status !== 'sent' && (
                  <button
                    onClick={() => handleMarkSent(selectedJob.id)}
                    className="flex-1 py-2 text-sm text-white rounded-lg font-medium transition-opacity hover:opacity-90"
                    style={{ background: UPWORK_GREEN }}
                  >
                    Mark Sent
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-gray-400 pb-2">
          Jobs auto-refresh every 30 min via Vercel Cron · All proposals generated server-side · API key never exposed
        </div>
      </main>
    </div>
  );
}
