import { HypersyncClient, TransactionField } from '@envio-dev/hypersync-client';

async function main() {
  const client = HypersyncClient.new({ url: 'https://eth.hypersync.xyz' });

  // The query to run
  const query = {
    'fromBlock': 0,
    'transactions': [
      // get transactions coming from and going to our address
      { from: ['0x5a830d7a5149b2f1a2e72d15cd51b84379ee81e5'] },
      { to: ['0x5a830d7a5149b2f1a2e72d15cd51b84379ee81e5'] }
    ],
    'fieldSelection': {
      'transaction': [
        TransactionField.BlockNumber,
        TransactionField.Hash,
        TransactionField.From,
        TransactionField.To,
        TransactionField.Value
      ]
    }
  };

  const receiver = await client.stream(query, { reverse: true });

  while (true) {
    let res = await receiver.recv();
    if (res === null) {
      break;
    }
    for (const tx of res.data.transactions) {
      console.log(tx);
    }
  }
}

main();
