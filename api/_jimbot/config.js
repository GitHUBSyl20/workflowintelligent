'use strict';
// Configuration serveur de JimBot, lue uniquement depuis les variables
// d'environnement. Aucune valeur secrète n'a de valeur par défaut.
// Liste complète et commentée : .env.example

function int(name, fallback) {
  const v = Number.parseInt(process.env[name] || '', 10);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

function num(name, fallback) {
  const v = Number.parseFloat(process.env[name] || '');
  return Number.isFinite(v) ? v : fallback;
}

function list(name) {
  return (process.env[name] || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function load() {
  const siteUrl = (process.env.JIMBOT_SITE_URL || 'https://www.workflowintelligent.fr').replace(/\/+$/, '');
  return {
    siteUrl,
    allowedOrigins: list('JIMBOT_ALLOWED_ORIGINS').length ? list('JIMBOT_ALLOWED_ORIGINS') : [siteUrl],
    adminPath: '/admin-jimbot/',
    hashSalt: process.env.JIMBOT_HASH_SALT || '',

    supabase: {
      url: (process.env.SUPABASE_URL || '').replace(/\/+$/, ''),
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      anonKey: process.env.SUPABASE_ANON_KEY || '',
      timeoutMs: int('JIMBOT_SUPABASE_TIMEOUT_MS', 8000),
    },

    vapi: {
      apiUrl: (process.env.VAPI_API_URL || 'https://api.vapi.ai').replace(/\/+$/, ''),
      privateKey: process.env.VAPI_PRIVATE_KEY || '',
      assistantId: process.env.JIMBOT_VAPI_ASSISTANT_ID || '',
      toolSecret: process.env.JIMBOT_VAPI_TOOL_SECRET || '',
      timeoutMs: int('JIMBOT_VAPI_TIMEOUT_MS', 25000),
    },

    embeddings: {
      provider: process.env.JIMBOT_EMBEDDING_PROVIDER || 'openai',
      apiUrl: (process.env.JIMBOT_EMBEDDING_API_URL || 'https://api.openai.com/v1').replace(/\/+$/, ''),
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.JIMBOT_EMBEDDING_MODEL || 'text-embedding-3-small',
      dimensions: int('JIMBOT_EMBEDDING_DIMENSIONS', 1536),
      timeoutMs: int('JIMBOT_EMBEDDING_TIMEOUT_MS', 8000),
    },

    retrieval: {
      matchCount: int('JIMBOT_MATCH_COUNT', 6),
      minSimilarity: num('JIMBOT_MIN_SIMILARITY', 0.3),
    },

    limits: {
      maxMessageChars: int('JIMBOT_MAX_MESSAGE_CHARS', 1000),
      maxMessagesPerConversation: int('JIMBOT_MAX_MESSAGES_PER_CONVERSATION', 60),
      chatPerMinutePerIp: int('JIMBOT_RATE_CHAT_PER_MINUTE', 8),
      chatPerDayPerIp: int('JIMBOT_RATE_CHAT_PER_DAY', 150),
      contactPerHourPerIp: int('JIMBOT_RATE_CONTACT_PER_HOUR', 5),
      adminLoginPer15MinPerIp: int('JIMBOT_RATE_ADMIN_LOGIN_PER_15MIN', 10),
      toolPerMinute: int('JIMBOT_RATE_TOOL_PER_MINUTE', 120),
      conversationLockSeconds: 40,
    },

    mail: {
      provider: process.env.JIMBOT_MAIL_PROVIDER || 'smtp',
      from: process.env.JIMBOT_MAIL_FROM || '',
      to: process.env.JIMBOT_NOTIFY_TO || '',
      smtp: {
        host: process.env.JIMBOT_SMTP_HOST || 'mail.gandi.net',
        port: int('JIMBOT_SMTP_PORT', 465),
        user: process.env.JIMBOT_SMTP_USER || '',
        pass: process.env.JIMBOT_SMTP_PASSWORD || '',
      },
      resendApiKey: process.env.RESEND_API_KEY || '',
      timeoutMs: int('JIMBOT_MAIL_TIMEOUT_MS', 12000),
      maxAttempts: int('JIMBOT_MAIL_MAX_ATTEMPTS', 5),
    },

    admin: {
      emails: list('JIMBOT_ADMIN_EMAILS').map((e) => e.toLowerCase()),
    },

    cronSecret: process.env.CRON_SECRET || '',
    localMocks: process.env.JIMBOT_LOCAL_MOCKS === '1',
  };
}

// Paramètres absents, regroupés par fonctionnalité (sans jamais afficher de valeur)
function missing(cfg, feature) {
  const req = {
    session: [
      ['SUPABASE_URL', cfg.supabase.url],
      ['SUPABASE_SERVICE_ROLE_KEY', cfg.supabase.serviceRoleKey],
      ['JIMBOT_HASH_SALT', cfg.hashSalt],
    ],
    chat: [
      ['SUPABASE_URL', cfg.supabase.url],
      ['SUPABASE_SERVICE_ROLE_KEY', cfg.supabase.serviceRoleKey],
      ['VAPI_PRIVATE_KEY', cfg.vapi.privateKey],
      ['JIMBOT_VAPI_ASSISTANT_ID', cfg.vapi.assistantId],
      ['JIMBOT_HASH_SALT', cfg.hashSalt],
    ],
    tool: [
      ['SUPABASE_URL', cfg.supabase.url],
      ['SUPABASE_SERVICE_ROLE_KEY', cfg.supabase.serviceRoleKey],
      ['JIMBOT_VAPI_TOOL_SECRET', cfg.vapi.toolSecret],
      ['OPENAI_API_KEY', cfg.embeddings.apiKey],
      ['JIMBOT_HASH_SALT', cfg.hashSalt],
    ],
    mail:
      cfg.mail.provider === 'resend'
        ? [['RESEND_API_KEY', cfg.mail.resendApiKey], ['JIMBOT_MAIL_FROM', cfg.mail.from], ['JIMBOT_NOTIFY_TO', cfg.mail.to]]
        : [
            ['JIMBOT_SMTP_USER', cfg.mail.smtp.user],
            ['JIMBOT_SMTP_PASSWORD', cfg.mail.smtp.pass],
            ['JIMBOT_MAIL_FROM', cfg.mail.from],
            ['JIMBOT_NOTIFY_TO', cfg.mail.to],
          ],
    admin: [
      ['SUPABASE_URL', cfg.supabase.url],
      ['SUPABASE_ANON_KEY', cfg.supabase.anonKey],
      ['SUPABASE_SERVICE_ROLE_KEY', cfg.supabase.serviceRoleKey],
      ['JIMBOT_ADMIN_EMAILS', cfg.admin.emails.length ? 'ok' : ''],
      ['JIMBOT_HASH_SALT', cfg.hashSalt],
    ],
    cron: [
      ['CRON_SECRET', cfg.cronSecret],
      ['SUPABASE_URL', cfg.supabase.url],
      ['SUPABASE_SERVICE_ROLE_KEY', cfg.supabase.serviceRoleKey],
    ],
  }[feature] || [];
  if (cfg.localMocks) return [];
  return req.filter(([, v]) => !v).map(([k]) => k);
}

module.exports = { load, missing };
