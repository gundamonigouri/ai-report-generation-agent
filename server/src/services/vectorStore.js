import { ChromaClient } from 'chromadb';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

let chromaClient = null;
let collection = null;
let memoryStore = new Map();

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

async function getEmbedding(text) {
  // Local hashing keeps ingestion deterministic and available without a paid embedding API.
  const dims = 384;
  const vec = new Array(dims).fill(0);
  const words = text.toLowerCase().split(/\W+/).filter(Boolean);
  words.forEach((word, i) => {
    const idx = Math.abs(hashCode(word)) % dims;
    vec[idx] += 1 / (i + 1);
  });
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

async function initChroma() {
  if (collection) return collection;
  try {
    chromaClient = new ChromaClient({
      path: `http://${config.chroma.host}:${config.chroma.port}`,
    });
    collection = await chromaClient.getOrCreateCollection({
      name: config.chroma.collection,
      metadata: { description: 'Report document embeddings' },
    });
    logger.info('ChromaDB connected');
    return collection;
  } catch (error) {
    logger.warn('ChromaDB unavailable, using in-memory vector store', { error: error.message });
    return null;
  }
}

export async function ingestDocument({ documentId, userId, text, metadata = {} }) {
  const chunks = await textSplitter.splitText(text);
  const ids = [];
  const embeddings = [];
  const documents = [];
  const metadatas = [];

  for (let i = 0; i < chunks.length; i++) {
    const id = `${documentId}_${uuidv4().slice(0, 8)}`;
    const embedding = await getEmbedding(chunks[i]);
    ids.push(id);
    embeddings.push(embedding);
    documents.push(chunks[i]);
    metadatas.push({
      documentId: String(documentId),
      userId: String(userId),
      chunkIndex: i,
      ...metadata,
    });
  }

  const col = await initChroma();
  if (col) {
    await col.add({ ids, embeddings, documents, metadatas });
  } else {
    ids.forEach((id, i) => {
      memoryStore.set(id, { embedding: embeddings[i], document: documents[i], metadata: metadatas[i] });
    });
  }

  return { chunkCount: chunks.length, chromaIds: ids };
}

function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}

export async function semanticSearch({ query, userId, documentIds = [], topK = 8 }) {
  const queryEmbedding = await getEmbedding(query);
  const col = await initChroma();

  if (col) {
    const where = { userId: String(userId) };
    if (documentIds.length) {
      const results = [];
      for (const docId of documentIds) {
        const res = await col.query({
          queryEmbeddings: [queryEmbedding],
          nResults: topK,
          where: { ...where, documentId: String(docId) },
        });
        if (res.documents?.[0]) {
          res.documents[0].forEach((doc, i) => {
            results.push({
              content: doc,
              metadata: res.metadatas?.[0]?.[i] || {},
              distance: res.distances?.[0]?.[i] ?? 1,
            });
          });
        }
      }
      return results.sort((a, b) => a.distance - b.distance).slice(0, topK);
    }

    const res = await col.query({
      queryEmbeddings: [queryEmbedding],
      nResults: topK,
      where,
    });
    return (res.documents?.[0] || []).map((doc, i) => ({
      content: doc,
      metadata: res.metadatas?.[0]?.[i] || {},
      distance: res.distances?.[0]?.[i] ?? 1,
    }));
  }

  const scored = [];
  for (const [id, entry] of memoryStore) {
    if (String(entry.metadata.userId) !== String(userId)) continue;
    if (documentIds.length && !documentIds.includes(String(entry.metadata.documentId))) continue;
    scored.push({
      content: entry.document,
      metadata: entry.metadata,
      distance: 1 - cosineSimilarity(queryEmbedding, entry.embedding),
    });
  }
  return scored.sort((a, b) => a.distance - b.distance).slice(0, topK);
}

export async function deleteDocumentVectors(chromaIds = []) {
  const col = await initChroma();
  if (col && chromaIds.length) {
    await col.delete({ ids: chromaIds });
  }
  chromaIds.forEach((id) => memoryStore.delete(id));
}
