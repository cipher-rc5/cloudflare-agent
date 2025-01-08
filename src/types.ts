// src/types.ts

import { ModelProvider } from './config/models.config';

export interface CharacterVoice {
  model: string;
}

export interface CharacterSettings {
  voice: CharacterVoice;
}

export interface CharacterDefinition {
  settings: CharacterSettings;
  bio: string[];
  lore: string[];
  knowledge: string[];
  style: { all: string[], chat: string[], post: string[] };
  adjectives: string[];
}

export interface Character {
  name: string;
  modelProvider: ModelProvider;
  modelName: string; // The specific model name (e.g., 'gpt-3.5-turbo', 'llama-3.1-8b-instruct')
  character: CharacterDefinition;
}

export interface Env {
  AI: any;
  OPENROUTER_API_KEY: string;
  CF_WORKERS_AI_KEY: string;
  CF_WORKERS_ID: string;
  CF_AI_GATE_KEY: string;
  CF_AI_GATEWAY_ID: string;
  OPENAI_API_KEY: string;
  GROK_API_KEY: string;
  EVM_PUBLIC_ADDRESS: string;
  EVM_PRIVATE_KEY: string;
  FARCASTER_FID: string;
  FARCASTER_NEYNAR_SIGNER_UUID: string;
  FARCASTER_NEYNAR_API_KEY: string;
  CHARACTERS: KVNamespace;
}
