import { useEffect, useState } from 'react';
import { analyticsApi } from '../api/client';

export default function LLMOps() {
  const [data, setData] = useState(null);

  useEffect(() => {
    analyticsApi.llmOps().then((res) => setData(res.data.data));
  }, []);

  if (!data) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">LLMOps Monitoring</h1>
      <p className="mb-8 text-slate-500">Agent execution logs, errors, and audit trail</p>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-4 font-semibold">Recent Agent Logs</h3>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {data.logs?.map((log) => (
              <div
                key={log._id}
                className="rounded-lg border border-slate-100 p-3 text-sm"
              >
                <div className="flex justify-between">
                  <span className="font-medium capitalize">{log.agent}</span>
                  <span
                    className={`text-xs ${log.success ? 'text-emerald-600' : 'text-red-600'}`}
                  >
                    {log.success ? 'OK' : 'FAILED'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{log.action}</p>
                <p className="text-xs text-slate-400">
                  {log.latencyMs}ms · {(log.tokensInput || 0) + (log.tokensOutput || 0)} tokens
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="mb-4 font-semibold text-red-700">Recent Errors</h3>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {data.errors?.length ? (
              data.errors.map((err) => (
                <div key={err._id} className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm">
                  <p className="font-medium capitalize">{err.agent}</p>
                  <p className="text-red-700">{err.error}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(err.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-slate-500">No errors recorded</p>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-4 font-semibold">Security Audit Logs</h3>
        <div className="space-y-2">
          {data.recentAudits?.map((a) => (
            <div key={a._id} className="flex justify-between rounded-lg border border-slate-100 p-3 text-sm">
              <div>
                <p className="font-medium">{a.action}</p>
                <p className="text-xs text-slate-500">
                  {a.userId?.email || 'System'} · {a.resource}
                </p>
              </div>
              <span
                className={`text-xs font-medium ${
                  a.severity === 'critical' ? 'text-red-600' : 'text-amber-600'
                }`}
              >
                {a.severity}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
