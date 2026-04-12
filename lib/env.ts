import { z } from "zod";

const envSchema = z.object({
  // Database — at least one is required
  POSTGRES_URL: z.string().optional(),
  DATABASE_URL: z.string().optional(),

  // Auth
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url().optional(),

  // Core secrets
  CRON_SECRET: z.string().min(1).optional(),
  HEALTH_SECRET: z.string().min(1).optional(),
  METRICS_SECRET: z.string().min(1).optional(),
  ADMIN_API_SECRET: z.string().min(1).optional(),

  // Redis (Upstash)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),

  // Email (Resend)
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().min(1).optional(),

  // S3 / Storage
  S3_BUCKET: z.string().min(1).optional(),
  S3_REGION: z.string().min(1).optional(),
  S3_ENDPOINT: z.string().min(1).optional(),
  S3_ACCESS_KEY_ID: z.string().min(1).optional(),
  S3_SECRET_ACCESS_KEY: z.string().min(1).optional(),

  // AI
  AI_PROVIDER: z.enum(["openai", "anthropic"]).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().min(1).optional(),
  ANTHROPIC_MODEL: z.string().min(1).optional(),
  AI_TEMPERATURE: z.string().optional(),
  AI_MAX_TOKENS: z.string().optional(),

  // OAuth Providers
  GITHUB_ID: z.string().min(1).optional(),
  GITHUB_SECRET: z.string().min(1).optional(),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  APPLE_ID: z.string().min(1).optional(),
  APPLE_SECRET: z.string().min(1).optional(),
  AZURE_AD_CLIENT_ID: z.string().min(1).optional(),
  AZURE_AD_CLIENT_SECRET: z.string().min(1).optional(),
  AZURE_AD_TENANT_ID: z.string().min(1).optional(),
  WECHAT_APP_ID: z.string().min(1).optional(),
  WECHAT_APP_SECRET: z.string().min(1).optional(),

  // SMS (Twilio)
  TWILIO_ACCOUNT_SID: z.string().min(1).optional(),
  TWILIO_AUTH_TOKEN: z.string().min(1).optional(),
  TWILIO_PHONE_NUMBER: z.string().min(1).optional(),

  // Telegram
  TELEGRAM_BOT_TOKEN: z.string().min(1).optional(),

  // Blockchain / Payment
  PAYMENT_RPC_URL: z.string().min(1).optional(),
  PAYMENT_PRIVATE_KEY: z.string().min(1).optional(),
  USDC_CONTRACT_ADDRESS: z.string().min(1).optional(),

  // Observability
  SENTRY_DSN: z.string().min(1).optional(),

  // Logging
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error", "fatal"]).optional(),

  // Runtime (injected by platform)
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
}).refine(
  (data) => data.POSTGRES_URL || data.DATABASE_URL,
  { message: "Either POSTGRES_URL or DATABASE_URL must be set" },
);

export type Env = z.infer<typeof envSchema>;

let _validated = false;

export function validateEnv(): Env {
  if (_validated) return process.env as unknown as Env;
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    console.error(`[env] Missing or invalid environment variables:\n${formatted}`);
    if (process.env.NODE_ENV === "production") {
      throw new Error("Environment validation failed — check server logs");
    }
  }
  _validated = true;
  return process.env as unknown as Env;
}
