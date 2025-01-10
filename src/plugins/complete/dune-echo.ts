import { formatEther, formatUnits } from 'viem/utils';
import { z } from 'zod';

const TokenSchema = z.object({
  address: z.string(),
  amount: z.string(),
  formattedAmount: z.string().optional(),
  symbol: z.string().optional(),
  decimals: z.number().optional(),
  name: z.string().optional(),
  type: z.enum(['Native', 'ERC20', 'ERC721', 'ERC1155', 'Unknown']).default('Unknown')
});

const TransactionSchema = z.object({
  address: z.string().optional(),
  chain: z.string(),
  chain_id: z.number(),
  block_time: z.string(),
  block_number: z.number(),
  index: z.number(),
  hash: z.string(),
  value: z.string(),
  transaction_type: z.string(),
  from: z.string(),
  to: z.string(),
  nonce: z.string(),
  gas_price: z.string(),
  gas_limit: z.string().optional(),
  success: z.boolean(),
  data: z.string(),
  logs: z.array(z.object({ address: z.string(), data: z.string(), topics: z.array(z.string()) })),
  tokens: z.array(TokenSchema).default([]),
  internal_transactions: z.array(
    z.object({
      from: z.string(),
      to: z.string(),
      value: z.string(),
      gas_limit: z.string().optional(),
      input_data: z.string().optional()
    })
  ).optional()
});

export type Transaction = z.infer<typeof TransactionSchema>;
export type TokenTransfer = z.infer<typeof TokenSchema>;

const evmAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, { message: 'Invalid EVM address format' });
// const evmTxHashSchema = z.string().regex(/^0x[a-fA-F0-9]{64}$/, { message: 'Invalid EVM transaction hash format' });

interface ProxyConfig {
  proxyUrl?: string;
  proxyKey?: string;
}

class DuneClient {
  private static instance: DuneClient;
  private config: ProxyConfig = {};
  private baseUrl: string = 'https://reverse-proxy.ciphers.workers.dev/';

  private readonly EVENT_SIGNATURES = {
    ERC20_TRANSFER: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
    ERC721_TRANSFER: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
    ERC1155_SINGLE: '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62',
    ERC1155_BATCH: '0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb'
  };

  private constructor () {
    this.config.proxyKey = import.meta.env['VITE_PROXY_KEY'];
  }

  public static getInstance(): DuneClient {
    if (!DuneClient.instance) {
      DuneClient.instance = new DuneClient();
    }
    return DuneClient.instance;
  }

  public configure(config: ProxyConfig): void {
    this.config = { ...this.config, ...config };
    if (config.proxyUrl) {
      this.baseUrl = config.proxyUrl;
    }
  }

  private validateAddress(address: string): void {
    try {
      evmAddressSchema.parse(address);
    } catch (error) {
      throw new Error(`Invalid EVM address: ${address}`);
    }
  }

  // private validateTxHash(hash: string): void {
  //   try {
  //     evmTxHashSchema.parse(hash);
  //   } catch (error) {
  //     throw new Error(`Invalid EVM transaction hash: ${hash}`);
  //   }
  // }

  private validateConfig(): void {
    if (!this.config.proxyKey) {
      throw new Error('Proxy key is not configured');
    }
  }

  //   private extractAddressFromTopic(topic: string): string {
  //     return '0x' + topic.slice(-40);
  //   }

  private decodeAmount(data: string): string {
    if (data === '0x' || data === '') return '0';
    return BigInt(data).toString();
  }
  private formatValue(value: string): string {
    try {
      if (value.startsWith('0x')) return formatEther(BigInt(value));
      return formatEther(BigInt(value));
    } catch (error) {
      return value;
    }
  }

  private formatGasPrice(gasPrice: string): string {
    try {
      if (gasPrice.startsWith('0x')) {
        const gasBigInt = BigInt(gasPrice);
        return formatUnits(gasBigInt, 9) + ' Gwei';
      }
      return formatUnits(BigInt(gasPrice), 9) + ' Gwei';
    } catch (error) {
      return gasPrice;
    }
  }

