// src/services/ai.service.ts

import { DEFAULT_PROVIDER, MODEL_CONFIGS } from '../config/models.config';
import { Character, Env } from '../types';

export class AIService {
  private env: Env;
  private character: Character;

  constructor (env: Env, character: Character) {
    this.env = env;
    this.character = character;
  }

  async generateText(prompt: string, stream = false): Promise<Response> {
    const systemPrompt = this.buildSystemPrompt();
    const modelProvider = this.character.modelProvider || DEFAULT_PROVIDER;
    const modelConfig = MODEL_CONFIGS[modelProvider];

    if (!modelConfig) {
      return new Response(JSON.stringify({ error: `Unsupported model provider: ${modelProvider}` }), { status: 400 });
    }

    const modelName = this.character.modelName || modelConfig.defaultModel;

    try {
      // For Cloudflare AI (meta provider)
      if (modelProvider === 'meta') {
        const ai = this.env.AI;
        const response = await ai.run(`@cf/meta/${modelName}`, {
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }],
          stream
        });

        return new Response(JSON.stringify({ content: response }), { headers: { 'Content-Type': 'application/json' } });
      }

      // For other providers
      const endpoint =
        `https://gateway.ai.cloudflare.com/v1/${this.env.CF_WORKERS_ID}/${this.env.CF_AI_GATEWAY_ID}${modelConfig.baseEndpoint}`;
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.env[modelConfig.authKey]}`,
        'cf-aig-authorization': `Bearer ${this.env.CF_AI_GATE_KEY}`
      };

      const requestBody = modelConfig.requestTransformer(systemPrompt, prompt, modelName, stream);

      if (stream) {
        return this.handleStream(endpoint, headers, requestBody, modelConfig);
      }

      const response = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(requestBody) });

      if (!response.ok) {
        throw new Error(`AI Gateway error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = modelConfig.responseTransformer(data);

      return new Response(JSON.stringify({ content }), { headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
      console.error('AI Service Error:', e);
      return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), { status: 500 });
    }
  }

  private async handleStream(
    endpoint: string,
    headers: HeadersInit,
    requestBody: any,
    modelConfig: any
  ): Promise<Response> {
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    try {
      const response = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(requestBody) });

      if (!response.ok) {
        throw new Error(`AI Gateway streaming error: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Stream response body is null');
      }

      (async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  const content = modelConfig.streamResponseTransformer(parsed);

                  if (content) {
                    await writer.write(encoder.encode(`data: ${content}\n\n`));
                  }
                } catch (e) {
                  console.error('Error parsing stream chunk:', e);
                }
              }
            }
          }
        } finally {
          await writer.close();
          reader.releaseLock();
        }
      })();

      return new Response(readable, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), { status: 500 });
    }
  }

  private buildSystemPrompt(): string {
    const { bio, lore, knowledge, style, adjectives } = this.character.character;
    return `
      You are ${this.character.name}.
      Background: ${bio.join(' ')}
      Lore: ${lore.join(' ')}
      Knowledge Areas: ${knowledge.join(', ')}
      Style: ${style.all.join(', ')}
      Personality Traits: ${adjectives.join(', ')}
      
      When responding, maintain these characteristics and incorporate relevant knowledge.
      For social posts, use style: ${style.post.join(', ')}
      For chat interactions, use style: ${style.chat.join(', ')}
    `;
  }
}
