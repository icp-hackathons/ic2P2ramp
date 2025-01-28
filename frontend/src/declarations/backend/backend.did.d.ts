import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type AddressType = { 'EVM' : null } |
  { 'ICP' : null } |
  { 'Solana' : null } |
  { 'Bitcoin' : null };
export interface AuthenticationData {
  'signature' : [] | [string],
  'password' : [] | [string],
}
export type Blockchain = { 'EVM' : { 'chain_id' : bigint } } |
  { 'ICP' : { 'ledger_principal' : Principal } } |
  { 'Solana' : null } |
  { 'Bitcoin' : null };
export type BlockchainError = { 'InvalidAddress' : null } |
  { 'TransactionTimeout' : null } |
  { 'ReplacementUnderpriced' : null } |
  { 'UnsupportedBlockchain' : null } |
  { 'LedgerPrincipalNotSupported' : string } |
  { 'EvmExecutionReverted' : [bigint, string] } |
  { 'EvmLogError' : string } |
  { 'EthersAbiError' : string } |
  { 'ChainIdNotFound' : bigint } |
  { 'FundsTooLow' : null } |
  { 'GasLogError' : string } |
  { 'NonceTooLow' : null } |
  { 'NonceLockTimeout' : bigint } |
  { 'FundsBelowFees' : null } |
  { 'UnregisteredEvmToken' : null } |
  { 'EmptyTransactionHash' : null } |
  { 'NonceTooHigh' : null } |
  { 'GasEstimationFailed' : null } |
  { 'VaultManagerAddressNotFound' : bigint } |
  { 'InsufficientFunds' : null } |
  { 'InconsistentStatus' : null } |
  { 'RpcProviderNotFound' : null };
export interface ChainConfig {
  'currency_symbol' : string,
  'chain_id' : bigint,
  'vault_manager_address' : string,
  'services' : RpcServices,
}
export interface ChainGasTracking {
  'uncommit_gas' : GasUsage,
  'release_token_gas' : GasUsage,
  'cancel_token_gas' : GasUsage,
  'cancel_native_gas' : GasUsage,
  'release_native_gas' : GasUsage,
  'commit_gas' : GasUsage,
}
export interface CompletedOrder {
  'offramper_fee' : bigint,
  'onramper' : TransactionAddress,
  'offramper' : TransactionAddress,
  'blockchain' : Blockchain,
  'price' : bigint,
  'completed_at' : bigint,
}
export interface Crypto {
  'fee' : bigint,
  'token' : [] | [string],
  'blockchain' : Blockchain,
  'amount' : bigint,
}
export type EcdsaCurve = { 'secp256k1' : null };
export interface EcdsaKeyId { 'name' : string, 'curve' : EcdsaCurve }
export type EthMainnetService = { 'Alchemy' : null } |
  { 'BlockPi' : null } |
  { 'Cloudflare' : null } |
  { 'PublicNode' : null } |
  { 'Ankr' : null };
export interface EvmOrderInput {
  'estimated_gas_withdraw' : bigint,
  'estimated_gas_lock' : bigint,
  'tx_hash' : string,
}
export interface EvmTransactionLog {
  'status' : TransactionStatus,
  'action' : TransactionAction,
  'order_id' : bigint,
}
export interface ExchangeRateCache { 'rate' : number, 'timestamp' : bigint }
export type ExchangeRateError = { 'AnonymousPrincipalNotAllowed' : null } |
  { 'CryptoQuoteAssetNotFound' : null } |
  { 'FailedToAcceptCycles' : null } |
  { 'ForexBaseAssetNotFound' : null } |
  { 'CryptoBaseAssetNotFound' : null } |
  { 'StablecoinRateTooFewRates' : null } |
  { 'ForexAssetsNotFound' : null } |
  { 'InconsistentRatesReceived' : null } |
  { 'RateLimited' : null } |
  { 'StablecoinRateZeroRate' : null } |
  { 'Other' : { 'code' : number, 'description' : string } } |
  { 'ForexInvalidTimestamp' : null } |
  { 'NotEnoughCycles' : null } |
  { 'ForexQuoteAssetNotFound' : null } |
  { 'StablecoinRateNotFound' : null } |
  { 'Pending' : null };
