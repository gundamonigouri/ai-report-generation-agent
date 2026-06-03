import mongoose from 'mongoose';

const agentLogSchema = new mongoose.Schema(
  {
    reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report', index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    agent: { type: String, enum: ['planning', 'research', 'writer', 'reviewer', 'citation_verifier', 'system'], required: true },
    action: String,
    prompt: { type: String, select: false },
    response: { type: String, select: false },
    promptMasked: String,
    tokensInput: Number,
    tokensOutput: Number,
    latencyMs: Number,
    model: String,
    success: { type: Boolean, default: true },
    error: String,
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export const AgentLog = mongoose.model('AgentLog', agentLogSchema);