  private extractTokens(logs: { address: string, data: string, topics: string[] }[], value: string): TokenTransfer[] {
    const tokens: TokenTransfer[] = [];
    const processedTransfers = new Set<string>();

    // Add native token transfer if value is greater than 0
    if (value !== '0') {
      tokens.push({
        address: '0x0000000000000000000000000000000000000000',
        amount: value,
        formattedAmount: this.formatValue(value),
        type: 'Native'
      });
    }

    // Process token transfers from logs
    for (const log of logs) {
      const signature = log.topics[0];
      const transferKey = `${log.address}-${log.topics.join('-')}-${log.data}`;

      if (processedTransfers.has(transferKey)) continue;
      processedTransfers.add(transferKey);

      try {
        switch (signature) {
          case this.EVENT_SIGNATURES.ERC20_TRANSFER: {
            if (log.topics.length === 3) {
              const amount = this.decodeAmount(log.data);
              tokens.push({ address: log.address, amount, formattedAmount: this.formatValue(amount), type: 'ERC20' });
            }
            break;
          }
          case this.EVENT_SIGNATURES.ERC721_TRANSFER: {
            if (log.topics.length === 4) {
              tokens.push({ address: log.address, amount: '1', formattedAmount: '1', type: 'ERC721' });
            }
            break;
          }
          case this.EVENT_SIGNATURES.ERC1155_SINGLE: {
            if (log.topics.length >= 4) {
              const amount = this.decodeAmount(log.data);
              tokens.push({
                address: log.address,
                amount,
                formattedAmount: amount, // ERC1155 amounts are already in the correct format
                type: 'ERC1155'
              });
            }
            break;
          }
        }
      } catch (error) {
        console.warn(`Token extraction error for log:`, error);
      }
    }

    // If no tokens were transferred at all, return an array with a zero native transfer
    if (tokens.length === 0) {
      tokens.push({
        address: '0x0000000000000000000000000000000000000000',
        amount: '0',
        formattedAmount: '0',
        type: 'Native'
      });
    }

    return tokens;
  }

  private formatTransaction(tx: any) {
    return {
      ...tx,
      formattedValue: this.formatValue(tx.value),
      formattedGasPrice: this.formatGasPrice(tx.gas_price),
      tokens: this.extractTokens(tx.logs || [], tx.value || '0')
    };
  }

  public async fetchEchoAddr(address: string): Promise<Transaction[]> {
    this.validateConfig();
    this.validateAddress(address);

    const url = new URL(`${this.baseUrl}/transactions/${address}`);
    url.searchParams.append('key', this.config.proxyKey || '');

    try {
      const response = await fetch(url.toString(), { headers: { 'Content-Type': 'application/json' } });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Proxy API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const transactions = Array.isArray(data) ? data : (data.transactions || []);

      return transactions.map((tx: any) => {
        const formattedTx = this.formatTransaction(tx);
        const result = TransactionSchema.safeParse(formattedTx);

        if (!result.success) {
          console.error('Transaction validation error:', result.error);
          throw new Error('Invalid transaction data received from API');
        }

        return result.data;
      });
    } catch (error) {
      console.error(`Error fetching transactions for ${address}:`, error);
      throw error;
    }
  }

  // public async fetchEchoTx(hash: string): Promise<Transaction> {
  //   this.validateConfig();
  //   this.validateTxHash(hash);

  //   const url = new URL(`${this.baseUrl}/transaction/${hash}`);
  //   url.searchParams.append('key', this.config.proxyKey || '');

  //   try {
  //     const response = await fetch(url.toString(), { headers: { 'Content-Type': 'application/json' } });

  //     if (!response.ok) {
  //       const errorText = await response.text();
  //       throw new Error(`Proxy API error: ${response.status} ${errorText}`);
  //     }

  //     const tx = await response.json();
  //     const formattedTx = this.formatTransaction(tx);

  //     const result = TransactionSchema.safeParse(formattedTx);
  //     if (!result.success) {
  //       console.error('Transaction validation error:', result.error);
  //       throw new Error('Invalid transaction data received from API');
  //     }

  //     return result.data;
  //   } catch (error) {
  //     console.error(`Error fetching transaction details for ${hash}:`, error);
  //     throw error;
  //   }
  // }
}

const duneClient = DuneClient.getInstance();

export const configureDuneClient = (config: ProxyConfig): void => {
  duneClient.configure(config);
};

export const fetchEchoAddr = async (address: string): Promise<Transaction[]> => {
  return duneClient.fetchEchoAddr(address);
};

// export const fetchEchoTx = async (hash: string): Promise<Transaction> => {
//   return duneClient.fetchEchoTx(hash);
// };

// export default { configureDuneClient, fetchEchoAddr, fetchEchoTx };
export default { configureDuneClient, fetchEchoAddr };
