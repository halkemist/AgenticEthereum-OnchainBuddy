// Types
interface NetworkConfig {
  baseUrl: string;
  apiKey: string | undefined;
}
interface NetworkConfigs {
  [networkID: string]: NetworkConfig;
}
interface BasicTransaction {
  hash: string;
  [key: string]: any;
}
interface ApiResponse {
  status: string;
  message: string;
  result: BasicTransaction[];
}

// Functions
export async function getTransactions(address: string, networkID: string, limit: string) {
  const NETWORK_CONFIGS: NetworkConfigs = {
    'base-mainnet': {
      baseUrl: 'https://api.basescan.org/api',
      apiKey: process.env.NEXT_PUBLIC_BASESCAN_API_KEY
    }
  } as const;

  const config = NETWORK_CONFIGS[networkID];
  if (!config) {
    throw new Error(`Network configuration not found for ${networkID}`);
  }
  
  // Get normal transactions
  const normalTxsResponse = await fetch(
    `${config.baseUrl}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=${limit}&sort=desc&apikey=${config.apiKey}`
  );
  const normalTxs: ApiResponse = await normalTxsResponse.json();

  if (normalTxs.status === '0') {
    throw new Error(normalTxs.message);
  }

  // Get internal transactions of the normal transactions
  const enrichedTxs = await Promise.all(
    normalTxs.result.map(async (tx) => {
      const internalTxsResponse = await fetch(
        `${config.baseUrl}?module=account&action=txlistinternal&txhash=${tx.hash}&apikey=${config.apiKey}`
      );
      const internalTxs: ApiResponse = await internalTxsResponse.json();

      return {
        ...tx,
        internal_transactions: internalTxs.status === '1' ? internalTxs.result : []
      };
    })
  );

  return enrichedTxs;
}