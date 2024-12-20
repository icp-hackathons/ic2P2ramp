export const idlFactory = ({ IDL }) => {
  const BitcoinNetwork = IDL.Variant({
    'mainnet' : IDL.Null,
    'regtest' : IDL.Null,
    'testnet' : IDL.Null,
  });
  const InsufficientBalanceError = IDL.Record({
    'fee' : IDL.Nat64,
    'current_balance' : IDL.Nat64,
    'transfer_amount' : IDL.Nat64,
  });
  const VaultError = IDL.Variant({
    'InsufficientBalance' : IDL.Null,
    'InsufficientLockedBalance' : IDL.Null,
    'AddressVaultNotFound' : IDL.Null,
  });
  const RejectionCode = IDL.Variant({
    'NoError' : IDL.Null,
    'CanisterError' : IDL.Null,
    'SysTransient' : IDL.Null,
    'DestinationInvalid' : IDL.Null,
    'Unknown' : IDL.Null,
    'SysFatal' : IDL.Null,
    'CanisterReject' : IDL.Null,
  });
  const BitcoinError = IDL.Variant({
    'ParseAmountError' : IDL.Text,
    'InvalidInput' : IDL.Text,
    'ParsingError' : IDL.Text,
    'UnsupportedAddressType' : IDL.Text,
    'CryptoError' : IDL.Text,
    'InsufficientBalance' : InsufficientBalanceError,
    'VaultError' : VaultError,
    'TaprootError' : IDL.Text,
    'CallRejectionError' : IDL.Tuple(RejectionCode, IDL.Text),
    'InternalError' : IDL.Text,
    'TaprootNotFinalizable' : IDL.Null,
    'UnsupportedRune' : IDL.Text,
  });
  const Result = IDL.Variant({ 'Ok' : IDL.Null, 'Err' : BitcoinError });
  const Runes = IDL.Record({ 'decimals' : IDL.Nat8, 'symbol' : IDL.Text });
  const Result_1 = IDL.Variant({ 'Ok' : IDL.Text, 'Err' : BitcoinError });
  const Result_2 = IDL.Variant({ 'Ok' : IDL.Nat64, 'Err' : BitcoinError });
  const RuneMetadata = IDL.Record({
    'cap' : IDL.Nat,
    'premine' : IDL.Nat,
    'divisibility' : IDL.Nat8,
    'symbol' : IDL.Text,
  });
  const Result_3 = IDL.Variant({
    'Ok' : IDL.Tuple(RuneMetadata, IDL.Text),
    'Err' : BitcoinError,
  });
  const SendRequest = IDL.Record({
    'destination_address' : IDL.Text,
    'amount_in_satoshi' : IDL.Nat64,
  });
  return IDL.Service({
    'cancel_deposit' : IDL.Func([IDL.Text, IDL.Nat64], [Result], []),
    'complete_order_and_send' : IDL.Func(
        [IDL.Text, IDL.Nat64, IDL.Opt(Runes), IDL.Bool],
        [Result_1],
        [],
      ),
    'deposit_to_address_vault' : IDL.Func(
        [IDL.Text, IDL.Nat64, IDL.Opt(Runes)],
        [Result],
        [],
      ),
    'get_balance' : IDL.Func([IDL.Text], [Result_2], []),
    'get_offramper_deposits' : IDL.Func([IDL.Text], [Result_2], ['query']),
    'get_onramper_deposits' : IDL.Func([IDL.Text], [Result_2], ['query']),
    'get_p2pkh_address' : IDL.Func([], [Result_1], []),
    'get_p2tr_raw_key_spend_address' : IDL.Func([], [Result_1], []),
    'get_p2tr_script_spend_address' : IDL.Func([], [Result_1], []),
    'get_serialized_rune_metadata' : IDL.Func(
        [IDL.Text],
        [Result_3],
        ['query'],
      ),
    'lock_funds' : IDL.Func([IDL.Text, IDL.Text, IDL.Nat64], [Result], []),
    'register_runes' : IDL.Func([IDL.Vec(RuneMetadata)], [Result], []),
    'send_from_p2pkh' : IDL.Func([SendRequest], [Result_1], []),
    'send_ordinals_inscription' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Opt(IDL.Text), IDL.Text, IDL.Nat64],
        [Result_1],
        [],
      ),
    'unlock_funds' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Nat64, IDL.Opt(Runes)],
        [Result],
        [],
      ),
    'validate_rune_metadata' : IDL.Func([IDL.Text], [Result], []),
  });
};
export const init = ({ IDL }) => {
  const BitcoinNetwork = IDL.Variant({
    'mainnet' : IDL.Null,
    'regtest' : IDL.Null,
    'testnet' : IDL.Null,
  });
  return [BitcoinNetwork];
};
