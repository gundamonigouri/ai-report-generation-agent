import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema(
  {
    title: String,
    content: String,
    citations: [{ claim: String, sourceId: String, excerpt: String, verified: Boolean }],
  },
  { _id: false }
);

const metricsSchema = new mongoose.Schema(
  {
    relevanceScore: Number,
    faithfulnessScore: Number,
    hallucinationRisk: Number,
    citationCoverage: Number,
    responseQuality: Number,
    retrievalAccuracy: Number,
    userRating: Number,
    tokensUsed: Number,
    estimatedCostUsd: Number,
    latencyMs: Number,
  },
  { _id: false }
);

const reportSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    topic: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'planning', 'researching', 'writing', 'reviewing', 'verifying', 'completed', 'failed'],
      default: 'pending',
    },
    outline: [{ title: String, description: String, order: Number }],
    executiveSummary: String,
    sections: [sectionSchema],
    references: [{ id: String, title: String, source: String, url: String, excerpt: String }],
    fullContent: String,
    documentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
    metrics: metricsSchema,
    agentStats: {
      planningMs: Number,
      researchMs: Number,
      writingMs: Number,
      reviewingMs: Number,
      verifyingMs: Number,
      totalMs: Number,
    },
    errorMessage: String,
  },
  { timestamps: true }
);

export const Report = mongoose.model('Report', reportSchema);
