// src/scripts/send-cast.ts

import { FarcasterService } from '../services/farcaster.service';
import type { Env } from '../types';

export async function sendCast(env: Env, text: string, channel: string) {
  const service = new FarcasterService(env);
  return await service.sendCast(text, channel);
}
