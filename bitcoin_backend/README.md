## Generate the candid methods

In the root of the project:

```sh
cargo build --release --target wasm32-unknown-unknown --package bitcoin
```

```sh
candid-extractor target/wasm32-unknown-unknown/release/bitcoin.wasm > bitcoin/bitcoin.did
```

Generate declarations in the frontend canister

```sh
dfx generate
```
