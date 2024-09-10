import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { Principal } from '@dfinity/principal';

import { backend } from '../../declarations/backend';
import { PaymentProvider, PaymentProviderType, Blockchain } from '../../declarations/backend/backend.did';
import { TokenOption, getIcpTokenOptions, getEvmTokenOptions, defaultCommitEvmGas, defaultReleaseEvmGas } from '../../constants/tokens';
import { tokenCanisters } from '../../constants/addresses';
import { NetworkIds } from '../../constants/networks';
import { useUser } from '../user/UserContext';
import { rampErrorToString } from '../../model/error';
import { blockchainToBlockchainType, providerToProviderType } from '../../model/utils';
import { fetchIcpTransactionFee, transferICPTokensToCanister } from '../../model/icp';
import { depositInVault, estimateGasAndGasPrice } from '../../model/evm';
import { BlockchainTypes } from '../../model/types';
import { isSessionExpired } from '../../model/session';

const CreateOrder: React.FC = () => {
    const [fiatAmount, setFiatAmount] = useState<number>();
    const [currency, setCurrency] = useState<string>("USD");
    const [cryptoAmount, setCryptoAmount] = useState(0);
    const [tokenOptions, setTokenOptions] = useState<TokenOption[]>([]);
    const [selectedToken, setSelectedToken] = useState<TokenOption | null>(null);
    const [selectedBlockchain, setSelectedBlockchain] = useState<Blockchain>();
    const [blockchainType, setBlockchainType] = useState<BlockchainTypes>();
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingRate, setLoadingRate] = useState(false);
    const [exchangeRate, setExchangeRate] = useState<number | null>(null);
    const [selectedProviders, setSelectedProviders] = useState<PaymentProvider[]>([]);

    const { chain, chainId, address } = useAccount();
    const { user, sessionToken, icpAgent, principal, fetchIcpBalance, logout } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) navigate('/');
    }, [user, navigate]);

    if (!user) {
        navigate('/');
        return;
    }

    if (isSessionExpired(user)) {
        logout();
        navigate("/");
        return;
    }

    useEffect(() => {
        if (blockchainType) {
            let tokens: TokenOption[] = [];

            if (blockchainType === 'EVM') {
                if (!chainId || !isValidChainId(chainId)) return;
                tokens = getEvmTokenOptions(chainId);
            } else if (blockchainType === 'ICP') {
                if (!icpAgent) return;
                tokens = getIcpTokenOptions();
            }

            setTokenOptions(tokens);
        }
    }, [blockchainType, chainId]);

    const handleBlockchainChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedToken(null);
        const value = e.target.value;
        setBlockchainType(value as BlockchainTypes);
        if (value === "EVM") {
            if (!chainId) return;
            setSelectedBlockchain({ EVM: { chain_id: BigInt(chainId) } });
        } else if (value === "ICP") {
            setSelectedBlockchain({ ICP: { ledger_principal: Principal.fromText(tokenCanisters.ICP) } });
        } else if (value === "Solana") {
            setSelectedBlockchain({ Solana: null });
        }

        setSelectedToken(null);
    };

    const handleTokenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = tokenOptions.find(token => token.address === e.target.value);
        setSelectedToken(selected || null);

        if (selected && selectedBlockchain && blockchainToBlockchainType(selectedBlockchain) === 'ICP') {
            setSelectedBlockchain({ ICP: { ledger_principal: Principal.fromText(selected.address!) } })
        }
    };

    const getExchangeRateFromXRC = async (token: string) => {
        if (token === "") return;
        setLoadingRate(true);
        try {
            const result = await backend.get_exchange_rate(currency, token);
            console.log("[exchangeRate] result = ", result);
            if ('Ok' in result) {
                const rate = parseFloat(result.Ok);
                setExchangeRate(rate);
            } else {
                const errorMessage = rampErrorToString(result.Err);
                console.error(errorMessage);
                setExchangeRate(null);
            }
        } catch (error) {
            console.error(error);
            setExchangeRate(null);
        } finally {
            setLoadingRate(false);
        }
    };

    useEffect(() => {
        if (selectedToken) {
            let symbol = selectedToken.rateSymbol;
            if (symbol.includes("USD")) {
                setExchangeRate(1);
                return;
            }
            getExchangeRateFromXRC(symbol);
        }
    }, [selectedToken]);

    useEffect(() => {
        if (exchangeRate !== null) {
            setFiatAmount(cryptoAmount * exchangeRate);
        }
    }, [cryptoAmount, exchangeRate]);

    const handleProviderSelection = (provider: PaymentProvider) => {
        if (selectedProviders.length === 0) {
            setSelectedProviders([provider]);
            return
        }
        setSelectedProviders((prevSelected) => {
            if (prevSelected.includes(provider)) {
                return prevSelected.filter((p) => p !== provider);
            } else {
                return [...prevSelected, provider];
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            setMessage('User Not Found');
            return;
        }
        if (!sessionToken) throw new Error("Please authenticate to get a token session")

        if (!chainId) throw new Error('Chain id is not available')
        if (!selectedBlockchain) throw new Error('No blockchain selected');
        if (!selectedToken) throw new Error('No token selected');

        try {
            setIsLoading(true);
            setMessage('Creating offramping order...');

            const providerTuples: [PaymentProviderType, PaymentProvider][] = selectedProviders.map((provider) => {
                const providerType: PaymentProviderType = providerToProviderType(provider);
                return [providerType, provider];
            });

            const selectedAddress = user.addresses.find(addr => Object.keys(selectedBlockchain)[0] in addr.address_type);
            if (!selectedAddress) {
                setMessage('No address available for the selected blockchain');
                return;
            }

            let cryptoAmountUnits: bigint;
            let gasEstimateLock: [bigint] | [] = [];
            let gasEstimateRelease: [bigint] | [] = [];
            const blockchain = blockchainToBlockchainType(selectedBlockchain);
            if (blockchain === 'EVM') {
                cryptoAmountUnits = ethers.parseEther(cryptoAmount.toString());
                try {
                    const receipt = await depositInVault(chainId, selectedToken, cryptoAmountUnits);
                    console.log('Transaction receipt: ', receipt);

                    const gasForCommit = await estimateGasAndGasPrice(chainId, { Commit: null }, defaultCommitEvmGas);
                    console.log("[createOrder] gasCommitEstimate = ", gasForCommit);
                    gasEstimateLock = [gasForCommit[0]];

                    const gasForRelease = await estimateGasAndGasPrice(
                        chainId,
                        selectedToken.isNative ? { ReleaseNative: null } : { ReleaseToken: null },
                        defaultReleaseEvmGas
                    );
                    console.log("[createOrder] gasReleaseEstimate = ", gasForRelease);
                    gasEstimateRelease = [gasForRelease[0]];

                    setMessage('Transaction successful!');
                } catch (e: any) {
                    setMessage(`Transaction failed: ${e.message || e}`);
                    return;
                }
            } else if (blockchain === 'ICP') {
                // todo: get decimals dynamically
                cryptoAmountUnits = BigInt(cryptoAmount * 100_000_000);
                try {
                    const ledgerCanister = Principal.fromText(selectedToken.address);
                    const fees = await fetchIcpTransactionFee(ledgerCanister);
                    console.log("fees = ", fees);

                    const result = await transferICPTokensToCanister(icpAgent!, ledgerCanister, cryptoAmountUnits, fees);
                    console.log('Transaction result:', result);
                    setMessage('Transaction successful!');
                    fetchIcpBalance();
                } catch (e: any) {
                    setMessage(`Transaction failed: ${e.message || e}`);
                    return;
                }
            } else {
                throw new Error('Unsupported blockchain selected');
            }

            const result = await backend.create_order(
                sessionToken,
                BigInt(Math.ceil(fiatAmount! * 100)),
                currency,
                providerTuples,
                selectedBlockchain,
                selectedToken.isNative ? [] : [selectedToken.address],
                cryptoAmountUnits,
                selectedAddress,
                user.id,
                gasEstimateLock,
                gasEstimateRelease,
            );

            if ('Ok' in result) {
                setMessage(`Order with ID=${result.Ok} created!`);
                navigate("/view");
            } else {
                const errorMessage = rampErrorToString(result.Err);
                setMessage(errorMessage);
            }
        } catch (error) {
            setMessage(`Error creating offramp order, error = ${error}`);
        } finally {
            setIsLoading(false);
        }
    };

    const isValidChainId = (chainId: number | undefined): boolean => {
        if (!chainId) return false;

        const validChainIds = Object.values(NetworkIds).map((network) => network.id);
        return validChainIds.includes(chainId);
    };

    const isValidAddressMessage = () => {
        if (blockchainType === 'EVM') {
            if (!chainId || !address) return (
                <div className="my-2 text-red-400">
                    Please connect your Wallet.
                </div>
            );
            return address && user?.addresses.some(
                addr => 'EVM' in addr.address_type && addr.address !== address) &&
                <div className="my-2 text-red-400">
                    Wallet address is not registered in your profile.
                </div>
        } else if (blockchainType === 'ICP') {
            if (!icpAgent || !principal) return (
                <div className="my-2 text-red-400">
                    Please connect your Internet Identity.
                </div>
            );
            return principal && user?.addresses.some(
                addr => 'ICP' in addr.address_type && addr.address !== principal?.toString()) &&
                <div className="my-2 text-red-400">
                    Principal connected is not registered in your profile.
                </div>
        }
    }

    const validInputs = user !== null && selectedBlockchain !== undefined && fiatAmount !== undefined && fiatAmount > 0
        && (isValidAddressMessage() === undefined || isValidAddressMessage() === false)
        && selectedProviders.length > 0 && selectedToken !== null;

    return (
        <div className="bg-gray-700 rounded-xl p-8 max-w-md mx-auto shadow-lg">
            <div className="text-center mb-8">
                <h2 className="text-white text-2xl font-semibold">Create Offramping Order</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                    <label className="block text-white w-24">Fiat:</label>
                    <div className="flex-grow flex items-center">
                        <input
                            type="number"
                            value={fiatAmount?.toFixed(2)}
                            className="py-2 px-3 w-36 border bg-gray-600 border-gray-500 rounded-l-lg text-white"
                            required
                            disabled
                        />
                        <span className="py-2 px-3 bg-gray-600 border border-gray-500 rounded-r-lg text-white">$</span>
                    </div>
                </div>
                <div className="flex justify-between items-center mb-4">
                    <label className="text-white w-24">Crypto:</label>
                    <input
                        type="number"
                        value={cryptoAmount}
                        onChange={(e) => setCryptoAmount(Number(e.target.value))}
                        className="flex-grow py-2 px-3 border border-gray-500 bg-gray-600 outline-none rounded-md focus:ring focus:border-blue-900 text-white"
                        required
                    />
                </div>
                <div className="flex justify-between items-center mb-4">
                    <label className="text-white w-24">Blockchain:</label>
                    <select
                        value={blockchainType}
                        onChange={handleBlockchainChange}
                        className="flex-grow py-2 px-3 border border-gray-500 bg-gray-600 outline-none rounded-md focus:ring focus:border-blue-900 text-white"
                        required
                    >
                        <option selected>Select Blockchain</option>
                        {user?.addresses.some(addr => 'EVM' in addr.address_type) && <option value="EVM">EVM</option>}
                        {user?.addresses.some(addr => 'ICP' in addr.address_type) && <option value="ICP">ICP</option>}
                        {user?.addresses.some(addr => 'Solana' in addr.address_type) && <option value="Solana">Solana</option>}
                    </select>
                </div>
                <div className="flex justify-between items-center mb-4">
                    <label className="text-white w-24">Token:</label>
                    <select
                        value={selectedToken?.address || undefined}
                        onChange={handleTokenChange}
                        className="flex-grow py-2 px-3 border border-gray-500 bg-gray-600 outline-none rounded-md focus:ring focus:border-blue-900 text-white"
                        required
                    >
                        <option value="">Select a token</option>
                        {tokenOptions.map((token) => (
                            <option key={token.address} value={token.address}>{token.name}</option>
                        ))}
                    </select>
                </div>
                {loadingRate && (
                    <div className="my-2 flex justify-center items-center space-x-2">
                        <div className="w-4 h-4 border-t-2 border-b-2 border-indigo-600 rounded-full animate-spin"></div>
                        <div className="text-sm font-medium text-white">Fetching Rates...</div>
                    </div>
                )}

                {isValidAddressMessage()}

                {chainId && selectedBlockchain && Object.keys(selectedBlockchain)[0] === "EVM" && (
                    <div className={`my-2 text-sm font-medium ${isValidChainId(chainId) ? 'text-green-600' : 'text-red-600'}`}>
                        {isValidChainId(chainId) ? `On chain: ${chain?.name}` : 'Please connect to a valid network'}
                    </div>
                )}

                <hr className="border-t border-gray-500 w-full my-4" />

                <div className="my-4 mx-auto">
                    <label className="block text-white mb-2">Payment Providers:</label>
                    {user?.payment_providers.map((provider, index) => {
                        return (
                            <div key={index} className="block mb-2">
                                <input
                                    type="checkbox"
                                    id={`provider-${index}`}
                                    className="mr-2"
                                    checked={selectedProviders!.includes(provider)}
                                    onChange={() => handleProviderSelection(provider)}
                                />
                                <label htmlFor={`provider-${index}`} className="text-white">
                                    {'PayPal' in provider &&
                                        <>
                                            <span className='font-semibold'>Paypal</span>
                                            <div>{provider.PayPal.id}</div>
                                        </>
                                    }
                                    {'Revolut' in provider &&
                                        <>
                                            <span className='font-semibold'>Revolut</span>
                                            <div>{provider.Revolut.id} (Scheme): ${provider.Revolut.scheme}</div>
                                        </>
                                    }
                                </label>
                            </div>
                        );
                    })}
                </div>

                <hr className="border-t border-gray-500 w-full my-4" />

                <button
                    type="submit"
                    className={`px-4 py-2 rounded-md ${validInputs ? 'bg-green-800 text-white hover:bg-green-900 focus:outline-none' : 'bg-gray-500 text-white cursor-not-allowed'}`}
                    disabled={!validInputs}
                >
                    Create Order
                </button>
            </form>

            {isLoading ? (
                <div className="mt-4 flex justify-center items-center space-x-2">
                    <div className="w-4 h-4 border-t-2 border-b-2 border-indigo-600 rounded-full animate-spin"></div>
                    <div className="text-sm font-medium text-gray-300">Processing...</div>
                </div>
            ) : (
                message && <p className="mt-4 text-sm font-medium text-red-600 break-all">{message}</p>
            )}
        </div>
    );
}

export default CreateOrder;
