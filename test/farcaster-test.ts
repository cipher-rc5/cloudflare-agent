// test/farcaster-test.ts

import { Context } from 'hono';
import { FarcasterService } from '../src/services/farcaster.service';
import { Env } from '../src/types';

interface PostRequest {
  text: string;
  channel: string;
}

export function createFarcasterTestHandler() {
  return async (c: Context<{ Bindings: Env }>) => {
    try {
      const { text, channel } = await c.req.json<PostRequest>();

      if (!text || !channel) {
        return c.json({ success: false, error: 'Missing required fields: text and channel are required' }, 400);
      }

      const farcasterService = new FarcasterService(c.env);
      const result = await farcasterService.sendCast(text, channel);

      if (result.success) {
        return c.json({ success: true, message: 'Cast sent successfully', result: result.result });
      } else {
        return c.json({ success: false, error: result.error }, 500);
      }
    } catch (error) {
      console.error('Farcaster test handler error:', error);
      return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
  };
}