export interface GasRecord {
  'gas' : bigint,
  'block_number' : bigint,
  'gas_price' : bigint,
}
export interface GasUsage { 'records' : Array<GasRecord> }
export interface HttpHeader { 'value' : string, 'name' : string }
export interface HttpHeader_1 { 'value' : string, 'name' : string }
export interface HttpResponse {
  'status' : bigint,
  'body' : Uint8Array | number[],
  'headers' : Array<HttpHeader>,
}
export interface IcpToken {
  'fee' : bigint,
  'decimals' : number,
  'symbol' : string,
}
export interface InitArg {
  'ecdsa_key_id' : EcdsaKeyId,
  'revolut' : RevolutConfig,
  'proxy_url' : string,
  'chains' : Array<ChainConfig>,
  'paypal' : PaypalConfig,
}
export type InstallArg = { 'Upgrade' : [] | [UpdateArg] } |
  { 'Reinstall' : InitArg };
export type L2MainnetService = { 'Alchemy' : null } |
  { 'BlockPi' : null } |
  { 'PublicNode' : null } |
  { 'Ankr' : null };
export interface LockedOrder {
  'locked_at' : bigint,
  'payment_done' : boolean,
  'offramper_fee' : bigint,
  'base' : Order,
  'uncommited' : boolean,
  'onramper' : Onramper,
  'price' : bigint,
  'payment_id' : [] | [string],
  'revolut_consent' : [] | [RevolutConsent],
}
export interface LogEntry {
  'transactionHash' : [] | [string],
  'blockNumber' : [] | [bigint],
  'data' : string,
  'blockHash' : [] | [string],
  'transactionIndex' : [] | [bigint],
  'topics' : Array<string>,
  'address' : string,
  'logIndex' : [] | [bigint],
  'removed' : boolean,
}
export type LoginAddress = { 'EVM' : { 'address' : string } } |
  { 'ICP' : { 'principal_id' : string } } |
  { 'Email' : { 'email' : string } } |
  { 'Solana' : { 'address' : string } };
export interface Onramper {
  'provider' : PaymentProvider,
  'user_id' : bigint,
  'address' : TransactionAddress,
}
export interface Order {
  'id' : bigint,
  'created_at' : bigint,
  'offramper_user_id' : bigint,
  'crypto' : Crypto,
  'currency' : string,
  'offramper_providers' : Array<[PaymentProviderType, PaymentProvider]>,
  'offramper_address' : TransactionAddress,
  'processing' : boolean,
}
export type OrderError = { 'OrderProcessing' : null } |
  { 'OrderInLockTime' : null } |
  { 'PaymentVerificationFailed' : null } |
  { 'InvalidOnramperProvider' : null } |
  { 'OrderTimerNotFound' : null } |
  { 'OrderNotProcessing' : null } |
  { 'MissingDebtorAccount' : null } |
  { 'OrderNotFound' : null } |
  { 'InvalidOfframperProvider' : null } |
  { 'MissingAccessToken' : null } |
  { 'OrderUncommitted' : null } |
  { 'PaymentDone' : null } |
  { 'InvalidOrderState' : string };
export type OrderFilter = { 'ByOfframperId' : bigint } |
  { 'ByOfframperAddress' : TransactionAddress } |
  { 'ByState' : OrderStateFilter } |
  { 'ByBlockchain' : Blockchain } |
  { 'ByOnramperId' : bigint } |
  { 'LockedByOnramper' : TransactionAddress };
export type OrderState = { 'Locked' : LockedOrder } |
  { 'Cancelled' : bigint } |
  { 'Created' : Order } |
  { 'Completed' : CompletedOrder };
export type OrderStateFilter = { 'Locked' : null } |
  { 'Cancelled' : null } |
  { 'Created' : null } |
  { 'Completed' : null };
export type PaymentProvider = { 'PayPal' : { 'id' : string } } |
  { 'Revolut' : { 'id' : string, 'scheme' : string, 'name' : [] | [string] } };
export type PaymentProviderType = { 'PayPal' : null } |
  { 'Revolut' : null };
