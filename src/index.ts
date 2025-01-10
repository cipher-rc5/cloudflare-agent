// src/index.ts

import { Hono } from 'hono';
import { cors } from 'hono/cors';
// import { serveStatic } from 'hono/bun';

import { Env } from './types/index.types';

import { AIService } from './services/ai.service';

import { apiReference } from '@scalar/hono-api-reference';
import { openApiSpec } from './hosted-api';

import defaultCharacters from './characters/stitch.character.json';

const app = new Hono<{ Bindings: Env }>();
const api = new Hono<{ Bindings: Env }>();

// Helper function to get all characters with error handling
const getAllCharacters = async (kv: KVNamespace): Promise<any[]> => {
  try {
    const list = await kv.list();
    const customChars = await Promise.all(list.keys.map(async (key) => {
      try {
        const value = await kv.get(key.name);
        return value ? JSON.parse(value) : null;
      } catch (parseError) {
        console.error(`Error parsing character ${key.name}:`, parseError);
        return null;
      }
    }));
    // Filter out null values and combine with default characters
    return [...defaultCharacters, ...customChars.filter(char => char !== null)];
  } catch (error) {
    console.error('Error fetching characters:', error);
    return defaultCharacters;
  }
};

// Apply CORS middleware with specific options
app.use(
  '*',
  cors({
    origin: '*', // Consider restricting this in production
    allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600
  })
);

// API Routes with improved error handling
api.get('/', async (c) => {
  try {
    const status = defaultCharacters.length > 0 ? 'operational' : 'degraded';
    return c.json({
      message: 'FXN-Cloud-Agent API',
      status,
      endpoints: {
        documentation: '/api/docs',
        health: '/api/health',
        characters: '/api/characters',
        generate: '/api/generate'
      },
      version: '0.1.0',
      author: 'Cipher009'
    });
  } catch (error) {
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// unit health endpoint
api.get('/health', (c) => {
  try {
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
  } catch (error) {
    return c.json({ status: 'ERROR', error: 'Health check failed' }, 500);
  }
});

// characters endpoint
api.get('/characters', async (c) => {
  try {
    const allCharacters = await getAllCharacters(c.env.CHARACTERS);
    return c.json({
      characters: allCharacters.map(char => ({
        name: char.name,
        bio: char.character?.bio?.[0] ?? 'No bio available',
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
api.post('/create-character', async (c) => {
  try {
    const newCharacter = await c.req.json();

    // Validate required fields
    if (!newCharacter?.name || !newCharacter?.modelProvider || !newCharacter?.character) {
      return c.json({ success: false, error: 'Invalid character format: missing required fields' }, 400);
    }

    // Normalize character name
    const normalizedName = newCharacter.name.toLowerCase().trim();

    // Check for existing character
    const existingChar = await c.env.CHARACTERS.get(normalizedName);
    const existsInDefault = defaultCharacters.some(char => char.name.toLowerCase().trim() === normalizedName);

    if (existingChar || existsInDefault) {
      return c.json({ success: false, error: 'Character already exists', character: newCharacter.name }, 409);
    }

    // Store character in KV
    await c.env.CHARACTERS.put(normalizedName, JSON.stringify(newCharacter));
    return c.json({ success: true, message: 'Character created successfully', character: newCharacter }, 201);
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

// delete character by name
api.delete('/characters/:name', async (c) => {
  try {
    const name = c.req.param('name').toLowerCase().trim();

    // Check if it's a default character
    if (defaultCharacters.some(char => char.name.toLowerCase().trim() === name)) {
      return c.json({ success: false, error: 'Cannot delete default characters' }, 403);
    }

    // Check if character exists
    const exists = await c.env.CHARACTERS.get(name);
    if (!exists) {
      return c.json({ success: false, error: 'Character not found' }, 404);
    }

    // Delete character from KV
    await c.env.CHARACTERS.delete(name);
    return c.json({ success: true, message: 'Character deleted successfully' });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

api.post('/generate', async (c) => {
  const startTime = Date.now();
  try {
    const { prompt, characterName, stream = false } = await c.req.json();

    if (!prompt?.trim()) {
      return c.json({ success: false, error: 'Prompt is required and cannot be empty' }, 400);
    }

    // Find character in both default and KV storage
    let selectedCharacter;
    if (characterName) {
      const normalizedName = characterName.toLowerCase().trim();
      selectedCharacter = defaultCharacters.find(char => char.name.toLowerCase().trim() === normalizedName);

      if (!selectedCharacter) {
        const kvChar = await c.env.CHARACTERS.get(normalizedName);
        if (kvChar) {
          try {
            selectedCharacter = JSON.parse(kvChar);
          } catch (parseError) {
            console.error('Error parsing character data:', parseError);
            return c.json({ success: false, error: 'Invalid character data' }, 500);
          }
        }
      }
    } else {
      selectedCharacter = defaultCharacters[0];
    }

    if (!selectedCharacter) {
      return c.json({ success: false, error: 'Character not found' }, 404);
    }

    const aiService = new AIService(c.env, selectedCharacter);
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
api.get('/docs', apiReference({ theme: 'purple', spec: { url: '/api/openapi.json' }, pageTitle: 'FXN-Cloud-Agent' }));

api.get('/openapi.json', (c) => {
  return c.json(openApiSpec);
});

// Mount API routes under /api
app.route('/api', api);

// // Serve static frontend files
// app.get('/*', serveStatic({ root: './dist' }));

export default app;
