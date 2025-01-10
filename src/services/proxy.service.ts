// proxy.service.ts

export class ProxyService {
  private workerUrl: string;
  private headers: Headers;

  constructor (workerUrl: string, apiKey?: string) {
    this.workerUrl = workerUrl;
    this.headers = new Headers({ 'Content-Type': 'application/json' });
    if (apiKey) {
      this.headers.append('Authorization', `Bearer ${apiKey}`);
    }
  }

  async forward(data: any): Promise<Response> {
    try {
      const response = await fetch(this.workerUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Proxy error: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      console.error('Proxy forwarding error:', error);
      throw error;
    }
  }
}