export interface PaypalConfig {
  'api_url' : string,
  'client_id' : string,
  'client_secret' : string,
}
export type RampError = { 'SystemError' : SystemError } |
  { 'OrderError' : OrderError } |
  { 'UserError' : UserError } |
  { 'BlockchainError' : BlockchainError };
export type RejectionCode = { 'NoError' : null } |
  { 'CanisterError' : null } |
  { 'SysTransient' : null } |
  { 'DestinationInvalid' : null } |
  { 'Unknown' : null } |
  { 'SysFatal' : null } |
  { 'CanisterReject' : null };
export type Result = { 'Ok' : null } |
  { 'Err' : RampError };
export type Result_1 = { 'Ok' : User } |
  { 'Err' : RampError };
export type Result_10 = { 'Ok' : OrderState } |
  { 'Err' : RampError };
export type Result_11 = { 'Ok' : [] | [EvmTransactionLog] } |
  { 'Err' : RampError };
export type Result_12 = { 'Ok' : [] | [bigint] } |
  { 'Err' : RampError };
export type Result_13 = { 'Ok' : [bigint, bigint] } |
  { 'Err' : RampError };
export type Result_14 = { 'Ok' : ChainGasTracking } |
  { 'Err' : RampError };
export type Result_15 = { 'Ok' : Array<[string, number]> } |
  { 'Err' : RampError };
export type Result_2 = { 'Ok' : bigint } |
  { 'Err' : RampError };
export type Result_3 = { 'Ok' : [bigint, bigint] } |
  { 'Err' : RampError };
export type Result_4 = { 'Ok' : bigint } |
  { 'Err' : RampError };
export type Result_5 = { 'Ok' : string } |
  { 'Err' : RampError };
export type Result_6 = { 'Ok' : [] | [[bigint, bigint]] } |
  { 'Err' : RampError };
export type Result_7 = { 'Ok' : Array<Token> } |
  { 'Err' : RampError };
export type Result_8 = { 'Ok' : number } |
  { 'Err' : RampError };
export type Result_9 = { 'Ok' : IcpToken } |
  { 'Err' : RampError };
export interface RevolutConfig {
  'kid' : string,
  'tan' : string,
  'api_url' : string,
  'proxy_url' : string,
  'client_id' : string,
  'private_key_der' : Uint8Array | number[],
}
export interface RevolutConsent { 'id' : string, 'url' : string }
export interface RpcApi {
  'url' : string,
  'headers' : [] | [Array<HttpHeader_1>],
}
export type RpcServices = { 'EthSepolia' : [] | [Array<L2MainnetService>] } |
  { 'BaseMainnet' : [] | [Array<L2MainnetService>] } |
  { 'Custom' : { 'chainId' : bigint, 'services' : Array<RpcApi> } } |
  { 'OptimismMainnet' : [] | [Array<L2MainnetService>] } |
  { 'ArbitrumOne' : [] | [Array<L2MainnetService>] } |
  { 'EthMainnet' : [] | [Array<EthMainnetService>] };
export interface Session { 'token' : string, 'expires_at' : bigint }
export interface SignRequestCandid {
  'to' : [] | [string],
  'gas' : bigint,
  'value' : [] | [bigint],
  'max_priority_fee_per_gas' : [] | [bigint],
  'data' : [] | [Uint8Array | number[]],
  'from' : [] | [string],
  'max_fee_per_gas' : [] | [bigint],
  'chain_id' : bigint,
  'nonce' : [] | [bigint],
}
export type SystemError = { 'HttpRequestError' : [bigint, string] } |
  { 'RpcError' : string } |
  { 'InvalidInput' : string } |
  { 'ICRejectionError' : [RejectionCode, string] } |
  { 'ExchangeRateError' : ExchangeRateError } |
  { 'ParseFloatError' : string } |
  { 'Pkcs8Error' : string } |
  { 'ParseError' : string } |
  { 'CurrencySymbolNotFound' : {} } |
  { 'RsaError' : string } |
  { 'CanisterCallError' : string } |
  { 'InternalError' : string } |
  { 'Utf8Error' : null };
export interface Token {
  'decimals' : number,
  'address' : string,
  'rate_symbol' : string,
}
export type TransactionAction = { 'Release' : TransactionVariant } |
  { 'Uncommit' : null } |
  { 'Transfer' : TransactionVariant } |
  { 'Cancel' : TransactionVariant } |
  { 'Commit' : null };
