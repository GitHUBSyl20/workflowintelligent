'use strict';
// Client de l'API de chat textuel Vapi (https://docs.vapi.ai/chat/quickstart).
// Aucun appel, micro, synthèse vocale ni transcription audio.
// Contexte : chaînage par previousChatId (https://docs.vapi.ai/chat/session-management),
// le dernier identifiant de chat étant conservé côté serveur dans
// jimbot_conversations.vapi_last_chat_id.

class VapiError extends Error {
  constructor(code, status) {
    super(`vapi_${code}`);
    this.code = `vapi_${code}`;
    this.status = status || 0;
  }
}

function contentToText(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === 'string' ? part : part && typeof part.text === 'string' ? part.text : ''))
      .join('');
  }
  return '';
}

// Extrait le texte de la réponse et les identifiants d'appels d'outils,
// quel que soit le format (camelCase ou snake_case) des messages renvoyés.
function parseChatResponse(data) {
  const output = Array.isArray(data && data.output) ? data.output : [];
  const messages = Array.isArray(data && data.messages) ? data.messages : [];
  const reply = output
    .filter((m) => m && m.role === 'assistant')
    .map((m) => contentToText(m.content).trim())
    .filter(Boolean)
    .join('\n\n');

  const toolCallIds = new Set();
  for (const m of [...output, ...messages]) {
    if (!m || typeof m !== 'object') continue;
    for (const tc of [...(m.tool_calls || []), ...(m.toolCalls || [])]) {
      if (tc && typeof tc.id === 'string') toolCallIds.add(tc.id);
    }
    if (m.role === 'tool') {
      const id = m.tool_call_id || m.toolCallId;
      if (typeof id === 'string') toolCallIds.add(id);
    }
  }
  return { chatId: data && typeof data.id === 'string' ? data.id : null, reply, toolCallIds: [...toolCallIds].slice(0, 20) };
}

function createVapiClient(cfg) {
  const { apiUrl, privateKey, assistantId, timeoutMs } = cfg.vapi;

  async function request(method, path, body) {
    let res;
    try {
      res = await fetch(`${apiUrl}${path}`, {
        method,
        headers: { Authorization: `Bearer ${privateKey}`, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      throw new VapiError(err && err.name === 'TimeoutError' ? 'timeout' : 'unreachable');
    }
    if (!res.ok) {
      await res.text().catch(() => '');
      throw new VapiError(`http_${res.status}`, res.status);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  return {
    async chat({ input, previousChatId }) {
      const body = { assistantId, input };
      if (previousChatId) body.previousChatId = previousChatId;
      return parseChatResponse(await request('POST', '/chat', body));
    },
    async deleteChat(chatId) {
      try {
        await request('DELETE', `/chat/${encodeURIComponent(chatId)}`);
        return { ok: true };
      } catch (err) {
        // Déjà supprimé ou expiré chez Vapi : considéré comme fait.
        if (err.status === 404) return { ok: true, alreadyGone: true };
        throw err;
      }
    },
  };
}

module.exports = { createVapiClient, parseChatResponse, VapiError };
