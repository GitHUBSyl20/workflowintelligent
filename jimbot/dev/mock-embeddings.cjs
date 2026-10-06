'use strict';
// Générateur d'embeddings FACTICE pour les tests locaux : sac de mots haché
// sur 1536 dimensions, normalisé. Il ne remplace pas un vrai modèle mais
// produit des similarités cohérentes (mots communs => vecteurs proches).
// Le modèle déclaré est « mock-hash-1536 » : il ne peut jamais être
// confondu avec les documents de production.
const crypto = require('node:crypto');

const DIMENSIONS = 1536;
const MODEL = 'mock-hash-1536';
const STOP = new Set(('les des une est pour que qui dans par sur avec son ses aux sont pas plus vous nous votre vos quel quelle quels quelles comment faire fait elle il ils ont cette ces entre leur leurs mais donc car tout tous etre avoir peut peux pouvez sylvain magana quoi est-ce').split(' '));

function tokens(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3 && !STOP.has(w))
    .map((w) => (w.length > 4 ? w.replace(/(s|x)$/, '') : w));
}

function embed(text) {
  const v = new Array(DIMENSIONS).fill(0);
  for (const w of tokens(text)) {
    const h = crypto.createHash('sha256').update(w).digest();
    v[h.readUInt32BE(0) % DIMENSIONS] += 1;
    v[h.readUInt32BE(4) % DIMENSIONS] += 0.5;
  }
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / norm);
}

module.exports = {
  model: MODEL,
  dimensions: DIMENSIONS,
  async embed(text) {
    return embed(text);
  },
};
