// src/index.ts

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env } from './types';

import { AIService } from './services/ai.service';

import { createFarcasterTestHandler } from '../test/farcaster-test';

import { apiReference } from '@scalar/hono-api-reference';
import { openApiSpec } from './hosted-api';

import defaultCharacters from './characters/stitch.character.json';

const app = new Hono<{ Bindings: Env }>();

// helper function to get all characters
const getAllCharacters = async (kv: KVNamespace) => {
  try {
    const list = await kv.list();
    const customChars = await Promise.all(list.keys.map(async key => {
      const value = await kv.get(key.name);
      return value ? JSON.parse(value) : {};
    }));
    return [...defaultCharacters, ...customChars];
  } catch (error) {
    console.error('Error fetching characters:', error);
    return defaultCharacters;
  }
};

// apply CORS middleware
app.use('*', cors());

// root endpoint
app.get('/', async (c) => {
  const status = defaultCharacters.length > 0 ? 'operational' : 'degraded';

  return c.json({
    message: 'FXN-Cloud-Agent API',
    status,
    endpoints: { documentation: '/docs', health: '/health', characters: '/characters', generate: '/generate' },
    version: '0.1.0',
    author: 'Cipher009'
  });
});

// health endpoint
app.get('/health', (c) => {
  const startTime = Date.now();
  const checks = {
    characters: { status: defaultCharacters.length > 0 ? 'OK' : 'WARNING', count: defaultCharacters.length },
    uptime: process.uptime()
  };

  return c.json({
    status: 'HEALTHY',
    responseTime: Date.now() - startTime,
    timestamp: new Date().toISOString(),
    checks
  });
});

// characters endpoint
app.get('/characters', async (c) => {
  try {
    const allCharacters = await getAllCharacters(c.env.CHARACTERS);
    return c.json({
      characters: allCharacters.map(char => ({
        name: char.name,
        bio: char.character.bio[0],
        modelProvider: char.modelProvider
      })),
      totalCharacters: allCharacters.length
    });
  } catch (error) {
    return c.json({
      error: 'Failed to fetch characters',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// create character
app.post('/create-character', async (c) => {
  try {
    const newCharacter = await c.req.json();

    // Validate the structure
    if (!newCharacter.name || !newCharacter.modelProvider || !newCharacter.character) {
      return c.json({ success: false, error: 'Invalid character format' }, 400);
    }

    // Check if character exists
    const existingChar = await c.env.CHARACTERS.get(newCharacter.name.toLowerCase());
    const existsInDefault = defaultCharacters.some(char => char.name.toLowerCase() === newCharacter.name.toLowerCase());

    if (existingChar || existsInDefault) {
      return c.json({ success: false, error: 'Character already exists', character: newCharacter.name }, 409);
    }

    // Store in KV
    await c.env.CHARACTERS.put(newCharacter.name.toLowerCase(), JSON.stringify(newCharacter));

    return c.json({ success: true, message: 'Character created successfully', character: newCharacter }, 201);
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

// delete character by name
app.delete('/characters/:name', async (c) => {
  const name = c.req.param('name').toLowerCase();

  // check if character exists in default characters
  if (defaultCharacters.some(char => char.name.toLowerCase() === name)) {
    return c.json({ success: false, error: 'Cannot delete default characters' }, 403);
  }

  // check if character exists in KV
  const exists = await c.env.CHARACTERS.get(name);
  if (!exists) {
    return c.json({ success: false, error: 'Character not found' }, 404);
  }

  // delete from KV
  await c.env.CHARACTERS.delete(name);
  return c.json({ success: true, message: 'Character deleted successfully' });
});

app.post('/generate', async (c) => {
  const startTime = Date.now();
  try {
    const { prompt, characterName, stream = false } = await c.req.json();

    if (!prompt) {
      return c.json({ success: false, error: 'Prompt is required' }, 400);
    }

    // Find character in both default and KV storage
    let selectedCharacter;
    if (characterName) {
      selectedCharacter = defaultCharacters.find(char => char.name.toLowerCase() === characterName.toLowerCase());

      if (!selectedCharacter) {
        const kvChar = await c.env.CHARACTERS.get(characterName.toLowerCase());
        if (kvChar) {
          selectedCharacter = JSON.parse(kvChar);
        }
      }
    } else {
      selectedCharacter = defaultCharacters[0];
    }

    if (!selectedCharacter) {
      return c.json({ success: false, error: 'Character not found' }, 404);
    }

    const environment: Env = {
      AI: c.env.AI,
      FARCASTER_FID: c.env.FARCASTER_FID,
      EVM_PUBLIC_ADDRESS: c.env.EVM_PUBLIC_ADDRESS,
      EVM_PRIVATE_KEY: c.env.EVM_PRIVATE_KEY,
      OPENROUTER_API_KEY: c.env.OPENROUTER_API_KEY,
      CF_WORKERS_ID: c.env.CF_WORKERS_ID,
      CF_WORKERS_AI_KEY: c.env.CF_WORKERS_AI_KEY,
      CF_AI_GATEWAY_ID: c.env.CF_AI_GATEWAY_ID,
      CF_AI_GATE_KEY: c.env.CF_AI_GATE_KEY,
      OPENAI_API_KEY: c.env.OPENAI_API_KEY,
      GROK_API_KEY: c.env.GROK_API_KEY,
      FARCASTER_NEYNAR_SIGNER_UUID: c.env.FARCASTER_NEYNAR_SIGNER_UUID,
      FARCASTER_NEYNAR_API_KEY: c.env.FARCASTER_NEYNAR_API_KEY,
      CHARACTERS: c.env.CHARACTERS
    };

    console.log('Selected character:', selectedCharacter.name);
    console.log('Using model:', selectedCharacter.modelProvider);

    const aiService = new AIService(environment, selectedCharacter);
    const response = await aiService.generateText(prompt, stream);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI service error: ${response.statusText}\n${errorText}`);
    }

    const responseData = await response.json() as { content?: string };

    return c.json({
      success: true,
      response: responseData.content || '',
      character: selectedCharacter.name,
      metrics: { processingTime: Date.now() - startTime, timestamp: new Date().toISOString() }
    });
  } catch (error) {
    console.error('Generate endpoint error:', error);
    return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

// documentation endpoints
app.get('/docs', apiReference({ theme: 'purple', spec: { url: '/openapi.json' }, pageTitle: 'FXN-Cloud-Agent' }));

app.get('/openapi.json', (c) => {
  return c.json(openApiSpec);
});

// farcaster test
app.post('/test-farcaster', createFarcasterTestHandler());

export default app;
