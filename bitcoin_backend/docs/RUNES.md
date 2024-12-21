# Runes Documentation

This guide explains how to etch and mint runes in regtest mode to test local vault operations with runes.

## Requirements

1. Ensure `jq` is installed on your system. Install it if missing:

```bash
sudo apt install jq
```

2. Run `bitcoind` and `ord` clients in regtest mode:

```bash
./scripts/regtest/init.sh
```

## Mintint Runes

Runes are created (etched and minted) using the `ord` CLI. This process requires:

- A funded ord wallet.
- A valid YAML file specifying the rune details.

### Step 1: Verify Wallet Setup

Before etching or minting, confirm your wallet is properly set up and funded.

1. Fund the wallet:

```bash
./scripts/regtest/ord_funds.sh
```

2. Check wallet balances:

Your `ord` wallet should have cardinal UTXOs and an active address:

```bash
./scripts/regtest/ord_wallet.sh balance
./scripts/regtest/ord_wallet.sh addresses

```

### Step 2: Etch a Rune

Etching creates a new rune by inscribing its details onto a Bitcoin ordinal.

1. Copy the required files into the ord container:

```bash
docker cp ./docker/runes/dog-rune-logo.png ord:/dog-rune-logo.png
docker cp ./docker/runes/rune.yml ord:/rune.yml
```

2. Inscribe the rune details:

```bash
./scripts/regtest/ord_wallet.sh inscribe --file ./dog-rune-logo.png --fee-rate 1
```

3. Mine blocks to confirm the transaction:

```bash
docker compose exec bitcoind bitcoin-cli -regtest -rpcwallet=testwallet generatetoaddress 10 $(docker compose exec bitcoind bitcoin-cli -regtest -rpcwallet=testwallet getnewaddress)
```

4. Verify the rune was etched successfully:

```bash
./scripts/regtest/ord_wallet.sh runics
```

### Step 3: Mint Additional Runes

After etching, you may mint additional runes using the mint command.

1. Mint new runes:

```bash
./scripts/regtest/ord_wallet.sh mint \
  --rune "ZZZ•DOG•TO•THE•MOON" \
  --fee-rate 1
```

2. Verify rune balances:

```bash
./scripts/regtest/ord_wallet.sh addresses
```

## Notes

- **YAML Configuration**: Ensure your `rune.yml` file is correctly structured, specifying minting parameters such as divisibility, premine, cap, and supply.
- **Mining Blocks**: For immediate minting, adjust the starting block (`height.start`) in the YAML file to match or precede the current block height.

## Transferring Runes to the Canister Address
