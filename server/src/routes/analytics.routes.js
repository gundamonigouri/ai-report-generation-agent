import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { getDashboardStats, getUserStats } from '../services/analyticsService.js';
import { AgentLog } from '../models/AgentLog.js';
import { AuditLog } from '../models/AuditLog.js';

const router = Router();

router.use(authenticate);

router.get('/me', async (req, res, next) => {
  try {
    const stats = await getUserStats(req.user._id);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

router.get('/dashboard', authorize('admin'), async (req, res, next) => {
  try {
    const stats = await getDashboardStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

router.get('/llm-ops', authorize('admin'), async (req, res, next) => {
  try {
    const [logs, errors, recentAudits] = await Promise.all([
      AgentLog.find()
        .sort({ createdAt: -1 })
        .limit(50)
        .select('-prompt -response'),
      AgentLog.find({ success: false }).sort({ createdAt: -1 }).limit(20).select('-prompt -response'),
      AuditLog.find({ severity: { $in: ['warning', 'critical'] } })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('userId', 'name email'),
    ]);

    res.json({ success: true, data: { logs, errors, recentAudits } });
  } catch (error) {
    next(error);
  }
});

export default router;
