'use strict';
// Embeddings des requêtes. Le modèle et les dimensions DOIVENT être ceux
// utilisés pour les documents (colonne jimbot_documents.embedding_model).
// Par défaut : text-embedding-3-small, 1536 dimensions, comme le corpus
// du démonstrateur existant.

class EmbeddingError extends Error {
  constructor(code) {
    super(`embedding_${code}`);
    this.code = `embedding_${code}`;
  }
}

function createOpenAiEmbedder(cfg) {
  const { apiUrl, apiKey, model, dimensions, timeoutMs } = cfg.embeddings;
  return {
    model,
    dimensions,
    async embed(text) {
      const body = { model, input: text };
      // Le paramètre dimensions n'existe que pour la famille text-embedding-3.
      if (model.startsWith('text-embedding-3')) body.dimensions = dimensions;
      let res;
      try {
        res = await fetch(`${apiUrl}/embeddings`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch (err) {
        throw new EmbeddingError(err && err.name === 'TimeoutError' ? 'timeout' : 'unreachable');
      }
      if (!res.ok) {
        await res.text().catch(() => '');
        throw new EmbeddingError(`http_${res.status}`);
      }
      const data = await res.json();
      const vector = data && data.data && data.data[0] && data.data[0].embedding;
      if (!Array.isArray(vector)) throw new EmbeddingError('bad_response');
      if (vector.length !== dimensions) throw new EmbeddingError('dimension_mismatch');
      return vector;
    },
  };
}

module.exports = { createOpenAiEmbedder, EmbeddingError };
