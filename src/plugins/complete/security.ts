import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

type Bindings = { CF_ACCOUNT_ID: string, CF_HUNTING_KEY: string };

const app = new Hono<{ Bindings: Bindings }>();

const scanUrlSchema = z.object({
  url: z.string().transform((val) => {
    if (!val.startsWith('http://') && !val.startsWith('https://')) {
      return `https://${val}`;
    }
    return val;
  }).refine((val) => {
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  }, { message: 'Invalid URL format' })
});

const scanResultsSchema = z.object({ uuid: z.string().uuid() });

const scanResponseSchema = z.object({ result: z.object({ uuid: z.string() }) });

const resultsSchema = z.object({ lists: z.object({ urls: z.array(z.string()) }) });

app.get('/', (c) => {
  return c.json({
    message:
      'Welcome to the URL Scanner API. Use POST /scan_url to initiate a scan and POST /scan_results to get results.'
  });
});

app.post('/scan_url', zValidator('json', scanUrlSchema), async (c) => {
  const { url } = c.req.valid('json');

  try {
    const scanResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${c.env.CF_ACCOUNT_ID}/urlscanner/scan`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${c.env.CF_HUNTING_KEY}` },
        body: JSON.stringify({ url })
      }
    );

    if (!scanResponse.ok) {
      const errorBody = await scanResponse.text();
      throw new Error(`Scan initiation failed: ${scanResponse.status}. Body: ${errorBody}`);
    }

    const scanData = await scanResponse.json();
    console.log('Raw scan response:', JSON.stringify(scanData));

    const parseResult = scanResponseSchema.safeParse(scanData);
    if (!parseResult.success) {
      console.error('Schema validation failed:', parseResult.error);
      throw new Error('Unexpected response format from API');
    }

    const { uuid } = parseResult.data.result;

    return c.json({ uuid });
  } catch (error) {
    console.error('Error in /scan_url:', error);
    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ error: 'An unknown error occurred' }, 500);
  }
});

app.post('/scan_results', zValidator('json', scanResultsSchema), async (c) => {
  const { uuid } = c.req.valid('json');

  try {
    const resultsResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${c.env.CF_ACCOUNT_ID}/urlscanner/v2/result/${uuid}`,
      { headers: { 'Authorization': `Bearer ${c.env.CF_HUNTING_KEY}` } }
    );

    if (!resultsResponse.ok) {
      const errorBody = await resultsResponse.text();
      throw new Error(`Results fetch failed: ${resultsResponse.status}. Body: ${errorBody}`);
    }

    const resultsData = await resultsResponse.json();
    console.log('Raw API response:', JSON.stringify(resultsData));

    const parseResult = resultsSchema.safeParse(resultsData);
    if (!parseResult.success) {
      console.error('Schema validation failed:', parseResult.error);
      throw new Error('Unexpected response format from API');
    }

    const { lists } = parseResult.data;

    if (!lists || !Array.isArray(lists.urls)) {
      throw new Error('Unexpected structure in API response');
    }

    const filteredUrls = [...new Set(lists.urls)].filter(url =>
      !url.includes('googleapis') && !url.includes('getAssetImage') && !url.includes('getWalletImage')
    );

    return c.json({ filteredUrls });
  } catch (error) {
    console.error('Error in /scan_results:', error);
    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ error: 'An unknown error occurred' }, 500);
  }
});

export default app;
