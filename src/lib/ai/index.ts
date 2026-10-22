// بوابة الذكاء الاصطناعي — أرث التعليم العربي
// عميل موحّد لخدمات الذكاء الاصطناعي في المنصة (محادثة، رؤية، تحويل الكلام إلى نص،
// تحويل النص إلى كلام، توليد الصور والفيديو).
//
// الإعدادات تُقرأ بالترتيب التالي:
//  1) متغيرات البيئة: AI_GATEWAY_BASE_URL و AI_GATEWAY_API_KEY (يفضَّل في الإنتاج)
//  2) ملف JSON باسم .ai-config في مجلد المشروع أو المجلد المنزلي أو /etc
//     بالصيغة: { "baseUrl": "...", "apiKey": "..." }
//
// انسخ ‎.env.example إلى ‎.env وضع قيم بوابتك الخاصة قبل التشغيل.

import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// إعدادات البوابة
export interface GatewayConfig {
  baseUrl: string;
  apiKey: string;
  chatId?: string;
  userId?: string;
  token?: string;
  // ترويسات مخصصة إضافية تُرسل مع كل الطلبات (بعض البوابات تشترط ترويسات خاصة)
  extraHeaders?: Record<string, string>;
}

// رسالة محادثة (يدعم المحتوى النصي والمتعدد الوسائط للرؤية)
export interface ChatMessageInput {
  role: string;
  content: unknown;
  name?: string;
}

export interface ChatCompletionOptions {
  model?: string;
  messages: ChatMessageInput[];
  thinking?: { type: 'enabled' | 'disabled' };
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  [key: string]: unknown;
}

export interface ChatCompletionMessage {
  role?: string;
  content?: string;
  [key: string]: unknown;
}

export interface ChatCompletionResult {
  choices: Array<{ message?: ChatCompletionMessage } & Record<string, unknown>>;
  [key: string]: unknown;
}

export interface AsrResult {
  text?: string;
  [key: string]: unknown;
}

export interface ImageGenerationResult {
  data: Array<{ base64?: string; url?: string; format?: string } & Record<string, unknown>>;
  [key: string]: unknown;
}

// تحميل الإعدادات: متغيرات البيئة أولاً ثم ملف ‎.ai-config
async function loadConfig(): Promise<GatewayConfig> {
  const baseUrl = process.env.AI_GATEWAY_BASE_URL;
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (baseUrl && apiKey) {
    return {
      baseUrl: baseUrl.replace(/\/+$/, ''),
      apiKey,
      chatId: process.env.AI_GATEWAY_CHAT_ID || undefined,
      userId: process.env.AI_GATEWAY_USER_ID || undefined,
      token: process.env.AI_GATEWAY_TOKEN || undefined,
      extraHeaders: parseExtraHeaders(process.env.AI_GATEWAY_EXTRA_HEADERS),
    };
  }

  const homeDir = os.homedir();
  const configPaths = [
    path.join(process.cwd(), '.ai-config'),
    path.join(homeDir, '.ai-config'),
    '/etc/.ai-config',
  ];
  for (const filePath of configPaths) {
    try {
      const configStr = await fs.readFile(filePath, 'utf-8');
      const config = JSON.parse(configStr) as GatewayConfig;
      if (config.baseUrl && config.apiKey) {
        return {
          ...config,
          baseUrl: config.baseUrl.replace(/\/+$/, ''),
          extraHeaders: parseExtraHeaders(undefined, config.extraHeaders),
        };
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error(`تعذر قراءة ملف الإعدادات ${filePath}:`, error);
      }
      // نتابع إلى المسار التالي
    }
  }

  throw new Error(
    'لم يتم العثور على إعدادات بوابة الذكاء الاصطناعي. ضع AI_GATEWAY_BASE_URL و AI_GATEWAY_API_KEY في ملف .env أو أنشئ ملف .ai-config بصيغة JSON.'
  );
}

