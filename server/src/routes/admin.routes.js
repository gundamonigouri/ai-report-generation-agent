import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { Report } from '../models/Report.js';

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/users', async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
});

router.patch('/users/:id/status', async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: Boolean(req.body.isActive) },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

router.get('/reports', async (req, res, next) => {
  try {
    const reports = await Report.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(100)
      .select('-fullContent');
    res.json({ success: true, data: reports });
  } catch (error) {
    next(error);
  }
});

export default router;