export interface TransactionAddress {
  'address_type' : AddressType,
  'address' : string,
}
export interface TransactionReceipt {
  'to' : string,
  'status' : bigint,
  'transactionHash' : string,
  'blockNumber' : bigint,
  'from' : string,
  'logs' : Array<LogEntry>,
  'blockHash' : string,
  'type' : string,
  'transactionIndex' : bigint,
  'effectiveGasPrice' : bigint,
  'logsBloom' : string,
  'contractAddress' : [] | [string],
  'gasUsed' : bigint,
}
export type TransactionStatus = { 'BroadcastError' : RampError } |
  { 'Failed' : string } |
  { 'Broadcasting' : null } |
  { 'Confirmed' : TransactionReceipt } |
  { 'Unresolved' : [string, SignRequestCandid] } |
  { 'Broadcasted' : [string, SignRequestCandid] } |
  { 'Pending' : null };
export type TransactionVariant = { 'Native' : null } |
  { 'Token' : null };
export interface TransformArgs {
  'context' : Uint8Array | number[],
  'response' : HttpResponse,
}
export interface UpdateArg {
  'ecdsa_key_id' : [] | [EcdsaKeyId],
  'revolut' : [] | [RevolutConfig],
  'proxy_url' : [] | [string],
  'chains' : [] | [Array<ChainConfig>],
  'paypal' : [] | [PaypalConfig],
}
export interface User {
  'id' : bigint,
  'user_type' : UserType,
  'fiat_amounts' : Array<[string, bigint]>,
  'payment_providers' : Array<PaymentProvider>,
  'score' : number,
  'login' : LoginAddress,
  'evm_auth_message' : [] | [string],
  'addresses' : Array<TransactionAddress>,
  'session' : [] | [Session],
  'hashed_password' : [] | [string],
}
export type UserError = { 'UserNotOfframper' : null } |
  { 'UserNotOnramper' : null } |
  { 'UserBanned' : null } |
  { 'SignatureRequired' : null } |
  { 'SessionNotFound' : null } |
  { 'ProviderNotInUser' : PaymentProviderType } |
  { 'InvalidSignature' : null } |
  { 'PasswordRequired' : null } |
  { 'TokenExpired' : null } |
  { 'Unauthorized' : null } |
  { 'TokenInvalid' : null } |
  { 'OnlyController' : null } |
  { 'UserNotFound' : null } |
  { 'UnauthorizedPrincipal' : null } |
  { 'InvalidPassword' : null };
export type UserType = { 'Offramper' : null } |
  { 'Onramper' : null };
