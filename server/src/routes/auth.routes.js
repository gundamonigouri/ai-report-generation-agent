import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { body } from 'express-validator';
import { User } from '../models/User.js';
import { config } from '../config/index.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { detectPromptInjection, sanitizeUserInput } from '../utils/promptInjection.js';

const router = Router();

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2, max: 100 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { name, email, password } = req.body;
      const injection = detectPromptInjection(name);
      if (injection.detected) {
        return res.status(400).json({ success: false, message: 'Invalid input detected' });
      }

      const normalizedEmail = String(email).trim().toLowerCase();
      const exists = await User.findOne({ email: normalizedEmail });
      if (exists) {
        return res.status(409).json({ success: false, message: 'Email already registered' });
      }

      const user = await User.create({ name: sanitizeUserInput(name), email: normalizedEmail, password });
      const token = signToken(user);
      res.status(201).json({
        success: true,
        data: { user, token },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const normalizedEmail = String(email).trim().toLowerCase();
      const user = await User.findOne({ email: normalizedEmail }).select('+password');
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      if (!user.isActive) {
        return res.status(403).json({ success: false, message: 'Account deactivated' });
      }

      const token = signToken(user);
      const lastLoginAt = new Date();
      await User.updateOne({ _id: user._id }, { $set: { lastLoginAt } });

      const responseUser = user.toJSON();
      responseUser.lastLoginAt = lastLoginAt;

      res.json({ success: true, data: { user: responseUser, token } });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/me', authenticate, (req, res) => {
  res.json({ success: true, data: req.user });
});

export default router;
