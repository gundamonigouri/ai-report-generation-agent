import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { Document } from '../models/Document.js';
import { processUploadedDocument, deleteDocument } from '../services/documentService.js';
import { audit } from '../middleware/audit.js';

const router = Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const docs = await Document.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: docs });
  } catch (error) {
    next(error);
  }
});

router.post('/upload', audit('document_upload', 'document'), upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const doc = await processUploadedDocument({ userId: req.user._id, file: req.file });
    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', audit('document_delete', 'document'), async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }
    await deleteDocument(doc, req.user._id);
    res.json({ success: true, message: 'Document deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