export interface _SERVICE {
  'add_user_payment_provider' : ActorMethod<
    [bigint, string, PaymentProvider],
    Result
  >,
  'add_user_transaction_address' : ActorMethod<
    [bigint, string, TransactionAddress],
    Result
  >,
  'authenticate_user' : ActorMethod<
    [LoginAddress, [] | [AuthenticationData]],
    Result_1
  >,
  'calculate_order_evm_fees' : ActorMethod<
    [bigint, bigint, [] | [string], bigint, bigint],
    Result_2
  >,
  'calculate_order_price' : ActorMethod<[string, Crypto], Result_3>,
  'cancel_order' : ActorMethod<[bigint, string], Result>,
  'clean_old_spent_txs' : ActorMethod<[], undefined>,
  'create_evm_order_with_tx' : ActorMethod<
    [
      bigint,
      string,
      bigint,
      string,
      Array<[PaymentProviderType, PaymentProvider]>,
      string,
      bigint,
      [] | [string],
    ],
    Result_4
  >,
  'create_order' : ActorMethod<
    [
      string,
      string,
      Array<[PaymentProviderType, PaymentProvider]>,
      Blockchain,
      [] | [string],
      bigint,
      TransactionAddress,
      bigint,
      [] | [EvmOrderInput],
    ],
    Result_4
  >,
  'execute_revolut_payment' : ActorMethod<[bigint, string], Result_5>,
  'freeze_order' : ActorMethod<[bigint, bigint, string], Result>,
  'generate_evm_auth_message' : ActorMethod<[LoginAddress], Result_5>,
  'get_average_gas_prices' : ActorMethod<
    [bigint, bigint, TransactionAction],
    Result_6
  >,
  'get_evm_address' : ActorMethod<[], string>,
  'get_evm_tokens' : ActorMethod<[bigint], Result_7>,
  'get_exchange_rate' : ActorMethod<[string, string], Result_8>,
  'get_icp_token_info' : ActorMethod<[Principal], Result_9>,
  'get_offramper_fee' : ActorMethod<[bigint], bigint>,
  'get_order' : ActorMethod<[bigint], Result_10>,
  'get_order_tx_log' : ActorMethod<
    [bigint, [] | [[bigint, string]]],
    Result_11
  >,
  'get_orders' : ActorMethod<
    [[] | [OrderFilter], [] | [number], [] | [number]],
    Array<OrderState>
  >,
  'get_pending_txs' : ActorMethod<[], Array<EvmTransactionLog>>,
  'get_user' : ActorMethod<[bigint], Result_1>,
  'lock_order' : ActorMethod<
    [bigint, string, bigint, PaymentProvider, TransactionAddress],
    Result
  >,
  'print_constants' : ActorMethod<[], string>,
  'refetch_user' : ActorMethod<[bigint, string], Result_1>,
  'register_evm_tokens' : ActorMethod<
    [bigint, Array<[string, number, string]>],
    Result
  >,
  'register_icp_tokens' : ActorMethod<[Array<string>], Result>,
  'register_user' : ActorMethod<
    [UserType, Array<PaymentProvider>, LoginAddress, [] | [string]],
    Result_1
  >,
  'remove_user' : ActorMethod<[bigint], Result_1>,
  'remove_user_payment_provider' : ActorMethod<
    [bigint, string, PaymentProvider],
    Result
  >,
  'resolve_tx_status' : ActorMethod<[bigint, string, bigint], undefined>,
  'retry_order_completion' : ActorMethod<[bigint], Result>,
  'retry_order_unlock' : ActorMethod<[bigint], Result>,
  'test_estimate_gas_commit' : ActorMethod<
    [bigint, string, [] | [string], bigint],
    Result_12
  >,
  'test_get_consent_url' : ActorMethod<[], Result_5>,
  'test_get_fee_estimates' : ActorMethod<[bigint], Result_13>,
  'test_get_gas_tracking' : ActorMethod<[bigint], Result_14>,
  'test_get_latest_block' : ActorMethod<[bigint], Result_2>,
  'test_get_latest_nonce' : ActorMethod<[bigint], Result_2>,
  'test_get_rates' : ActorMethod<
    [],
    Array<[[string, string], ExchangeRateCache]>
  >,
  'test_get_revolut_payment_details' : ActorMethod<[string], Result>,
  'test_get_revolut_payment_token' : ActorMethod<[string], Result_5>,
  'test_paypal' : ActorMethod<[], Result_5>,
  'top_up_order' : ActorMethod<
    [
      bigint,
      bigint,
      string,
      bigint,
      [] | [EvmOrderInput],
      [] | [bigint],
      [] | [bigint],
    ],
    Result
  >,
  'transfer_canister_funds' : ActorMethod<
    [Principal, Principal, bigint],
    Result
  >,
  'transfer_evm_funds' : ActorMethod<
    [bigint, string, bigint, [] | [string], [] | [bigint]],
    Result
  >,
  'transform_revolut_consent_response' : ActorMethod<
    [TransformArgs],
    HttpResponse
  >,
  'transform_revolut_payment_response' : ActorMethod<
    [TransformArgs],
    HttpResponse
  >,
  'unprocess_order' : ActorMethod<[bigint], Result>,
  'update_password' : ActorMethod<[LoginAddress, [] | [string]], Result>,
  'verify_order_is_payable' : ActorMethod<[bigint, string], Result>,
  'verify_transaction' : ActorMethod<[bigint, [] | [string], string], Result>,
  'view_canister_balances' : ActorMethod<[], Result_15>,
  'withdraw_evm_fees' : ActorMethod<[bigint, bigint, [] | [string]], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
