import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type BitcoinError = { 'ParseAmountError' : string } |
  { 'InvalidInput' : string } |
  { 'ParsingError' : string } |
  { 'UnsupportedAddressType' : string } |
  { 'CryptoError' : string } |
  { 'InsufficientBalance' : InsufficientBalanceError } |
  { 'VaultError' : VaultError } |
  { 'TaprootError' : string } |
  { 'CallRejectionError' : [RejectionCode, string] } |
  { 'InternalError' : string } |
  { 'TaprootNotFinalizable' : null } |
  { 'UnsupportedRune' : string };
export type BitcoinNetwork = { 'mainnet' : null } |
  { 'regtest' : null } |
  { 'testnet' : null };
export interface InsufficientBalanceError {
  'fee' : bigint,
  'current_balance' : bigint,
  'transfer_amount' : bigint,
}
export type RejectionCode = { 'NoError' : null } |
  { 'CanisterError' : null } |
  { 'SysTransient' : null } |
  { 'DestinationInvalid' : null } |
  { 'Unknown' : null } |
  { 'SysFatal' : null } |
  { 'CanisterReject' : null };
export type Result = { 'Ok' : null } |
  { 'Err' : BitcoinError };
export type Result_1 = { 'Ok' : string } |
  { 'Err' : BitcoinError };
export type Result_2 = { 'Ok' : bigint } |
  { 'Err' : BitcoinError };
export type Result_3 = { 'Ok' : [RuneMetadata, string] } |
  { 'Err' : BitcoinError };
export interface RuneMetadata {
  'cap' : bigint,
  'premine' : bigint,
  'divisibility' : number,
  'symbol' : string,
}
export interface Runes { 'decimals' : number, 'symbol' : string }
export interface SendRequest {
  'destination_address' : string,
  'amount_in_satoshi' : bigint,
}
export type VaultError = { 'InsufficientBalance' : null } |
  { 'InsufficientLockedBalance' : null } |
  { 'AddressVaultNotFound' : null };
export interface _SERVICE {
  'cancel_deposit' : ActorMethod<[string, bigint], Result>,
  'complete_order_and_send' : ActorMethod<
    [string, bigint, [] | [Runes], boolean],
    Result_1
  >,
  'deposit_to_address_vault' : ActorMethod<
    [string, bigint, [] | [Runes]],
    Result
  >,
  'get_balance' : ActorMethod<[string], Result_2>,
  'get_offramper_deposits' : ActorMethod<[string], Result_2>,
  'get_onramper_deposits' : ActorMethod<[string], Result_2>,
  'get_p2pkh_address' : ActorMethod<[], Result_1>,
  'get_p2tr_raw_key_spend_address' : ActorMethod<[], Result_1>,
  'get_p2tr_script_spend_address' : ActorMethod<[], Result_1>,
  'get_serialized_rune_metadata' : ActorMethod<[string], Result_3>,
  'lock_funds' : ActorMethod<[string, string, bigint], Result>,
  'register_runes' : ActorMethod<[Array<RuneMetadata>], Result>,
  'send_from_p2pkh' : ActorMethod<[SendRequest], Result_1>,
  'send_ordinals_inscription' : ActorMethod<
    [string, string, [] | [string], string, bigint],
    Result_1
  >,
  'unlock_funds' : ActorMethod<[string, string, bigint, [] | [Runes]], Result>,
  'validate_rune_metadata' : ActorMethod<[string], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
