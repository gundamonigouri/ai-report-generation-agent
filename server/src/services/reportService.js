import { Report } from '../models/Report.js';
import { User } from '../models/User.js';
import { executeReportWorkflow } from '../agents/workflow.js';
import { computeMetrics } from './evaluationService.js';

export async function generateReport({ userId, topic, documentIds = [] }) {
  const report = await Report.create({
    userId,
    topic,
    documentIds,
    status: 'pending',
  });

  try {
    const result = await executeReportWorkflow({
      reportId: report._id,
      userId,
      topic,
      documentIds: documentIds.map(String),
      outline: [],
      researchContext: [],
      retrievedChunks: [],
      sections: [],
      references: [],
      executiveSummary: '',
      fullContent: '',
      agentStats: {},
      tokensUsed: 0,
      costUsd: 0,
      status: 'pending',
      error: null,
    });

    if (result.error) {
      await Report.findByIdAndUpdate(report._id, {
        status: 'failed',
        errorMessage: result.error,
      });
      throw new Error(result.error);
    }

    const metrics = computeMetrics({
      sections: result.sections,
      references: result.references,
      retrievedChunks: result.retrievedChunks || [],
    });

    const updated = await Report.findByIdAndUpdate(
      report._id,
      {
        status: 'completed',
        outline: result.outline,
        sections: result.sections,
        references: result.references,
        executiveSummary: result.executiveSummary,
        fullContent: result.fullContent,
        metrics: {
          ...metrics,
          tokensUsed: result.tokensUsed,
          estimatedCostUsd: result.costUsd,
          latencyMs: result.agentStats?.totalMs,
        },
        agentStats: result.agentStats,
      },
      { new: true }
    );

    await User.findByIdAndUpdate(userId, { $inc: { reportCount: 1 } });
    return updated;
  } catch (error) {
    await Report.findByIdAndUpdate(report._id, {
      status: 'failed',
      errorMessage: error.message,
    });
    throw error;
  }
}
