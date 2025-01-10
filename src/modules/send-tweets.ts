// // send-tweet.ts
// import { Blob } from '@cloudflare/workers-types';
// import { Scraper } from 'agent-twitter-client';
// import { ProxyService } from '../services/proxy.service';

// // Type definitions
// type MediaData = { data: ArrayBuffer, mediaType: string };

// type TweetConfig = {
//   useProxy?: boolean,
//   workerUrl?: string,
//   apiKey?: string,
//   retryAttempts?: number,
//   retryDelay?: number
// };

// const readFileAsync = async (path: string): Promise<ArrayBuffer> => {
//   // Check if we're in Bun environment
//   if (typeof process !== 'undefined' && process.versions && process.versions.bun) {
//     const { file } = await import('bun');
//     return await file(path).arrayBuffer();
//   } else {
//     // Fallback for Cloudflare Workers environment
//     const response = await fetch(path);
//     return await response.arrayBuffer();
//   }
// };

// export class TwitterService {
//   private scraper: Scraper;
//   private proxy?: ProxyService;
//   private config: TweetConfig;

//   constructor (config: TweetConfig = {}) {
//     this.scraper = new Scraper();
//     this.config = {
//       useProxy: config.useProxy ?? false,
//       workerUrl: config.workerUrl,
//       apiKey: config.apiKey,
//       retryAttempts: config.retryAttempts ?? 3,
//       retryDelay: config.retryDelay ?? 1000
//     };

//     if (this.config.useProxy && this.config.workerUrl) {
//       this.proxy = new ProxyService(this.config.workerUrl, this.config.apiKey);
//     }
//   }

//   private async login(): Promise<void> {
//     const username = process.env['TWITTER_USERNAME'] || '';
//     const password = process.env['TWITTER_PASSWORD'] || '';
//     const email = process.env['TWITTER_EMAIL'] || '';
//     await this.scraper.login(username, password, email);
//   }

//   private getMimeType(extension: string | undefined): string | undefined {
//     const mimeTypes: Record<string, string> = {
//       jpg: 'image/jpeg',
//       jpeg: 'image/jpeg',
//       png: 'image/png',
//       gif: 'image/gif',
//       mp4: 'video/mp4'
//     };

//     return extension ? mimeTypes[extension] : undefined;
//   }

//   private async processMediaFiles(mediaPaths: string[]): Promise<MediaData[]> {
//     return Promise.all(mediaPaths.map(async (path): Promise<MediaData> => {
//       const extension = path.split('.').pop()?.toLowerCase();
//       const mimeType = this.getMimeType(extension);

//       if (!mimeType) {
//         throw new Error(`Unsupported media type for file: ${path}`);
//       }

//       const data = await readFileAsync(path);

//       return { data, mediaType: mimeType };
//     }));
//   }

//   private async sleep(ms: number): Promise<void> {
//     return new Promise(resolve => setTimeout(resolve, ms));
//   }

//   async sendTweet(content: string, mediaPaths: string[] = []): Promise<void> {
//     let lastError: Error | undefined;

//     for (let attempt = 1;attempt <= this.config.retryAttempts!;attempt++) {
//       try {
//         if (this.config.useProxy && this.proxy) {
//           // Send via Cloudflare Worker proxy
//           const mediaData = mediaPaths.length > 0 ? await this.processMediaFiles(mediaPaths) : undefined;

//           const payload = {
//             content,
//             media: mediaData?.map(m => ({ data: Buffer.from(m.data).toString('base64'), mediaType: m.mediaType }))
//           };

//           await this.proxy.forward(payload);
//           console.log('Tweet sent successfully via proxy!');
//           return;
//         } else {
//           // Send directly via scraper
//           await this.login();

//           const mediaData = mediaPaths.length > 0 ? await this.processMediaFiles(mediaPaths) : undefined;

//           const convertedMediaData = mediaData?.map(item => ({
//             data: Buffer.from(item.data),
//             mediaType: item.mediaType
//           }));

//           const response = await this.scraper.sendTweet(content, undefined, convertedMediaData);
//           console.log('Tweet sent successfully:', response);
//           return;
//         }
//       } catch (error) {
//         lastError = error as Error;
//         console.error(`Attempt ${attempt} failed:`, error);

//         if (attempt < this.config.retryAttempts!) {
//           await this.sleep(this.config.retryDelay!);
//         }
//       }
//     }

//     throw lastError || new Error('Failed to send tweet after all attempts');
//   }
// }
