import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Upload, Sparkles, TrendingUp } from 'lucide-react';
import StatCard from '../components/StatCard';
import { analyticsApi } from '../api/client';

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    analyticsApi.me().then((res) => setStats(res.data.data));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-slate-500">Your research activity overview</p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Reports Generated"
          value={stats?.totalReports ?? '—'}
          icon={FileText}
        />
        <StatCard
          title="Documents Ready"
          value={stats?.documents ?? '—'}
          icon={Upload}
          color="green"
        />
        <StatCard
          title="Quick Action"
          value="Generate"
          subtitle="Start a new report"
          icon={Sparkles}
          color="amber"
        />
        <StatCard
          title="Recent Activity"
          value={stats?.recentReports?.length ?? 0}
          subtitle="Latest reports"
          icon={TrendingUp}
          color="blue"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold">Recent Reports</h2>
          {stats?.recentReports?.length ? (
            <ul className="space-y-3">
              {stats.recentReports.map((r) => (
                <li key={r._id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                  <div>
                    <p className="font-medium">{r.topic}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(r.createdAt).toLocaleDateString()} · {r.status}
                    </p>
                  </div>
                  <Link to={`/reports/${r._id}`} className="text-sm text-brand-600 hover:underline">
                    View
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500">No reports yet. Generate your first report!</p>
          )}
        </div>

        <div className="card">
          <h2 className="mb-4 text-lg font-semibold">Agent Pipeline</h2>
          <div className="space-y-2 text-sm">
            {['Planning', 'Research (RAG)', 'Writer', 'Reviewer', 'Citation Verifier'].map(
              (agent, i) => (
                <div key={agent} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                    {i + 1}
                  </span>
                  <span>{agent}</span>
                </div>
              )
            )}
          </div>
          <Link to="/generate" className="btn-primary mt-6 w-full">
            Generate New Report
          </Link>
        </div>
      </div>
    </div>
  );
}
