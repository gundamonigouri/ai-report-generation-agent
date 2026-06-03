import fs from 'fs/promises';
import { Document } from '../models/Document.js';
import { parseDocument } from './documentParser.js';
import { ingestDocument, deleteDocumentVectors } from './vectorStore.js';

export async function processUploadedDocument({ userId, file }) {
  const doc = await Document.create({
    userId,
    filename: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    filePath: file.path,
    status: 'processing',
  });

  try {
    const text = await parseDocument(file.path, file.mimetype);
    if (!text?.trim()) {
      throw new Error('No extractable text found in document');
    }

    const { chunkCount, chromaIds } = await ingestDocument({
      documentId: doc._id,
      userId,
      text,
      metadata: { originalName: file.originalname },
    });

    doc.chunkCount = chunkCount;
    doc.chromaIds = chromaIds;
    doc.status = 'ready';
    await doc.save();
    return doc;
  } catch (error) {
    doc.status = 'failed';
    doc.errorMessage = error.message;
    await doc.save();
    throw error;
  }
}

export async function deleteDocument(doc, userId) {
  if (String(doc.userId) !== String(userId)) {
    throw new Error('Unauthorized');
  }
  await deleteDocumentVectors(doc.chromaIds || []);
  try {
    await fs.unlink(doc.filePath);
  } catch {
    /* file may already be removed */
  }
  await Document.findByIdAndDelete(doc._id);
}
