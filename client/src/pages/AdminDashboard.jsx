import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import StatCard from '../components/StatCard';
import MetricBar from '../components/MetricBar';
import { analyticsApi, adminApi } from '../api/client';
import { Users, FileText, Database, Activity } from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    Promise.all([analyticsApi.dashboard(), adminApi.users()]).then(([dash, usr]) => {
      setStats(dash.data.data);
      setUsers(usr.data.data);
    });
  }, []);

  if (!stats) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  const agentData = (stats.agentExecutionStats || []).map((a) => ({
    name: a.agent,
    executions: a.executions,
    latency: a.avgLatencyMs,
  }));

  const topicData = (stats.mostSearchedTopics || []).slice(0, 5);

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Admin Dashboard</h1>
      <p className="mb-8 text-slate-500">System analytics, AI metrics, and user activity</p>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Reports" value={stats.totalReports} icon={FileText} />
        <StatCard title="Active Users" value={stats.activeUsers} icon={Users} color="green" />
        <StatCard title="Documents Indexed" value={stats.totalDocuments} icon={Database} color="blue" />
        <StatCard
          title="Success Rate"
          value={`${stats.successRate}%`}
          icon={Activity}
          color="amber"
        />
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-4 font-semibold">AI Evaluation Metrics</h3>
          <div className="space-y-3">
            <MetricBar label="Relevance Score" value={stats.aiMetrics?.relevanceScore || 0} />
            <MetricBar label="Faithfulness Score" value={stats.aiMetrics?.faithfulnessScore || 0} color="bg-emerald-600" />
            <MetricBar label="Citation Coverage" value={stats.aiMetrics?.citationCoverage || 0} color="bg-blue-600" />
            <MetricBar label="Response Quality" value={stats.aiMetrics?.responseQuality || 0} color="bg-violet-600" />
            <MetricBar label="Retrieval Accuracy" value={stats.aiMetrics?.retrievalAccuracy || 0} color="bg-amber-600" />
            <p className="text-sm">
              Hallucination Risk: <strong>{stats.aiMetrics?.hallucinationRisk || 0}%</strong>
            </p>
            <p className="text-sm">
              User Feedback: <strong>{stats.aiMetrics?.userFeedbackRating || 0} / 5</strong>
            </p>
          </div>
        </div>

        <div className="card">
          <h3 className="mb-4 font-semibold">LLMOps Summary</h3>
          <div className="space-y-2 text-sm">
            <p>Total input tokens: {stats.llmOps?.totalTokensInput?.toLocaleString()}</p>
            <p>Total output tokens: {stats.llmOps?.totalTokensOutput?.toLocaleString()}</p>
            <p>Estimated API cost: ${stats.llmOps?.estimatedTotalCostUsd?.toFixed(4)}</p>
            <p>Average latency: {stats.llmOps?.averageLatencyMs}ms</p>
            <p>Average report length: {stats.averageReportLength?.toLocaleString()} chars</p>
          </div>
        </div>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-4 font-semibold">Agent Execution Statistics</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={agentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="executions" fill="#6366f1" name="Executions" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="mb-4 font-semibold">Most Searched Topics</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={topicData} dataKey="count" nameKey="topic" cx="50%" cy="50%" outerRadius={80} label>
                {topicData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-4 font-semibold">Users</h3>
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="pb-2">Name</th>
              <th className="pb-2">Email</th>
              <th className="pb-2">Role</th>
              <th className="pb-2">Reports</th>
              <th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-t border-slate-100">
                <td className="py-3">{u.name}</td>
                <td className="py-3">{u.email}</td>
                <td className="py-3 capitalize">{u.role}</td>
                <td className="py-3">{u.reportCount}</td>
                <td className="py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
