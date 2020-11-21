# Celo USD Management Scripts
Collection of bash scripts to help automate the management of cUSD rewards from staking operation

## Requirements
1. `celocli` installed locally, with a secure connection (eg SSH tunnel) to a trusted full node
  `ssh -L 8545:localhost:8545 celo-manager`
  `celocli node:synced` should return 'true'

# General Flow
1. sweep_cusd.sh
  Checks balance of cUSD on validator and group accounts, sweeps them to the Ledger

2. cold_to_hot.sh
  Moves cUSD (net of reserve) to hot wallet for automated exchange w/ stability protocol.

3. hot_exchange.sh
  Trades cUSD for CELO by interacting w/ the on-chain stability protocol.  This should run in a (detached) screen.
  Note that the hot wallet needs to be unlocked on the full node this runs on.
  `personal.unlockAccount("0xE6DDd7bb03E5e8338Be22f33ee47849fB2BF66A2", "$password", 86400)`
  This will take some time to run, as exchanging too much too fast will result in considerable slippage.

4. hot_to_cold.sh
  Moves CELO from the hot account back to the Ledger
 