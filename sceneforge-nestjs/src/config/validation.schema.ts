import * as Joi from 'joi';

export const validationSchema = Joi.object({
  MONGODB_URI: Joi.string().uri().required(),
  JWT_SECRET: Joi.string().min(8).required(),
  JWT_EXPIRES_IN: Joi.string().default('24h'),
  GOOGLE_CLIENT_ID: Joi.string().allow('').optional(),
  GOOGLE_CLIENT_SECRET: Joi.string().allow('').optional(),
  GOOGLE_CALLBACK_URL: Joi.string().uri().allow('').optional(),
  OPENAI_API_KEY: Joi.string().required(),
  PORT: Joi.number().default(5001),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  FRONTEND_URL: Joi.string().uri().required(),
  RATE_LIMIT_WINDOW_MS: Joi.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: Joi.number().default(100),
  REDIS_HOST: Joi.string().allow('').optional(),
  REDIS_PORT: Joi.number().allow('').optional(),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
  MAX_FILE_SIZE: Joi.number().default(10 * 1024 * 1024),
  UPLOAD_PATH: Joi.string().default('./uploads'),
}); 