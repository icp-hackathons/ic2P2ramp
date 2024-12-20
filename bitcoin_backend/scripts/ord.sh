#!/bin/bash
docker compose exec ord ord --regtest \
  --bitcoin-data-dir /index-data \
  --bitcoin-rpc-url http://bitcoind:18443 \
  --bitcoin-rpc-username icp \
  --bitcoin-rpc-password test \
  --index-runes "$@"