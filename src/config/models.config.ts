// src/config/models.config.ts

export type ModelProvider = 'meta' | 'openai' | 'openrouter' | 'grok';

export interface ModelAuthKeys {
  CF_WORKERS_AI_KEY: string;
  OPENAI_API_KEY: string;
  OPENROUTER_API_KEY: string;
  GROK_API_KEY: string;
}

export interface ModelConfig {
  baseEndpoint: string;
  authKey: keyof ModelAuthKeys;
  headers?: Record<string, string>;
  defaultModel: string;
  requestTransformer: (systemPrompt: string, userPrompt: string, modelName: string, stream: boolean) => any;
  streamResponseTransformer: (parsed: any) => string;
  responseTransformer: (response: any) => string;
}

export const DEFAULT_PROVIDER: ModelProvider = 'meta';
export const DEFAULT_MODEL = 'llama-2-7b-chat-int8';

export const MODEL_CONFIGS: Record<ModelProvider, ModelConfig> = {
  meta: {
    baseEndpoint: '/worker-ai/chat',
    authKey: 'CF_WORKERS_AI_KEY',
    defaultModel: 'llama-2-7b-chat-int8',
    headers: { 'Content-Type': 'application/json' },
    requestTransformer: (systemPrompt, userPrompt, modelName, stream) => ({
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      model: `@cf/meta/${modelName}`,
      stream
    }),
    streamResponseTransformer: (parsed) => parsed.response || '',
    responseTransformer: (response) => response.response || response.choices?.[0]?.message?.content
  },

  openai: {
    baseEndpoint: '/openai/chat/completions',
    authKey: 'OPENAI_API_KEY',
    defaultModel: 'gpt-3.5-turbo',
    requestTransformer: (systemPrompt, userPrompt, modelName, stream) => ({
      model: modelName,
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      stream
    }),
    streamResponseTransformer: (parsed) => parsed.choices[0]?.delta?.content || '',
    responseTransformer: (response) => response.choices[0].message.content
  },

  openrouter: {
    baseEndpoint: '/openrouter/v1/chat/completions',
    authKey: 'OPENROUTER_API_KEY',
    defaultModel: 'openai/gpt-3.5-turbo',
    requestTransformer: (systemPrompt, userPrompt, modelName, stream) => ({
      model: modelName,
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      stream
    }),
    streamResponseTransformer: (parsed) => parsed.choices[0]?.delta?.content || '',
    responseTransformer: (response) => response.choices[0].message.content
  },

  grok: {
    baseEndpoint: '/grok/v1/chat/completions',
    authKey: 'GROK_API_KEY',
    defaultModel: 'grok-2-1212',
    requestTransformer: (systemPrompt, userPrompt, modelName, stream) => ({
      model: modelName,
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      stream,
      temperature: 0.7
    }),
    streamResponseTransformer: (parsed) => parsed.choices[0]?.delta?.content || '',
    responseTransformer: (response) => response.choices[0].message.content
  }
};
