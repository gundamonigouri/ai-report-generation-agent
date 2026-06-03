import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { reportApi } from '../api/client';

export default function ReportHistory() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    reportApi.list().then((res) => setReports(res.data.data));
  }, []);

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold">Report History</h1>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-6 py-3 font-medium">Topic</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Quality</th>
              <th className="px-6 py-3 font-medium">Date</th>
              <th className="px-6 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r._id} className="border-t border-slate-100">
                <td className="px-6 py-4 font-medium">{r.topic}</td>
                <td className="px-6 py-4">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      r.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-700'
                        : r.status === 'failed'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {r.metrics?.responseQuality ? `${r.metrics.responseQuality}%` : '—'}
                </td>
                <td className="px-6 py-4 text-slate-500">
                  {new Date(r.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <Link to={`/reports/${r._id}`} className="text-brand-600 hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!reports.length && (
          <p className="p-8 text-center text-slate-500">No reports generated yet.</p>
        )}
      </div>
    </div>
  );
}
