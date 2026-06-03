import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Download, Star } from 'lucide-react';
import MetricBar from '../components/MetricBar';
import { reportApi } from '../api/client';

export default function ReportView() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [rating, setRating] = useState(0);

  useEffect(() => {
    reportApi.get(id).then((res) => setReport(res.data.data));
  }, [id]);

  const handleExport = async (format) => {
    try {
      const res = await reportApi.export(id, format);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${id}.${format}`;
      a.click();
      toast.success(`Downloaded ${format.toUpperCase()}`);
    } catch {
      toast.error('Export failed');
    }
  };

  const submitFeedback = async () => {
    if (!rating) return;
    try {
      await reportApi.feedback(id, { rating });
      toast.success('Feedback submitted');
    } catch {
      toast.error('Failed to submit feedback');
    }
  };

  if (!report) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  const m = report.metrics || {};

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{report.topic}</h1>
          <p className="text-slate-500">
            Generated {new Date(report.createdAt).toLocaleString()}
          </p>
        </div>
        {report.status === 'completed' && (
          <div className="flex gap-2">
            <button onClick={() => handleExport('pdf')} className="btn-secondary">
              <Download size={16} className="mr-2" /> PDF
            </button>
            <button onClick={() => handleExport('docx')} className="btn-secondary">
              <Download size={16} className="mr-2" /> DOCX
            </button>
          </div>
        )}
      </div>

      {report.status === 'completed' && (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            <div className="card space-y-3">
              <h3 className="font-semibold">AI Evaluation Metrics</h3>
              <MetricBar label="Relevance" value={m.relevanceScore || 0} />
              <MetricBar label="Faithfulness" value={m.faithfulnessScore || 0} color="bg-emerald-600" />
              <MetricBar label="Citation Coverage" value={m.citationCoverage || 0} color="bg-blue-600" />
              <MetricBar label="Response Quality" value={m.responseQuality || 0} color="bg-violet-600" />
              <p className="text-sm text-rose-600">Hallucination Risk: {m.hallucinationRisk || 0}%</p>
            </div>
            <div className="card">
              <h3 className="mb-3 font-semibold">Agent Execution Stats</h3>
              {report.agentStats &&
                Object.entries(report.agentStats).map(([k, v]) => (
                  <p key={k} className="text-sm text-slate-600">
                    {k}: {v}ms
                  </p>
                ))}
              <p className="mt-2 text-sm">Tokens: {m.tokensUsed || '—'}</p>
              <p className="text-sm">Est. cost: ${(m.estimatedCostUsd || 0).toFixed(4)}</p>

              <div className="mt-4 border-t pt-4">
                <p className="mb-2 text-sm font-medium">Rate this report</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => setRating(n)}>
                      <Star
                        size={24}
                        className={n <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                      />
                    </button>
                  ))}
                </div>
                <button onClick={submitFeedback} className="btn-primary mt-2 text-xs" disabled={!rating}>
                  Submit Feedback
                </button>
              </div>
            </div>
          </div>

          <div className="card mb-6">
            <h2 className="mb-3 text-lg font-semibold">Executive Summary</h2>
            <p className="whitespace-pre-wrap text-slate-700">{report.executiveSummary}</p>
          </div>

          <div className="card mb-6">
            <h2 className="mb-3 text-lg font-semibold">Table of Contents</h2>
            <ol className="list-decimal space-y-1 pl-5">
              {(report.outline || []).map((item) => (
                <li key={item.order}>{item.title}</li>
              ))}
            </ol>
          </div>

          {(report.sections || []).map((section) => (
            <div key={section.title} className="card mb-4">
              <h2 className="mb-3 text-lg font-semibold">{section.title}</h2>
              <div className="prose prose-slate max-w-none whitespace-pre-wrap text-slate-700">
                {section.content}
              </div>
              {section.citations?.length > 0 && (
                <div className="mt-4 border-t pt-3">
                  <p className="text-xs font-medium text-slate-500">Citations</p>
                  {section.citations.map((c, i) => (
                    <p key={i} className="mt-1 text-xs text-slate-600">
                      {c.verified ? '✓' : '○'} {c.claim} — {c.sourceId}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="card">
            <h2 className="mb-3 text-lg font-semibold">References</h2>
            <ol className="list-decimal space-y-2 pl-5">
              {(report.references || []).map((ref) => (
                <li key={ref.id} className="text-sm text-slate-700">
                  <strong>{ref.title}</strong> — {ref.source}
                  {ref.excerpt && <p className="text-xs text-slate-500">{ref.excerpt}</p>}
                </li>
              ))}
            </ol>
          </div>
        </>
      )}

      {report.status === 'failed' && (
        <div className="card border-red-200 bg-red-50 text-red-700">
          Report generation failed: {report.errorMessage}
        </div>
      )}
    </div>
  );
}
