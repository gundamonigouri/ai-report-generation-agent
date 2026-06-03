import { Report } from '../models/Report.js';
import { User } from '../models/User.js';
import { Document } from '../models/Document.js';
import { AgentLog } from '../models/AgentLog.js';
import { Feedback } from '../models/Feedback.js';

export async function getDashboardStats() {
  const [
    totalReports,
    activeUsers,
    topicAgg,
    avgLength,
    agentLogs,
    avgMetrics,
    avgFeedback,
    totalDocuments,
    failedReports,
  ] = await Promise.all([
    Report.countDocuments({ status: 'completed' }),
    User.countDocuments({ isActive: true }),
    Report.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$topic', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    Report.aggregate([
      { $match: { status: 'completed', fullContent: { $exists: true } } },
      { $project: { length: { $strLenCP: '$fullContent' } } },
      { $group: { _id: null, avg: { $avg: '$length' } } },
    ]),
    AgentLog.aggregate([
      {
        $group: {
          _id: '$agent',
          count: { $sum: 1 },
          avgLatency: { $avg: '$latencyMs' },
          totalTokens: { $sum: { $add: ['$tokensInput', '$tokensOutput'] } },
          failures: { $sum: { $cond: [{ $eq: ['$success', false] }, 1, 0] } },
        },
      },
    ]),
    Report.aggregate([
      { $match: { status: 'completed', 'metrics.relevanceScore': { $exists: true } } },
      {
        $group: {
          _id: null,
          relevanceScore: { $avg: '$metrics.relevanceScore' },
          faithfulnessScore: { $avg: '$metrics.faithfulnessScore' },
          hallucinationRisk: { $avg: '$metrics.hallucinationRisk' },
          citationCoverage: { $avg: '$metrics.citationCoverage' },
          responseQuality: { $avg: '$metrics.responseQuality' },
          retrievalAccuracy: { $avg: '$metrics.retrievalAccuracy' },
          totalCost: { $sum: '$metrics.estimatedCostUsd' },
          avgLatency: { $avg: '$metrics.latencyMs' },
        },
      },
    ]),
    Feedback.aggregate([{ $group: { _id: null, avgRating: { $avg: '$rating' } } }]),
    Document.countDocuments({ status: 'ready' }),
    Report.countDocuments({ status: 'failed' }),
  ]);

  const tokenStats = await AgentLog.aggregate([
    {
      $group: {
        _id: null,
        tokensInput: { $sum: '$tokensInput' },
        tokensOutput: { $sum: '$tokensOutput' },
      },
    },
  ]);

  return {
    totalReports,
    activeUsers,
    mostSearchedTopics: topicAgg.map((t) => ({ topic: t._id, count: t.count })),
    averageReportLength: Math.round(avgLength[0]?.avg || 0),
    totalDocuments,
    failedReports,
    successRate:
      totalReports + failedReports > 0
        ? Math.round((totalReports / (totalReports + failedReports)) * 100)
        : 100,
    agentExecutionStats: agentLogs.map((a) => ({
      agent: a._id,
      executions: a.count,
      avgLatencyMs: Math.round(a.avgLatency || 0),
      totalTokens: a.totalTokens || 0,
      failures: a.failures || 0,
    })),
    aiMetrics: {
      relevanceScore: Math.round(avgMetrics[0]?.relevanceScore || 0),
      faithfulnessScore: Math.round(avgMetrics[0]?.faithfulnessScore || 0),
      hallucinationRisk: Math.round(avgMetrics[0]?.hallucinationRisk || 0),
      citationCoverage: Math.round(avgMetrics[0]?.citationCoverage || 0),
      responseQuality: Math.round(avgMetrics[0]?.responseQuality || 0),
      retrievalAccuracy: Math.round(avgMetrics[0]?.retrievalAccuracy || 0),
      userFeedbackRating: Math.round((avgFeedback[0]?.avgRating || 0) * 10) / 10,
    },
    llmOps: {
      totalTokensInput: tokenStats[0]?.tokensInput || 0,
      totalTokensOutput: tokenStats[0]?.tokensOutput || 0,
      estimatedTotalCostUsd: Math.round((avgMetrics[0]?.totalCost || 0) * 10000) / 10000,
      averageLatencyMs: Math.round(avgMetrics[0]?.avgLatency || 0),
    },
  };
}

export async function getUserStats(userId) {
  const [reports, documents] = await Promise.all([
    Report.find({ userId }).sort({ createdAt: -1 }).limit(5).select('topic status createdAt metrics'),
    Document.countDocuments({ userId, status: 'ready' }),
  ]);

  const completed = await Report.countDocuments({ userId, status: 'completed' });

  return { recentReports: reports, totalReports: completed, documents };
}
