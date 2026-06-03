import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { documentApi, reportApi } from '../api/client';

const AGENTS = ['Planning', 'Research', 'Writing', 'Reviewing', 'Citation Verification'];

export default function GenerateReport() {
  const [topic, setTopic] = useState('');
  const [documents, setDocuments] = useState([]);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeAgent, setActiveAgent] = useState(-1);
  const navigate = useNavigate();

  useEffect(() => {
    documentApi.list().then((res) => setDocuments(res.data.data.filter((d) => d.status === 'ready')));
  }, []);

  const toggleDoc = (id) => {
    setSelectedDocs((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    let step = 0;
    const interval = setInterval(() => {
      setActiveAgent(step);
      step = Math.min(step + 1, AGENTS.length - 1);
    }, 3000);

    try {
      const res = await reportApi.generate({ topic, documentIds: selectedDocs });
      clearInterval(interval);
      toast.success('Report generated successfully!');
      navigate(`/reports/${res.data.data._id}`);
    } catch (err) {
      clearInterval(interval);
      toast.error(err.response?.data?.message || 'Generation failed');
    } finally {
      setLoading(false);
      setActiveAgent(-1);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold">Generate Report</h1>
      <p className="mt-1 text-slate-500">
        Enter a research topic. Our multi-agent pipeline will plan, research, write, review, and verify citations.
      </p>

      <form onSubmit={handleGenerate} className="mt-8 space-y-6">
        <div className="card">
          <label className="label">Research Topic</label>
          <textarea
            className="input min-h-[120px]"
            placeholder="e.g., Impact of Large Language Models on Enterprise Knowledge Management"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="card">
          <label className="label">Source Documents (optional)</label>
          {documents.length ? (
            <div className="mt-2 space-y-2">
              {documents.map((doc) => (
                <label
                  key={doc._id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedDocs.includes(doc._id)}
                    onChange={() => toggleDoc(doc._id)}
                    disabled={loading}
                  />
                  <div>
                    <p className="text-sm font-medium">{doc.originalName}</p>
                    <p className="text-xs text-slate-400">{doc.chunkCount} chunks indexed</p>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              No documents uploaded. Upload PDF, DOCX, or TXT files for RAG-enhanced reports.
            </p>
          )}
        </div>

        {loading && (
          <div className="card border-brand-200 bg-brand-50">
            <div className="flex items-center gap-3">
              <Loader2 className="animate-spin text-brand-600" size={24} />
              <div>
                <p className="font-medium text-brand-900">Multi-agent workflow running...</p>
                <p className="text-sm text-brand-700">
                  {activeAgent >= 0 ? `Active: ${AGENTS[activeAgent]} Agent` : 'Initializing...'}
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              {AGENTS.map((a, i) => (
                <div
                  key={a}
                  className={`flex-1 rounded-lg py-2 text-center text-xs font-medium ${
                    i <= activeAgent ? 'bg-brand-600 text-white' : 'bg-white text-slate-400'
                  }`}
                >
                  {a.split(' ')[0]}
                </div>
              ))}
            </div>
          </div>
        )}

        <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
          {loading ? 'Generating Report...' : 'Generate Report'}
        </button>
      </form>
    </div>
  );
}