// قراءة ترويسات مخصصة اختيارية للبوابة (JSON) عبر البيئة أو ملف الإعدادات
function parseExtraHeaders(raw: string | undefined, fromFile?: Record<string, string>): Record<string, string> {
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return Object.fromEntries(Object.entries(parsed).map(([k, v]) => [k, String(v)]));
      }
    } catch {
      console.error('تجاهل AI_GATEWAY_EXTRA_HEADERS — صيغة JSON غير صالحة');
    }
  }
  return fromFile || {};
}

// بناء الترويسات المشتركة لكل الطلبات
function buildHeaders(config: GatewayConfig, withJson = true): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.apiKey}`,
    ...config.extraHeaders,
  };
  if (withJson) headers['Content-Type'] = 'application/json';
  if (config.chatId) headers['X-Chat-Id'] = config.chatId;
  if (config.userId) headers['X-User-Id'] = config.userId;
  if (config.token) headers['X-Token'] = config.token;
  return headers;
}

// طلب POST موحّد مع معالجة الأخطاء
async function postJson(
  config: GatewayConfig,
  endpoint: string,
  body: unknown,
  label: string
): Promise<Response> {
  const response = await fetch(`${config.baseUrl}${endpoint}`, {
    method: 'POST',
    headers: buildHeaders(config),
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`فشل طلب ${label} برمز ${response.status}: ${errorBody}`);
  }
  return response;
}

// بوابة الذكاء الاصطناعي — نفس واجهة الاستخدام لكل خدمات المنصة
export class AIGateway {
  private config: GatewayConfig;

  chat: {
    completions: {
      create: (body: ChatCompletionOptions) => Promise<ChatCompletionResult>;
      createVision: (body: ChatCompletionOptions) => Promise<ChatCompletionResult>;
    };
  };

  audio: {
    tts: { create: (body: Record<string, unknown>) => Promise<Response> };
    asr: { create: (body: Record<string, unknown>) => Promise<AsrResult> };
  };

  images: {
    generations: {
      create: (body: Record<string, unknown>) => Promise<ImageGenerationResult>;
      edit: (body: Record<string, unknown>) => Promise<ImageGenerationResult>;
    };
    search: { create: (body: Record<string, unknown>) => Promise<Record<string, unknown>> };
  };

  video: {
    generations: { create: (body: Record<string, unknown>) => Promise<Record<string, unknown>> };
  };

  async: {
    result: { query: (taskId: string) => Promise<Record<string, unknown>> };
  };

  functions: {
    invoke: (functionName: string, args: Record<string, unknown>) => Promise<unknown>;
  };

  private constructor(config: GatewayConfig) {
    this.config = config;
    this.chat = {
      completions: {
        create: this.createChatCompletion.bind(this),
        createVision: this.createChatCompletionVision.bind(this),
      },
    };
    this.audio = {
      tts: { create: this.createAudioTTS.bind(this) },
      asr: { create: this.createAudioASR.bind(this) },
    };
    this.images = {
      generations: {
        create: this.createImageGeneration.bind(this),
        edit: this.createImageEdit.bind(this),
      },
      search: { create: this.createImageSearch.bind(this) },
    };
    this.video = {
      generations: { create: this.createVideoGeneration.bind(this) },
    };
    this.async = {
      result: { query: this.queryAsyncResult.bind(this) },
    };
    this.functions = {
      invoke: this.invokeFunction.bind(this),
    };
  }

  // إنشاء نسخة من البوابة بعد تحميل الإعدادات
  static async create(): Promise<AIGateway> {
    const config = await loadConfig();
    return new AIGateway(config);
  }

  // محادثة نصية (تدفق اختياري عبر stream: true)
  private async createChatCompletion(body: ChatCompletionOptions): Promise<ChatCompletionResult> {
    const { config } = this;
    const requestBody = { ...body, thinking: body.thinking || { type: 'disabled' } };
    const response = await postJson(config, '/chat/completions', requestBody, 'المحادثة');
    const contentType = response.headers.get('content-type') || '';
    if (requestBody.stream && (contentType.includes('text/event-stream') || contentType.includes('text/plain'))) {
      return response.body as unknown as ChatCompletionResult;
    }
    return (await response.json()) as ChatCompletionResult;
  }

  // محادثة بصرية (صور + نص)
  private async createChatCompletionVision(body: ChatCompletionOptions): Promise<ChatCompletionResult> {
    const { config } = this;
    const requestBody = { ...body, thinking: body.thinking || { type: 'disabled' } };
    const response = await postJson(config, '/chat/completions/vision', requestBody, 'المحادثة البصرية');
    const contentType = response.headers.get('content-type') || '';
    if (requestBody.stream && (contentType.includes('text/event-stream') || contentType.includes('text/plain'))) {
      return response.body as unknown as ChatCompletionResult;
    }
    return (await response.json()) as ChatCompletionResult;
  }

  // تحويل النص إلى كلام — تعيد الاستجابة الخام ليتولى المتصل معالجتها
  private async createAudioTTS(body: Record<string, unknown>): Promise<Response> {
    return postJson(this.config, '/audio/tts', body, 'تحويل النص إلى كلام');
  }

  // تحويل الكلام إلى نص
  private async createAudioASR(body: Record<string, unknown>): Promise<AsrResult> {
    const response = await postJson(this.config, '/audio/asr', body, 'تحويل الكلام إلى نص');
    return (await response.json()) as AsrResult;
  }

  // توليد الصور — تحويل النتائج إلى base64
  private async createImageGeneration(body: Record<string, unknown>): Promise<ImageGenerationResult> {
    const result = (await postJson(this.config, '/images/generations', body, 'توليد الصور').then((r) =>
      r.json()
    )) as ImageGenerationResult;
    return this.processImageResults(result);
  }

  // تعديل الصور
  private async createImageEdit(body: Record<string, unknown>): Promise<ImageGenerationResult> {
    const result = (await postJson(this.config, '/images/generations/edit', body, 'تعديل الصور').then((r) =>
      r.json()
    )) as ImageGenerationResult;
    return this.processImageResults(result);
  }

  // البحث عن الصور
  private async createImageSearch(body: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!body.query || !String(body.query).trim()) {
      throw new Error('البحث عن الصور يتطلب query غير فارغ');
    }
    const response = await postJson(this.config, '/images/search', body, 'البحث عن الصور');
    return (await response.json()) as Record<string, unknown>;
  }

  // توليد الفيديو
  private async createVideoGeneration(body: Record<string, unknown>): Promise<Record<string, unknown>> {
    const response = await postJson(this.config, '/video/generation', body, 'توليد الفيديو');
    return (await response.json()) as Record<string, unknown>;
  }

  // الاستعلام عن نتيجة مهمة غير متزامنة
  private async queryAsyncResult(taskId: string): Promise<Record<string, unknown>> {
    const response = await fetch(
      `${this.config.baseUrl}/async-result?id=${encodeURIComponent(taskId)}`,
      { headers: buildHeaders(this.config, false) }
    );
    if (!response.ok) {
      throw new Error(`فشل الاستعلام عن النتيجة برمز ${response.status}: ${await response.text()}`);
    }
    return (await response.json()) as Record<string, unknown>;
  }

  // استدعاء دالة بعيدة
  private async invokeFunction(
    functionName: string,
    args: Record<string, unknown>
  ): Promise<unknown> {
    const response = await postJson(
      this.config,
      '/functions/invoke',
      { function_name: functionName, arguments: args },
      'استدعاء الدالة'
    );
    const result = (await response.json()) as { result?: unknown };
    return result.result;
  }

  // تنزيل صور النتائج وتحويلها إلى base64
  private async processImageResults(result: ImageGenerationResult): Promise<ImageGenerationResult> {
    const data = await Promise.all(
      (result.data || []).map(async (item) => {
        if (item.url) {
          const base64 = await this.downloadImageAsBase64(item.url);
          return { ...item, base64, format: 'png' };
        }
        return item;
      })
    );
    return { ...result, data };
  }

  private async downloadImageAsBase64(imageUrl: string): Promise<string> {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`تعذر تنزيل الصورة برمز ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer).toString('base64');
    } catch (error) {
      console.error('تعذر تنزيل الصورة وتحويلها إلى base64:', error);
      throw error;
    }
  }
}

export default AIGateway;
