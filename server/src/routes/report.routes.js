import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { Report } from '../models/Report.js';
import { Feedback } from '../models/Feedback.js';
import { generateReport } from '../services/reportService.js';
import { generatePDF, generateDOCX } from '../services/exportService.js';
import { detectPromptInjection, sanitizeUserInput } from '../utils/promptInjection.js';
import { audit } from '../middleware/audit.js';

const router = Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const reports = await Report.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .select('-fullContent');
    res.json({ success: true, data: reports });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/generate',
  audit('report_generate', 'report'),
  [body('topic').trim().isLength({ min: 3, max: 500 })],
  validate,
  async (req, res, next) => {
    try {
      const topic = sanitizeUserInput(req.body.topic);
      const injection = detectPromptInjection(topic);
      if (injection.detected) {
        return res.status(400).json({
          success: false,
          message: 'Potential prompt injection detected. Please revise your topic.',
        });
      }

      const documentIds = req.body.documentIds || [];
      const report = await generateReport({
        userId: req.user._id,
        topic,
        documentIds,
      });

      res.status(201).json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/:id', async (req, res, next) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, userId: req.user._id });
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/export/:format', async (req, res, next) => {
  try {
    const { format } = req.params;
    if (!['pdf', 'docx'].includes(format)) {
      return res.status(400).json({ success: false, message: 'Format must be pdf or docx' });
    }

    const report = await Report.findOne({ _id: req.params.id, userId: req.user._id });
    if (!report || report.status !== 'completed') {
      return res.status(404).json({ success: false, message: 'Report not found or not ready' });
    }

    const buffer =
      format === 'pdf' ? await generatePDF(report) : await generateDOCX(report);
    const mime =
      format === 'pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    res.setHeader('Content-Type', mime);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="report-${report._id}.${format}"`
    );
    res.send(buffer);
  } catch (error) {
    next(error);
  }
});

router.post(
  '/:id/feedback',
  [body('rating').isInt({ min: 1, max: 5 })],
  validate,
  async (req, res, next) => {
    try {
      const report = await Report.findOne({ _id: req.params.id, userId: req.user._id });
      if (!report) {
        return res.status(404).json({ success: false, message: 'Report not found' });
      }

      const feedback = await Feedback.findOneAndUpdate(
        { reportId: report._id, userId: req.user._id },
        { rating: req.body.rating, comment: req.body.comment },
        { upsert: true, new: true }
      );

      await Report.findByIdAndUpdate(report._id, {
        'metrics.userRating': req.body.rating,
      });

      res.json({ success: true, data: feedback });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
