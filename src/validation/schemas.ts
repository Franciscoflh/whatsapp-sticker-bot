import { z } from 'zod';

export const textMessageSchema = z.object({
  text: z.string()
    .min(1, 'Texto não pode estar vazio')
    .max(500, 'Texto muito longo (máximo 500 caracteres)')
    .refine(
      (text) => text.trim().length > 0,
      'Texto não pode conter apenas espaços em branco'
    ),
  fontSize: z.number()
    .min(12, 'Tamanho da fonte muito pequeno')
    .max(72, 'Tamanho da fonte muito grande')
    .optional()
    .default(24),
  fontColor: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve estar no formato hexadecimal (#RRGGBB)')
    .optional()
    .default('#000000'),
  backgroundColor: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor de fundo deve estar no formato hexadecimal (#RRGGBB)')
    .optional()
    .default('#FFFFFF')
});

export const imageFileSchema = z.object({
  mimetype: z.string()
    .refine(
      (type) => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(type),
      'Tipo de arquivo não suportado. Use JPEG, PNG, WebP ou GIF'
    ),
  size: z.number()
    .max(10 * 1024 * 1024, 'Arquivo muito grande (máximo 10MB)'),
  filename: z.string()
    .min(1, 'Nome do arquivo é obrigatório')
    .max(255, 'Nome do arquivo muito longo')
});

export const stickerOptionsSchema = z.object({
  quality: z.number()
    .min(1, 'Qualidade mínima é 1')
    .max(100, 'Qualidade máxima é 100')
    .optional()
    .default(80),
  size: z.number()
    .min(128, 'Tamanho mínimo é 128px')
    .max(512, 'Tamanho máximo é 512px')
    .optional()
    .default(512),
  format: z.enum(['webp', 'png'])
    .optional()
    .default('webp'),
  animated: z.boolean()
    .optional()
    .default(false)
});

export const whatsappMessageSchema = z.object({
  id: z.object({
    _serialized: z.string().min(1, 'ID da mensagem é obrigatório')
  }),
  from: z.string()
    .min(1, 'Remetente é obrigatório')
    .regex(/^\d+@c\.us$|^\d+-\d+@g\.us$/, 'Formato de ID do WhatsApp inválido'),
  to: z.string()
    .min(1, 'Destinatário é obrigatório'),
  body: z.string()
    .max(4096, 'Mensagem muito longa')
    .optional(),
  type: z.enum([
    'chat', 'image', 'video', 'audio', 'document', 'sticker', 'location', 'vcard', 'multi_vcard'
  ]),
  timestamp: z.number()
    .positive('Timestamp deve ser positivo'),
  hasMedia: z.boolean().optional()
});

export const commandSchema = z.object({
  command: z.string()
    .min(1, 'Comando não pode estar vazio')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Comando deve começar com letra e conter apenas letras, números e underscore'),
  args: z.array(z.string())
    .max(10, 'Máximo 10 argumentos permitidos')
    .optional()
    .default([]),
  userId: z.string()
    .min(1, 'ID do usuário é obrigatório')
});

export const rateLimitConfigSchema = z.object({
  windowMs: z.number()
    .min(1000, 'Janela de tempo mínima é 1 segundo')
    .max(3600000, 'Janela de tempo máxima é 1 hora'),
  maxRequests: z.number()
    .min(1, 'Mínimo 1 requisição por janela')
    .max(1000, 'Máximo 1000 requisições por janela')
});

export const environmentConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test'])
    .optional()
    .default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error'])
    .optional()
    .default('info'),
  CHROME_PATH: z.string()
    .min(1, 'Caminho do Chrome é obrigatório'),
  MAX_STICKER_SIZE: z.string()
    .regex(/^\d+$/, 'Tamanho máximo deve ser um número')
    .transform(Number)
    .refine(val => val > 0, 'Tamanho deve ser positivo')
    .optional(),
  STICKER_QUALITY: z.string()
    .regex(/^\d+$/, 'Qualidade deve ser um número')
    .transform(Number)
    .refine(val => val >= 1 && val <= 100, 'Qualidade deve estar entre 1 e 100')
    .optional()
});

export type TextMessage = z.infer<typeof textMessageSchema>;
export type ImageFile = z.infer<typeof imageFileSchema>;
export type StickerOptions = z.infer<typeof stickerOptionsSchema>;
export type WhatsAppMessage = z.infer<typeof whatsappMessageSchema>;
export type Command = z.infer<typeof commandSchema>;
export type RateLimitConfig = z.infer<typeof rateLimitConfigSchema>;
export type EnvironmentConfig = z.infer<typeof environmentConfigSchema>;

export const validateTextMessage = (data: unknown): TextMessage => {
  try {
    return textMessageSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Validação de mensagem de texto falhou: ${messages.join(', ')}`);
    }
    throw error;
  }
};

export const validateImageFile = (data: unknown): ImageFile => {
  try {
    return imageFileSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Validação de arquivo de imagem falhou: ${messages.join(', ')}`);
    }
    throw error;
  }
};

export const validateStickerOptions = (data: unknown): StickerOptions => {
  try {
    return stickerOptionsSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Validação de opções de sticker falhou: ${messages.join(', ')}`);
    }
    throw error;
  }
};

export const validateWhatsAppMessage = (data: unknown): WhatsAppMessage => {
  try {
    return whatsappMessageSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Validação de mensagem do WhatsApp falhou: ${messages.join(', ')}`);
    }
    throw error;
  }
};

export const validateCommand = (data: unknown): Command => {
  try {
    return commandSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Validação de comando falhou: ${messages.join(', ')}`);
    }
    throw error;
  }
};