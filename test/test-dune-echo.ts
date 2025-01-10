import { configureDuneClient, fetchEchoAddr } from '../src/plugins/complete/dune-echo';

// interface ProxyConfig {
//   proxyUrl?: string;
//   proxyKey?: string;
// }

const runTest = async () => {
  try {
    configureDuneClient({ proxyKey: 'ENTER_PROXY_KEY_HERE_AS_ENV' });
    const address = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
    // const transaction = '0x8901e9b114c37c219ea55ef9a3b75788bff6cd7c8a2ebe9315b025a53a9cb3fe';
    const transactions = await fetchEchoAddr(address);
    console.log(`{"${address}": ${JSON.stringify(transactions, null, 2)}}`);
    // const transaction_iso = await fetchEchoTx(transaction);
    // console.log('transaction_iso'+transaction_iso)
  } catch (error) {
    console.error('Error running test:', error);
  }
};

runTest();
