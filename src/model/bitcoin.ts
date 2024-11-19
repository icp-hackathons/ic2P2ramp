import { bitcoin_backend } from '../declarations/bitcoin_backend';

export const fetchBitcoinCanisterAddress = async () => {
  try {
    const address = await bitcoin_backend.get_p2pkh_address();
    return address;
  } catch (error) {
    console.error('Failed to fetch bitcoin canister address:', error);
    throw error;
  }
};

export const transferBitcoinToCanister = async (
  amount: bigint,
  bitcoinBackendAddress: String,
) => {
  const satoshiAmount = Number(amount);
  const txid = await (window as any).unisat.sendBitcoin(
    bitcoinBackendAddress,
    satoshiAmount,
    { feeRate: 55 },
  );

  console.log('Transaction ID:', txid);
  return txid;
};
