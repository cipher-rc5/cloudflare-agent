// src/services/farcaster.service.ts

import { Env } from '../types';

interface CastResponse {
  success: boolean;
  result?: any;
  error?: string;
}

export class FarcasterService {
  private env: Env;
  private readonly NEYNAR_API = 'https://api.neynar.com/v2';
  private readonly HEADERS: HeadersInit;

  constructor (env: Env) {
    this.env = env;
    this.HEADERS = { 'Content-Type': 'application/json', 'api_key': env.FARCASTER_NEYNAR_API_KEY || '' };
  }

  async sendCast(text: string, channel: string): Promise<CastResponse> {
    try {
      // Create the cast using Neynar's API
      const response = await fetch(`${this.NEYNAR_API}/farcaster/cast`, {
        method: 'POST',
        headers: this.HEADERS,
        body: JSON.stringify({
          signer_uuid: this.env.FARCASTER_NEYNAR_SIGNER_UUID,
          text: text,
          parent: channel,
          embeds: []
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Neynar API error: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      return { success: true, result: data };
    } catch (error) {
      console.error('FarcasterService error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error sending cast' };
    }
  }

  // Helper method to register a new signer if needed
  async registerSigner(): Promise<CastResponse> {
    try {
      const response = await fetch(`${this.NEYNAR_API}/farcaster/signer`, {
        method: 'POST',
        headers: this.HEADERS,
        body: JSON.stringify({ public_key: this.env.EVM_PUBLIC_ADDRESS, delegate_address: this.env.EVM_PUBLIC_ADDRESS })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to register signer: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      return { success: true, result: data };
    } catch (error) {
      console.error('Signer registration error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error registering signer' };
    }
  }
}
