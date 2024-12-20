export const idlFactory = ({ IDL }) => {
  const EcdsaCurve = IDL.Variant({ 'secp256k1' : IDL.Null });
  const EcdsaKeyId = IDL.Record({ 'name' : IDL.Text, 'curve' : EcdsaCurve });
  const RevolutConfig = IDL.Record({
    'kid' : IDL.Text,
    'tan' : IDL.Text,
    'api_url' : IDL.Text,
    'proxy_url' : IDL.Text,
    'client_id' : IDL.Text,
    'private_key_der' : IDL.Vec(IDL.Nat8),
  });
  const L2MainnetService = IDL.Variant({
    'Alchemy' : IDL.Null,
    'BlockPi' : IDL.Null,
    'PublicNode' : IDL.Null,
    'Ankr' : IDL.Null,
  });
  const HttpHeader_1 = IDL.Record({ 'value' : IDL.Text, 'name' : IDL.Text });
  const RpcApi = IDL.Record({
    'url' : IDL.Text,
    'headers' : IDL.Opt(IDL.Vec(HttpHeader_1)),
  });
  const EthMainnetService = IDL.Variant({
    'Alchemy' : IDL.Null,
    'BlockPi' : IDL.Null,
    'Cloudflare' : IDL.Null,
    'PublicNode' : IDL.Null,
    'Ankr' : IDL.Null,
  });
  const RpcServices = IDL.Variant({
    'EthSepolia' : IDL.Opt(IDL.Vec(L2MainnetService)),
    'BaseMainnet' : IDL.Opt(IDL.Vec(L2MainnetService)),
    'Custom' : IDL.Record({
      'chainId' : IDL.Nat64,
      'services' : IDL.Vec(RpcApi),
    }),
    'OptimismMainnet' : IDL.Opt(IDL.Vec(L2MainnetService)),
    'ArbitrumOne' : IDL.Opt(IDL.Vec(L2MainnetService)),
    'EthMainnet' : IDL.Opt(IDL.Vec(EthMainnetService)),
  });
  const ChainConfig = IDL.Record({
    'currency_symbol' : IDL.Text,
    'chain_id' : IDL.Nat64,
    'vault_manager_address' : IDL.Text,
    'services' : RpcServices,
  });
  const PaypalConfig = IDL.Record({
    'api_url' : IDL.Text,
    'client_id' : IDL.Text,
    'client_secret' : IDL.Text,
  });
  const UpdateArg = IDL.Record({
    'ecdsa_key_id' : IDL.Opt(EcdsaKeyId),
    'revolut' : IDL.Opt(RevolutConfig),
    'proxy_url' : IDL.Opt(IDL.Text),
    'chains' : IDL.Opt(IDL.Vec(ChainConfig)),
    'paypal' : IDL.Opt(PaypalConfig),
  });
  const InitArg = IDL.Record({
    'ecdsa_key_id' : EcdsaKeyId,
    'revolut' : RevolutConfig,
    'proxy_url' : IDL.Text,
    'chains' : IDL.Vec(ChainConfig),
    'paypal' : PaypalConfig,
  });
  const InstallArg = IDL.Variant({
    'Upgrade' : IDL.Opt(UpdateArg),
    'Reinstall' : InitArg,
  });
  const PaymentProvider = IDL.Variant({
    'PayPal' : IDL.Record({ 'id' : IDL.Text }),
    'Revolut' : IDL.Record({
      'id' : IDL.Text,
      'scheme' : IDL.Text,
      'name' : IDL.Opt(IDL.Text),
    }),
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
  const ExchangeRateError = IDL.Variant({
    'AnonymousPrincipalNotAllowed' : IDL.Null,
    'CryptoQuoteAssetNotFound' : IDL.Null,
    'FailedToAcceptCycles' : IDL.Null,
    'ForexBaseAssetNotFound' : IDL.Null,
    'CryptoBaseAssetNotFound' : IDL.Null,
    'StablecoinRateTooFewRates' : IDL.Null,
    'ForexAssetsNotFound' : IDL.Null,
    'InconsistentRatesReceived' : IDL.Null,
    'RateLimited' : IDL.Null,
    'StablecoinRateZeroRate' : IDL.Null,
    'Other' : IDL.Record({ 'code' : IDL.Nat32, 'description' : IDL.Text }),
    'ForexInvalidTimestamp' : IDL.Null,
    'NotEnoughCycles' : IDL.Null,
    'ForexQuoteAssetNotFound' : IDL.Null,
    'StablecoinRateNotFound' : IDL.Null,
    'Pending' : IDL.Null,
  });
  const SystemError = IDL.Variant({
    'HttpRequestError' : IDL.Tuple(IDL.Nat64, IDL.Text),
    'RpcError' : IDL.Text,
    'InvalidInput' : IDL.Text,
    'ICRejectionError' : IDL.Tuple(RejectionCode, IDL.Text),
    'ExchangeRateError' : ExchangeRateError,
    'ParseFloatError' : IDL.Text,
    'Pkcs8Error' : IDL.Text,
    'ParseError' : IDL.Text,
    'CurrencySymbolNotFound' : IDL.Record({}),
    'RsaError' : IDL.Text,
    'CanisterCallError' : IDL.Text,
    'InternalError' : IDL.Text,
    'Utf8Error' : IDL.Null,
  });
  const OrderError = IDL.Variant({
    'OrderProcessing' : IDL.Null,
    'OrderInLockTime' : IDL.Null,
    'PaymentVerificationFailed' : IDL.Null,
    'InvalidOnramperProvider' : IDL.Null,
    'OrderTimerNotFound' : IDL.Null,
    'OrderNotProcessing' : IDL.Null,
    'MissingDebtorAccount' : IDL.Null,
    'OrderNotFound' : IDL.Null,
    'InvalidOfframperProvider' : IDL.Null,
    'MissingAccessToken' : IDL.Null,
    'OrderUncommitted' : IDL.Null,
    'PaymentDone' : IDL.Null,
    'InvalidOrderState' : IDL.Text,
  });
  const PaymentProviderType = IDL.Variant({
    'PayPal' : IDL.Null,
    'Revolut' : IDL.Null,
  });
  const UserError = IDL.Variant({
    'UserNotOfframper' : IDL.Null,
    'UserNotOnramper' : IDL.Null,
    'UserBanned' : IDL.Null,
    'SignatureRequired' : IDL.Null,
    'SessionNotFound' : IDL.Null,
    'ProviderNotInUser' : PaymentProviderType,
    'InvalidSignature' : IDL.Null,
    'PasswordRequired' : IDL.Null,
    'TokenExpired' : IDL.Null,
    'Unauthorized' : IDL.Null,
    'TokenInvalid' : IDL.Null,
    'OnlyController' : IDL.Null,
    'UserNotFound' : IDL.Null,
    'UnauthorizedPrincipal' : IDL.Null,
    'InvalidPassword' : IDL.Null,
  });
  const BlockchainError = IDL.Variant({
    'InvalidAddress' : IDL.Null,
    'TransactionTimeout' : IDL.Null,
    'ReplacementUnderpriced' : IDL.Null,
    'UnsupportedBlockchain' : IDL.Null,
    'LedgerPrincipalNotSupported' : IDL.Text,
    'EvmExecutionReverted' : IDL.Tuple(IDL.Int64, IDL.Text),
    'EvmLogError' : IDL.Text,
    'EthersAbiError' : IDL.Text,
    'ChainIdNotFound' : IDL.Nat64,
    'FundsTooLow' : IDL.Null,
    'GasLogError' : IDL.Text,
    'NonceTooLow' : IDL.Null,
    'NonceLockTimeout' : IDL.Nat64,
    'FundsBelowFees' : IDL.Null,
    'UnregisteredEvmToken' : IDL.Null,
    'EmptyTransactionHash' : IDL.Null,
    'NonceTooHigh' : IDL.Null,
    'GasEstimationFailed' : IDL.Null,
    'VaultManagerAddressNotFound' : IDL.Nat64,
    'InsufficientFunds' : IDL.Null,
    'InconsistentStatus' : IDL.Null,
    'RpcProviderNotFound' : IDL.Null,
  });
  const RampError = IDL.Variant({
    'SystemError' : SystemError,
    'OrderError' : OrderError,
    'UserError' : UserError,
    'BlockchainError' : BlockchainError,
  });
  const Result = IDL.Variant({ 'Ok' : IDL.Null, 'Err' : RampError });
  const AddressType = IDL.Variant({
    'EVM' : IDL.Null,
    'ICP' : IDL.Null,
    'Solana' : IDL.Null,
    'Bitcoin' : IDL.Null,
  });
  const TransactionAddress = IDL.Record({
    'address_type' : AddressType,
    'address' : IDL.Text,
  });
  const LoginAddress = IDL.Variant({
    'EVM' : IDL.Record({ 'address' : IDL.Text }),
    'ICP' : IDL.Record({ 'principal_id' : IDL.Text }),
    'Email' : IDL.Record({ 'email' : IDL.Text }),
    'Solana' : IDL.Record({ 'address' : IDL.Text }),
  });
  const AuthenticationData = IDL.Record({
    'signature' : IDL.Opt(IDL.Text),
    'password' : IDL.Opt(IDL.Text),
  });
  const UserType = IDL.Variant({
    'Offramper' : IDL.Null,
    'Onramper' : IDL.Null,
  });
  const Session = IDL.Record({ 'token' : IDL.Text, 'expires_at' : IDL.Nat64 });
  const User = IDL.Record({
    'id' : IDL.Nat64,
    'user_type' : UserType,
    'fiat_amounts' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Nat64)),
    'payment_providers' : IDL.Vec(PaymentProvider),
    'score' : IDL.Int32,
    'login' : LoginAddress,
    'evm_auth_message' : IDL.Opt(IDL.Text),
    'addresses' : IDL.Vec(TransactionAddress),
    'session' : IDL.Opt(Session),
    'hashed_password' : IDL.Opt(IDL.Text),
  });
  const Result_1 = IDL.Variant({ 'Ok' : User, 'Err' : RampError });
  const Result_2 = IDL.Variant({ 'Ok' : IDL.Nat, 'Err' : RampError });
  const Blockchain = IDL.Variant({
    'EVM' : IDL.Record({ 'chain_id' : IDL.Nat64 }),
    'ICP' : IDL.Record({ 'ledger_principal' : IDL.Principal }),
    'Solana' : IDL.Null,
    'Bitcoin' : IDL.Null,
  });
  const Crypto = IDL.Record({
    'fee' : IDL.Nat,
    'token' : IDL.Opt(IDL.Text),
    'blockchain' : Blockchain,
    'amount' : IDL.Nat,
  });
  const Result_3 = IDL.Variant({
    'Ok' : IDL.Tuple(IDL.Nat64, IDL.Nat64),
    'Err' : RampError,
  });
  const Result_4 = IDL.Variant({ 'Ok' : IDL.Nat64, 'Err' : RampError });
  const EvmOrderInput = IDL.Record({
    'estimated_gas_withdraw' : IDL.Nat64,
    'estimated_gas_lock' : IDL.Nat64,
    'tx_hash' : IDL.Text,
  });
  const Result_5 = IDL.Variant({ 'Ok' : IDL.Text, 'Err' : RampError });
  const TransactionVariant = IDL.Variant({
    'Native' : IDL.Null,
    'Token' : IDL.Null,
  });
  const TransactionAction = IDL.Variant({
    'Release' : TransactionVariant,
    'Uncommit' : IDL.Null,
    'Transfer' : TransactionVariant,
    'Cancel' : TransactionVariant,
    'Commit' : IDL.Null,
  });
  const Result_6 = IDL.Variant({
    'Ok' : IDL.Opt(IDL.Tuple(IDL.Nat64, IDL.Nat)),
    'Err' : RampError,
  });
  const Token = IDL.Record({
    'decimals' : IDL.Nat8,
    'address' : IDL.Text,
    'rate_symbol' : IDL.Text,
  });
  const Result_7 = IDL.Variant({ 'Ok' : IDL.Vec(Token), 'Err' : RampError });
  const Result_8 = IDL.Variant({ 'Ok' : IDL.Float64, 'Err' : RampError });
  const IcpToken = IDL.Record({
    'fee' : IDL.Nat,
    'decimals' : IDL.Nat8,
    'symbol' : IDL.Text,
  });
  const Result_9 = IDL.Variant({ 'Ok' : IcpToken, 'Err' : RampError });
  const Order = IDL.Record({
    'id' : IDL.Nat64,
    'created_at' : IDL.Nat64,
    'offramper_user_id' : IDL.Nat64,
    'crypto' : Crypto,
    'currency' : IDL.Text,
    'offramper_providers' : IDL.Vec(
      IDL.Tuple(PaymentProviderType, PaymentProvider)
    ),
    'offramper_address' : TransactionAddress,
    'processing' : IDL.Bool,
  });
  const Onramper = IDL.Record({
    'provider' : PaymentProvider,
    'user_id' : IDL.Nat64,
    'address' : TransactionAddress,
  });
  const RevolutConsent = IDL.Record({ 'id' : IDL.Text, 'url' : IDL.Text });
  const LockedOrder = IDL.Record({
    'locked_at' : IDL.Nat64,
    'payment_done' : IDL.Bool,
    'offramper_fee' : IDL.Nat64,
    'base' : Order,
    'uncommited' : IDL.Bool,
    'onramper' : Onramper,
    'price' : IDL.Nat64,
    'payment_id' : IDL.Opt(IDL.Text),
    'revolut_consent' : IDL.Opt(RevolutConsent),
  });
  const CompletedOrder = IDL.Record({
    'offramper_fee' : IDL.Nat64,
    'onramper' : TransactionAddress,
    'offramper' : TransactionAddress,
    'blockchain' : Blockchain,
    'price' : IDL.Nat64,
    'completed_at' : IDL.Nat64,
  });
  const OrderState = IDL.Variant({
    'Locked' : LockedOrder,
    'Cancelled' : IDL.Nat64,
    'Created' : Order,
    'Completed' : CompletedOrder,
  });
  const Result_10 = IDL.Variant({ 'Ok' : OrderState, 'Err' : RampError });
  const LogEntry = IDL.Record({
    'transactionHash' : IDL.Opt(IDL.Text),
    'blockNumber' : IDL.Opt(IDL.Nat),
    'data' : IDL.Text,
    'blockHash' : IDL.Opt(IDL.Text),
    'transactionIndex' : IDL.Opt(IDL.Nat),
    'topics' : IDL.Vec(IDL.Text),
    'address' : IDL.Text,
    'logIndex' : IDL.Opt(IDL.Nat),
    'removed' : IDL.Bool,
  });
  const TransactionReceipt = IDL.Record({
    'to' : IDL.Text,
    'status' : IDL.Nat,
    'transactionHash' : IDL.Text,
    'blockNumber' : IDL.Nat,
    'from' : IDL.Text,
    'logs' : IDL.Vec(LogEntry),
    'blockHash' : IDL.Text,
    'type' : IDL.Text,
    'transactionIndex' : IDL.Nat,
    'effectiveGasPrice' : IDL.Nat,
    'logsBloom' : IDL.Text,
    'contractAddress' : IDL.Opt(IDL.Text),
    'gasUsed' : IDL.Nat,
  });
  const SignRequestCandid = IDL.Record({
    'to' : IDL.Opt(IDL.Text),
    'gas' : IDL.Nat,
    'value' : IDL.Opt(IDL.Nat),
    'max_priority_fee_per_gas' : IDL.Opt(IDL.Nat),
    'data' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'from' : IDL.Opt(IDL.Text),
    'max_fee_per_gas' : IDL.Opt(IDL.Nat),
    'chain_id' : IDL.Nat64,
    'nonce' : IDL.Opt(IDL.Nat),
  });
  const TransactionStatus = IDL.Variant({
    'BroadcastError' : RampError,
    'Failed' : IDL.Text,
    'Broadcasting' : IDL.Null,
    'Confirmed' : TransactionReceipt,
    'Unresolved' : IDL.Tuple(IDL.Text, SignRequestCandid),
    'Broadcasted' : IDL.Tuple(IDL.Text, SignRequestCandid),
    'Pending' : IDL.Null,
  });
  const EvmTransactionLog = IDL.Record({
    'status' : TransactionStatus,
    'action' : TransactionAction,
    'order_id' : IDL.Nat64,
  });
  const Result_11 = IDL.Variant({
    'Ok' : IDL.Opt(EvmTransactionLog),
    'Err' : RampError,
  });
  const OrderStateFilter = IDL.Variant({
    'Locked' : IDL.Null,
    'Cancelled' : IDL.Null,
    'Created' : IDL.Null,
    'Completed' : IDL.Null,
  });
  const OrderFilter = IDL.Variant({
    'ByOfframperId' : IDL.Nat64,
    'ByOfframperAddress' : TransactionAddress,
    'ByState' : OrderStateFilter,
    'ByBlockchain' : Blockchain,
    'ByOnramperId' : IDL.Nat64,
    'LockedByOnramper' : TransactionAddress,
  });
  const Result_12 = IDL.Variant({
    'Ok' : IDL.Opt(IDL.Nat64),
    'Err' : RampError,
  });
  const Result_13 = IDL.Variant({
    'Ok' : IDL.Tuple(IDL.Nat, IDL.Nat),
    'Err' : RampError,
  });
  const GasRecord = IDL.Record({
    'gas' : IDL.Nat64,
    'block_number' : IDL.Nat,
    'gas_price' : IDL.Nat,
  });
  const GasUsage = IDL.Record({ 'records' : IDL.Vec(GasRecord) });
  const ChainGasTracking = IDL.Record({
    'uncommit_gas' : GasUsage,
    'release_token_gas' : GasUsage,
    'cancel_token_gas' : GasUsage,
    'cancel_native_gas' : GasUsage,
    'release_native_gas' : GasUsage,
    'commit_gas' : GasUsage,
  });
  const Result_14 = IDL.Variant({ 'Ok' : ChainGasTracking, 'Err' : RampError });
  const ExchangeRateCache = IDL.Record({
    'rate' : IDL.Float64,
    'timestamp' : IDL.Nat64,
  });
  const HttpHeader = IDL.Record({ 'value' : IDL.Text, 'name' : IDL.Text });
  const HttpResponse = IDL.Record({
    'status' : IDL.Nat,
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(HttpHeader),
  });
  const TransformArgs = IDL.Record({
    'context' : IDL.Vec(IDL.Nat8),
    'response' : HttpResponse,
  });
  const Result_15 = IDL.Variant({
    'Ok' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Float64)),
    'Err' : RampError,
  });
  return IDL.Service({
    'add_user_payment_provider' : IDL.Func(
        [IDL.Nat64, IDL.Text, PaymentProvider],
        [Result],
        [],
      ),
    'add_user_transaction_address' : IDL.Func(
        [IDL.Nat64, IDL.Text, TransactionAddress],
        [Result],
        [],
      ),
    'authenticate_user' : IDL.Func(
        [LoginAddress, IDL.Opt(AuthenticationData)],
        [Result_1],
        [],
      ),
    'calculate_order_evm_fees' : IDL.Func(
        [IDL.Nat64, IDL.Nat, IDL.Opt(IDL.Text), IDL.Nat64, IDL.Nat64],
        [Result_2],
        [],
      ),
    'calculate_order_price' : IDL.Func([IDL.Text, Crypto], [Result_3], []),
    'cancel_order' : IDL.Func([IDL.Nat64, IDL.Text], [Result], []),
    'clean_old_spent_txs' : IDL.Func([], [], []),
    'create_evm_order_with_tx' : IDL.Func(
        [
          IDL.Nat64,
          IDL.Text,
          IDL.Nat64,
          IDL.Text,
          IDL.Vec(IDL.Tuple(PaymentProviderType, PaymentProvider)),
          IDL.Text,
          IDL.Nat,
          IDL.Opt(IDL.Text),
        ],
        [Result_4],
        [],
      ),
    'create_order' : IDL.Func(
        [
          IDL.Text,
          IDL.Text,
          IDL.Vec(IDL.Tuple(PaymentProviderType, PaymentProvider)),
          Blockchain,
          IDL.Opt(IDL.Text),
          IDL.Nat,
          TransactionAddress,
          IDL.Nat64,
          IDL.Opt(EvmOrderInput),
        ],
        [Result_4],
        [],
      ),
    'execute_revolut_payment' : IDL.Func(
        [IDL.Nat64, IDL.Text],
        [Result_5],
        ['query'],
      ),
    'freeze_order' : IDL.Func([IDL.Nat64, IDL.Nat64, IDL.Text], [Result], []),
    'generate_evm_auth_message' : IDL.Func([LoginAddress], [Result_5], []),
    'get_average_gas_prices' : IDL.Func(
        [IDL.Nat64, IDL.Nat64, TransactionAction],
        [Result_6],
        [],
      ),
    'get_evm_address' : IDL.Func([], [IDL.Text], ['query']),
    'get_evm_tokens' : IDL.Func([IDL.Nat64], [Result_7], ['query']),
    'get_exchange_rate' : IDL.Func([IDL.Text, IDL.Text], [Result_8], []),
    'get_icp_token_info' : IDL.Func([IDL.Principal], [Result_9], ['query']),
    'get_offramper_fee' : IDL.Func([IDL.Nat64], [IDL.Nat64], ['query']),
    'get_order' : IDL.Func([IDL.Nat64], [Result_10], ['query']),
    'get_order_tx_log' : IDL.Func(
        [IDL.Nat64, IDL.Opt(IDL.Tuple(IDL.Nat64, IDL.Text))],
        [Result_11],
        ['query'],
      ),
    'get_orders' : IDL.Func(
        [IDL.Opt(OrderFilter), IDL.Opt(IDL.Nat32), IDL.Opt(IDL.Nat32)],
        [IDL.Vec(OrderState)],
        ['query'],
      ),
    'get_pending_txs' : IDL.Func([], [IDL.Vec(EvmTransactionLog)], ['query']),
    'get_user' : IDL.Func([IDL.Nat64], [Result_1], ['query']),
    'lock_order' : IDL.Func(
        [IDL.Nat64, IDL.Text, IDL.Nat64, PaymentProvider, TransactionAddress],
        [Result],
        [],
      ),
    'print_constants' : IDL.Func([], [IDL.Text], ['query']),
    'refetch_user' : IDL.Func([IDL.Nat64, IDL.Text], [Result_1], ['query']),
    'register_evm_tokens' : IDL.Func(
        [IDL.Nat64, IDL.Vec(IDL.Tuple(IDL.Text, IDL.Nat8, IDL.Text))],
        [Result],
        [],
      ),
    'register_icp_tokens' : IDL.Func([IDL.Vec(IDL.Text)], [Result], []),
    'register_user' : IDL.Func(
        [UserType, IDL.Vec(PaymentProvider), LoginAddress, IDL.Opt(IDL.Text)],
        [Result_1],
        [],
      ),
    'remove_user' : IDL.Func([IDL.Nat64], [Result_1], []),
    'remove_user_payment_provider' : IDL.Func(
        [IDL.Nat64, IDL.Text, PaymentProvider],
        [Result],
        [],
      ),
    'resolve_tx_status' : IDL.Func([IDL.Nat64, IDL.Text, IDL.Nat64], [], []),
    'retry_order_completion' : IDL.Func([IDL.Nat64], [Result], []),
    'retry_order_unlock' : IDL.Func([IDL.Nat64], [Result], []),
    'test_estimate_gas_commit' : IDL.Func(
        [IDL.Nat64, IDL.Text, IDL.Opt(IDL.Text), IDL.Nat],
        [Result_12],
        [],
      ),
    'test_get_consent_url' : IDL.Func([], [Result_5], []),
    'test_get_fee_estimates' : IDL.Func([IDL.Nat64], [Result_13], []),
    'test_get_gas_tracking' : IDL.Func([IDL.Nat64], [Result_14], ['query']),
    'test_get_latest_block' : IDL.Func([IDL.Nat64], [Result_2], []),
    'test_get_latest_nonce' : IDL.Func([IDL.Nat64], [Result_2], []),
    'test_get_rates' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Tuple(IDL.Text, IDL.Text), ExchangeRateCache))],
        ['query'],
      ),
    'test_get_revolut_payment_details' : IDL.Func([IDL.Text], [Result], []),
    'test_get_revolut_payment_token' : IDL.Func([IDL.Text], [Result_5], []),
    'test_paypal' : IDL.Func([], [Result_5], []),
    'top_up_order' : IDL.Func(
        [
          IDL.Nat64,
          IDL.Nat64,
          IDL.Text,
          IDL.Nat,
          IDL.Opt(EvmOrderInput),
          IDL.Opt(IDL.Nat64),
          IDL.Opt(IDL.Nat64),
        ],
        [Result],
        ['query'],
      ),
    'transfer_canister_funds' : IDL.Func(
        [IDL.Principal, IDL.Principal, IDL.Nat],
        [Result],
        [],
      ),
    'transfer_evm_funds' : IDL.Func(
        [IDL.Nat64, IDL.Text, IDL.Nat, IDL.Opt(IDL.Text), IDL.Opt(IDL.Nat64)],
        [Result],
        [],
      ),
    'transform_revolut_consent_response' : IDL.Func(
        [TransformArgs],
        [HttpResponse],
        ['query'],
      ),
    'transform_revolut_payment_response' : IDL.Func(
        [TransformArgs],
        [HttpResponse],
        ['query'],
      ),
    'unprocess_order' : IDL.Func([IDL.Nat64], [Result], []),
    'update_password' : IDL.Func(
        [LoginAddress, IDL.Opt(IDL.Text)],
        [Result],
        [],
      ),
    'verify_order_is_payable' : IDL.Func(
        [IDL.Nat64, IDL.Text],
        [Result],
        ['query'],
      ),
    'verify_transaction' : IDL.Func(
        [IDL.Nat64, IDL.Opt(IDL.Text), IDL.Text],
        [Result],
        [],
      ),
    'view_canister_balances' : IDL.Func([], [Result_15], ['query']),
    'withdraw_evm_fees' : IDL.Func(
        [IDL.Nat64, IDL.Nat, IDL.Opt(IDL.Text)],
        [Result],
        [],
      ),
  });
};
export const init = ({ IDL }) => {
  const EcdsaCurve = IDL.Variant({ 'secp256k1' : IDL.Null });
  const EcdsaKeyId = IDL.Record({ 'name' : IDL.Text, 'curve' : EcdsaCurve });
  const RevolutConfig = IDL.Record({
    'kid' : IDL.Text,
    'tan' : IDL.Text,
    'api_url' : IDL.Text,
    'proxy_url' : IDL.Text,
    'client_id' : IDL.Text,
    'private_key_der' : IDL.Vec(IDL.Nat8),
  });
  const L2MainnetService = IDL.Variant({
    'Alchemy' : IDL.Null,
    'BlockPi' : IDL.Null,
    'PublicNode' : IDL.Null,
    'Ankr' : IDL.Null,
  });
  const HttpHeader_1 = IDL.Record({ 'value' : IDL.Text, 'name' : IDL.Text });
  const RpcApi = IDL.Record({
    'url' : IDL.Text,
    'headers' : IDL.Opt(IDL.Vec(HttpHeader_1)),
  });
  const EthMainnetService = IDL.Variant({
    'Alchemy' : IDL.Null,
    'BlockPi' : IDL.Null,
    'Cloudflare' : IDL.Null,
    'PublicNode' : IDL.Null,
    'Ankr' : IDL.Null,
  });
  const RpcServices = IDL.Variant({
    'EthSepolia' : IDL.Opt(IDL.Vec(L2MainnetService)),
    'BaseMainnet' : IDL.Opt(IDL.Vec(L2MainnetService)),
    'Custom' : IDL.Record({
      'chainId' : IDL.Nat64,
      'services' : IDL.Vec(RpcApi),
    }),
    'OptimismMainnet' : IDL.Opt(IDL.Vec(L2MainnetService)),
    'ArbitrumOne' : IDL.Opt(IDL.Vec(L2MainnetService)),
    'EthMainnet' : IDL.Opt(IDL.Vec(EthMainnetService)),
  });
  const ChainConfig = IDL.Record({
    'currency_symbol' : IDL.Text,
    'chain_id' : IDL.Nat64,
    'vault_manager_address' : IDL.Text,
    'services' : RpcServices,
  });
  const PaypalConfig = IDL.Record({
    'api_url' : IDL.Text,
    'client_id' : IDL.Text,
    'client_secret' : IDL.Text,
  });
  const UpdateArg = IDL.Record({
    'ecdsa_key_id' : IDL.Opt(EcdsaKeyId),
    'revolut' : IDL.Opt(RevolutConfig),
    'proxy_url' : IDL.Opt(IDL.Text),
    'chains' : IDL.Opt(IDL.Vec(ChainConfig)),
    'paypal' : IDL.Opt(PaypalConfig),
  });
  const InitArg = IDL.Record({
    'ecdsa_key_id' : EcdsaKeyId,
    'revolut' : RevolutConfig,
    'proxy_url' : IDL.Text,
    'chains' : IDL.Vec(ChainConfig),
    'paypal' : PaypalConfig,
  });
  const InstallArg = IDL.Variant({
    'Upgrade' : IDL.Opt(UpdateArg),
    'Reinstall' : InitArg,
  });
  return [InstallArg];
};
