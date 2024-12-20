docker cp inscription.txt ord:/inscription.txt

# copy address output from
./scripts/ord.sh wallet --server-url http://0.0.0.0:8080 receive

docker compose exec bitcoind bitcoin-cli -regtest -rpcwallet=default sendtoaddress <address> 1

docker compose exec bitcoind bitcoin-cli -regtest -rpcwallet=default generatetoaddress 1 $(docker compose exec bitcoind bitcoin-cli -regtest -rpcwallet=default getnewaddress)

# check balance
./scripts/ord.sh wallet --server-url http://0.0.0.0:8080 balance

# unload just in case, don't know if these are needed
docker compose exec bitcoind bitcoin-cli -regtest unloadwallet "ord"
./scripts/ord.sh wallet --server-url http://0.0.0.0:8080 create
# error: JSON-RPC error: RPC error response: RpcError { code: -4, message: "Wallet file verification failed. 
# Failed to create database path '/data/.bitcoin/regtest/wallets/ord'. Database already exists.", data: None }

./scripts/ord.sh wallet --server-url http://0.0.0.0:8080 inscribe --file ./inscription.txt --fee-rate 1

# check transaction
docker compose exec bitcoind bitcoin-cli -regtest getrawtransaction <tx> true

# mine
docker compose exec bitcoind bitcoin-cli -regtest -rpcwallet=default getnewaddress
docker compose exec bitcoind bitcoin-cli -regtest -rpcwallet=default generatetoaddress 1 <output-address>

# should see the inscription
./scripts/ord.sh wallet --server-url http://0.0.0.0:8080 inscriptions
